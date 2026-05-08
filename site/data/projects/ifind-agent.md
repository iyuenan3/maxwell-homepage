---
slug: ifind-agent
title: ifind-agent
status: archived
since: 2026-05-06
links:
  url: ""
  source: private
  docs: ""
commands:
  - readme
  - links
  - decisions
  - notes
wiki_slug: yuan-MBP-ifind-agent
stack:
  - openclaw
  - mcp
  - duckdb
  - chromadb
---

## README

A 股六维评分系统（已归档前身，被 [[claude-financial-research]] 取代）。815 只标的池 × 六维度评分（财务 / 估值 / 机构 / 技术 / 行业 / 风险）；OpenClaw 三 Agent 协同（main / yuan-asst / xiao-asst）+ 三 cron 主动汇报；DuckDB 12 表 + ChromaDB 1,622 向量 + 13 MCP 工具。

**5/6 整体推翻**。看到 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services) 后改用官方 Skill + Template 体系（→ [[claude-financial-research]]）。推翻原因：HTTP API 数据可信度不足、自动评分输出 buy/hold/sell 触合规边界、SDK 账号锁定、815 只行业标签缺失、三 Agent 架构对老板而言太重。

## NOTES

（待补 — 当时为什么这么设计；推翻一个还在跑的系统是什么决心；新方案为什么不用 DuckDB/ChromaDB 而改纯 CSV；评分模型回不来的根本原因——合规 > 技术成熟）
