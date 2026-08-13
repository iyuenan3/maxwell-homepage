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

## ADR-009 · chat-api 直连火山方舟 Ark，取代 newapi-proxy 中转站 · 2026-05-24
- Problem: 经 newapi-proxy 中转后，newapi v2 迁移导致端点 drift + embedding 渠道「暂不可用」阻塞 chat-api RAG；中转层多一跳依赖 + 自签证书 TLS hack。
- Constraint: 体验优先（TTFT / embedding 必须可用）；不想被 newapi 迁移/渠道状态卡住；env 命名保持 `CHAT_LLM_*`（ADR-005 仍成立）。
- Decision: chat-api（chat + embedding + 离线 judge/sanitize）改**直连火山方舟 Ark**（`/api/coding/v3`，OpenAI 兼容，`ark-` key）；`doubao-seed-2.0-lite` 加 `thinking:{type:"disabled"}` 关深度思考（实测 reasoning 245→0）。**取代 ADR-004**。
- Alternatives（否决）: 继续等 newapi v2 接通 embedding 渠道（受制于人 + 仍有 drift）；切 newapi `auto-llm`（化身要稳定行为）。
- Tradeoff: 放弃 newapi 的多上游聚合 / 统一计费（化身只需单一火山上游，不需要）；逻辑代码零改（早已通用 OpenAI 兼容），仅 .env 值 + 注释变更；`embeddings.json` 零重建（同模型同向量空间）。已线上验证 RAG + chat 全链路通。

## ADR-010 · 简历真相源迁至 worklog · 2026-05-26
- Problem: 简历此前由 maxwell-homepage 维护（根目录 + `versions/`），但 Maxwell 的求职 / 简历活动统一在 worklog 知识库管理，两处分散。
- Constraint: 化身（公开）应能讲简历；但 worklog 把简历放 `wiki/job/me/resume/`，而 chat-api 隐私过滤按 `wiki/job` 前缀排除（P0，ADR-003）。
- Decision: worklog 成简历单一真相源；chat-api `loadResume()` 的 `RESUME_PATH` 改读 worklog 那份；git rm 本仓库根 `MaxwellLi-*` + `versions/`。**反转**早期「简历=maxwell-homepage 内容产物」立场。
- Alternatives（否决）: 给 `wiki/job` 开白名单例外（多余且削弱隐私，见 Tradeoff）；简历留 maxwell-homepage（与 worklog 统一管理目标冲突）。
- Tradeoff: 白名单**不需要**——简历走 `loadResume()` 主源通道，不经 scan-sources 的 worklog walk，`wiki/job` 排除根本不挡它，保持排除不动更安全。公开 GitHub 不再直接 host 简历（访客经化身 / LinkedIn / 邮件获取）。简历内容不变 → `embeddings.json` 零重建。

## ADR-011 · projects 板块 11→9（两组合并 + 删除项 URL 真 404）· 2026-05-28
- Problem: projects 板块 11 项与简历 / worklog 最新画像脱节：worklog 与 maxwellii.com 本是一个知识系统的两端却各占一卡；小红书工具（xiaohongshu-tool）与代运营（xhs-agency）是同一业务两阶段；ai-knowledge 已归档。
- Constraint: 旧详情页 URL 已有外链 + 被 chat-api 索引，不能随意破坏；合并项不想新造 slug 再加 redirect；删除项用户明确要 404 不要 redirect。
- Decision: 合并两组（maxwell-homepage 收编 worklog 成「个人知识系统」/ xhs-agency 收编 xiaohongshu-tool 成「小红书自运营系统」），合并项保留旧 slug 不改 URL（xhs-agency 仅把 `wiki_slug` 改指 xiaohongshu-tool 抽 worklog fact）；删 ai-knowledge + worklog 两详情页（git rm）；nginx 加 `location ^~ /p/ { try_files $uri =404 }` 让删除项 URL 真 404。
- Alternatives（否决）: worklog 与 maxwell-homepage 分两卡（用户判断本是一个系统两端，合并更真实）；删除项 301 redirect 到首页（用户要干净 404，不留僵尸跳转）；合并项造新 slug + redirect（多余，旧 slug 仍贴切）。
- Tradeoff: 合并项卡片承载两段叙事，文案密度升高；`build-embeddings.mjs` / `rag.ts` 残留 ai-knowledge category 死键（无害，下次重构清）；embeddings chunks 2339→2178。详情页数据源 + 板块约定见 CONVENTIONS。

