# RELATIONS — maxwell-homepage
<!-- 生态连接。出向用相对路径 ../<proj>/AIREADME/。被 ≥2 项目依赖的共享底座 → 抽独立节点，这里只指向。 -->

## 出向依赖（我用了谁）

| 依赖 | 用途 | 权威路径 |
|---|---|---|
| **火山方舟 Ark**（LLM 上游，直连）| chat-api 的 chat（`doubao-seed-2.0-lite`）+ embedding（`doubao-embedding-vision`），OpenAI 兼容 `/api/coding/v3` | 火山 console（Ark Coding Plan）|
| **worklog**（wiki 数据 + 简历源） | ① `build.js` 读 `wiki/projects/<wiki_slug>.md` 抽详情页 fact ② chat-api `loadResume()` 读 `wiki/job/me/resume/MaxwellLi-AIPM-FDE.md` 入 RAG | `../worklog/AIREADME/SPEC.md` |

### 火山方舟 Ark（运行时 LLM 上游，直连，OpenAI 兼容）
- chat-api `route.ts` 调 `${CHAT_LLM_BASE_URL}/chat/completions`（stream，`thinking:{type:"disabled"}` 关 doubao 深度思考）+ `/embeddings`（`doubao-embedding-vision` 2048 dim）。chat 模型 `doubao-seed-2.0-lite`（env `CHAT_LLM_MODEL`）；离线脚本 judge/sanitize 用 `doubao-seed-2.0-pro`。
- 端点 `https://ark.cn-beijing.volces.com/api/coding/v3`（Coding Plan）；鉴权 `Bearer ark-<key>`（火山 console 申请，**仅存服务器 `.env.local` chmod 600，绝不入仓库**）；Ark 公网有效证书 → **无需** `NODE_TLS_REJECT_UNAUTHORIZED`。
- **2026-05-24 由 newapi-proxy 中转站切回直连 Ark**（DECISIONS ADR-009 取代 ADR-004）：绕过 newapi 侧 embedding 渠道「暂不可用」阻塞 + 恢复 doubao prompt cache 透传 + 去掉自签 TLS hack。`embeddings.json` 零重建（同模型同 2048 维向量空间）。已线上验证 RAG + chat 全链路通。

### worklog（构建/索引期数据依赖 —— 合法回读例外，2 处）
- **方向**：数据流 worklog → maxwell-homepage（build 期读 worklog wiki）；依赖方向上 maxwell-homepage 依赖 worklog，故记于出向。与 worklog 自己 SPEC 把 maxwell-homepage 列为 inbound 消费方一致。
- **机制**：`site/build.js:16` 以 `os.homedir()` 拼出绝对路径 `~/Desktop/Claude-Project/worklog/wiki/projects/`，按 `frontmatter.wiki_slug` 读对应页，抽 4 个 H2 段：`## Git 活动` → git_log / `## 决策日志` → decisions / `## 当前进度`|`## 基本信息` → stats / `## 部署` → ps。**可选**：文件缺失 `readWiki()` 返回 null，build 仍成（对应组件显示"暂无"）。
- **契约**：`wiki/projects/<slug>.md` 存在 + frontmatter 必备字段，定义在 `../worklog/AIREADME/SPEC.md`。**改 wiki 文件名 / 删字段 / 改上述 H2 段名 = breaking**（详情页对应组件显示"暂无"）。两端 wiki_slug 须同步（worklog 改名 → 本仓库 9 个 frontmatter 同步）。
- **简历源（2026-05-26 新增的第 2 处）**：chat-api `loadResume()`（`build-embeddings.mjs`）直读 `wiki/job/me/resume/MaxwellLi-AIPM-FDE.md` 入 RAG。走**主源通道**、不经 scan-sources 的 worklog walk，故 worklog 的 `wiki/job` 排除**不挡它**（无需白名单）。简历真相源现归 worklog（取代本仓库根的 `MaxwellLi-*`）。
- **为何合法**：常规原则是「本项目工作不回读 worklog 作上下文」（避免跨 session 状态错乱，见 CONVENTIONS 跨项目协作）。上面 2 处都是**编译/索引期读静态文件**的数据依赖，不是上下文回读，故合法。

## 入向（谁用我）
- **终端访客 / 招聘方 / 同行** —— maxwellii.com 网页 + chat 化身（人类消费方，非程序契约）。
- **chat-api RAG 自身** —— 索引 `site/data/home-data.js` / `site/data/projects/*.md`（内部自消费）；简历改读 worklog（见出向）。
- 暂无**其他项目**把本仓库产物当契约消费。

## 共享底座 / 复用资产
- **chat-api 不是共享底座** —— 仅被 maxwellii.com 站点消费（单一消费方 < 2），且是本仓库专属子模块 → **是组件不是独立 AIREADME 节点**（架构见 ARCHITECTURE）。
- **（历史）newapi-proxy** —— chat-api 2026-05-19~05-24 曾以它为 LLM 上游，现已切回直连火山方舟 Ark（ADR-009），**本项目不再依赖**。newapi-proxy 仍是 Maxwell 其他工具的共享底座（独立节点 `../newapi-proxy/AIREADME/`），但与本项目无关。
- **SSL 证书 `*.maxwellii.com`** 与子站 naming.maxwellii.com / tale.maxwellii.com 共用 SNI（部署细节见 DEPLOYMENT）。
- **求职活动归 worklog**：面试 / 求职沟通文案 / 谈薪 / 公司情报 等全在 worklog（私密），本仓库不维护其正文；本项目仅维护"文案产品规则"（字数算法 / 平台机制 / 排序原则）—— 边界判断「会随求职阶段变 → worklog；产品规则不变 → homepage」见 CONVENTIONS。
