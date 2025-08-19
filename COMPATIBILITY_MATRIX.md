# Dependency Compatibility Matrix

**Last Updated**: 2025-01-19  
**Status**: ✅ Production Ready

## Core Platform Versions

| Component | Minimum Version | Recommended Version | Maximum Tested | Support Policy | Notes |
|-----------|----------------|-------------------|----------------|----------------|-------|
| **Kubernetes** | 1.29.0 | 1.32.0 | 1.32.2 | [Release Policy](https://kubernetes.io/releases/) | 1.32.x is current stable with 14 months support |
| **ArgoCD** | 3.0.0 | 3.1.0 | 3.1.2 | [Release Notes](https://argo-cd.readthedocs.io/en/stable/operator-manual/upgrading/overview/) | 3.1.x is current stable release |
| **Kafka** | 3.6.0 | 3.8.0 | 3.8.1 | [Release Notes](https://kafka.apache.org/downloads) | 3.8.x with KRaft mode (ZooKeeper deprecated) |
| **kpt** | v1.0.0-beta.50 | v1.0.0-beta.55 | v1.0.0-beta.57 | [Releases](https://github.com/kptdev/kpt/releases) | Latest beta with improved function support |

## Nephio & O-RAN Versions

| Component | Version | Release Date | Status | Documentation |
|-----------|---------|--------------|--------|---------------|
| **Nephio** | R5 | 2024-2025 | ✅ Current | [Nephio R5 Docs](https://nephio.org/docs/r5/) |
| **O-RAN SC** | L Release | June 30, 2025 | ✅ Current | [L Release Docs](https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/) |
| **Go** | 1.24.6 | Latest | ✅ Current | FIPS 140-3 compliant |

## Kubernetes Support Matrix

### API Versions
| Resource Type | API Version | Min K8s Version | Notes |
|--------------|-------------|-----------------|-------|
| Deployment | apps/v1 | 1.16+ | Stable |
| Service | v1 | 1.0+ | Stable |
| ConfigMap | v1 | 1.0+ | Stable |
| Secret | v1 | 1.0+ | Stable |
| Job | batch/v1 | 1.21+ | Stable |
| CronJob | batch/v1 | 1.21+ | Stable |
| HPA | autoscaling/v2 | 1.23+ | Stable with v2 metrics |
| NetworkPolicy | networking.k8s.io/v1 | 1.7+ | Stable |
| Ingress | networking.k8s.io/v1 | 1.19+ | Stable |
| PodDisruptionBudget | policy/v1 | 1.21+ | Stable |
| ValidatingWebhook | admissionregistration.k8s.io/v1 | 1.16+ | Stable |

### Features Required
- **CEL Validation**: 1.29+ (GA in 1.30)
- **Pod Security Standards**: 1.23+ (GA in 1.25)
- **Server-side Apply**: 1.16+ (GA in 1.22)
- **Ephemeral Containers**: 1.23+ (GA)
- **Container Runtime**: containerd 1.6+ or CRI-O 1.24+

## ArgoCD Configuration

### Version Requirements
```yaml
# Minimum ArgoCD version: 3.1.0
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  syncPolicy:
    syncOptions:
      - ServerSideApply=true  # Requires K8s 1.16+
      - CreateNamespace=true
```

### ApplicationSet Features (3.1.0+)
- Matrix generators
- Merge generators
- Progressive sync
- Multi-source applications
- Plugin support for kpt functions

## Kafka Configuration

### KRaft Mode (Recommended - 3.8.x)
```yaml
# Kafka 3.8.x with KRaft mode (no ZooKeeper)
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: nephio-kafka
spec:
  kafka:
    version: 3.8.0
    replicas: 3
    config:
      # KRaft mode configuration
      process.roles: "broker,controller"
      node.id: "${KAFKA_NODE_ID}"
      controller.quorum.voters: "1@kafka-0:9093,2@kafka-1:9093,3@kafka-2:9093"
      inter.broker.listener.name: "PLAINTEXT"
      controller.listener.names: "CONTROLLER"
      # No zookeeper.connect required!
```

### Legacy ZooKeeper Mode (3.6.x - 3.7.x)
```yaml
# Legacy mode - deprecated, use only if required
spec:
  zookeeper:
    replicas: 3
  kafka:
    config:
      zookeeper.connect: "zookeeper:2181"
```

### Kafka Client Compatibility
| Client Version | Kafka 3.6.x | Kafka 3.7.x | Kafka 3.8.x |
|---------------|-------------|-------------|-------------|
| 3.4.x | ✅ | ✅ | ✅ |
| 3.5.x | ✅ | ✅ | ✅ |
| 3.6.x | ✅ | ✅ | ✅ |
| 3.7.x | ⚠️ | ✅ | ✅ |
| 3.8.x | ❌ | ⚠️ | ✅ |

## kpt Package Management

### Version Evolution
| Version | Status | Key Features | Migration Notes |
|---------|--------|--------------|-----------------|
| v1.0.0-beta.27 | Deprecated | Basic functions | Upgrade required |
| v1.0.0-beta.50 | Supported | Improved validation | Stable for production |
| **v1.0.0-beta.55** | **Recommended** | Enhanced function chains | Current best practice |
| v1.0.0-beta.57 | Latest | Experimental features | Testing only |

### kpt Function Compatibility
```yaml
apiVersion: kpt.dev/v1
kind: Kptfile
metadata:
  name: package
pipeline:
  mutators:
    - image: gcr.io/kpt-fn/set-namespace:v0.4.1
    - image: gcr.io/kpt-fn/apply-setters:v0.2.0
  validators:
    - image: gcr.io/kpt-fn/kubeval:v0.3.0
```

## Monitoring Stack Versions

| Component | Version | Notes |
|-----------|---------|-------|
| Prometheus | 3.5.0 LTS | Native histograms, UTF-8 metrics |
| Grafana | 12.1.0 | Unified alerting, Scenes framework |
| AlertManager | 0.27.0 | Latest stable |
| Loki | 3.0.0 | TSDB backend |
| Tempo | 2.4.0 | TraceQL support |

## CI/CD Tool Versions

| Tool | Version | Purpose |
|------|---------|---------|
| Helm | 3.14.0+ | Package management |
| kubectl | 1.32.x | K8s CLI (match cluster version) |
| kustomize | 5.3.0+ | Configuration management |
| Go | 1.24.6 | FIPS 140-3 compliant builds |
| Python | 3.11+ | Automation scripts |

## Container Registry Support

| Registry | Version | Auth Method | Notes |
|----------|---------|-------------|-------|
| Docker Hub | v2 | Token/OAuth | Rate limits apply |
| GHCR | v2 | PAT/OAuth | GitHub packages |
| GCR/AR | v2 | Service Account | Google Cloud |
| ECR | v2 | IAM | AWS |
| ACR | v2 | Service Principal | Azure |

## Network Plugin Compatibility

| CNI Plugin | K8s 1.29 | K8s 1.30 | K8s 1.31 | K8s 1.32 |
|------------|----------|----------|----------|----------|
| Calico 3.27.x | ✅ | ✅ | ✅ | ✅ |
| Cilium 1.15.x | ✅ | ✅ | ✅ | ✅ |
| Flannel 0.24.x | ✅ | ✅ | ✅ | ✅ |
| Weave 2.8.x | ✅ | ⚠️ | ⚠️ | ❌ |

## Service Mesh Compatibility

| Mesh | Version | K8s Support | Notes |
|------|---------|-------------|-------|
| Istio | 1.21.x | 1.28-1.32 | Ambient mesh GA |
| Linkerd | 2.14.x | 1.26-1.32 | Stable |
| Consul | 1.18.x | 1.27-1.32 | Consul Connect |

## Breaking Changes & Migration Notes

### Kubernetes 1.32.x
- **PodSecurityPolicy**: Removed (use Pod Security Standards)
- **FlowSchema v1beta1**: Removed (use v1)
- **CSIStorageCapacity v1beta1**: Removed (use v1)

### ArgoCD 3.1.x
- **API Version**: Apps remain v1alpha1
- **RBAC**: Enhanced project roles
- **Plugins**: New plugin architecture

### Kafka 3.8.x
- **ZooKeeper**: Deprecated, migrate to KRaft
- **Java**: Requires Java 11+
- **Tiered Storage**: GA

### kpt v1.0.0-beta.55+
- **Function Chains**: New pipeline syntax
- **Validation**: Stricter schema checking
- **Resources**: Improved memory management

## Validation Script

Use `scripts/verify_matrix.go` to validate your manifests against this matrix:

```bash
go run scripts/verify_matrix.go --path ./manifests
```

## Support Lifecycle

### Kubernetes
- **Current**: 1.32.x (Dec 2024 - Feb 2026)
- **Previous**: 1.31.x (Aug 2024 - Oct 2025)
- **EOL**: < 1.29.x

### ArgoCD
- **Current**: 3.1.x
- **Previous**: 3.0.x (security fixes only)
- **EOL**: < 2.11.x

### Kafka
- **Current**: 3.8.x
- **Previous**: 3.7.x (security fixes)
- **Migration Required**: < 3.6.x (ZooKeeper removal)

## References

- [Kubernetes Release Calendar](https://kubernetes.io/releases/release/)
- [ArgoCD Release Notes](https://argo-cd.readthedocs.io/en/stable/operator-manual/upgrading/overview/)
- [Apache Kafka Downloads](https://kafka.apache.org/downloads)
- [kpt Releases](https://github.com/kptdev/kpt/releases)
- [Nephio R5 Documentation](https://nephio.org/docs/r5/)
- [O-RAN SC L Release](https://docs.o-ran-sc.org/projects/o-ran-sc-doc/en/latest/)

---

**Note**: This matrix is validated by CI/CD pipelines. Any version outside these ranges will fail validation.