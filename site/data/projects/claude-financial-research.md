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
  - stack
  - notes
wiki_slug: claude-financial-research
stack:
  - claude-code
  - python
  - next.js
  - fastapi
  - ifind-csv
  - markdown
---

## README

A 股市值 200 亿+ 权益基本面研究系统（外部顾问项目，Maxwell 通过 SSH 远程交付至客户机器）。标的池 1,095 只（月初快照清洗 ST），数据源严格限定为 iFinD 导出 CSV 加财报/公告 PDF，禁止采信网络新闻、市场传闻、自动评分。每个标的 8 件套扁平 CSV，报告输出固定七模块结构（主营业务/财务趋势/资产负债/估值分位/同业对比/核心优势/潜在风险），严守「只做客观拆解，不输出买入/卖出/目标价」合规边界。

健康度评分模型经 9 个版本迭代（v1.7 到 v3.4）：完全一致率从 20.4% 升至 36.7%（+80%），可接受率从 34.7% 升至 79.6%（+129%），系统过激进从 2.0% 归零。Daily Wave 盘后日更自动化于 5/9 启动，A+B 双轮排班（16:00 速判 300-500 字 + 20:00 深读 1500-3000 字），3 个 launchd plist 驱动。5/21 接入 newapi-proxy 中转站，max_tokens 由 12000 升至 32000，LLM 摘要失败率从 34.5% 降至 2.8%。

Cowork 双 session 协作：Yuan-MBP 上并行两个 Claude Code session（Cowork 负责 Wave 评审/项目记忆，Claude Code 负责规则代码/网页/批量报告），通过 `备忘/项目记忆_*.md` 跨会话同步状态，全程 Maxwell SSH 远程操作。

## NOTES

- **合规优先于技术成熟度（5/6 整体推翻）：** 前身 ifind-agent 三 Agent 架构技术完整（DuckDB 12 表/ChromaDB 1622 向量/13 MCP 工具），但自动评分输出 buy/hold/sell 等同投资建议触碰合规红线。看到 Anthropic 官方 financial-services 模板后改走「人 + Claude 协作纪律性投研」，老板要的是高质量报告，不是对话系统。**合规边界比技术成熟度更重要**，这是整个路线重构的第一性原理。

- **扁平 CSV 而非数据库的反直觉选择：** 前身用 DuckDB 12 表，新路线改扁平 CSV。理由：人能直接打开看、Claude Read 工具直接读不需数据库知识、版本管理清晰（每份独立 git diff）、坏一份不影响其他。**适配 LLM 协作场景比工程性能更重要**，这条原则覆盖了所有数据层技术决策。

- **全样本评审铁律（Wave 25 教训）：** Wave 23 曾基于 8 只样本推测一致率 60%，全样本 1095 只复盘真实值 28%，乐观偏差 32 个百分点。从此任何评审必须基于全样本 batch CSV，禁止以小样本推测覆盖。**样本量不足时直觉会系统性乐观**，这是量化评估的核心纪律。
