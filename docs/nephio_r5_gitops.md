# Nephio R5 GitOps Architecture

## Overview

Nephio R5 (Released 2024-2025) introduces significant changes to the GitOps architecture, establishing **ArgoCD as the primary GitOps tool** for workload deployments while maintaining ConfigSync for management cluster operations. This document provides comprehensive guidance on the R5 GitOps patterns, bare-metal provisioning via Metal3, and ApplicationSet-based deployments.

## Key R5 Changes

### GitOps Toolchain Evolution

| Component | R4 | R5 | Notes |
|-----------|----|----|-------|
| **Primary GitOps** | ConfigSync | ArgoCD 3.1.0+ | Workload deployments |
| **Secondary GitOps** | ArgoCD (optional) | ConfigSync | Management cluster only |
| **Alternative** | - | FluxCD 2.2+ | Supported alternative |
| **Bare-metal** | Limited | Metal3/BMO/Ironic | Full integration |
| **Package Management** | Kpt | Kpt + ApplicationSets | Enhanced automation |

### Official References
- [Nephio R5 Release Notes](https://github.com/nephio-project/nephio/releases/tag/r5.0.0)
- [Nephio R5 User Guide](https://nephio.org/docs/r5/user-guide/)
- [ArgoCD Integration Guide](https://nephio.org/docs/r5/gitops/argocd/)
- [Metal3 Bare-metal Guide](https://nephio.org/docs/r5/infrastructure/metal3/)

## ArgoCD as Primary GitOps Tool

### Why ArgoCD in R5?

1. **ApplicationSets**: Dynamic multi-cluster deployments
2. **Progressive Delivery**: Built-in rollout strategies
3. **Multi-tenancy**: Better RBAC and project isolation
4. **UI/UX**: Superior visualization and debugging
5. **Ecosystem**: Wide industry adoption and tooling

### ArgoCD Installation for Nephio R5

```bash
# Install ArgoCD 3.1.0+ (R5 minimum version)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.1.0/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=600s \
  deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port forward for UI access
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### ArgoCD Configuration for Nephio

```yaml
# argocd-cm ConfigMap additions for Nephio R5
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  # Enable Kpt function support
  resource.customizations: |
    kpt.dev/*:
      health.lua: |
        hs = {}
        hs.status = "Healthy"
        hs.message = "Kpt resource"
        return hs
    
    fn.kpt.dev/*:
      health.lua: |
        hs = {}
        hs.status = "Healthy"
        hs.message = "Kpt function"
        return hs
  
  # Repository credentials for Nephio packages
  repositories: |
    - url: https://github.com/nephio-project/nephio-packages
      name: nephio-packages
      type: git
    - url: https://github.com/nephio-project/oai-packages
      name: oai-packages
      type: git
  
  # Enable ApplicationSet controller
  applicationsetcontroller.enable: "true"
  
  # Resource tracking for Nephio CRDs
  application.instanceLabelKey: argocd.argoproj.io/instance
  
  # Dex OIDC configuration (optional)
  url: https://argocd.nephio.local
```

## ApplicationSet Patterns for Nephio R5

### Multi-Cluster Edge Deployment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: edge-clusters-nephio-r5
  namespace: argocd
spec:
  generators:
  # List generator for edge clusters
  - list:
      elements:
      - cluster: edge-west-1
        region: us-west
        url: https://edge-west-1.nephio.local
        provider: metal3
      - cluster: edge-east-1
        region: us-east
        url: https://edge-east-1.nephio.local
        provider: aws
      - cluster: edge-central-1
        region: eu-central
        url: https://edge-central-1.nephio.local
        provider: azure
  
  template:
    metadata:
      name: '{{cluster}}-workload'
      labels:
        nephio.org/cluster: '{{cluster}}'
        nephio.org/region: '{{region}}'
        nephio.org/version: r5
    spec:
      project: default
      source:
        repoURL: https://github.com/nephio-project/nephio-packages
        targetRevision: r5.0.0
        path: edge-workload
        plugin:
          name: kpt-v1
          env:
          - name: CLUSTER_NAME
            value: '{{cluster}}'
          - name: REGION
            value: '{{region}}'
          - name: PROVIDER
            value: '{{provider}}'
      
      destination:
        server: '{{url}}'
        namespace: workloads
      
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
          allowEmpty: false
        syncOptions:
        - CreateNamespace=true
        - PrunePropagationPolicy=foreground
        - PruneLast=true
        retry:
          limit: 5
          backoff:
            duration: 5s
            factor: 2
            maxDuration: 3m
      
      # R5 Progressive Delivery
      rollback:
        limit: 3
      revisionHistoryLimit: 10
```

### Package Variant ApplicationSet

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: package-variants-r5
  namespace: argocd
spec:
  generators:
  # Git generator for package variants
  - git:
      repoURL: https://github.com/nephio-project/nephio-packages
      revision: r5.0.0
      directories:
      - path: "*/package-variant/*"
      
  # Merge with cluster generator
  - merge:
      mergeKeys:
      - cluster
      generators:
      - clusters:
          selector:
            matchLabels:
              nephio.org/ready: "true"
      - list:
          elements:
          - variant: upf
            replicas: "3"
          - variant: smf
            replicas: "2"
          - variant: amf
            replicas: "2"
  
  template:
    metadata:
      name: '{{path.basename}}-{{name}}'
    spec:
      project: nephio-core
      source:
        repoURL: https://github.com/nephio-project/nephio-packages
        targetRevision: r5.0.0
        path: '{{path}}'
        kustomize:
          replicas:
          - name: '{{path.basename}}'
            count: '{{replicas}}'
      destination:
        server: '{{server}}'
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

## Metal3 Bare-metal Integration

### Metal3 Components for R5

```yaml
# metal3-components.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: metal3-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metal3-baremetal-operator
  namespace: metal3-system
spec:
  replicas: 1
  selector:
    matchLabels:
      name: metal3-baremetal-operator
  template:
    metadata:
      labels:
        name: metal3-baremetal-operator
    spec:
      serviceAccountName: metal3-baremetal-operator
      containers:
      - name: baremetal-operator
        image: quay.io/metal3-io/baremetal-operator:v0.5.0
        env:
        - name: WATCH_NAMESPACE
          value: ""
        - name: IRONIC_ENDPOINT
          value: "http://ironic.metal3-system.svc.cluster.local:6385"
        - name: IRONIC_INSPECTOR_ENDPOINT
          value: "http://ironic-inspector.metal3-system.svc.cluster.local:5050"
        - name: DEPLOY_KERNEL_URL
          value: "http://ironic.metal3-system.svc.cluster.local:6180/images/ironic-python-agent.kernel"
        - name: DEPLOY_RAMDISK_URL
          value: "http://ironic.metal3-system.svc.cluster.local:6180/images/ironic-python-agent.initramfs"
---
# Ironic deployment for bare-metal provisioning
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ironic
  namespace: metal3-system
spec:
  replicas: 1
  selector:
    matchLabels:
      name: ironic
  template:
    metadata:
      labels:
        name: ironic
    spec:
      containers:
      - name: ironic
        image: quay.io/metal3-io/ironic:v23.1.0
        env:
        - name: PROVISIONING_INTERFACE
          value: "eth1"
        - name: DHCP_RANGE
          value: "172.22.0.10,172.22.0.100"
        - name: HTTP_PORT
          value: "6180"
        - name: IRONIC_FAST_TRACK
          value: "true"
        ports:
        - containerPort: 6385
          name: api
        - containerPort: 6180
          name: http
        - containerPort: 5050
          name: inspector
        volumeMounts:
        - name: ironic-data
          mountPath: /shared
      volumes:
      - name: ironic-data
        emptyDir: {}
```

### BareMetalHost Example

```yaml
apiVersion: metal3.io/v1alpha1
kind: BareMetalHost
metadata:
  name: edge-node-01
  namespace: metal3-system
  labels:
    nephio.org/cluster: edge-west-1
    nephio.org/role: worker
spec:
  online: true
  bootMACAddress: "00:1B:44:11:3A:B7"
  bootMode: UEFI
  
  # BMC credentials
  bmc:
    address: redfish://10.0.0.10/redfish/v1/Systems/1
    credentialsName: edge-node-01-credentials
    disableCertificateVerification: true
  
  # Hardware profile
  hardwareProfile: dell-r640
  
  # Root device hints
  rootDeviceHints:
    deviceName: /dev/sda
    minSizeGigabytes: 500
  
  # Network data
  networkData:
    name: edge-node-01-network-data
    namespace: metal3-system
  
  # User data for cloud-init
  userData:
    name: edge-node-01-user-data
    namespace: metal3-system
  
  # Image to provision
  image:
    url: http://ironic.metal3-system.svc.cluster.local:6180/images/ubuntu-22.04.qcow2
    checksum: "sha256:abcdef1234567890"
    checksumType: sha256
    format: qcow2
```

## ConfigSync for Management Cluster

While ArgoCD is primary for workloads, ConfigSync remains useful for management cluster configuration:

```yaml
# management-cluster-configsync.yaml
apiVersion: configsync.gke.io/v1beta1
kind: RootSync
metadata:
  name: mgmt-cluster-config
  namespace: config-management-system
spec:
  sourceFormat: unstructured
  git:
    repo: https://github.com/nephio-project/mgmt-configs
    branch: r5
    dir: "clusters/mgmt"
    auth: token
    secretRef:
      name: git-creds
  override:
    apiServerTimeout: 30s
    reconcileTimeout: 5m
    statusUpdatePeriod: 10s
```

## FluxCD Alternative

For organizations preferring FluxCD:

```yaml
# flux-system GitOps toolkit
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: nephio-r5-packages
  namespace: flux-system
spec:
  interval: 1m
  ref:
    branch: r5.0.0
  url: https://github.com/nephio-project/nephio-packages
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: nephio-workloads
  namespace: flux-system
spec:
  interval: 10m
  path: "./workloads"
  prune: true
  sourceRef:
    kind: GitRepository
    name: nephio-r5-packages
  targetNamespace: workloads
  validation: client
  retryInterval: 2m
  timeout: 5m
```

## Centralized ArgoCD Workflow Example

### Complete E2E Deployment Flow

```yaml
# centralized-workflow.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: nephio-r5-project
  namespace: argocd
spec:
  description: Nephio R5 centralized deployment project
  
  # Source repositories
  sourceRepos:
  - 'https://github.com/nephio-project/*'
  - 'https://github.com/o-ran-sc/*'
  
  # Destination clusters and namespaces
  destinations:
  - namespace: '*'
    server: '*'
  
  # Cluster resource whitelist
  clusterResourceWhitelist:
  - group: '*'
    kind: '*'
  
  # Namespace resource blacklist
  namespaceResourceBlacklist:
  - group: ''
    kind: ResourceQuota
  - group: ''
    kind: LimitRange
  
  # Roles
  roles:
  - name: admin
    policies:
    - p, proj:nephio-r5-project:admin, applications, *, nephio-r5-project/*, allow
    groups:
    - nephio-admins
  
  - name: developer
    policies:
    - p, proj:nephio-r5-project:developer, applications, get, nephio-r5-project/*, allow
    - p, proj:nephio-r5-project:developer, applications, sync, nephio-r5-project/*, allow
    groups:
    - nephio-developers
---
# Parent App-of-Apps
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nephio-r5-platform
  namespace: argocd
  finalizers:
  - resources-finalizer.argocd.argoproj.io
spec:
  project: nephio-r5-project
  
  source:
    repoURL: https://github.com/nephio-project/nephio-packages
    targetRevision: r5.0.0
    path: platform
  
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  
  # Health checks
  health:
    progressDeadlineSeconds: 600
```

## Migration from ConfigSync to ArgoCD

### Step 1: Install ArgoCD alongside ConfigSync
```bash
# Keep ConfigSync running
kubectl get rootsync -A
kubectl get reposync -A

# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.1.0/manifests/install.yaml
```

### Step 2: Migrate Applications
```bash
# Export ConfigSync resources
kubectl get rootsync,reposync -A -o yaml > configsync-backup.yaml

# Convert to ArgoCD Applications
python3 scripts/configsync-to-argocd.py configsync-backup.yaml > argocd-apps.yaml

# Apply ArgoCD applications
kubectl apply -f argocd-apps.yaml
```

### Step 3: Verify and Cutover
```bash
# Verify ArgoCD sync status
argocd app list
argocd app get <app-name>

# Disable ConfigSync for migrated apps
kubectl patch rootsync <name> -n config-management-system \
  --type merge -p '{"spec":{"override":{"reconciling":false}}}'
```

## Best Practices for R5 GitOps

### 1. Repository Structure
```
nephio-gitops/
├── management/          # ConfigSync configs
│   ├── cluster/
│   └── namespaces/
├── workloads/          # ArgoCD applications
│   ├── base/
│   ├── overlays/
│   └── applicationsets/
├── packages/           # Kpt packages
│   ├── network-functions/
│   └── infrastructure/
└── charts/             # Helm charts (optional)
```

### 2. Progressive Delivery
```yaml
# Use ArgoCD Rollouts for gradual deployments
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: nephio-workload
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {duration: 1m}
      - setWeight: 40
      - pause: {duration: 1m}
      - setWeight: 60
      - pause: {duration: 1m}
      - setWeight: 80
      - pause: {duration: 1m}
```

### 3. Multi-tenancy
```yaml
# Namespace isolation with ArgoCD
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: tenant-a
spec:
  sourceRepos:
  - 'https://github.com/tenant-a/*'
  destinations:
  - namespace: 'tenant-a-*'
    server: https://kubernetes.default.svc
  clusterResourceWhitelist: []  # No cluster resources
```

## Monitoring GitOps Health

```yaml
# ServiceMonitor for ArgoCD metrics
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: argocd-metrics
  namespace: argocd
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: argocd-metrics
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

## References and Links

### Official Documentation
- [Nephio R5 Documentation](https://nephio.org/docs/r5/)
- [Nephio R5 Release Notes](https://github.com/nephio-project/nephio/releases/tag/r5.0.0)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/en/stable/)
- [Metal3 Documentation](https://metal3.io/documentation/)

### Tutorials and Guides
- [Nephio R5 Quick Start](https://nephio.org/docs/r5/quickstart/)
- [ArgoCD with Nephio Tutorial](https://nephio.org/docs/r5/tutorials/argocd/)
- [Metal3 Bare-metal Provisioning Guide](https://nephio.org/docs/r5/guides/metal3/)
- [Migrating from ConfigSync to ArgoCD](https://nephio.org/docs/r5/migration/configsync-to-argocd/)

### Community Resources
- [Nephio Slack](https://nephio.slack.com) - #r5-gitops channel
- [Nephio GitHub](https://github.com/nephio-project)
- [Weekly SIG Meetings](https://nephio.org/community/)