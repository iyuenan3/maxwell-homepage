# CORE — maxwell-homepage
<!-- 身份+不可违反边界。来访首读+防偏差总纲。不写产品细节(→PRD)/架构(→ARCHITECTURE)/接口(→SPEC)。 -->

## 身份
李越男（Maxwell Li，英文名 Maxwell）的**公开个人主页仓库**（github.com/iyuenan3/maxwell-homepage）。三件事合一：
1. **maxwellii.com** —— 终端体（bash 隐喻）静态个人站，V1 简介模式 + V2 LLM 化身对话模式。
2. **简历多版本归档** —— `MaxwellLi-<TargetRole>.{md,html,pdf}` + `versions/`。
3. **chat-api** —— 主页右下对话框背后的 RAG LLM 化身后端（本仓库专属子模块，非共享底座）。

仓库公开（push 到 GitHub）。本地工作指引 `CLAUDE.md` + RAG 索引产物 + 私密文件均 gitignore（见 ARCHITECTURE / 红线段）。

## 使命 / 解决什么问题
给访客（招聘方 / 同行 / 潜在合作者）一个**可交互的专业形象 + AI 工程能力的活样本**：
- 终端体主页用第一性的"作品即证据"方式展示项目生态，而非简历套话。
- chat-api 化身让访客直接"问 AI 版 Maxwell"关于背景 / 项目 / 技术栈 / 经历 —— 化身本身就是 RAG + 隐私工程 + SSE 流式的能力 demo。
- 求职是**隐含价值主张**（主页确实服务于让人认识 Maxwell 的能力），但**具体求职活动 / 面试材料 / 谈薪不是本仓库的内容**（见 Non-Goals + 红线）。

## Non-Goals（明确不做）
- **不做求职活动主存储**：面试 / 求职沟通文案 / 谈薪 / 公司情报 等求职活动材料 → 全在 worklog（私密仓库），不进本仓库（见 RELATIONS）。
- **不做通用编程助手**：chat 化身只讨论 Maxwell 自己项目的代码，拒写通用工具脚本（代码边界 B，见 CONVENTIONS）。
- **不做内容产品文档**：简历 .md/.html/.pdf 是**内容产物**不是项目文档，不迁进 AIREADME，不在此维护其正文。
- **不靠 .gitignore 防护私密内容**：开源仓库里靠 gitignore 屏蔽私密文件不可靠（2026-05-10 教训），私密内容直接放 worklog。

## 绝不 / Hard Constraints（红线）
⚠️ 本仓库**公开 + AIREADME committed + 可被其他项目跨目录读**，下列绝不违反：

1. **任何 key/secret 绝不进仓库任何文件（含 AIREADME）**：
   - chat-api LLM 上游 key（`CHAT_LLM_API_KEY=sk-...`）、`ADMIN_TOKEN` → 只在 `chat-api/.env.local`（gitignore + 服务器 chmod 600）。
   - 提交前跑安全审计（grep ark-/sk-/真实手机号/用户绝对路径/长 token，见 CONVENTIONS）。
2. **真实手机号绝不进公开版**：公开仓库一律脱敏 `xxxxx170755`；真实号只在桌面投递版 PDF（`~/Desktop/`，不在仓库内）。邮箱 `limaxwell93@gmail.com` 是公开联系方式，保留。
3. **求职 / 面试 / 第三方公司情报绝不经化身外泄**：化身访客可能是潜在雇主。chat-api 有 4 层防御（server prefilter + system-prompt + LLM judge + chunk/source 黑名单 + worklog diaries/wiki/job 整目录排除）。**被屏蔽的具体关键词表 / 黑名单条目不写进 AIREADME**，只记机制（见 ARCHITECTURE / DECISIONS）。
4. **化身禁止伪造归属**：永远禁止说 OpenClaw / Claude / Cursor 等第三方产品是"我做的"；第三方产品归属不确定就坦白"建议查官方"。
5. **gitignore 的私密文件正文绝不进 AIREADME**：只记"存在 + 用途 + 已 gitignore"，不抄正文。

## 生命周期
**active** —— maxwellii.com 2026-05-08 上线，chat-api 5/10 v2.2.0 上线、5/19 v2.4.0 大改，持续维护中。
