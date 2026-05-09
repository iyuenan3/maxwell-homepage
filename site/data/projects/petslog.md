---
slug: petslog
name_en: "PetsLog · Pet Health Companion"
name_zh: "PetsLog · 宠物健康伴侣"
status: active
since: 2025-09
links:
  v1 codebase: https://github.com/iyuenan3/Cursor-PetsLog
  v2 codebase: https://github.com/iyuenan3/OpenClaw-PetsLog
commands:
  - readme
  - links
  - history
  - stats
  - decisions
  - stack
  - notes
wiki_slug: ""
stack:
  - vue 3
  - uni-app
  - vite
  - uniCloud
  - cursor
  - openclaw
  - claude code
---

## README

多宠家庭 AI 健康记录工具。**起源是个真实生活痛点**：家里养 7 猫 2 狗，看病时医生问病史答不上来——记事本和 Notion 都太重，急救场景下连录入都来不及。

**这是一个跨越三个工具范式的项目**：

- **v1（2025.09 – 2026.01）· Cursor + uni-app + uniCloud** — 4 小时跑通 MVP，零代码、零测试用例。部署内测后因 uniCloud 空间没续费下线。
- **v2（2026.01 – 2026.03）· OpenClaw 重构** — 作为系统学习 OpenClaw 的载体，搞清单 Agent 记忆机制 + 多 Agent 协作机制。交付 8000 行 / 32 E2E / 38 docs / 双端（小程序+H5）+ CI/CD。
- **v3（2026.04 起）· 自然语言录入 + AI 解析** — 应用形态保留（uni-app + 微信云开发），把日常录入从"选宠物-选日期-填表"改为"一句自然语言或语音 → 阿里云百炼 LLM 自动解析归档"。Claude Code 作为编码工具。

三次重构每次都把上一版推翻，但**真实痛点没变过**。每代工具的上限抬高一档，上一代就显得过度工程。这个项目本身就是 AI 工具演进的活样本。

## HISTORY

**v1 · 2025.09 – 2026.01 · Cursor + uni-app + uniCloud**

