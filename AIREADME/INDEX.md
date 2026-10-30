# maxwell-homepage · AIREADME
> 李越男 (Maxwell) 的个人主页：终端体静态站 maxwellii.com（V1 简介 / V2 LLM 化身对话）+ chat-api RAG 后端 ｜ 生命周期: active
> last-synced: 219aace · 2026-10-30

<!-- 路由器：只指路，不放实质内容。INDEX 不列自己。符号：✅已填 / ⚑占位 / —N/A -->

## 状态
| 文件 | 状态 | 摘要 |
|---|:--:|---|
| CORE | ✅ | 身份=个人品牌主页 + 可对话 AI 化身；红线 = key/PII/求职面试/雇主机密绝不外泄 |
| RELATIONS | ✅ | 文本→Qwen、embedding 暂留 Ark；build→worklog；北京 edge 指向属主；DNS→阿里云 |
| SPEC | ✅ | chat-api HTTP/SSE 契约 + 站点 URL 路由 + 详情页数据 frontmatter 契约 |
| ARCHITECTURE | ✅ | 2 组件（site / chat-api）+ hdu RAG 源 + 分层隐私防御 + 禁改项 |
| DEPLOYMENT | ✅ | 阿里云 DNS 已迁移，备案期间域名暂停；北京 IP:18080 保留，旧机保留 |
| PRD | ✅ | 个人品牌 + 可对话化身；求职=隐含价值主张、具体材料明确排除 |
| ROADMAP | ✅ | Now=Qwen 文本迁移 + 公开画像与隐私；Next=Embedding 独立迁移与通用 API 凭证 |
| CONVENTIONS | ✅ | kebab-case slug / 双名 frontmatter / 敏感词只走 env / RAG 本地产物不入库 / CSP 无 inline |
| DECISIONS | ✅ | 23 条 ADR，含阿里云备案与 DNS、独立 IP 隔离、北京候选及隐私边界 |
| MEMORY | ✅ | 18 条事故，含安全组未放行、SNI 重置、备案拦截与 Caddy capability |
| CHANGELOG | ✅ | 1.0 → 3.1.0，另含 Qwen、迁移回退、北京 IP 入口及阿里云 DNS 暂停方案 |

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

## 定向更新 · 2026-10-30

本日初次迁移快照：新 ECS 候选环境已部署，静态文件与旧索引一致；切域名后因上游 SNI 握手重置出现 525，主域和 www 已回退旧机并恢复 200，原有服务未变。当时待核查备案、接入与拦截状态，未声明迁移完成；后续变化见下文。

同日补验 8443：同域名公网 TLS 仍被重置，测试监听已撤回，没有修改 Cloudflare 规则或 DNS。细节见 MEMORY，当前部署状态见 DEPLOYMENT。

同日改迁北京：Docker 候选与独立回环 HTTPS 验收通过，共享网关配置和原有进程未变；杭州本次新增资源已在离机备份校验后清理。公网 HTTP 已明确返回备案拦截，当前仍由旧生产服务，尚未进行北京公网切换。部署、清理与后续接入条件见 DEPLOYMENT。

同日独立 IP 接入：用户在云侧放行 TCP 18080 后，北京通过独立 HTTP 入口提供公开页面和在线对话，管理日志与内部资源继续隔离。域名、共享网关和既有服务不变；IP 可访问不代表域名 HTTPS 迁移完成，当前入口与回滚方式见 DEPLOYMENT。

同日 DNS 与备案方案更新：用户决定迁入阿里云 DNS，备案期间域名离线。权威 NS 已迁移并多层读回确认，主域与 `www` 的北京 A 记录保持暂停；三个停用子域不恢复，旧服务器和北京 IP 入口保留。同账号已有变更备案在审核，主页备案尚未提交，可信 HTTPS 尚未上线。此状态取代上文“当前仍由旧生产服务”的历史快照，详情见 DEPLOYMENT 与 ADR-023。

本轮迁移实现提交为 `219aace`，同步锚点覆盖至该提交。提交前静态站隔离构建、后端 lint/build、Shell/Node 语法、token 清空合成样例、北京 Compose 与 Caddy 配置校验通过。本轮提交不触发重新部署、RAG 重建或启用域名解析。
