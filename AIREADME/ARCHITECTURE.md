# ARCHITECTURE — maxwell-homepage
<!-- 内部结构 + 不能动什么。决策理由→DECISIONS(这里只放结论+链接)；对外契约→SPEC。 -->

## 组件 + 数据流

仓库 = 2 个组件（简历产物 2026-05-26 已迁 worklog，见本节末尾）：

### 1. `site/` —— maxwellii.com 静态主页（纯前端，零运行时依赖）
- **V1 简介模式**：`data/home-data.js`（whoami / git log / ls projects / pets / stack / history 真相源）+ `templates/home.html` → `build.js buildHome()` → `public/index.html`。
- **V2 化身对话模式**：`v2-redesign/`（index.html + styles.css + chat.js + commands.js + token-hud.js + emotes.js + reveal.js），含终端壳 + chat 框 + Token HUD。
- **详情页**：`data/projects/<slug>.md`（11 个，主页精选 9 个 + 历史归档 2 个）+ `templates/_base.html` → `build.js buildOne()` → `public/p/<slug>.html`。
- **构建器 `build.js`**：纯 Node 零依赖。自实现 frontmatter/YAML 子集解析 + markdown→HTML（段落/列表/行内/H3-H6/表格/fenced 代码块）+ `parseSections`（按 H2 切，支持中文 H2）。11 个组件渲染器：`readme` / `links` / `git_log` / `decisions` / `stats` / `notes` / `next`(废弃保留) / `stack` / `ps` / `history` / `timeline`(预留)。详情页板块覆盖约定见 CONVENTIONS。
- **可选读 worklog wiki**：`git_log`/`decisions`/`stats`/`ps` 组件按 `wiki_slug` 从 worklog 抽 fact（数据契约见 RELATIONS / SPEC）。

### 2. `chat-api/` —— LLM 化身后端（Next.js 16 + React 19，API-only）
- **运行时**（`src/app/api/chat/route.ts`）：3 层限流 → injection prefilter → 求职/面试 prefilter（P0）→ 雇主机密 prefilter（P0）→ RAG 检索（embed query → cosine retrieve）→ `buildSystemPrompt(context)` → 火山方舟 Ark `chat/completions`（stream，thinking 关）→ SSE 转发 + usage 解析 + `chat-logger` 落日志。RAG 失败降级为空 context 不中断。
- **system-prompt**（`src/app/api/chat/system-prompt.ts`）：12 段防御 prompt（身份 / 9 个主页精选项目 + 2 个历史归档详情 / 常识题 fallback / 禁止伪造归属 hard rule / 核心事实 7 猫 2 狗+姓名等价 / 回复风格 / 项目聚焦 / 范围含代码边界 B / 防 RAG 污染 / 防伪造历史 / 防 injection / [context] 段）。「输出前最后过滤」段在 [context] 前、凌驾所有规则。
- **lib**：`embed-client.ts`（OpenAI 兼容 embedding client）/ `rag.ts`（运行时 cosine + perCategoryMax/perSourceMax）/ `rate-limit.ts`（in-memory）/ `chat-logger.ts`（按 IP 分文件 JSONL）。
- **离线 RAG 管线**（`scripts/`，本地跑）：`scan-sources.mjs`（LLM judge 各源文件 P/V 隐私分级 → `manifest.json`）→ `build-embeddings.mjs`（chunk + sanitize + 4 层求职过滤 + embed → `embeddings.json`）。调试：`rag-search.mjs`。judge/sanitize 模型 = `doubao-seed-2.0-pro`（与 runtime chat 模型分离）。管线严格 fail-closed：任何 fresh judge/read 错误都会阻止 reindex，任何 sanitize 错误都会阻止 embedding；`AccountQuotaExceeded` 立即失败，不做无收益长退避或单条 fallback。脱敏并发固定为 5，并对瞬时连接错误做 5 次有界退避。成功脱敏结果按模型、prompt 与原文内容哈希写入 gitignored 的 `data/sanitize-cache.json`，网络失败或中断后只补未完成 chunks；输入或规则变化会自动 cache miss。

**RAG 数据流**：
```
maxwell-rag-sources/ (独立 Obsidian Vault, 不在 git, 含 hdu 等经过筛选的源)
  + worklog/ (excludeRelpaths: diaries, wiki/job)
  + 简历(worklog wiki/job/me/resume) / site/data/home-data / site/data/projects / worklog wiki:projects
   ↓ scan-sources.mjs   (LLM file-level judge + P0 禁区规则 → manifest.json)
   ↓ build-embeddings.mjs (chunk 1200-1800 + sanitize KEEP 白名单 + 4 层求职过滤 + embed)
  chat-api/data/embeddings.json   (2048 dim, gitignore, 数量与体积随索引重建变化)
   ↓ deploy.sh rsync
  服务器 /home/admin/maxwellii-chat-api/data/embeddings.json
   ↓ PM2 加载 → route.ts 运行时检索
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

## 关键技术选型（结论 + 链 DECISIONS）
- **部署方案 C**：V2 占主域 / V1 退 `/v1/` / `/p/` 共享 → ADR-001。
- **RAG 独立 Obsidian Vault**（仓库外，不入 git）→ ADR-002。
- **求职内容 4 层防御**（单层 system-prompt 不足）→ ADR-003。
- **LLM 上游：直连火山方舟 Ark**（曾 newapi-proxy 中转，2026-05-24 切回直连）→ ADR-009（取代 ADR-004）。
- **env 变量 `CHAT_LLM_*` 前缀**（避开 shell rc 污染）→ ADR-005。
- **build.js 纯 Node 零依赖**（详情页无 npm 包）→ ADR-006。
- **chat 模型 deepseek-v4-flash**（方舟实际解析为 `deepseek-v4-flash-ga-260731`，替代 doubao-seed-2.0-lite）→ ADR-015（取代 ADR-007 的当前模型结论）。
- **CSP `script-src 'self'` 无 inline script** → ADR-008。

## 禁改项 / Forbidden Refactors
- **CSP 兼容硬约束**：禁止写 inline `<script>`。初始化脚本提取到外部 .js（`reveal.js` / `detail-init.js`）。`detail-init.js` 被 V1 主页 + 详情页（`../`）共用，**根目录 + `/v1/` 两处都必须部署到位**，任一 404 → 该路径页面整页空白（deploy.sh Stage 4+5 已串好）。
- **终端隐喻 / 文案禁动**（HANDOFF 设计边界）：bash 隐喻不能换（titlebar `~/iyuenan3 — bash`，不写 zsh）；文案不要"优化"润色；有禁词清单（私人生活类词，见 CONVENTIONS）。
- **前端不 hardcode 后端参数**：模型名由 SSE `meta.model` 动态填，不写死。
- **system-prompt 防御段不删**：防伪造历史 / 防 injection / 求职过滤 / 雇主机密过滤 / 骑行数据回避 / 禁止伪造归属 hard rule，改 prompt 不能删这些。
- **4 层求职过滤的关键词列表 4 处必须同步**（route.ts / system-prompt.ts / scan-sources.mjs / build-embeddings.mjs）。
- **nginx.conf 是唯一权威**：所有 location 块必须完整保存在仓库（曾因整 server 块覆盖丢掉 `/api/chat` 导致 405，见 MEMORY）。
- **sanitize KEEP 白名单**（本人 7 写法 + 9 宠物名 + 公开公司）绝不脱敏。
