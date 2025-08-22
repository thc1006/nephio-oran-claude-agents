// SMO Client Implementation - Service Management and Orchestration
// O-RAN L Release compatible
package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// SMOClient handles communication with the Service Management and Orchestration system
type SMOClient struct {
	logger     *slog.Logger
	httpClient *http.Client
	config     SMOConfig
	connected  bool
	mu         sync.RWMutex
}

// NewSMOClient creates a new SMO client
func NewSMOClient(logger *slog.Logger) *SMOClient {
	return &SMOClient{
		logger: logger.With(slog.String("component", "SMOClient")),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Connect establishes connection to SMO
func (s *SMOClient) Connect(ctx context.Context, config SMOConfig) error {
	s.logger.InfoContext(ctx, "Connecting to SMO",
		slog.String("endpoint", config.Endpoint),
		slog.Bool("ai_ml_enabled", config.AIMLEnabled))

	s.mu.Lock()
	s.config = config
	s.mu.Unlock()

	// Test connection
	req, err := http.NewRequestWithContext(ctx, "GET", 
		fmt.Sprintf("%s/api/v1/health", config.Endpoint), nil)
	if err != nil {
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	if config.AuthType != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "test-token"))
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.ErrorContext(ctx, "SMO health check failed",
			slog.String("error", err.Error()))
		return fmt.Errorf("SMO health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("SMO health check returned status %d", resp.StatusCode)
	}

	s.mu.Lock()
	s.connected = true
	s.mu.Unlock()

	s.logger.InfoContext(ctx, "Successfully connected to SMO")
	return nil
}

// RegisterOCloud registers the O-Cloud with SMO
func (s *SMOClient) RegisterOCloud(ctx context.Context, ocloud *OCloud) error {
	s.logger.InfoContext(ctx, "Registering O-Cloud with SMO",
		slog.String("ocloud_name", ocloud.Name))

	registration := OCloudRegistration{
		ID:                 ocloud.Name,
		Name:               ocloud.Name,
		Description:        fmt.Sprintf("O-Cloud instance %s", ocloud.Name),
		InfrastructureType: ocloud.Spec.InfrastructureType,
		Regions:            ocloud.Spec.Regions,
		ResourcePools:      s.convertResourcePools(ocloud.Spec.ResourcePools),
		O2InterfaceVersion: ocloud.Spec.O2Interface.Version,
		Capabilities:       ocloud.Spec.SMO.Capabilities,
		RegisteredAt:       time.Now(),
	}

	data, err := json.Marshal(registration)
	if err != nil {
		return fmt.Errorf("failed to marshal registration data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/api/v1/oclouds", s.config.Endpoint),
		bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to create registration request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if s.config.AuthType != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "test-token"))
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.logger.ErrorContext(ctx, "O-Cloud registration failed",
			slog.String("error", err.Error()))
		return fmt.Errorf("O-Cloud registration failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("O-Cloud registration returned status %d", resp.StatusCode)
	}

	s.logger.InfoContext(ctx, "O-Cloud registered successfully with SMO")
	return nil
}

// ReportResourceUpdate reports resource updates to SMO
func (s *SMOClient) ReportResourceUpdate(ctx context.Context, update ResourceUpdate) error {
	s.logger.DebugContext(ctx, "Reporting resource update to SMO",
		slog.String("resource_type", update.ResourceType))

	data, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("failed to marshal update data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/api/v1/resource-updates", s.config.Endpoint),
		bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to create update request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if s.config.AuthType != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "test-token"))
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send resource update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("resource update returned status %d", resp.StatusCode)
	}

	return nil
}

// GetPolicies retrieves policies from SMO
func (s *SMOClient) GetPolicies(ctx context.Context, oCloudID string) ([]Policy, error) {
	s.logger.DebugContext(ctx, "Fetching policies from SMO",
		slog.String("ocloud_id", oCloudID))

	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/api/v1/oclouds/%s/policies", s.config.Endpoint, oCloudID),
		nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create policies request: %w", err)
	}

	if s.config.AuthType != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "test-token"))
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch policies: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("policies fetch returned status %d", resp.StatusCode)
	}

	var policies []Policy
	if err := json.NewDecoder(resp.Body).Decode(&policies); err != nil {
		return nil, fmt.Errorf("failed to decode policies: %w", err)
	}

	s.logger.InfoContext(ctx, "Fetched policies from SMO",
		slog.Int("policy_count", len(policies)))

	return policies, nil
}

