#!/bin/bash
# Dependency Verification Script for Nephio R5 / O-RAN L Release
# Based on oran-nephio-dep-doctor-agent specifications

set -euo pipefail

echo "=== Nephio R5 / O-RAN L Release Dependency Verification ==="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Version requirements from oran-nephio-dep-doctor-agent
GO_MIN_VERSION="1.24.6"
NODE_MIN_VERSION="18.0.0"
PYTHON_MIN_VERSION="3.11.0"
KUBERNETES_MIN_VERSION="1.30.0"

check_version() {
    local current=$1
    local required=$2
    local name=$3
    
    if [[ "$(printf '%s\n' "$required" "$current" | sort -V | head -n1)" == "$required" ]]; then
        echo -e "${GREEN}✅ $name: $current (>= $required)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: $current (< $required required)${NC}"
        return 1
    fi
}

# Check Go version
echo "Checking Go version..."
if command -v go &> /dev/null; then
    go_version=$(go version | grep -oP 'go\K[0-9.]+')
    check_version "$go_version" "$GO_MIN_VERSION" "Go"
    
    # Check for FIPS 140-3 capability
    if [[ "$go_version" == "1.24.6" ]]; then
        echo -e "${GREEN}✅ Go 1.24.6 includes FIPS 140-3 usage capability${NC}"
    fi
else
    echo -e "${RED}❌ Go not found${NC}"
    exit 1
fi

# Check Node.js version
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    node_version=$(node --version | grep -oP 'v\K[0-9.]+')
    check_version "$node_version" "$NODE_MIN_VERSION" "Node.js"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check Python version (required for O-RAN L Release O1 simulator)
echo "Checking Python version..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version | grep -oP '[0-9.]+')
    if check_version "$python_version" "$PYTHON_MIN_VERSION" "Python"; then
        echo -e "${GREEN}✅ Python $python_version compatible with O-RAN L Release O1 simulator${NC}"
    else
        echo -e "${YELLOW}⚠️  Python $python_version may not support O-RAN L Release features${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Python3 not found - O-RAN L Release O1 simulator will not work${NC}"
fi

# Check Kubernetes tools
echo "Checking Kubernetes tools..."
if command -v kubectl &> /dev/null; then
    kubectl_version=$(kubectl version --client --short 2>/dev/null | grep -oP 'v\K[0-9.]+' || echo "unknown")
    if [[ "$kubectl_version" != "unknown" ]]; then
        check_version "$kubectl_version" "$KUBERNETES_MIN_VERSION" "kubectl"
    fi
else
    echo -e "${YELLOW}⚠️  kubectl not found${NC}"
fi

# Check ArgoCD (primary GitOps in R5)
echo "Checking ArgoCD..."
if command -v argocd &> /dev/null; then
    argocd_version=$(argocd version --client --short 2>/dev/null | grep -oP 'v\K[0-9.]+' || echo "unknown")
    if [[ "$argocd_version" != "unknown" ]]; then
        echo -e "${GREEN}✅ ArgoCD: $argocd_version (R5 primary GitOps)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  ArgoCD CLI not found (primary GitOps in R5)${NC}"
fi

# Check kpt (package management)
echo "Checking kpt..."
if command -v kpt &> /dev/null; then
    kpt_version=$(kpt version 2>&1 | grep -oP 'v[0-9.]+(-[a-z]+\.[0-9]+)?' || echo "unknown")
    if [[ "$kpt_version" != "unknown" ]]; then
        echo -e "${GREEN}✅ kpt: $kpt_version${NC}"
        if [[ "$kpt_version" == *"beta.55"* ]] || [[ "$kpt_version" > "v1.0.0-beta.55" ]]; then
            echo -e "${GREEN}✅ kpt version compatible with Nephio R5${NC}"
        else
            echo -e "${YELLOW}⚠️  kpt version may not be compatible with Nephio R5 (requires v1.0.0-beta.55+)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  kpt not found (required for Nephio R5 package management)${NC}"
fi

# Check Go module dependencies
echo "Checking Go module dependencies..."
if [[ -f "go.mod" ]]; then
    echo -e "${GREEN}✅ go.mod found${NC}"
    
    # Check if Go version in go.mod matches requirements
    go_mod_version=$(grep -oP '^go \K[0-9.]+' go.mod)
    if [[ "$go_mod_version" == "1.24.6" ]]; then
        echo -e "${GREEN}✅ go.mod specifies Go 1.24.6 (R5/L Release compliant)${NC}"
    else
        echo -e "${YELLOW}⚠️  go.mod specifies Go $go_mod_version (should be 1.24.6 for R5/L Release)${NC}"
    fi
    
    # Check for Nephio R5 dependencies
    if grep -q "k8s.io/client-go" go.mod; then
        echo -e "${GREEN}✅ Kubernetes client dependencies found${NC}"
    fi
    
    if grep -q "sigs.k8s.io/controller-runtime" go.mod; then
        echo -e "${GREEN}✅ Controller runtime dependencies found${NC}"
    fi
    
    if grep -q "google.golang.org/grpc" go.mod; then
        echo -e "${GREEN}✅ gRPC dependencies found (O-RAN L Release compatible)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  go.mod not found${NC}"
fi

# Check Python requirements
echo "Checking Python requirements..."
if [[ -f "requirements.txt" ]]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
    
    # Check for O-RAN L Release specific packages
    if grep -q "tensorflow" requirements.txt; then
        echo -e "${GREEN}✅ TensorFlow found (O-RAN L Release AI/ML support)${NC}"
    fi
    
    if grep -q "onnxruntime" requirements.txt; then
        echo -e "${GREEN}✅ ONNX Runtime found (O-RAN L Release AI/ML support)${NC}"
    fi
    
    if grep -q "PyYAML" requirements.txt; then
        echo -e "${GREEN}✅ PyYAML found (configuration management)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  requirements.txt not found${NC}"
fi

# Check npm dependencies
echo "Checking npm dependencies..."
if [[ -f "website/package.json" ]]; then
    echo -e "${GREEN}✅ website/package.json found${NC}"
    
    # Check Node.js engine requirements
    node_engine=$(grep -A 1 '"engines"' website/package.json | grep -oP '"node": ">=\K[0-9.]+' || echo "unknown")
    if [[ "$node_engine" != "unknown" ]]; then
        echo -e "${GREEN}✅ Node.js engine requirement: >=$node_engine${NC}"
    fi
    
    # Check for Docusaurus (documentation)
    if grep -q "@docusaurus/core" website/package.json; then
        docusaurus_version=$(grep -oP '"@docusaurus/core": "\^\K[0-9.]+' website/package.json)
        echo -e "${GREEN}✅ Docusaurus: $docusaurus_version${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  website/package.json not found${NC}"
fi

echo ""
echo "=== Dependency Verification Complete ==="
echo ""
echo "For Nephio R5 and O-RAN L Release compatibility:"
echo "• Ensure Go 1.24.6 with FIPS 140-3 usage capability"
echo "• Use ArgoCD as primary GitOps (R5 standard)"
echo "• Python 3.11+ required for L Release O1 simulator"
echo "• Enable AI/ML packages for L Release features"
echo ""
echo "Environment configuration:"
echo "• Set GODEBUG=fips140=on for FIPS mode"
echo "• Configure ArgoCD ApplicationSets for R5"
echo "• Enable L Release AI/ML capabilities"