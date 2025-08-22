---
title: API Reference Overview
description: Complete API documentation for Nephio O-RAN Claude Agents
sidebar_position: 1
tags: ["api", "reference", "documentation"]
---

# API Reference Overview

Welcome to the comprehensive API documentation for Nephio O-RAN Claude Agents. This reference provides detailed information about all available APIs, including REST endpoints, gRPC services, event systems, and data schemas.

## API Categories

### 🌐 REST API

RESTful HTTP endpoints for managing agents and operations.

- **Base URL**: `https://api.nephio-oran.example.com/v1`
- **Authentication**: Bearer token / OAuth 2.0
- **Format**: JSON
- **Rate Limiting**: 1000 requests/minute

[Explore REST API →](#rest-api-details)

### ⚡ gRPC API

High-performance gRPC services for real-time operations.

- **Protocol**: HTTP/2
- **Encoding**: Protocol Buffers
- **Streaming**: Bidirectional streaming supported
- **Load Balancing**: Client-side load balancing

[Explore gRPC API →](#grpc-api-details)

### 📢 Event System

Event-driven architecture for asynchronous operations.

- **Event Bus**: Kubernetes Events / CloudEvents
- **Format**: CloudEvents 1.0
- **Delivery**: At-least-once guarantee
- **Ordering**: Partition-based ordering

[Explore Events →](#event-system-details)

### 📋 Data Schemas

Comprehensive data models and validation schemas.

- **Format**: JSON Schema / OpenAPI 3.0
- **Validation**: Strict schema validation
- **Versioning**: Semantic versioning
- **Evolution**: Backward compatibility guaranteed

[Explore Schemas →](#data-schemas-details)

## Quick Start

### Authentication

All API requests require authentication. Obtain an API token:

```bash
kubectl create token nephio-agent -n nephio-system
```

### Example Request

```bash
curl -X GET \
  https://api.nephio-oran.example.com/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Example Response

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

## API Versioning

We follow semantic versioning for our APIs:

- **v1**: Current stable version
- **v2-beta**: Next version in beta
- **Deprecation Policy**: 6 months notice before removal
- **Backward Compatibility**: Maintained within major versions

## Rate Limiting

API rate limits are enforced per client:

| Tier | Requests/Minute | Burst |
|------|----------------|-------|
| Free | 100 | 200 |
| Standard | 1000 | 2000 |
| Enterprise | 10000 | 20000 |

Rate limit headers:

- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Error Handling

Standard error response format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Agent with ID 'xyz' not found",
    "details": {
      "id": "xyz",
      "type": "agent"
    },
    "timestamp": "2025-08-22T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

Common error codes:

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## SDKs and Libraries

Official SDKs available:

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

## API Playground

Try our APIs directly in the browser:

<iframe src="/api-playground" width="100%" height="600px" />

## OpenAPI Specification

Download the complete OpenAPI specification:

- [OpenAPI 3.0 Spec (YAML)](/api/openapi.yaml)
- [OpenAPI 3.0 Spec (JSON)](/api/openapi.json)
- [Postman Collection](/api/postman-collection.json)

## GraphQL API (Coming Soon)

We're developing a GraphQL API for more flexible querying:

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

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('wss://api.nephio-oran.example.com/v1/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent update:', data);
};
```

## Webhooks

Configure webhooks for event notifications:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["agent.created", "agent.updated", "agent.deleted"],
  "secret": "webhook-secret"
}
```

## API Status

Check API status and health:

- **Status Page**: [status.nephio-oran.example.com](https://status.nephio-oran.example.com)
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`

## Support

Need help with the APIs?

- 📧 **Email**: api-support@nephio-oran.org
- 💬 **Slack**: [#api-support](https://nephio-oran.slack.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/nephio-oran/claude-agents/issues)
- 📚 **Forum**: [Community Forum](https://forum.nephio-oran.org)

## Changelog

### v1.0.0 (2025-08-22)

- Initial API release
- REST and gRPC endpoints
- Event system implementation
- Complete documentation

[View Full Changelog →](#changelog)
