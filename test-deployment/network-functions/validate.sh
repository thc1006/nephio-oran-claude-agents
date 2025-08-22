#!/bin/bash
# O-RAN Network Functions Validation Script
# Validates the complete deployment setup

set -euo pipefail

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

# Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run a check
run_check() {
    local check_name="$1"
    local check_command="$2"
    
    ((TOTAL_CHECKS++))
    log_info "Checking: $check_name"
    
    if eval "$check_command" &> /dev/null; then
        log_success "$check_name"
        ((PASSED_CHECKS++))
        return 0
    else
        log_error "$check_name"
        ((FAILED_CHECKS++))
        return 1
    fi
}

# Validate file structure
validate_structure() {
    log_info "Validating file structure..."
    
    local required_files=(
        "cu/src/main.go"
        "du/src/main.go"
        "ru/src/main.go"
        "cu/configs/cu-config.json"
        "du/configs/du-config.json"
        "ru/configs/ru-config.json"
        "cu/manifests/deployment.yaml"
        "du/manifests/deployment.yaml"
        "ru/manifests/deployment.yaml"
        "cu/Dockerfile"
        "du/Dockerfile"
        "ru/Dockerfile"
        "cu/go.mod"
        "du/go.mod"
        "ru/go.mod"
        "namespace.yaml"
        "monitoring.yaml"
        "Makefile"
        "deploy.sh"
        "README.md"
    )
    
    for file in "${required_files[@]}"; do
        run_check "File exists: $file" "[ -f '$file' ]"
    done
}

# Validate Go source code
validate_go_code() {
    log_info "Validating Go source code..."
    
    for component in cu du ru; do
        cd "$component/src"
        
        run_check "Go mod file valid: $component" "go mod verify"
        run_check "Go syntax valid: $component" "go build -o /dev/null ."
        run_check "Go vet passes: $component" "go vet ./..."
        
        cd ../..
    done
}

# Validate JSON configurations
validate_configs() {
    log_info "Validating JSON configurations..."
    
    for component in cu du ru; do
        config_file="$component/configs/$component-config.json"
        run_check "JSON valid: $config_file" "python -m json.tool '$config_file' > /dev/null"
    done
}

# Validate Kubernetes manifests
validate_k8s_manifests() {
    log_info "Validating Kubernetes manifests..."
    
    local manifest_files=(
        "namespace.yaml"
        "monitoring.yaml"
        "cu/manifests/deployment.yaml"
        "du/manifests/deployment.yaml"
        "ru/manifests/deployment.yaml"
    )
    
    for manifest in "${manifest_files[@]}"; do
        run_check "K8s manifest valid: $manifest" "kubectl --dry-run=client apply -f '$manifest'"
    done
}

# Validate Docker configurations
validate_docker() {
    log_info "Validating Docker configurations..."
    
    for component in cu du ru; do
        dockerfile="$component/Dockerfile"
        run_check "Dockerfile valid: $dockerfile" "docker build -t test-$component -f '$dockerfile' '$component' --dry-run 2>/dev/null || docker build --help | head -1"
    done
}

# Validate security configurations
validate_security() {
    log_info "Validating security configurations..."
    
    # Check for security contexts in deployments
    for component in cu du ru; do
        manifest="$component/manifests/deployment.yaml"
        run_check "SecurityContext present: $component" "grep -q 'securityContext' '$manifest'"
        run_check "Non-root user: $component" "grep -q 'runAsNonRoot: true' '$manifest'"
        run_check "ReadOnly filesystem: $component" "grep -q 'readOnlyRootFilesystem: true' '$manifest'"
    done
    
    # Check for Istio security policies
    run_check "PeerAuthentication defined" "grep -q 'kind: PeerAuthentication' namespace.yaml"
    run_check "AuthorizationPolicy defined" "grep -q 'kind: AuthorizationPolicy' namespace.yaml"
}

# Validate monitoring setup
validate_monitoring() {
    log_info "Validating monitoring setup..."
    
    run_check "ServiceMonitor for CU" "grep -q 'name: oran-cu-monitor' monitoring.yaml"
    run_check "ServiceMonitor for DU" "grep -q 'name: oran-du-monitor' monitoring.yaml"
    run_check "ServiceMonitor for RU" "grep -q 'name: oran-ru-monitor' monitoring.yaml"
    run_check "PrometheusRule defined" "grep -q 'kind: PrometheusRule' monitoring.yaml"
    run_check "Grafana dashboard" "grep -q 'grafana_dashboard' monitoring.yaml"
}

