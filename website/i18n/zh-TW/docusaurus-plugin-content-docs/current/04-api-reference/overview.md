---
title: API 參考文件概述
description: Nephio O-RAN Claude Agents 的完整 API 文件
sidebar_position: 1
tags: ["api", "reference", "documentation"]
---

# API 參考文件概述

歡迎使用 Nephio O-RAN Claude Agents 的完整 API 文件。本參考文件提供所有可用 API 的詳細資訊，包括 REST 端點、gRPC 服務、事件系統和資料結構說明。

## API 類別

### 🌐 REST API
用於管理代理程式和操作的 RESTful HTTP 端點。

- **基礎 URL**: `https://api.nephio-oran.example.com/v1`
- **驗證方式**: Bearer token / OAuth 2.0
- **格式**: JSON
- **速率限制**: 每分鐘 1000 次請求

[探索 REST API →](#rest-api-details)

### ⚡ gRPC API
用於即時操作的高效能 gRPC 服務。

- **協定**: HTTP/2
- **編碼**: Protocol Buffers
- **串流**: 支援雙向串流
- **負載平衡**: 客戶端負載平衡

[探索 gRPC API →](#grpc-api-details)

### 📢 事件系統
用於非同步操作的事件驱動架構。

- **事件匯流排**: Kubernetes Events / CloudEvents
- **格式**: CloudEvents 1.0
- **傳遞保證**: 至少一次傳遞
- **排序**: 基於分區的排序

[探索事件系統 →](#event-system-details)

### 📋 資料結構
完整的資料模型和驗證結構說明。

- **格式**: JSON Schema / OpenAPI 3.0
- **驗證**: 嚴格的結構驗證
- **版本控制**: 語意版本控制
- **演化**: 保證向後相容性

[探索資料結構 →](#data-schemas-details)

## 快速開始

### 驗證

所有 API 請求都需要驗證。取得 API token：

```bash
kubectl create token nephio-agent -n nephio-system
```

### 範例請求

```bash
curl -X GET \
  https://api.nephio-oran.example.com/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 範例回應

```json
{
  "agents": [
    {
      "id": "orchestrator-001",
      "name": "nephio-oran-orchestrator",
      "status": "running",
      "version": "1.0.0",
      "lastHeartbeat": "2025-08-22T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## API 版本控制

我們的 API 遵循語意版本控制：

- **v1**: 目前穩定版本
- **v2-beta**: 下一版本測試版
- **棄用政策**: 移除前 6 個月通知
- **向後相容性**: 在主要版本內保持相容

## 速率限制

API 速率限制依客戶端執行：

| 層級 | 每分鐘請求數 | 突發流量 |
|------|-------------|---------|
| 免費 | 100 | 200 |
| 標準 | 1000 | 2000 |
| 企業 | 10000 | 20000 |

速率限制標頭：
- `X-RateLimit-Limit`: 最大請求數
- `X-RateLimit-Remaining`: 剩餘請求數
- `X-RateLimit-Reset`: 重設時間戳

## 錯誤處理

標準錯誤回應格式：

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "找不到 ID 為 'xyz' 的代理程式",
    "details": {
      "id": "xyz",
      "type": "agent"
    },
    "timestamp": "2025-08-22T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

常見錯誤代碼：
- `400`: 錯誤的請求
- `401`: 未經授權
- `403`: 禁止存取
- `404`: 找不到資源
- `429`: 請求過於頻繁
- `500`: 伺服器內部錯誤

## SDK 和程式庫

提供官方 SDK：

### Go SDK
```go
import "github.com/nephio-oran/claude-agents-sdk-go"

client := sdk.NewClient("YOUR_TOKEN")
agents, err := client.Agents.List(ctx)
```

### Python SDK
```python
from nephio_oran_sdk import Client

client = Client(token="YOUR_TOKEN")
agents = client.agents.list()
```

### JavaScript/TypeScript SDK
```typescript
import { NephioOranClient } from '@nephio-oran/sdk';

const client = new NephioOranClient({ token: 'YOUR_TOKEN' });
const agents = await client.agents.list();
```

## API 測試環境

直接在瀏覽器中試用我們的 API：

<iframe src="/api-playground" width="100%" height="600px" />

## OpenAPI 規格

下載完整的 OpenAPI 規格：

- [OpenAPI 3.0 規格 (YAML)](/api/openapi.yaml)
- [OpenAPI 3.0 規格 (JSON)](/api/openapi.json)
- [Postman 集合](/api/postman-collection.json)

## GraphQL API (即將推出)

我們正在開發 GraphQL API 以提供更靈活的查詢：

```graphql
query GetAgents {
  agents(status: RUNNING) {
    id
    name
    metrics {
      cpu
      memory
    }
  }
}
```

## WebSocket API

透過 WebSocket 進行即時更新：

```javascript
const ws = new WebSocket('wss://api.nephio-oran.example.com/v1/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('代理程式更新:', data);
};
```

## Webhooks

配置 webhooks 以接收事件通知：

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["agent.created", "agent.updated", "agent.deleted"],
  "secret": "webhook-secret"
}
```

## API 狀態

檢查 API 狀態和健康狀況：

- **狀態頁面**: [status.nephio-oran.example.com](https://status.nephio-oran.example.com)
- **健康檢查**: `GET /health`
- **指標**: `GET /metrics`

## 支援

需要 API 相關協助？

- 📧 **電子郵件**: api-support@nephio-oran.org
- 💬 **Slack**: [#api-support](https://nephio-oran.slack.com)
- 🐛 **問題回報**: [GitHub Issues](https://github.com/nephio-oran/claude-agents/issues)
- 📚 **論壇**: [社群論壇](https://forum.nephio-oran.org)

## 更新日誌

### v1.0.0 (2025-08-22)
- 初始 API 發布
- REST 和 gRPC 端點
- 事件系統實作
- 完整文件

[查看完整更新日誌 →](#changelog)