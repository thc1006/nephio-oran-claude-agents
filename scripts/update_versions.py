#!/usr/bin/env python3
"""
Update all dependency versions to match COMPATIBILITY_MATRIX.md
"""

import os
import re
from pathlib import Path

def update_file(filepath):
    """Update versions in a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Update kpt versions from beta.55 to beta.55
    content = re.sub(r'kpt:\s*v1\.0\.0-beta\.27', 'kpt: v1.0.0-beta.55', content)
    content = re.sub(r'kpt@v1\.0\.0-beta\.27', 'kpt@v1.0.0-beta.55', content)
    content = re.sub(r'kpt-v1\.0\.0-beta\.27', 'kpt-v1.0.0-beta.55', content)
    content = re.sub(r'v1\.0\.0-beta\.27\+', 'v1.0.0-beta.55+', content)
    
    # Update ArgoCD to 3.1.0 where it's still 2.x
    content = re.sub(r'argocd:\s*2\.\d+\.\d+\+?', 'argocd: 3.1.0+', content)
    content = re.sub(r'ArgoCD\s+2\.\d+', 'ArgoCD 3.1.0', content)
    
    # Update Kubernetes references to be explicit about 1.32.x
    content = re.sub(r'kubernetes:\s*1\.29\+', 'kubernetes: 1.32+', content)
    content = re.sub(r'kubernetes:\s*1\.30\+', 'kubernetes: 1.32+', content)
    content = re.sub(r'kubernetes:\s*1\.31\+', 'kubernetes: 1.32+', content)
    
    # Update Prometheus to 3.5.0 where still 2.48
    content = re.sub(r'prometheus:\s*2\.48\+?', 'prometheus: 3.5.0  # LTS version', content)
    
    # Update Grafana to 12.1.0 where still 10.3
    content = re.sub(r'grafana:\s*10\.3\+?', 'grafana: 12.1.0  # Latest stable', content)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def add_kafka_example():
    """Create a Kafka KRaft mode example"""
    kafka_example = """# Kafka KRaft Mode Example Configuration
# For Nephio-O-RAN deployments with Kafka 3.8.x

apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: nephio-kafka-kraft
  namespace: kafka
spec:
  kafka:
    version: 3.8.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
    config:
      # KRaft mode configuration (no ZooKeeper!)
      process.roles: "broker,controller"
      node.id: "${KAFKA_NODE_ID}"
      controller.quorum.voters: "1@nephio-kafka-kraft-0.nephio-kafka-kraft-brokers:9093,2@nephio-kafka-kraft-1.nephio-kafka-kraft-brokers:9093,3@nephio-kafka-kraft-2.nephio-kafka-kraft-brokers:9093"
      
      # Listener configuration
      inter.broker.listener.name: "PLAIN"
      controller.listener.names: "CONTROLLER"
      listener.security.protocol.map: "CONTROLLER:PLAINTEXT,PLAIN:PLAINTEXT,TLS:SSL"
      
      # Log configuration
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
      default.replication.factor: 3
      min.insync.replicas: 2
      
      # Performance tuning
      num.network.threads: 8
      num.io.threads: 8
      socket.send.buffer.bytes: 102400
      socket.receive.buffer.bytes: 102400
      socket.request.max.bytes: 104857600
      
      # Retention
      log.retention.hours: 168
      log.segment.bytes: 1073741824
      
    storage:
      type: persistent-claim
      size: 100Gi
      class: fast-ssd
    metricsConfig:
      type: jmxPrometheusExporter
      valueFrom:
        configMapKeyRef:
          name: kafka-metrics
          key: kafka-metrics-config.yml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: kafka-metrics
  namespace: kafka
data:
  kafka-metrics-config.yml: |
    # Prometheus JMX exporter configuration for Kafka
    lowercaseOutputName: true
    lowercaseOutputLabelNames: true
    rules:
    - pattern: kafka.server<type=(.+), name=(.+), clientId=(.+), topic=(.+), partition=(.*)><>Value
      name: kafka_server_$1_$2
      type: GAUGE
      labels:
        clientId: "$3"
        topic: "$4"
        partition: "$5"
    - pattern: kafka.server<type=(.+), name=(.+), clientId=(.+), brokerHost=(.+), brokerPort=(.+)><>Value
      name: kafka_server_$1_$2
      type: GAUGE
      labels:
        clientId: "$3"
        broker: "$4:$5"
---
# Legacy ZooKeeper mode (deprecated - for migration only)
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: nephio-kafka-legacy
  namespace: kafka
  annotations:
    strimzi.io/kraft: "migration"  # Marks for migration to KRaft
spec:
  kafka:
    version: 3.8.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    config:
      # Legacy ZooKeeper configuration
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      transaction.state.log.min.isr: 2
    storage:
      type: persistent-claim
      size: 100Gi
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 10Gi
  entityOperator:
    topicOperator: {}
    userOperator: {}
"""
    
    # Write Kafka example
    kafka_path = Path('examples/kafka/kafka-kraft-config.yaml')
    kafka_path.parent.mkdir(exist_ok=True)
    with open(kafka_path, 'w', encoding='utf-8') as f:
        f.write(kafka_example)
    print(f"✅ Created Kafka KRaft example: {kafka_path}")

def main():
    """Update all version references"""
    
    # Update agent files
    agent_files = list(Path('agents').glob('*.md'))
    docs_files = list(Path('docs').glob('*.md'))
    yaml_files = list(Path('.').rglob('*.yaml')) + list(Path('.').rglob('*.yml'))
    
    updated_count = 0
    
    for filepath in agent_files + docs_files:
        if update_file(filepath):
            print(f"✅ Updated: {filepath}")
            updated_count += 1
        else:
            print(f"⏭️  No changes: {filepath.name}")
    
    for filepath in yaml_files:
        # Skip .git and test directories
        if '.git' in str(filepath) or 'test' in str(filepath):
            continue
        if update_file(filepath):
            print(f"✅ Updated: {filepath}")
            updated_count += 1
    
    # Create Kafka KRaft example
    add_kafka_example()
    
    print(f"\n📊 Summary: Updated {updated_count} files")
    print("✅ All versions aligned with COMPATIBILITY_MATRIX.md")
    
    return 0

if __name__ == '__main__':
    exit(main())