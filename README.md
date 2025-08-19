# Nephio-O-RAN Claude Code Agents

**Production-ready** specialized AI subagents for Nephio and O-RAN telecommunications automation. Properly configured for Claude Code's subagent system with correct tool assignments and YAML frontmatter format.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Claude Code Compatible](https://img.shields.io/badge/Claude%20Code-v1.0.60+-blue.svg)](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
[![Telecom Automation](https://img.shields.io/badge/Domain-Telecom%20Automation-green.svg)]()

## 🚀 Quick Start (2 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents

# 2. Install agents globally (recommended)
mkdir -p ~/.claude/agents
cp agents/*.md ~/.claude/agents/

# 3. Verify installation
claude code
# Type: /agents
# You should see all 9 agents listed

# 4. Start using agents
claude code "Deploy O-Cloud infrastructure with Nephio"
```

## ⚠️ Important Prerequisites

- **Claude Code v1.0.60+** required for subagent support
- Agents use Claude Code's built-in tools only (Read, Write, Bash, Search, Git)
- No external tool dependencies needed

## 🎯 Version Compatibility

- **O-RAN SC**: L Release (June 30, 2025) - Current
- **Nephio**: R5 (2024-2025)
- **Go**: 1.24.6 with FIPS 140-3
- **Kubernetes**: 1.32.x

## 📦 What You Get

**9 Production-Ready Subagents** with proper YAML frontmatter and Claude Code tool configuration:

### 🏗️ Infrastructure & Configuration

| Agent | Model | Purpose |
|-------|-------|---------|
| `nephio-infrastructure-agent` | **haiku** | O-Cloud provisioning, Kubernetes lifecycle, resource optimization |
| `configuration-management-agent` | **sonnet** | YANG models, GitOps, IaC templates, drift detection |

### 📡 O-RAN Network Functions

| Agent | Model | Purpose |
|-------|-------|---------|
| `oran-network-functions-agent` | **sonnet** | CNF/VNF deployment, xApp/rApp management, RIC operations |
| `nephio-oran-orchestrator-agent` | **opus** | End-to-end service orchestration, cross-domain automation |

### 📊 Monitoring & Analytics

| Agent | Model | Purpose |
|-------|-------|---------|
| `monitoring-analytics-agent` | **sonnet** | Observability, NWDAF integration, predictive maintenance |
| `data-analytics-agent` | **haiku** | Data processing, KPI calculation, ML pipeline support |

### 🔒 Security & Performance

| Agent | Model | Purpose |
|-------|-------|---------|
| `security-compliance-agent` | **opus** | O-RAN security standards, zero-trust, compliance validation |
| `performance-optimization-agent` | **opus** | AI-driven optimization, intelligent scaling, QoS management |

### 🔧 Specialized Tools

| Agent | Model | Purpose |
|-------|-------|---------|
| `oran-nephio-dep-doctor` | **sonnet** | Dependency resolution, build/runtime error diagnosis |

## 💡 Installation Options

### Option 1: User-Level Installation (Recommended)

Available across all your projects:

```bash
# Linux/macOS
mkdir -p ~/.claude/agents
cp agents/*.md ~/.claude/agents/

# Windows
mkdir %USERPROFILE%\.claude\agents
copy agents\*.md %USERPROFILE%\.claude\agents\
```

### Option 2: Project-Level Installation

For specific project use:

```bash
# Navigate to your project first
cd /path/to/your/project

# Create agents directory
mkdir -p .claude/agents

# Copy agents
cp /path/to/nephio-oran-claude-agents/agents/*.md .claude/agents/
```

### Option 3: Selective Installation

Install only the agents you need:

```bash
# Example: Install only infrastructure and security agents
cp agents/nephio-infrastructure-agent.md ~/.claude/agents/
cp agents/security-compliance-agent.md ~/.claude/agents/
```

## ⚡ Model Configuration & Cost Optimization

Agents are configured with optimal Claude models based on task complexity:

| Model | Agents | Use Case | Relative Cost |
|-------|--------|----------|---------------|
| **haiku** | `nephio-infrastructure`, `data-analytics` | Simple tasks, quick operations | 1x |
| **sonnet** | `oran-network-functions`, `monitoring-analytics`, `configuration-management`, `oran-nephio-dep-doctor` | Standard development tasks | ~30x |
| **opus** | `nephio-oran-orchestrator`, `security-compliance`, `performance-optimization` | Complex reasoning, critical decisions | ~75x |

## 🎯 Usage Examples

### Automatic Agent Selection

Claude Code automatically selects the appropriate agent based on your task:

```bash
# Infrastructure tasks → nephio-infrastructure-agent
claude code "Provision a new Nephio cluster for edge deployment"

# Network function deployment → oran-network-functions-agent
claude code "Deploy O-RAN CU and DU with proper YANG configuration"

# Security audit → security-compliance-agent
claude code "Perform O-RAN WG11 security compliance check"

# Performance issues → performance-optimization-agent
claude code "Optimize RAN performance for high-traffic scenarios"
```

### Explicit Agent Invocation

Directly specify which agent to use:

```bash
# Specific agent usage
claude code "Use nephio-infrastructure-agent to analyze cluster resources"
claude code "Have security-compliance-agent review our zero-trust implementation"
claude code "Get oran-nephio-dep-doctor to fix this build error"
```

### Complex Workflows

Agents can work together:

```bash
claude code "First use configuration-management-agent to validate YANG models, 
             then have oran-network-functions-agent deploy the CNFs, 
             and finally use monitoring-analytics-agent to set up observability"
```

## 🛠️ Agent Management

### View Installed Agents

```bash
# In Claude Code
/agents

# Lists all available agents with their descriptions
```

### Update Agent Configuration

```bash
# Use the /agents command to modify agent settings
/agents

# Select agent → Edit → Modify tools or description
```

### Check Agent Files

```bash
# Linux/macOS
ls -la ~/.claude/agents/

# Windows
dir %USERPROFILE%\.claude\agents\
```

## 🤝 Multi-Agent Collaboration

### Quick Start
Run complete automated workflows:
- `./scripts/run-workflow.sh deploy` - Full O-RAN deployment
- `./scripts/run-workflow.sh troubleshoot` - Issue diagnosis and resolution
- `./scripts/run-workflow.sh validate` - Security and compliance check
- `./scripts/run-workflow.sh upgrade` - System upgrade

### Advanced Usage
Use Python orchestrator for detailed control:
```bash
# Dry run to see workflow stages
python3 orchestration/orchestrator.py deploy --dry-run

# Execute with verbose output
python3 orchestration/orchestrator.py deploy --verbose
```

### Manual Agent Chaining
Agents provide `handoff_to` suggestions for workflow continuation.

### Workflow State Management
State files are automatically created in `~/.claude-workflows/` for tracking progress and enabling workflow continuation.

## 📊 Repository Structure

```
nephio-oran-claude-agents/
├── agents/                        # All agent files
│   ├── nephio-infrastructure-agent.md
│   ├── oran-network-functions-agent.md
│   ├── monitoring-analytics-agent.md
│   ├── configuration-management-agent.md
│   ├── security-compliance-agent.md
│   ├── performance-optimization-agent.md
│   ├── nephio-oran-orchestrator-agent.md
│   ├── data-analytics-agent.md
│   └── oran-nephio-dep-doctor.md
├── docs/
│   ├── AGENT_DETAILS.md          # Detailed agent documentation
│   ├── INTEGRATION_GUIDE.md      # Nephio-O-RAN integration patterns
│   └── TROUBLESHOOTING.md        # Common issues and solutions
├── examples/
│   ├── workflows/                # Example multi-agent workflows
│   └── use-cases/                # Real-world telecom scenarios
├── tests/
│   ├── validate_agents.py        # Agent validation script
│   └── test_scenarios.py         # Integration test scenarios
├── .github/workflows/
│   └── validate.yml              # CI/CD validation
├── LICENSE
└── README.md
```

## ✅ Key Features

- **🔄 Proper Subagent Format** - Correct YAML frontmatter with Claude Code compatibility
- **🛠️ Built-in Tools Only** - Uses only Claude Code's native tools (no external dependencies)
- **💰 Cost Optimized** - Appropriate model selection (haiku/sonnet/opus) for each task
- **🎯 Domain Expertise** - Deep telecom and O-RAN/Nephio knowledge embedded
- **🔒 Security First** - O-RAN WG11 security standards compliance
- **📊 Comprehensive Coverage** - Full lifecycle from infrastructure to optimization
- **🚀 Zero External Dependencies** - Works immediately with Claude Code

## 🧪 Testing & Validation

```bash
# Run validation tests
cd tests/
python3 validate_agents.py

# Test specific scenarios
python3 test_scenarios.py --scenario infrastructure_deployment
python3 test_scenarios.py --scenario security_audit
```

## 📝 Agent Capabilities Summary

### Infrastructure Layer

- Kubernetes cluster management
- O-Cloud provisioning
- Resource optimization
- Cost analysis

### Network Functions Layer

- CNF/VNF lifecycle management
- xApp/rApp deployment
- RIC integration
- YANG configuration

### Management Layer

- GitOps workflows
- Configuration drift detection
- Multi-vendor abstraction
- IaC templates

### Intelligence Layer

- Real-time monitoring
- Predictive analytics
- AI/ML optimization
- NWDAF integration

### Security Layer

- Zero-trust implementation
- Compliance validation
- Vulnerability assessment
- Policy enforcement

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Agent Format**: Maintain proper YAML frontmatter structure
2. **Tool Usage**: Use only Claude Code built-in tools
3. **Documentation**: Update relevant documentation
4. **Testing**: Include test scenarios for new agents
5. **Model Selection**: Choose appropriate model based on complexity

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/nephio-oran-claude-agents.git

# Create feature branch
git checkout -b feature/new-agent

# Make changes and test
python3 tests/validate_agents.py

# Submit pull request
```

## 📚 Additional Resources

- [Claude Code Subagents Documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [Nephio Project](https://nephio.org/)
- [O-RAN Alliance](https://www.o-ran.org/)
- [O-RAN Software Community](https://o-ran-sc.org/)
- [O-RAN SC L Release Documentation (June 30, 2025)](https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/)
- [L Release Notes](https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/release-notes.html)

## 🐛 Troubleshooting

### Agents Not Appearing

```bash
# Check Claude Code version
claude code --version  # Should be 1.0.60+

# Verify file locations
ls ~/.claude/agents/*.md

# Check file permissions
chmod 644 ~/.claude/agents/*.md
```

### Agent Not Being Selected

- Ensure description includes "Use PROACTIVELY" for automatic selection
- Check that agent name matches file name (without .md)
- Verify YAML frontmatter format is correct

### Tool Errors

- Agents use only: Read, Write, Bash, Search, Git
- No external tools (kubectl, terraform, etc.) are available
- Use Bash tool for command execution

## 📄 License

Apache 2.0 License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built for the Claude Code community
- Optimized for Nephio and O-RAN ecosystems
- Inspired by telecom automation best practices
- Special thanks to early adopters and contributors

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/thc1006/nephio-oran-claude-agents/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thc1006/nephio-oran-claude-agents/discussions)
- **Email**: <hctsai@linux.com>

---

> **Ready to revolutionize your telecom automation?** Install these agents and experience the power of specialized AI assistance for Nephio and O-RAN! 🚀

**Last Updated**: January 2025 | **Version**: 2.0.0 | **Claude Code**: v1.0.60+
