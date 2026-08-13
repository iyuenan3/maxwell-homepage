---
slug: openclaw
name_en: "OpenClaw · AI Assistant Platform"
name_zh: "OpenClaw · AI 助理平台"
status: archived
since: 2026-05-03
rag_exclude: true
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
  - 火山方舟 ark-code
  - gateway
  - cron
  - python
---

## README

> 历史归档：本机 OpenClaw 配置已于 2026-07-10 卸载。本页只保留当时的使用与工程实践记录；OpenClaw 是第三方平台，不是 Maxwell 开发的产品。

Maxwell-MBP 本机 AI 助理平台基座。火山方舟 `ark-code-latest` 作为 LLM 基座，Gateway loopback `:18789` + Token 认证暴露给本机和云端 Skill 调用，每天凌晨 4 点 cron 自动构建知识库。

主 Agent「Max」预加载 15 核心能力模块（产品经理/项目经理/UI/前端/后端架构/数据库/代码审查/DevOps/SRE/安全等，基于 agency-agents-zh 角色库），能力定义整合进 system prompt，运行时按关键词自动触发，响应零延迟。7 个内置 Skill + 3 个生产级自定义 Skill（moltbook-daily 日报、wordpress-blog-writer、story-writer）。

严格行为边界（SOUL.md 固化）：不改 openclaw.json、不重启 gateway、记忆永不清除、第一性原理工作准则。配置每天 04:55 自动备份 GitHub 私有仓库。

## NOTES

- **预加载方案优先于运行时 fetch：** 15 能力模块不走运行时按需 fetch（每次任务都读 agents/<role>.md，有延迟），也不走 spawn 子 agent（协调开销大、跨能力组合有隙缝），而是整合到启动 system prompt。代价是启动 token 多约 30%，收益是响应快、能力调用零延迟、跨能力组合无缝。**单用户场景下，预加载是最优解**，多用户/多模型场景才需权衡。

- **Skill-vetting 供应链安全边界：** Skill 作为 plugin 有完整文件读写权限，恶意 Skill 能改配置/偷 key/投毒 memory，每次安装前强制审计（SKILL.md + 依赖 + 权限），代价 30 秒到 2 分钟，换来避免供应链攻击。**「方便安装」和「安全边界」二选一，Maxwell 选后者**，这条原则在 5/3 安装 self-improving-agent 时严格执行。

- **本机部署零运维优势：** Gateway loopback 仅本机访问，无对外端口暴露、无认证压力、直接读本地文件、无需 Cloudflare Tunnel 或 SSH transport。**本机部署让 Maxwell 可以专注 Agent 行为本身而非基础设施**，云端化扩展必须先回答「为什么要上云」才值得做。
