// O-RAN Central Unit (CU) Network Function
// Implements F1, E1, and NGAP interfaces with RRC handling
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/google/uuid"
)

// CU Configuration
type CUConfig struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	F1Interface   F1Config          `json:"f1_interface"`
	E1Interface   E1Config          `json:"e1_interface"`
	NGAPInterface NGAPConfig        `json:"ngap_interface"`
	RRCConfig     RRCConfig         `json:"rrc_config"`
	Metrics       MetricsConfig     `json:"metrics"`
	Security      SecurityConfig    `json:"security"`
	ServiceMesh   ServiceMeshConfig `json:"service_mesh"`
}

// F1 Interface Configuration (CU-DU interface)
type F1Config struct {
	Port         int    `json:"port"`
	Version      string `json:"version"`
	MaxConnections int  `json:"max_connections"`
}

// E1 Interface Configuration (CU-CP/CU-UP split)
type E1Config struct {
	Port         int    `json:"port"`
	CPUPSplit    bool   `json:"cpup_split"`
	BearerSetup  bool   `json:"bearer_setup"`
}

// NGAP Interface Configuration (5G Core connection)
type NGAPConfig struct {
	Port         int      `json:"port"`
	CoreEndpoints []string `json:"core_endpoints"`
	PLMNID       string   `json:"plmn_id"`
	NRCGI        string   `json:"nr_cgi"`
}

// RRC Configuration
type RRCConfig struct {
	Version         string `json:"version"`
	MaxUEs          int    `json:"max_ues"`
	ConnectionSetup bool   `json:"connection_setup"`
	SecurityEnabled bool   `json:"security_enabled"`
}

// Metrics Configuration
type MetricsConfig struct {
	Enabled    bool   `json:"enabled"`
	Port       int    `json:"port"`
	Endpoint   string `json:"endpoint"`
	Interval   int    `json:"interval"`
}

// Security Configuration
type SecurityConfig struct {
	TLSEnabled     bool   `json:"tls_enabled"`
	CertPath       string `json:"cert_path"`
	KeyPath        string `json:"key_path"`
	CACertPath     string `json:"ca_cert_path"`
	MutualTLS      bool   `json:"mutual_tls"`
	JWTValidation  bool   `json:"jwt_validation"`
}

// Service Mesh Configuration
type ServiceMeshConfig struct {
	IstioEnabled   bool   `json:"istio_enabled"`
	TracingEnabled bool   `json:"tracing_enabled"`
	MetricsEnabled bool   `json:"metrics_enabled"`
	Circuit        string `json:"circuit_breaker"`
}

// F1AP Message Types
type F1APMessage struct {
	MessageType string                 `json:"message_type"`
	TransactionID string               `json:"transaction_id"`
	Payload     map[string]interface{} `json:"payload"`
	Timestamp   time.Time              `json:"timestamp"`
}

// RRC Context for UE management
type RRCContext struct {
	UEID        string    `json:"ue_id"`
	State       string    `json:"state"`
	Security    bool      `json:"security_enabled"`
	Bearers     []Bearer  `json:"bearers"`
	LastUpdate  time.Time `json:"last_update"`
}

// Bearer Configuration
type Bearer struct {
	ID       int    `json:"id"`
	Type     string `json:"type"`
	QoS      QoSConfig `json:"qos"`
	Active   bool   `json:"active"`
}

// QoS Configuration
type QoSConfig struct {
	FiveQI   int `json:"five_qi"`
	Priority int `json:"priority"`
	Bitrate  int `json:"bitrate"`
}

// Central Unit Structure
type CentralUnit struct {
	Config       *CUConfig
	F1Handler    *F1InterfaceHandler
	E1Handler    *E1InterfaceHandler
	NGAPHandler  *NGAPInterfaceHandler
	RRCManager   *RRCManager
	UEContexts   map[string]*RRCContext
	Metrics      *MetricsCollector
	mu           sync.RWMutex
	ctx          context.Context
	cancel       context.CancelFunc
}

