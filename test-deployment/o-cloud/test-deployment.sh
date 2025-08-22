#!/bin/bash
# O-Cloud Deployment Test Script
# Tests the O-Cloud infrastructure deployment

set -e

echo "======================================"
echo "O-Cloud Infrastructure Deployment Test"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}✗ kubectl not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ kubectl found${NC}"
    
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Kubernetes cluster accessible${NC}"
    
    echo ""
}

# Deploy CRDs
deploy_crds() {
    echo "Deploying Custom Resource Definitions..."
    
    if kubectl apply -f manifests/o-cloud-crd.yaml --dry-run=client &> /dev/null; then
        echo -e "${GREEN}✓ CRD validation passed${NC}"
        
        if [ "$DRY_RUN" != "true" ]; then
            kubectl apply -f manifests/o-cloud-crd.yaml
            echo -e "${GREEN}✓ CRDs deployed${NC}"
        else
            echo -e "${YELLOW}→ CRDs would be deployed (dry-run mode)${NC}"
        fi
    else
        echo -e "${RED}✗ CRD validation failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Deploy O-Cloud Controller
deploy_controller() {
    echo "Deploying O-Cloud Controller..."
    
    if kubectl apply -f manifests/o-cloud-deployment.yaml --dry-run=client &> /dev/null; then
        echo -e "${GREEN}✓ Controller deployment validation passed${NC}"
        
        if [ "$DRY_RUN" != "true" ]; then
            kubectl apply -f manifests/o-cloud-deployment.yaml
            echo -e "${GREEN}✓ Controller deployed${NC}"
            
            # Wait for controller to be ready
            echo "Waiting for controller to be ready..."
            kubectl -n ocloud-system wait --for=condition=available --timeout=60s deployment/ocloud-controller || true
            kubectl -n ocloud-system wait --for=condition=available --timeout=60s deployment/smo-stub || true
        else
            echo -e "${YELLOW}→ Controller would be deployed (dry-run mode)${NC}"
        fi
    else
        echo -e "${RED}✗ Controller deployment validation failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Deploy O-Cloud Instance
deploy_instance() {
    echo "Deploying O-Cloud Instance..."
    
    if kubectl apply -f manifests/o-cloud-instance.yaml --dry-run=client &> /dev/null; then
        echo -e "${GREEN}✓ O-Cloud instance validation passed${NC}"
        
        if [ "$DRY_RUN" != "true" ]; then
            kubectl apply -f manifests/o-cloud-instance.yaml
            echo -e "${GREEN}✓ O-Cloud instance deployed${NC}"
        else
            echo -e "${YELLOW}→ O-Cloud instance would be deployed (dry-run mode)${NC}"
        fi
    else
        echo -e "${RED}✗ O-Cloud instance validation failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Check deployment status
check_status() {
    echo "Checking deployment status..."
    
    if [ "$DRY_RUN" != "true" ]; then
        echo ""
        echo "Namespace resources:"
        kubectl -n ocloud-system get all 2>/dev/null || echo "Namespace not found"
        
        echo ""
        echo "O-Cloud instances:"
        kubectl -n ocloud-system get oclouds 2>/dev/null || echo "No O-Cloud instances found"
        
        echo ""
        echo "Resource pools:"
        kubectl -n ocloud-system get resourcepools 2>/dev/null || echo "No resource pools found"
    else
        echo -e "${YELLOW}→ Status check skipped (dry-run mode)${NC}"
    fi
    
    echo ""
}

# Test O2 Interface
test_o2_interface() {
    echo "Testing O2 Interface..."
    
    if [ "$DRY_RUN" != "true" ]; then
        # Check if service exists
        if kubectl -n ocloud-system get svc o2-interface &> /dev/null; then
            echo -e "${GREEN}✓ O2 interface service found${NC}"
            
            # Port forward for testing
            echo "Setting up port-forward to O2 interface..."
            kubectl -n ocloud-system port-forward svc/o2-interface 8090:80 &
            PF_PID=$!
            sleep 3
            
            # Test endpoints
            echo "Testing O2 API endpoints..."
            
            if curl -s http://localhost:8090/o2ims/v1/health > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Health endpoint working${NC}"
            else
                echo -e "${YELLOW}! Health endpoint not accessible${NC}"
            fi
            
            if curl -s http://localhost:8090/o2ims/v1/resourcePools > /dev/null 2>&1; then
                echo -e "${GREEN}✓ Resource pools endpoint working${NC}"
            else
                echo -e "${YELLOW}! Resource pools endpoint not accessible${NC}"
            fi
            
            # Clean up port-forward
            kill $PF_PID 2>/dev/null || true
        else
            echo -e "${YELLOW}! O2 interface service not found${NC}"
        fi
    else
        echo -e "${YELLOW}→ O2 interface test skipped (dry-run mode)${NC}"
    fi
    
    echo ""
}

# Clean up deployment
cleanup() {
    echo "Cleaning up deployment..."
    
    if [ "$DRY_RUN" != "true" ]; then
        kubectl delete -f manifests/o-cloud-instance.yaml 2>/dev/null || true
        kubectl delete -f manifests/o-cloud-deployment.yaml 2>/dev/null || true
        kubectl delete -f manifests/o-cloud-crd.yaml 2>/dev/null || true
        echo -e "${GREEN}✓ Cleanup completed${NC}"
    else
        echo -e "${YELLOW}→ Cleanup skipped (dry-run mode)${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    # Parse arguments
    DRY_RUN="false"
    CLEANUP="false"
    
    for arg in "$@"; do
        case $arg in
            --dry-run)
                DRY_RUN="true"
                echo -e "${YELLOW}Running in dry-run mode${NC}"
                echo ""
                ;;
            --cleanup)
                CLEANUP="true"
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --dry-run    Validate manifests without deploying"
                echo "  --cleanup    Remove all deployed resources"
                echo "  --help       Show this help message"
                exit 0
                ;;
        esac
    done
    
    if [ "$CLEANUP" == "true" ]; then
        cleanup
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    deploy_crds
    deploy_controller
    deploy_instance
    check_status
    test_o2_interface
    
    echo "======================================"
    echo -e "${GREEN}O-Cloud deployment test completed!${NC}"
    echo "======================================"
    echo ""
    
    if [ "$DRY_RUN" == "true" ]; then
        echo "To actually deploy, run without --dry-run flag:"
        echo "  $0"
    else
        echo "To access the O2 interface:"
        echo "  kubectl -n ocloud-system port-forward svc/o2-interface 8090:80"
        echo "  curl http://localhost:8090/o2ims/v1/health"
        echo ""
        echo "To check O-Cloud status:"
        echo "  kubectl -n ocloud-system get oclouds"
        echo ""
        echo "To clean up:"
        echo "  $0 --cleanup"
    fi
}

# Run main function
main "$@"