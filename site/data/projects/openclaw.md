---
slug: openclaw
name_en: "OpenClaw · AI Assistant Platform"
name_zh: "OpenClaw · AI 助理平台"
status: active
since: 2026-05-03
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
wiki_slug: openclaw
stack:
  - openclaw
  - 火山方舟
  - ark-code-latest
  - agent-main
  - cron
  - gateway
---

## README

AI 助理平台。火山方舟 `ark-code-latest` 作为基座，通过 Gateway loopback `:18789` + Token 认证暴露给本机 / 云端各 Skill 调用。每天凌晨 4 点 cron 自动构建知识库（与 [[AI-Knowledge]] / [[worklog]] 联动）。

**7 个内置 Skill**：minimax-pdf / minimax-docx / minimax-xlsx / pptx-generator / agent-browser / pua / skill-vetting。

**3 个生产级自定义 Skill**（[OpenClaw-Customize-Skills](https://github.com/iyuenan3/OpenClaw-Customize-Skills) 仓库）：moltbook-daily（日报生成 + 抖音风文案 + 定时邮件推送）/ wordpress-blog-writer（主题 → 大纲 → HTML → GitHub 备份 → WordPress 发布全链路）/ story-writer（自动选题 + 严格字数大纲 + 章节生成）。

后台 daemon 模式运行，IDE 不显式启动也持续工作。与企业级 OpenClaw 平台（前司）一脉相承但更轻量化——单机本地版 / 云端版均可部署，无飞书 RAG / 多租户 / SOP 流程，专注个人多 Agent 工作流。

**主 Agent「Max」+ 15 核心能力模块**（基于 [agency-agents-zh](https://github.com/jnMetaCode/agency-agents-zh) 角色库）：产品经理 / 项目经理 / UI 设计 / 品牌守护 / 前端 / 微信小程序 / 后端架构 / 数据库优化 / 代码审查 / DevOps / SRE / 软件架构 / API 测试 / 安全 / 技术文档。能力定义预加载到 Max 的 system prompt（方案 D），运行时自动按触发关键词调用对应能力，无需额外读文件。

**严格行为边界**（2026-03-31 SOUL.md 固化）：① 不改 openclaw.json（关键配置必须用户授权）② 不重启 gateway 服务（只提醒用户手动重启）③ 记忆永不清除（所有对话历史只增不减）④ 第一性原理工作准则。配置每天 04:55 自动备份到 GitHub 私有仓库（双重保护：.gitignore + 备份脚本只备 agent-* 目录，不存 API key）。

## NOTES

- **agency-agents-zh 角色库的预加载方案 D**（vs B/C）— Max 的 15 核心能力不是运行时按需 fetch（B 方案：每次任务都读 agents/<role>.md），也不是分支化分别 spawn（C 方案：每个能力 spawn 独立 sub-agent），而是**预加载所有 15 个能力到 system prompt**（D 方案：AGENTS-CAPABILITIES.md 整合到启动时上下文）。代价：每次会话启动 token 多 ~30%；收益：响应快 + 能力调用零延迟 + 跨能力组合无缝。**对单用户场景，预加载是最优解；多用户/多模型场景需要权衡**。

- **Skill-vetting 的设计取舍** — Maxwell 安装新 Skill 时强制走 skill-vetting（先审计 SKILL.md + 第三方依赖 + 文件权限），而不是无脑 `openclaw skill install <repo>`。原因：**Skill 是 plugin，运行时拥有完整文件读写权限**，恶意 Skill 能改 openclaw.json / 偷 API key / 投毒 memory。代价：每次安装多 1 步审计（30s-2min）；收益：避免供应链攻击。这条原则在 5/3 安装 self-improving-agent / document-skills 时严格执行。

- **Cron 时段保留与冲突管理** — 04:00-05:00 是平台保留时段（04:00 知识库构建 + 04:55 配置备份），不在该时段创建其他任务避免资源争抢。Cron 状态实测可用：04:55 配置备份"<1m ago"成功 / 07:00 Moltbook 日报"22h ago ok" / 但 04:00 知识库构建"56m ago error"——error 状态需要追查（可能是上游 API / 知识库源不可用），但平台层面 cron 调度器本身正常。

- **本机部署的"零运维"优势** — 本机版（Maxwell-MBP）：Gateway loopback `:18789` 仅本机访问，无对外端口暴露 + 无认证压力 + 直接读本地文件 + 无需 Token / Cloudflare Tunnel / SSH transport。**单机本地版的"零运维"优势让 Maxwell 可以专注 Agent 行为本身而非基础设施**。云端化扩展需重新评估"为什么要上云"再决定。