// F1 Interface Handler
type F1InterfaceHandler struct {
	port       int
	server     *http.Server
	connections map[string]*DUConnection
	mu         sync.RWMutex
}

// DU Connection tracking
type DUConnection struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Status       string    `json:"status"`
	LastHeartbeat time.Time `json:"last_heartbeat"`
	Cells        []CellInfo `json:"cells"`
}

// Cell Information
type CellInfo struct {
	CellID    string `json:"cell_id"`
	PCI       int    `json:"pci"`
	TAC       string `json:"tac"`
	Frequency int    `json:"frequency"`
	Bandwidth int    `json:"bandwidth"`
}

// E1 Interface Handler
type E1InterfaceHandler struct {
	port        int
	server      *http.Server
	upConnections map[string]*UPConnection
	mu          sync.RWMutex
}

// UP Connection tracking
type UPConnection struct {
	ID         string    `json:"id"`
	Status     string    `json:"status"`
	Bearers    []Bearer  `json:"bearers"`
	LastUpdate time.Time `json:"last_update"`
}

// NGAP Interface Handler
type NGAPInterfaceHandler struct {
	port        int
	server      *http.Server
	coreConnections map[string]*CoreConnection
	mu          sync.RWMutex
}

// Core Connection tracking
type CoreConnection struct {
	ID         string    `json:"id"`
	Endpoint   string    `json:"endpoint"`
	Status     string    `json:"status"`
	LastPing   time.Time `json:"last_ping"`
}

// RRC Manager
type RRCManager struct {
	maxUEs      int
	connections map[string]*RRCContext
	mu          sync.RWMutex
}

// Metrics Collector
type MetricsCollector struct {
	port        int
	server      *http.Server
	counters    map[string]int64
	gauges      map[string]float64
	mu          sync.RWMutex
}

// Initialize Central Unit
func NewCentralUnit(configPath string) (*CentralUnit, error) {
	config, err := loadConfig(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())

	cu := &CentralUnit{
		Config:     config,
		UEContexts: make(map[string]*RRCContext),
		ctx:        ctx,
		cancel:     cancel,
	}

	// Initialize components
	cu.F1Handler = NewF1InterfaceHandler(config.F1Interface.Port)
	cu.E1Handler = NewE1InterfaceHandler(config.E1Interface.Port)
	cu.NGAPHandler = NewNGAPInterfaceHandler(config.NGAPInterface.Port)
	cu.RRCManager = NewRRCManager(config.RRCConfig.MaxUEs)
	cu.Metrics = NewMetricsCollector(config.Metrics.Port)

	return cu, nil
}

// Load configuration from file
func loadConfig(configPath string) (*CUConfig, error) {
	if configPath == "" {
		configPath = "/config/cu-config.json"
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		// Return default configuration if file doesn't exist
		return getDefaultConfig(), nil
	}

	var config CUConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %v", err)
	}

	return &config, nil
}

// Default configuration
func getDefaultConfig() *CUConfig {
	return &CUConfig{
		ID:   uuid.New().String(),
		Name: "O-RAN-CU-001",
		F1Interface: F1Config{
			Port:           38472,
			Version:        "16.4.0",
			MaxConnections: 100,
		},
		E1Interface: E1Config{
			Port:        38465,
			CPUPSplit:   true,
			BearerSetup: true,
		},
		NGAPInterface: NGAPConfig{
			Port:          38412,
			CoreEndpoints: []string{"amf:8080", "smf:8080"},
			PLMNID:        "00101",
			NRCGI:         "001010000000001",
		},
		RRCConfig: RRCConfig{
			Version:         "16.4.0",
			MaxUEs:          1000,
			ConnectionSetup: true,
			SecurityEnabled: true,
		},
		Metrics: MetricsConfig{
			Enabled:  true,
			Port:     9090,
			Endpoint: "/metrics",
			Interval: 30,
		},
		Security: SecurityConfig{
			TLSEnabled:    true,
			MutualTLS:     true,
			JWTValidation: true,
		},
		ServiceMesh: ServiceMeshConfig{
			IstioEnabled:   true,
			TracingEnabled: true,
			MetricsEnabled: true,
			Circuit:        "enabled",
		},
	}
}

