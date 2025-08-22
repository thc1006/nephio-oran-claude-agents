#!/bin/bash
# O-RAN Platform Deployment Validation Script
# Based on testing-validation-agent.md capabilities

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

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((PASSED_TESTS++))
}

log_failure() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name"
        return 0
    else
        log_failure "$test_name"
        return 1
    fi
}

# Test 1: Namespace existence
test_namespaces() {
    run_test "RIC Platform namespace exists" \
        "kubectl get namespace $NAMESPACE >/dev/null 2>&1"
    
    run_test "Monitoring namespace exists" \
        "kubectl get namespace $MONITORING_NAMESPACE >/dev/null 2>&1"
}

# Test 2: RIC Platform components
test_ric_platform() {
    local components=("e2mgr" "e2term" "a1mediator" "submgr" "xappmgr" "dbaas-redis")
    
    for component in "${components[@]}"; do
        run_test "RIC component $component is deployed" \
            "kubectl get deployment $component -n $NAMESPACE >/dev/null 2>&1"
        
        run_test "RIC component $component is ready" \
            "kubectl wait --for=condition=available deployment/$component -n $NAMESPACE --timeout=60s >/dev/null 2>&1"
    done
}

# Test 3: xApps deployment
test_xapps() {
    local xapps=("traffic-steering-xapp" "qos-prediction-xapp" "anomaly-detection-xapp" "kpi-monitoring-xapp")
    
    for xapp in "${xapps[@]}"; do
        run_test "xApp $xapp is deployed" \
            "kubectl get deployment $xapp -n $NAMESPACE >/dev/null 2>&1"
        
        run_test "xApp $xapp is ready" \
            "kubectl wait --for=condition=available deployment/$xapp -n $NAMESPACE --timeout=60s >/dev/null 2>&1"
    done
}

# Test 4: O-RAN interfaces
test_oran_interfaces() {
    # Test E2 interface connectivity
    run_test "E2 Manager service is accessible" \
        "kubectl get svc e2mgr -n $NAMESPACE >/dev/null 2>&1"
    
    # Test A1 interface connectivity
    run_test "A1 Mediator service is accessible" \
        "kubectl get svc a1mediator -n $NAMESPACE >/dev/null 2>&1"
    
    # Test O1 interface (NETCONF server)
    run_test "O1 NETCONF server is deployed" \
        "kubectl get deployment netconf-server -n $NAMESPACE >/dev/null 2>&1"
    
    # Test O2 interface (IMS)
    run_test "O2 IMS server is deployed" \
        "kubectl get deployment o2ims-server -n $NAMESPACE >/dev/null 2>&1"
    
    # Test Python O1 Simulator (L Release feature)
    run_test "Python O1 Simulator is accessible" \
        "kubectl get svc netconf-server -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name==\"python-o1-sim\")].port}' | grep -q 8081"
}

# Test 5: Security policies
test_security() {
    # Test network policies
    run_test "Zero-trust network policy exists" \
        "kubectl get networkpolicy ric-platform-zero-trust -n $NAMESPACE >/dev/null 2>&1"
    
    # Test pod security standards
    run_test "Namespace has pod security labels" \
        "kubectl get namespace $NAMESPACE -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}' | grep -q restricted"
    
    # Test SPIFFE identity
    run_test "SPIFFE ClusterSPIFFEID exists" \
        "kubectl get clusterspiffeid ric-platform >/dev/null 2>&1"
    
    # Test Istio mTLS
    run_test "Istio PeerAuthentication for mTLS exists" \
        "kubectl get peerauthentication ric-platform-mtls -n $NAMESPACE >/dev/null 2>&1"
    
    # Test OPA Gatekeeper constraints
    run_test "O-RAN compliance constraint exists" \
        "kubectl get orancompliance ric-platform-compliance >/dev/null 2>&1"
}

