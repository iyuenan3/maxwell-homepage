---
slug: maxwell-homepage
name_en: "worklog × maxwellii.com · Personal Knowledge System"
name_zh: "worklog × maxwellii.com · 个人知识系统"
status: live
since: 2026-05-08
links:
  url: https://maxwellii.com
  source: https://github.com/iyuenan3/maxwell-homepage
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: maxwell-homepage
stack:
  - obsidian
  - claude-code
  - llm-wiki
  - next.js
  - rag
  - nginx
---

## README

把「我是谁、做过什么」重构成一个 AI 能持续读懂、对外可对话查询的个人知识系统。worklog 是输入引擎，maxwellii.com 是输出界面，两端各司其职但数据高度耦合。

**worklog（输入引擎）**：基于 Karpathy LLM Wiki 三层架构的 Obsidian + git 知识库。日记层只追加事务日志，wiki 层由 LLM 持续维护物化视图，schema 层（CLAUDE.md）人机共同演化。每次「记录今天」不只是写日记，而是一次知识编译：自动扫描各项目 git log 与 Claude memory 还原每日工作，一次摄入触及 10 到 15 个 wiki 页面，按领域分类加 wikilink 双向链接建立上下游关系。这与 RAG 的「查询时编译」形成根本差异，知识在写入时就被整理消化，适合需要被准确回查的个人经历类知识。

**maxwellii.com（输出界面）**：终端体静态主页（bash 隐喻 + CRT 扫描线 + 朱砂方印），访客通过右下角 chat 框直接与「AI 版 Maxwell」对话。chat-api 后端（Next.js）把 worklog wiki、简历、项目档案做成 RAG 知识库（407 .md 多源平衡召回），自写向量检索加 cosine top-K，doubao-seed-2.0-lite 流式回答。公网服务做了 12 段 prompt 防御（防污染 / 防注入 / 求职隐私 4 层过滤）加 CSP 加 Rate limit。

**AIREADME（方法论沉淀）**：把「为 AI 组织知识」抽象成 12 文件标准模板（CORE / PRD / ARCHITECTURE / SPEC / DECISIONS / DEPLOYMENT 等各司其职），界定每个文件谁维护、何时更新、写给谁看，现已是所有在做项目的标准底座。最大收益是跨项目信息互通：开发某项目时 AI 只需读依赖项目的 AIREADME，就能拿到接口契约与架构约束，省去翻代码重新梳理。

构建器是纯 Node 零依赖的 `site/build.js`，从 `site/data/projects/<slug>.md` 渲染终端体详情页，build 时主动从 worklog wiki 抽 git_log / decisions / stats。整条数据流是「摄入时编译」的跨项目延伸：知识从 worklog wiki 流向 embeddings.json，再从 embeddings.json 流向对话上下文。

## NOTES

- **为什么不直接用 RAG 而要建 LLM Wiki**：RAG 是查询时编译，知识质量取决于检索算法和 chunk 切分，且随会话消失；LLM Wiki 是摄入时编译，写入时就被整理归类。对于项目状态、设计决策、工程教训这类需要被准确回查的知识，RAG 召回率不可控，而 wiki 的结构化程度决定了回查准确性。两者不是替代关系，是不同场景的最优选型。

- **AIREADME 从「自用」到「基础设施」**：最初只为让 AI 接手多项目时不必重新喂背景。后来发现所有项目有共同的信息需求（架构、接口契约、决策理由、依赖关系），于是抽象为 12 文件标准。这不是文档方法论的抽象，而是从「多项目 AI 协作效率」这个实际问题倒推出的信息架构。

- **4 层隐私防御为什么不能只靠 system-prompt**：实测模型在 context 信息丰富时仍可能输出面试细节，单层 prompt 防御不足。真正有效的防护是在源头就不让敏感数据进向量索引（scan-sources LLM judge 隐私分级 + build-embeddings chunk 过滤），而非依赖 LLM 生成时自我审查。worklog 的 diaries 和 wiki/job 目录在索引阶段就被整体排除。

- **终端体设计的克制原则**：bash 隐喻不可替换不是设计偏好，而是「作品的形式即内容」的立场。访客用命令式终端浏览项目，在交互形式本身就看到了对极简和第一性原理的信奉，这比任何能力声明都更可信。设计稿来自 claude.ai/design 的 HANDOFF，文案不润色。
