# Testing & Validation Guide

**Quick testing setup** for the Nephio-O-RAN Claude Code Agents. All scripts are ready to use after cloning.

## 🚀 Quick Start

```bash
# 1. Clone the repo (if not already done)
git clone https://github.com/[your-username]/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents/tests

# 2. Install dependencies
pip install pyyaml

# 3. Run tests immediately
./validate_agents.sh                    # Validate agent structure
python3 test_agent_scenarios.py         # Test agent scenarios  
python3 token_efficiency_monitor.py     # Check token efficiency
```

## 📋 Available Tests

### Agent Structure Validation
`validate_agents.sh` - Validates YAML frontmatter and model assignments

### Scenario Testing  
`test_agent_scenarios.py` - Tests all 8 agents with realistic scenarios

### Token Efficiency Monitoring
`token_efficiency_monitor.py` - Tracks cost and performance

## 💡 Usage Tracking

Log your agent usage to optimize performance:

```bash
# Log token usage manually
python3 log_usage.py nephio-infrastructure-agent infrastructure_deployment 450 "Edge deployment"

# Generate weekly efficiency report
python3 generate_report.py
```

Expected output:
```
✅ nephio-infrastructure-agent: 450 tokens, $0.0007, efficiency: 0.90x

📊 WEEKLY TOKEN EFFICIENCY REPORT
==================================================
🤖 nephio-infrastructure-agent
   Tasks: 5, Avg Tokens/Task: 480, Total Cost: $0.0036, Efficiency: 0.96x
```

## 🔧 GitHub Actions Integration

Automated validation runs on every push/PR via `.github/workflows/validate-agents.yml`

## 📊 Test Coverage

- ✅ All 8 agents have validation tests
- ✅ Real-world scenario testing
- ✅ Cost efficiency monitoring  
- ✅ GitHub Actions CI/CD integration
- ✅ Usage analytics and reporting

## 🚨 Common Issues

**YAML Errors**: Use spaces (not tabs) for indentation
**Model Assignment**: Match complexity - Haiku (simple), Sonnet (standard), Opus (complex)
**Agent Not Selected**: Add specific telecom keywords in descriptions

---

**Ready to test?** All scripts work immediately after cloning - no setup required! 🧪