## ADR-012 · 雇主机密使用数据侧标记 + env 注入的纵深防御 · 2026-06-05
- Problem: 当前雇主与内部项目可能散落在 worklog wiki 和多个 RAG chunk 中，访客追问时存在检索与运行时泄露风险。
- Constraint: 本仓库公开，真实雇主名、内部项目名和私密 slug 本身也不能硬编码进源码、AIREADME、测试或 commit message。
- Decision: 私有 wiki 使用 `visibility:private` / `rag_exclude:true` 通用标记；scan 与 build 两侧整源排除；build 再做 universal chunk 过滤与私有源兜底；route prefilter 与 system prompt 负责运行时拒答。敏感词与私密 slug 只从 gitignore 的 `.env.local` 注入。
- Alternatives（否决）: 只靠 system prompt（RAG context 可能已泄露）；只靠 hardcode 黑名单（公开仓直接暴露敏感词，且改名会静默失效）。
- Tradeoff: 本地与服务器 env 必须同步维护；缺少 env 时通用 frontmatter 机制仍生效，但词级兜底与入口硬拦覆盖面会下降。

## ADR-013 · 新增 hdu RAG 源并对骑行数据执行固定回避 · 2026-06-14
- Problem: 化身需要覆盖公开的本科教育与毕业设计背景，同时曾把单车旅游公司经历误解成个人竞技战绩并编造离谱数字。
- Constraint: 学业资料先经过筛选与脱敏；骑行表现和身体数据不作为公开身份材料，也没有可信数据源支持回答。
- Decision: 外部 RAG vault 增加 `hdu` 源并归入 personal 类别；system prompt 明确单车旅游公司是任职经历，不是竞技战绩。涉及爬坡、速度、功率、体重、排名等问题统一一句话回避，不输出数字。
- Alternatives（否决）: 让模型依据一般常识估算（会把猜测包装成个人事实）；接入更多运动数据（不符合隐私边界，也不是主页产品目标）。
- Tradeoff: 化身无法回答一部分个人爱好细节，但换来更稳定的可信度与隐私边界。

## ADR-014 · 本机项目根目录迁移至 Projects · 2026-07-31
- Problem: 本机项目已从 `~/Desktop/Claude-Project/` 统一迁移到与客户端无关的 `~/Desktop/Projects/`，当前构建器与 RAG 脚本仍绑定旧绝对路径。
- Constraint: maxwell-homepage 不保留旧 worklog 路径兼容；历史 ADR 与已完成的迁移记录不得改写。
- Decision: 所有当前运行代码、操作说明和关系文档改用 `~/Desktop/Projects/`。ADR-002 中的旧 vault 路径只表示当时决策，不再是当前运行路径。
- Alternatives（否决）: 建立永久旧根目录软链接（会掩盖漏改路径）；依赖当前工作目录推导相邻项目（任务从子目录启动时不稳定）。
- Tradeoff: 迁移完成前，依赖 worklog 的构建与 RAG 脚本必须等 worklog 也移动到新根目录后再执行。

## ADR-015 · chat 模型切换为 deepseek-v4-flash · 2026-08-12
- Problem: 线上化身需要从 `doubao-seed-2.0-lite` 切换到能力更强的 DeepSeek Flash 系列，同时保持现有 RAG、流式 SSE、usage 与前端模型显示契约不变。
- Constraint: 继续直连火山方舟 Coding Plan；不改 embedding 模型与向量空间；目标模型必须兼容 OpenAI 流式接口、`stream_options.include_usage` 和 `thinking:{type:"disabled"}`。
- Decision: `CHAT_LLM_MODEL` 改为 `deepseek-v4-flash`。2026-08-12 直连预检返回 200，方舟实际解析为 `deepseek-v4-flash-ga-260731`；同参数流式测试正常结束，usage 可解析，reasoning token 为 0。该结论取代 ADR-007 的当前 chat 模型选择，ADR-007 保留为历史。
- Alternatives（否决）: 保持 `doubao-seed-2.0-lite`（不满足本次模型升级目标）；写死版本化 ID（会把方舟别名升级策略固化进配置）；同时重建 embeddings（chat 模型与 embedding 向量空间无关，没有收益）。
- Tradeoff: DeepSeek Flash 的成本、延迟和别名后端版本可能随方舟调整；运行时应继续以 SSE `meta.model` 和真实对话验收为准，不能只看 `.env.local` 字面值。

## ADR-016 · 最新简历与项目状态只生成公开安全画像 · 2026-08-12
- Problem: worklog 中的简历与项目清单已经更新，主页、详情页、README 与化身 prompt 仍停留在 2026 年 5 月的项目组合，已归档项目继续占据主页，新项目缺席。
- Constraint: 主页固定保持 9 个精选项目；worklog 的简历含非公开任职信息，当前雇主与内部项目不得进入公开仓、静态站或 RAG；历史详情不能因主页下架而无意丢失。
- Decision: 公开画像加入 larkflow 与 PetsGraph，short-story 与 openclaw 移出主页但保留 archived 详情，智投研改为 archived；职业定位统一为 AI 产品经理 / FDE / AI Native 全栈工程师。详情页 RAG loader 补齐 `visibility:private` / `rag_exclude:true` 过滤，公开画像只投影可验证的公开材料。
- Alternatives（否决）: 把最新简历全文直接复制到公开仓（会混入非公开任职信息）；删除所有下架详情（破坏历史 URL）；扩大主页项目数量（削弱精选层级）。
- Tradeoff: 主页卡片和历史详情不再一一对应，需要在文档中明确 9 个精选项目与 2 个历史归档详情的双层结构；RAG 全量更新与生产读回成为本次内容同步的必要验收。

## ADR-017 · RAG 审稿与脱敏错误必须 fail-closed · 2026-08-13
- Problem: 获得外部处理授权后执行 `npm run update`，22 个增量文件因账户额度无法完成 judge，但 scan 仍以成功退出；随后 133 个 chunks 脱敏失败，build 仍保留原文进入 embedding 阶段。embedding 同样返回 `AccountQuotaExceeded`，暴露出不完整索引和未脱敏原文可能继续下游的风险。
- Constraint: 旧生产索引必须在新索引完整通过前保持可用；任何 judge、read 或 sanitize 错误都不能被降级成可部署结果；额度类确定性错误不应触发长退避和单条 fallback。
- Decision: scan 写出诊断 manifest 后，只要 `error>0` 就以非零退出阻断 npm 链；sanitize 任一 chunk 最终失败就终止，不再保留原文继续 embedding；`AccountQuotaExceeded` 在 sanitize 和 embedding 两处立即失败。部署仍只发生在完整 reindex 成功之后。
- Alternatives（否决）: 失败 chunk 原文继续 embedding（破坏隐私边界）；静默丢弃失败文件后生成部分索引（答案覆盖不完整且难以察觉）；对账户额度错误继续分钟级退避（不会自行恢复，只放大等待与请求量）。
- Tradeoff: 单个瞬时 sanitize 错误也会让整轮失败，需要恢复后完整重跑；换来索引完整性、隐私边界和生产状态三者可证明。

## ADR-018 · 静态简历事实与化身披露边界解耦 · 2026-08-14
- Problem: 最新简历已将一段当前任职经历列为可公开事实，V1 需要同步展示；但简历与 `home-data.js` 同时是 RAG 主源，直接更新会让同一事实进入化身上下文，违背当前任职信息不经化身扩写的边界。
- Constraint: 静态页必须忠实投影用户明确批准的简历事实；内部细节、词表和私密项目仍不得进入公开文档；化身入口硬拦与向量索引隔离必须继续成立。
- Decision: V1 可以展示经批准的当前任职摘要；相关实体仍加入 gitignored 的雇主词表，使 resume / home-data 中命中的 chunks 在 embedding 前被 universal filter 丢弃，并由 route prefilter 在运行时 0 token 拒答。独立产品实践等非雇主段保持可索引。此决策仅取代 ADR-016 中“当前任职事实不得进入静态站”的范围，ADR-016 的私密项目隔离和公开安全画像原则继续有效。
- Alternatives（否决）: 静态页继续隐藏最新任职（与简历不一致）；同时开放化身回答（会把经批准摘要扩写成不可控内容）；整源排除简历和 home-data（会损失其他公开经历与技术栈召回）。
- Tradeoff: 访客可以在静态页阅读摘要，却不能通过化身追问同一任职；每次履历变更都必须同时检查本地与生产词表、RAG dry-run 和公网 0 token 拦截，维护步骤增加。
