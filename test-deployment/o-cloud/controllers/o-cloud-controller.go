// O-Cloud Controller Implementation
// Nephio R5 / O-RAN L Release compatible
package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
)

// OCloudSpec defines the desired state of OCloud
type OCloudSpec struct {
	// SMO configuration
	SMO SMOConfig `json:"smo"`
	
	// Resource pools
	ResourcePools []ResourcePool `json:"resourcePools"`
	
	// O2 Interface configuration
	O2Interface O2InterfaceConfig `json:"o2Interface"`
	
	// Cloud infrastructure type
	InfrastructureType string `json:"infrastructureType"`
	
	// Deployment regions
	Regions []string `json:"regions"`
}

// SMOConfig represents Service Management and Orchestration configuration
type SMOConfig struct {
	Enabled       bool              `json:"enabled"`
	Endpoint      string            `json:"endpoint"`
	AuthType      string            `json:"authType"`
	Capabilities  []string          `json:"capabilities"`
	AIMLEnabled   bool              `json:"aimlEnabled"`
}

// ResourcePool represents a pool of cloud resources
type ResourcePool struct {
	Name         string            `json:"name"`
	Type         string            `json:"type"`
	Location     string            `json:"location"`
	Capacity     ResourceCapacity  `json:"capacity"`
	Labels       map[string]string `json:"labels"`
}

// ResourceCapacity defines resource limits
type ResourceCapacity struct {
	CPU     string `json:"cpu"`
	Memory  string `json:"memory"`
	Storage string `json:"storage"`
	Network string `json:"network"`
}

// O2InterfaceConfig represents O2 interface configuration
type O2InterfaceConfig struct {
	Enabled      bool     `json:"enabled"`
	Version      string   `json:"version"`
	Endpoints    []string `json:"endpoints"`
	AuthEnabled  bool     `json:"authEnabled"`
}

// OCloudStatus defines the observed state of OCloud
type OCloudStatus struct {
	Phase             string            `json:"phase"`
	Message           string            `json:"message,omitempty"`
	ResourceInventory ResourceInventory `json:"resourceInventory"`
	SMOStatus         string            `json:"smoStatus"`
	O2Status          string            `json:"o2Status"`
	LastReconciled    time.Time         `json:"lastReconciled"`
	Conditions        []Condition       `json:"conditions,omitempty"`
}

// ResourceInventory tracks available resources
type ResourceInventory struct {
	TotalCPU        int64             `json:"totalCpu"`
	AvailableCPU    int64             `json:"availableCpu"`
	TotalMemory     int64             `json:"totalMemory"`
	AvailableMemory int64             `json:"availableMemory"`
	TotalStorage    int64             `json:"totalStorage"`
	AvailableStorage int64            `json:"availableStorage"`
	ResourceTypes   map[string]int    `json:"resourceTypes"`
}

// Condition represents a status condition
type Condition struct {
	Type               string    `json:"type"`
	Status             string    `json:"status"`
	LastTransitionTime time.Time `json:"lastTransitionTime"`
	Reason             string    `json:"reason,omitempty"`
	Message            string    `json:"message,omitempty"`
}

// OCloud is the Schema for the oclouds API
type OCloud struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   OCloudSpec   `json:"spec,omitempty"`
	Status OCloudStatus `json:"status,omitempty"`
}

// OCloudList contains a list of OCloud
type OCloudList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []OCloud `json:"items"`
}

// OCloudReconciler reconciles an OCloud object
type OCloudReconciler struct {
	client.Client
	Scheme           *runtime.Scheme
	Logger           *slog.Logger
	SMOClient        *SMOClient
	O2Client         *O2InterfaceClient
	ResourceManager  *CloudResourceManager
	TelemetryManager *TelemetryManager
	mu               sync.RWMutex
}

// NewOCloudReconciler creates a new reconciler
func NewOCloudReconciler(client client.Client, scheme *runtime.Scheme) *OCloudReconciler {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})).With(
		slog.String("component", "OCloudReconciler"),
		slog.String("version", "l-release"),
	)

	return &OCloudReconciler{
		Client:          client,
		Scheme:          scheme,
		Logger:          logger,
		SMOClient:       NewSMOClient(logger),
		O2Client:        NewO2InterfaceClient(logger),
		ResourceManager: NewCloudResourceManager(logger),
		TelemetryManager: NewTelemetryManager(logger),
	}
}

