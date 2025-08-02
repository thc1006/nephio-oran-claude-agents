#!/usr/bin/env python3
"""
Simple script to log token usage after Claude Code tasks
"""

import sys
import os
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from token_efficiency_monitor import TokenEfficiencyMonitor
except ImportError:
    print("Error: Could not import TokenEfficiencyMonitor. Make sure token_efficiency_monitor.py is in the same directory.")
    sys.exit(1)

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 log_usage.py <agent_name> <task_type> <tokens_used> [notes]")
        print("Example: python3 log_usage.py nephio-infrastructure-agent infrastructure_deployment 450 'Edge deployment'")
        return
    
    agent_name = sys.argv[1]
    task_type = sys.argv[2]
    tokens_used = int(sys.argv[3])
    notes = sys.argv[4] if len(sys.argv) > 4 else ""
    
    monitor = TokenEfficiencyMonitor()
    monitor.log_token_usage(agent_name, task_type, tokens_used, notes)

if __name__ == "__main__":
    main()
