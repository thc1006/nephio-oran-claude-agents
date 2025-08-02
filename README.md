# Nephio-O-RAN Claude Code Agents

**Ready-to-use** specialized AI agents for Nephio and O-RAN telecommunications automation. Clone once, copy files, and start automating telecom infrastructure immediately.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Claude Code Compatible](https://img.shields.io/badge/Claude%20Code-Compatible-blue.svg)]()
[![Telecom Automation](https://img.shields.io/badge/Domain-Telecom%20Automation-green.svg)]()

## 🚀 Quick Start (30 seconds)

```bash
# 1. Clone the repository
git clone https://github.com/[your-username]/nephio-oran-claude-agents.git

# 2. Copy all agent files to your Claude Code directory
cp nephio-oran-claude-agents/*-agent.md ~/.claude/

# 3. Start using agents immediately
claude "Deploy O-Cloud infrastructure with Nephio"
```

That's it! All 8 specialized agents are now available in Claude Code.

## 📦 What You Get

**8 Production-Ready Agents** - Just copy the `.md` files and start using:

### 🏗️ Infrastructure Management
- `nephio-infrastructure-agent.md`
- O-Cloud provisioning & Kubernetes lifecycle
- `configuration-management-agent.md`
- YANG models & Infrastructure as Code

### 📡 O-RAN Network Functions  
- `oran-network-functions-agent.md`
- CNF/VNF deployment & xApp management
- `nephio-oran-orchestrator-agent.md`
- End-to-end service orchestration

### 📊 Monitoring & Data
- `monitoring-analytics-agent.md`
- Observability & performance monitoring
- `data-analytics-agent.md`
- Network intelligence & AI/ML pipelines

### 🔒 Security & Optimization
- `security-compliance-agent.md`
- O-RAN security standards & compliance
- `performance-optimization-agent.md`
- Network optimization & intelligent scaling

## 💡 Installation Options

### Option 1: Global Installation (Recommended)
```bash
# Copy to your global Claude Code directory
cp *-agent.md ~/.claude/
```

### Option 2: Project-Specific Installation
```bash
# Copy to project's .claude directory
mkdir -p .claude && cp *-agent.md .claude/
```

### Option 3: Windows Installation
```cmd
# Windows Command Prompt
copy *-agent.md %USERPROFILE%\.claude\
```

## ⚡ Model Assignments (Optimized for Cost & Performance)

| Agent | Model | Use Case | Avg Cost/Task |
|-------|-------|----------|---------------|
| `nephio-infrastructure-agent` | **Haiku** | Fast infrastructure ops | $0.0008 |
| `data-analytics-agent` | **Haiku** | Quick data processing | $0.0009 |
| `oran-network-functions-agent` | **Sonnet** | Network function mgmt | $0.023 |
| `monitoring-analytics-agent` | **Sonnet** | Observability setup | $0.027 |
| `configuration-management-agent` | **Sonnet** | Config automation | $0.018 |
| `nephio-oran-orchestrator-agent` | **Opus** | Complex orchestration | $0.26 |
| `security-compliance-agent` | **Opus** | Security analysis | $0.23 |
| `performance-optimization-agent` | **Opus** | Performance tuning | $0.21 |

## 🎯 Usage Examples

### Automatic Agent Selection (Just describe what you want)
```bash
# Infrastructure provisioning → nephio-infrastructure-agent
claude "Deploy a new O-Cloud cluster for edge computing with Nephio"

# Network functions → oran-network-functions-agent  
claude "Deploy and configure O-RAN CNFs with proper YANG model validation"

# End-to-end orchestration → nephio-oran-orchestrator-agent
claude "Implement complete 5G service deployment across multiple sites"

# Security validation → security-compliance-agent
claude "Audit O-RAN deployment for security compliance and generate remediation report"
### Explicit Agent Usage (When you need specific expertise)
```bash
# Target specific agents directly
claude "Use nephio-infrastructure-agent to optimize resource allocation across edge sites"
claude "Have oran-network-functions-agent deploy xApps with proper RIC integration"  
claude "Get security-compliance-agent to audit our O-RAN deployment for vulnerabilities"
```

## 🧪 Testing & Validation

All agents include comprehensive testing:

```bash
# Run agent validation tests
cd tests/
./validate_agents.sh

# Test agent scenarios
python3 test_agent_scenarios.py

# Monitor token efficiency  
python3 token_efficiency_monitor.py
```

## 📊 Repository Structure

```
nephio-oran-claude-agents/
├── *-agent.md                    # 8 ready-to-use agent files
├── tests/                        # Testing & validation tools
│   ├── validate_agents.sh        # Agent structure validation
│   ├── test_agent_scenarios.py   # Scenario testing
│   ├── token_efficiency_monitor.py # Cost monitoring
│   └── generate_report.py        # Usage analytics
├── .github/workflows/            # CI/CD validation
└── README.md                     # This file
```

## ✅ Production Ready Features

- **🔄 Automatic Agent Selection** - Claude Code intelligently routes tasks
- **💰 Cost Optimized** - Smart model assignments (Haiku/Sonnet/Opus)
- **🧪 Fully Tested** - Comprehensive validation & scenario testing
- **📊 Usage Monitoring** - Built-in token efficiency tracking
- **🔒 Security Focused** - O-RAN security standards compliance
- **🚀 Zero Configuration** - Copy files and start using immediately

## 🤝 Contributing

```bash
# Fork, clone, and contribute
git clone https://github.com/[your-username]/nephio-oran-claude-agents.git
# Make changes to agent files
# Test with: ./tests/validate_agents.sh
# Submit pull request

```
## 📄 License
MIT License - see [LICENSE](LICENSE) for details.


## 🙏 Acknowledgments

- Built for the Claude Code and telecom automation communities
- Optimized for Nephio and O-RAN integration ecosystems
- Designed following proven agent repository patterns

> **Ready to automate your telecom infrastructure?** Just `git clone`, copy the agent files, and start building with Claude Code! 🚀
