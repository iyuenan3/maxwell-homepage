---
slug: ai-knowledge
name_en: "AI-Knowledge · Open-Source Project Atlas"
name_zh: "AI 知识库 · 开源项目研究图谱"
status: active
since: 2026-05-09
links:
  url: ""
  source: private
  docs: ""
commands:
  - readme
  - links
  - decisions
  - stats
  - stack
  - notes
wiki_slug: ai-knowledge
stack:
  - obsidian
  - claude code
  - markdown
  - lint
  - wikilink
---

## README

AI 工具链开源项目深度研究知识库。Wiki 中分 concepts / entities / comparisons / articles 四类页面，**当前 55 Wiki 页 / 78 raw 资料 / 0 死链 / 0 矛盾 / 0 孤儿**。

研究方法 A+B+C 三级递进：**A** README 精读建立索引 → **B** 横向对比同类工具 → **C** 源码 Clone 深度分析。已覆盖 OpenClaw / Claude Code / agent-browser 等生态，4 轮深度研究累积。

`raw/documents/` 目录承载用户深度笔记（如 Anthropic 金融服务 Agent 学习笔记），与抓取数据（抖音 / 剪藏）形成"人类先消化、再交给 Wiki"的互补模式。每轮 Ingest 必跑 Lint，揪出事实错误（如 agent-browser 安全护栏从 4 层修正为 6 层）。

**4 轮深度研究批次**（5/5-5/6 完成基线）：Batch 1 OpenClaw 生态（ClawApp / Control Center / Lossless Claw / Edict）/ Batch 2 Claude Code 生态（cc-haha / Claude HUD / superpowers-zh / Claude HowTo）/ Batch 3 浏览器 & 工具（agent-browser / EasySpider）/ Batch 4 独立项目（Agency Agents / Orchestrator / TradingAgents-CN / InkOS / PUA Skill）。

**关键对比维度**（comparisons 4 篇）：agent-browser vs browser-use（Rust CLI vs Python 框架）/ Edict vs RecursiveMAS（制度审核 vs 隐空间训练）/ MetaBot vs OpenClaw（一体化内置 vs 插件化生态）/ OpenHanako vs Claude Desktop（GUI 优先 vs CLI 优先）。每个对比独立 wiki 页，按"差异维度 + 适用场景 + 选型建议"结构。

## NOTES

- **每轮 Ingest 必跑 Lint 的理由** — Wiki 知识库最大的失败模式不是"内容不全"，而是"内容矛盾 / 死链 / 孤儿"。每次新加 wiki 页可能会引入：① 与既有页面的事实矛盾（A 页说 4 层，B 页说 6 层），② 死链（链接到不存在的概念页），③ 孤儿（页面没有任何 backlink）。Lint 在 Ingest 时跑一遍揪出事实错误（如 agent-browser 安全护栏从误写 4 层修正为 6 层）。**0 死链 / 0 矛盾 / 0 孤儿是 Wiki 的"健康基线"**，不是可有可无的指标。

- **A+B+C 方法在不同项目类型下的偏重** — A（README 精读）是必做基线，所有项目都过；B（横向对比）只对"有竞品"的项目做（如 agent-browser vs browser-use，但 InkOS 没有直接竞品就跳 B）；C（源码 Clone）只对"架构有创新"或"自己要复用模式"的项目做（如 Edict 的隐空间训练值得 Clone，但纯包装层不值得）。**A+B+C 不是流水线，是工具箱** — 按项目特性挑选层次。

- **与 worklog 的工程化复用关系** — ai-knowledge 和 worklog 都基于 Obsidian Vault，但定位不同：worklog 是"个人工作日记 + 项目 wiki"（私域），ai-knowledge 是"开源项目研究图谱"（领域）。**双向复用**：ai-knowledge 的 Lint 工程实践被 worklog 借鉴；worklog 的"摄入时编译"编译器范式（Karpathy LLM Wiki 三层）也被 ai-knowledge 借鉴用来管理 raw/wiki 关系。两个项目互为试验田。

- **`raw/documents/` 与抓取数据的互补模式** — 抓取数据（douyin / clippings）是机械抓回的原始内容，质量参差；`raw/documents/` 承载用户人工深度笔记（如 Anthropic 金融服务 Agent 学习笔记）。两者在 raw 层并存，wiki 层从两者**先消化再交给**结构化页面。**不要让 LLM 直接从抓取数据生成 wiki 条目** — 中间需要人类（或人类指导的 Claude）做一层"提炼判断"。
