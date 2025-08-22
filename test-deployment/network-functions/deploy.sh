#!/bin/bash
# O-RAN Network Functions Deployment Script
# Automated deployment with validation and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="oran-network-functions"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
TIMEOUT="${TIMEOUT:-600}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
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
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v make &> /dev/null; then
        missing_tools+=("make")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Kubernetes connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if Istio is installed
    if ! kubectl get ns istio-system &> /dev/null; then
        log_warning "Istio namespace not found. Service mesh features may not work."
    fi
    
    log_success "Prerequisites check passed"
}

# Validate Go source code
validate_source() {
    log_info "Validating Go source code..."
    
    for component in cu du ru; do
        log_info "Validating ${component}..."
        
        if [ ! -f "${component}/src/main.go" ]; then
            log_error "Source file ${component}/src/main.go not found"
            exit 1
        fi
        
        cd "${component}/src"
        
        # Check Go syntax
        if ! go build -o /dev/null .; then
            log_error "Go build failed for ${component}"
            exit 1
        fi
        
        # Run go vet
        if ! go vet ./...; then
            log_error "Go vet failed for ${component}"
            exit 1
        fi
        
        cd "${SCRIPT_DIR}"
    done
    
    log_success "Source code validation passed"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    for component in cu du ru; do
        log_info "Building ${component} image..."
        
        cd "${component}"
        
        docker build \
            -t "${DOCKER_REGISTRY}/oran/${component}:${IMAGE_TAG}" \
            -f Dockerfile \
            .
        
        if [ $? -eq 0 ]; then
            log_success "${component} image built successfully"
        else
            log_error "Failed to build ${component} image"
            exit 1
        fi
        
        cd "${SCRIPT_DIR}"
    done
    
    log_success "All images built successfully"
}

# Security scan images
security_scan() {
    log_info "Running security scans on images..."
    
    if ! command -v trivy &> /dev/null; then
        log_warning "Trivy not found, skipping security scan"
        return 0
    fi
    
    for component in cu du ru; do
        log_info "Scanning ${component} image..."
        
        if ! trivy image --severity CRITICAL,HIGH "${DOCKER_REGISTRY}/oran/${component}:${IMAGE_TAG}"; then
            log_warning "Security issues found in ${component} image"
        else
            log_success "${component} image security scan passed"
        fi
    done
}

# Deploy namespace and common resources
deploy_namespace() {
    log_info "Deploying namespace and common resources..."
    
    kubectl apply -f namespace.yaml
    
    # Wait for namespace to be ready
    kubectl wait --for=condition=Ready namespace/${NAMESPACE} --timeout=${TIMEOUT}s
    
    log_success "Namespace deployed successfully"
}

# Deploy monitoring resources
deploy_monitoring() {
    log_info "Deploying monitoring resources..."
    
    kubectl apply -f monitoring.yaml
    
    log_success "Monitoring resources deployed"
}

# Deploy individual components
deploy_component() {
    local component=$1
    log_info "Deploying ${component}..."
    
    kubectl apply -f "${component}/manifests/deployment.yaml"
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/oran-${component} -n ${NAMESPACE} --timeout=${TIMEOUT}s
    
    # Verify pods are running
    local ready_pods=$(kubectl get pods -n ${NAMESPACE} -l app=oran-${component} --field-selector=status.phase=Running --no-headers | wc -l)
    
    if [ "$ready_pods" -eq 0 ]; then
        log_error "No running pods found for ${component}"
        return 1
    fi
    
    log_success "${component} deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local components=("cu:9090" "du:9091" "ru:9092")
    
    for comp_port in "${components[@]}"; do
        IFS=':' read -r component port <<< "${comp_port}"
        
        log_info "Checking health of ${component}..."
        
        # Port forward and health check
        kubectl port-forward -n ${NAMESPACE} "svc/oran-${component}-service" ${port}:${port} &
        local pf_pid=$!
        
        sleep 3
        
        if curl -s -f "http://localhost:${port}/health" &> /dev/null; then
            log_success "${component} health check passed"
        else
            log_warning "${component} health check failed"
        fi
        
        kill $pf_pid 2>/dev/null || true
        wait $pf_pid 2>/dev/null || true
    done
}

# Validate deployment
validate_deployment() {
    log_info "Validating deployment..."
    
    # Check if all pods are running
    local expected_pods=3
    local running_pods=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase=Running --no-headers | wc -l)
    
    if [ "$running_pods" -lt "$expected_pods" ]; then
        log_error "Expected ${expected_pods} running pods, found ${running_pods}"
        return 1
    fi
    
    # Check services
    local expected_services=3
    local actual_services=$(kubectl get services -n ${NAMESPACE} --no-headers | grep -c "oran-.*-service")
    
    if [ "$actual_services" -lt "$expected_services" ]; then
        log_error "Expected ${expected_services} services, found ${actual_services}"
        return 1
    fi
    
    # Check Istio injection if available
    if kubectl get ns istio-system &> /dev/null; then
        local injected_pods=$(kubectl get pods -n ${NAMESPACE} -o jsonpath='{.items[*].spec.containers[*].name}' | grep -c istio-proxy || true)
        
        if [ "$injected_pods" -gt 0 ]; then
            log_success "Istio sidecar injection detected"
        else
            log_warning "No Istio sidecar injection detected"
        fi
    fi
    
    log_success "Deployment validation passed"
}

