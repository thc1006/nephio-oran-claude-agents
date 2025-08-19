#!/bin/bash

# Test script for DAG validation

set -e

echo "========================================="
echo "Testing Agent DAG Validation"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to script directory
cd "$(dirname "$0")"

# Build the DAG checker
echo "Building DAG checker..."
if go build -o dagcheck main.go; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Run validation
echo ""
echo "Running DAG validation..."
if ./dagcheck \
    --dir ../../agents \
    --output ../../docs/agents/dag_report.md \
    --dot ../../docs/agents/agent_dag.dot \
    --verbose; then
    echo -e "${GREEN}✅ DAG validation passed${NC}"
else
    echo -e "${RED}❌ DAG validation failed${NC}"
    exit 1
fi

# Check if Graphviz is available
echo ""
echo "Checking for Graphviz..."
if command -v dot &> /dev/null; then
    echo -e "${GREEN}✅ Graphviz found${NC}"
    
    # Generate visualizations
    echo "Generating visualizations..."
    dot -Tpng ../../docs/agents/agent_dag.dot -o ../../docs/agents/agent_dag.png
    dot -Tsvg ../../docs/agents/agent_dag.dot -o ../../docs/agents/agent_dag.svg
    echo -e "${GREEN}✅ Generated PNG and SVG visualizations${NC}"
else
    echo -e "${YELLOW}⚠️  Graphviz not found - skipping visualization${NC}"
fi

# Check report contents
echo ""
echo "Checking report contents..."
if [ -f "../../docs/agents/dag_report.md" ]; then
    # Extract key metrics
    agents=$(grep "Total Agents:" ../../docs/agents/dag_report.md | awk '{print $NF}')
    cycles=$(grep "Cycles Detected:" ../../docs/agents/dag_report.md | awk '{print $NF}')
    broken=$(grep "Broken Edges:" ../../docs/agents/dag_report.md | awk '{print $NF}')
    
    echo "  Agents found: $agents"
    echo "  Cycles detected: $cycles"
    echo "  Broken edges: $broken"
    
    if [ "$cycles" = "0" ] && [ "$broken" = "0" ]; then
        echo -e "${GREEN}✅ DAG is valid (no cycles or broken edges)${NC}"
    else
        echo -e "${RED}❌ DAG has issues${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Report file not generated${NC}"
    exit 1
fi

# Test specific requirements
echo ""
echo "Verifying specific requirements..."

# Check for expected source agent
if grep -q "nephio-infrastructure-agent.*✅.*Expected" ../../docs/agents/dag_report.md; then
    echo -e "${GREEN}✅ nephio-infrastructure-agent is a valid source${NC}"
else
    echo -e "${YELLOW}⚠️  nephio-infrastructure-agent may not be a proper source${NC}"
fi

# Check for expected sink agent
if grep -q "testing-validation-agent.*✅.*Expected" ../../docs/agents/dag_report.md; then
    echo -e "${GREEN}✅ testing-validation-agent is a valid sink${NC}"
else
    echo -e "${YELLOW}⚠️  testing-validation-agent may not be a proper sink${NC}"
fi

echo ""
echo "========================================="
echo -e "${GREEN}All tests completed successfully!${NC}"
echo "========================================="
echo ""
echo "Generated files:"
echo "  - docs/agents/dag_report.md"
echo "  - docs/agents/agent_dag.dot"
if [ -f "../../docs/agents/agent_dag.png" ]; then
    echo "  - docs/agents/agent_dag.png"
    echo "  - docs/agents/agent_dag.svg"
fi

exit 0