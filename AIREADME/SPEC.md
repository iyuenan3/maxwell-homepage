# SPEC — maxwell-homepage
<!-- 对外契约：别人集成你需要的精确接口。不写实现(→ARCHITECTURE)/为何这么设计(→DECISIONS)。 -->

> 本项目对外面有三类契约：① chat-api HTTP/SSE API（程序契约）② maxwellii.com 站点 URL 路由 ③ 详情页数据 frontmatter（内容编辑契约）。

## ① chat-api API

### 端点
- `POST /api/chat` —— 主对话，SSE 流式。经 nginx 反代 `127.0.0.1:3002`（`proxy_buffering off` + `read_timeout 300s`）。线上 `https://maxwellii.com/api/chat`。
- `OPTIONS /api/chat` —— CORS 预检，返回 204。
- `GET /admin/logs?token=<ADMIN_TOKEN>` —— 私有日志查看页（Next.js 页面，nginx `^~ /admin/` + `^~ /_next/` 反代到 :3002）。

### 鉴权
- `/api/chat`：无鉴权（公开化身），靠限流 + prefilter 防滥用。
- `/admin/logs`：query `token` 必须等于服务器 `.env.local` 的 `ADMIN_TOKEN`；每天北京时间 7:00 cron 清空 token（`clear-admin-token.sh`），续期跑 `/admin-url` 流程。

### CORS 白名单
`https://maxwellii.com` · `https://www.maxwellii.com` · `http://localhost:4567` · `http://localhost:8080` · `http://127.0.0.1:4567`（其余 origin 回落到第一个）。

### 请求体（POST /api/chat）
```json
{ "messages": [ { "role": "user"|"assistant", "content": "string" }, ... ] }
```
约束（违反 → 400 `invalid_messages`）：每条 `content` ≤ 8000 字符；`messages` 长度 1–20；最后一条必须 `role: "user"`。服务端只保留最后 20 条。

### SSE 响应事件（`text/event-stream`）
| 事件 | 含义 |
|---|---|
| `data: {"delta":"<token>"}` | 流式 token 增量 |
| `data: {"meta":{"input_tokens","output_tokens","total_tokens","cached_tokens"?,"model"}}` | 末段用量；`model` 字段驱动前端 HUD 动态显示（前端不 hardcode 模型名）|
| `data: {"meta":{"input_tokens":0,"output_tokens":0,"blocked":true}}` | 被 prefilter 拦截的固定文案回复 |
| `data: {"error":"stream_error"}` | 流中途错误 |
| `data: [DONE]` | 终止符 |

### 0-token 硬拦截（返回 SSE 固定文案，不打 LLM）
- **prompt injection** 命中 → "我只能聊 Maxwell 相关的话题。"（日志 `blocked:"injection"`）。
- **求职 / 面试 / 谈薪** 命中 → 引导邮件联系的固定文案（日志 `blocked:"job_interview"`）。
- **当前雇主 / 内部项目探测** 命中 → 中立拒答，不确认在职状态（日志 `blocked:"employer"`）。
- 通用关键词表在 `route.ts`；雇主机密词由 `.env.local` 注入。**按隐私红线不在此转抄真实值**。

### 错误码（JSON，非 SSE）
`429 rate_limited` / `429 rate_limited_daily` / `503 service_busy`（全局）/ `400 invalid_json` / `400 invalid_messages` / `500 server_misconfigured` / `502 upstream_error`。

### 配额 / 限流（in-memory，per-process）
per-IP 20/min（429）· per-IP 100/day（429）· global 5000/day（503）。

### 运行时参数（contract-relevant）
模型 = env `CHAT_LLM_MODEL`（当前 `deepseek-v4-flash`，方舟实际解析为 `deepseek-v4-flash-ga-260731`）· `thinking disabled` · `temperature 0.7` · `max_tokens 2000` · RAG `topK 12` / `perCategoryMax 4` / `perSourceMax 2`。上游为 OpenAI 兼容 `chat/completions`（`stream:true` + `stream_options.include_usage`）。

## ② 站点 URL 路由（nginx）
| 路径 | 内容 |
|---|---|
| `/` | V2 化身对话主页（主域，方案 C）|
| `/v1/` | V1 简介模式主页 |
| `/p/<slug>.html` | 11 个项目详情页（主页精选 9 个 + 历史归档 2 个，V1+V2 共享）|
| `/api/chat`、`/admin/`、`/_next/` | 反代 chat-api :3002 |
| 4 条 301 redirect | 旧 URL 兜底：`ai-knowleage→ai-knowledge` / `openclaw-customize-skills→openclaw` / `ifind-agent→claude-financial-research` / `xhs-5agent-pipeline→xhs-agency` |
| 删除项 `/p/*.html` | 已删详情页（ai-knowledge / worklog）经 `location ^~ /p/ { try_files $uri =404 }` 真 404，不 redirect（上面精确 redirect 优先级更高仍生效）|
| 子域 | `naming.maxwellii.com`（取名 SaaS）/ `tale.maxwellii.com`（多人小说 H5）—— 独立产品，非本仓库 |

## ③ 详情页数据 frontmatter 契约（编辑详情页时遵守）
`site/data/projects/<slug>.md` frontmatter 必备：
```yaml
slug: <kebab-case>            # = 文件名，URL + 内部代号
name_en: "Brand · Positioning"
name_zh: "品牌 · 定位"
wiki_slug: <worklog wiki 文件名 or "">   # 关联 worklog（见 RELATIONS），空则不抽 wiki
status: live|active|archived|planned|paused
commands: [readme, links, ...]   # 渲染哪些组件（见 ARCHITECTURE 组件表）
stack: [...]                     # STACK 组件数据
links: { url: ..., source: ... } # LINKS 组件数据；值 "private" 渲染为 private
rag_exclude: true               # 可选；详情页仍可发布，但不进入 RAG
```
body 用 `## README` / `## NOTES` / `## DECISIONS` / `## STATS` / `## HISTORY` 等 H2 段对应组件 output。改完 `bash site/deploy.sh` 一键发版。

## 版本 / 兼容
- chat-api SSE 事件格式 + `meta.model` 字段是前端（chat.js / token-hud.js）依赖的契约，改字段名需同步前端。
- 详情页 frontmatter 改 `slug` / `wiki_slug` 字段名 = breaking（build 读不到）。
- 版本史见 CHANGELOG（当前 v3.0.0）。
