---
slug: petslog
name_en: "PetsLog · Pet Health Companion"
name_zh: "PetsLog · 宠物健康伴侣"
status: active
since: 2026-04-08
links:
  v1 codebase: https://github.com/iyuenan3/Cursor-PetsLog
  v2 codebase: https://github.com/iyuenan3/OpenClaw-PetsLog
commands:
  - readme
  - links
  - decisions
  - history
  - stats
  - stack
  - notes
wiki_slug: ""
stack:
  - vue 3
  - uni-app
  - 微信云开发
  - 阿里云百炼
  - claude-code
---

## README

多宠家庭 AI 健康记录工具，起源是真实生活痛点：家里养 7 猫 2 狗，看病时医生问病史答不上来，记事本和 Notion 都太重，急救场景下连录入都来不及。

三代范式演进，真实痛点没变过。v1（2025.09，Cursor 加 uni-app 加 uniCloud）4 小时跑通 MVP，零代码零测试用例，上线后内测，因 uniCloud 空间未续费下线。v2（2026.01，OpenClaw 重构）以同一需求为载体系统学习单 Agent 长期记忆机制与多 Agent 分工协作，交付 8000 行/32 E2E/38 份 docs/双端加 CI/CD；v2 本质是学习实验，38 份 docs 大半是学习过程的副产物。v3（2026.04，文档阶段）保留 uni-app 加微信云开发的应用形态，把"选宠物-选日期-填表"改为一句自然语言或语音，阿里云百炼 LLM 自动提取宠物身份/事件/体重/用药字段归档到时间线。

LLM 在 v3 中严格定位为"结构化提取机器"，强制 JSON 输出，不开聊天入口，加前端防呆和频率限制，规避滥用风险。Claude Code 作为 v3 编码工具。

## NOTES

- **三次重构没改变需求，每次是工具的解析力上限抬高**：Cursor 让"不会写代码"变为可能（4 小时 MVP），OpenClaw 让"不写测试"变为可能（32 E2E 自动跑），Claude Code 加阿里云百炼让"不需要表单"变为可能。每代工具上限抬高一档，上一代就显得过度工程。这个项目本身是 AI 工具演进的活样本。

- **v2 是学习实验，不是重构代价**：用真实需求反复重构的目的是搞清两件事，单 Agent 长期记忆如何持久化与召回（把项目状态/设计决策/未完成任务交给 Agent 自己管），多 Agent 如何分工（agency-agents-zh 角色库加 agency-orchestrator YAML/DAG 编排，产品/前端/测试/部署 Agent 流水线作业）。38 份 docs 是这个学习过程的副产物，不是交付负担。

- **v3 的范式反思**：AI 时代真正的杠杆不是减少代码量，而是重新定义用户与系统的交互界面。传统小程序录入分了 4-5 层 UI，急救场景下根本操作不来；v3 把录入这一步彻底改为自然语言，Vue/uni-app/云函数/路由这些工程基础设施仍然必要，被简化的是"用户与表单的交互层"。独立开发者的杠杆在这里。
