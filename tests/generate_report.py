#!/usr/bin/env python3
"""
Generate token efficiency reports
"""

import csv
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

try:
    from token_efficiency_monitor import TokenEfficiencyMonitor
except ImportError:
    print("Error: Could not import TokenEfficiencyMonitor. Make sure token_efficiency_monitor.py is in the same directory.")
    sys.exit(1)

def generate_weekly_report():
    monitor = TokenEfficiencyMonitor()
    
    # Read usage data from CSV
    cutoff_date = datetime.now() - timedelta(days=7)
    agent_stats = {}
    
    try:
        csv_file = monitor.csv_log_file
        with open(csv_file, 'r') as f:
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
        return

if __name__ == "__main__":
    generate_weekly_report()