// Reconcile handles the reconciliation loop
func (r *OCloudReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	correlationID := uuid.New().String()
	ctx = context.WithValue(ctx, "correlation_id", correlationID)
	
	r.Logger.InfoContext(ctx, "Starting O-Cloud reconciliation",
		slog.String("name", req.Name),
		slog.String("namespace", req.Namespace),
		slog.String("correlation_id", correlationID))

	// Fetch the OCloud instance
	var ocloud OCloud
	if err := r.Get(ctx, req.NamespacedName, &ocloud); err != nil {
		if client.IgnoreNotFound(err) == nil {
			r.Logger.DebugContext(ctx, "OCloud resource not found, likely deleted")
			return ctrl.Result{}, nil
		}
		r.Logger.ErrorContext(ctx, "Failed to fetch OCloud resource",
			slog.String("error", err.Error()))
		return ctrl.Result{RequeueAfter: 30 * time.Second}, err
	}

	// Initialize status if needed
	if ocloud.Status.Phase == "" {
		ocloud.Status.Phase = "Initializing"
		ocloud.Status.ResourceInventory = ResourceInventory{
			ResourceTypes: make(map[string]int),
		}
	}

	// Reconcile SMO
	if err := r.reconcileSMO(ctx, &ocloud); err != nil {
		r.updateStatus(ctx, &ocloud, "Error", fmt.Sprintf("SMO reconciliation failed: %v", err))
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, err
	}

	// Reconcile O2 Interface
	if err := r.reconcileO2Interface(ctx, &ocloud); err != nil {
		r.updateStatus(ctx, &ocloud, "Error", fmt.Sprintf("O2 interface reconciliation failed: %v", err))
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, err
	}

	// Reconcile Resource Pools
	if err := r.reconcileResourcePools(ctx, &ocloud); err != nil {
		r.updateStatus(ctx, &ocloud, "Error", fmt.Sprintf("Resource pool reconciliation failed: %v", err))
		return ctrl.Result{RequeueAfter: 1 * time.Minute}, err
	}

	// Update resource inventory
	if err := r.updateResourceInventory(ctx, &ocloud); err != nil {
		r.Logger.WarnContext(ctx, "Failed to update resource inventory",
			slog.String("error", err.Error()))
	}

	// Collect telemetry
	if err := r.collectTelemetry(ctx, &ocloud); err != nil {
		r.Logger.WarnContext(ctx, "Failed to collect telemetry",
			slog.String("error", err.Error()))
	}

	// Update status
	r.updateStatus(ctx, &ocloud, "Ready", "O-Cloud is operational")
	
	r.Logger.InfoContext(ctx, "O-Cloud reconciliation completed successfully",
		slog.String("name", req.Name))

	// Requeue after 5 minutes for periodic reconciliation
	return ctrl.Result{RequeueAfter: 5 * time.Minute}, nil
}

// reconcileSMO handles SMO reconciliation
func (r *OCloudReconciler) reconcileSMO(ctx context.Context, ocloud *OCloud) error {
	if !ocloud.Spec.SMO.Enabled {
		r.Logger.DebugContext(ctx, "SMO is disabled, skipping reconciliation")
		ocloud.Status.SMOStatus = "Disabled"
		return nil
	}

	r.Logger.InfoContext(ctx, "Reconciling SMO",
		slog.String("endpoint", ocloud.Spec.SMO.Endpoint))

	// Initialize SMO connection
	if err := r.SMOClient.Connect(ctx, ocloud.Spec.SMO); err != nil {
		ocloud.Status.SMOStatus = "Disconnected"
		return fmt.Errorf("failed to connect to SMO: %w", err)
	}

	// Register O-Cloud with SMO
	if err := r.SMOClient.RegisterOCloud(ctx, ocloud); err != nil {
		ocloud.Status.SMOStatus = "Registration Failed"
		return fmt.Errorf("failed to register O-Cloud with SMO: %w", err)
	}

	ocloud.Status.SMOStatus = "Connected"
	r.Logger.InfoContext(ctx, "SMO reconciliation completed successfully")
	return nil
}

// reconcileO2Interface handles O2 interface reconciliation
func (r *OCloudReconciler) reconcileO2Interface(ctx context.Context, ocloud *OCloud) error {
	if !ocloud.Spec.O2Interface.Enabled {
		r.Logger.DebugContext(ctx, "O2 interface is disabled, skipping reconciliation")
		ocloud.Status.O2Status = "Disabled"
		return nil
	}

	r.Logger.InfoContext(ctx, "Reconciling O2 interface",
		slog.String("version", ocloud.Spec.O2Interface.Version))

	// Initialize O2 interface
	if err := r.O2Client.Initialize(ctx, ocloud.Spec.O2Interface); err != nil {
		ocloud.Status.O2Status = "Initialization Failed"
		return fmt.Errorf("failed to initialize O2 interface: %w", err)
	}

	// Start O2 API server
	if err := r.O2Client.StartAPIServer(ctx); err != nil {
		ocloud.Status.O2Status = "API Server Failed"
		return fmt.Errorf("failed to start O2 API server: %w", err)
	}

	ocloud.Status.O2Status = "Active"
	r.Logger.InfoContext(ctx, "O2 interface reconciliation completed successfully")
	return nil
}