// Initialize F1 Interface Handler
func NewF1InterfaceHandler(port int) *F1InterfaceHandler {
	return &F1InterfaceHandler{
		port:        port,
		connections: make(map[string]*DUConnection),
	}
}

// Initialize E1 Interface Handler
func NewE1InterfaceHandler(port int) *E1InterfaceHandler {
	return &E1InterfaceHandler{
		port:          port,
		upConnections: make(map[string]*UPConnection),
	}
}

// Initialize NGAP Interface Handler
func NewNGAPInterfaceHandler(port int) *NGAPInterfaceHandler {
	return &NGAPInterfaceHandler{
		port:            port,
		coreConnections: make(map[string]*CoreConnection),
	}
}

// Initialize RRC Manager
func NewRRCManager(maxUEs int) *RRCManager {
	return &RRCManager{
		maxUEs:      maxUEs,
		connections: make(map[string]*RRCContext),
	}
}

// Initialize Metrics Collector
func NewMetricsCollector(port int) *MetricsCollector {
	return &MetricsCollector{
		port:     port,
		counters: make(map[string]int64),
		gauges:   make(map[string]float64),
	}
}

// Start Central Unit
func (cu *CentralUnit) Start() error {
	log.Printf("Starting O-RAN Central Unit: %s", cu.Config.Name)

	// Start F1 Interface
	go cu.F1Handler.Start()
	log.Printf("F1 Interface started on port %d", cu.Config.F1Interface.Port)

	// Start E1 Interface
	go cu.E1Handler.Start()
	log.Printf("E1 Interface started on port %d", cu.Config.E1Interface.Port)

	// Start NGAP Interface
	go cu.NGAPHandler.Start()
	log.Printf("NGAP Interface started on port %d", cu.Config.NGAPInterface.Port)

	// Start Metrics
	if cu.Config.Metrics.Enabled {
		go cu.Metrics.Start()
		log.Printf("Metrics server started on port %d", cu.Config.Metrics.Port)
	}

	// Start monitoring routines
	go cu.monitorHealth()
	go cu.collectMetrics()

	log.Printf("Central Unit %s is running", cu.Config.Name)
	return nil
}

// F1 Interface Start
func (f1 *F1InterfaceHandler) Start() error {
	mux := http.NewServeMux()
	
	// F1AP endpoints
	mux.HandleFunc("/f1ap/setup", f1.handleF1Setup)
	mux.HandleFunc("/f1ap/configuration-update", f1.handleConfigurationUpdate)
	mux.HandleFunc("/f1ap/ue-context-setup", f1.handleUEContextSetup)
	mux.HandleFunc("/f1ap/ue-context-release", f1.handleUEContextRelease)
	mux.HandleFunc("/f1ap/dl-rrc-message-transfer", f1.handleDLRRCMessageTransfer)
	mux.HandleFunc("/f1ap/ul-rrc-message-transfer", f1.handleULRRCMessageTransfer)
	mux.HandleFunc("/f1ap/initial-ul-rrc-message-transfer", f1.handleInitialULRRCMessageTransfer)
	mux.HandleFunc("/f1ap/system-information-delivery-command", f1.handleSystemInformationDeliveryCommand)

	f1.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", f1.port),
		Handler: mux,
	}

	return f1.server.ListenAndServe()
}

// F1 Setup Request Handler
func (f1 *F1InterfaceHandler) handleF1Setup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid F1 Setup Request", http.StatusBadRequest)
		return
	}

	// Process F1 Setup
	duID := setupReq.Payload["gnb_du_id"].(string)
	duName := setupReq.Payload["gnb_du_name"].(string)

	f1.mu.Lock()
	f1.connections[duID] = &DUConnection{
		ID:            duID,
		Name:          duName,
		Status:        "connected",
		LastHeartbeat: time.Now(),
		Cells:         []CellInfo{},
	}
	f1.mu.Unlock()

	// F1 Setup Response
	response := F1APMessage{
		MessageType:   "F1SetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"gnb_cu_id":   "001",
			"gnb_cu_name": "O-RAN-CU-001",
			"status":      "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	log.Printf("F1 Setup completed for DU: %s", duName)
}

