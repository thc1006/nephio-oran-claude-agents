# Near-RT RIC Platform

Complete Near-RT RIC (RAN Intelligent Controller) platform implementation based on O-RAN SC L Release specifications and Nephio R5 patterns.

## Architecture Overview

This implementation provides a comprehensive Near-RT RIC platform with:

- **RIC Platform Core**: Kong API Gateway, Redis state management, Message Router (Kafka), A1 Mediator, E2 Manager, Subscription Manager
- **xApps Framework**: xApp deployment controller, service discovery, lifecycle management, sample xApps
- **Integration Points**: A1 interface (Non-RT RIC), E2 interface (RAN elements), O1 interface (management)

## Components

### RIC Platform Core (`/core`)
- Kong API Gateway for northbound interfaces
- Redis for state management and caching
- Kafka message router for event streaming
- A1 Mediator for policy management
- E2 Manager for RAN connection management
- Subscription Manager for xApp subscriptions

### xApps Framework (`/xapps`)
- xApp deployment controller
- Service discovery and registration
- xApp lifecycle management
- Sample xApps (Traffic Steering, Anomaly Detection)

### Integration Points (`/integration`)
- A1 interface implementation
- E2 interface implementation
- O1 interface implementation

### Configuration (`/configs`)
- Kubernetes manifests
- Helm charts
- ConfigMaps and Secrets

### Monitoring (`/monitoring`)
- Prometheus configuration
- Grafana dashboards
- Alert rules

### Scripts (`/scripts`)
- Deployment automation
- Testing utilities
- Management scripts

## Quick Start

1. **Deploy Core Components**:
   ```bash
   ./scripts/deploy-core.sh
   ```

2. **Deploy xApps Framework**:
   ```bash
   ./scripts/deploy-xapps.sh
   ```

3. **Install Sample xApps**:
   ```bash
   ./scripts/deploy-sample-xapps.sh
   ```

4. **Verify Deployment**:
   ```bash
   ./scripts/verify-deployment.sh
   ```

## Prerequisites

- Kubernetes 1.30+
- Helm 3.14+
- kubectl configured
- Sufficient cluster resources (see resource requirements)

## Resource Requirements

- **CPU**: 16+ cores
- **Memory**: 32Gi+
- **Storage**: 100Gi+ SSD
- **Networking**: Multi-network support (Multus CNI)

## Standards Compliance

- O-RAN SC L Release (2025-06-30)
- Nephio R5 Architecture Specification v2.0
- O-RAN.WG3.E2AP-v16.00
- O-RAN.WG5.A1-Interface-v06.00
- O-RAN.WG1.O1-Interface.0-v16.00

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [xApp Development Guide](docs/xapp-development.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)