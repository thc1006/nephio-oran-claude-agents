// Package config provides configuration management for the Nephio O-RAN Claude Agents.
// It implements memory-efficient struct layouts and comprehensive validation.
package config

import (
	"fmt"
	"os"
	"time"
	
	"gopkg.in/yaml.v3"
)

// Config represents the main application configuration with memory-optimized layout.
// Fields are ordered by size (largest to smallest) to minimize memory padding.
type Config struct {
	// 64-bit fields first for alignment
	Database   DatabaseConfig   `yaml:"database"`
	Redis      RedisConfig      `yaml:"redis"`
	Kubernetes KubernetesConfig `yaml:"kubernetes"`
	
	// Nested structs
	Server     ServerConfig     `yaml:"server"`
	Agents     AgentsConfig     `yaml:"agents"`
	Monitoring MonitoringConfig `yaml:"monitoring"`
	Security   SecurityConfig   `yaml:"security"`
	
	// Smaller fields last
	Environment string `yaml:"environment"`
	LogLevel    string `yaml:"log_level"`
}

// ServerConfig contains HTTP server configuration
type ServerConfig struct {
	// Duration fields first (int64)
	ReadTimeout       time.Duration `yaml:"read_timeout"`
	WriteTimeout      time.Duration `yaml:"write_timeout"`
	IdleTimeout       time.Duration `yaml:"idle_timeout"`
	ShutdownTimeout   time.Duration `yaml:"shutdown_timeout"`
	
	// Integer fields
	Port              int    `yaml:"port"`
	MaxHeaderBytes    int    `yaml:"max_header_bytes"`
	MaxRequestSize    int64  `yaml:"max_request_size"`
	
	// String fields
	Host              string `yaml:"host"`
	TLSCertFile       string `yaml:"tls_cert_file,omitempty"`
	TLSKeyFile        string `yaml:"tls_key_file,omitempty"`
	
	// Boolean fields last (smallest)
	EnableTLS         bool   `yaml:"enable_tls"`
	EnableCompression bool   `yaml:"enable_compression"`
}

// DatabaseConfig contains database connection configuration
type DatabaseConfig struct {
	// Duration fields first
	ConnMaxLifetime    time.Duration `yaml:"conn_max_lifetime"`
	ConnMaxIdleTime    time.Duration `yaml:"conn_max_idle_time"`
	
	// Integer fields
	MaxOpenConns       int    `yaml:"max_open_conns"`
	MaxIdleConns       int    `yaml:"max_idle_conns"`
	Port              int    `yaml:"port"`
	
	// String fields
	Host              string `yaml:"host"`
	Database          string `yaml:"database"`
	Username          string `yaml:"username"`
	Password          string `yaml:"password"`
	SSLMode           string `yaml:"ssl_mode"`
	
	// Boolean fields
	Enabled           bool   `yaml:"enabled"`
}

// RedisConfig contains Redis connection configuration
type RedisConfig struct {
	// Duration fields first
	DialTimeout       time.Duration `yaml:"dial_timeout"`
	ReadTimeout       time.Duration `yaml:"read_timeout"`
	WriteTimeout      time.Duration `yaml:"write_timeout"`
	PoolTimeout       time.Duration `yaml:"pool_timeout"`
	IdleTimeout       time.Duration `yaml:"idle_timeout"`
	
	// Integer fields
	Port              int    `yaml:"port"`
	Database          int    `yaml:"database"`
	PoolSize          int    `yaml:"pool_size"`
	MinIdleConns      int    `yaml:"min_idle_conns"`
	MaxRetries        int    `yaml:"max_retries"`
	
	// String fields
	Host              string `yaml:"host"`
	Password          string `yaml:"password"`
	
	// Boolean fields
	Enabled           bool   `yaml:"enabled"`
	EnableTLS         bool   `yaml:"enable_tls"`
}

// KubernetesConfig contains Kubernetes client configuration
type KubernetesConfig struct {
	// Duration fields first
	Timeout           time.Duration `yaml:"timeout"`
	
	// Integer fields
	QPS               int    `yaml:"qps"`
	Burst             int    `yaml:"burst"`
	
	// String fields
	ConfigPath        string `yaml:"config_path"`
	Namespace         string `yaml:"namespace"`
	
	// Boolean fields
	InCluster         bool   `yaml:"in_cluster"`
}

// AgentsConfig contains configuration for various agents
type AgentsConfig struct {
	// Duration fields
	HeartbeatInterval time.Duration          `yaml:"heartbeat_interval"`
	TaskTimeout       time.Duration          `yaml:"task_timeout"`
	
	// Integer fields
	MaxConcurrent     int                    `yaml:"max_concurrent"`
	RetryAttempts     int                    `yaml:"retry_attempts"`
	
	// Map of agent configurations
	Configurations    map[string]AgentConfig `yaml:"configurations"`
	
	// Boolean fields
	EnableMetrics     bool                   `yaml:"enable_metrics"`
}

