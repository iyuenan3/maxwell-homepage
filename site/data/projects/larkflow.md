---
slug: larkflow
name_en: "larkflow · Feishu-Native Collaboration DAG"
name_zh: "larkflow · 飞书原生企业协作 DAG"
status: active
since: 2026-07-23
links:
  url: ""
  source: https://github.com/iyuenan3/larkflow
  docs: https://github.com/iyuenan3/larkflow/tree/main/AIREADME
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: larkflow
stack:
  - python
  - postgresql
  - lark
  - react flow
  - dag
  - multi-agent
---

## README

larkflow 是一套飞书原生的企业协作 DAG，把人、Agent 和工具放进同一张可执行工作流图。每个节点只有一个明确的人类负责人，系统负责保存图结构、节点状态、交付物、修订和审计记录，飞书负责把任务投影到团队日常工作的入口。

产品重点不是让 Agent 代替所有人，而是把协作边界变得可见：Agent 可以生成草稿，但关键结果由负责人确认；节点发生变更时，系统可以计算影响范围并发起受控返工；每次执行都保留 attempt 与证据链，避免协作过程只散落在聊天记录里。

当前版本处于开发试用阶段，正在验证中央数据库真相源、飞书投影、草稿确认、修订与返工闭环。它不是已经完成生产验收的企业平台，公开内容只描述已经实现或正在验证的能力。

## NOTES

- **一节点一负责人**：DAG 可以包含多人和多个 Agent，但每个节点必须有唯一的人类 owner。责任不能被自动化稀释。

- **数据库是真相源，飞书是协作投影**：任务卡片、消息和文档是用户入口，核心状态仍由服务端统一结算，避免多个入口各自形成不同版本。

- **草稿与确认分离**：Agent 输出先进入可审阅的草稿态，负责人确认后才推进下游。自动化负责提速，人类确认负责承担业务判断。

- **返工必须可追踪**：修订不会简单覆盖旧结果，而是生成新的 attempt，记录影响节点、返工原因与后续状态，为复杂协作留下可审计的演化路径。
