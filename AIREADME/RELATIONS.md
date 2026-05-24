# RELATIONS — maxwell-homepage
<!-- 生态连接。出向用相对路径 ../<proj>/AIREADME/。被 ≥2 项目依赖的共享底座 → 抽独立节点，这里只指向。 -->

## 出向依赖（我用了谁）

| 依赖 | 用途 | 权威路径 |
|---|---|---|
| **newapi-proxy**（LLM 网关） | chat-api 的 LLM 上游：chat completions（`doubao-seed-2.0-lite`）+ embeddings（`doubao-embedding-vision`），OpenAI 兼容 | `../newapi-proxy/AIREADME/SPEC.md` |
| **worklog**（wiki 数据） | `site/build.js` 构建详情页时读 `wiki/projects/<wiki_slug>.md` 抽 fact —— **唯一合法回读 worklog 的例外**（见下） | `../worklog/AIREADME/SPEC.md` |

### newapi-proxy（运行时 LLM 上游）
- chat-api `route.ts` 调 `${CHAT_LLM_BASE_URL}/chat/completions`（stream）+ `/embeddings`（doubao-embedding-vision 2048 dim）。
- 端点 / 证书 / 模型清单 / 计费的**当前真相以 `../newapi-proxy/AIREADME/SPEC.md` 为准**（IP 直连自签，IP/证书会变）。
- ⚠️ **已知 drift（2026-05-24）**：chat-api committed `.env.example`（5/21）的上游端点 + 自签 `NODE_TLS_REJECT_UNAUTHORIZED=0` 写法，与 newapi-proxy **当前** SPEC 已不一致（newapi 侧端点已迁移 + 改为安装 root CA `NODE_EXTRA_CA_CERTS`，其域名入口 5/24 备案拦截暂停）。**当前真相以 `../newapi-proxy/AIREADME/SPEC.md` 为准**（具体 IP/端口不在本公开仓库重复，避免泄露兄弟项目当前端点）；chat-api 服务器 `.env.local` 是否已同步需核实。另：newapi-proxy 当前 SPEC 把 `doubao-embedding-vision` 渠道标「暂不可用」，而 chat-api 代码（`route.ts`）仍配置用它做 embedding —— 可能 chat-api 仍指旧 newapi 端点（那里 embedding 可用），一并待核实。**改 newapi 渠道 / 端点不在本项目做**，走 newapi-proxy session 或跨项目转达流程。
- 模型选型变更（5/19 deepseek-v4-flash → 5/21 doubao-seed-2.0-lite）理由见 DECISIONS / CHANGELOG。

### worklog（构建期数据契约 —— 唯一合法回读例外）
- **方向**：数据流 worklog → maxwell-homepage（build 期读 worklog wiki）；依赖方向上 maxwell-homepage 依赖 worklog，故记于出向。与 worklog 自己 SPEC 把 maxwell-homepage 列为 inbound 消费方一致。
- **机制**：`site/build.js:16` 以 `os.homedir()` 拼出绝对路径 `~/Desktop/Claude-Project/worklog/wiki/projects/`，按 `frontmatter.wiki_slug` 读对应页，抽 4 个 H2 段：`## Git 活动` → git_log / `## 决策日志` → decisions / `## 当前进度`|`## 基本信息` → stats / `## 部署` → ps。**可选**：文件缺失 `readWiki()` 返回 null，build 仍成（对应组件显示"暂无"）。
- **契约**：`wiki/projects/<slug>.md` 存在 + frontmatter 必备字段，定义在 `../worklog/AIREADME/SPEC.md`。**改 wiki 文件名 / 删字段 / 改上述 H2 段名 = breaking**（详情页对应组件显示"暂无"）。两端 wiki_slug 须同步（worklog 改名 → 本仓库 9 个 frontmatter 同步）。
- **为何是"唯一合法例外"**：常规原则是「本项目工作不回读 worklog」（避免跨 session 状态错乱，见 CONVENTIONS 跨项目协作）。build 数据依赖是编译期读静态文件，不是上下文回读，故合法。

## 入向（谁用我）
- **终端访客 / 招聘方 / 同行** —— maxwellii.com 网页 + chat 化身（人类消费方，非程序契约）。
- **chat-api RAG 自身** —— 索引本仓库内的简历 / `site/data/home-data.js` / `site/data/projects/*.md`（内部自消费，非跨项目）。
- 暂无**其他项目**把本仓库产物当契约消费。

## 共享底座 / 复用资产
- **chat-api 不是共享底座** —— 仅被 maxwellii.com 站点消费（单一消费方 < 2），且是本仓库专属子模块 → **是组件不是独立 AIREADME 节点**（架构见 ARCHITECTURE）。
- **newapi-proxy 是共享底座**（被 Maxwell 多个工具 + 客户共用）→ 已是独立节点 `../newapi-proxy/AIREADME/`，本项目只是它的客户端使用者之一。
- **SSL 证书 `*.maxwellii.com`** 与子站 naming.maxwellii.com / tale.maxwellii.com 共用 SNI（部署细节见 DEPLOYMENT）。
- **求职活动归 worklog**：面试 / 求职沟通文案 / 谈薪 / 公司情报 等全在 worklog（私密），本仓库不维护其正文；本项目仅维护"文案产品规则"（字数算法 / 平台机制 / 排序原则）—— 边界判断「会随求职阶段变 → worklog；产品规则不变 → homepage」见 CONVENTIONS。
