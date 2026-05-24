# DECISIONS — maxwell-homepage
<!-- ADR，append-only，只追加不改历史。运行时事故→MEMORY。 -->

## ADR-001 · 部署方案 C：V2 占主域 / V1 退 /v1/ / 详情页共享 · 2026-05-10
- Problem: V2（化身对话）上线后，V1（简介）和 V2 都想要主域 maxwellii.com，详情页 `/p/` 两者共用。
- Constraint: 单 origin 单 nginx；不想维护两套详情页；外链不能 404。
- Decision: V2 占主域根 `/`，V1 退到 `/v1/`，`/p/` 与 `data/` 共享。deploy.sh 5 stage 实现。
- Alternatives（否决）: V2 用 v2.maxwellii.com 子域（DNS 已配但弃用，分裂主域权重）；只保留一个版本（用户想都留）。
- Tradeoff: `detail-init.js` 被 V1 + 详情页共用，要部署到根 + `/v1/` 两处，任一漏 → 整页空白（已串好 Stage 4+5）。

## ADR-002 · RAG 知识源用仓库外独立 Obsidian Vault · 2026-05-10
- Problem: 化身要 RAG 大量个人/项目笔记，但这些笔记含私密内容，且仓库是公开的。
- Constraint: 公开仓库绝不能进私密原文 + embeddings.json 太大（~78 MB）不适合 git。
- Decision: 知识源放仓库**外**独立 Obsidian Vault `~/Desktop/Claude-Project/maxwell-rag-sources/`（~407 .md，绝不入 git）；embeddings.json / manifest.json gitignore，本地 build + rsync 分发。
- Alternatives（否决）: 笔记放仓库内靠 gitignore（公开仓库 gitignore 防护不可靠，5/10 教训）；运行时抓博客（架构层面只读本地文件，更可控）。
- Tradeoff: 索引 rebuildable 但每次 `npm run update` ~30 min；vault 需独立备份。

## ADR-003 · 求职/面试内容用 4 层防御（非单层 prompt）· 2026-05-19
- Problem: 化身访客可能是潜在雇主，泄露面试/求职/第三方公司情报代价巨大。
- Constraint: 实测单层 system-prompt 在 context 信息丰富时仍输出面试细节，不够。
- Decision: 4 层组合 —— server prefilter（0 token 硬拦）+ system-prompt「输出前最后过滤」段（凌驾规则）+ LLM judge 强制 exclude + chunk/整源黑名单；并把 worklog diaries + wiki/job 整目录排除出 RAG 源。
- Alternatives（否决）: 只加强 system-prompt（实测不足）；完全不索引 worklog（项目能力展示也丢了 → 改为只排除 diaries + wiki/job）。
- Tradeoff: 化身失去讲日记内容能力（用户接受）；关键词列表 4 处必须同步维护。被屏蔽的具体词表不进 AIREADME（红线）。

## ADR-004 · LLM 上游切到自建 newapi-proxy 中转站 · 2026-05-19
- Problem: 原直连火山方舟原生 API，想统一网关 + 多上游聚合 + 成本控制。
- Constraint: newapi-proxy 是 IP 直连自签证书；embedding 须与旧 embeddings.json 同向量空间（零迁移）。
- Decision: chat completions + embeddings 都走 newapi-proxy（OpenAI 兼容）；embedding 经 newapi 路由到火山 `doubao-embedding-vision`（2048 dim，与旧索引一致）。
- Alternatives（否决）: 继续直连火山原生（放弃多上游聚合 + 统一计费）。
- Tradeoff: 自签证书要关 SSL verify；newapi 端点/IP 会变（已现 drift，见 RELATIONS）；prompt cache 透传依模型而定（见 ADR-007）。

## ADR-005 · chat-api env 变量用 CHAT_LLM_* 前缀 · 2026-05-19
- Problem: 切 newapi 时第一版用 `NEWAPI_*`，本地 dev embedding 端拿到 HTML（newapi 前端 SPA）而非 JSON。
- Constraint: 用户 shell rc 已全局 export `NEWAPI_*`（给 newapi 后台工具用）；chat-api `loadEnv()` 有 `!process.env[m]` 保护 → .env.local 的值被 shell 污染值跳过。
- Decision: 用 `CHAT_LLM_*` 干净 prefix，与任何全局 env 隔离。
- Alternatives（否决）: 删 loadEnv 的保护逻辑（治标）；改 shell rc（影响其他工具）。
- Tradeoff: 与外部 newapi 文档的 `NEWAPI_*` 示例不一致，需记住映射。

## ADR-006 · 详情页构建器用纯 Node 零依赖 · 2026-05-08
- Problem: 二级详情页要从 markdown 数据生成静态 HTML。
- Constraint: 站点纯静态、零运行时依赖、不想引 npm 包链 / 构建工具。
- Decision: `site/build.js` 自实现 frontmatter/YAML 子集解析 + markdown→HTML + 组件渲染，`node build.js` 直接跑。
- Alternatives（否决）: 用 11ty / Astro / 现成 SSG（过重，且要管依赖）。
- Tradeoff: markdown 能力有限（自维护 mdToHtml）；但够用且零供应链风险。

## ADR-007 · chat 模型用 doubao-seed-2.0-lite（替代 deepseek-v4-flash）· 2026-05-21
- Problem: 5/19 用的 `deepseek-v4-flash` 在 newapi 5/21 清单更新后升级为 `deepseek-v4-flash[1m]`（18× 价 / ¥18/36），化身场景性价比不合适。
- Constraint: 化身体验优先但要控成本；TTFT 要快；最好保留 prompt cache。
- Decision: 切 `doubao-seed-2.0-lite`（1.5× / ¥1.8/10.8）；doubao 系列保留 prompt cache 透传（deepseek 上游预计无命中）。
- Alternatives（否决）: 留 deepseek-v4-flash[1m]（贵）；用 auto-llm 动态调度（化身要稳定行为）。
- Tradeoff: lite 模型能力弱于 pro/flash，但化身任务简单（RAG 已给 context）够用。模型名仅由 env `CHAT_LLM_MODEL` 控制，前端经 `meta.model` 动态显示。

## ADR-008 · CSP script-src 'self'，全站无 inline script · 2026-05-10
- Problem: 千野渗透报告 P0：缺安全响应头 + inline script 是 XSS 面。
- Constraint: nginx 加 CSP `script-src 'self'` 后，所有 inline `<script>`（IO observer / referrer 路由）失效。
- Decision: 所有初始化脚本提取到外部 .js（`reveal.js` / `detail-init.js`）；nginx 加 4 安全头（CSP/XFO/XCTO/RP）。
- Alternatives（否决）: CSP 加 `'unsafe-inline'`（破坏防护意义）；用 nonce（静态站无后端注入 nonce 不便）。
- Tradeoff: `detail-init.js` 多处共用引发部署陷阱（见 MEMORY）；仓库 nginx.conf 当前缺这 4 头（drift，见 MEMORY / DEPLOYMENT 待核实）。
