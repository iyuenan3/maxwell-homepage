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
  - claude code
  - csv
  - pdf
  - python
  - next.js
  - fastapi
---

## README

A 股市值 200 亿+ 权益基本面研究系统（外部顾问项目）。基于 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services)（6 Skill + 10 Template）落地的纪律性投研工作流。

**1,095 只**标的池（A 股市值 ≥ 200 亿，清洗 ST 后），每月初快照固定。数据源严格限定为：iFinD 导出 CSV + 财报 PDF + 公告 PDF，不采信网络新闻 / 市场传闻 / 自动评分。每个标的 8 件套扁平 CSV（静态资料 / 估值时序 / 行情时序 / 财报时序 / 衍生指标 / 公告链接 / 股东结构 / 同业对比）。

报告输出严守**七模块固定结构**：主营业务 / 财务趋势 / 资产负债 / 估值分位 / 同业对比 / 核心优势 / 潜在风险。**严守"不输出投资建议"合规边界**——不写买入 / 卖出 / 加仓 / 减仓 / 目标价。截至 5/7 已产出 50+ 份首次覆盖 v2 + 20+ 份 v1 七模块分析 + 16 份板块概览 + Top50 精选组合 + AI 算力链专题深度。5/7 起新增 Next.js 选股器网页，把 Markdown 报告外的"看图筛选"工作流补上。

**5/8-5/9 健康度评分模型五连击 → v3.4 最终收官**：从 v1.6 P0 评审起步，经过 v1.7（R8/R9/R10）/ v1.8（R12/R14/R15/R16/R17）/ v2.0（红利央企硬清单 + PE 双判定 + R10' 跨主题精细化）/ v3.0-v3.4（5 项 P0/P1 大跃进 + 3 项精准雕琢）共 9 个版本演进。**完全一致率从 20.4% 提升到 36.7%（+80%）**，可接受率（一致 + 差 1 档）从 34.7% 提升到 79.6%（+129%），系统过激进 2.0% → **0.0% 完美归零**。Cowork 人工覆盖量从 14 只降到 1 只（仅长电）。

**Daily Wave 盘后日更自动化**（5/9 启动）：A+B 双轮排班 — 第 1 版 16:00「盘后点评」（速判型 300-500 字 / 早盘紧急公告 + 跨标事件链 + 次日提示）/ 第 2 版 20:00「晚间深读」（深读型 1500-3000 字 / 17-19 点新增公告 + 单股深度 + WebSearch 研报）。3 个 launchd plist 自动化（daily-update 15:30 / evening-announcements 19:30 / refresh-universe 月初+15）。

**Cowork 双 session 协作**：Yuan-MBP 上并行运行两个 Claude Code session — Cowork（Wave 评审 / P0 / 项目记忆 / 调研报告）+ Claude Code（评分规则代码 / 网页前后端 / 个股报告批量生成）。两者通过 `备忘/项目记忆_*.md` 跨会话同步状态。**全部 Maxwell 通过 SSH 远程操作**（不在物理桌面）。

## HISTORY

**前身：ifind-agent · A 股六维评分系统**（5/5 启动 → 5/6 整体推翻）。

OpenClaw 三 Agent 协同（main / yuan-asst / xiao-asst）+ 三 cron 主动汇报；815 只标的 × 六维度评分（财务 / 估值 / 机构 / 技术 / 行业 / 风险）；DuckDB 12 表 + ChromaDB 1,622 向量 + 13 MCP 工具。

**5/6 整体推翻 5 大原因**：HTTP API 数据可信度不足、自动评分输出 buy/hold/sell 触合规边界、SDK 账号锁定、815 只行业标签缺失、三 Agent 架构对老板而言太重。看到 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services) 后，决定改用官方 Skill + Template 体系，转向"人 + Claude 协作纪律性投研" — 合规优先于技术成熟度。

## NOTES

- **从"自动化数据流水线 + 评分模型"切换到"人 + Claude 协作纪律性投研"** — 5/6 路线推翻的本质：iFinD HTTP API 数据可信度不足 + 自动评分输出 buy/hold/sell 触合规边界 + 三 Agent 架构对老板而言太重（他们要的是一份高质量报告，不是对话系统）。看到 Anthropic 官方 financial-services 之后明确：**合规边界比技术成熟度更重要**。

- **扁平 CSV 而非数据库的反直觉选择** — 表面看起来用 DuckDB 更高效（前身 1 用了 12 表 + 1,622 向量），但实际上：① 人能直接打开 CSV 看，② Claude Code 直接 Read 工具读 CSV 不需任何数据库知识，③ 版本管理清晰（每个 CSV 独立 git diff），④ 坏一份不影响其他。**适配 LLM 协作场景比"工程性能"更重要**。

- **七模块固定结构 + 不输出投资建议** — 报告 schema 锁死（主营 / 财务 / 资产负债 / 估值 / 同业 / 优势 / 风险）让 Claude 输出可预期、读者可对照。**严守"不输出买入/卖出/目标价"合规边界**，让报告成为"分析素材"而非"决策结论"——这是合规底线，也是与上一版 ifind-agent 的根本区别。

- **基于 batch CSV 评审而非小样本推测**（Wave 25 教训）— 5/8 Wave 23 推测 v1.7 一致率 60%，Wave 25 基于 1095 只全样本 batch CSV 复盘真实是 28% — 推测乐观 32 个百分点。从此**任何评审必须基于全样本 batch CSV，禁止以小样本推测覆盖**，重置项目评估纪律。

- **9 版本演进的累积成就**（v1.7 → v3.4）— 完全一致率 20.4% → 36.7% 提升 80%；可接受率 34.7% → 79.6% 提升 129%；严重不一致 49% → 6.1% 降低 88%；系统过激进 2.0% → 0.0% 完美归零；Cowork 人工覆盖量 14 只 → 1 只降低 93%。**评分系统的迭代是"小步快跑 + 全样本回测 + 人工纠偏"的循环**，不是"一次设计好"。

- **Cowork 双 session 协作模式** — Yuan-MBP 上并行 2 个 Claude Code session：① Cowork 负责 Wave 评审 / 项目记忆 / 调研报告，② Claude Code 负责规则代码实施 / 网页前后端 / 报告批量生成。**通过 `备忘/项目记忆_*.md` 跨会话同步状态**，避免单 session 上下文 token 爆炸。Maxwell 全程 SSH 远程操作。
