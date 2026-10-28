# maxwell-homepage · AIREADME
> 李越男 (Maxwell) 的个人主页：终端体静态站 maxwellii.com（V1 简介 / V2 LLM 化身对话）+ chat-api RAG 后端 ｜ 生命周期: active
> last-synced: 5c7be54 · 2026-10-28

<!-- 路由器：只指路，不放实质内容。INDEX 不列自己。符号：✅已填 / ⚑占位 / —N/A -->

## 状态
| 文件 | 状态 | 摘要 |
|---|:--:|---|
| CORE | ✅ | 身份=个人品牌主页 + 可对话 AI 化身；红线 = key/PII/求职面试/雇主机密绝不外泄 |
| RELATIONS | ✅ | 出向：chat-api 文本→百炼 Qwen，embedding 暂留 Ark；build→worklog |
| SPEC | ✅ | chat-api HTTP/SSE 契约 + 站点 URL 路由 + 详情页数据 frontmatter 契约 |
| ARCHITECTURE | ✅ | 2 组件（site / chat-api）+ hdu RAG 源 + 分层隐私防御 + 禁改项 |
| DEPLOYMENT | ✅ | alicloud-sg(47.84.100.47)：site 静态 + chat-api PM2:3002 + 共用 nginx |
| PRD | ✅ | 个人品牌 + 可对话化身；求职=隐含价值主张、具体材料明确排除 |
| ROADMAP | ✅ | Now=Qwen 文本迁移 + 公开画像与隐私；Next=Embedding 独立迁移与通用 API 凭证 |
| CONVENTIONS | ✅ | kebab-case slug / 双名 frontmatter / 敏感词只走 env / RAG 本地产物不入库 / CSP 无 inline |
| DECISIONS | ✅ | 19 条 ADR，含 Qwen 文本迁移、Embedding 暂缓与静态履历和化身解耦 |
| MEMORY | ✅ | 14 条事故（CSP / nginx / env / SSH mux / CF 缓存 / 黑名单改名 / 双用途 home-data / 骑行数据编造 / RAG fail-closed / Ark 网络与额度 / key 轮换）|
| CHANGELOG | ✅ | 1.0 → 3.1.0，另含 pageTogether 展示与 Qwen 文本迁移的日期记录 |

## 按任务读
- 跨项目了解 → CORE + RELATIONS（+ SPEC 若要调 chat-api 或读详情页数据）
- 改架构 → ARCHITECTURE + DECISIONS
- 部署 / 运维 → DEPLOYMENT
- 加功能 / 改产品定位 → PRD + ROADMAP + CONVENTIONS
- 改 chat 化身（prompt / RAG / 隐私）→ ARCHITECTURE（数据流）+ DECISIONS（隐私·选型）+ CONVENTIONS（prompt 边界）
- 改主页文案 / 定位 → CONVENTIONS（命名·同步）+ PRD（定位语）（简历改在 worklog）

## 定向更新 · 2026-10-09

新增 pageTogether 立项展示，主页当前十项，其中一项 planned。仅审阅本轮静态展示变更，原同步锚点保留，不声明此前全部漂移已审阅。

## 定向更新 · 2026-10-28

在线对话与 RAG 审稿、脱敏迁移到 Qwen；Embedding 暂留原配置。生产公网 SSE 与 0 token 隐私拦截已验证，索引哈希不变。本次内容提交为 `5c7be54`，同步锚点记录至该提交；本轮验证覆盖模型接入与索引保持，不代表完整 RAG 已恢复。
