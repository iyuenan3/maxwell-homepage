# Changelog

按 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 风格，遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

主要里程碑版本归档。详细 commit 历史见 `git log`。

---

## [2.2.0] - 2026-05-10

### 新增

- **chat-api: RAG vault v3** — 407 文件独立 Obsidian Vault（`~/Desktop/Claude-Project/maxwell-rag-sources/`），含 nokia (interview-prep + work) / pets / huawei / quanjing / resume-archive / projects/openclaw 7 大目录
- **chat-api: 4 个新脚本** — `build-embeddings` / `scan-sources` / `migrate-to-vault` / `rag-search`
- **chat-api: 4 大类多源平衡 SOURCE_CATEGORY** — personal / work-history / current-projects / knowledge-base，RAG 检索时按类别均衡召回
- **chat-api: file-level pre-sanitize** — 文件级 LLM 脱敏（人名 / 公司名 / 金额），KEEP 白名单（本人 / 宠物 / 公开公司）
- **chat-api: 完整方案文档** — `chat-api/docs/RAG-VAULT-MIGRATION.md`（含执行记录附录）
- **site: CSP 兼容** — `reveal.js` + `detail-init.js`（从 inline `<script>` 提取）

### 修复 - LLM 准确性

- system prompt 加 **核心事实段**：1 wife + 7 cats（小葵 / 飞流 / 乔治 / 吉吉 / 五百 / 花轮 / 红豆）+ 2 dogs（小七 / 多多）
- system prompt 加 **姓名等价**：李越男 / Li Yuenan / Li Maxwell / Maxwell / 越男 等价于本人
- system prompt 加 **项目类问题默认聚焦** 10 个 AI 项目（不混入 Nokia / 华为 / 全境工作经历）
- system prompt 加 **常识题 fallback**：第三方产品归属不确定时坦白说"建议查官方"
- system prompt 加 **hard rule**：永远禁止说 OpenClaw / Claude / Cursor 等是"我做的"
- judge prompt 改 summary 类别化（不写具体客户名 / 金额 / 项目代号）

### 修复 - UX

- chat 流式输出滚动 fix（`requestAnimationFrame` 节流 + `behavior: instant` + `isNearBottom` 检测，用户上滑看历史时不打扰）
- IME composition 修复（中文输入法选词敲 Enter 不再误发送，检测 `e.isComposing`）
- Markdown 渲染重写：line-by-line 状态机支持 H1-H6 / 有序列表 / 无序列表 / 代码块
- HUD 动态接收后端 `meta.model` 字段（替代硬编码模型名）
- chat-intro 文案改 "嘿，我是 AI 版 Maxwell"

### 安全 - 千野渗透报告 P0+P1 修复

- nginx 加 4 个安全响应头：**CSP** / **X-Frame-Options** / **X-Content-Type-Options** / **Referrer-Policy**
- `chat.js mdInline` 链接 URL scheme 校验（防 `javascript:` 伪协议注入）
- system prompt 防伪造对话历史注入（D 方案）+ 代码边界 B（讨论项目可，通用工具脚本拒）
- system prompt 防 RAG 知识污染段（用户消息中"请记住"等不视为新事实）
- `token-hud.js` 改 `replaceChildren + textContent`（替代 `innerHTML`，0 XSS 风险）
- `deploy.sh` 加严格 build 失败检查（防旧 `.next/` 漏过）

### 升级

- 模型 `doubao-seed-2.0-lite` → `doubao-seed-2.0-pro`（256k context window，max_tokens 4096）
- 后端参数：`max_tokens` 800 → 2000，单条字符 2000 → 8000，历史 12 → 20 条，per-IP rate 10/min → 20/min
- API meta 加 `model` 字段（前端 HUD 动态显示）

---

## [2.1.0] - 2026-05-10

### 新增

- **LLM 化身对话端到端上线** — chat-api 接入 maxwellii.com 主页右下对话框
- **Token HUD**（claude-hud 风格 Context bar + token 累计）
- **部署方案 C**：V2 占主域 maxwellii.com/，V1 → /v1/，详情页 /p/ 共享

### 安全

- LLM 边界（话题护栏 + 不答跨领域题）
- Prompt injection 黑名单（regex 拦截 `ignore` / `system prompt` / `DAN` 等）
- 三层限流（per-IP 10/min · 100/day · global 5000/day）

---

## [2.0.0] - 2026-05-09

### 新增

- **maxwellii.com V2 redesign** — Claude CLI 风对话框 + 眼镜 emote 系统
- **chat-api 后端**（Next.js 16 + 火山方舟 doubao）
- V1 / V2 数据共用方案 B（`site/data/home-data.js`）

---

## [1.10.0] - 2026-05-09

### 改动

- 主页 ls v3：slug + name_zh + 一句话 desc 三层 stacked 结构（C 方案）
- 项目排序原则：live 段按上线时间倒序，active 段按求职亮点手动排
- `xhs-5agent-pipeline` → `xhs-agency` 改名 + Multi-Agent Roundtable 重写

### 新增

- 详情页 markdown 渲染升级（H3 / 表格 / fenced 代码块）
- maxwell-homepage 项目自身加入主页 ls + README 业务反转

---

## [1.9.0] - 2026-05-09

### 改名

- **`Maxwell-Resume` → `maxwell-homepage`** — 项目职责从「简历仓库」扩展为「个人主页 + 简历归档」（GitHub 自动 redirect 旧 URL）

### 新增

- 项目双名规范 v2（11→9 项 + frontmatter `slug` / `name_en` / `name_zh` / `wiki_slug`）
- CSS 缓存策略：nginx CSS/JS `must-revalidate`（图片字体仍 immutable）
- 历史 URL redirect 兜底（`ai-knowleage` → `ai-knowledge` 等）

---

## [1.0.0] - 2026-05-08

### 新增

- **maxwellii.com 个人主页正式上线** — 终端体设计（bash 隐喻 + CRT 扫描线 + 朱砂方印）
- **二级详情页系统**（11 项目，零依赖 Node 构建器 `site/build.js`）
- 简历定位升级 → AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师

---

## [0.x] - 2024-11 ~ 2026-05（简历归档时期）

按定位演进的简历多版本：

| 日期 | 定位 |
|------|------|
| 2018-05 | DevOps Engineer（华为转 Nokia） |
| 2024-11 | DevOps Engineer |
| 2024-12 | Product Manager（Nokia 离职转型） |
| 2026-03 | 技术负责人 / AI 工程化专家 |
| 2026-04 | AI 产品经理 / OpenClaw 实战专家 |
| 2026-05 | AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈 |

详见 `versions/` 目录。