起手用 Cursor + HBuilderX 学习小程序开发兼练 Vibe Coding。**4 小时跑通 MVP**，零手写代码、零测试用例。多宠档案 + 6 类事件录入 + 历史搜索 + 文件上传。uniCloud 部署后给身边朋友内测过，后因 uniCloud 空间没续费整个 v1 下线。仓库：[Cursor-PetsLog](https://github.com/iyuenan3/Cursor-PetsLog)。

**v2 · 2026.01 – 2026.03 · OpenClaw 学习实验 + 整体重构**

接触 OpenClaw 后整体重构。**这一阶段本质上是系统学习 OpenClaw 的载体**：用同一个真实需求反复重构，是为了搞清两件事——**单 Agent 如何更好地存储与召回长期记忆**、**多 Agent 如何互相协作分工**。两种模式都跑过：单 Agent 串流（一个 Agent 顺次跑完所有任务）、多 Agent 协作（基于 [agency-agents-zh](https://github.com/jnMetaCode/agency-agents-zh) 的 211 角色库 + [agency-orchestrator](https://github.com/jnMetaCode/agency-orchestrator) 的 YAML+DAG 编排引擎，让"产品 Agent / 前端 Agent / 测试 Agent / 部署 Agent"流水线作业）。最终交付：8000 行 / 8 页面 / 12 云函数 / 32 E2E 测试 / 64 特性 / 38 份 docs。新增双端编译（小程序 + H5）、用户家庭体系、4 种自动提醒、离线优先 + Web Speech API、GitHub Actions CI/CD。仓库：[OpenClaw-PetsLog](https://github.com/iyuenan3/OpenClaw-PetsLog)。

**v3 · 2026.04 起 · 自然语言录入 + AI 解析 · uni-app 重做**

第三次重构是**录入流程的范式反思**：保留 H5 / 微信小程序的应用形态（首页宠物卡片、健康时间线、药品库存仍要做），但把日常录入从"选宠物-选日期-多级填表"简化为"一句自然语言或语音 → AI 自动提取宠物身份/事件/体重/用药 → 归档到对应宠物时间线"。技术栈：uni-app（一套代码多端，未来扩展 APP）+ 微信云开发（无服务器后端）+ 阿里云百炼（LLM 自然语言结构化）+ Claude Code（编码工具）。AI 滥用防护：严格系统 prompt（定位"结构化提取机器"，不聊天）+ 强制 JSON 输出 + 前端防呆 + 频率限制。当前在 `~/Desktop/Claude-Project/petslog/` 落了 2 份背景与方案文档，正式实施未启动。

## STATS

| 维度 | v1 (Cursor) | v2 (OpenClaw) | v3 (Claude Code) |
| --- | --- | --- | --- |
| 起手时间 | **4 小时**跑通 MVP | 反复重构（约 60 天） | 文档阶段（未启动） |
| 代码行 | uni-app 单端 | **8,000 行**双端 | 0（待启动） |
| 测试 | 0 | **32 E2E** | — |
| 文档 | README + DB 设计 | **38 份** docs | 2 份背景文档 |
| 部署 | uniCloud 已下线 | 未部署 | 未启动 |
| AI 协作模式 | 单 Agent 对话（Cursor）| 单 Agent 串流 / 多 Agent 协作 | 自然语言录入 + LLM 解析 |
| 关键工具 | Cursor + HBuilderX | OpenClaw + agency-agents-zh + agency-orchestrator | Claude Code |

## DECISIONS

- **uni-app 而非原生小程序** — v1 起就锁定一套代码多端，留 H5 / Android / iOS 扩展空间
- **微信云开发 / uniCloud 而非自建后端** — 免运维 + 按量计费 + 跟微信小程序天然集成，独立开发者降低维护成本
- **v2 反复重构而非线性推进** — 重构本身就是学习 OpenClaw 的载体（单 Agent 长期记忆机制 / 多 Agent 协作编排），38 份 docs 大半是这个学习过程的副产物
- **v3 简化录入而非简化应用** — 应用形态（首页宠物卡片 / 健康时间线 / 药品库存）保留，但把"选宠物-选日期-填表"换成"一句自然语言 → AI 解析"
- **接入大模型 API + 严格 prompt** — 把 LLM 定位为"结构化提取机器"，强制 JSON 输出 + 前端防呆 + 频率限制，规避滥用与合规风险
- **开源至 GitHub** — 架构 / 产品设计 / AI 提示词公开做简历加成，完整商业代码留私有仓

## NOTES

**三次重构没改变需求，每次都是工具的解析力上限抬高**

v1 的 Cursor 把"我不会写代码"变成可能（4 小时跑通 MVP）；v2 的 OpenClaw 把"我不写测试"变成可能（32 E2E + CI/CD 自动跑）；v3 的 Claude Code + 阿里云百炼把"我不需要表单"变成可能。每一代工具上限抬高一档，上一代就显得过度工程。

**v2 是 OpenClaw 学习窗口，不是反复重构的代价**

v2 本身是产品交付，但对我而言更重要的是**它是系统学习 OpenClaw 的实验场**。我用同一个真实需求反复重构，是为了搞清两个机制：**单 Agent 长期记忆怎么持久化与召回**（把项目状态、设计决策、未完成任务交给 Agent 自己管）；**多 Agent 如何分工协作**（基于 agency-agents-zh 的角色定义 + agency-orchestrator 的 YAML+DAG 编排，让"产品 Agent + 前端 Agent + 测试 Agent + 部署 Agent"流水线作业）。每次重构都在替换记忆方案或编排策略，38 份 docs 大半是这个学习过程的副产物。

**Cursor vs OpenClaw 的实战体感**

Cursor 强在**单文件单任务的快速验证**——配合 HBuilderX 跑通小程序 4 小时见效，但上下文一长容易幻觉。OpenClaw 强在**多文件项目的工程化与可分工**——单 Agent 串流适合线性任务，多 Agent 协作适合分模块并行，测试 / CI / 部署可以让独立 Agent 处理。

**v3 的反思：录入方式比应用形态更值得简化**

v3 不是"不写代码"，而是反思**录入方式的过度工程**。传统小程序录入"选宠物-选日期-填症状-传图片"分了 4-5 层 UI，但用户在急救场景下根本来不及操作。v3 保留应用形态（uni-app + 微信云开发，未来扩展 APP），但**录入这一步彻底改为自然语言对话**——一句话或语音，阿里云百炼自动解析为结构化记录。Vue / uni-app / 云函数 / 路由这些工程基础设施仍然必要，被简化的是"用户与表单的交互层"。AI 时代独立开发者真正的杠杆点不是"少写代码"，而是**重新定义用户与系统的交互界面**。
