---
slug: worklog
name_en: "Worklog · AI Daily Journal & LLM Wiki"
name_zh: "工作日志 · AI 自动日记 + LLM Wiki 知识库"
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
wiki_slug: worklog
stack:
  - obsidian
  - claude code
  - markdown
  - llm-wiki
  - dataview
---

## README

工作日记 + 持久化知识库系统。基于 Karpathy LLM Wiki 三层架构：**Schema 层**（CLAUDE.md，规则与约定）→ **Wiki 层**（项目页 / 概念页 / 综合页 / 索引）→ **日记层**（每日工作记录）。三大操作 Ingest / Query / Lint。

核心理念是"摄入时编译"——每次"记录今天"不只是写一篇日记，而是一次知识编译：日记中的项目进展同步更新对应 Wiki 页，决策记录归档到项目决策日志，新概念被提取为独立页面。一次 Ingest 可触及 10+ 个 Wiki 页面，知识持久积累产生复利，而非随会话消失。

由 Claude Code 全权维护 Wiki 层。每篇日记的"今日时间线"章节按时序列出主要操作，关键提交带分钟级时间戳，跨日延续工作统一归到主推进日。

**Schema v2.7.2 六次迭代**（5/9 半天内密集演进）— v2.5（homelab Claude memory 迁入 + AI-Knowleage typo 修复）→ v2.6（**TODO 系统从无到有**，wiki/todos.md + ## 待办段 + Obsidian Tasks query）→ v2.6.1（TODO 边界澄清：怕忘小事 vs 思考方向）→ v2.6.2（## 待办段废弃 + 与 ## 下一步合并 + markdown 格式区分语义）→ v2.7（**全工作区命名规范化**：3 项目目录 mv 小写化 + 8 wiki 文件改名/合并 + sed 全量）→ v2.7.1（Maxwell-Resume → Maxwell-Homepage 业务改名）→ v2.7.2（**§6.5 改名方案 A/B 判断标准升级**：从「是否同一事物」→「旧名是否有追溯价值」，认知/架构重大变化（A）vs 仅名字优化（B））。

**homelab 合并入 wiki/infrastructure/**（5/9 v2.4 完成）— 原 homelab 项目（独立目录管理硬件集群）合并入 worklog wiki，作为 `infrastructure/` 子目录存在。合并后 homelab 项目目录归档为 `.archive/homelab-2026-05-09/`，wiki 新增 cluster + 4 设备 md（liyuenan-mbp / yuan-mbp / maxwell-mbp / alicloud-sg），CLAUDE.md 新增 §十「基础设施操作原则」。

## NOTES

- **为什么用 LLM Wiki 而非 RAG**（核心架构决策）— RAG 是"检索时编译"：查询时再去 vector DB 查相关 chunk，质量受限于检索算法 + chunk 切分 + embedding 模型。LLM Wiki 是"摄入时编译"：写日记时同步更新对应 Wiki 页（项目进展、决策、新概念），知识在写入时就已经被整理、消化、归类成结构化页面。**RAG 适合"知识不断变化但不会被精读"的场景；LLM Wiki 适合"知识持续累积且会被反复回查"的场景**。worklog 是后者——项目状态、设计决策、工程教训需要被准确回查，不能依赖检索召回率。

- **TODO 系统从无到有的 4 步演进**（v2.6 → v2.6.1 → v2.6.2 半天内三次迭代）— 用户首先要求"加 TODO 能力"（v2.6 双能力升级），写完后用户首批 4 条 TODO 出现两类内容（"怕忘的小事"+"需要思考的方向"），暴露**边界不清**（v2.6.1 澄清 TODO 是怕忘的小事），紧接着用户提"待办和下一步合并"（v2.6.2 段合并 + markdown 格式区分语义）。**这是一个典型的"先实现，再边界澄清，再结构合并"的 schema 演进路径**——验证了 LLM Wiki schema 应该从用户实际行为反推，而不是预设。

- **改名方案 A vs B 的判断标准升级**（v2.7.2 §6.5）— v2.5 §6.5 写了「拼写修正 vs 业务改名」（A=保留追溯 / B=全量统一）。5/9 实战遇到 4 个改名场景，发现 v2.5 的 2 分法不够——业务改名也需要再细分。**v2.7.2 升级判断标准为"旧名是否有追溯价值"**（认知/业务演化/时间点快照）：仅名字优化（如 Maxwell-Resume → maxwell-homepage 同事物）走 B 全量统一，认知/架构重大变化（如 xhs-5agent-pipeline → xhs-agency Multi-Agent Roundtable）走 A 保留追溯，4 行表覆盖所有场景。

- **Ingest 触发 10+ 页同步的实战体感** — 一次普通"今天做了什么"汇报可能触发：① 日记新增 ② 项目页 ## Git 活动表新增行 ③ 项目页 ## 决策日志可能新增段 ④ wiki/index.md 项目最后更新日期同步 ⑤ wiki/log.md 跨项目时间线追加 ⑥ 涉及概念页面更新 ⑦ memory 文件可能新增 / 更新。一次 Ingest 触及 5-15 个文件是常态。**这就是"摄入时编译"的代价**：写日记不再是"打字 5 分钟"，而是 Claude 协作 30-60 分钟的结构化编译，但换来的是知识库的健康度。

- **homelab 合并入 wiki/infrastructure/ 的取舍** — **判断依据**：项目 vs 子模块的边界不是"是否独立目录"，而是"是否有独立的工作流"。设备档案没有独立工作流，只是被项目引用，应该归 wiki。这次合并后 homelab 原项目目录归档为 `.archive/`，但 wiki/infrastructure/ 持续被各项目页引用（"部署架构: alicloud-sg" 等）。
