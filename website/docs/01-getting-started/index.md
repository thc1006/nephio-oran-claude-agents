---
title: 'Getting Started'
description: 'Everything you need to know to get started with Nephio O-RAN Claude Agents'
sidebar_position: 1
tags: ['getting-started', 'introduction', 'setup', 'quickstart']
---

# Getting Started with Nephio O-RAN Claude Agents

Welcome to the Nephio O-RAN Claude Agents! This comprehensive guide will help you get started with deploying and managing intelligent agents for O-RAN network functions using Nephio and Claude AI.

## Overview

Nephio O-RAN Claude Agents provide intelligent automation and orchestration for Open Radio Access Network (O-RAN) deployments. These agents leverage Claude AI to make smart decisions about deployment, configuration, and management of O-RAN components.

## What You'll Learn

In this section, you'll discover:

- **Prerequisites**: What you need before getting started
- **Installation**: Step-by-step setup instructions  
- **Quick Start**: Get your first agents running in minutes
- **Basic Configuration**: Essential settings and options
- **Verification**: How to confirm everything is working

## Key Features

Our Claude agents provide:

- 🤖 **Intelligent Orchestration**: AI-driven deployment decisions
- 🔧 **Automated Configuration**: Smart configuration management
- 📊 **Real-time Monitoring**: Comprehensive observability
- 🛡️ **Security Compliance**: Built-in security best practices
- 🚀 **Performance Optimization**: Continuous performance tuning

## Quick Navigation

### Essential First Steps

1. **[Quick Start Guide](../guides/quickstart.md)** - Get up and running in 30 minutes
2. **[Architecture Overview](../architecture/index.md)** - Understand the system design
3. **[Agent Configuration](../agents/index.md)** - Learn about available agents

### Core Concepts

- **[O-RAN Integration](../02-concepts/)** - How agents work with O-RAN
- **[Nephio Integration](../integration/index.md)** - Nephio-specific features
- **[AI Decision Making](../02-concepts/)** - How Claude AI powers the agents

### Common Tasks

- **[Deploy Network Functions](../network-functions/oran-network-functions-agent.md)**
- **[Configure Monitoring](../monitoring/monitoring-analytics-agent.md)**
- **[Set Up Security](../security/security-compliance-agent.md)**

## Prerequisites

Before you begin, ensure you have:

### Software Requirements

- **Kubernetes cluster** (v1.25+) with administrative access
- **Nephio R5** (v5.0.0+) installed and configured
- **kubectl** configured to access your cluster
- **KPT** (v1.0.0-beta.55+) for package management
- **Go** (1.24.6+) for building custom components

### Resource Requirements

- **Minimum**: 4 CPU cores, 8GB RAM per node
- **Recommended**: 8 CPU cores, 16GB RAM per node
- **Storage**: 50GB available storage for agent data
- **Network**: Proper O-RAN network configuration

## Installation Options

Choose the installation method that best fits your environment:

### Option 1: Quick Install (Recommended)

```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents
make install && make deploy
```

### Option 2: Step-by-Step Installation

Follow the detailed [Quick Start Guide](../guides/quickstart.md) for a comprehensive walkthrough.

### Option 3: Custom Installation

For advanced users, see the [API Reference](../04-api-reference/index.md) for detailed configuration options.

## Next Steps

Once you've reviewed the prerequisites:

1. **Start Here**: [Quick Start Guide](../guides/quickstart.md) - Complete setup in 30 minutes
2. **Learn the Concepts**: [Architecture Overview](../architecture/index.md) - Understand the system
3. **Explore Agents**: [Agent Documentation](../agents/index.md) - Discover available agents
4. **Configure Security**: [Security Guide](../security/security-compliance-agent.md) - Secure your deployment

## Getting Help

Need assistance? We're here to help:

- **Documentation**: Browse our comprehensive guides
- **Troubleshooting**: Check the [Troubleshooting Guide](../07-troubleshooting/index.md)
- **Community**: Join the [GitHub Discussions](https://github.com/thc1006/nephio-oran-claude-agents/discussions)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/thc1006/nephio-oran-claude-agents/issues)

## What's Next?

Ready to get started? Begin with our [Quick Start Guide](../guides/quickstart.md) and have your first Claude agents running within 30 minutes!

---

*Last updated: August 2025*