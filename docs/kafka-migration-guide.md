# Kafka Migration Guide: ZooKeeper to KRaft Mode

## Overview

Apache Kafka 3.8.x marks ZooKeeper as deprecated. This guide helps migrate from ZooKeeper-based Kafka deployments to KRaft mode for Nephio-O-RAN environments.

## Why Migrate to KRaft?

### Benefits
- **Simplified Architecture**: No separate ZooKeeper cluster required
- **Better Performance**: Lower latency, higher throughput
- **Easier Scaling**: Simpler to add/remove brokers
- **Resource Efficiency**: Fewer JVMs, less memory overhead
- **Faster Recovery**: Improved failover and recovery times

### Timeline
- **Kafka 3.3.x**: KRaft GA for new clusters
- **Kafka 3.6.x**: Migration tools available
- **Kafka 3.8.x**: ZooKeeper deprecated (current)
- **Kafka 4.0**: ZooKeeper removal planned

## Pre-Migration Checklist

- [ ] Kafka version ≥ 3.6.0
- [ ] Backup all critical data
- [ ] Test migration in staging environment
- [ ] Document current ZooKeeper configuration
- [ ] Plan maintenance window (30-60 minutes)
- [ ] Update monitoring dashboards

## Migration Strategies

### Strategy 1: Rolling Migration (Recommended)

For existing production clusters with zero downtime requirement.

```yaml
# Step 1: Enable dual-write mode
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: nephio-kafka
  annotations:
    strimzi.io/kraft: "migration"  # Enable migration mode
spec:
  kafka:
    version: 3.8.0
    config:
      # Enable dual metadata writes
      migration.enabled: true
      metadata.log.dir: "/var/kafka-metadata"
```

### Strategy 2: Blue-Green Deployment

For clusters that can tolerate brief downtime.

```bash
# 1. Deploy new KRaft cluster
kubectl apply -f examples/kafka/kafka-kraft-config.yaml

# 2. Mirror topics using MirrorMaker 2
kubectl apply -f - <<EOF
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaMirrorMaker2
metadata:
  name: kafka-migration
spec:
  version: 3.8.0
  replicas: 2
  connectCluster: "nephio-kafka-kraft"
  clusters:
  - alias: "source"
    bootstrapServers: nephio-kafka-zk:9092
  - alias: "target"
    bootstrapServers: nephio-kafka-kraft:9092
  mirrors:
  - sourceCluster: "source"
    targetCluster: "target"
    topicsPattern: ".*"
    groupsPattern: ".*"
EOF

# 3. Switch applications to new cluster
# 4. Decommission old cluster
```

## Step-by-Step Migration

### Phase 1: Preparation

```bash
# 1. Check current Kafka version
kubectl exec -n kafka nephio-kafka-0 -- \
  kafka-broker-api-versions.sh --version

# 2. List all topics
kubectl exec -n kafka nephio-kafka-0 -- \
  kafka-topics.sh --list --bootstrap-server localhost:9092

# 3. Export topic configurations
for topic in $(kubectl exec -n kafka nephio-kafka-0 -- \
  kafka-topics.sh --list --bootstrap-server localhost:9092); do
  kubectl exec -n kafka nephio-kafka-0 -- \
    kafka-configs.sh --describe --topic $topic \
    --bootstrap-server localhost:9092 > $topic.config
done

# 4. Export consumer group offsets
kubectl exec -n kafka nephio-kafka-0 -- \
  kafka-consumer-groups.sh --all-groups --describe \
  --bootstrap-server localhost:9092 > consumer-groups.txt
```

### Phase 2: Deploy KRaft Cluster

```bash
# Apply KRaft configuration
kubectl apply -f examples/kafka/kafka-kraft-config.yaml

# Wait for cluster to be ready
kubectl wait --for=condition=Ready \
  kafka/nephio-kafka-kraft -n kafka --timeout=600s

# Verify KRaft mode
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-metadata.sh --snapshot /var/kafka-metadata/__cluster_metadata-0/00000000000000000000.log
```

### Phase 3: Data Migration

```yaml
# Deploy MirrorMaker 2 for data replication
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaMirrorMaker2
metadata:
  name: zk-to-kraft-migration
  namespace: kafka
spec:
  version: 3.8.0
  replicas: 3
  connectCluster: "target"
  clusters:
  - alias: "source"
    bootstrapServers: nephio-kafka-zk:9092
    config:
      config.storage.replication.factor: 3
      offset.storage.replication.factor: 3
      status.storage.replication.factor: 3
  - alias: "target"
    bootstrapServers: nephio-kafka-kraft:9092
    config:
      config.storage.replication.factor: 3
      offset.storage.replication.factor: 3
      status.storage.replication.factor: 3
  mirrors:
  - sourceCluster: "source"
    targetCluster: "target"
    sourceConnector:
      config:
        replication.factor: 3
        offset-syncs.topic.replication.factor: 3
        sync.topic.acls.enabled: true
        refresh.topics.interval.seconds: 60
    checkpointConnector:
      config:
        checkpoints.topic.replication.factor: 3
        sync.group.offsets.enabled: true
        emit.checkpoints.interval.seconds: 60
    topicsPattern: ".*"
    groupsPattern: ".*"
```

