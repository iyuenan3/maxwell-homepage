---
slug: openclaw
title: openclaw
status: daemon
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

本机（Maxwell-MBP）AI 助理平台。火山方舟 `ark-code-latest` 作为基座，通过 Gateway loopback `:18789` + Token 认证暴露给本机各 Skill 调用。每天凌晨 4 点 cron 自动构建知识库（与 [[AI-Knowleage]] / [[worklog]] 联动）。

7 个内置 Skill：minimax-pdf / minimax-docx / minimax-xlsx / pptx-generator / agent-browser / pua / skill-vetting。后台 daemon 模式运行，IDE 不显式启动也持续工作。

与企业级 OpenClaw 平台（前司）一脉相承但更轻量化——单机本地版，没有飞书 RAG / 多租户 / SOP 流程，专注个人多 Agent 工作流。

## NOTES

（待补 — 与 [[OpenClaw-Customize-Skills]] 的边界；为什么本机仍保留 OpenClaw 而袁总机 5/6 整套卸载；Gateway 设计的取舍）
