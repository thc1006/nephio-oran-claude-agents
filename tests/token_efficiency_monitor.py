#!/usr/bin/env python3
"""
Token Efficiency Monitoring System for Nephio-O-RAN Claude Code Agents
"""

import json
import csv
import os
import yaml
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pathlib import Path

class TokenEfficiencyMonitor:
    def __init__(self, config_path=None):
        # Load configuration from YAML file
        if config_path is None:
            script_dir = Path(__file__).parent
            config_path = script_dir.parent / "config" / "agent_config.yaml"
        
        self.config_path = config_path
        self.efficiency_metrics = self._load_config()
        self.csv_log_file = self.efficiency_metrics.get('settings', {}).get('csv_log_file', 'token_usage_log.csv')
        self._initialize_csv_log()
    
    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            return config.get('agent_models', {})
        except FileNotFoundError:
            print(f"⚠️  Warning: Config file {self.config_path} not found. Using default metrics.")
            return self._get_default_metrics()
        except Exception as e:
            print(f"⚠️  Warning: Error loading config: {e}. Using default metrics.")
            return self._get_default_metrics()
    
    def _get_default_metrics(self):
        """Fallback to hardcoded metrics if config file is not available"""
        return {
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
            "performance-optimization-agent": {
                "model": "opus",
                "avg_tokens_per_task": 2800,
                "max_acceptable": 5500,
                "cost_per_1k_tokens": 0.075
            },
            "nephio-oran-orchestrator-agent": {
                "model": "opus",
                "avg_tokens_per_task": 3500,
                "max_acceptable": 7000,
                "cost_per_1k_tokens": 0.075
            },
            "configuration-management-agent": {
                "model": "sonnet",
                "avg_tokens_per_task": 1200,
                "max_acceptable": 2500,
                "cost_per_1k_tokens": 0.015
            },
            "monitoring-analytics-agent": {
                "model": "sonnet",
                "avg_tokens_per_task": 1800,
                "max_acceptable": 3500,
                "cost_per_1k_tokens": 0.015
            },
            "data-analytics-agent": {
                "model": "haiku",
                "avg_tokens_per_task": 600,
                "max_acceptable": 1200,
                "cost_per_1k_tokens": 0.0015
            }
        }
        }
    
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
