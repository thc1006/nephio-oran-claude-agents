// Package main implements the Nephio O-RAN Claude Agents orchestrator.
// This service manages multiple AI agents for Nephio and O-RAN operations
// with optimized concurrency, memory management, and error handling.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/nephio-oran-claude-agents/internal/config"
	"github.com/nephio-oran-claude-agents/internal/server"
	"github.com/nephio-oran-claude-agents/internal/monitoring"
	"github.com/nephio-oran-claude-agents/pkg/types"

	"github.com/go-logr/logr"
	"k8s.io/klog/v2"
)

const (
	// Application constants
	appName    = "nephio-oran-orchestrator"
	appVersion = "v1.0.0"
	
	// Timeout constants optimized for performance
	gracefulShutdownTimeout = 30 * time.Second
	serverReadTimeout       = 10 * time.Second
	serverWriteTimeout      = 10 * time.Second
	
	// Memory optimization constants
	maxHeaderBytes = 1 << 20 // 1MB
)

var (
	// Command-line flags
	configFile = flag.String("config", "config/agent_config.yaml", "Path to configuration file")
	logLevel   = flag.Int("log-level", 2, "Log level (0=error, 1=warn, 2=info, 3=debug)")
	profiling  = flag.Bool("profiling", false, "Enable pprof profiling endpoints")
	metricsPort = flag.Int("metrics-port", 8080, "Port for metrics server")
)

// Application represents the main application with proper resource management
type Application struct {
	config   *config.Config
	server   *server.Server
	monitor  *monitoring.Monitor
	logger   logr.Logger
	
	// Context for graceful shutdown
	ctx    context.Context
	cancel context.CancelFunc
	
	// Channels for coordinating shutdown
	shutdownCh chan os.Signal
	doneCh     chan struct{}
}

// NewApplication creates a new application instance with optimized initialization
func NewApplication(ctx context.Context) (*Application, error) {
	// Create application context with cancellation
	appCtx, cancel := context.WithCancel(ctx)
	
	// Initialize structured logger
	klog.InitFlags(nil)
	flag.Set("v", fmt.Sprintf("%d", *logLevel))
	logger := klog.NewKlogr().WithName(appName)
	
	// Load configuration
	cfg, err := config.Load(*configFile)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}
	
	// Validate configuration
	if err := cfg.Validate(); err != nil {
		cancel()
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}
	
	// Initialize monitoring
	monitor, err := monitoring.New(monitoring.Config{
		MetricsPort: *metricsPort,
		Profiling:   *profiling,
		Logger:      logger.WithName("monitor"),
	})
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize monitoring: %w", err)
	}
	
	// Initialize server
	srv, err := server.New(server.Config{
		Port:           cfg.Server.Port,
		ReadTimeout:    serverReadTimeout,
		WriteTimeout:   serverWriteTimeout,
		MaxHeaderBytes: maxHeaderBytes,
		Logger:         logger.WithName("server"),
		Monitor:        monitor,
	})
	if err != nil {
		cancel()
		return nil, fmt.Errorf("failed to initialize server: %w", err)
	}
	
	// Create signal channel for graceful shutdown
	shutdownCh := make(chan os.Signal, 1)
	signal.Notify(shutdownCh, syscall.SIGINT, syscall.SIGTERM)
	
	return &Application{
		config:     cfg,
		server:     srv,
		monitor:    monitor,
		logger:     logger,
		ctx:        appCtx,
		cancel:     cancel,
		shutdownCh: shutdownCh,
		doneCh:     make(chan struct{}),
	}, nil
}

// Run starts the application with proper error handling and graceful shutdown
func (a *Application) Run() error {
	a.logger.Info("Starting Nephio O-RAN Claude Agents orchestrator",
		"version", appVersion,
		"config", *configFile,
		"metrics_port", *metricsPort,
	)
	
	// Start monitoring in a separate goroutine
	monitorErrCh := make(chan error, 1)
	go func() {
		if err := a.monitor.Start(a.ctx); err != nil {
			monitorErrCh <- fmt.Errorf("monitoring error: %w", err)
		}
	}()
	
	// Start server in a separate goroutine
	serverErrCh := make(chan error, 1)
	go func() {
		if err := a.server.Start(a.ctx); err != nil {
			serverErrCh <- fmt.Errorf("server error: %w", err)
		}
	}()
	
	// Log successful startup
	a.logger.Info("Application started successfully")
	
	// Wait for shutdown signal or error
	select {
	case sig := <-a.shutdownCh:
		a.logger.Info("Received shutdown signal", "signal", sig.String())
		return a.gracefulShutdown()
		
	case err := <-monitorErrCh:
		a.logger.Error(err, "Monitor failed")
		return err
		
	case err := <-serverErrCh:
		a.logger.Error(err, "Server failed")
		return err
		
	case <-a.ctx.Done():
		a.logger.Info("Context cancelled")
		return a.ctx.Err()
	}
}

// gracefulShutdown performs clean shutdown of all components
func (a *Application) gracefulShutdown() error {
	a.logger.Info("Initiating graceful shutdown", "timeout", gracefulShutdownTimeout)
	
	// Create shutdown context with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), gracefulShutdownTimeout)
	defer cancel()
	
	// Channel for collecting shutdown errors
	errCh := make(chan error, 2)
	
	// Shutdown server
	go func() {
		a.logger.Info("Shutting down server")
		errCh <- a.server.Shutdown(shutdownCtx)
	}()
	
	// Shutdown monitor
	go func() {
		a.logger.Info("Shutting down monitor")
		errCh <- a.monitor.Shutdown(shutdownCtx)
	}()
	
	// Collect shutdown results
	var shutdownErrors []error
	for i := 0; i < 2; i++ {
		if err := <-errCh; err != nil {
			shutdownErrors = append(shutdownErrors, err)
		}
	}
	
	// Cancel application context
	a.cancel()
	
	// Signal completion
	close(a.doneCh)
	
	// Return combined errors if any
	if len(shutdownErrors) > 0 {
		return fmt.Errorf("shutdown errors: %v", shutdownErrors)
	}
	
	a.logger.Info("Graceful shutdown completed")
	return nil
}

// Close ensures proper cleanup of resources
func (a *Application) Close() error {
	if a.cancel != nil {
		a.cancel()
	}
	
	// Wait for graceful shutdown to complete
	select {
	case <-a.doneCh:
		return nil
	case <-time.After(gracefulShutdownTimeout):
		return fmt.Errorf("shutdown timeout exceeded")
	}
}

func main() {
	flag.Parse()
	
	// Validate flags
	if *configFile == "" {
		fmt.Fprintf(os.Stderr, "Error: config file path is required\n")
		os.Exit(1)
	}
	
	// Create root context
	ctx := context.Background()
	
	// Initialize application
	app, err := NewApplication(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize application: %v\n", err)
		os.Exit(1)
	}
	defer app.Close()
	
	// Run application
	if err := app.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Application failed: %v\n", err)
		os.Exit(1)
	}
}