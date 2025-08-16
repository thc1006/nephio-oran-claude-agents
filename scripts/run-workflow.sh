#!/bin/bash
# Simple workflow runner for Nephio-O-RAN Claude Code Agents
# Usage: ./run-workflow.sh [deploy|troubleshoot|validate|upgrade]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKFLOW_NAME=${1:-deploy}
WORKFLOW_ID=$(date +%Y%m%d-%H%M%S)
STATE_DIR="$HOME/.claude-workflows/$WORKFLOW_ID"

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to print banner
print_banner() {
    echo ""
    print_color $BLUE "═══════════════════════════════════════════════════════════════"
    print_color $BLUE "   Nephio-O-RAN Agent Workflow Runner"
    print_color $BLUE "═══════════════════════════════════════════════════════════════"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_color $YELLOW "📋 Checking prerequisites..."
    
    # Check if claude command exists
    if ! command -v claude &> /dev/null; then
        print_color $RED "❌ Error: 'claude' command not found"
        print_color $RED "   Please install Claude Code first"
        exit 1
    fi
    
    # Check if Python exists (for advanced features)
    if command -v python3 &> /dev/null; then
        print_color $GREEN "✅ Python3 found - advanced features available"
        PYTHON_AVAILABLE=true
    else
        print_color $YELLOW "⚠️  Python3 not found - using basic mode"
        PYTHON_AVAILABLE=false
    fi
    
    # Create state directory
    mkdir -p "$STATE_DIR"
    print_color $GREEN "✅ State directory created: $STATE_DIR"
}

# Function to save stage output
save_output() {
    local stage_name=$1
    local agent=$2
    local output_file=$3
    local status=$(grep "^status:" "$output_file" 2>/dev/null | cut -d: -f2 | xargs)
    
    # Create stage summary
    cat > "$STATE_DIR/stage-$stage_name-summary.txt" <<EOF
Stage: $stage_name
Agent: $agent
Status: ${status:-unknown}
Timestamp: $(date -Iseconds)
Output File: $output_file
EOF
}

# Function to execute an agent
execute_agent() {
    local stage_name=$1
    local agent=$2
    local task=$3
    local stage_num=$4
    local total_stages=$5
    
    print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_color $YELLOW "📍 Stage $stage_num/$total_stages: $stage_name"
    print_color $YELLOW "   Agent: $agent"
    print_color $YELLOW "   Task: $task"
    
    # Prepare context reference
    local context_msg=""
    if [ -f "$STATE_DIR/context.txt" ]; then
        context_msg=" Previous outputs are in $STATE_DIR"
    fi
    
    # Build command
    local command="Use $agent to $task.$context_msg Please format output with status, summary, and handoff_to fields."
    
    # Execute agent
    local output_file="$STATE_DIR/stage-$stage_num-$stage_name.txt"
    print_color $BLUE "   Executing agent..."
    
    if claude code "$command" > "$output_file" 2>&1; then
        print_color $GREEN "   ✅ Agent completed"
    else
        print_color $RED "   ❌ Agent failed"
        print_color $RED "   Check output: $output_file"
        return 1
    fi
    
    # Save output
    save_output "$stage_name" "$agent" "$output_file"
    
    # Check status
    local status=$(grep "^status:" "$output_file" 2>/dev/null | cut -d: -f2 | xargs)
    case "$status" in
        success)
            print_color $GREEN "   ✅ Status: SUCCESS"
            ;;
        warning)
            print_color $YELLOW "   ⚠️  Status: WARNING"
            ;;
        error)
            print_color $RED "   ❌ Status: ERROR"
            return 1
            ;;
        *)
            print_color $YELLOW "   ❓ Status: UNKNOWN (assuming success)"
            ;;
    esac
    
    # Check for handoff
    local handoff=$(grep "^handoff_to:" "$output_file" 2>/dev/null | cut -d: -f2 | xargs)
    if [ -n "$handoff" ] && [ "$handoff" != "null" ]; then
        print_color $BLUE "   ➡️  Suggested handoff to: $handoff"
        echo "$handoff" > "$STATE_DIR/next-agent.txt"
    fi
    
    # Update context for next stage
    echo "Previous stage: $stage_name (Agent: $agent) - Status: ${status:-unknown}" >> "$STATE_DIR/context.txt"
    
    return 0
}

# Define workflows
define_deployment_workflow() {
    STAGES=(
        "infrastructure:nephio-infrastructure-agent:provision O-Cloud infrastructure with 3 nodes for edge deployment"
        "dependencies:oran-nephio-dep-doctor:validate all dependencies and check compatibility"
        "configuration:configuration-management-agent:apply YANG models and Kpt packages for O-RAN components"
        "network-functions:oran-network-functions-agent:deploy O-RAN CU, DU, and RU network functions"
        "monitoring:monitoring-analytics-agent:setup comprehensive observability and monitoring"
        "optimization:performance-optimization-agent:apply initial performance optimizations"
    )
}

