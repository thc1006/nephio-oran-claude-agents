#!/bin/bash

# Version Verification Script for Nephio-O-RAN Claude Agents
# Ensures all version references are correctly normalized
# Exit code: 0 if all checks pass, 1 if any issues found

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXIT_CODE=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Version Verification Script"
echo "Repository: ${REPO_ROOT}"
echo "========================================="
echo ""

# Function to check for version patterns
check_version() {
    local pattern="$1"
    local description="$2"
    local allowed_patterns="$3"
    
    echo -n "Checking ${description}... "
    
    # Find files that match the pattern but don't match allowed patterns
    local violations=""
    if [ -n "$allowed_patterns" ]; then
        violations=$(grep -r "$pattern" "${REPO_ROOT}" \
            --include="*.md" \
            --include="*.yaml" \
            --include="*.yml" \
            --include="*.go" \
            --include="*.sh" \
            --include="*.dockerfile" \
            --include="Dockerfile" \
            --exclude-dir=".git" \
            --exclude-dir="node_modules" \
            --exclude-dir="vendor" \
            --exclude="verify_versions.sh" \
            --exclude="version_sweep.md" | \
            grep -vE "$allowed_patterns" || true)
    else
        violations=$(grep -r "$pattern" "${REPO_ROOT}" \
            --include="*.md" \
            --include="*.yaml" \
            --include="*.yml" \
            --include="*.go" \
            --include="*.sh" \
            --include="*.dockerfile" \
            --include="Dockerfile" \
            --exclude-dir=".git" \
            --exclude-dir="node_modules" \
            --exclude-dir="vendor" \
            --exclude="verify_versions.sh" \
            --exclude="version_sweep.md" || true)
    fi
    
    if [ -z "$violations" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Found violations:${NC}"
        echo "$violations" | head -10
        EXIT_CODE=1
        return 1
    fi
}

# 1. Check for non-normalized Go versions
echo "1. Go Version Checks"
echo "--------------------"

# Check for go1.24 without .6
check_version 'go1\.24[^.6]' "go1.24 without .6" 'go1\.24\.6|go1\.24\.\*'

# Check for go 1.24 without .6 in go.mod context
check_version 'go\s+1\.24[^.6]' "go 1.24 in go.mod style" 'go\s+1\.24\.6'

# Check for incorrect Go download URLs
check_version 'go1\.24\.linux' "Go download URL without version" 'go1\.24\.6\.linux'

echo ""

# 2. Check for FIPS configurations
echo "2. FIPS Configuration Checks"
echo "----------------------------"

# Check for deprecated GOFIPS environment variable (not GOFIPS140)
check_version 'GOFIPS[^1]' "deprecated GOFIPS variable" 'GOFIPS140'

# Check for boringcrypto references
check_version 'boringcrypto' "deprecated boringcrypto references"

# Verify GODEBUG=fips140=on is used correctly
echo -n "Verifying GODEBUG=fips140=on usage... "
fips_correct=$(grep -r 'GODEBUG.*fips140=on' "${REPO_ROOT}" \
    --include="*.md" \
    --include="*.yaml" \
    --include="*.yml" \
    --include="*.go" \
    --include="*.sh" \
    --exclude-dir=".git" \
    --exclude="verify_versions.sh" | wc -l)

if [ "$fips_correct" -gt 0 ]; then
    echo -e "${GREEN}✓ Found ${fips_correct} correct FIPS configurations${NC}"
else
    echo -e "${YELLOW}⚠ Warning: No FIPS configurations found${NC}"
fi

echo ""

# 3. Check for Kubernetes versions
echo "3. Kubernetes Version Checks"
echo "----------------------------"

# Check for kubectl: 1.32+ (should be 1.32.x)
check_version 'kubectl:\s*1\.32\+' "kubectl: 1.32+ (should be 1.32.x)" 'kubectl:\s*1\.32\.x'

# Verify kubectl: 1.32.x is used
echo -n "Verifying kubectl: 1.32.x usage... "
kubectl_correct=$(grep -r 'kubectl:\s*1\.32\.x' "${REPO_ROOT}" \
    --include="*.md" \
    --include="*.yaml" \
    --exclude-dir=".git" | wc -l)

if [ "$kubectl_correct" -gt 0 ]; then
    echo -e "${GREEN}✓ Found ${kubectl_correct} correct kubectl version references${NC}"
else
    echo -e "${YELLOW}⚠ Warning: No kubectl: 1.32.x references found${NC}"
fi

echo ""

# 4. Check for consistency in version tables
echo "4. Version Table Consistency"
echo "----------------------------"

echo -n "Checking version tables for Go 1.24.6... "
go_tables=$(grep -r '|\s*\*\*Go\*\*.*1\.24\.6' "${REPO_ROOT}" \
    --include="*.md" \
    --exclude-dir=".git" | wc -l)

if [ "$go_tables" -gt 0 ]; then
    echo -e "${GREEN}✓ Found ${go_tables} version tables with Go 1.24.6${NC}"
else
    echo -e "${YELLOW}⚠ Warning: No version tables with Go 1.24.6 found${NC}"
fi

echo ""

# 5. Summary
echo "========================================="
echo "Verification Summary"
echo "========================================="

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All version checks passed!${NC}"
    echo ""
    echo "Version standards verified:"
    echo "  • Go: 1.24.6 (patch stream)"
    echo "  • FIPS: GODEBUG=fips140=on (Go Cryptographic Module v1.0.0)"
    echo "  • Kubernetes: 1.32.x (safe floor with skew policy)"
else
    echo -e "${RED}✗ Some version checks failed!${NC}"
    echo ""
    echo "Please review the violations above and update accordingly."
    echo "Refer to reports/version_sweep.md for the normalization standards."
fi

echo ""
echo "Exit code: $EXIT_CODE"
exit $EXIT_CODE