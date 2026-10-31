# ARCHITECTURE — maxwell-homepage
<!-- 内部结构 + 不能动什么。决策理由→DECISIONS(这里只放结论+链接)；对外契约→SPEC。 -->

## 组件 + 数据流

仓库 = 2 个组件（简历产物 2026-05-26 已迁 worklog，见本节末尾）：

### 1. `site/` —— maxwellii.com 静态主页（纯前端，零运行时依赖）
- **V1 简介模式**：`data/home-data.js`（whoami / git log / ls projects / pets / stack / history 真相源）+ `templates/home.html` → `build.js buildHome()` → `public/index.html`。
- **V2 化身对话模式**：`v2-redesign/`（index.html + styles.css + chat.js + commands.js + token-hud.js + emotes.js + reveal.js），含终端壳 + chat 框 + Token HUD。
- **详情页**：`data/projects/<slug>.md`（12 个，含 planned 与历史归档项）+ `templates/_base.html` → `build.js buildOne()` → `public/p/<slug>.html`。
- **构建器 `build.js`**：纯 Node 零依赖。自实现 frontmatter/YAML 子集解析 + markdown→HTML（段落/列表/行内/H3-H6/表格/fenced 代码块）+ `parseSections`（按 H2 切，支持中文 H2）。11 个组件渲染器：`readme` / `links` / `git_log` / `decisions` / `stats` / `notes` / `next`(废弃保留) / `stack` / `ps` / `history` / `timeline`(预留)。详情页板块覆盖约定见 CONVENTIONS。
- **可选读 worklog wiki**：`git_log`/`decisions`/`stats`/`ps` 组件按 `wiki_slug` 从 worklog 抽 fact（数据契约见 RELATIONS / SPEC）。

### 2. `chat-api/` —— LLM 化身后端（Next.js 16 + React 19，API-only）
- **运行时**（`src/app/api/chat/route.ts`）：3 层限流 → injection prefilter → 求职/面试 prefilter（P0）→ 雇主机密 prefilter（P0）→ RAG 检索（embed query → cosine retrieve）→ `buildSystemPrompt(context)` → 百炼 Qwen `chat/completions`（stream，`enable_thinking:false`）→ SSE 转发 + usage 解析 + `chat-logger` 落日志。查询 embedding 保留原 Ark 模型和独立凭证，最多等待 5 秒，失败降级为空 context 后继续 Qwen 对话。
- **system-prompt**（`src/app/api/chat/system-prompt.ts`）：12 段防御 prompt（身份 / 9 个主页精选项目 + 2 个历史归档详情 / 常识题 fallback / 禁止伪造归属 hard rule / 核心事实 7 猫 2 狗+姓名等价 / 回复风格 / 项目聚焦 / 范围含代码边界 B / 防 RAG 污染 / 防伪造历史 / 防 injection / [context] 段）。「输出前最后过滤」段在 [context] 前、凌驾所有规则。
- **lib**：`embed-client.ts`（OpenAI 兼容 embedding client）/ `rag.ts`（运行时 cosine + perCategoryMax/perSourceMax）/ `rate-limit.ts`（in-memory）/ `chat-logger.ts`（按 IP 分文件 JSONL）。
- **离线 RAG 管线**（`scripts/`，本地跑）：`scan-sources.mjs`（LLM judge 各源文件 P/V 隐私分级 → `manifest.json`）→ `build-embeddings.mjs`（chunk + sanitize + 4 层求职过滤 + embed → `embeddings.json`）。调试：`rag-search.mjs`。judge/sanitize 通过 `qwen-completion.mjs` 直连百炼，默认 `qwen3.7-plus`，关闭思考，judge 使用 JSON 输出；`migrate-to-vault.mjs` 的脱敏入口同步使用该实现。非完整结束、空内容或上游错误均阻断下游，原有 fail-closed 与额度 fail-fast 保留。脱敏并发为 5，瞬时连接错误做 5 次有界退避；成功缓存按端点、模型、关闭思考参数、prompt 与原文内容哈希区分，新 Qwen 不复用旧模型缓存。Embedding 构建仍使用原 Ark 配置，本次不重建索引。
- **模型配置**（`llm-config.mjs`）：在线与离线文本请求共用 `CHAT_LLM_API_KEY` / `CHAT_LLM_BASE_URL`；在线模型读 `CHAT_LLM_MODEL`，审稿与脱敏分别读 `RAG_JUDGE_MODEL` / `RAG_SANITIZE_MODEL`。Embedding 只读 `EMBED_LLM_API_KEY` / `EMBED_LLM_BASE_URL`，不回退到 chat 凭证，模型保持 `doubao-embedding-vision`。本项目不再维护 new-api 接入或自签证书绕过逻辑。

**RAG 数据流**：
```
maxwell-rag-sources/ (独立 Obsidian Vault, 不在 git, 含 hdu 等经过筛选的源)
  + worklog/ (excludeRelpaths: diaries, wiki/job)
  + 简历(worklog wiki/job/me/resume) / site/data/home-data / site/data/projects / worklog wiki:projects
   ↓ scan-sources.mjs   (LLM file-level judge + P0 禁区规则 → manifest.json)
   ↓ build-embeddings.mjs (chunk 1200-1800 + sanitize KEEP 白名单 + 4 层求职过滤 + embed)
  chat-api/data/embeddings.json   (2048 dim, gitignore, 数量与体积随索引重建变化)
   ↓ deploy.sh rsync
  北京 shared/data/embeddings.json（应用 data 软链指向）
   ↓ 北京 Docker 专用用户进程加载 → route.ts 运行时检索
```