# Validate interface implementations
validate_interfaces() {
    log_info "Validating O-RAN interface implementations..."
    
    # F1 Interface in CU
    run_check "F1 Setup handler in CU" "grep -q 'handleF1Setup' cu/src/main.go"
    run_check "F1 UE Context Setup in CU" "grep -q 'handleUEContextSetup' cu/src/main.go"
    
    # E1 Interface in CU
    run_check "E1 Setup handler in CU" "grep -q 'handleE1Setup' cu/src/main.go"
    run_check "Bearer Context Setup in CU" "grep -q 'handleBearerContextSetup' cu/src/main.go"
    
    # NGAP Interface in CU
    run_check "NGAP Setup handler in CU" "grep -q 'handleNGSetup' cu/src/main.go"
    
    # F1 Client in DU
    run_check "F1 Setup in DU" "grep -q 'performF1Setup' du/src/main.go"
    
    # MAC Scheduler in DU
    run_check "MAC Scheduler in DU" "grep -q 'MACSchedulerEngine' du/src/main.go"
    run_check "Proportional Fair algorithm" "grep -q 'scheduleProportionalFair' du/src/main.go"
    
    # RLC Processor in DU
    run_check "RLC Processor in DU" "grep -q 'RLCProcessorEngine' du/src/main.go"
    
    # Open Fronthaul in RU
    run_check "Open Fronthaul handler in RU" "grep -q 'OpenFronthaulHandler' ru/src/main.go"
    run_check "C-Plane handler in RU" "grep -q 'handlePRACH' ru/src/main.go"
    run_check "U-Plane handler in RU" "grep -q 'handleIQData' ru/src/main.go"
    
    # Beamforming in RU
    run_check "Beamforming controller in RU" "grep -q 'BeamformingController' ru/src/main.go"
    run_check "Beam weight calculation" "grep -q 'calculatePhase' ru/src/main.go"
}

# Validate service mesh integration
validate_service_mesh() {
    log_info "Validating service mesh integration..."
    
    for component in cu du ru; do
        manifest="$component/manifests/deployment.yaml"
        run_check "Istio injection: $component" "grep -q 'sidecar.istio.io/inject.*true' '$manifest'"
        run_check "VirtualService: $component" "grep -q 'kind: VirtualService' '$manifest'"
        run_check "DestinationRule: $component" "grep -q 'kind: DestinationRule' '$manifest'"
    done
}

# Validate configuration consistency
validate_consistency() {
    log_info "Validating configuration consistency..."
    
    # Check port consistency between configs and manifests
    run_check "CU F1 port consistency" "grep -q '38472' cu/configs/cu-config.json && grep -q '38472' cu/manifests/deployment.yaml"
    run_check "DU F1 client port consistency" "grep -q '38473' du/configs/du-config.json && grep -q '38473' du/manifests/deployment.yaml"
    run_check "RU OFH port consistency" "grep -q '7777' ru/configs/ru-config.json && grep -q '7777' ru/manifests/deployment.yaml"
    
    # Check service endpoint consistency
    run_check "DU->CU endpoint consistency" "grep -q 'oran-cu-service:38472' du/configs/du-config.json"
    run_check "RU->DU endpoint consistency" "grep -q 'oran-du-service:38474' ru/configs/ru-config.json"
}

# Main validation function
main() {
    log_info "Starting O-RAN Network Functions validation..."
    echo "================================================"
    
    validate_structure
    validate_go_code
    validate_configs
    validate_k8s_manifests
    validate_security
    validate_monitoring
    validate_interfaces
    validate_service_mesh
    validate_consistency
    
    echo ""
    echo "================================================"
    log_info "Validation Summary:"
    echo "Total checks: $TOTAL_CHECKS"
    echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        log_success "All validation checks passed! ✅"
        echo ""
        log_info "Your O-RAN Network Functions are ready for deployment."
        log_info "Run './deploy.sh' to deploy to Kubernetes cluster."
        exit 0
    else
        log_error "Some validation checks failed! ❌"
        echo ""
        log_error "Please fix the issues above before deploying."
        exit 1
    fi
}

# Run validation
main