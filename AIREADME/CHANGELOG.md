# CHANGELOG — maxwell-homepage
<!-- 版本史，倒序，append-only。为何→DECISIONS；未来→ROADMAP；commit 流水→git；踩坑→MEMORY。 -->

> 迁自仓库根 `CHANGELOG.md`（Keep a Changelog 风格）+ 补齐 v2.3 / v2.4。理由链 DECISIONS，运行时踩坑见 MEMORY。

## v2.9.0 · 2026-06-14
- Added: 外部 RAG vault 新增 `hdu` 源，纳入本科教育与毕业设计资料，归入 personal 类别。
- Added: 化身增加骑行表现与身体数据回避护栏，明确任职过的单车旅游公司不是个人竞技战绩，禁止估算或编造数字 → ADR-013。

## v2.8.0 · 2026-06-05
- Added: 当前雇主与内部项目的纵深隐私防御。私有 frontmatter 在 scan/build 双侧整源排除，build 增加 chunk 与 source 兜底，route 与 system prompt 增加运行时拒答。
- Security: 敏感词和私密 slug 改由 gitignore 的 `.env.local` 注入，公开源码只保留通用机制和变量名 → ADR-012。

## v2.7.0 · 2026-05-28
- Changed: projects 板块重构 11→9 项 → ADR-011。两组合并并保留旧 slug 不改 URL：`maxwell-homepage` 收编 worklog 成「个人知识系统」（worklog 输入引擎 + maxwellii.com 输出界面）；`xhs-agency` 收编 xiaohongshu-tool 成「小红书自运营系统」（`wiki_slug` 改指 `xiaohongshu-tool` 抽 worklog fact）。
- Removed: 删 `ai-knowledge` + `worklog` 两个独立详情页（git rm `site/data/projects/` + ssh 删服务器 `public/p/`）。
- Added: nginx `location ^~ /p/ { try_files $uri =404 }`，删除项详情页旧 URL 真 404 不 redirect（避免 `location /` 的 SPA fallback 把删除页兜成首页 200）。
- Fixed: P0 泄露，某 worklog 求职项目改名后 RAG source 黑名单正则（hardcode 旧名）静默失效，致少量求职 chunk 漏入索引；补新名条目堵回（见 MEMORY / ADR-003）。
- Changed: `embeddings.json` 重建 ~2178 chunks（projects 重构后，原 ~2339）。

## v2.6.0 · 2026-05-26
- Changed: 简历真相源迁至 worklog（`wiki/job/me/resume/`，worklog 成单一真相源）；chat-api `loadResume()` 的 `RESUME_PATH` 改读 worklog 那份（主源通道直读，绕过 `wiki/job` 排除，无需白名单）→ ADR-010。
- Removed: 仓库根 `MaxwellLi-AIProductManager.{md,html,pdf}` + 整个 `versions/`（git rm；worklog 已存全量副本）。README / AIREADME 中简历引用同步更新。
- Removed: `ai-knowledge` 移出 RAG 源（项目归档，scan-sources.mjs 不再索引该目录；build-embeddings/rag.ts 残留 category 为无害死键，待下次重构清）。

## v2.5.0 · 2026-05-24
- Changed: chat-api LLM 上游由 newapi-proxy 中转**切回直连火山方舟 Ark**（`/api/coding/v3`，OpenAI 兼容，`ark-` key）→ ADR-009（取代 ADR-004）；`doubao-seed-2.0-lite` 加 `thinking:{type:"disabled"}` 关深度思考（reasoning 245→0，TTFT / 成本降）。
- Fixed: 绕过 newapi v2 embedding 渠道「暂不可用」阻塞（直连 Ark 原生支持 `doubao-embedding-vision`）。
- Removed: `NODE_TLS_REJECT_UNAUTHORIZED=0`（Ark 公网有效证书，不再需要关 TLS 校验）。

## v2.4.0 · 2026-05-19
- Changed: chat-api LLM 上游切到自建 newapi-proxy 中转站（IP 直连自签，OpenAI 兼容）→ ADR-004；env 变量 `VOLCANO_*`/`NEWAPI_*` → `CHAT_LLM_*`（避 shell rc 污染）→ ADR-005；chat 模型 → `deepseek-v4-flash`（2026-05-21 再切 `doubao-seed-2.0-lite` → ADR-007）。
- Added: P0 隐私 4 层防御阻断求职/面试内容外泄（server prefilter + system-prompt 输出前过滤 + LLM judge 强制 exclude + chunk/整源黑名单）→ ADR-003。
- Removed: RAG 源排除 worklog `diaries` 整源 + `wiki/job` 整目录（公司情报/面试录音/求职笔记）。
- Fixed: V2 `/help` 命令描述对齐 V1 section 注释 + 删过时 hint；token-hud 不写死模型名，由 SSE `meta.model` 动态填充。

