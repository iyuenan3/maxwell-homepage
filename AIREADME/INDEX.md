# maxwell-homepage · AIREADME
> 李越男 (Maxwell) 的个人主页：终端体静态站 maxwellii.com（V1 简介 / V2 LLM 化身对话）+ chat-api RAG 后端 ｜ 生命周期: active
> last-synced: f05503d · 2026-07-30

<!-- 路由器：只指路，不放实质内容。INDEX 不列自己。符号：✅已填 / ⚑占位 / —N/A -->

## 状态
| 文件 | 状态 | 摘要 |
|---|:--:|---|
| CORE | ✅ | 身份=个人品牌主页 + 可对话 AI 化身；红线 = key/PII/求职面试/雇主机密绝不外泄 |
| RELATIONS | ✅ | 出向：chat-api→火山方舟 Ark(直连 LLM) + build→worklog(wiki 数据契约，唯一合法回读) |
| SPEC | ✅ | chat-api HTTP/SSE 契约 + 站点 URL 路由 + 详情页数据 frontmatter 契约 |
| ARCHITECTURE | ✅ | 2 组件（site / chat-api）+ hdu RAG 源 + 分层隐私防御 + 禁改项 |
| DEPLOYMENT | ✅ | alicloud-sg(47.84.100.47)：site 静态 + chat-api PM2:3002 + 共用 nginx |
| PRD | ✅ | 个人品牌 + 可对话化身；求职=隐含价值主张、具体材料明确排除 |
| ROADMAP | ✅ | Now=内容同步 + RAG 索引维护 + 隐私护栏稳态 |
| CONVENTIONS | ✅ | kebab-case slug / 双名 frontmatter / 敏感词只走 env / RAG 本地产物不入库 / CSP 无 inline |
| DECISIONS | ✅ | 13 条 ADR（方案 C / RAG vault / 分层隐私 / 直连 Ark / projects 11→9 / hdu 等）|
| MEMORY | ✅ | 8 条事故（CSP / nginx / env / SSH mux / CF 缓存 / 黑名单改名 / 公开仓敏感词 / 骑行数据编造）|
| CHANGELOG | ✅ | 1.0 → 2.9.1（切火山 / 简历迁移 / projects 11→9 / 雇主机密隔离 / hdu / RAG ignore）|

## 按任务读
- 跨项目了解 → CORE + RELATIONS（+ SPEC 若要调 chat-api 或读详情页数据）
- 改架构 → ARCHITECTURE + DECISIONS
- 部署 / 运维 → DEPLOYMENT
- 加功能 / 改产品定位 → PRD + ROADMAP + CONVENTIONS
- 改 chat 化身（prompt / RAG / 隐私）→ ARCHITECTURE（数据流）+ DECISIONS（隐私·选型）+ CONVENTIONS（prompt 边界）
- 改主页文案 / 定位 → CONVENTIONS（命名·同步）+ PRD（定位语）（简历改在 worklog）
