#!/bin/bash

# Routing Test Script for Nephio O-RAN Claude Agents Documentation
# This script tests all critical routes after deployment to ensure proper routing and redirects

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL - can be overridden by environment variable
BASE_URL=${BASE_URL:-"https://thc1006.github.io/nephio-oran-claude-agents"}

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test a URL
test_url() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing: $description... "
    
    # Get HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$url")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test redirect
test_redirect() {
    local url=$1
    local expected_location=$2
    local description=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing redirect: $description... "
    
    # Get redirect location
    redirect_location=$(curl -s -o /dev/null -w "%{redirect_url}" "$url")
    
    if [[ "$redirect_location" == *"$expected_location"* ]]; then
        echo -e "${GREEN}✓ PASSED${NC} (Redirects to: $expected_location)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_location, Got: $redirect_location)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "======================================"
echo "🧪 Routing Test Suite"
echo "Base URL: $BASE_URL"
echo "======================================"
echo ""

# Test 1: Homepage
echo -e "${YELLOW}Testing Homepage Routes${NC}"
test_url "$BASE_URL/" 200 "Homepage (root)"
test_url "$BASE_URL/index.html" 200 "Homepage (index.html)"

# Test 2: English Documentation
echo ""
echo -e "${YELLOW}Testing English Documentation Routes${NC}"
test_url "$BASE_URL/docs/intro" 200 "Docs intro page"
test_url "$BASE_URL/docs/01-getting-started" 200 "Getting started section"
test_url "$BASE_URL/docs/02-concepts" 200 "Concepts section"
test_url "$BASE_URL/docs/07-troubleshooting" 200 "Troubleshooting section"

# Test 3: Documentation Redirects
echo ""
echo -e "${YELLOW}Testing Documentation Redirects${NC}"
test_redirect "$BASE_URL/docs" "/docs/intro" "/docs should redirect to /docs/intro"
test_redirect "$BASE_URL/docs/" "/docs/intro" "/docs/ should redirect to /docs/intro"

# Test 4: Traditional Chinese (zh-TW) Routes
echo ""
echo -e "${YELLOW}Testing Traditional Chinese (zh-TW) Routes${NC}"
test_url "$BASE_URL/zh-TW/" 200 "zh-TW homepage"
test_url "$BASE_URL/zh-TW/docs/intro" 200 "zh-TW docs intro"

# Test 5: zh-TW Redirects
echo ""
echo -e "${YELLOW}Testing zh-TW Redirects${NC}"
test_redirect "$BASE_URL/zh-TW/docs" "/zh-TW/docs/intro" "/zh-TW/docs should redirect to intro"
test_redirect "$BASE_URL/zh-TW/docs/" "/zh-TW/docs/intro" "/zh-TW/docs/ should redirect to intro"

# Test 6: Verify NO double locale paths
echo ""
echo -e "${YELLOW}Testing for Double Locale Path Issues${NC}"
test_url "$BASE_URL/zh-TW/zh-TW/docs/intro" 404 "Double zh-TW path should return 404"

# Test 7: Blog Routes
echo ""
echo -e "${YELLOW}Testing Blog Routes${NC}"
test_url "$BASE_URL/blog" 200 "Blog main page"

# Test 8: Static Assets
echo ""
echo -e "${YELLOW}Testing Static Assets${NC}"
test_url "$BASE_URL/img/favicon.ico" 200 "Favicon"
test_url "$BASE_URL/img/logo.svg" 200 "Logo"

# Test 9: API Documentation
echo ""
echo -e "${YELLOW}Testing API Documentation${NC}"
test_url "$BASE_URL/docs/04-api-reference" 200 "API reference section"

# Test 10: Agent Documentation
echo ""
echo -e "${YELLOW}Testing Agent Documentation${NC}"
test_url "$BASE_URL/docs/agents" 200 "Agents documentation"

# Summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Please check the routing configuration.${NC}"
    exit 1
fi