// Configuration Update Handler
func (f1 *F1InterfaceHandler) handleConfigurationUpdate(w http.ResponseWriter, r *http.Request) {
	var updateReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&updateReq); err != nil {
		http.Error(w, "Invalid Configuration Update Request", http.StatusBadRequest)
		return
	}

	// Process configuration update
	response := F1APMessage{
		MessageType:   "GNBDUConfigurationUpdateAcknowledge",
		TransactionID: updateReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UE Context Setup Handler
func (f1 *F1InterfaceHandler) handleUEContextSetup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid UE Context Setup Request", http.StatusBadRequest)
		return
	}

	// Process UE context setup
	response := F1APMessage{
		MessageType:   "UEContextSetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"ue_id": setupReq.Payload["ue_id"],
			"status": "success",
			"drb_setup_list": []map[string]interface{}{
				{
					"drb_id": 1,
					"status": "success",
				},
			},
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UE Context Release Handler
func (f1 *F1InterfaceHandler) handleUEContextRelease(w http.ResponseWriter, r *http.Request) {
	var releaseReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&releaseReq); err != nil {
		http.Error(w, "Invalid UE Context Release Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "UEContextReleaseComplete",
		TransactionID: releaseReq.TransactionID,
		Payload: map[string]interface{}{
			"ue_id": releaseReq.Payload["ue_id"],
			"status": "released",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DL RRC Message Transfer Handler
func (f1 *F1InterfaceHandler) handleDLRRCMessageTransfer(w http.ResponseWriter, r *http.Request) {
	var dlReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&dlReq); err != nil {
		http.Error(w, "Invalid DL RRC Message Transfer Request", http.StatusBadRequest)
		return
	}

	// Process DL RRC message
	log.Printf("DL RRC Message transferred for UE: %v", dlReq.Payload["ue_id"])
	
	w.WriteHeader(http.StatusOK)
}

// UL RRC Message Transfer Handler
func (f1 *F1InterfaceHandler) handleULRRCMessageTransfer(w http.ResponseWriter, r *http.Request) {
	var ulReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&ulReq); err != nil {
		http.Error(w, "Invalid UL RRC Message Transfer Request", http.StatusBadRequest)
		return
	}

	// Process UL RRC message
	log.Printf("UL RRC Message received for UE: %v", ulReq.Payload["ue_id"])
	
	w.WriteHeader(http.StatusOK)
}

// Initial UL RRC Message Transfer Handler
func (f1 *F1InterfaceHandler) handleInitialULRRCMessageTransfer(w http.ResponseWriter, r *http.Request) {
	var initReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&initReq); err != nil {
		http.Error(w, "Invalid Initial UL RRC Message Transfer Request", http.StatusBadRequest)
		return
	}

	// Process initial UL RRC message
	log.Printf("Initial UL RRC Message received for UE: %v", initReq.Payload["ue_id"])
	
	w.WriteHeader(http.StatusOK)
}

// System Information Delivery Command Handler
func (f1 *F1InterfaceHandler) handleSystemInformationDeliveryCommand(w http.ResponseWriter, r *http.Request) {
	var siReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&siReq); err != nil {
		http.Error(w, "Invalid SI Delivery Command Request", http.StatusBadRequest)
		return
	}

	// Process system information delivery
	log.Printf("System Information delivered to cell: %v", siReq.Payload["cell_id"])
	
	w.WriteHeader(http.StatusOK)
}

// E1 Interface Start
func (e1 *E1InterfaceHandler) Start() error {
	mux := http.NewServeMux()
	
	// E1AP endpoints
	mux.HandleFunc("/e1ap/setup", e1.handleE1Setup)
	mux.HandleFunc("/e1ap/bearer-context-setup", e1.handleBearerContextSetup)
	mux.HandleFunc("/e1ap/bearer-context-modification", e1.handleBearerContextModification)
	mux.HandleFunc("/e1ap/bearer-context-release", e1.handleBearerContextRelease)

	e1.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", e1.port),
		Handler: mux,
	}

	return e1.server.ListenAndServe()
}

