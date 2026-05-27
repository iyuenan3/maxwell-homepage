---
slug: xhs-agency
name_en: "Xiaohongshu Self-Ops System"
name_zh: "小红书自运营系统"
status: active
since: 2025-03-12
links:
  url: ""
  source: https://github.com/iyuenan3/xiaohongshu-tool
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: xiaohongshu-tool
stack:
  - electron
  - go
  - typescript
  - react
  - playwright
  - sqlite
  - openclaw
---

## README

一条从「内部工具」到「独立 SaaS」的产品演化线，两个阶段由同一个核心问题驱动：如何让一个人高效运营小红书账号。

**第一阶段（前司全境骑行内部，2025-03）**：用 OpenClaw 搭建 Multi-Agent Roundtable 系统。5 个 Agent 角色（主持 + 文案 + 平台运营 + 内容策略 + 数据分析）以周会制运转：周一 cron 触发主持 Agent 召集周会，子 Agent 按议题动态加权发言，加权后没过半则人工实时裁决，会议纪要作为下一周执行任务的输入。执行层通过 Playwright 驱动真实浏览器完成发布、互动、数据采集，全程不调用平台 API。单人运营从每日 2 到 3 小时降至每周 1 小时规划统筹。

这一阶段最关键的架构认知：从线性流水线（文案 → 图片 → 发布 → 互动，串行、上游出错下游全堵）演进到 Roundtable 的核心价值，不是「5 个 Agent 比 1 个聪明」，而是「协作模式匹配业务颗粒度」。文案和图片强耦合，拆成两个 Agent 反而增加上下文传递损耗，该合并；互动引流是独立任务，可以安全并行。

**第二阶段（离职后独立产品化，2026-05 起）**：把这套方法论做成 Electron 桌面应用 xhsPilot。把 Go 语言的 xiaohongshu-mcp 开源项目 vendor 内嵌，通过 CDP attach 模式让 Go 进程与 Electron 共享同一个 Chromium 实例的 cookie 和页面状态，用户不需要装 Docker 或配环境，双击安装即用。AI 侧从 BYOK 直连调整为自营 newapi 中转，用户输入激活码即获得 LLM 配额。激活码授权系统（Ed25519 签名 + machine_id 绑定）、工作流引擎（定时任务 + 风控抖动 + 错误矩阵）、证书 pinning 是三个技术亮点。14 个工具覆盖内容发布、互动、数据采集全链路，当前 v0.8.1 待公测。

两个阶段合起来是一条从业务痛点到产品抽象的完整路径：第一阶段验证场景可行性和核心架构，第二阶段把验证过的模式打包成用户可直接安装的商业产品。

## NOTES

- **Roundtable 架构的价值是「解耦策略和执行」**：早期线性流水线的真正问题不是 Agent 能力不足，而是出错传播（文案 Agent 生成了不满意的内容，整条链路从头重跑）。Roundtable 把会议纪要作为策略层的物化输出，执行层的 cron 任务只读纪要执行。这种解耦让人工质量审核能在策略层介入，而不是在每个执行步骤都守着。

- **产品化的核心判断：门槛比功能重要**：第一阶段的技术能力已覆盖普通运营者的核心需求，但 Docker 加 Go 加 cron 的安装成本在推广中是最大阻力。第二阶段的决策不是「加功能」而是「降门槛」：从「能用」（需技术背景）到「就能用」（双击安装）。这是为什么选 Electron 而非 Web 应用或 CLI（完全本地化，零云依赖，隐私承诺更强）。

- **CDP attach 模式比 launcher 模式难但值得**：让 Go 子进程 attach 到 Electron 已启动的 Chromium，工程难度显著高于 Go 自己 launch 一个新浏览器（需要 CDP 握手、webSocketDebuggerUrl 协商、attach 后避免关掉用户窗口等一系列踩坑），但带来 cookie 共享、UI 可见（用户能看到 AI 在操作什么）、进程级隔离三个收益，直接支撑了产品的核心用户承诺。

- **从 BYOK 到 LLM 中转的方向翻转**：最初方案是完全本地化 BYOK（用户自带 API key，零云依赖，一次性买断），后引入自营 newapi 中转变为 LLM 月费模式。看似增加了云依赖，实际是把「找 LLM 供应商、申请 key、充值」这道对非技术用户极高的门槛内化到产品里，是「零配置激活」对「完全本地化」的取舍，最终选择用户体验优先。
