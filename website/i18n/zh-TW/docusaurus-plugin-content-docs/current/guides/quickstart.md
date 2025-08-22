---
title: '快速開始指南'
description: '幾分鐘內開始使用 Nephio O-RAN Claude 代理'
sidebar_position: 1
tags: ['quickstart', 'getting-started', 'installation', 'deployment']
last_updated: '2025-08-20'
---

# 快速開始指南

只需幾分鐘即可開始使用 Nephio O-RAN Claude 代理！本指南將引導您完成在 O-RAN 環境中部署和開始使用 Claude 代理的基本步驟。

## 先決條件

開始之前，請確保您具備以下條件：

### 必需軟體

- **Kubernetes 叢集** (v1.25+)
- **kubectl** 已配置並連接到您的叢集
- **Nephio R5** (v5.0.0) 已安裝
- **KPT** (v1.0.0-beta.55+)
- **Go** (1.24.6+)
- **Git** 用於克隆儲存庫

### 資源需求

- **CPU**：每個節點最少 4 核心
- **記憶體**：每個節點最少 8GB RAM
- **儲存**：50GB 可用儲存空間
- **網路**：為 O-RAN 工作負載配置的叢集網路

## 步驟 1：克隆儲存庫

```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents
```

## 步驟 2：驗證先決條件

執行內建的驗證腳本以確保您的環境已準備就緒：

```bash
./scripts/verify_versions.sh
```

此腳本檢查：

- Kubernetes 版本相容性
- Nephio 安裝狀態
- KPT 版本
- 必需工具可用性

## 步驟 3：配置環境

### 設定環境變數

```bash
export NEPHIO_NAMESPACE="nephio-system"
export AGENTS_NAMESPACE="nephio-agents"
export ORAN_ENVIRONMENT="development"  # 或 "production"
```

### 檢查配置

檢查並自定義代理配置：

```bash
cat config/agent_config.yaml
```

主要配置選項：

- 代理日誌記錄層級
- 資源限制和請求
- 安全策略
- 監控端點

## 步驟 4：部署代理

### 使用 Make 部署

```bash
# 安裝相依性並部署所有代理
make install
make deploy

# 或在一個步驟中完成兩者
make all
```

## 部署個別類別

### 部署個別類別（可選）

如果您偏好部署特定代理類別：

```bash
# 僅部署編排代理
make deploy-orchestration

# 僅部署基礎架構代理
make deploy-infrastructure

# 僅部署監控代理
make deploy-monitoring
```

## 步驟 5：驗證部署

### 檢查代理 Pods

```bash
kubectl get pods -n nephio-agents
```

預期輸出：

```
NAME                                    READY   STATUS    RESTARTS   AGE
orchestrator-agent-7b8c9d5f4-xyz12     1/1     Running   0          2m
infrastructure-agent-9f2a1c6e8-abc34   1/1     Running   0          2m
monitoring-agent-4e7b3f1d2-def56       1/1     Running   0          2m
...
```

### 檢查代理服務

```bash
kubectl get services -n nephio-agents
```

### 驗證代理健康狀態

```bash
# 使用監控端點檢查代理狀態
kubectl port-forward -n nephio-agents svc/orchestrator-agent 8080:8080 &
curl http://localhost:8080/health
```

## 步驟 6：執行您的第一個工作流程

### 部署範例 O-RAN 功能

```bash
# 應用範例 O-RAN 工作負載
kubectl apply -f examples/oran-cu-deployment.yaml

# 觀察編排代理處理部署
kubectl logs -f -n nephio-agents deployment/orchestrator-agent
```

## 監控部署

### 監控部署

```bash
# 檢查部署狀態
kubectl get deployments -n oran-workloads

# 查看代理活動
kubectl logs -n nephio-agents -l app=claude-agent --tail=50
```

## 步驟 7：存取 Web 介面（可選）

如果您已啟用監控堆疊：

```bash
# 轉發 Grafana 端口
kubectl port-forward -n nephio-agents svc/grafana 3000:3000

# 在 http://localhost:3000 存取 Grafana
# 預設憑證：admin/admin
```

## 常用指令

### 代理管理

```bash
# 重新啟動所有代理
kubectl rollout restart deployment -n nephio-agents

# 擴展代理
kubectl scale deployment orchestrator-agent --replicas=2 -n nephio-agents

# 查看代理日誌
kubectl logs -n nephio-agents deployment/orchestrator-agent -f
```

## 故障排除

### 故障排除

```bash
# 檢查代理事件
kubectl get events -n nephio-agents --sort-by='.lastTimestamp'

# 除錯代理配置
kubectl describe configmap agent-config -n nephio-agents

# 執行診斷
make test-agents
```

## 下一步

現在您已經執行了 Claude 代理，探索這些主題：

### 了解更多

- [代理架構概述](/docs/guides/architecture)
- [配置管理](/docs/guides/configuration)
- [監控和可觀察性](/docs/guides/monitoring)

### 部署附加元件

- [安全與合規性設定](/docs/security-compliance/security-compliance-agent)
- [進階監控](/docs/monitoring-analytics/monitoring-analytics-agent)
- [網路功能管理](/docs/network-functions/oran-network-functions-agent)

### 營運任務

- [升級代理](/docs/guides/upgrade)
- [備份與還原](/docs/guides/backup)
- [性能調整](/docs/guides/performance)

## 獲得協助

如果遇到問題：

1. **檢查日誌**：`kubectl logs -n nephio-agents deployment/orchestrator-agent`
2. **檢查故障排除指南**：[故障排除](/docs/guides/troubleshooting)
3. **執行診斷**：`make diagnose`
4. **檢查相容性**：檢查[相容性對照表](
   https://github.com/thc1006/nephio-oran-claude-agents/blob/main/COMPATIBILITY_MATRIX.md)
5. **社群支援**：加入 [Nephio 社群](https://github.com/nephio-project)

## 清理

要移除所有代理和資源：

```bash
make clean
```

這將移除所有代理部署、服務和配置，同時保留您的 O-RAN 工作負載。

---

**恭喜！** 您現在已在您的環境中執行 Nephio O-RAN Claude 代理。代理已準備好智慧地協助編排和管理您的 O-RAN 部署。