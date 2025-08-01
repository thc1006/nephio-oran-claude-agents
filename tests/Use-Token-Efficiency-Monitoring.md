# Token Efficiency Monitoring Guide

**Ready-to-use** cost tracking system for Nephio-O-RAN Claude Code Agents. Monitor token usage and optimize costs immediately after cloning.

## 🚀 Instant Setup

```bash
# 1. Already included in the repository!
cd nephio-oran-claude-agents/tests

# 2. Start monitoring immediately
python3 token_efficiency_monitor.py        # Test the system
python3 log_usage.py nephio-infrastructure-agent test 450  # Log usage
python3 generate_report.py                 # Generate report
```

## 📊 What's Included

| File | Purpose | Ready to Use |
|------|---------|--------------|
| `token_efficiency_monitor.py` | Core monitoring system | ✅ |
| `log_usage.py` | Simple usage logging | ✅ |
| `generate_report.py` | Weekly cost reports | ✅ |

## 💰 Built-in Cost Tracking

All 8 agents have **pre-configured** efficiency metrics:

| Agent | Model | Cost/1K | Avg Tokens | Max Limit |
|-------|-------|---------|------------|-----------|
| nephio-infrastructure-agent | Haiku | $0.0015 | 500 | 1000 |
| data-analytics-agent | Haiku | $0.0015 | 600 | 1200 |
| oran-network-functions-agent | Sonnet | $0.015 | 1500 | 3000 |
| monitoring-analytics-agent | Sonnet | $0.015 | 1800 | 3500 |
| configuration-management-agent | Sonnet | $0.015 | 1200 | 2500 |
| nephio-oran-orchestrator-agent | Opus | $0.075 | 3500 | 7000 |
| security-compliance-agent | Opus | $0.075 | 3000 | 6000 |
| performance-optimization-agent | Opus | $0.075 | 2800 | 5500 |

## 🚀 Daily Workflow

```bash
# After using Claude Code with agents:

# 1. Log token usage (example: 450 tokens used)
python3 log_usage.py nephio-infrastructure-agent infrastructure_deployment 450 "Edge deployment"

# Output: ✅ nephio-infrastructure-agent: 450 tokens, $0.0007, efficiency: 0.90x

# 2. Generate weekly report
python3 generate_report.py

# Output: 📊 WEEKLY TOKEN EFFICIENCY REPORT
#         🤖 nephio-infrastructure-agent
#            Tasks: 5, Avg Tokens/Task: 480, Total Cost: $0.0036
```

## 🔧 Bash Integration

Add to `~/.bashrc` for easy logging:

```bash
log_tokens() {
    cd /path/to/nephio-oran-claude-agents/tests
    python3 log_usage.py "$1" "$2" "$3" "$4"
}

# Usage: log_tokens nephio-infrastructure-agent deploy 450 "notes"
```

## 📈 Automation

Set up automated cost monitoring:

```bash
# Daily cost check (add to crontab)
0 9 * * * cd /path/to/agents/tests && python3 generate_report.py
```

## 🎯 Benefits

- **💰 Cost Tracking** - Know exactly what each agent costs
- **📊 Efficiency Monitoring** - Identify agents using too many tokens  
- **⚠️ Budget Alerts** - Get warnings when costs exceed limits
- **📈 Performance Trends** - Track improvements over time
- **🔄 Model Validation** - Verify Haiku/Sonnet/Opus assignments

---

**Ready to track costs?** All monitoring code works immediately after cloning! 💰

