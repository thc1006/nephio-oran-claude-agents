---
title: 'Quick Start Guide'
description: 'Get up and running with Nephio O-RAN Claude Agents in minutes'
sidebar_position: 1
tags: ['quickstart', 'getting-started', 'installation', 'deployment']
last_updated: '2025-08-20'
---

# Quick Start Guide

Get up and running with Nephio O-RAN Claude Agents in just a few minutes! This guide will
walk you through the essential steps to deploy and start using Claude agents in your O-RAN
environment.

## Prerequisites

Before you begin, ensure you have the following:

### Required Software

- **Kubernetes cluster** (v1.25+)
- **kubectl** configured and connected to your cluster
- **Nephio R5** (v5.0.0) installed
- **KPT** (v1.0.0-beta.55+)
- **Go** (1.24.6+)
- **Git** for cloning the repository

### Resource Requirements

- **CPU**: Minimum 4 cores per node
- **Memory**: Minimum 8GB RAM per node
- **Storage**: 50GB available storage
- **Network**: Cluster networking configured for O-RAN workloads

## Step 1: Clone the Repository

```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents
```

## Step 2: Verify Prerequisites

Run the built-in verification script to ensure your environment is ready:

```bash
./scripts/verify_versions.sh
```

This script checks:

- Kubernetes version compatibility
- Nephio installation status
- KPT version
- Required tools availability

## Step 3: Configure the Environment

### Set Environment Variables

```bash
export NEPHIO_NAMESPACE="nephio-system"
export AGENTS_NAMESPACE="nephio-agents"
export ORAN_ENVIRONMENT="development"  # or "production"
```

### Review Configuration

Check and customize the agent configuration:

```bash
cat config/agent_config.yaml
```

Key configuration options:

- Agent logging levels
- Resource limits and requests
- Security policies
- Monitoring endpoints

## Step 4: Deploy the Agents

### Deploy Using Make

```bash
# Install dependencies and deploy all agents
make install
make deploy

# Or do both in one step
make all
```

### Deploy Individual Categories (Optional)

If you prefer to deploy specific agent categories:

```bash
# Deploy orchestration agents only
make deploy-orchestration

# Deploy infrastructure agents only
make deploy-infrastructure

# Deploy monitoring agents only
make deploy-monitoring
```

## Step 5: Verify Deployment

### Check Agent Pods

```bash
kubectl get pods -n nephio-agents
```

Expected output:

```
NAME                                    READY   STATUS    RESTARTS   AGE
orchestrator-agent-7b8c9d5f4-xyz12     1/1     Running   0          2m
infrastructure-agent-9f2a1c6e8-abc34   1/1     Running   0          2m
monitoring-agent-4e7b3f1d2-def56       1/1     Running   0          2m
...
```

### Check Agent Services

```bash
kubectl get services -n nephio-agents
```

### Verify Agent Health

```bash
# Check agent status using the monitoring endpoint
kubectl port-forward -n nephio-agents svc/orchestrator-agent 8080:8080 &
curl http://localhost:8080/health
```

## Step 6: Run Your First Workflow

### Deploy a Sample O-RAN Function

```bash
# Apply a sample O-RAN workload
kubectl apply -f examples/oran-cu-deployment.yaml

# Watch the orchestrator agent handle the deployment
kubectl logs -f -n nephio-agents deployment/orchestrator-agent
```

### Monitor the Deployment

```bash
# Check deployment status
kubectl get deployments -n oran-workloads

# View agent activity
kubectl logs -n nephio-agents -l app=claude-agent --tail=50
```

## Step 7: Access the Web Interface (Optional)

If you have the monitoring stack enabled:

```bash
# Forward Grafana port
kubectl port-forward -n nephio-agents svc/grafana 3000:3000

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

## Common Commands

### Agent Management

```bash
# Restart all agents
kubectl rollout restart deployment -n nephio-agents

# Scale agents
kubectl scale deployment orchestrator-agent --replicas=2 -n nephio-agents

# View agent logs
kubectl logs -n nephio-agents deployment/orchestrator-agent -f
```

### Troubleshooting

```bash
# Check agent events
kubectl get events -n nephio-agents --sort-by='.lastTimestamp'

# Debug agent configuration
kubectl describe configmap agent-config -n nephio-agents

# Run diagnostics
make test-agents
```

## Next Steps

Now that you have Claude agents running, explore these topics:

### Learn More

- [Agent Architecture Overview](/docs/guides/architecture)
- [Configuration Management](/docs/guides/configuration)
- [Monitoring and Observability](/docs/guides/monitoring)

### Deploy Additional Components

- [Security and Compliance Setup](/docs/security-compliance/security-compliance-agent)
- [Advanced Monitoring](/docs/monitoring-analytics/monitoring-analytics-agent)
- [Network Function Management](/docs/network-functions/oran-network-functions-agent)

### Operational Tasks

- [Upgrading Agents](/docs/guides/upgrade)
- [Backup and Restore](/docs/guides/backup)
- [Performance Tuning](/docs/guides/performance)

## Getting Help

If you encounter issues:

1. **Check the logs**: `kubectl logs -n nephio-agents deployment/orchestrator-agent`
2. **Review the troubleshooting guide**: [Troubleshooting](/docs/guides/troubleshooting)
3. **Run diagnostics**: `make diagnose`
4. **Check compatibility**: Review the [Compatibility Matrix](
   https://github.com/thc1006/nephio-oran-claude-agents/blob/main/COMPATIBILITY_MATRIX.md)
5. **Community support**: Join the [Nephio community](https://nephio.org/community/)

## Clean Up

To remove all agents and resources:

```bash
make clean
```

This will remove all agent deployments, services, and configurations while preserving your
O-RAN workloads.

---

**Congratulations!** You now have Nephio O-RAN Claude Agents running in your environment.
The agents are ready to help orchestrate and manage your O-RAN deployments intelligently.
