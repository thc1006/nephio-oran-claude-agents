# O-RAN Agent-Based Near-RT RIC Platform Deployment

This deployment demonstrates how the O-RAN agents work together to build a production-ready Near-RT RIC platform with xApps, interfaces, monitoring, and security.

## Agent Coordination Workflow

The agents execute in the following coordinated sequence:

1. **nephio-oran-orchestrator-agent** - Coordinates and orchestrates the entire deployment
2. **security-compliance-agent** - Establishes security baseline and policies  
3. **nephio-infrastructure-agent** - Provisions infrastructure resources
4. **configuration-management-agent** - Configures YANG models and interfaces
5. **oran-network-functions-agent** - Deploys RIC platform and xApps
6. **monitoring-analytics-agent** - Sets up observability and monitoring
7. **testing-validation-agent** - Validates deployment and runs tests

## Architecture Overview

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Near-RT RIC   │  │  xApp Platform  │  │   E2/A1/O1/O2   │
│    Platform     │  │     Manager     │  │   Interfaces    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Monitoring    │  │    Security     │  │ Infrastructure  │
│   & Analytics   │  │   & Compliance  │  │   & Config      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Components Deployed

### Near-RT RIC Platform
- E2 Manager & Termination
- A1 Mediator & Policy Engine
- xApp Manager & Framework
- Subscription Manager
- Database Services (Redis)
- Service Mesh (Istio)

### xApps
- Traffic Steering xApp
- QoS Prediction xApp  
- Anomaly Detection xApp
- KPI Monitoring xApp

### Interfaces
- **E2**: RAN-RIC communication with service models
- **A1**: Policy management and ML model distribution
- **O1**: NETCONF/YANG configuration management
- **O2**: Cloud infrastructure management

### Monitoring Stack
- Prometheus with O-RAN metrics
- Grafana dashboards
- Jaeger tracing
- ELK stack for logging
- VES event collection

### Security Controls
- Zero-trust architecture with SPIFFE/SPIRE
- mTLS for all communications
- Image scanning and signing
- Runtime security with Falco
- Compliance validation

## Quick Start

1. **Initialize deployment**:
   ```bash
   cd test-deployment/ric-platform-agents
   ./deploy-all.sh
   ```

2. **Verify deployment**:
   ```bash
   ./validate-deployment.sh
   ```

3. **Access dashboards**:
   - Grafana: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Jaeger: http://localhost:16686

## File Structure

```
test-deployment/ric-platform-agents/
├── 01-orchestration/           # Orchestrator configurations
├── 02-security/               # Security policies and controls
├── 03-infrastructure/         # Infrastructure manifests
├── 04-configuration/          # YANG models and configs
├── 05-network-functions/      # RIC platform and xApps
├── 06-monitoring/             # Observability stack
├── 07-testing/               # Test suites and validation
├── scripts/                  # Deployment and utility scripts
└── docs/                     # Documentation and guides
```

## Agent Specifications Applied

This deployment implements the capabilities defined in:
- `agents/nephio-oran-orchestrator-agent.md`
- `agents/oran-network-functions-agent.md`
- `agents/monitoring-analytics-agent.md`
- `agents/security-compliance-agent.md`
- And all other agent specifications

## Dependencies

- Kubernetes 1.32+
- Go 1.24.6
- Helm 3.14+
- ArgoCD 3.1.0+
- Nephio R5
- O-RAN L Release components