define_troubleshooting_workflow() {
    STAGES=(
        "diagnosis:monitoring-analytics-agent:analyze system metrics and identify performance issues"
        "root-cause:performance-optimization-agent:perform root cause analysis on identified issues"
        "remediation:configuration-management-agent:apply configuration fixes based on root cause analysis"
        "verification:monitoring-analytics-agent:verify that issues are resolved and system is healthy"
    )
}

define_validation_workflow() {
    STAGES=(
        "security-scan:security-compliance-agent:perform comprehensive security assessment and compliance check"
        "dependency-check:oran-nephio-dep-doctor:validate all dependencies for vulnerabilities"
        "performance-baseline:performance-optimization-agent:establish performance baselines and validate SLAs"
    )
}

define_upgrade_workflow() {
    STAGES=(
        "pre-check:oran-nephio-dep-doctor:validate upgrade compatibility and dependencies"
        "backup:configuration-management-agent:backup current configurations and state"
        "upgrade-infra:nephio-infrastructure-agent:upgrade infrastructure components to new versions"
        "upgrade-nf:oran-network-functions-agent:upgrade network functions to new versions"
        "validate:monitoring-analytics-agent:validate upgrade success and system health"
    )
}

# Main execution
main() {
    print_banner
    
    # Check prerequisites
    check_prerequisites
    
    # Select workflow
    case $WORKFLOW_NAME in
        deploy|deployment)
            print_color $GREEN "🚀 Starting DEPLOYMENT workflow"
            define_deployment_workflow
            ;;
        troubleshoot|debug)
            print_color $YELLOW "🔍 Starting TROUBLESHOOTING workflow"
            define_troubleshooting_workflow
            ;;
        validate|validation)
            print_color $BLUE "✓ Starting VALIDATION workflow"
            define_validation_workflow
            ;;
        upgrade)
            print_color $YELLOW "⬆️  Starting UPGRADE workflow"
            define_upgrade_workflow
            ;;
        *)
            print_color $RED "❌ Unknown workflow: $WORKFLOW_NAME"
            print_color $YELLOW "Available workflows: deploy, troubleshoot, validate, upgrade"
            exit 1
            ;;
    esac
    
    # Save workflow info
    cat > "$STATE_DIR/workflow-info.txt" <<EOF
Workflow: $WORKFLOW_NAME
ID: $WORKFLOW_ID
Started: $(date -Iseconds)
Total Stages: ${#STAGES[@]}
EOF
    
    print_color $BLUE "Workflow ID: $WORKFLOW_ID"
    print_color $BLUE "Total stages: ${#STAGES[@]}"
    echo ""
    
    # Execute workflow stages
    STAGE_NUM=1
    FAILED=false
    
    for stage_info in "${STAGES[@]}"; do
        IFS=':' read -r stage_name agent task <<< "$stage_info"
        
        if execute_agent "$stage_name" "$agent" "$task" "$STAGE_NUM" "${#STAGES[@]}"; then
            ((STAGE_NUM++))
        else
            print_color $RED "❌ Stage failed: $stage_name"
            FAILED=true
            break
        fi
        
        # Small delay between stages
        sleep 2
    done
    
    # Generate summary
    echo ""
    print_color $BLUE "═══════════════════════════════════════════════════════════════"
    
    if [ "$FAILED" = true ]; then
        print_color $RED "❌ WORKFLOW FAILED"
        print_color $YELLOW "   Check logs in: $STATE_DIR"
        
        # Show last error
        if [ -f "$STATE_DIR/stage-$STAGE_NUM-*.txt" ]; then
            print_color $YELLOW "   Last stage output:"
            tail -n 10 "$STATE_DIR/stage-$STAGE_NUM-"*.txt 2>/dev/null | head -n 5
        fi
        
        exit 1
    else
        print_color $GREEN "✅ WORKFLOW COMPLETED SUCCESSFULLY!"
        print_color $GREEN "   Results saved in: $STATE_DIR"
        
        # Generate simple report
        cat > "$STATE_DIR/report.txt" <<EOF
WORKFLOW EXECUTION REPORT
========================
Workflow: $WORKFLOW_NAME
ID: $WORKFLOW_ID
Status: COMPLETED
Started: $(cat "$STATE_DIR/workflow-info.txt" | grep Started | cut -d: -f2-)
Completed: $(date -Iseconds)
Stages Executed: $((STAGE_NUM - 1))/${#STAGES[@]}

Stage Summary:
EOF
        
        # Add stage summaries
        for summary_file in "$STATE_DIR"/stage-*-summary.txt; do
            if [ -f "$summary_file" ]; then
                echo "" >> "$STATE_DIR/report.txt"
                cat "$summary_file" >> "$STATE_DIR/report.txt"
            fi
        done
        
        print_color $GREEN "   Report: $STATE_DIR/report.txt"
    fi
    
    # Offer to run Python orchestrator if available
    if [ "$PYTHON_AVAILABLE" = true ] && [ -f "orchestration/orchestrator.py" ]; then
        echo ""
        print_color $BLUE "💡 Tip: For advanced features, use the Python orchestrator:"
        print_color $BLUE "   python3 orchestration/orchestrator.py $WORKFLOW_NAME"
    fi
}

# Run main function
main