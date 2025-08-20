#!/bin/bash
# kpt Doctor Script for Nephio O-RAN Claude Agents
# Validates kpt installation, version, and compatibility
# Exit code: 0 if all checks pass, 1 if any critical issues found

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load version from Makefile if available
REQUIRED_KPT_VERSION=""
if [ -f "${REPO_ROOT}/Makefile" ]; then
    REQUIRED_KPT_VERSION=$(grep "^KPT_VERSION" "${REPO_ROOT}/Makefile" | cut -d'=' -f2 | xargs)
fi

# Default to v1.0.0-beta.55 if not found in Makefile
REQUIRED_KPT_VERSION=${REQUIRED_KPT_VERSION:-"v1.0.0-beta.55"}

echo "========================================="
echo "kpt Doctor - Nephio O-RAN Claude Agents"
echo "Required kpt version: ${REQUIRED_KPT_VERSION}"
echo "========================================="
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✓ PASS${NC} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠ WARN${NC} - $message"
            ;;
        "FAIL")
            echo -e "${RED}✗ FAIL${NC} - $message"
            EXIT_CODE=1
            ;;
        "INFO")
            echo -e "${BLUE}ℹ INFO${NC} - $message"
            ;;
    esac
}

# Function to compare versions
version_compare() {
    local v1=$1
    local v2=$2
    
    # Remove 'v' prefix and extract version parts
    v1=$(echo "$v1" | sed 's/^v//')
    v2=$(echo "$v2" | sed 's/^v//')
    
    # Handle beta versions specially
    if [[ "$v1" == *"beta"* ]] && [[ "$v2" == *"beta"* ]]; then
        # Extract beta numbers
        beta1=$(echo "$v1" | grep -o 'beta\.[0-9]*' | grep -o '[0-9]*')
        beta2=$(echo "$v2" | grep -o 'beta\.[0-9]*' | grep -o '[0-9]*')
        
        if [ "$beta1" -eq "$beta2" ]; then
            echo "0"
        elif [ "$beta1" -lt "$beta2" ]; then
            echo "-1"
        else
            echo "1"
        fi
    else
        # Standard version comparison
        printf '%s\n%s' "$v1" "$v2" | sort -V | head -n1
        if [ "$(printf '%s\n%s' "$v1" "$v2" | sort -V | head -n1)" = "$v1" ]; then
            if [ "$v1" = "$v2" ]; then
                echo "0"
            else
                echo "-1"
            fi
        else
            echo "1"
        fi
    fi
}

echo "1. kpt Installation Check"
echo "-------------------------"

# Check if kpt is installed
if ! command -v kpt >/dev/null 2>&1; then
    print_status "FAIL" "kpt not found in PATH"
    print_status "INFO" "Install kpt using: make install-kpt"
    print_status "INFO" "Or download from: https://github.com/kptdev/kpt/releases/tag/${REQUIRED_KPT_VERSION}"
else
    print_status "PASS" "kpt found in PATH"
    
    # Check kpt version
    CURRENT_VERSION=$(kpt version --short 2>/dev/null | grep -o 'v[0-9].*' | head -n1 || echo "unknown")
    
    if [ "$CURRENT_VERSION" = "unknown" ]; then
        print_status "WARN" "Unable to determine kpt version"
    else
        print_status "INFO" "Current kpt version: $CURRENT_VERSION"
        
        # Compare versions
        comparison=$(version_compare "$CURRENT_VERSION" "$REQUIRED_KPT_VERSION")
        
        if [ "$comparison" = "0" ]; then
            print_status "PASS" "kpt version matches requirement: $REQUIRED_KPT_VERSION"
        elif [ "$comparison" = "-1" ]; then
            print_status "FAIL" "kpt version $CURRENT_VERSION is older than required $REQUIRED_KPT_VERSION"
            print_status "INFO" "Upgrade using: make install-kpt"
        else
            print_status "WARN" "kpt version $CURRENT_VERSION is newer than tested $REQUIRED_KPT_VERSION"
            print_status "INFO" "This may work but is not officially supported"
        fi
    fi
fi

echo ""
echo "2. kpt Function Compatibility"
echo "-----------------------------"

# Test basic kpt functionality
if command -v kpt >/dev/null 2>&1; then
    # Test kpt version command
    if kpt version >/dev/null 2>&1; then
        print_status "PASS" "kpt version command works"
    else
        print_status "FAIL" "kpt version command failed"
    fi
    
    # Test kpt help
    if kpt help >/dev/null 2>&1; then
        print_status "PASS" "kpt help command works"
    else
        print_status "FAIL" "kpt help command failed"
    fi
    
    # Check for key kpt commands
    if kpt help 2>/dev/null | grep -q "pkg"; then
        print_status "PASS" "kpt pkg commands available"
    else
        print_status "WARN" "kpt pkg commands not found"
    fi
    
    if kpt help 2>/dev/null | grep -q "fn"; then
        print_status "PASS" "kpt fn commands available (Configuration as Data)"
    else
        print_status "FAIL" "kpt fn commands not found - required for Configuration as Data"
    fi