// SendAlarm sends an alarm to SMO
func (s *SMOClient) SendAlarm(ctx context.Context, alarm Alarm) error {
	s.logger.WarnContext(ctx, "Sending alarm to SMO",
		slog.String("alarm_type", alarm.Type),
		slog.String("severity", alarm.Severity))

	data, err := json.Marshal(alarm)
	if err != nil {
		return fmt.Errorf("failed to marshal alarm data: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/api/v1/alarms", s.config.Endpoint),
		bytes.NewBuffer(data))
	if err != nil {
		return fmt.Errorf("failed to create alarm request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if s.config.AuthType != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", "test-token"))
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send alarm: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("alarm send returned status %d", resp.StatusCode)
	}

	return nil
}

// convertResourcePools converts resource pools to SMO format
func (s *SMOClient) convertResourcePools(pools []ResourcePool) []SMOResourcePool {
	smoPool := make([]SMOResourcePool, len(pools))
	for i, pool := range pools {
		smoPool[i] = SMOResourcePool{
			Name:     pool.Name,
			Type:     pool.Type,
			Location: pool.Location,
			Capacity: SMOResourceCapacity{
				CPU:     pool.Capacity.CPU,
				Memory:  pool.Capacity.Memory,
				Storage: pool.Capacity.Storage,
				Network: pool.Capacity.Network,
			},
		}
	}
	return smoPool
}

// IsConnected checks if SMO client is connected
func (s *SMOClient) IsConnected() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.connected
}

// SMO data structures

// OCloudRegistration represents O-Cloud registration data
type OCloudRegistration struct {
	ID                 string             `json:"id"`
	Name               string             `json:"name"`
	Description        string             `json:"description"`
	InfrastructureType string             `json:"infrastructureType"`
	Regions            []string           `json:"regions"`
	ResourcePools      []SMOResourcePool  `json:"resourcePools"`
	O2InterfaceVersion string             `json:"o2InterfaceVersion"`
	Capabilities       []string           `json:"capabilities"`
	RegisteredAt       time.Time          `json:"registeredAt"`
}

// SMOResourcePool represents a resource pool in SMO format
type SMOResourcePool struct {
	Name     string               `json:"name"`
	Type     string               `json:"type"`
	Location string               `json:"location"`
	Capacity SMOResourceCapacity  `json:"capacity"`
}

// SMOResourceCapacity represents resource capacity in SMO format
type SMOResourceCapacity struct {
	CPU     string `json:"cpu"`
	Memory  string `json:"memory"`
	Storage string `json:"storage"`
	Network string `json:"network"`
}

// ResourceUpdate represents a resource update notification
type ResourceUpdate struct {
	OCloudID      string                 `json:"oCloudId"`
	ResourceType  string                 `json:"resourceType"`
	ResourceID    string                 `json:"resourceId"`
	UpdateType    string                 `json:"updateType"`
	OldValue      map[string]interface{} `json:"oldValue,omitempty"`
	NewValue      map[string]interface{} `json:"newValue"`
	Timestamp     time.Time              `json:"timestamp"`
}

// Policy represents an SMO policy
type Policy struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Priority    int                    `json:"priority"`
	Conditions  []PolicyCondition      `json:"conditions"`
	Actions     []PolicyAction         `json:"actions"`
	Parameters  map[string]interface{} `json:"parameters"`
	ValidFrom   time.Time              `json:"validFrom"`
	ValidUntil  time.Time              `json:"validUntil"`
}

// PolicyCondition represents a policy condition
type PolicyCondition struct {
	Type      string `json:"type"`
	Operator  string `json:"operator"`
	Value     string `json:"value"`
}

// PolicyAction represents a policy action
type PolicyAction struct {
	Type       string                 `json:"type"`
	Target     string                 `json:"target"`
	Parameters map[string]interface{} `json:"parameters"`
}

// Alarm represents an alarm notification
type Alarm struct {
	ID           string                 `json:"id"`
	Type         string                 `json:"type"`
	Severity     string                 `json:"severity"`
	Source       string                 `json:"source"`
	Description  string                 `json:"description"`
	Details      map[string]interface{} `json:"details"`
	Timestamp    time.Time              `json:"timestamp"`
	Acknowledged bool                   `json:"acknowledged"`
}