// AgentConfig contains individual agent configuration
type AgentConfig struct {
	// Duration fields first
	Timeout       time.Duration `yaml:"timeout"`
	RetryDelay    time.Duration `yaml:"retry_delay"`
	
	// Integer fields
	MaxRetries    int           `yaml:"max_retries"`
	Priority      int           `yaml:"priority"`
	
	// String fields
	Type          string        `yaml:"type"`
	Endpoint      string        `yaml:"endpoint"`
	
	// Boolean fields
	Enabled       bool          `yaml:"enabled"`
}

// MonitoringConfig contains monitoring and observability configuration
type MonitoringConfig struct {
	// Duration fields first
	ScrapeInterval    time.Duration `yaml:"scrape_interval"`
	
	// Integer fields
	Port              int           `yaml:"port"`
	
	// String fields
	MetricsPath       string        `yaml:"metrics_path"`
	HealthPath        string        `yaml:"health_path"`
	
	// Boolean fields
	EnableMetrics     bool          `yaml:"enable_metrics"`
	EnableTracing     bool          `yaml:"enable_tracing"`
	EnableProfiling   bool          `yaml:"enable_profiling"`
}

// SecurityConfig contains security-related configuration
type SecurityConfig struct {
	// Duration fields first
	TokenExpiry       time.Duration `yaml:"token_expiry"`
	
	// String slices
	AllowedOrigins    []string      `yaml:"allowed_origins"`
	AllowedMethods    []string      `yaml:"allowed_methods"`
	AllowedHeaders    []string      `yaml:"allowed_headers"`
	
	// String fields
	JWTSecret         string        `yaml:"jwt_secret"`
	
	// Boolean fields
	EnableCORS        bool          `yaml:"enable_cors"`
	EnableAuth        bool          `yaml:"enable_auth"`
}

// Load reads and parses configuration from the specified file
func Load(filepath string) (*Config, error) {
	if filepath == "" {
		return nil, fmt.Errorf("configuration file path cannot be empty")
	}
	
	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("failed to read configuration file %s: %w", filepath, err)
	}
	
	cfg := &Config{}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("failed to parse configuration file %s: %w", filepath, err)
	}
	
	// Set defaults for unspecified values
	cfg.setDefaults()
	
	return cfg, nil
}