else
    print_status "FAIL" "Cannot test kpt functionality - kpt not installed"
fi

echo ""
echo "3. Configuration as Data Features"
echo "--------------------------------"

if command -v kpt >/dev/null 2>&1; then
    # Check for function pipeline support
    if kpt fn --help 2>/dev/null | grep -q "render\|eval"; then
        print_status "PASS" "kpt function pipeline support available"
    else
        print_status "WARN" "kpt function pipeline commands not found"
    fi
    
    # Check for package variant support (if available)
    if kpt help 2>/dev/null | grep -q "alpha"; then
        print_status "INFO" "kpt alpha features available (may include PackageVariant support)"
    else
        print_status "INFO" "kpt alpha features not available"
    fi
else
    print_status "FAIL" "Cannot test Configuration as Data features - kpt not installed"
fi

echo ""
echo "4. Environment and Dependencies"
echo "------------------------------"

# Check Go version (required for custom functions)
if command -v go >/dev/null 2>&1; then
    GO_VERSION=$(go version | grep -o 'go[0-9]\+\.[0-9]\+\.[0-9]\+')
    print_status "PASS" "Go found: $GO_VERSION"
    
    # Check if Go version is compatible
    if echo "$GO_VERSION" | grep -q "go1\.24\.6"; then
        print_status "PASS" "Go version is compatible with kpt functions"
    else
        print_status "WARN" "Go version may not be optimal for kpt functions (recommended: go1.24.6)"
    fi
else
    print_status "WARN" "Go not found - required for custom kpt functions"
fi

# Check Docker (required for some kpt functions)
if command -v docker >/dev/null 2>&1; then
    if docker version >/dev/null 2>&1; then
        print_status "PASS" "Docker found and accessible"
    else
        print_status "WARN" "Docker found but not accessible (may need to start Docker daemon)"
    fi
else
    print_status "WARN" "Docker not found - may be needed for some kpt functions"
fi

# Check kubectl (required for kpt live operations)
if command -v kubectl >/dev/null 2>&1; then
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "unknown")
    print_status "PASS" "kubectl found: $KUBECTL_VERSION"
else
    print_status "WARN" "kubectl not found - required for kpt live apply operations"
fi

echo ""
echo "5. Repository kpt Configuration"
echo "------------------------------"

# Check for Kptfile in repository
if find "$REPO_ROOT" -name "Kptfile" -type f | grep -q .; then
    KPTFILE_COUNT=$(find "$REPO_ROOT" -name "Kptfile" -type f | wc -l)
    print_status "PASS" "Found $KPTFILE_COUNT Kptfile(s) in repository"
else
    print_status "INFO" "No Kptfiles found in repository"
fi

# Check for kpt functions in repository
if find "$REPO_ROOT" -name "*.yaml" -o -name "*.yml" | xargs grep -l "kpt\." 2>/dev/null | grep -q .; then
    KPT_FUNCTION_COUNT=$(find "$REPO_ROOT" -name "*.yaml" -o -name "*.yml" | xargs grep -l "kpt\." 2>/dev/null | wc -l)
    print_status "PASS" "Found kpt functions in $KPT_FUNCTION_COUNT file(s)"
else
    print_status "INFO" "No kpt function references found in repository"
fi

# Check version consistency in documentation
if grep -r "v1\.0\.0-beta\.27" "$REPO_ROOT" --include="*.md" --exclude-dir=".git" >/dev/null 2>&1; then
    print_status "WARN" "Found deprecated kpt v1.0.0-beta.27 references in documentation"
    print_status "INFO" "Run 'make update-kpt-references' to update all references"
fi

echo ""
echo "6. Recommendations"
echo "-----------------"

if [ $EXIT_CODE -eq 0 ]; then
    print_status "PASS" "All critical checks passed"
    echo ""
    echo -e "${GREEN}kpt Configuration as Data Ready!${NC}"
    echo ""
    echo "Configuration as Data Benefits:"
    echo "  • Declarative package management"
    echo "  • Function-based transformations"
    echo "  • GitOps-native workflows"
    echo "  • Composable and reusable configurations"
    echo "  • Enhanced validation and policy enforcement"
else
    print_status "FAIL" "Critical issues found"
    echo ""
    echo -e "${RED}Action Required:${NC}"
    echo "1. Install/upgrade kpt: make install-kpt"
    echo "2. Verify installation: make verify-kpt"
    echo "3. Update references: make update-kpt-references"
fi

echo ""
echo "For more information:"
echo "  • kpt documentation: https://kpt.dev/"
echo "  • Configuration as Data: https://kpt.dev/book/"
echo "  • Nephio kpt usage: https://nephio.org/"

echo ""
echo "========================================="
echo "kpt Doctor Summary"
echo "========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ kpt environment is ready for Nephio O-RAN operations${NC}"
else
    echo -e "${RED}✗ kpt environment needs attention${NC}"
fi

echo ""
echo "Exit code: $EXIT_CODE"
exit $EXIT_CODE