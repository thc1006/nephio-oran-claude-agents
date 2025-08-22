# O-Cloud Infrastructure Deployment

## Overview

This is a production-ready O-Cloud infrastructure implementation compatible with:
- **Nephio R5** (v5.0.0+)
- **O-RAN L Release** (2025-06-30)
- **Kubernetes 1.30+**
- **Go 1.24.6**

## Architecture Components

### 1. O-Cloud Controller
- Main orchestration component managing O-Cloud lifecycle
- Implements reconciliation loop for resource management
- Handles SMO integration and O2 interface

### 2. SMO (Service Management and Orchestration) Stub
- Provides SMO API endpoints for testing
- Handles O-Cloud registration and policy management
- Supports AI/ML capabilities for L Release

### 3. O2 Interface Implementation
- Full O-RAN O2 Interface v1.0 implementation
- RESTful API for cloud infrastructure management
- Resource pool, deployment, and inventory management

### 4. Resource Management
- Cloud resource abstraction layer
- Dynamic resource allocation and tracking
- Multi-pool support (edge, central, GPU)

### 5. Telemetry and Monitoring
- Prometheus metrics collection
- Grafana dashboards
- Alert rules for proactive monitoring

## Directory Structure

```
test-deployment/o-cloud/
├── controllers/           # Go controller implementations
│   ├── o-cloud-controller.go
│   ├── smo-client.go
│   ├── o2-interface.go
│   └── resource-manager.go
├── manifests/            # Kubernetes YAML manifests
│   ├── o-cloud-crd.yaml
│   ├── o-cloud-deployment.yaml
│   └── o-cloud-instance.yaml
├── monitoring/           # Monitoring configuration
│   └── prometheus-config.yaml
└── README.md            # This file
```

## Deployment Instructions

### Prerequisites

1. Kubernetes cluster (1.30+)
2. kubectl configured
3. Helm 3.14+ (optional, for monitoring stack)

### Step 1: Deploy CRDs

```bash
kubectl apply -f manifests/o-cloud-crd.yaml
```

### Step 2: Deploy O-Cloud Controller

```bash
kubectl apply -f manifests/o-cloud-deployment.yaml
```

### Step 3: Verify Controller Status

```bash
kubectl -n ocloud-system get pods
kubectl -n ocloud-system logs -l app=ocloud-controller
```

### Step 4: Deploy O-Cloud Instance

```bash
kubectl apply -f manifests/o-cloud-instance.yaml
```

### Step 5: Check O-Cloud Status

```bash
kubectl -n ocloud-system get oclouds
kubectl -n ocloud-system describe ocloud test-ocloud
```

### Step 6: Access O2 Interface

```bash
# Get the O2 interface endpoint
kubectl -n ocloud-system get svc o2-interface

# Port-forward for local testing
kubectl -n ocloud-system port-forward svc/o2-interface 8090:80

# Test O2 API
curl http://localhost:8090/o2ims/v1/health
curl http://localhost:8090/o2ims/v1/resourcePools
curl http://localhost:8090/o2ims/v1/inventory
```

### Step 7: Deploy Monitoring (Optional)

```bash
kubectl apply -f monitoring/prometheus-config.yaml

# Deploy Prometheus and Grafana using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/prometheus \
  --namespace ocloud-system \
  --values monitoring/prometheus-values.yaml

helm install grafana grafana/grafana \
  --namespace ocloud-system \
  --set adminPassword=admin
```

## API Endpoints

### O2 Interface Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/o2ims/v1/health` | Health check |
| GET | `/o2ims/v1/resourcePools` | List resource pools |
| POST | `/o2ims/v1/resourcePools` | Create resource pool |
| GET | `/o2ims/v1/resources` | List resources |
| POST | `/o2ims/v1/resources` | Create resource |
| GET | `/o2ims/v1/deployments` | List deployments |
| POST | `/o2ims/v1/deployments` | Create deployment |
| GET | `/o2ims/v1/inventory` | Get inventory |
| GET | `/o2ims/v1/alarms` | List alarms |
| POST | `/o2ims/v1/subscriptions` | Create subscription |

