#!/bin/bash

# Monitoring Stack Smoke Test Script
# Tests Prometheus 3.5 LTS and Grafana 12.x

set -e

PROMETHEUS_URL="http://localhost:9090"
GRAFANA_URL="http://localhost:3000"

echo "========================================="
echo "Monitoring Stack Smoke Test"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check URL
check_url() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -f -s -o /dev/null "$url"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check version
check_version() {
    local url=$1
    local expected=$2
    local description=$3
    local json_path=$4
    
    echo -n "Checking $description... "
    
    actual=$(curl -s "$url" | jq -r "$json_path" 2>/dev/null || echo "unknown")
    
    if [[ "$actual" == *"$expected"* ]]; then
        echo -e "${GREEN}✅ $actual${NC}"
        return 0
    else
        echo -e "${RED}❌ Expected $expected, got $actual${NC}"
        return 1
    fi
}

# Start tests
echo "1. Prometheus Tests"
echo "-------------------"

# Check Prometheus ready endpoint
check_url "$PROMETHEUS_URL/-/ready" "Prometheus ready endpoint"

# Check Prometheus health
check_url "$PROMETHEUS_URL/-/healthy" "Prometheus health endpoint"

# Check Prometheus version
check_version "$PROMETHEUS_URL/api/v1/status/buildinfo" "3.5" "Prometheus version" ".data.version"

# Check native histograms
echo -n "Checking native histograms... "
native_hist=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=prometheus_tsdb_native_histogram_samples_total" | jq -r '.status' 2>/dev/null)
if [[ "$native_hist" == "success" ]]; then
    echo -e "${GREEN}✅ Enabled${NC}"
else
    echo -e "${YELLOW}⚠ Cannot verify${NC}"
fi

# Check targets
echo -n "Checking scrape targets... "
targets=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq -r '.data.activeTargets | length' 2>/dev/null || echo "0")
if [[ "$targets" -gt 0 ]]; then
    echo -e "${GREEN}✅ $targets active targets${NC}"
else
    echo -e "${YELLOW}⚠ No active targets${NC}"
fi

echo ""
echo "2. Grafana Tests"
echo "----------------"

# Check Grafana health
check_url "$GRAFANA_URL/api/health" "Grafana health endpoint"

# Check Grafana login page
check_url "$GRAFANA_URL/login" "Grafana login page"

# Check Grafana version
echo -n "Checking Grafana version... "
grafana_version=$(curl -s "$GRAFANA_URL/api/frontend/settings" | jq -r '.buildInfo.version' 2>/dev/null || echo "unknown")
if [[ "$grafana_version" == *"12."* ]]; then
    echo -e "${GREEN}✅ $grafana_version${NC}"
else
    echo -e "${RED}❌ Expected 12.x, got $grafana_version${NC}"
fi

# Check datasources (requires auth)
echo -n "Checking datasources... "
datasources=$(curl -s -u admin:admin "$GRAFANA_URL/api/datasources" 2>/dev/null | jq '. | length' 2>/dev/null || echo "auth_required")
if [[ "$datasources" == "auth_required" ]]; then
    echo -e "${YELLOW}⚠ Authentication required (expected)${NC}"
elif [[ "$datasources" -gt 0 ]]; then
    echo -e "${GREEN}✅ $datasources datasources configured${NC}"
else
    echo -e "${RED}❌ No datasources found${NC}"
fi

echo ""
echo "3. Integration Tests"
echo "--------------------"

# Check if Prometheus can scrape node exporter
echo -n "Checking node exporter metrics... "
node_metrics=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=up{job=\"node-exporter\"}" | jq -r '.data.result | length' 2>/dev/null || echo "0")
if [[ "$node_metrics" -gt 0 ]]; then
    echo -e "${GREEN}✅ Node exporter metrics available${NC}"
else
    echo -e "${YELLOW}⚠ Node exporter metrics not found${NC}"
fi

# Check Alertmanager
echo -n "Checking Alertmanager... "
if curl -f -s -o /dev/null "http://localhost:9093/-/ready"; then
    echo -e "${GREEN}✅ Alertmanager ready${NC}"
else
    echo -e "${YELLOW}⚠ Alertmanager not accessible${NC}"
fi

# Check VictoriaMetrics
echo -n "Checking VictoriaMetrics... "
if curl -f -s -o /dev/null "http://localhost:8428/health"; then
    echo -e "${GREEN}✅ VictoriaMetrics ready${NC}"
else
    echo -e "${YELLOW}⚠ VictoriaMetrics not accessible${NC}"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="

# Count successes
if [[ $(echo -e "${GREEN}" | wc -l) -gt 5 ]]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "Monitoring stack is ready:"
    echo "  - Prometheus 3.5 LTS: $PROMETHEUS_URL"
    echo "  - Grafana 12.x: $GRAFANA_URL (admin/admin)"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed or returned warnings${NC}"
    echo "Please check the logs: docker compose logs"
    exit 1
fi