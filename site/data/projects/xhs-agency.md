---
slug: xhs-agency
name_en: "XHS Agency · Multi-Agent Xiaohongshu Auto-Ops"
name_zh: "小红书 Agency · 多 Agent 全自动账号运营"
status: archived
since: 2025-03-12
links:
  url: ""
  source: private
  docs: ""
commands:
  - readme
  - links
  - stack
wiki_slug: ""
stack:
  - openclaw
  - playwright
  - agency-agents-zh
  - multi-agent
  - cron
---

## README

小红书全链路 Multi-Agent Roundtable 运营系统（**已归档项目，本页保留为技术路线档案**）。2025-03-08 立项，2025-03-12 试行；后续项目归档，本页基于回忆还原架构。

### 架构

OpenClaw 主控（`main agent`）+ 4 个子 agent 协作。周一 cron 触发 main agent 召集周会，4 个子 agent 全员参与按议题动态加权发言，main 不表决，只整理会议纪要并落地为后续一周的定时任务。

子 agent 起步直接 fork [agency-agents-zh](https://github.com/jnMetaCode/agency-agents-zh) 项目的 .md prompt 文件（marketing/ 与 support/ 部门），后续在各 agent 的 **SOUL（核心使命）/ IDENTITY（身份与记忆）** 段加业务 prefix（项目背景、品牌调性、平台规则）做本地化。

### 5 角色 + 议题动态加权

| 角色 | Agent | 高权重议题 |
|---|---|---|
| 主持 | `main agent`（OpenClaw 自研） | 议题设置 / 议程调度 / 纪要整理（不参与表决） |
| 文案选题 | `marketing-content-creator` | 选题生成、笔记文案 |
| 平台运营 | `marketing-xiaohongshu-operator` | 种草路径、爆款公式、效果调优 |
| 内容策略 | `marketing-xiaohongshu-specialist` | 生活方式叙事、趋势捕捉、社区语境 |
| 数据分析 | `support-analytics-reporter` | 上周数据回顾、KPI 归因、效果预判 |

权重按议题**动态调整** — 讨论某篇笔记怎么写时 `content-creator` 权重最高；分析某项数据归因时 `analytics-reporter` 权重最高。加权后没有过半 → **人工实时裁决**（运营在线参与会议）。

### 7 天周期运转

```
周一上午 ─── cron → main agent 召集周会
              ├─ analytics-reporter 主导回顾上周数据
              ├─ 4 agent 加权讨论本周选题 + 内容方向
              └─ 产出会议纪要(本地 markdown) + 本周发布 cron 安排(两天一更)

发布日 (按纪要) ─── cron → 单 agent 写完整笔记
                  └─ Playwright 保存到草稿箱(不直接发)
                  └─ 人工审核 → 手动点发布

每天 ────── cron → 互动引流
              └─ 搜索目标话题相关笔记
              └─ 自动点赞 / 评论 → 在相关话题下增曝光
              └─ 被评论用户点进账号 → 自然流量回流
```

### 会议纪要 schema

本地 markdown 存档，**双读者**（下一轮 agent + 人工审核都看）：

- **顶部 YAML frontmatter**：结构化 KPI 数字（上周笔记数 / 互动率 / 引流转化等）
- **H2 段**：议程 / 上周数据回顾 / 本周选题清单 / 排程 / 互动引流 / 风控
- **完整对话留底**：每个 agent 的原始发言 + 人工裁决的决策痕迹全部保留，作为审计 trail

### 执行层

全程不调用平台开发者 API，通过 Playwright 驱动真实浏览器执行所有操作（搜索 / 点赞 / 评论 / 草稿提交）。Session 持久化复用 + 针对页面频繁改动的语义化定位策略 + 异常重试 + 频率上限控制。

### 设计要点

Prompt 工程拆成 **"集体讨论 → 个体执行"两阶段** — 运营策略沉淀在会议纪要里，发布动作交给定时任务。讨论与执行解耦带来的好处：策略可审计（完整对话留底）、cron 任务可追溯到当周纪要、人工审核环节天然嵌入。
