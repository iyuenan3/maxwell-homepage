---
slug: openclaw
name_en: "OpenClaw · AI Assistant Platform"
name_zh: "OpenClaw · AI 助理平台"
status: active
since: 2026-04-26
links:
  url: ""
  source: private
  docs: ""
commands:
  - readme
  - links
  - decisions
  - notes
wiki_slug: openclaw
stack:
  - openclaw
  - 火山方舟
  - cron
  - gateway
---

## README

AI 助理平台。火山方舟 `ark-code-latest` 作为基座，通过 Gateway loopback `:18789` + Token 认证暴露给本机 / 云端各 Skill 调用。每天凌晨 4 点 cron 自动构建知识库（与 [[AI-Knowledge]] / [[worklog]] 联动）。

**7 个内置 Skill**：minimax-pdf / minimax-docx / minimax-xlsx / pptx-generator / agent-browser / pua / skill-vetting。

**3 个生产级自定义 Skill**（[OpenClaw-Customize-Skills](https://github.com/iyuenan3/OpenClaw-Customize-Skills) 仓库）：moltbook-daily（日报生成 + 抖音风文案 + 定时邮件推送）/ wordpress-blog-writer（主题 → 大纲 → HTML → GitHub 备份 → WordPress 发布全链路）/ story-writer（自动选题 + 严格字数大纲 + 章节生成）。

后台 daemon 模式运行，IDE 不显式启动也持续工作。与企业级 OpenClaw 平台（前司）一脉相承但更轻量化——单机本地版 / 云端版均可部署，无飞书 RAG / 多租户 / SOP 流程，专注个人多 Agent 工作流。

## NOTES

（待补 — Skill vetting 的设计取舍；本机 vs 云端部署差异；Gateway 设计的取舍）