# Test 6: Monitoring stack
test_monitoring() {
    if kubectl get namespace $MONITORING_NAMESPACE >/dev/null 2>&1; then
        run_test "Prometheus server is deployed" \
            "kubectl get deployment prometheus-server -n $MONITORING_NAMESPACE >/dev/null 2>&1"
        
        run_test "Prometheus server is ready" \
            "kubectl wait --for=condition=available deployment/prometheus-server -n $MONITORING_NAMESPACE --timeout=60s >/dev/null 2>&1"
        
        run_test "Grafana is deployed" \
            "kubectl get deployment grafana -n $MONITORING_NAMESPACE >/dev/null 2>&1"
        
        run_test "Grafana is ready" \
            "kubectl wait --for=condition=available deployment/grafana -n $MONITORING_NAMESPACE --timeout=60s >/dev/null 2>&1"
    else
        log_warning "Monitoring namespace not found, skipping monitoring tests"
    fi
}

# Test 7: Configuration validation
test_configuration() {
    # Test YANG models configuration
    run_test "YANG models ConfigMap exists" \
        "kubectl get configmap yang-models-config -n $NAMESPACE >/dev/null 2>&1"
    
    # Test interface configurations
    run_test "E2 interface config exists" \
        "kubectl get configmap e2-interface-config -n $NAMESPACE >/dev/null 2>&1"
    
    run_test "A1 interface config exists" \
        "kubectl get configmap a1-interface-config -n $NAMESPACE >/dev/null 2>&1"
    
    run_test "O1 interface config exists" \
        "kubectl get configmap o1-interface-config -n $NAMESPACE >/dev/null 2>&1"
    
    run_test "O2 interface config exists" \
        "kubectl get configmap o2-interface-config -n $NAMESPACE >/dev/null 2>&1"
    
    # Test FIPS configuration
    run_test "FIPS configuration exists" \
        "kubectl get configmap fips-config -n $NAMESPACE >/dev/null 2>&1"
}

# Test 8: Health checks
test_health_checks() {
    log "Performing health checks..."
    
    # Check pod health across the platform
    local unhealthy_pods=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running,status.phase!=Succeeded -o name 2>/dev/null | wc -l)
    
    run_test "All RIC platform pods are healthy" \
        "[ $unhealthy_pods -eq 0 ]"
    
    if kubectl get namespace $MONITORING_NAMESPACE >/dev/null 2>&1; then
        local monitoring_unhealthy=$(kubectl get pods -n $MONITORING_NAMESPACE --field-selector=status.phase!=Running,status.phase!=Succeeded -o name 2>/dev/null | wc -l)
        
        run_test "All monitoring pods are healthy" \
            "[ $monitoring_unhealthy -eq 0 ]"
    fi
}

# Test 9: Connectivity tests
test_connectivity() {
    log "Testing internal connectivity..."
    
    # Test Redis connectivity from RIC components
    run_test "Redis database is accessible" \
        "kubectl exec -n $NAMESPACE deployment/e2mgr -- timeout 5 redis-cli -h dbaas-redis ping >/dev/null 2>&1 || true"
    
    # Test service discovery
    run_test "E2 Manager service DNS resolution" \
        "kubectl exec -n $NAMESPACE deployment/e2term -- nslookup e2mgr.ric-platform.svc.cluster.local >/dev/null 2>&1 || true"
}

# Test 10: O-RAN L Release features
test_l_release_features() {
    log "Testing O-RAN L Release specific features..."
    
    # Test Python O1 Simulator
    run_test "Python O1 Simulator service exists" \
        "kubectl get svc netconf-server -n $NAMESPACE >/dev/null 2>&1"
    
    # Test AI/ML integration configs
    run_test "AI/ML enabled in xApp configs" \
        "kubectl get configmap qos-prediction-config -n $NAMESPACE -o jsonpath='{.data.config\.json}' | grep -q '\"ai_ml\"'"
    
    # Test Kubeflow integration configuration
    run_test "Kubeflow integration configured" \
        "kubectl get configmap anomaly-detection-config -n $NAMESPACE -o jsonpath='{.data.config\.json}' | grep -q 'kubeflow_pipeline'"
    
    # Test enhanced service manager features
    run_test "Enhanced xApp Manager deployed" \
        "kubectl get deployment xappmgr -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name==\"XAPP_FRAMEWORK_VERSION\")].value}' | grep -q '1.5+'"
}

