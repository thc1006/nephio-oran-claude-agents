---
title: '入門指南'
description: '開始使用 Nephio O-RAN Claude Agents 所需的一切知識'
sidebar_position: 1
tags: ['getting-started', 'introduction', 'setup', 'quickstart']
---

# Nephio O-RAN Claude Agents 入門指南

歡迎使用 Nephio O-RAN Claude Agents！這份全面的指南將幫助您開始使用 Nephio 和 Claude AI 來部署和管理 O-RAN 網路功能的智慧代理程式。

## 概述

Nephio O-RAN Claude Agents 為開放無線存取網路 (O-RAN) 部署提供智慧自動化和編排功能。這些代理程式利用 Claude AI 對 O-RAN 元件的部署、配置和管理做出智慧決策。

## 您將學到什麼

在本節中，您將了解到：

- **先決條件**：開始之前需要準備什麼
- **安裝**：逐步設定說明
- **快速入門**：在幾分鐘內啟動您的第一個代理程式
- **基本配置**：基本設定和選項
- **驗證**：如何確認一切正常運作

## 主要功能

我們的 Claude 代理程式提供：

- 🤖 **智慧編排**：AI 驅動的部署決策
- 🔧 **自動化配置**：智慧配置管理
- 📊 **即時監控**：全面的可觀測性
- 🛡️ **安全合規**：內建安全最佳實踐
- 🚀 **效能最佳化**：持續效能調整

## 快速導航

### 重要的第一步

1. **[快速入門指南](../guides/quickstart.md)** - 30 分鐘內啟動並執行
2. **[架構概述](../architecture/index.md)** - 了解系統設計
3. **[代理程式配置](../agents/index.md)** - 了解可用的代理程式

### 核心概念

- **[O-RAN 整合](../02-concepts/)** - 代理程式如何與 O-RAN 協作
- **[Nephio 整合](../integration/index.md)** - Nephio 特定功能
- **[AI 決策制定](../02-concepts/)** - Claude AI 如何驅動代理程式

### 常見任務

- **[部署網路功能](../network-functions/oran-network-functions-agent.md)**
- **[配置監控](../monitoring/monitoring-analytics-agent.md)**
- **[設定安全性](../security/security-compliance-agent.md)**

## 先決條件

開始之前，請確保您有：

### 軟體要求

- **Kubernetes 叢集** (v1.25+) 並具有管理員存取權限
- **Nephio R5** (v5.0.0+) 已安裝並配置
- **kubectl** 已配置以存取您的叢集
- **KPT** (v1.0.0-beta.55+) 用於套件管理
- **Go** (1.24.6+) 用於建置自訂元件

### 資源要求

- **最低要求**：每個節點 4 個 CPU 核心、8GB RAM
- **建議配置**：每個節點 8 個 CPU 核心、16GB RAM
- **儲存空間**：50GB 可用儲存空間用於代理程式資料
- **網路**：適當的 O-RAN 網路配置

## 安裝選項

選擇最適合您環境的安裝方法：

### 選項 1：快速安裝（推薦）

```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents
make install && make deploy
```

### 選項 2：逐步安裝

遵循詳細的[快速入門指南](../guides/quickstart.md)進行全面的設定說明。

### 選項 3：自訂安裝

對於進階使用者，請參閱 [API 參考](../04-api-reference/index.md) 以獲得詳細的配置選項。

## 下一步

一旦您查看了先決條件：

1. **從這裡開始**：[快速入門指南](../guides/quickstart.md) - 30 分鐘內完成設定
2. **學習概念**：[架構概述](../architecture/index.md) - 了解系統
3. **探索代理程式**：[代理程式文件](../agents/index.md) - 發現可用的代理程式
4. **配置安全性**：[安全指南](../security/security-compliance-agent.md) - 保護您的部署

## 獲得協助

需要協助嗎？我們在這裡為您提供支援：

- **文件**：瀏覽我們的全面指南
- **疑難排解**：查看[疑難排解指南](../07-troubleshooting/index.md)
- **社群**：加入 [GitHub 討論](https://github.com/thc1006/nephio-oran-claude-agents/discussions)
- **問題回報**：在 [GitHub Issues](https://github.com/thc1006/nephio-oran-claude-agents/issues) 上回報錯誤

## 接下來呢？

準備好開始了嗎？從我們的[快速入門指南](../guides/quickstart.md)開始，在 30 分鐘內運行您的第一個 Claude 代理程式！

---

*最後更新：2025年8月*