// setDefaults applies default values for configuration fields
func (c *Config) setDefaults() {
	// Server defaults
	if c.Server.Port == 0 {
		c.Server.Port = 8080
	}
	if c.Server.Host == "" {
		c.Server.Host = "localhost"
	}
	if c.Server.ReadTimeout == 0 {
		c.Server.ReadTimeout = 10 * time.Second
	}
	if c.Server.WriteTimeout == 0 {
		c.Server.WriteTimeout = 10 * time.Second
	}
	if c.Server.IdleTimeout == 0 {
		c.Server.IdleTimeout = 60 * time.Second
	}
	if c.Server.ShutdownTimeout == 0 {
		c.Server.ShutdownTimeout = 30 * time.Second
	}
	if c.Server.MaxHeaderBytes == 0 {
		c.Server.MaxHeaderBytes = 1 << 20 // 1MB
	}
	if c.Server.MaxRequestSize == 0 {
		c.Server.MaxRequestSize = 32 << 20 // 32MB
	}
	
	// Database defaults
	if c.Database.Port == 0 {
		c.Database.Port = 5432
	}
	if c.Database.Host == "" {
		c.Database.Host = "localhost"
	}
	if c.Database.Database == "" {
		c.Database.Database = "nephio"
	}
	if c.Database.SSLMode == "" {
		c.Database.SSLMode = "disable"
	}
	if c.Database.MaxOpenConns == 0 {
		c.Database.MaxOpenConns = 25
	}
	if c.Database.MaxIdleConns == 0 {
		c.Database.MaxIdleConns = 5
	}
	if c.Database.ConnMaxLifetime == 0 {
		c.Database.ConnMaxLifetime = 5 * time.Minute
	}
	if c.Database.ConnMaxIdleTime == 0 {
		c.Database.ConnMaxIdleTime = 5 * time.Minute
	}
	
	// Redis defaults
	if c.Redis.Port == 0 {
		c.Redis.Port = 6379
	}
	if c.Redis.Host == "" {
		c.Redis.Host = "localhost"
	}
	if c.Redis.PoolSize == 0 {
		c.Redis.PoolSize = 10
	}
	if c.Redis.MinIdleConns == 0 {
		c.Redis.MinIdleConns = 5
	}
	if c.Redis.DialTimeout == 0 {
		c.Redis.DialTimeout = 5 * time.Second
	}
	if c.Redis.ReadTimeout == 0 {
		c.Redis.ReadTimeout = 3 * time.Second
	}
	if c.Redis.WriteTimeout == 0 {
		c.Redis.WriteTimeout = 3 * time.Second
	}
	if c.Redis.PoolTimeout == 0 {
		c.Redis.PoolTimeout = 4 * time.Second
	}
	if c.Redis.IdleTimeout == 0 {
		c.Redis.IdleTimeout = 5 * time.Minute
	}
	if c.Redis.MaxRetries == 0 {
		c.Redis.MaxRetries = 3
	}
	
	// Kubernetes defaults
	if c.Kubernetes.Timeout == 0 {
		c.Kubernetes.Timeout = 30 * time.Second
	}
	if c.Kubernetes.QPS == 0 {
		c.Kubernetes.QPS = 50
	}
	if c.Kubernetes.Burst == 0 {
		c.Kubernetes.Burst = 100
	}
	if c.Kubernetes.Namespace == "" {
		c.Kubernetes.Namespace = "default"
	}
	
	// Agents defaults
	if c.Agents.HeartbeatInterval == 0 {
		c.Agents.HeartbeatInterval = 30 * time.Second
	}
	if c.Agents.TaskTimeout == 0 {
		c.Agents.TaskTimeout = 5 * time.Minute
	}
	if c.Agents.MaxConcurrent == 0 {
		c.Agents.MaxConcurrent = 10
	}
	if c.Agents.RetryAttempts == 0 {
		c.Agents.RetryAttempts = 3
	}
	
	// Monitoring defaults
	if c.Monitoring.Port == 0 {
		c.Monitoring.Port = 8081
	}
	if c.Monitoring.MetricsPath == "" {
		c.Monitoring.MetricsPath = "/metrics"
	}
	if c.Monitoring.HealthPath == "" {
		c.Monitoring.HealthPath = "/health"
	}
	if c.Monitoring.ScrapeInterval == 0 {
		c.Monitoring.ScrapeInterval = 15 * time.Second
	}
	
	// Security defaults
	if c.Security.TokenExpiry == 0 {
		c.Security.TokenExpiry = 24 * time.Hour
	}
	if len(c.Security.AllowedMethods) == 0 {
		c.Security.AllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	}
	if len(c.Security.AllowedHeaders) == 0 {
		c.Security.AllowedHeaders = []string{"Content-Type", "Authorization"}
	}
	
	// Environment defaults
	if c.Environment == "" {
		c.Environment = "development"
	}
	if c.LogLevel == "" {
		c.LogLevel = "info"
	}
}

// Validate performs comprehensive validation of the configuration
func (c *Config) Validate() error {
	if c == nil {
		return fmt.Errorf("configuration cannot be nil")
	}
	
	// Validate server configuration
	if err := c.validateServer(); err != nil {
		return fmt.Errorf("server configuration error: %w", err)
	}
	
	// Validate database configuration if enabled
	if c.Database.Enabled {
		if err := c.validateDatabase(); err != nil {
			return fmt.Errorf("database configuration error: %w", err)
		}
	}
	
	// Validate Redis configuration if enabled
	if c.Redis.Enabled {
		if err := c.validateRedis(); err != nil {
			return fmt.Errorf("redis configuration error: %w", err)
		}
	}
	
	// Validate Kubernetes configuration
	if err := c.validateKubernetes(); err != nil {
		return fmt.Errorf("kubernetes configuration error: %w", err)
	}
	
	// Validate agents configuration
	if err := c.validateAgents(); err != nil {
		return fmt.Errorf("agents configuration error: %w", err)
	}
	
	// Validate monitoring configuration
	if err := c.validateMonitoring(); err != nil {
		return fmt.Errorf("monitoring configuration error: %w", err)
	}
	
	// Validate security configuration
	if err := c.validateSecurity(); err != nil {
		return fmt.Errorf("security configuration error: %w", err)
	}
	
	return nil
}

// validateServer validates server configuration
func (c *Config) validateServer() error {
	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", c.Server.Port)
	}
	
	if c.Server.Host == "" {
		return fmt.Errorf("server host cannot be empty")
	}
	
	if c.Server.ReadTimeout <= 0 {
		return fmt.Errorf("read timeout must be positive")
	}
	
	if c.Server.WriteTimeout <= 0 {
		return fmt.Errorf("write timeout must be positive")
	}
	
	if c.Server.MaxHeaderBytes <= 0 {
		return fmt.Errorf("max header bytes must be positive")
	}
	
	// Validate TLS configuration
	if c.Server.EnableTLS {
		if c.Server.TLSCertFile == "" {
			return fmt.Errorf("TLS cert file required when TLS is enabled")
		}
		if c.Server.TLSKeyFile == "" {
			return fmt.Errorf("TLS key file required when TLS is enabled")
		}
	}
	
	return nil
}

