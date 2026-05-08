---
slug: worklog
title: worklog
status: wip
since: 2026-05-03
links:
  url: ""
  source: private
  docs: ""
commands:
  - readme
  - links
  - decisions
  - notes
wiki_slug: worklog
stack:
  - obsidian
  - claude code
  - markdown
  - llm-wiki
---

## README

工作日记 + 持久化知识库系统。基于 Karpathy LLM Wiki 三层架构：**Schema 层**（CLAUDE.md，规则与约定）→ **Wiki 层**（项目页 / 概念页 / 综合页 / 索引）→ **日记层**（每日工作记录）。三大操作 Ingest / Query / Lint。

核心理念是"摄入时编译"——每次"记录今天"不只是写一篇日记，而是一次知识编译：日记中的项目进展同步更新对应 Wiki 页，决策记录归档到项目决策日志，新概念被提取为独立页面。一次 Ingest 可触及 10+ 个 Wiki 页面，知识持久积累产生复利，而非随会话消失。

由 Claude Code 全权维护 Wiki 层。每篇日记的"今日时间线"章节按时序列出主要操作，关键提交带分钟级时间戳，跨日延续工作统一归到主推进日。

## NOTES

（待补 — 为什么用 LLM Wiki 而非 RAG；编译器范式 vs 解释器范式；Ingest 触发 10+ 页同步的实战体感）
