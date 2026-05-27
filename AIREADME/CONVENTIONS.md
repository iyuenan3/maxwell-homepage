# CONVENTIONS — maxwell-homepage
<!-- 本项目特有约定。共享/通用基线只链过去，不抄。 -->

## 命名
- **slug 一律 kebab-case**：项目目录 / GitHub repo / wiki 文件名 / URL slug / package.json name 都用（`eastern-wisdom` / `claude-financial-research`）。
- **详情页双名 frontmatter**：`site/data/projects/<slug>.md` 必含 `slug` / `name_en` / `name_zh` / `wiki_slug`，双名格式 `品牌名 · 定位短语`，中英用 ` · ` 分隔；中英对照场合用 `|` 管道符（呼应终端隐喻）。
- **简历约定已迁 worklog**：简历 2026-05-26 起归 worklog 维护（命名 `MaxwellLi-<TargetRole>` 无日期常驻 / versions/ 归档 / 纯文本链接 / short-story 不写正文等约定随之）；本仓库不再涉及简历文件。
- **chat-api env 前缀用 `CHAT_LLM_*`**：绝不用 `NEWAPI_*` / `VOLCANO_*`（用户 shell rc 已全局 export，会污染 process.env，见 MEMORY + ADR-005）。
- 命名美学：用户对"难听 / 系统日志感"命名敏感（否决过 `Resume-20260507` / `equity-200b`）。

## 偏好模式
- **内容同步（跨项目）**：定位语 / 能力定位句 / 4 大独立项目 / 项目命名 任一变化 → 本仓库主页(`site/data/home-data.js` → index.html) + README **都改**，并跨项目同步 worklog 的简历（简历已迁 worklog，见 RELATIONS）。
- **主页 ls 三层 stacked**：slug(cyan) / name_zh 仅中文(amber) / 一句话 desc 聚焦"做什么+1 亮点"(接近白)。排序按 status 分层 + 段内"求职亮点驱动"手排，非严格 since 倒序。
- **详情页板块**：最终 8 板块 `readme/links/decisions/stats/stack/notes`(9 项目必有) + `git_log`(仅有 wiki Git 数据的 3 项目) + `history`(仅按需 cfr/petslog)。`next` 已废弃并入 notes「项目方向」。k8s-om/xhs-agency 维持精简现状。
- **projects 合并 / 删除约定**（5/28 重构落定）：合并两个项目时保留更贴切的旧 slug 不改 URL（如 xhs-agency 收编 xiaohongshu-tool 仍用 `xhs-agency`，仅 `wiki_slug` 改指对方抽 worklog fact），不造新 slug + redirect；删除项 `git rm` 详情页 + ssh 删服务器 `public/p/` + nginx `/p/ 404`（不 redirect）。详情页 frontmatter 保留 `slug`/`name_en`/`name_zh`/`wiki_slug`，只更新 `status`/`since`/`stack`；body 只写 `## README` + `## NOTES`（`## DECISIONS`/`## STATS`/git_log build 时从 worklog wiki 自动拉，手写会冲突）。见 ADR-011。
- **V2 /help 文案对齐 V1 section 注释**：`v2-redesign/commands.js cmdHelp()` 的命令描述必须跟 V1 `public/index.html` 对应 section 的 `# xxx` 注释一致（V1 注释是唯一真相源）。改 V1 注释要同步改 V2。
- **化身 prompt 边界**：体验优先 token 不计较（max_tokens 2000 / topK 12 / 召回宁宽勿窄）；前端不 hardcode 模型名（由 SSE `meta.model` 填）；可讨论自身技术架构/实现（这是技术网站，展示能力）。
- **简历链接纯文本**（打印友好）：简历 .md 里 URL 不写 markdown link 语法、不写 `https://` 前缀（`maxwellii.com` 而非 `[maxwellii.com](https://...)`）。HTML 版可用 `<a href>`。
- **标点风格**：并列项冒号半角（`Blog: maxwellii.com`）；范围用 en dash `–`（`2–8 人`）；离职时间月份精度（`2025.03 - 2026.04`）；中文段全角括号、半角括号仅用于代码/英文。
- **跨项目协作走"清单 + 转发"**：本 session 默认只改当前仓库；需 worklog 同步时输出清单交用户转达，不直接 Edit worklog（除非用户明说"也改 worklog"）。责任边界：产品/代码/文案规则归 homepage，求职活动/文案正文归 worklog。
- **提交前安全审计 SOP**：大批量 commit 前 grep 真实手机号 / `ark-`·`sk-` key / 用户绝对路径 / 长 token —— 全空才安全（命令见本地 CLAUDE.md）。

## 禁用模式
- **禁 inline `<script>`**（CSP `script-src 'self'`）：初始化脚本提取到外部 .js（`reveal.js` / `detail-init.js`），注意三层引用路径（根 / `/v1/` / `/p/` 的 `../`）任一 404 致整页空白。见 ARCHITECTURE 禁改项 + ADR-008。
- **禁动终端隐喻 / 润色文案**：bash 隐喻不换（不写 zsh）；HANDOFF 文案不"优化"。
- **禁在公开仓库新增"靠 .gitignore 防护的私密文件"**：私密内容（求职文案 / 谈薪 / 个人优势字段）放 worklog（私密仓库），不放本仓库（2026-05-10 CLAUDE.md 泄露 + 5/13 job-notes.md 迁移的教训）。
- **私人生活禁词**：终端文案 + 化身都不碰一份私人生活类禁词清单（具体词见**本地 CLAUDE.md / HANDOFF**，**不在公开 AIREADME 展开** —— 这些正是从公开主页清除的私人信息）。
- **禁写简历 short-story 内容到正文**（番茄小说创作；5/11 起允许作为 Vibe Coding 工程亮点提及，但默认不展开）。
- **简历 versions/ 已迁 worklog**（本仓库 2026-05-26 git rm）—— 历史版本归档现归 worklog，禁改快照原则随之。
- **化身禁写通用工具脚本**（代码边界 B）：只讨论 Maxwell 自己项目的代码。
- **化身禁伪造第三方产品归属**：永远不说 OpenClaw/Claude/Cursor 等是"我做的"。
- **Edit 工具标点陷阱**：改简历等中英混排文件，old_string 含中文/全角标点时先 Read 精确 copy-paste（全角 `（）：` vs 半角易混），大段改用 Write 整文件重写。
- **不再提 git commit author 问题**（Maxwell 是英文名，主机名不影响识别，用户 2026-05-07 确认）。