// reconcileResourcePools handles resource pool reconciliation
func (r *OCloudReconciler) reconcileResourcePools(ctx context.Context, ocloud *OCloud) error {
	r.Logger.InfoContext(ctx, "Reconciling resource pools",
		slog.Int("pool_count", len(ocloud.Spec.ResourcePools)))

	for _, pool := range ocloud.Spec.ResourcePools {
		r.Logger.DebugContext(ctx, "Processing resource pool",
			slog.String("pool_name", pool.Name),
			slog.String("pool_type", pool.Type))

		// Create or update resource pool
		if err := r.ResourceManager.EnsureResourcePool(ctx, pool); err != nil {
			return fmt.Errorf("failed to ensure resource pool %s: %w", pool.Name, err)
		}

		// Create namespace for the pool
		namespace := &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: fmt.Sprintf("ocloud-%s", pool.Name),
				Labels: map[string]string{
					"ocloud.oran.io/pool":     pool.Name,
					"ocloud.oran.io/type":     pool.Type,
					"ocloud.oran.io/location": pool.Location,
				},
			},
		}

		if err := r.Create(ctx, namespace); err != nil {
			if !client.IgnoreAlreadyExists(err) {
				return fmt.Errorf("failed to create namespace for pool %s: %w", pool.Name, err)
			}
		}

		// Apply resource quotas
		quota := &corev1.ResourceQuota{
			ObjectMeta: metav1.ObjectMeta{
				Name:      fmt.Sprintf("%s-quota", pool.Name),
				Namespace: namespace.Name,
			},
			Spec: corev1.ResourceQuotaSpec{
				Hard: corev1.ResourceList{
					corev1.ResourceCPU:    resource.MustParse(pool.Capacity.CPU),
					corev1.ResourceMemory: resource.MustParse(pool.Capacity.Memory),
					corev1.ResourceStorage: resource.MustParse(pool.Capacity.Storage),
				},
			},
		}

		if err := r.Create(ctx, quota); err != nil {
			if !client.IgnoreAlreadyExists(err) {
				return fmt.Errorf("failed to create resource quota for pool %s: %w", pool.Name, err)
			}
		}
	}

	r.Logger.InfoContext(ctx, "Resource pool reconciliation completed successfully")
	return nil
}

// updateResourceInventory updates the resource inventory
func (r *OCloudReconciler) updateResourceInventory(ctx context.Context, ocloud *OCloud) error {
	r.Logger.DebugContext(ctx, "Updating resource inventory")

	inventory, err := r.ResourceManager.GetResourceInventory(ctx, ocloud.Spec.ResourcePools)
	if err != nil {
		return fmt.Errorf("failed to get resource inventory: %w", err)
	}

	r.mu.Lock()
	ocloud.Status.ResourceInventory = *inventory
	r.mu.Unlock()

	r.Logger.InfoContext(ctx, "Resource inventory updated",
		slog.Int64("total_cpu", inventory.TotalCPU),
		slog.Int64("available_cpu", inventory.AvailableCPU))

	return nil
}

// collectTelemetry collects telemetry data
func (r *OCloudReconciler) collectTelemetry(ctx context.Context, ocloud *OCloud) error {
	r.Logger.DebugContext(ctx, "Collecting telemetry data")

	metrics := TelemetryMetrics{
		Timestamp:       time.Now(),
		OCloudName:      ocloud.Name,
		ResourcePools:   len(ocloud.Spec.ResourcePools),
		TotalCPU:        ocloud.Status.ResourceInventory.TotalCPU,
		AvailableCPU:    ocloud.Status.ResourceInventory.AvailableCPU,
		TotalMemory:     ocloud.Status.ResourceInventory.TotalMemory,
		AvailableMemory: ocloud.Status.ResourceInventory.AvailableMemory,
	}

	if err := r.TelemetryManager.RecordMetrics(ctx, metrics); err != nil {
		return fmt.Errorf("failed to record telemetry metrics: %w", err)
	}

	return nil
}

// updateStatus updates the OCloud status
func (r *OCloudReconciler) updateStatus(ctx context.Context, ocloud *OCloud, phase, message string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	ocloud.Status.Phase = phase
	ocloud.Status.Message = message
	ocloud.Status.LastReconciled = time.Now()

	// Add or update condition
	condition := Condition{
		Type:               phase,
		Status:             "True",
		LastTransitionTime: time.Now(),
		Message:            message,
	}

	// Update conditions list
	found := false
	for i, c := range ocloud.Status.Conditions {
		if c.Type == phase {
			ocloud.Status.Conditions[i] = condition
			found = true
			break
		}
	}
	if !found {
		ocloud.Status.Conditions = append(ocloud.Status.Conditions, condition)
	}

	if err := r.Status().Update(ctx, ocloud); err != nil {
		r.Logger.WarnContext(ctx, "Failed to update OCloud status",
			slog.String("error", err.Error()))
	}
}

// SetupWithManager sets up the controller with the Manager
func (r *OCloudReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&OCloud{}).
		Complete(r)
}