// validateDatabase validates database configuration
func (c *Config) validateDatabase() error {
	if c.Database.Host == "" {
		return fmt.Errorf("database host cannot be empty")
	}
	
	if c.Database.Port < 1 || c.Database.Port > 65535 {
		return fmt.Errorf("invalid database port: %d", c.Database.Port)
	}
	
	if c.Database.Database == "" {
		return fmt.Errorf("database name cannot be empty")
	}
	
	if c.Database.MaxOpenConns <= 0 {
		return fmt.Errorf("max open connections must be positive")
	}
	
	if c.Database.MaxIdleConns < 0 {
		return fmt.Errorf("max idle connections cannot be negative")
	}
	
	if c.Database.MaxIdleConns > c.Database.MaxOpenConns {
		return fmt.Errorf("max idle connections cannot exceed max open connections")
	}
	
	return nil
}

// validateRedis validates Redis configuration
func (c *Config) validateRedis() error {
	if c.Redis.Host == "" {
		return fmt.Errorf("redis host cannot be empty")
	}
	
	if c.Redis.Port < 1 || c.Redis.Port > 65535 {
		return fmt.Errorf("invalid redis port: %d", c.Redis.Port)
	}
	
	if c.Redis.Database < 0 || c.Redis.Database > 15 {
		return fmt.Errorf("invalid redis database: %d (must be 0-15)", c.Redis.Database)
	}
	
	if c.Redis.PoolSize <= 0 {
		return fmt.Errorf("redis pool size must be positive")
	}
	
	if c.Redis.MinIdleConns < 0 {
		return fmt.Errorf("redis min idle connections cannot be negative")
	}
	
	if c.Redis.MinIdleConns > c.Redis.PoolSize {
		return fmt.Errorf("redis min idle connections cannot exceed pool size")
	}
	
	return nil
}

// validateKubernetes validates Kubernetes configuration
func (c *Config) validateKubernetes() error {
	if c.Kubernetes.QPS <= 0 {
		return fmt.Errorf("kubernetes QPS must be positive")
	}
	
	if c.Kubernetes.Burst <= 0 {
		return fmt.Errorf("kubernetes burst must be positive")
	}
	
	if c.Kubernetes.Namespace == "" {
		return fmt.Errorf("kubernetes namespace cannot be empty")
	}
	
	return nil
}

// validateAgents validates agents configuration
func (c *Config) validateAgents() error {
	if c.Agents.MaxConcurrent <= 0 {
		return fmt.Errorf("max concurrent agents must be positive")
	}
	
	if c.Agents.RetryAttempts < 0 {
		return fmt.Errorf("retry attempts cannot be negative")
	}
	
	if c.Agents.HeartbeatInterval <= 0 {
		return fmt.Errorf("heartbeat interval must be positive")
	}
	
	if c.Agents.TaskTimeout <= 0 {
		return fmt.Errorf("task timeout must be positive")
	}
	
	// Validate individual agent configurations
	for name, agent := range c.Agents.Configurations {
		if agent.Type == "" {
			return fmt.Errorf("agent %s: type cannot be empty", name)
		}
		
		if agent.MaxRetries < 0 {
			return fmt.Errorf("agent %s: max retries cannot be negative", name)
		}
		
		if agent.Timeout <= 0 {
			return fmt.Errorf("agent %s: timeout must be positive", name)
		}
	}
	
	return nil
}

// validateMonitoring validates monitoring configuration
func (c *Config) validateMonitoring() error {
	if c.Monitoring.Port < 1 || c.Monitoring.Port > 65535 {
		return fmt.Errorf("invalid monitoring port: %d", c.Monitoring.Port)
	}
	
	if c.Monitoring.MetricsPath == "" {
		return fmt.Errorf("metrics path cannot be empty")
	}
	
	if c.Monitoring.HealthPath == "" {
		return fmt.Errorf("health path cannot be empty")
	}
	
	if c.Monitoring.ScrapeInterval <= 0 {
		return fmt.Errorf("scrape interval must be positive")
	}
	
	return nil
}

// validateSecurity validates security configuration
func (c *Config) validateSecurity() error {
	if c.Security.EnableAuth {
		if c.Security.JWTSecret == "" {
			return fmt.Errorf("JWT secret cannot be empty when authentication is enabled")
		}
		
		if len(c.Security.JWTSecret) < 32 {
			return fmt.Errorf("JWT secret must be at least 32 characters")
		}
	}
	
	if c.Security.TokenExpiry <= 0 {
		return fmt.Errorf("token expiry must be positive")
	}
	
	return nil
}