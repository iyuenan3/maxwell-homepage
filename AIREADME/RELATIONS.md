# RELATIONS — maxwell-homepage
<!-- 生态连接。出向用相对路径 ../<proj>/AIREADME/。共享底座指向属主项目根 AIREADME，不另建节点。 -->

## 出向依赖（我用了谁）

| 依赖 | 用途 | 权威路径 |
|---|---|---|
| **灵眸 AI**（文本与向量上游）| 本地在线对话、RAG 审稿/脱敏使用 `deepseek-flash`；Embedding 使用 `qwen3.7-text-embedding`，独立分组 Key | [接入协议](https://docs.lmuai.com/docs/guide/api-protocols)；验证与发布边界见 DEPLOYMENT |
| **火山方舟 Ark**（历史向量空间）| 旧 `doubao-embedding-vision` 索引保留以便恢复，不能与新查询向量混用 | 历史 ADR-009 / ADR-019；迁移状态见 DEPLOYMENT |
| **worklog**（wiki 数据 + 简历源） | ① `build.js` 读 `wiki/projects/<wiki_slug>.md` 抽详情页 fact ② chat-api `loadResume()` 读 `wiki/job/me/resume/MaxwellLi-AIPMorFDE.md` 入 RAG | `../worklog/AIREADME/SPEC.md` |
| **北京共享 edge 基础设施** | 候选容器复用既有 Docker 网络，未来公网接入复用 Caddy；当前未改共享网关 | `../newapi-proxy/AIREADME/DEPLOYMENT.md` |
| **阿里云域名与 DNS** | 权威 DNS 已迁移；主域与 `www` 的北京 A 记录预置但暂停，备案后再验收 HTTPS 直连 | 阿里云域名、云解析 DNS 与 ICP 备案控制台；当前状态见 DEPLOYMENT |

### 模型供应商（2026-11-09 北京已上线）
- 文本与向量通过独立配置调用灵眸，端点与请求契约见 SPEC，备份、实际验收及生产同步状态见 DEPLOYMENT。
- 新供应商会接收在线消息与命中的 context。仅重向量化发送已有脱敏片段；全量 scan/sanitize 仍会发送待审或待脱敏原文，需要单独确认执行范围。
- [供应商隐私声明](https://docs.lmuai.com/docs/guide/privacy)称正常正文不持久化，但错误日志可能含截断请求片段并保留 90 天，不作为无条件零留存保证。
- 真实凭证只存本地及生产私有配置，不经自建 new-api。历史选择保留，当前取舍见 ADR-025。

### worklog（构建/索引期数据依赖 —— 合法回读例外，2 处）
- **方向**：数据流 worklog → maxwell-homepage（build 期读 worklog wiki）；依赖方向上 maxwell-homepage 依赖 worklog，故记于出向。与 worklog 自己 SPEC 把 maxwell-homepage 列为 inbound 消费方一致。
- **机制**：`site/build.js:16` 以 `os.homedir()` 拼出绝对路径 `~/Desktop/Projects/worklog/wiki/projects/`，按 `frontmatter.wiki_slug` 读对应页，抽 4 个 H2 段：`## Git 活动` → git_log / `## 决策日志` → decisions / `## 当前进度`|`## 基本信息` → stats / `## 部署` → ps。**可选**：文件缺失 `readWiki()` 返回 null，build 仍成（对应组件显示"暂无"）。
- **契约**：`wiki/projects/<slug>.md` 存在 + frontmatter 必备字段，定义在 `../worklog/AIREADME/SPEC.md`。**改 wiki 文件名 / 删字段 / 改上述 H2 段名 = breaking**（详情页对应组件显示"暂无"）。两端 wiki_slug 须同步（worklog 改名 → 本仓库 9 个 frontmatter 同步）。
- **简历源（2026-05-26 新增的第 2 处）**：chat-api `loadResume()`（`build-embeddings.mjs`）直读 `wiki/job/me/resume/MaxwellLi-AIPMorFDE.md` 入 RAG。走**主源通道**、不经 scan-sources 的 worklog walk，故 worklog 的 `wiki/job` 排除**不挡它**（无需白名单）。简历真相源现归 worklog（取代本仓库根的 `MaxwellLi-*`）。
- **为何合法**：常规原则是「本项目工作不回读 worklog 作上下文」（避免跨 session 状态错乱，见 CONVENTIONS 跨项目协作）。上面 2 处都是**编译/索引期读静态文件**的数据依赖，不是上下文回读，故合法。

## 入向（谁用我）
- **终端访客 / 招聘方 / 同行** —— maxwellii.com 网页 + chat 化身（人类消费方，非程序契约）。
- **chat-api RAG 自身** —— 索引 `site/data/home-data.js` / `site/data/projects/*.md`（内部自消费）；简历改读 worklog（见出向）。
- 暂无**其他项目**把本仓库产物当契约消费。

## 共享底座 / 复用资产
- **chat-api 不是共享底座** —— 仅被 maxwellii.com 站点消费（单一消费方 < 2），且是本仓库专属子模块 → **是组件不是独立 AIREADME 节点**（架构见 ARCHITECTURE）。
- **newapi-proxy 的模型中转为历史依赖**：chat-api 的新模型方案使用灵眸，不恢复自建 new-api 模型接入。北京复用该项目维护的 `edge` 网络与未来 HTTP 网关，仅属基础设施依赖，属主为 `../newapi-proxy/AIREADME/DEPLOYMENT.md`。
- **历史共享 Origin CA 证书**：旧机主页与 `naming`、`oracle`、`tale` 曾引用同一证书。2026-10-31 新加坡业务退役时已删除该机虚拟主机配置和证书副本，未撤销证书，北京副本保留。三个子域不恢复解析；主页无代理直连上线需另配公有可信证书（部署细节见 DEPLOYMENT）。
- **求职活动归 worklog**：面试 / 求职沟通文案 / 谈薪 / 公司情报 等全在 worklog（私密），本仓库不维护其正文；本项目仅维护"文案产品规则"（字数算法 / 平台机制 / 排序原则）—— 边界判断「会随求职阶段变 → worklog；产品规则不变 → homepage」见 CONVENTIONS。
