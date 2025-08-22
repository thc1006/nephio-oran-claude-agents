// Traffic Steering xApp Implementation - Based on oran-network-functions-agent.md
// Implements xApp Framework 1.5+ with O-RAN L Release features
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// XAppError implements structured error handling with correlation IDs
type XAppError struct {
	Code          string        `json:"code"`
	Message       string        `json:"message"`
	Component     string        `json:"component"`
	Resource      string        `json:"resource"`
	MessageType   int           `json:"message_type"`
	Severity      ErrorSeverity `json:"severity"`
	CorrelationID string        `json:"correlation_id"`
	Timestamp     time.Time     `json:"timestamp"`
	Err           error         `json:"-"`
	Retryable     bool          `json:"retryable"`
}

type ErrorSeverity int

const (
	SeverityInfo ErrorSeverity = iota
	SeverityWarning
	SeverityError
	SeverityCritical
)

// RMR Message Types (O-RAN constants)
const (
	RIC_INDICATION     = 12010
	A1_POLICY_REQUEST  = 20010
	E2_CONTROL_REQUEST = 12011
)

func (e *XAppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %s (msg_type: %d, resource: %s, correlation: %s) - %v",
			e.Code, e.Component, e.Message, e.MessageType, e.Resource, e.CorrelationID, e.Err)
	}
	return fmt.Sprintf("[%s] %s: %s (msg_type: %d, resource: %s, correlation: %s)",
		e.Code, e.Component, e.Message, e.MessageType, e.Resource, e.CorrelationID)
}

func (e *XAppError) Unwrap() error {
	return e.Err
}

// E2Metrics represents parsed E2 indication data
type E2Metrics struct {
	UECount       int       `json:"ue_count"`
	Throughput    float64   `json:"throughput_mbps"`
	Latency       float64   `json:"latency_ms"`
	PacketLoss    float64   `json:"packet_loss_percent"`
	CellID        string    `json:"cell_id"`
	Timestamp     time.Time `json:"timestamp"`
	PRBUsageDL    float64   `json:"prb_usage_dl"`
	PRBUsageUL    float64   `json:"prb_usage_ul"`
	RSRP          float64   `json:"rsrp_dbm"`
	RSRQ          float64   `json:"rsrq_db"`
	EnergyEfficiency float64 `json:"energy_efficiency"`
}

// SteeringDecision represents traffic steering decision
type SteeringDecision struct {
	Action      string            `json:"action"`
	Parameters  map[string]string `json:"parameters"`
	Priority    int               `json:"priority"`
	ValidUntil  time.Time         `json:"valid_until"`
	Confidence  float64           `json:"confidence"`
	Reasoning   string            `json:"reasoning"`
}

// A1Policy represents A1 policy configuration
type A1Policy struct {
	PolicyID   string                 `json:"policy_id"`
	Type       string                 `json:"type"`
	Parameters map[string]interface{} `json:"parameters"`
	Scope      []string               `json:"scope"`
	ValidFrom  time.Time              `json:"valid_from"`
	ValidUntil time.Time              `json:"valid_until"`
}