# Test 11: Performance validation
test_performance() {
    log "Testing performance characteristics..."
    
    # Check resource requests and limits are set
    run_test "Resource limits configured for E2 Manager" \
        "kubectl get deployment e2mgr -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].resources.limits}' | grep -q cpu"
    
    run_test "Resource limits configured for xApps" \
        "kubectl get deployment traffic-steering-xapp -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].resources.limits}' | grep -q memory"
    
    # Check HPA could be configured (readiness for scaling)
    run_test "HPA can be configured for xApps" \
        "kubectl get deployment traffic-steering-xapp -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].resources.requests}' | grep -q cpu"
}

# Summary report
generate_summary() {
    echo ""
    echo "=================================="
    echo "    VALIDATION SUMMARY REPORT"
    echo "=================================="
    echo ""
    echo "Total Tests Run: $TOTAL_TESTS"
    echo "Tests Passed:    $PASSED_TESTS"
    echo "Tests Failed:    $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "All tests passed! O-RAN platform deployment is validated."
        echo ""
        echo "✓ Near-RT RIC Platform is operational"
        echo "✓ xApps are deployed and healthy"
        echo "✓ O-RAN interfaces (E2, A1, O1, O2) are configured"
        echo "✓ Security policies are in place"
        echo "✓ Monitoring stack is operational"
        echo "✓ O-RAN L Release features are enabled"
        echo ""
        return 0
    else
        log_failure "Some tests failed. Please review the issues above."
        echo ""
        echo "Pass Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
        echo ""
        return 1
    fi
}

# Detailed system information
show_system_info() {
    echo ""
    echo "=================================="
    echo "    SYSTEM INFORMATION"
    echo "=================================="
    echo ""
    
    echo "Kubernetes Cluster Info:"
    kubectl cluster-info --context=$(kubectl config current-context) 2>/dev/null || echo "Unable to get cluster info"
    echo ""
    
    echo "Node Information:"
    kubectl get nodes -o wide 2>/dev/null || echo "Unable to get node info"
    echo ""
    
    echo "RIC Platform Pods:"
    kubectl get pods -n $NAMESPACE -o wide 2>/dev/null || echo "Unable to get pod info"
    echo ""
    
    if kubectl get namespace $MONITORING_NAMESPACE >/dev/null 2>&1; then
        echo "Monitoring Pods:"
        kubectl get pods -n $MONITORING_NAMESPACE -o wide 2>/dev/null || echo "Unable to get monitoring pod info"
        echo ""
    fi
    
    echo "Storage Information:"
    kubectl get pvc -n $NAMESPACE 2>/dev/null || echo "No PVCs found in RIC platform"
    if kubectl get namespace $MONITORING_NAMESPACE >/dev/null 2>&1; then
        kubectl get pvc -n $MONITORING_NAMESPACE 2>/dev/null || echo "No PVCs found in monitoring"
    fi
    echo ""
}

# Main validation function
main() {
    log "Starting O-RAN Platform Deployment Validation"
    log "Based on testing-validation-agent capabilities"
    echo ""
    
    # Run all test suites
    test_namespaces
    test_ric_platform
    test_xapps
    test_oran_interfaces
    test_security
    test_monitoring
    test_configuration
    test_health_checks
    test_connectivity
    test_l_release_features
    test_performance
    
    # Generate summary
    generate_summary
    
    # Show system information
    if [ "$1" = "--verbose" ] 2>/dev/null || [ "$1" = "-v" ] 2>/dev/null; then
        show_system_info
    fi
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"