### SMO Integration

The SMO stub provides the following endpoints:

- `GET /api/v1/health` - Health check
- `POST /api/v1/oclouds` - Register O-Cloud
- `GET /api/v1/oclouds/{id}/policies` - Get policies
- `POST /api/v1/resource-updates` - Report resource updates
- `POST /api/v1/alarms` - Send alarms

## Testing

### Dry-Run Deployment

```bash
# Validate manifests without applying
kubectl apply -f manifests/ --dry-run=client

# Check what would be created
kubectl apply -f manifests/ --dry-run=server
```

### Integration Testing

```bash
# Create test namespace
kubectl create namespace ocloud-test

# Deploy test instance
kubectl -n ocloud-test apply -f manifests/o-cloud-instance.yaml

# Run integration tests
go test ./controllers/... -v
```

### Load Testing

```bash
# Install hey for load testing
go install github.com/rakyll/hey@latest

# Test O2 interface
hey -n 1000 -c 10 http://localhost:8090/o2ims/v1/health
hey -n 100 -c 5 -m GET http://localhost:8090/o2ims/v1/resourcePools
```

## Resource Requirements

### Minimum Requirements

- **O-Cloud Controller**: 100m CPU, 128Mi Memory
- **SMO Stub**: 50m CPU, 64Mi Memory
- **Total**: 150m CPU, 192Mi Memory

### Recommended for Production

- **O-Cloud Controller**: 500m-1000m CPU, 512Mi-1Gi Memory
- **SMO Integration**: 200m-500m CPU, 256Mi-512Mi Memory
- **Monitoring Stack**: 1 CPU, 2Gi Memory

## Configuration

### Environment Variables

- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `METRICS_ADDR`: Metrics endpoint address
- `HEALTH_ADDR`: Health check endpoint address
- `O2_INTERFACE_PORT`: O2 interface port

### ConfigMap Settings

Edit `ocloud-controller-config` ConfigMap to modify:
- Reconciliation interval
- SMO endpoint
- Telemetry settings
- Resource quotas
- Feature flags

## Troubleshooting

### Controller Not Starting

```bash
kubectl -n ocloud-system describe pod -l app=ocloud-controller
kubectl -n ocloud-system logs -l app=ocloud-controller --previous
```

### O2 Interface Not Accessible

```bash
kubectl -n ocloud-system get svc o2-interface
kubectl -n ocloud-system get endpoints o2-interface
```

### Resource Pool Issues

```bash
kubectl -n ocloud-system get resourcepools
kubectl -n ocloud-system describe resourcepool <pool-name>
```

### SMO Connection Failed

```bash
kubectl -n ocloud-system logs -l app=smo-stub
kubectl -n ocloud-system exec -it deploy/ocloud-controller -- curl http://smo-stub:8091/api/v1/health
```

## Security Considerations

1. **RBAC**: Controller uses least-privilege service account
2. **Network Policies**: Can be added to restrict traffic
3. **TLS**: O2 interface supports TLS (configure in production)
4. **Authentication**: O2 interface supports bearer token auth
5. **FIPS 140-3**: Go 1.24.6 supports FIPS compliance (requires validated build)

## Production Deployment

For production deployments:

1. Use external SMO instead of stub
2. Enable TLS for O2 interface
3. Configure proper resource limits
4. Set up monitoring and alerting
5. Implement backup and disaster recovery
6. Use GitOps (ArgoCD) for deployment

## License

This implementation follows O-RAN Alliance specifications and Nephio project guidelines.

## Support

This is a demonstration implementation for the Nephio R5 and O-RAN L Release integration.

For production use, please refer to:
- [Nephio Documentation](https://nephio.org/)
- [O-RAN SC Documentation](https://o-ran-sc.org/)
- [O-RAN Alliance Specifications](https://www.o-ran.org/)