// E1 Setup Handler
func (e1 *E1InterfaceHandler) handleE1Setup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid E1 Setup Request", http.StatusBadRequest)
		return
	}

	// Process E1 Setup
	upID := setupReq.Payload["gnb_cu_up_id"].(string)

	e1.mu.Lock()
	e1.upConnections[upID] = &UPConnection{
		ID:         upID,
		Status:     "connected",
		Bearers:    []Bearer{},
		LastUpdate: time.Now(),
	}
	e1.mu.Unlock()

	// E1 Setup Response
	response := F1APMessage{
		MessageType:   "GNBCUUPE1SetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"gnb_cu_cp_id": "001",
			"status":       "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	log.Printf("E1 Setup completed for CU-UP: %s", upID)
}

// Bearer Context Setup Handler
func (e1 *E1InterfaceHandler) handleBearerContextSetup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid Bearer Context Setup Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "BearerContextSetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "success",
			"bearer_contexts_setup": []map[string]interface{}{
				{
					"pdu_session_id": 1,
					"status": "success",
				},
			},
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Bearer Context Modification Handler
func (e1 *E1InterfaceHandler) handleBearerContextModification(w http.ResponseWriter, r *http.Request) {
	var modReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&modReq); err != nil {
		http.Error(w, "Invalid Bearer Context Modification Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "BearerContextModificationResponse",
		TransactionID: modReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Bearer Context Release Handler
func (e1 *E1InterfaceHandler) handleBearerContextRelease(w http.ResponseWriter, r *http.Request) {
	var releaseReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&releaseReq); err != nil {
		http.Error(w, "Invalid Bearer Context Release Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "BearerContextReleaseComplete",
		TransactionID: releaseReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "released",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// NGAP Interface Start
func (ngap *NGAPInterfaceHandler) Start() error {
	mux := http.NewServeMux()
	
	// NGAP endpoints
	mux.HandleFunc("/ngap/ng-setup", ngap.handleNGSetup)
	mux.HandleFunc("/ngap/initial-context-setup", ngap.handleInitialContextSetup)
	mux.HandleFunc("/ngap/ue-context-release", ngap.handleUEContextRelease)
	mux.HandleFunc("/ngap/pdu-session-resource-setup", ngap.handlePDUSessionResourceSetup)

	ngap.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", ngap.port),
		Handler: mux,
	}

	return ngap.server.ListenAndServe()
}

// NG Setup Handler
func (ngap *NGAPInterfaceHandler) handleNGSetup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid NG Setup Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "NGSetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"amf_name": "O-RAN-AMF-001",
			"status":   "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Initial Context Setup Handler
func (ngap *NGAPInterfaceHandler) handleInitialContextSetup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid Initial Context Setup Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "InitialContextSetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UE Context Release Handler (NGAP)
func (ngap *NGAPInterfaceHandler) handleUEContextRelease(w http.ResponseWriter, r *http.Request) {
	var releaseReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&releaseReq); err != nil {
		http.Error(w, "Invalid UE Context Release Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "UEContextReleaseComplete",
		TransactionID: releaseReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "released",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// PDU Session Resource Setup Handler
func (ngap *NGAPInterfaceHandler) handlePDUSessionResourceSetup(w http.ResponseWriter, r *http.Request) {
	var setupReq F1APMessage
	if err := json.NewDecoder(r.Body).Decode(&setupReq); err != nil {
		http.Error(w, "Invalid PDU Session Resource Setup Request", http.StatusBadRequest)
		return
	}

	response := F1APMessage{
		MessageType:   "PDUSessionResourceSetupResponse",
		TransactionID: setupReq.TransactionID,
		Payload: map[string]interface{}{
			"status": "success",
		},
		Timestamp: time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Metrics Start
func (m *MetricsCollector) Start() error {
	mux := http.NewServeMux()
	
	mux.HandleFunc("/metrics", m.handleMetrics)
	mux.HandleFunc("/health", m.handleHealth)

	m.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", m.port),
		Handler: mux,
	}

	return m.server.ListenAndServe()
}

// Handle metrics endpoint
func (m *MetricsCollector) handleMetrics(w http.ResponseWriter, r *http.Request) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	w.Header().Set("Content-Type", "text/plain")
	
	// Export metrics in Prometheus format
	for name, value := range m.counters {
		fmt.Fprintf(w, "# TYPE %s counter\n", name)
		fmt.Fprintf(w, "%s %d\n", name, value)
	}
	
	for name, value := range m.gauges {
		fmt.Fprintf(w, "# TYPE %s gauge\n", name)
		fmt.Fprintf(w, "%s %.2f\n", name, value)
	}
}

// Handle health endpoint
func (m *MetricsCollector) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Monitor health
func (cu *CentralUnit) monitorHealth() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Check F1 connections
			cu.F1Handler.mu.RLock()
			activeF1Connections := len(cu.F1Handler.connections)
			cu.F1Handler.mu.RUnlock()

			// Check E1 connections
			cu.E1Handler.mu.RLock()
			activeE1Connections := len(cu.E1Handler.upConnections)
			cu.E1Handler.mu.RUnlock()

			// Check NGAP connections
			cu.NGAPHandler.mu.RLock()
			activeNGAPConnections := len(cu.NGAPHandler.coreConnections)
			cu.NGAPHandler.mu.RUnlock()

			// Update metrics
			cu.Metrics.mu.Lock()
			cu.Metrics.gauges["f1_active_connections"] = float64(activeF1Connections)
			cu.Metrics.gauges["e1_active_connections"] = float64(activeE1Connections)
			cu.Metrics.gauges["ngap_active_connections"] = float64(activeNGAPConnections)
			cu.Metrics.mu.Unlock()

			log.Printf("Health check: F1=%d, E1=%d, NGAP=%d connections", 
				activeF1Connections, activeE1Connections, activeNGAPConnections)

		case <-cu.ctx.Done():
			return
		}
	}
}

// Collect metrics
func (cu *CentralUnit) collectMetrics() {
	ticker := time.NewTicker(time.Duration(cu.Config.Metrics.Interval) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			cu.Metrics.mu.Lock()
			
			// Update counters
			cu.Metrics.counters["f1ap_messages_total"]++
			cu.Metrics.counters["e1ap_messages_total"]++
			cu.Metrics.counters["ngap_messages_total"]++
			
			// Update gauges
			cu.Metrics.gauges["uptime_seconds"] = time.Since(time.Now().Add(-time.Minute)).Seconds()
			cu.Metrics.gauges["active_ue_contexts"] = float64(len(cu.UEContexts))
			
			cu.Metrics.mu.Unlock()

		case <-cu.ctx.Done():
			return
		}
	}
}

// Stop Central Unit
func (cu *CentralUnit) Stop() {
	log.Println("Stopping Central Unit...")
	
	cu.cancel()
	
	if cu.F1Handler.server != nil {
		cu.F1Handler.server.Close()
	}
	if cu.E1Handler.server != nil {
		cu.E1Handler.server.Close()
	}
	if cu.NGAPHandler.server != nil {
		cu.NGAPHandler.server.Close()
	}
	if cu.Metrics.server != nil {
		cu.Metrics.server.Close()
	}
	
	log.Println("Central Unit stopped")
}

// Main function
func main() {
	configPath := os.Getenv("CU_CONFIG_PATH")
	
	cu, err := NewCentralUnit(configPath)
	if err != nil {
		log.Fatalf("Failed to initialize Central Unit: %v", err)
	}

	// Handle shutdown gracefully
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Received shutdown signal")
		cu.Stop()
		os.Exit(0)
	}()

	if err := cu.Start(); err != nil {
		log.Fatalf("Failed to start Central Unit: %v", err)
	}
}