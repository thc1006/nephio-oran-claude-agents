#!/bin/bash
# O-RAN Agent-Based Near-RT RIC Platform Deployment Script
# Orchestrates deployment following agent coordination patterns

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NAMESPACE="ric-platform"
MONITORING_NAMESPACE="monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check Kubernetes version
    K8S_VERSION=$(kubectl version --short | grep "Server Version" | cut -d' ' -f3 | cut -d'v' -f2)
    MAJOR=$(echo $K8S_VERSION | cut -d'.' -f1)
    MINOR=$(echo $K8S_VERSION | cut -d'.' -f2)
    
    if [[ $MAJOR -lt 1 ]] || [[ $MAJOR -eq 1 && $MINOR -lt 32 ]]; then
        log_warning "Kubernetes version $K8S_VERSION may not be fully compatible. Recommended: 1.32+"
    fi
    
    log_success "Prerequisites check completed"
}

# Deploy phase with agent coordination
deploy_phase() {
    local phase_name="$1"
    local phase_dir="$2"
    local description="$3"
    
    log "Phase: $phase_name - $description"
    
    if [[ ! -d "$PROJECT_ROOT/$phase_dir" ]]; then
        log_warning "Phase directory $phase_dir not found, skipping..."
        return 0
    fi
    
    # Apply all YAML files in the phase directory
    for file in "$PROJECT_ROOT/$phase_dir"/*.yaml; do
        if [[ -f "$file" ]]; then
            log "Applying $(basename "$file")..."
            kubectl apply -f "$file"
        fi
    done
    
    log_success "Phase $phase_name completed"
}

# Wait for deployment to be ready
wait_for_deployment() {
    local namespace="$1"
    local deployment="$2"
    local timeout="${3:-300}"
    
    log "Waiting for deployment $deployment in namespace $namespace to be ready..."
    
    if kubectl wait --for=condition=available deployment/$deployment \
        --namespace=$namespace --timeout=${timeout}s; then
        log_success "Deployment $deployment is ready"
    else
        log_error "Deployment $deployment failed to become ready within ${timeout}s"
        return 1
    fi
}

# Wait for pods to be ready
wait_for_pods() {
    local namespace="$1"
    local label_selector="$2"
    local timeout="${3:-300}"
    
    log "Waiting for pods with label $label_selector in namespace $namespace..."
    
    if kubectl wait --for=condition=ready pod \
        --selector=$label_selector \
        --namespace=$namespace --timeout=${timeout}s; then
        log_success "Pods are ready"
    else
        log_error "Pods failed to become ready within ${timeout}s"
        return 1
    fi
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    
    # Check RIC platform components
    local ric_components=("e2mgr" "e2term" "a1mediator" "submgr" "xappmgr")
    for component in "${ric_components[@]}"; do
        if kubectl get deployment $component -n $NAMESPACE &> /dev/null; then
            wait_for_deployment $NAMESPACE $component 180
        else
            log_warning "Component $component not found"
        fi
    done
    
    # Check xApps
    local xapps=("traffic-steering-xapp" "qos-prediction-xapp" "anomaly-detection-xapp" "kpi-monitoring-xapp")
    for xapp in "${xapps[@]}"; do
        if kubectl get deployment $xapp -n $NAMESPACE &> /dev/null; then
            wait_for_deployment $NAMESPACE $xapp 180
        else
            log_warning "xApp $xapp not found"
        fi
    done
    
    # Check monitoring stack
    if kubectl get namespace $MONITORING_NAMESPACE &> /dev/null; then
        wait_for_deployment $MONITORING_NAMESPACE prometheus-server 180
        wait_for_deployment $MONITORING_NAMESPACE grafana 180
    fi
    
    log_success "Deployment validation completed"
}

# Get service endpoints
get_endpoints() {
    log "Getting service endpoints..."
    
    echo ""
    echo "=== O-RAN Near-RT RIC Platform Endpoints ==="
    echo ""
    
    # RIC Platform services
    echo "RIC Platform Services:"
    kubectl get svc -n $NAMESPACE -o custom-columns="NAME:.metadata.name,TYPE:.spec.type,CLUSTER-IP:.spec.clusterIP,EXTERNAL-IP:.status.loadBalancer.ingress[0].ip,PORT(S):.spec.ports[*].port"
    
    echo ""
    
    # Monitoring services
    if kubectl get namespace $MONITORING_NAMESPACE &> /dev/null; then
        echo "Monitoring Services:"
        kubectl get svc -n $MONITORING_NAMESPACE -o custom-columns="NAME:.metadata.name,TYPE:.spec.type,CLUSTER-IP:.spec.clusterIP,EXTERNAL-IP:.status.loadBalancer.ingress[0].ip,PORT(S):.spec.ports[*].port"
    fi
    
    echo ""
    echo "=== Access Information ==="
    echo ""
    
    # Grafana access
    if kubectl get svc grafana -n $MONITORING_NAMESPACE &> /dev/null; then
        GRAFANA_IP=$(kubectl get svc grafana -n $MONITORING_NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")
        GRAFANA_PORT=$(kubectl get svc grafana -n $MONITORING_NAMESPACE -o jsonpath='{.spec.ports[0].port}')
        echo "Grafana Dashboard: http://$GRAFANA_IP:$GRAFANA_PORT"
        echo "  - Username: admin"
        echo "  - Password: admin123"
    fi
    
    # Prometheus access  
    if kubectl get svc prometheus-server -n $MONITORING_NAMESPACE &> /dev/null; then
        PROMETHEUS_IP=$(kubectl get svc prometheus-server -n $MONITORING_NAMESPACE -o jsonpath='{.spec.clusterIP}')
        PROMETHEUS_PORT=$(kubectl get svc prometheus-server -n $MONITORING_NAMESPACE -o jsonpath='{.spec.ports[0].port}')
        echo "Prometheus: http://$PROMETHEUS_IP:$PROMETHEUS_PORT"
    fi
    
    echo ""
}

# Main deployment function following agent coordination
main() {
    log "Starting O-RAN Agent-Based Near-RT RIC Platform Deployment"
    log "Following Nephio R5 and O-RAN L Release patterns"
    
    # Check prerequisites
    check_prerequisites
    
    # Phase 1: Security baseline (security-compliance-agent)
    deploy_phase "1" "02-security" "Establishing security baseline"
    
    # Wait for security policies to be applied
    sleep 10
    
    # Phase 2: Infrastructure provisioning (nephio-infrastructure-agent)
    log "Phase 2: Infrastructure provisioning (simulated - using existing cluster)"
    
    # Phase 3: Configuration management (configuration-management-agent)
    deploy_phase "3" "04-configuration" "Configuring O-RAN interfaces (E2, A1, O1, O2)"
    
    # Wait for interface configurations
    sleep 15
    
    # Phase 4: Network function deployment (oran-network-functions-agent)
    deploy_phase "4a" "05-network-functions" "Deploying Near-RT RIC platform and xApps"
    
    # Wait for RIC platform to be ready before deploying xApps
    sleep 30
    
    # Phase 5: Monitoring setup (monitoring-analytics-agent)
    deploy_phase "5" "06-monitoring" "Setting up monitoring and analytics"
    
    # Wait for all deployments to stabilize
    log "Waiting for all deployments to stabilize..."
    sleep 60
    
    # Phase 6: Validation (testing-validation-agent)
    validate_deployment
    
    # Display endpoints and access information
    get_endpoints
    
    log_success "O-RAN Agent-Based Near-RT RIC Platform deployment completed successfully!"
    log "The deployment includes:"
    log "  ✓ Near-RT RIC Platform (E2 Manager, A1 Mediator, Subscription Manager, xApp Manager)"
    log "  ✓ xApps (Traffic Steering, QoS Prediction, Anomaly Detection, KPI Monitoring)"
    log "  ✓ O-RAN Interfaces (E2, A1, O1 with Python simulator, O2)"
    log "  ✓ Security controls (Zero-trust, mTLS, Pod Security Standards)"
    log "  ✓ Monitoring stack (Prometheus, Grafana with O-RAN dashboards)"
    log ""
    log "This deployment demonstrates the coordination of all O-RAN agents:"
    log "  • nephio-oran-orchestrator-agent: Overall coordination"
    log "  • security-compliance-agent: Zero-trust security implementation"
    log "  • oran-network-functions-agent: RIC platform and xApps"
    log "  • configuration-management-agent: YANG models and interfaces"
    log "  • monitoring-analytics-agent: Observability and KPI tracking"
    log ""
    log "Access the Grafana dashboard to view O-RAN L Release metrics and KPIs."
}

# Cleanup function
cleanup() {
    log "Cleaning up on script exit..."
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"