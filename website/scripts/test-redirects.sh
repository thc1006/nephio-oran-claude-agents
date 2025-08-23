#!/bin/bash

# Redirect Testing Script for Nephio O-RAN Claude Agents
# Tests specific redirect functionality for documentation routes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL - can be overridden by environment variable
BASE_URL=${BASE_URL:-"https://thc1006.github.io/nephio-oran-claude-agents"}

# Test results tracking
declare -a RESULTS=()

# Function to test redirect with curl -I (HEAD request)
test_redirect() {
    local url=$1
    local expected_location=$2
    local description=$3
    
    echo -e "${BLUE}Testing:${NC} $description"
    echo "  URL: $url"
    
    # Get headers including redirects
    response=$(curl -sI -L --max-redirs 5 "$url" 2>&1)
    
    # Check if the final location matches expected
    if echo "$response" | grep -q "HTTP/[0-9.]* 200"; then
        # Extract the redirect chain
        redirects=$(echo "$response" | grep -i "location:" | sed 's/location: //i')
        
        if [ -n "$redirects" ]; then
            echo -e "  ${YELLOW}Redirect Chain:${NC}"
            echo "$redirects" | while read -r redirect; do
                echo "    → $redirect"
            done
        fi
        
        # Check if expected location is in the redirect chain
        if echo "$redirects" | grep -q "$expected_location"; then
            echo -e "  ${GREEN}✓ PASSED${NC} - Redirects to $expected_location"
            RESULTS+=("PASS: $description")
            return 0
        else
            # Check if we're already at the expected location (no redirect needed)
            if [[ "$url" == *"$expected_location" ]]; then
                echo -e "  ${GREEN}✓ PASSED${NC} - Already at correct location"
                RESULTS+=("PASS: $description")
                return 0
            else
                echo -e "  ${RED}✗ FAILED${NC} - Expected redirect to $expected_location"
                RESULTS+=("FAIL: $description")
                return 1
            fi
        fi
    else
        echo -e "  ${RED}✗ FAILED${NC} - No successful response"
        RESULTS+=("FAIL: $description")
        return 1
    fi
}

# Function to test direct access (should return 200 OK)
test_direct_access() {
    local url=$1
    local description=$2
    
    echo -e "${BLUE}Testing Direct Access:${NC} $description"
    echo "  URL: $url"
    
    status=$(curl -sI "$url" | head -n 1 | grep -oE "HTTP/[0-9.]* [0-9]+")
    
    if echo "$status" | grep -q "200"; then
        echo -e "  ${GREEN}✓ PASSED${NC} - Returns 200 OK"
        RESULTS+=("PASS: $description")
        return 0
    else
        echo -e "  ${RED}✗ FAILED${NC} - Status: $status"
        RESULTS+=("FAIL: $description")
        return 1
    fi
}

echo "======================================"
echo "🔄 Redirect Testing Suite"
echo "Base URL: $BASE_URL"
echo "Date: $(date)"
echo "======================================"
echo ""

# Test English documentation redirects
echo -e "${YELLOW}=== English Documentation Redirects ===${NC}"
echo ""
test_redirect "$BASE_URL/docs" "/docs/intro" "/docs → /docs/intro"
test_redirect "$BASE_URL/docs/" "/docs/intro" "/docs/ → /docs/intro"
echo ""

# Test Traditional Chinese redirects
echo -e "${YELLOW}=== Traditional Chinese (zh-TW) Redirects ===${NC}"
echo ""
test_redirect "$BASE_URL/zh-TW/docs" "/zh-TW/docs/intro" "/zh-TW/docs → /zh-TW/docs/intro"
test_redirect "$BASE_URL/zh-TW/docs/" "/zh-TW/docs/intro" "/zh-TW/docs/ → /zh-TW/docs/intro"
echo ""

# Test direct access to final destinations
echo -e "${YELLOW}=== Direct Access Tests ===${NC}"
echo ""
test_direct_access "$BASE_URL/docs/intro" "English intro page"
test_direct_access "$BASE_URL/zh-TW/docs/intro" "zh-TW intro page"
echo ""

# Test that double locale paths return 404
echo -e "${YELLOW}=== Invalid Path Tests ===${NC}"
echo ""
echo -e "${BLUE}Testing:${NC} Double locale path should fail"
echo "  URL: $BASE_URL/zh-TW/zh-TW/docs/intro"
status=$(curl -sI "$BASE_URL/zh-TW/zh-TW/docs/intro" | head -n 1 | grep -oE "[0-9]+$")
if [ "$status" = "404" ]; then
    echo -e "  ${GREEN}✓ PASSED${NC} - Returns 404 as expected"
    RESULTS+=("PASS: Double locale path returns 404")
else
    echo -e "  ${RED}✗ FAILED${NC} - Expected 404, got $status"
    RESULTS+=("FAIL: Double locale path test")
fi
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
pass_count=0
fail_count=0

for result in "${RESULTS[@]}"; do
    if [[ "$result" == PASS* ]]; then
        echo -e "${GREEN}✓${NC} $result"
        ((pass_count++))
    else
        echo -e "${RED}✗${NC} $result"
        ((fail_count++))
    fi
done

echo ""
echo -e "Total: $((pass_count + fail_count)) tests"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All redirect tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some redirect tests failed.${NC}"
    exit 1
fi