### Phase 4: Application Migration

```yaml
# Update application configurations
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: oran
data:
  kafka.properties: |
    # Old ZooKeeper-based config
    # bootstrap.servers=nephio-kafka-zk:9092
    
    # New KRaft-based config
    bootstrap.servers=nephio-kafka-kraft:9092
    
    # Consumer settings
    group.id=oran-consumer-group
    enable.auto.commit=true
    auto.offset.reset=earliest
    
    # Producer settings
    acks=all
    retries=3
    max.in.flight.requests.per.connection=5
    enable.idempotence=true
```

### Phase 5: Validation

```bash
# 1. Verify topic replication
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-topics.sh --list --bootstrap-server localhost:9092

# 2. Check consumer group offsets
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-consumer-groups.sh --all-groups --describe \
  --bootstrap-server localhost:9092

# 3. Run producer test
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-producer-perf-test.sh \
  --topic test-topic \
  --num-records 10000 \
  --record-size 1024 \
  --throughput 1000 \
  --producer-props bootstrap.servers=localhost:9092

# 4. Run consumer test
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-consumer-perf-test.sh \
  --topic test-topic \
  --messages 10000 \
  --bootstrap-server localhost:9092
```

### Phase 6: Cleanup

```bash
# After validation, remove old ZooKeeper cluster
kubectl delete kafka nephio-kafka-zk -n kafka

# Remove MirrorMaker 2
kubectl delete kafkamirrormaker2 zk-to-kraft-migration -n kafka

# Clean up old PVCs
kubectl delete pvc -l app=nephio-kafka-zk -n kafka
```

## Configuration Comparison

### ZooKeeper Mode (Legacy)
```yaml
spec:
  kafka:
    config:
      zookeeper.connect: "zookeeper:2181"
      zookeeper.session.timeout.ms: 18000
      zookeeper.connection.timeout.ms: 18000
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 10Gi
```

### KRaft Mode (Current)
```yaml
spec:
  kafka:
    config:
      process.roles: "broker,controller"
      node.id: "${KAFKA_NODE_ID}"
      controller.quorum.voters: "1@kafka-0:9093,2@kafka-1:9093,3@kafka-2:9093"
      # No zookeeper.connect required!
```

## Monitoring Updates

### Prometheus Metrics

Update your Prometheus scrape configs:

```yaml
- job_name: 'kafka-kraft'
  static_configs:
  - targets:
    - nephio-kafka-kraft-0:9404
    - nephio-kafka-kraft-1:9404
    - nephio-kafka-kraft-2:9404
  metric_relabel_configs:
  # Remove ZooKeeper-specific metrics
  - source_labels: [__name__]
    regex: 'kafka_server_zookeeper.*'
    action: drop
```

### Grafana Dashboards

Import updated dashboards for KRaft monitoring:
- Controller metrics
- Metadata log metrics
- Quorum health metrics

## Rollback Plan

If issues occur during migration:

```bash
# 1. Stop application traffic to new cluster
kubectl scale deployment oran-apps --replicas=0 -n oran

# 2. Restore traffic to old cluster
kubectl patch configmap app-config -n oran \
  --patch '{"data":{"bootstrap.servers":"nephio-kafka-zk:9092"}}'

# 3. Scale applications back up
kubectl scale deployment oran-apps --replicas=3 -n oran

# 4. Investigate and fix issues before retry
```

## Troubleshooting

### Common Issues

1. **Controller election failures**
```bash
# Check controller status
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-metadata.sh --snapshot /var/kafka-metadata/__cluster_metadata-0/latest.log
```

2. **Metadata sync issues**
```bash
# Force metadata refresh
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-metadata.sh --update
```

3. **Consumer group offset mismatch**
```bash
# Reset consumer group offset
kubectl exec -n kafka nephio-kafka-kraft-0 -- \
  kafka-consumer-groups.sh --reset-offsets \
  --group oran-consumer-group \
  --topic oran-telemetry \
  --to-earliest --execute \
  --bootstrap-server localhost:9092
```

## Performance Tuning

### KRaft-Specific Optimizations

```yaml
config:
  # Controller settings
  controller.quorum.election.timeout.ms: 1000
  controller.quorum.fetch.timeout.ms: 2000
  controller.quorum.election.backoff.max.ms: 1000
  
  # Metadata log settings
  metadata.log.segment.bytes: 1073741824
  metadata.log.segment.ms: 604800000
  metadata.max.retention.bytes: 1073741824
  
  # Performance tuning
  num.replica.fetchers: 4
  replica.lag.time.max.ms: 30000
  controller.socket.timeout.ms: 30000
```

## References

- [Apache Kafka KRaft Documentation](https://kafka.apache.org/documentation/#kraft)
- [Strimzi Kafka Operator Guide](https://strimzi.io/docs/operators/latest/overview.html)
- [Kafka 3.8.0 Release Notes](https://kafka.apache.org/downloads#3.8.0)
- [KRaft Migration Tool](https://cwiki.apache.org/confluence/display/KAFKA/KRaft+Migration)

---

**Support**: For Nephio-O-RAN specific Kafka issues, consult the [COMPATIBILITY_MATRIX.md](../COMPATIBILITY_MATRIX.md)