// RMRMessage simulates RMR message structure
type RMRMessage struct {
	MessageType int    `json:"message_type"`
	Payload     []byte `json:"payload"`
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

// TrafficSteeringXApp with enhanced error handling and logging (Go 1.24.6)
type TrafficSteeringXApp struct {
	Logger         *slog.Logger
	ProcessTimeout time.Duration
	CorrelationID  string
	mu             sync.RWMutex
	metrics        map[string]*E2Metrics
	policies       map[string]*A1Policy
	httpServer     *http.Server
	
	// L Release AI/ML features
	AIMLEnabled     bool
	ModelEndpoint   string
	PythonO1SimEnabled bool
}

// NewTrafficSteeringXApp creates a new xApp with Go 1.24.6 features
func NewTrafficSteeringXApp(ctx context.Context, name string) (*TrafficSteeringXApp, error) {
	correlationID := uuid.New().String()
	if ctxID := ctx.Value("correlation_id"); ctxID != nil {
		if id, ok := ctxID.(string); ok && id != "" {
			correlationID = id
		}
	}

	// Configure structured logging with slog (Go 1.24.6)
	logLevel := slog.LevelInfo
	if os.Getenv("LOG_LEVEL") == "DEBUG" {
		logLevel = slog.LevelDebug
	}

	opts := &slog.HandlerOptions{
		Level:     logLevel,
		AddSource: true,
	}

	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler).With(
		slog.String("correlation_id", correlationID),
		slog.String("component", "TrafficSteeringXApp"),
		slog.String("version", "l-release"),
		slog.String("xapp_name", name),
		slog.String("go_version", "1.24.6"),
	)

	// Initialize HTTP server for health checks and metrics
	router := mux.NewRouter()
	server := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	xapp := &TrafficSteeringXApp{
		Logger:         logger,
		ProcessTimeout: 30 * time.Second,
		CorrelationID:  correlationID,
		metrics:        make(map[string]*E2Metrics),
		policies:       make(map[string]*A1Policy),
		httpServer:     server,
		AIMLEnabled:    os.Getenv("AI_ML_ENABLED") == "true",
		ModelEndpoint:  os.Getenv("ML_MODEL_ENDPOINT"),
		PythonO1SimEnabled: os.Getenv("PYTHON_O1_SIMULATOR") == "enabled",
	}

	// Setup HTTP routes
	xapp.setupRoutes(router)

	return xapp, nil
}

// setupRoutes configures HTTP endpoints
func (x *TrafficSteeringXApp) setupRoutes(router *mux.Router) {
	// Health check endpoints
	router.HandleFunc("/ric/v1/health/alive", x.handleAlive).Methods("GET")
	router.HandleFunc("/ric/v1/health/ready", x.handleReady).Methods("GET")
	
	// Metrics endpoint
	router.HandleFunc("/metrics", x.handleMetrics).Methods("GET")
	
	// xApp specific endpoints
	router.HandleFunc("/ric/v1/steering/decision", x.handleSteeringDecision).Methods("POST")
	router.HandleFunc("/ric/v1/policies", x.handlePolicies).Methods("GET", "POST")
	router.HandleFunc("/ric/v1/metrics/e2", x.handleE2Metrics).Methods("GET")
}

// HTTP handlers

