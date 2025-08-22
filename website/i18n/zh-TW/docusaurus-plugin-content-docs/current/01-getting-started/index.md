---
title: '快速上手'
description: '開始使用 Nephio O-RAN Claude Agents 所需的完整知識'
sidebar_position: 1
tags: ['快速上手', '介紹', '設置', '入門']
---

# Nephio O-RAN Claude Agents 快速上手

歡迎來到 Nephio O-RAN Claude Agents 的世界！這份完整指南將協助您開始部署和管理基於 Nephio 和 Claude AI 的 O-RAN 網路功能智慧代理。

## 系統概觀

Nephio O-RAN Claude Agents 為開放無線接取網路 (O-RAN) 部署提供智慧自動化和編排功能。這些代理程式運用 Claude AI 技術，針對 O-RAN 元件的部署、設定和管理做出智慧決策。

## 學習內容

在這個章節中，您將會了解：

- **前置需求**: 開始之前需要準備的環境和工具
- **安裝**: 完整的安裝步驟說明  
- **快速入門**: 幾分鐘內啟動您的第一個代理程式
- **基本設定**: 重要的設定選項和參數
- **驗證確認**: 如何確認系統正常運作

## 核心功能

我們的 Claude 代理程式提供：

- 🤖 **智慧編排**: 由 AI 驅動的部署決策引擎
- 🔧 **自動化設定**: 智慧型的設定管理機制
- 📊 **即時監控**: 全方位的系統可觀測性
- 🛡️ **安全合規**: 內建的安全最佳實務
- 🚀 **效能優化**: 持續的效能調校機制

## 快速導覽

### 必要的第一步

1. **[快速入門指南](/zh-TW/docs/guides/quickstart)** - 30 分鐘內完成部署
2. **[架構概觀](/zh-TW/docs/architecture/)** - 了解系統設計理念
3. **[代理程式設定](/zh-TW/docs/agents/)** - 認識可用的代理程式

### 核心概念

- **[O-RAN 整合](../02-concepts/)** - 代理程式如何與 O-RAN 協作
- **[Nephio 整合](../integration/index.md)** - Nephio 專屬功能
- **[AI 決策機制](../02-concepts/)** - Claude AI 如何驅動代理程式

### 常見任務

- **[部署網路功能](/zh-TW/docs/agents/orchestrator/nephio-oran-orchestrator-agent)**
- **[設定監控機制](/zh-TW/docs/agents/monitoring/monitoring-analytics-agent)**
- **[設定基礎建設](/zh-TW/docs/agents/infrastructure/nephio-infrastructure-agent)**

## 前置需求

開始之前，請確認您已準備：

### 軟體需求

- **Kubernetes 叢集** (v1.25+) 並具有管理員權限
- **Nephio R5** (v5.0.0+) 已完成安裝與設定
- **kubectl** 已設定可存取您的叢集
- **KPT** (v1.0.0-beta.55+) 用於套件管理
- **Go** (1.24.6+) 用於建置客製化元件

### 硬體資源需求

- **最低需求**: 每個節點 4 個 CPU 核心、8GB 記憶體
- **建議配置**: 每個節點 8 個 CPU 核心、16GB 記憶體
- **儲存空間**: 50GB 可用空間供代理程式資料使用
- **網路環境**: 完整的 O-RAN 網路設定

## 安裝方式

請選擇最適合您環境的安裝方法：

### 方法 1: 快速安裝 (推薦)

```bash
git clone https://github.com/thc1006/nephio-oran-claude-agents.git
cd nephio-oran-claude-agents
make install && make deploy
```

### 方法 2: 逐步安裝

請參考詳細的 [快速入門指南](../guides/quickstart.md) 進行完整的操作說明。

### 方法 3: 客製化安裝

進階使用者請參考 [API 參考文件](../04-api-reference/index.md) 了解詳細的設定選項。

## 下一步

當您確認前置需求都已準備完成後：

1. **開始行動**: [快速入門指南](/zh-TW/docs/guides/quickstart) - 30 分鐘完成全部設定
2. **學習概念**: [架構概觀](/zh-TW/docs/architecture/) - 深入了解系統架構
3. **探索代理**: [代理程式文件](/zh-TW/docs/agents/) - 發現所有可用的代理程式
4. **設定安全**: [測試驗證代理](/zh-TW/docs/agents/testing/oran-nephio-dep-doctor-agent) - 保護您的部署環境

## 取得協助

需要任何協助嗎？我們很樂意為您提供支援：

- **技術文件**: 瀏覽我們的完整指南文件
- **疑難排解**: 查看 [疑難排解指南](/zh-TW/docs/07-troubleshooting/)
- **社群討論**: 加入 [GitHub Discussions](https://github.com/thc1006/nephio-oran-claude-agents/discussions)
- **問題回報**: 在 [GitHub Issues](https://github.com/thc1006/nephio-oran-claude-agents/issues) 回報錯誤

## 準備好了嗎？

準備開始您的 Claude 代理程式之旅了嗎？從我們的 [快速入門指南](../guides/quickstart.md) 開始，30 分鐘內就能啟動您的第一個 Claude 代理程式！

---

*最後更新: 2025年8月*