**P0 隐私分层防御**（机制；具体关键词/黑名单按红线不列）：
1. server-side prefilter（route.ts，0 token 硬拦 + 日志）
2. system-prompt「输出前最后过滤」段（凌驾规则）
3. frontmatter `visibility:private` / `rag_exclude:true` 在 scan 与 build 两侧整源排除，项目详情页 loader 同样执行
4. LLM judge 强制 exclude（scan-sources.mjs，求职/面试/第三方公司 → P=R+V=L）
5. chunk filter + 整源黑名单（build-embeddings.mjs）+ worklog diaries/wiki/job 整目录排除
6. 当前雇主和内部项目的敏感词表只从 `.env.local` 注入；用户明确批准的简历任职事实可以进入静态页，但命中词表的 resume / home-data chunks 在 embedding 前仍由 universal filter 丢弃，运行时继续 0 token 硬拦
理由 + 维护点见 DECISIONS。

### 简历产物（2026-05-26 已迁出本仓库）
简历正文 + 多版本归档迁至 worklog `wiki/job/me/resume/`（worklog 成单一真相源）。chat-api 的 `loadResume()`（`build-embeddings.mjs`）改读 worklog 那份入 RAG（见 RELATIONS）；本仓库不再存 `MaxwellLi-*` / `versions/`。命名 / 编辑约定随简历归 worklog。

### 北京运行结构（域名待上线）

两个业务组件不变，运行于独立 Compose 项目：`maxwellii-site`（静态文件与 SSE 反代）→ `maxwellii-chat-api`（Next.js）。二者复用已有外部网络 `edge`，后端和管理入口只发布回环端口。站点容器另设独立公网 HTTP 监听，拒绝管理路径并重写客户端地址头后，转发到同容器私有站点入口，不经过共享网关。可选 `maxwellii-preview` 加载未来域名路由与真实证书，提供独立回环 HTTPS 验收，不承载生产流量。共享 `edge-caddy` 的配置和进程尚未改动，域名接入因备案阻断待验收。权威 DNS 已迁入阿里云，主域与 `www` 的北京 A 记录保持暂停；无代理直连上线须另配公有可信证书，现有 Origin CA 预览不能替代该验收。路径、资源限额与发布方式见 DEPLOYMENT，共享底座属主见 RELATIONS。

## 关键技术选型（结论 + 链 DECISIONS）
- **部署方案 C**：V2 占主域 / V1 退 `/v1/` / `/p/` 共享 → ADR-001。
- **RAG 独立 Obsidian Vault**（仓库外，不入 git）→ ADR-002。
- **求职内容 4 层防御**（单层 system-prompt 不足）→ ADR-003。
- **文本 LLM 上游：直连百炼 Qwen；Embedding 暂留 Ark** → ADR-019（取代 ADR-009 的文本上游结论）。
- **env 变量 `CHAT_LLM_*` 前缀**（避开 shell rc 污染）→ ADR-005。
- **build.js 纯 Node 零依赖**（详情页无 npm 包）→ ADR-006。
- **chat / judge / sanitize 默认 qwen3.7-plus** → ADR-019（取代 ADR-015 的当前 chat 模型结论）。
- **CSP `script-src 'self'` 无 inline script** → ADR-008。
- **北京以专用用户 + Docker 隔离部署，独立回环验收** → ADR-021（取代 ADR-020 的杭州部署方式）；2026-10-31 新加坡旧源站已按 ADR-024 退役，公网域名上线状态见 DEPLOYMENT。
- **北京 IP 直连仅开放独立 HTTP 端口，管理入口继续隔离** → ADR-022；该入口独立于域名和共享网关。
- **阿里云备案与 DNS 直连方案，备案期间域名离线** → ADR-023；权威 DNS 已迁移，预置记录暂停，备案与可信 HTTPS 尚未完成。

## 禁改项 / Forbidden Refactors
- **CSP 兼容硬约束**：禁止写 inline `<script>`。初始化脚本提取到外部 .js（`reveal.js` / `detail-init.js`）。`detail-init.js` 被 V1 主页 + 详情页（`../`）共用，**根目录 + `/v1/` 两处都必须部署到位**，任一 404 → 该路径页面整页空白（deploy.sh Stage 4+5 已串好）。
- **终端隐喻 / 文案禁动**（HANDOFF 设计边界）：bash 隐喻不能换（titlebar `~/iyuenan3 — bash`，不写 zsh）；文案不要"优化"润色；有禁词清单（私人生活类词，见 CONVENTIONS）。
- **前端不 hardcode 后端参数**：模型名由 SSE `meta.model` 动态填，不写死。
- **system-prompt 防御段不删**：防伪造历史 / 防 injection / 求职过滤 / 雇主机密过滤 / 骑行数据回避 / 禁止伪造归属 hard rule，改 prompt 不能删这些。
- **4 层求职过滤的关键词列表 4 处必须同步**（route.ts / system-prompt.ts / scan-sources.mjs / build-embeddings.mjs）。
- **反代配置必须完整入库**：北京使用 `ops/caddy/`，`site/nginx.conf` 仅保留旧机历史配置；所有静态路由、API / admin / Next 资源反代和 SSE 不缓冲规则必须保留，不能整块覆盖共享网关或遗漏 `/api/chat`（历史 405 事故见 MEMORY）。
- **sanitize KEEP 白名单**（本人 7 写法 + 9 宠物名 + 公开公司）绝不脱敏。