## v2.3.0 · 2026-05-12
- Fixed: TTFT 战役 —— 首 token 24s → 4.6s（-80%）；修 RAG 同源 chunk 刷屏（加 `perSourceMax=2`）。
- Changed: 模型 `doubao-seed-2.0-pro` → `deepseek-v3.2`（非 reasoning，更快）；RAG `topK` 20→12、`perCategoryMax` 8→4。

## v2.2.0 · 2026-05-10
- Added: chat-api RAG vault（独立 Obsidian Vault，~407 .md，仓库外不入 git）→ ADR-002；4 脚本（build-embeddings / scan-sources / migrate-to-vault / rag-search）；4 大类多源平衡 SOURCE_CATEGORY；file-level LLM 脱敏 + KEEP 白名单；方案文档 `chat-api/docs/RAG-VAULT-MIGRATION.md`；site CSP 兼容（reveal.js + detail-init.js）。
- Fixed: system-prompt 核心事实（7 猫 2 狗 + 姓名等价）+ 项目聚焦 10 个 AI 项目 + 常识题 fallback + 禁止伪造第三方产品归属 hard rule；chat 流式滚动 + IME composition + Markdown 渲染重写。
- Changed: 模型 `doubao-seed-2.0-lite` → `doubao-seed-2.0-pro`；max_tokens 800→2000、单条 2000→8000 字、历史 12→20、rate 10→20/min。
- 安全（千野 P0+P1）: nginx 4 安全头（CSP/XFO/XCTO/RP）→ ADR-008；mdInline 链接 scheme 校验防 javascript:；防伪造对话历史注入（方案 D）+ 代码边界 B；token-hud 改 replaceChildren+textContent；deploy.sh 严格 build 失败检查。

## v2.1.0 · 2026-05-10
- Added: LLM 化身对话端到端上线（chat-api 接入主页右下对话框）；Token HUD（Context bar + token 累计）；部署方案 C（V2 占主域 / V1→/v1/ / 详情页共享）→ ADR-001。
- 安全: LLM 话题护栏 + prompt injection 黑名单 + 三层限流（per-IP 10/min·100/day·global 5000/day）。

## v2.0.0 · 2026-05-09
- Added: maxwellii.com V2 redesign（Claude CLI 风对话框 + 眼镜 emote 系统）；chat-api 后端（Next.js 16 + 火山方舟 doubao）；V1/V2 数据共用方案 B（`site/data/home-data.js`）。

## v1.10.0 · 2026-05-09
- Changed: 主页 ls v3（slug + name_zh + 一句话 desc 三层 stacked）；项目排序原则（live 上线倒序 / active 求职亮点手排）；`xhs-5agent-pipeline` → `xhs-agency` 改名 + Multi-Agent Roundtable 重写。
- Added: 详情页 markdown 渲染升级（H3 / 表格 / fenced 代码块）；maxwell-homepage 自身加入主页 ls。

## v1.9.0 · 2026-05-09
- Changed: 仓库 `Maxwell-Resume` → `maxwell-homepage`（职责从「简历仓库」扩展为「个人主页 + 简历归档」，GitHub 自动 redirect 旧 URL）。
- Added: 项目双名规范 v2（11→9 项 + frontmatter slug/name_en/name_zh/wiki_slug）；CSS 缓存策略（nginx must-revalidate）；历史 URL 301 redirect 兜底。

## v1.0.0 · 2026-05-08
- Added: maxwellii.com 个人主页正式上线（终端体设计：bash 隐喻 + CRT 扫描线 + 朱砂方印）；二级详情页系统（零依赖 Node 构建器 `site/build.js`）→ ADR-006；简历定位升级为 AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师。

## v0.x · 2024-11 ~ 2026-05（简历归档时期）
- 按定位演进的简历多版本：2018-05 DevOps Engineer（华为转 Nokia）→ 2024-11 DevOps → 2024-12 Product Manager（Nokia 离职转型）→ 2026-03 技术负责人/AI 工程化 → 2026-04 + OpenClaw 实战专家 → 2026-05 AI 产品经理/AI 落地顾问/Vibe Coding。详见 worklog 简历归档（2026-05-26 迁出本仓库）。
