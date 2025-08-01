# Nephio-O-RAN Claude Code Agents Collection

A comprehensive collection of specialized AI subagents for Nephio and O-RAN integration, designed to automate cloud-native telecommunications infrastructure deployment and management.

## Overview

This repository contains 8 specialized subagents that extend Claude Code's capabilities for telecom automation. Each subagent is an expert in specific domains of Nephio-O-RAN integration, automatically invoked based on context or explicitly called when needed. All agents are configured with appropriate Claude models based on task complexity for optimal performance and cost-effectiveness.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code Compatible](https://img.shields.io/badge/Claude%20Code-Compatible-blue.svg)]()
[![Telecom Automation](https://img.shields.io/badge/Domain-Telecom%20Automation-green.svg)]()

## Available Subagents

### 🏗️ Infrastructure & Platform Management
• **nephio-infrastructure-agent** - Manages O-Cloud infrastructure provisioning, Kubernetes cluster lifecycle, and resource allocation across distributed edge deployments
• **configuration-management-agent** - Handles YANG model configuration, Kubernetes CRDs, and Infrastructure as Code template management

### 📡 Network Functions & O-RAN Integration  
• **oran-network-functions-agent** - Manages O-RAN network function deployment, CNF/VNF orchestration, xApp management, and RIC operations
• **nephio-oran-orchestrator-agent** - Orchestrates complex integration workflows between Nephio and O-RAN components with end-to-end service lifecycle management

### 📊 Monitoring & Analytics
• **monitoring-analytics-agent** - Implements comprehensive observability, performance monitoring, and NWDAF integration for telecom environments
• **data-analytics-agent** - Processes network data, generates insights, and supports AI/ML pipeline integration for network intelligence

### 🔒 Security & Performance
• **security-compliance-agent** - Ensures O-RAN security standards compliance, implements zero-trust architectures, and automates security policy enforcement
• **performance-optimization-agent** - Optimizes network performance, resource utilization, and implements intelligent scaling based on telecom workload patterns

## Model Assignments

Agents are strategically assigned Claude models based on task complexity and operational requirements:

### 🚀 Haiku (Fast & Cost-Effective) - 2 agents
**Model:** `haiku`
• `nephio-infrastructure-agent` - Infrastructure provisioning and basic resource management
• `data-analytics-agent` - Data processing and basic analytics operations

### ⚡ Sonnet (Balanced Performance) - 4 agents  
**Model:** `sonnet`
• `oran-network-functions-agent` - Network function lifecycle management
• `monitoring-analytics-agent` - Observability and performance monitoring
• `configuration-management-agent` - Configuration automation and template management
• Additional agents requiring moderate complexity reasoning

### 🧠 Opus (Maximum Capability) - 2 agents
**Model:** `opus`
• `nephio-oran-orchestrator-agent` - Complex cross-domain integration and orchestration
• `security-compliance-agent` - Advanced security analysis and compliance validation
• `performance-optimization-agent` - Complex optimization decisions and intelligent automation



## Installation

These subagents are automatically available when placed in the Claude Code agents directory:

```markdown
cd ~/.claude
git clone https://github.com/[your-username]/nephio-oran-claude-agents.git agents
```

For project-specific deployment:

```markdown
cd your-project
mkdir -p .claude
git clone https://github.com/[your-username]/nephio-oran-claude-agents.git .claude/agents
```

## Quick Start

### Automatic Agent Invocation
Claude Code automatically delegates tasks to appropriate agents based on context:

```markdown
# Infrastructure provisioning
"Deploy a new O-Cloud cluster for edge computing with Nephio"
```

```markdown
# Network function management
"Deploy and configure O-RAN CNFs with proper YANG model validation"
```

```markdown
# End-to-end orchestration
"Implement complete 5G service deployment across multiple sites"
```

```markdown
# Infrastructure management
"Use nephio-infrastructure-agent to optimize resource allocation across edge sites"
```

```markdown
# O-RAN specific tasks
"Have oran-network-functions-agent deploy xApps with proper RIC integration"
```

```markdown
# Complex orchestration
"Get nephio-oran-orchestrator-agent to design end-to-end service lifecycle automation"
```

## Usage Examples

### Infrastructure Automation Workflows

```
# Multi-site edge deployment
"Deploy distributed O-Cloud infrastructure across 5 edge locations with automated failover"
```

```
# Resource optimization
"Analyze current Kubernetes cluster utilization and recommend scaling policies"
```

```
# Cost optimization
"Implement cost-effective resource allocation while maintaining SLA requirements"
```


### O-RAN Integration Scenarios


```
# Network function deployment
"Deploy O-RAN DU and CU functions with proper E2 interface configuration"
```

```
# Intelligent network optimization
"Implement AI-driven RIC applications for automated network optimization"
```

```
# Multi-vendor integration
"Configure O-RAN components from different vendors with standardized interfaces"
```

### End-to-End Service Orchestration

```
# Complete service lifecycle
"Orchestrate 5G network slice deployment from infrastructure to applications"
```

```
# Automated operations
"Implement closed-loop automation for network function lifecycle management"
```

```
# Compliance and security
"Ensure O-RAN deployment meets security standards and regulatory requirements"
```




## Agent Architecture Patterns

### Sequential Orchestration
```
User Request → Infrastructure Agent → Network Functions Agent → Orchestrator Agent → Result

Example: "Deploy complete 5G service"
nephio-infrastructure-agent → oran-network-functions-agent → monitoring-analytics-agent
```

### Parallel Processing
```
User Request → Multiple Agents (simultaneously) → Coordinated Result

Example: "Optimize network performance across all domains"
performance-optimization-agent + monitoring-analytics-agent + configuration-management-agent
```

### Validation Workflows
```
Primary Agent → Security/Compliance Agent → Validated Implementation

Example: "Deploy O-RAN infrastructure with security hardening"
nephio-oran-orchestrator-agent → security-compliance-agent → Validated deployment
```

## Best Practices

### 🎯 Task Delegation Strategy
1. **Leverage automatic delegation** - Let Claude Code route tasks based on context analysis
2. **Provide comprehensive context** - Include infrastructure details, compliance requirements, and performance constraints
3. **Trust specialized expertise** - Each agent is optimized for specific telecom domains

### 🔄 Multi-Agent Coordination
4. **Design workflow sequences** - Plan complex operations as agent collaboration patterns
5. **Maintain context consistency** - Ensure agents have necessary background for coordinated operations
6. **Validate integration points** - Verify outputs from different agents work together effectively

### 📈 Operational Excellence
7. **Monitor agent performance** - Track effectiveness and optimize agent selection patterns
8. **Implement feedback loops** - Use operational results to refine agent capabilities
9. **Scale based on complexity** - Match agent model capabilities to task requirements

## Contributing

We welcome contributions from the telecom automation community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Adding New Agents
1. Create agent file following the [agent template](templates/agent-template.md)
2. Use descriptive names with `[domain]-[function]-agent.md` pattern
3. Include clear descriptions for automatic delegation
4. Assign appropriate Claude model based on complexity
5. Add comprehensive examples and usage patterns

### Testing Agent Changes



# Validate agent syntax

```
./tests/agent-validation/validate-agent.sh [agent-file]
```

# Test agent integration

```
./tests/integration-tests/test-workflow.sh [workflow-name]
```


## Community & Support

- **Issues**: Report bugs and request features via [GitHub Issues](../../issues)
- **Discussions**: Join the community in [GitHub Discussions](../../discussions)  
- **Documentation**: Comprehensive guides in the [docs](docs/) directory
- **Examples**: Real-world usage patterns in [examples](examples/) directory

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built upon the excellent foundation of [wshobson/agents](https://github.com/wshobson/agents)
- Inspired by the Claude Code subagents community
- Designed for the Nephio and O-RAN automation ecosystems


## Key Design Principles

### Accessibility and Discoverability

The repository structure prioritizes **immediate usability** by placing agent files at the root level, following the proven pattern of successful Claude Code agent repositories. This ensures that users can quickly clone and start using agents without complex navigation or setup procedures.

### Comprehensive Documentation Strategy

The README.md serves as both an introduction and a comprehensive reference, combining **quick-start accessibility with detailed technical information**. This dual-purpose approach accommodates both newcomers seeking immediate value and experienced users requiring detailed implementation guidance.

### Community-Focused Design

Following open-source best practices, the repository includes essential community files (CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md) that establish clear expectations and processes for collaboration. This infrastructure supports sustainable community growth and contribution management.

### Practical Examples and Templates

The inclusion of extensive examples and templates reduces barriers to adoption and customization. Users can quickly understand agent capabilities through real-world scenarios while having the resources needed to extend or modify agents for their specific requirements.

This repository design leverages proven patterns from successful open-source projects while addressing the specialized requirements of telecom automation, creating a comprehensive resource for Nephio-O-RAN integration that can grow with community contributions and evolving technological requirements.
