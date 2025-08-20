# Nephio R5 Quick Start Guide

## 🚀 Get Started in 15 Minutes

This guide helps you deploy Nephio R5 with ArgoCD GitOps and optional Metal3 bare-metal support.

## Prerequisites

- Kubernetes cluster 1.32.x (or kind/minikube for testing)
- kubectl configured
- Git access to package repositories
- 8GB RAM minimum, 16GB recommended

## Step 1: Install ArgoCD (Primary GitOps Tool)

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD 3.1.0+ (R5 requirement)
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/v3.1.0/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=600s \
  deployment/argocd-server -n argocd

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo

# Access UI (keep running)
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access ArgoCD UI at: https://localhost:8080 (admin / password from above)

## Step 2: Deploy Nephio Base Platform

```bash
# Create base application
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nephio-r5-base
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/nephio-project/nephio-packages
    targetRevision: r5.0.0
    path: base
  destination:
    server: https://kubernetes.default.svc
    namespace: nephio-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
EOF

# Check deployment status
kubectl get app nephio-r5-base -n argocd
argocd app sync nephio-r5-base
```

## Step 3: Deploy O-RAN Network Functions

```bash
# Deploy network functions with ApplicationSet
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: oran-nf-quickstart
  namespace: argocd
spec:
  generators:
  - list:
      elements:
      - nf: oran-du
        cpu: "4"
        memory: "8Gi"
      - nf: oran-cu-cp
        cpu: "2"
        memory: "4Gi"
  template:
    metadata:
      name: '{{nf}}-quickstart'
    spec:
      project: default
      source:
        repoURL: https://github.com/nephio-project/oai-packages
        targetRevision: r5.0.0
        path: 'network-functions/{{nf}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: 'oran-{{nf}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
        - CreateNamespace=true
EOF

# Check deployments
kubectl get applicationsets -n argocd
kubectl get pods -n oran-du
kubectl get pods -n oran-cu-cp
```

## Step 4: Enable Monitoring (Optional)

```bash
# Deploy monitoring stack
docker-compose -f monitoring/docker-compose.yml up -d

# Or in Kubernetes:
kubectl create namespace monitoring

# Prometheus 3.5 LTS
kubectl apply -f monitoring/prometheus-config.yaml

# Grafana 12.x
kubectl apply -f monitoring/grafana-config.yaml

# Access dashboards
kubectl port-forward -n monitoring svc/grafana 3000:3000
```

## Step 5: Metal3 Bare-metal (Advanced)

```bash
# Only if using bare-metal infrastructure
kubectl create namespace metal3-system

# Deploy Metal3 operator
kubectl apply -f examples/argocd/metal3-cluster-provisioning.yaml

# Create BareMetalHost
cat <<EOF | kubectl apply -f -
apiVersion: metal3.io/v1alpha1
kind: BareMetalHost
metadata:
  name: edge-node-01
  namespace: metal3-system
spec:
  online: true
  bootMACAddress: "00:1B:44:11:3A:B7"
  bmc:
    address: redfish://10.0.0.10/redfish/v1/Systems/1
    credentialsName: bmc-creds
EOF

# Check provisioning
kubectl get baremetalhost -n metal3-system
```

## Verification Commands

```bash
# Check ArgoCD applications
argocd app list
argocd app get nephio-r5-base

# Check Nephio components
kubectl get pods -n nephio-system
kubectl get crds | grep nephio

# Check network functions
kubectl get pods -A | grep oran

# View logs
kubectl logs -n argocd deployment/argocd-server
kubectl logs -n nephio-system -l app=nephio-controller
```

## Common Issues & Solutions

### Issue 1: ArgoCD Sync Failed
```bash
# Check application details
argocd app get <app-name> --refresh

# Manual sync with retry
argocd app sync <app-name> --retry-limit 3

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

### Issue 2: Pod Crashes/Restarts
```bash
# Check pod logs
kubectl logs -n <namespace> <pod-name> --previous

# Describe pod for events
kubectl describe pod -n <namespace> <pod-name>

# Check resource limits
kubectl top pods -n <namespace>
```

### Issue 3: FIPS Compliance Errors
```bash
# Ensure FIPS mode is enabled
kubectl set env deployment/<name> -n <namespace> \
  GODEBUG=fips140=on \
  GO_VERSION=1.24.6
```

## Minimal Testing Setup (Kind)

```bash
# Create kind cluster with correct version
kind create cluster --image kindest/node:v1.32.0 \
  --name nephio-r5 \
  --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "nephio.org/cluster=kind"
- role: worker
  kubeadmConfigPatches:
  - |
    kind: JoinConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "nephio.org/node-type=worker"
EOF

# Continue with Step 1 above
```

## Production Deployment Checklist

- [ ] Kubernetes 1.32.x cluster with 3+ nodes
- [ ] ArgoCD 3.1.0+ installed and configured
- [ ] Git credentials configured for private repos
- [ ] RBAC and network policies configured
- [ ] Monitoring stack deployed (Prometheus 3.5 + Grafana 12.x)
- [ ] Backup strategy implemented
- [ ] TLS certificates configured
- [ ] Resource quotas and limits set
- [ ] High availability for ArgoCD configured

## Next Steps

1. **Explore Full Documentation**
   - [Nephio R5 GitOps Architecture](./nephio_r5_gitops.md)
   - [Complete R5 Update Checklist](./nephio_r5_update.md)

2. **Advanced Configuration**
   - Multi-cluster deployments
   - Progressive delivery with Rollouts
   - Custom resource definitions

3. **Join the Community**
   - [Nephio Slack](https://nephio.slack.com) - #r5-users channel
   - [Weekly meetings](https://nephio.org/community/)
   - [GitHub discussions](https://github.com/nephio-project/nephio/discussions)

## Useful Aliases

Add to your shell profile:

```bash
# ArgoCD shortcuts
alias argo='argocd'
alias argolist='argocd app list'
alias argosync='argocd app sync'
alias argoget='argocd app get'

# Nephio shortcuts
alias knephio='kubectl -n nephio-system'
alias koran='kubectl -n oran'
alias kmetal3='kubectl -n metal3-system'

# Quick status
alias nephio-status='kubectl get pods -n nephio-system && kubectl get apps -n argocd'
```

## Environment Variables

```bash
# Set for FIPS 140-3 usage capability (consult security team for validated builds)
export GODEBUG=fips140=on
export GO_VERSION=1.24.6

# ArgoCD CLI
export ARGOCD_SERVER=localhost:8080
export ARGOCD_AUTH_TOKEN=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
```

## Troubleshooting Resources

- [Nephio R5 Troubleshooting Guide](https://nephio.org/docs/r5/troubleshooting/)
- [ArgoCD Troubleshooting](https://argo-cd.readthedocs.io/en/stable/user-guide/troubleshooting/)
- [Metal3 Debugging](https://metal3.io/documentation/troubleshooting/)

---

**Quick Help**: Run `kubectl get all -A | grep -E '(nephio|argo|metal3|oran)'` to see all Nephio R5 components at once.

**Version**: Nephio R5 (v5.0.0) | **Last Updated**: 2025-01-19