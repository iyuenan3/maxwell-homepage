---
slug: claude-financial-research
name_en: "Claude Financial Research · A-Share Equity Atlas"
name_zh: "智投研 · A 股权益研究系统"
status: active
since: 2026-05-06
links:
  url: ""
  source: private
  docs: https://github.com/anthropics/financial-services
commands:
  - readme
  - links
  - decisions
  - history
  - stats
  - notes
wiki_slug: yuan-MBP-a股200亿投研
stack:
  - claude code
  - csv
  - pdf
  - python
---

## README

A 股市值 200 亿+ 权益基本面研究系统（外部顾问项目）。基于 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services)（6 Skill + 10 Template）落地的纪律性投研工作流。

**1,095 只**标的池（A 股市值 ≥ 200 亿，清洗 ST 后），每月初快照固定。数据源严格限定为：iFinD 导出 CSV + 财报 PDF + 公告 PDF，不采信网络新闻 / 市场传闻 / 自动评分。每个标的 8 件套扁平 CSV（静态资料 / 估值时序 / 行情时序 / 财报时序 / 衍生指标 / 公告链接 / 股东结构 / 同业对比）。

报告输出严守**七模块固定结构**：主营业务 / 财务趋势 / 资产负债 / 估值分位 / 同业对比 / 核心优势 / 潜在风险。**严守"不输出投资建议"合规边界**——不写买入 / 卖出 / 加仓 / 减仓 / 目标价。截至 5/7 已产出 50+ 份首次覆盖 v2 + 20+ 份 v1 七模块分析 + 16 份板块概览 + Top50 精选组合 + AI 算力链专题深度。5/7 起新增 Next.js 选股器网页，把 Markdown 报告外的"看图筛选"工作流补上。

## HISTORY

**前身：ifind-agent · A 股六维评分系统**（5/5 启动 → 5/6 整体推翻）。

OpenClaw 三 Agent 协同（main / yuan-asst / xiao-asst）+ 三 cron 主动汇报；815 只标的 × 六维度评分（财务 / 估值 / 机构 / 技术 / 行业 / 风险）；DuckDB 12 表 + ChromaDB 1,622 向量 + 13 MCP 工具。

**5/6 整体推翻 5 大原因**：HTTP API 数据可信度不足、自动评分输出 buy/hold/sell 触合规边界、SDK 账号锁定、815 只行业标签缺失、三 Agent 架构对老板而言太重。看到 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services) 后，决定改用官方 Skill + Template 体系，转向"人 + Claude 协作纪律性投研" — 合规优先于技术成熟度。

## NOTES

（待补 — 为什么从"自动化数据流水线 + 评分模型"切换到"人 + Claude 协作纪律性投研"；合规边界比技术成熟度更重要；扁平 CSV 而非数据库的反直觉选择；客户的真实需求是一份高质量报告而非对话系统）