# Show deployment status
show_status() {
    log_info "Deployment Status:"
    echo "==================="
    
    echo ""
    log_info "Pods:"
    kubectl get pods -n ${NAMESPACE} -o wide
    
    echo ""
    log_info "Services:"
    kubectl get services -n ${NAMESPACE}
    
    echo ""
    log_info "ConfigMaps:"
    kubectl get configmaps -n ${NAMESPACE}
    
    echo ""
    log_info "Secrets:"
    kubectl get secrets -n ${NAMESPACE}
    
    if kubectl get ns istio-system &> /dev/null; then
        echo ""
        log_info "Istio VirtualServices:"
        kubectl get virtualservices -n ${NAMESPACE}
        
        echo ""
        log_info "Istio DestinationRules:"
        kubectl get destinationrules -n ${NAMESPACE}
    fi
    
    echo ""
    log_info "Events (last 10):"
    kubectl get events -n ${NAMESPACE} --sort-by=.metadata.creationTimestamp | tail -10
}

# Cleanup function
cleanup() {
    log_info "Performing cleanup..."
    
    # Kill any background port-forward processes
    pkill -f "kubectl port-forward" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main deployment function
deploy_all() {
    log_info "Starting O-RAN Network Functions deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    validate_source
    build_images
    security_scan
    deploy_namespace
    deploy_monitoring
    
    # Deploy components in order
    deploy_component "cu"
    sleep 10  # Allow CU to start before DU
    
    deploy_component "du"
    sleep 10  # Allow DU to start before RU
    
    deploy_component "ru"
    
    # Wait a bit for everything to settle
    sleep 30
    
    validate_deployment
    health_check
    show_status
    
    log_success "O-RAN Network Functions deployment completed successfully!"
    
    echo ""
    log_info "Access URLs (after port-forwarding):"
    echo "  CU Metrics: http://localhost:9090/metrics"
    echo "  DU Metrics: http://localhost:9091/metrics"
    echo "  RU Metrics: http://localhost:9092/metrics"
    echo ""
    log_info "To access metrics, run:"
    echo "  kubectl port-forward -n ${NAMESPACE} svc/oran-cu-service 9090:9090"
    echo "  kubectl port-forward -n ${NAMESPACE} svc/oran-du-service 9091:9091"
    echo "  kubectl port-forward -n ${NAMESPACE} svc/oran-ru-service 9092:9092"
}

# Help function
show_help() {
    cat << EOF
O-RAN Network Functions Deployment Script

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    deploy          Deploy all O-RAN network functions (default)
    build           Build Docker images only
    validate        Validate source code only
    status          Show deployment status
    health          Perform health checks
    clean           Clean up deployment
    help            Show this help message

OPTIONS:
    -r, --registry REGISTRY    Docker registry (default: localhost:5000)
    -t, --tag TAG             Image tag (default: latest)
    -n, --namespace NAMESPACE  Kubernetes namespace (default: oran-network-functions)
    -T, --timeout TIMEOUT     Deployment timeout in seconds (default: 600)
    -v, --verbose             Verbose output
    -h, --help                Show this help message

EXAMPLES:
    $0 deploy
    $0 build --registry myregistry.com --tag v1.0.0
    $0 status
    $0 health

ENVIRONMENT VARIABLES:
    DOCKER_REGISTRY    Docker registry URL
    IMAGE_TAG          Docker image tag
    TIMEOUT            Deployment timeout
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -T|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        deploy|build|validate|status|health|clean|help)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set default command
COMMAND="${COMMAND:-deploy}"

# Execute command
case $COMMAND in
    deploy)
        deploy_all
        ;;
    build)
        check_prerequisites
        validate_source
        build_images
        security_scan
        ;;
    validate)
        validate_source
        ;;
    status)
        show_status
        ;;
    health)
        health_check
        ;;
    clean)
        log_info "Cleaning up O-RAN Network Functions..."
        kubectl delete -f ru/manifests/deployment.yaml --ignore-not-found=true
        kubectl delete -f du/manifests/deployment.yaml --ignore-not-found=true
        kubectl delete -f cu/manifests/deployment.yaml --ignore-not-found=true
        kubectl delete -f monitoring.yaml --ignore-not-found=true
        kubectl delete -f namespace.yaml --ignore-not-found=true
        log_success "Cleanup completed"
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac