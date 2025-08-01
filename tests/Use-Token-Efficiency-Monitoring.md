<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# How to Use the Token Efficiency Monitoring Code

Yes, you should create code files! The token efficiency metrics I showed you are part of a comprehensive monitoring system. Here's exactly how to implement and use it:

## 🚀 Quick Start Implementation

### Step 1: Create the Main Monitoring File

Save this as `token_efficiency_monitor.py` in your repository:

```python
#!/usr/bin/env python3
"""
Token Efficiency Monitoring System for Nephio-O-RAN Claude Code Agents
"""

import json
import csv
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

class TokenEfficiencyMonitor:
    def __init__(self):
        # Your efficiency metrics with all 8 agents
        self.efficiency_metrics = {
            "nephio-infrastructure-agent": {
                "model": "haiku",
                "avg_tokens_per_task": 500,
                "max_acceptable": 1000,
                "cost_per_1k_tokens": 0.0015
            },
            "oran-network-functions-agent": {
                "model": "sonnet",
                "avg_tokens_per_task": 1500,
                "max_acceptable": 3000, 
                "cost_per_1k_tokens": 0.015
            },
            "security-compliance-agent": {
                "model": "opus",
                "avg_tokens_per_task": 3000,
                "max_acceptable": 6000,
                "cost_per_1k_tokens": 0.075
            },
            # Add all 8 agents here...
        }
        self.csv_log_file = "token_usage_log.csv"
        self._initialize_csv_log()
    
    def _initialize_csv_log(self):
        """Create CSV log file if it doesn't exist"""
        if not os.path.exists(self.csv_log_file):
            with open(self.csv_log_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['timestamp', 'agent_name', 'task_type', 'tokens_used', 'cost', 'efficiency_score'])
    
    def log_token_usage(self, agent_name: str, task_type: str, tokens_used: int, notes: str = ""):
        """Log token usage for a specific agent"""
        if agent_name not in self.efficiency_metrics:
            print(f"⚠️  Warning: Agent {agent_name} not found in configuration")
            return
        
        agent_config = self.efficiency_metrics[agent_name]
        cost = (tokens_used / 1000) * agent_config['cost_per_1k_tokens']
        efficiency_score = tokens_used / agent_config['avg_tokens_per_task']
        within_limits = tokens_used <= agent_config['max_acceptable']
        
        # Log to CSV
        with open(self.csv_log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.now().isoformat(),
                agent_name,
                task_type,
                tokens_used,
                round(cost, 6),
                round(efficiency_score, 2)
            ])
        
        # Show immediate feedback
        status = "✅" if within_limits else "⚠️"
        print(f"{status} {agent_name}: {tokens_used} tokens, ${cost:.4f}, efficiency: {efficiency_score:.2f}x")
        
        if not within_limits:
            print(f"   🔴 Exceeded limit: {tokens_used} > {agent_config['max_acceptable']}")

# Example usage
if __name__ == "__main__":
    monitor = TokenEfficiencyMonitor()
    
    # Example logging
    monitor.log_token_usage("nephio-infrastructure-agent", "infrastructure_deployment", 450)
    monitor.log_token_usage("oran-network-functions-agent", "cnf_deployment", 1800)
    monitor.log_token_usage("security-compliance-agent", "security_audit", 3200)
```


### Step 2: Create a Simple Usage Script

Save this as `log_usage.py` for easy token logging:

```python
#!/usr/bin/env python3
"""
Simple script to log token usage after Claude Code tasks
"""

import sys
from token_efficiency_monitor import TokenEfficiencyMonitor

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
```


### Step 3: Create a Reporting Script

Save this as `generate_report.py`:

```python
#!/usr/bin/env python3
"""
Generate token efficiency reports
"""

import csv
from datetime import datetime, timedelta
from token_efficiency_monitor import TokenEfficiencyMonitor

def generate_weekly_report():
    monitor = TokenEfficiencyMonitor()
    
    # Read usage data from CSV
    cutoff_date = datetime.now() - timedelta(days=7)
    agent_stats = {}
    
    try:
        with open('token_usage_log.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row_date = datetime.fromisoformat(row['timestamp'])
                if row_date < cutoff_date:
                    continue
                
                agent = row['agent_name']
                if agent not in agent_stats:
                    agent_stats[agent] = {
                        'total_tokens': 0,
                        'total_cost': 0,
                        'task_count': 0,
                        'efficiency_scores': []
                    }
                
                agent_stats[agent]['total_tokens'] += int(row['tokens_used'])
                agent_stats[agent]['total_cost'] += float(row['cost'])
                agent_stats[agent]['task_count'] += 1
                agent_stats[agent]['efficiency_scores'].append(float(row['efficiency_score']))
        
        # Generate report
        print("📊 WEEKLY TOKEN EFFICIENCY REPORT")
        print("=" * 50)
        print(f"Report Period: {cutoff_date.date()} to {datetime.now().date()}")
        print()
        
        for agent, stats in agent_stats.items():
            avg_tokens = stats['total_tokens'] / stats['task_count'] if stats['task_count'] > 0 else 0
            avg_efficiency = sum(stats['efficiency_scores']) / len(stats['efficiency_scores']) if stats['efficiency_scores'] else 0
            
            print(f"🤖 {agent}")
            print(f"   Tasks: {stats['task_count']}")
            print(f"   Avg Tokens/Task: {avg_tokens:.0f}")
            print(f"   Total Cost: ${stats['total_cost']:.4f}")
            print(f"   Efficiency: {avg_efficiency:.2f}x")
            print()
    
    except FileNotFoundError:
        print("📄 No usage data found. Start logging token usage first!")

if __name__ == "__main__":
    generate_weekly_report()
```


## 💡 Practical Usage Examples

### Daily Usage Workflow

```bash
# 1. After using Claude Code with your agents, log the token usage
python3 log_usage.py nephio-infrastructure-agent infrastructure_deployment 450 "Deployed O-Cloud across 3 edge sites"

# 2. Log another task
python3 log_usage.py oran-network-functions-agent cnf_deployment 1800 "O-RAN CU deployment with E2 interface"

# 3. Generate weekly report
python3 generate_report.py
```


### Expected Output

```
✅ nephio-infrastructure-agent: 450 tokens, $0.0007, efficiency: 0.90x
✅ oran-network-functions-agent: 1800 tokens, $0.0270, efficiency: 1.20x

📊 WEEKLY TOKEN EFFICIENCY REPORT
==================================================
Report Period: 2025-01-26 to 2025-02-02

🤖 nephio-infrastructure-agent
   Tasks: 5
   Avg Tokens/Task: 480
   Total Cost: $0.0036
   Efficiency: 0.96x

🤖 oran-network-functions-agent
   Tasks: 3
   Avg Tokens/Task: 1650
   Total Cost: $0.0743
   Efficiency: 1.10x
```


### Command Line Integration

Create a simple bash function for easy logging:

```bash
# Add to your ~/.bashrc or ~/.zshrc
log_tokens() {
    if [ $# -lt 3 ]; then
        echo "Usage: log_tokens <agent_name> <task_type> <tokens_used> [notes]"
        return 1
    fi
    
    cd /path/to/your/nephio-oran-claude-agents/
    python3 log_usage.py "$1" "$2" "$3" "$4"
}

# Then use it like:
# log_tokens nephio-infrastructure-agent infrastructure_deployment 450 "Edge deployment"
```


## 📈 Advanced Features

### Automated Alerts

Add this to your monitoring script for cost alerts:

```python
def check_cost_alerts(self, daily_limit: float = 5.0):
    """Check if daily costs exceed limits"""
    today = datetime.now().date()
    daily_cost = 0
    
    with open(self.csv_log_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_date = datetime.fromisoformat(row['timestamp']).date()
            if row_date == today:
                daily_cost += float(row['cost'])
    
    if daily_cost > daily_limit:
        print(f"🚨 COST ALERT: Daily cost ${daily_cost:.4f} exceeds limit ${daily_limit:.2f}")
        return True
    return False
```


### Integration with Cron Jobs

Set up automated reporting:

```bash
# Add to crontab (crontab -e)
# Daily efficiency check at 9 AM
0 9 * * * cd /path/to/your/agents && python3 generate_report.py > daily_report.txt

# Weekly comprehensive report on Mondays
0 9 * * 1 cd /path/to/your/agents && python3 generate_report.py | mail -s "Weekly Agent Efficiency" your-email@company.com
```


## 🎯 Benefits of This System

1. **Cost Tracking**: Monitor exactly how much each agent costs to run
2. **Efficiency Optimization**: Identify agents that use too many tokens
3. **Model Validation**: Verify your model assignments are appropriate
4. **Budget Management**: Set alerts when costs exceed limits
5. **Performance Trends**: Track improvements over time

The token efficiency monitoring system provides essential visibility into your agent operations, helping you optimize both performance and costs while ensuring your Nephio-O-RAN agents deliver maximum value.

