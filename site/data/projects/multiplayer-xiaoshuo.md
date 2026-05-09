---
slug: multiplayer-xiaoshuo
name_en: "Multiplayer Xiaoshuo · Interactive Multiplayer Fiction"
name_zh: "多人小说 · 多人互动小说 H5"
status: live
since: 2026-04-30
links:
  url: https://tale.maxwellii.com
  source: private
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - notes
wiki_slug: multiplayer-xiaoshuo
stack:
  - vue 3
  - socket.io
  - redis
  - 火山方舟 doubao
---

## README

多人实时共创互动叙事 H5。3-8 名玩家在同一房间扮演角色，AI 根据每个人的隐藏属性（好感/狠辣/声望）实时判定行动叙事效果，**不是多数决投票**——这是与同类产品的核心区别。AI 替身自动补位，60 秒倒计时超时由 AI 接管。10-30 回合推进至个性化结局。

V1 已上生产 10 个剧本（宫斗 / 悬疑 / 武侠 / 谍战 / 仙侠 / 重生 / 无限流 / 女强 / 星际 / 电竞），单 AI 服务节点 PM2 + Redis 8 天 TTL，与 naming.maxwellii.com 共享 443 SNI。

5/7 起进入 V1 → V2「剧聊」大重构：5 题材标签替代固定剧本、3 通用属性统一、危急时刻 + 公共决策 + 主动结束三种投票、出局观众模式 + 反转拉回、双导出（HTML 富排版 / AI 整理纯小说）。代码层 Phase 1-7 已完成（`feature/juliao` 分支），待真机测试上线。生产当前挂升级中公告页。

## NOTES

（待补 — 5/7 凌晨重构方法论：分支化 + 物理备份 + 文档先行；为什么把 scripts/ 全删；为什么挂公告页而非直接上 V2）
