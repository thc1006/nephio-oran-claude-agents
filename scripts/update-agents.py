#!/usr/bin/env python3
"""
Update all agent files to include standard output format
This script adds the collaboration protocol to existing agent files
"""

import os
import sys
from pathlib import Path

# Standard output format to add to each agent
STANDARD_OUTPUT_SECTION = """

## Collaboration Protocol

### Standard Output Format

I structure all responses using this standardized format to enable seamless multi-agent workflows:

```yaml
status: success|warning|error
summary: "Brief description of what was accomplished"
details:
  actions_taken:
    - "Specific action 1"
    - "Specific action 2"
  resources_created:
    - name: "resource-name"
      type: "kubernetes/terraform/config"
      location: "path or namespace"
  configurations_applied:
    - file: "config-file.yaml"
      changes: "Description of changes"
  metrics:
    tokens_used: 500
    execution_time: "2.3s"
next_steps:
  - "Recommended next action"
  - "Alternative action"
handoff_to: "suggested-next-agent"  # null if workflow complete
artifacts:
  - type: "yaml|json|script"
    name: "artifact-name"
    content: |
      # Actual content here
```

### Workflow Integration

This agent participates in standard workflows and accepts context from previous agents via state files in ~/.claude-workflows/"""

# Agent-specific workflow information
AGENT_WORKFLOWS = {
    "nephio-infrastructure-agent": """
- **Deployment Workflow**: First stage - provisions infrastructure, hands off to oran-nephio-dep-doctor
- **Upgrade Workflow**: Upgrades infrastructure components
- **Accepts from**: Initial request or performance-optimization-agent
- **Hands off to**: oran-nephio-dep-doctor or configuration-management-agent""",
    
    "oran-nephio-dep-doctor": """
- **Deployment Workflow**: Second stage - validates dependencies, hands off to configuration-management-agent
- **Validation Workflow**: Checks all dependencies for vulnerabilities
- **Accepts from**: nephio-infrastructure-agent
- **Hands off to**: configuration-management-agent""",
    
    "configuration-management-agent": """
- **Deployment Workflow**: Third stage - applies configurations, hands off to oran-network-functions-agent
- **Troubleshooting Workflow**: Applies fixes based on root cause analysis
- **Accepts from**: oran-nephio-dep-doctor or performance-optimization-agent
- **Hands off to**: oran-network-functions-agent or monitoring-analytics-agent""",
    
    "oran-network-functions-agent": """
- **Deployment Workflow**: Fourth stage - deploys network functions, hands off to monitoring-analytics-agent
- **Upgrade Workflow**: Upgrades network functions to new versions
- **Accepts from**: configuration-management-agent
- **Hands off to**: monitoring-analytics-agent""",
    
    "monitoring-analytics-agent": """
- **Deployment Workflow**: Fifth stage - sets up monitoring, hands off to performance-optimization-agent
- **Troubleshooting Workflow**: First stage for issue diagnosis, hands off to performance-optimization-agent
- **Accepts from**: oran-network-functions-agent or direct invocation
- **Hands off to**: performance-optimization-agent or null (if verification complete)""",
    
    "performance-optimization-agent": """
- **Deployment Workflow**: Final stage - applies optimizations
- **Troubleshooting Workflow**: Root cause analysis, hands off to configuration-management-agent
- **Accepts from**: monitoring-analytics-agent
- **Hands off to**: configuration-management-agent or null (workflow complete)""",
    
    "security-compliance-agent": """
- **Validation Workflow**: First stage - security assessment, hands off to oran-nephio-dep-doctor
- **Pre-deployment Check**: Can be invoked before any deployment
- **Accepts from**: Direct invocation or any agent requiring security validation
- **Hands off to**: oran-nephio-dep-doctor or deployment approval""",
    
    "data-analytics-agent": """
- **Analytics Pipeline**: Processes telemetry data from monitoring-analytics-agent
- **Accepts from**: monitoring-analytics-agent
- **Hands off to**: performance-optimization-agent for insights-based optimization""",
    
    "testing-validation-agent": """
- **Post-deployment Validation**: Runs E2E tests after deployment
- **Accepts from**: Any agent after deployment/configuration changes
- **Hands off to**: null (provides test report) or monitoring-analytics-agent for continuous validation"""
}

def update_agent_file(agent_file: Path) -> bool:
    """Update a single agent file with standard output format"""
    
    # Get agent name from filename
    agent_name = agent_file.stem
    
    print(f"Processing {agent_name}...")
    
    try:
        # Read current content
        with open(agent_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if "## Collaboration Protocol" in content or "Standard Output Format" in content:
            print(f"  ✓ Already updated, skipping")
            return True
        
        # Get agent-specific workflow info
        workflow_info = AGENT_WORKFLOWS.get(agent_name, """
- **Participates in**: Various workflows as needed
- **Accepts from**: Previous agents in workflow
- **Hands off to**: Next agent as determined by workflow context""")
        
        # Prepare the addition
        addition = STANDARD_OUTPUT_SECTION + "\n\n" + workflow_info
        
        # Add before the last line if it exists, otherwise append
        updated_content = content.rstrip() + "\n" + addition + "\n"
        
        # Write back
        with open(agent_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"  ✅ Successfully updated")
        return True
        
    except Exception as e:
        print(f"  ❌ Error updating file: {e}")
        return False

def main():
    """Main function to update all agent files"""
    
    print("=" * 60)
    print("Updating Agent Files with Collaboration Protocol")
    print("=" * 60)
    
    # Find all agent files
    # Try both current directory and agents/ directory
    agent_files = []
    
    # Check agents/ directory first
    agents_dir = Path('agents')
    if agents_dir.exists():
        agent_files.extend(agents_dir.glob('*-agent.md'))
    
    # Check current directory as fallback
    if not agent_files:
        agent_files.extend(Path('.').glob('*-agent.md'))
    
    # Check parent directory if we're in a subdirectory
    if not agent_files:
        agent_files.extend(Path('..').glob('*-agent.md'))
    
    if not agent_files:
        print("❌ No agent files found!")
        print("   Make sure you run this script from the repository root")
        return 1
    
    print(f"Found {len(agent_files)} agent files to update\n")
    
    # Update each file
    success_count = 0
    for agent_file in sorted(agent_files):
        if update_agent_file(agent_file):
            success_count += 1
    
    # Summary
    print("\n" + "=" * 60)
    print(f"Update Complete!")
    print(f"✅ Successfully updated: {success_count}/{len(agent_files)} files")
    
    if success_count < len(agent_files):
        print(f"⚠️  Some files failed to update. Please check manually.")
        return 1
    
    print("\nNext steps:")
    print("1. Review the updated agent files")
    print("2. Test with: ./scripts/run-workflow.sh deploy")
    print("3. Commit changes to your repository")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())