func (x *TrafficSteeringXApp) handleAlive(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":      "alive",
		"timestamp":   time.Now().UTC(),
		"xapp":        "traffic-steering-xapp",
		"version":     "l-release-2.0.0",
		"correlation": x.CorrelationID,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (x *TrafficSteeringXApp) handleReady(w http.ResponseWriter, r *http.Request) {
	// Check if xApp is ready to serve traffic
	ready := true
	
	// Could add additional readiness checks here
	if x.AIMLEnabled && x.ModelEndpoint == "" {
		ready = false
	}
	
	response := map[string]interface{}{
		"status":      map[string]bool{"ready": ready},
		"timestamp":   time.Now().UTC(),
		"features": map[string]bool{
			"ai_ml_enabled": x.AIMLEnabled,
			"python_o1_sim": x.PythonO1SimEnabled,
		},
	}
	
	if ready {
		w.WriteHeader(http.StatusOK)
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (x *TrafficSteeringXApp) handleMetrics(w http.ResponseWriter, r *http.Request) {
	x.mu.RLock()
	defer x.mu.RUnlock()
	
	// Generate Prometheus-style metrics
	metrics := fmt.Sprintf(`# HELP xapp_e2_indications_total Total E2 indications received
# TYPE xapp_e2_indications_total counter
xapp_e2_indications_total{xapp="traffic-steering"} %d

# HELP xapp_steering_decisions_total Total steering decisions made
# TYPE xapp_steering_decisions_total counter
xapp_steering_decisions_total{xapp="traffic-steering"} %d

# HELP xapp_active_policies Current number of active policies
# TYPE xapp_active_policies gauge
xapp_active_policies{xapp="traffic-steering"} %d

# HELP xapp_cell_count Number of cells being monitored
# TYPE xapp_cell_count gauge
xapp_cell_count{xapp="traffic-steering"} %d
`,
		len(x.metrics)*10, // Simulated indication count
		len(x.metrics)*5,  // Simulated decisions count
		len(x.policies),
		len(x.metrics),
	)
	
	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(metrics))
}

func (x *TrafficSteeringXApp) handleSteeringDecision(w http.ResponseWriter, r *http.Request) {
	var request struct {
		CellID  string            `json:"cell_id"`
		Metrics map[string]float64 `json:"metrics"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Make steering decision
	decision, err := x.makeIntelligentSteeringDecision(r.Context(), request.CellID, request.Metrics)
	if err != nil {
		x.Logger.Error("Failed to make steering decision",
			slog.String("cell_id", request.CellID),
			slog.String("error", err.Error()))
		http.Error(w, "Failed to make decision", http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(decision)
}

func (x *TrafficSteeringXApp) handlePolicies(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		x.mu.RLock()
		policies := make([]*A1Policy, 0, len(x.policies))
		for _, policy := range x.policies {
			policies = append(policies, policy)
		}
		x.mu.RUnlock()
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(policies)
		
	case "POST":
		var policy A1Policy
		if err := json.NewDecoder(r.Body).Decode(&policy); err != nil {
			http.Error(w, "Invalid policy format", http.StatusBadRequest)
			return
		}
		
		x.mu.Lock()
		x.policies[policy.PolicyID] = &policy
		x.mu.Unlock()
		
		x.Logger.Info("A1 policy updated",
			slog.String("policy_id", policy.PolicyID),
			slog.String("policy_type", policy.Type))
		
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(policy)
	}
}

func (x *TrafficSteeringXApp) handleE2Metrics(w http.ResponseWriter, r *http.Request) {
	x.mu.RLock()
	defer x.mu.RUnlock()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(x.metrics)
}

// Core xApp logic

// Consume processes RMR messages with comprehensive error handling
func (x *TrafficSteeringXApp) Consume(ctx context.Context, msg *RMRMessage) error {
	ctx, cancel := context.WithTimeout(ctx, x.ProcessTimeout)
	defer cancel()

	x.Logger.InfoContext(ctx, "Processing RMR message",
		slog.Int("message_type", msg.MessageType),
		slog.String("source", msg.Source),
		slog.Int("payload_length", len(msg.Payload)),
		slog.String("operation", "consume_message"))

	switch msg.MessageType {
	case RIC_INDICATION:
		return x.handleE2Indication(ctx, msg)
	case A1_POLICY_REQUEST:
		return x.handleA1PolicyRequest(ctx, msg)
	default:
		return x.wrapError(
			fmt.Errorf("unknown message type: %d", msg.MessageType),
			"UNKNOWN_MESSAGE_TYPE",
			"Unknown RMR message type received",
			msg.MessageType,
			false,
		)
	}
}

// handleE2Indication processes E2 indication messages with L Release enhancements
func (x *TrafficSteeringXApp) handleE2Indication(ctx context.Context, msg *RMRMessage) error {
	x.Logger.DebugContext(ctx, "Processing E2 indication",
		slog.String("operation", "handle_e2_indication"))

	// Parse E2 indication with retry
	var metrics *E2Metrics
	err := x.retryWithBackoff(ctx, func() error {
		var err error
		metrics, err = x.parseE2Indication(ctx, msg.Payload)
		if err != nil {
			x.Logger.WarnContext(ctx, "Failed to parse E2 indication, retrying",
				slog.String("error", err.Error()))
			return err
		}
		return nil
	})

	if err != nil {
		return x.wrapError(err, "E2_PARSE_FAILED", "Failed to parse E2 indication", msg.MessageType, true)
	}

	// Store metrics for analysis
	x.mu.Lock()
	x.metrics[metrics.CellID] = metrics
	x.mu.Unlock()

	// Make intelligent steering decision with AI/ML if enabled
	var decision *SteeringDecision
	if x.AIMLEnabled {
		decision, err = x.makeAIMLSteeringDecision(ctx, metrics)
	} else {
		decision, err = x.makeTraditionalSteeringDecision(ctx, metrics)
	}

	if err != nil {
		x.Logger.WarnContext(ctx, "Could not make steering decision",
			slog.String("cell_id", metrics.CellID),
			slog.String("error", err.Error()))
		return nil
	}

	// Send control request with retry and timeout
	err = x.retryWithBackoff(ctx, func() error {
		controlCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()

		return x.sendControlRequest(controlCtx, decision)
	})

	if err != nil {
		return x.wrapError(err, "CONTROL_REQUEST_FAILED", "Failed to send E2 control request", msg.MessageType, true)
	}

	x.Logger.InfoContext(ctx, "E2 indication processed successfully",
		slog.String("cell_id", metrics.CellID),
		slog.String("action", decision.Action),
		slog.Float64("confidence", decision.Confidence))

	return nil
}

// parseE2Indication parses E2 indication payload with L Release enhancements
func (x *TrafficSteeringXApp) parseE2Indication(ctx context.Context, payload []byte) (*E2Metrics, error) {
	x.Logger.DebugContext(ctx, "Parsing E2 indication payload",
		slog.Int("payload_size", len(payload)))

	// Simulate enhanced parsing for L Release
	if len(payload) < 10 {
		return nil, errors.New("invalid E2 indication payload")
	}

	metrics := &E2Metrics{
		UECount:       int(payload[0]),
		Throughput:    float64(payload[1]) * 10.0,
		Latency:       float64(payload[2]) * 0.5,
		PacketLoss:    float64(payload[3]) * 0.1,
		CellID:        fmt.Sprintf("cell-%d", payload[4]),
		Timestamp:     time.Now(),
		PRBUsageDL:    float64(payload[5]) * 1.5,
		PRBUsageUL:    float64(payload[6]) * 1.2,
		RSRP:          -70.0 - float64(payload[7]),
		RSRQ:          -10.0 - float64(payload[8]),
		EnergyEfficiency: float64(payload[1]) / (float64(payload[9]) + 1), // Throughput/Power
	}

	x.Logger.DebugContext(ctx, "E2 metrics parsed with L Release enhancements",
		slog.String("cell_id", metrics.CellID),
		slog.Int("ue_count", metrics.UECount),
		slog.Float64("throughput", metrics.Throughput),
		slog.Float64("energy_efficiency", metrics.EnergyEfficiency))

	return metrics, nil
}

// makeAIMLSteeringDecision uses AI/ML for intelligent steering (L Release feature)
func (x *TrafficSteeringXApp) makeAIMLSteeringDecision(ctx context.Context, metrics *E2Metrics) (*SteeringDecision, error) {
	x.Logger.DebugContext(ctx, "Making AI/ML-powered steering decision",
		slog.String("cell_id", metrics.CellID),
		slog.Bool("ai_ml_enabled", x.AIMLEnabled))

	// Simulate AI/ML decision making
	decision := &SteeringDecision{
		Action:      "optimize",
		Parameters:  make(map[string]string),
		Priority:    1,
		ValidUntil:  time.Now().Add(5 * time.Minute),
		Confidence:  0.95,
		Reasoning:   "AI/ML model prediction based on historical patterns",
	}

	// Enhanced decision logic using AI/ML features
	if metrics.EnergyEfficiency < 5.0 {
		decision.Action = "energy_optimize"
		decision.Parameters["target_efficiency"] = "7.5"
		decision.Confidence = 0.92
		decision.Reasoning = "Energy efficiency below threshold, AI/ML recommends optimization"
	} else if metrics.Throughput < 50.0 && metrics.PRBUsageDL > 80.0 {
		decision.Action = "load_balance"
		decision.Parameters["target_cell"] = fmt.Sprintf("cell-%d", (time.Now().Unix()%10)+1)
		decision.Parameters["load_distribution"] = "60:40"
		decision.Confidence = 0.88
		decision.Reasoning = "High PRB usage with low throughput, AI/ML suggests load balancing"
	} else if metrics.PacketLoss > 1.0 {
		decision.Action = "power_control"
		decision.Parameters["power_level"] = "high"
		decision.Confidence = 0.85
		decision.Reasoning = "Packet loss detected, AI/ML recommends power adjustment"
	}

	decision.Parameters["cell_id"] = metrics.CellID
	decision.Parameters["ai_ml_model"] = "traffic_steering_v2.0"

	return decision, nil
}

// makeTraditionalSteeringDecision uses traditional rule-based approach
func (x *TrafficSteeringXApp) makeTraditionalSteeringDecision(ctx context.Context, metrics *E2Metrics) (*SteeringDecision, error) {
	x.Logger.DebugContext(ctx, "Making traditional rule-based steering decision",
		slog.String("cell_id", metrics.CellID))

	decision := &SteeringDecision{
		Action:      "optimize",
		Parameters:  make(map[string]string),
		Priority:    1,
		ValidUntil:  time.Now().Add(5 * time.Minute),
		Confidence:  0.75,
		Reasoning:   "Rule-based decision using traditional thresholds",
	}

	// Simple decision logic based on thresholds
	if metrics.Throughput < 50.0 {
		decision.Action = "handover"
		decision.Parameters["target_cell"] = fmt.Sprintf("cell-%d", (time.Now().Unix()%10)+1)
		decision.Priority = 2
	} else if metrics.PacketLoss > 1.0 {
		decision.Action = "power_control"
		decision.Parameters["power_level"] = "high"
	}

	decision.Parameters["cell_id"] = metrics.CellID

	return decision, nil
}

// makeIntelligentSteeringDecision creates decision based on available data
func (x *TrafficSteeringXApp) makeIntelligentSteeringDecision(ctx context.Context, cellID string, metricsData map[string]float64) (*SteeringDecision, error) {
	// Convert metrics data to E2Metrics structure
	metrics := &E2Metrics{
		CellID:      cellID,
		Timestamp:   time.Now(),
		Throughput:  metricsData["throughput"],
		Latency:     metricsData["latency"],
		PacketLoss:  metricsData["packet_loss"],
		PRBUsageDL:  metricsData["prb_usage_dl"],
		PRBUsageUL:  metricsData["prb_usage_ul"],
		UECount:     int(metricsData["ue_count"]),
	}

	if x.AIMLEnabled {
		return x.makeAIMLSteeringDecision(ctx, metrics)
	}
	return x.makeTraditionalSteeringDecision(ctx, metrics)
}

// sendControlRequest sends E2 control request
func (x *TrafficSteeringXApp) sendControlRequest(ctx context.Context, decision *SteeringDecision) error {
	x.Logger.DebugContext(ctx, "Sending control request",
		slog.String("action", decision.Action),
		slog.Int("priority", decision.Priority),
		slog.Float64("confidence", decision.Confidence))

	// Simulate control request - in real implementation would create ASN.1 message
	controlMsg := &RMRMessage{
		MessageType: E2_CONTROL_REQUEST,
		Payload:     []byte(fmt.Sprintf(`{"action":"%s","parameters":%v,"confidence":%f}`, decision.Action, decision.Parameters, decision.Confidence)),
		Source:      "traffic-steering-xapp",
		Destination: "e2term",
	}

	// Simulate sending via RMR
	x.Logger.InfoContext(ctx, "Control request sent successfully",
		slog.String("action", decision.Action),
		slog.String("reasoning", decision.Reasoning))

	return nil
}

// handleA1PolicyRequest processes A1 policy requests with L Release features
func (x *TrafficSteeringXApp) handleA1PolicyRequest(ctx context.Context, msg *RMRMessage) error {
	x.Logger.DebugContext(ctx, "Processing A1 policy request",
		slog.String("operation", "handle_a1_policy"))

	// Parse A1 policy with retry
	var policy *A1Policy
	err := x.retryWithBackoff(ctx, func() error {
		var err error
		policy, err = x.parseA1Policy(ctx, msg.Payload)
		if err != nil {
			x.Logger.WarnContext(ctx, "Failed to parse A1 policy, retrying",
				slog.String("error", err.Error()))
			return err
		}
		return nil
	})

	if err != nil {
		return x.wrapError(err, "A1_PARSE_FAILED", "Failed to parse A1 policy", msg.MessageType, true)
	}

	// Validate policy before enforcement
	if err := x.validateA1Policy(ctx, policy); err != nil {
		return x.wrapError(err, "A1_VALIDATION_FAILED", "A1 policy validation failed", msg.MessageType, false)
	}

	// Store policy
	x.mu.Lock()
	x.policies[policy.PolicyID] = policy
	x.mu.Unlock()

	x.Logger.InfoContext(ctx, "A1 policy processed successfully",
		slog.String("policy_id", policy.PolicyID),
		slog.String("type", policy.Type))

	return nil
}

// parseA1Policy parses A1 policy payload
func (x *TrafficSteeringXApp) parseA1Policy(ctx context.Context, payload []byte) (*A1Policy, error) {
	x.Logger.DebugContext(ctx, "Parsing A1 policy payload")

	// Simulate A1 policy parsing
	policy := &A1Policy{
		PolicyID:   fmt.Sprintf("policy-%d", time.Now().Unix()),
		Type:       "TrafficSteeringPolicy",
		Parameters: make(map[string]interface{}),
		Scope:      []string{"cell-1", "cell-2"},
		ValidFrom:  time.Now(),
		ValidUntil: time.Now().Add(1 * time.Hour),
	}

	policy.Parameters["load_threshold"] = 80.0
	policy.Parameters["handover_preference"] = "PREFER"
	policy.Parameters["energy_efficiency_target"] = 7.5

	return policy, nil
}

// validateA1Policy validates A1 policy structure
func (x *TrafficSteeringXApp) validateA1Policy(ctx context.Context, policy *A1Policy) error {
	if policy.PolicyID == "" {
		return errors.New("policy ID is required")
	}

	if policy.Type == "" {
		return errors.New("policy type is required")
	}

	if time.Now().After(policy.ValidUntil) {
		return errors.New("policy has expired")
	}

	return nil
}

// Helper methods

func (x *TrafficSteeringXApp) retryWithBackoff(ctx context.Context, operation func() error) error {
	expBackoff := backoff.NewExponentialBackOff()
	expBackoff.MaxElapsedTime = 30 * time.Second
	expBackoff.InitialInterval = 1 * time.Second
	expBackoff.MaxInterval = 10 * time.Second

	retryCount := 0
	return backoff.Retry(func() error {
		retryCount++
		if retryCount > 1 {
			x.Logger.DebugContext(ctx, "Retrying operation",
				slog.Int("attempt", retryCount))
		}

		select {
		case <-ctx.Done():
			return backoff.Permanent(ctx.Err())
		default:
			return operation()
		}
	}, backoff.WithContext(expBackoff, ctx))
}

func (x *TrafficSteeringXApp) wrapError(err error, code, message string, messageType int, retryable bool) error {
	severity := SeverityError
	if !retryable {
		severity = SeverityCritical
	}

	return &XAppError{
		Code:          code,
		Message:       message,
		Component:     "TrafficSteeringXApp",
		Resource:      "xapp",
		MessageType:   messageType,
		Severity:      severity,
		CorrelationID: x.CorrelationID,
		Timestamp:     time.Now(),
		Err:           err,
		Retryable:     retryable,
	}
}

// Start starts the xApp HTTP server
func (x *TrafficSteeringXApp) Start(ctx context.Context) error {
	x.Logger.Info("Starting Traffic Steering xApp HTTP server",
		slog.String("address", x.httpServer.Addr),
		slog.Bool("ai_ml_enabled", x.AIMLEnabled),
		slog.Bool("python_o1_sim", x.PythonO1SimEnabled))

	go func() {
		if err := x.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			x.Logger.Error("HTTP server error", slog.String("error", err.Error()))
		}
	}()

	// Wait for context cancellation
	<-ctx.Done()

	// Graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	return x.httpServer.Shutdown(shutdownCtx)
}

// Example usage and demonstration
func main() {
	ctx := context.Background()
	ctx = context.WithValue(ctx, "correlation_id", uuid.New().String())

	// Initialize the xApp
	xapp, err := NewTrafficSteeringXApp(ctx, "traffic-steering-xapp")
	if err != nil {
		slog.Error("Failed to create TrafficSteeringXApp",
			slog.String("error", err.Error()))
		os.Exit(1)
	}

	xapp.Logger.Info("Traffic Steering xApp initialized successfully",
		slog.String("version", "l-release-2.0.0"),
		slog.String("framework", "xapp-framework:1.5+"),
		slog.Bool("ai_ml_enabled", xapp.AIMLEnabled))

	// Start the xApp
	if err := xapp.Start(ctx); err != nil {
		xapp.Logger.Error("xApp startup failed", slog.String("error", err.Error()))
		os.Exit(1)
	}

	xapp.Logger.Info("Traffic Steering xApp shutdown completed")
}