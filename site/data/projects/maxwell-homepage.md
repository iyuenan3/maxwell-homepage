---
slug: maxwell-homepage
name_en: "maxwellii.com · Bash-Style Personal Site"
name_zh: "maxwellii.com · 终端体个人主页"
status: live
since: 2026-05-08
links:
  url: https://maxwellii.com
  source: https://github.com/iyuenan3/maxwell-homepage
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: maxwell-homepage
stack:
  - html
  - css
  - node.js
  - next.js
  - nginx
  - cloudflare
  - markdown
  - doubao
  - rag
---

## README

Maxwell 的个人主页仓库（5/9 由 `Maxwell-Resume` 改名为 `maxwell-homepage`），承担两个职责：

1. **maxwellii.com 个人主页源码**（`site/`）— 终端体设计的静态站点，bash 隐喻 + CRT 扫描线 + 朱砂方印 + JetBrains Mono / Noto Serif SC。主页 `ls -lah projects/` 列出 10 项（含本仓库自身），每行点进对应详情页（终端 `cat README.md` 风格 + 中英双 H1）。**5/10 v2.2.0 上线 V2「LLM 化身对话」**：右下角浮窗内置 chat-api 后端 + RAG vault（407 .md / 4 大类多源平衡 / doubao-pro 256K context），访客可直接和"AI 版 Maxwell"对话。
2. **简历多版本归档**（`MaxwellLi-AIProductManager.{md,html}` + `versions/`）— 根目录常驻当前最新版（不带日期），历史版本归档到 `versions/` 时加日期戳。

构建器是纯 Node 零依赖的 `site/build.js`，从 `site/data/projects/<slug>.md` 的 YAML frontmatter + body 渲染出 `site/public/p/<slug>.html`。frontmatter 双名规范（5/9 v2）：`slug` / `name_en` / `name_zh` / `wiki_slug` 四件套，wiki_slug 关联到 `~/Desktop/Claude-Project/worklog/wiki/projects/<wiki_slug>.md`，build 时主动抽 git_log / decisions / stats fact。

部署：Cloudflare 代理 → 47.84.100.47 origin (`alicloud-sg` SSH) → `/home/admin/maxwellii-site/`。`bash site/deploy.sh` 一键 build + rsync。nginx 拆 CSS/JS（must-revalidate）vs 图片字体（30d immutable），3 条 301 redirect 兜底改名 / 合并的旧 URL。

## DECISIONS

- **2026-05-07** — maxwellii.com 上线（终端体设计稿 + 简历定位升级 + 命名规则调整）
- **2026-05-08** — 二级详情页系统 v1：11 项目详情页 + Node 零依赖构建器（site/build.js）+ 终端壳模板 + 5 状态系统（planned/active/live/paused/archived）
- **2026-05-09 (双名 v2)** — site/data/projects/ frontmatter 加 name_en + name_zh 字段，主页 ls 三层 stacked（slug cyan / 双名 amber / desc fg-bright），详情页 page-header 改终端 cat README.md 风格 + 中英双 H1。11 → 9 项（合并 customize-skills → openclaw / ifind-agent → cfr）
- **2026-05-09 (业务改名)** — Maxwell-Resume → maxwell-homepage（GitHub repo + 本地目录 + Claude memory dir 全部同步），定位从「简历仓库」扩展为「简历 + maxwellii.com 个人主页」
- **2026-05-09 (CSS 缓存策略)** — nginx 拆 CSS/JS（must-revalidate）vs 图片字体（30d immutable）；nginx 加 3 条 301 redirect 兜底旧 URL（ai-knowleage / openclaw-customize-skills / ifind-agent）
- **2026-05-09 (主页加 self)** — maxwell-homepage 项目自身加入 ls projects/，9 → 10 行（meta 自指）
- **2026-05-10 (V2 v2.2.0 上线 LLM 化身)** — chat-api 后端（Next.js）+ RAG vault 407 .md（4 大类 personal / work-history / current-projects / knowledge-base）+ doubao-pro 256K context + 多源平衡（perCategoryMax）+ 12 段防御 prompt
- **2026-05-10 (安全修复)** — 千野渗透报告 P0+P1 全修：CSP `script-src 'self'`（inline `<script>` 全提取到 reveal.js / detail-init.js）+ 4 个安全响应头（CSP / X-Frame-Options / nosniff / Referrer-Policy）+ Markdown 链接 URL scheme 校验 + token-hud 改 textContent + Rate limit 20/min/IP
- **2026-05-10 (UX 修)** — V2 chat IME 中文输入法 Enter 不误发送 + 输入流式滚动条不乱跳（rAF + 距底部检测）+ 详情页空白修复（detail-init.js 路径连锁）+ V2 项目链接同标签跳转（与 V1 一致 + bfcache 保留 chat 上下文）+ chat 输入等待加 [thinking] 提示

## NOTES

- **终端体设计的克制原则** — 设计稿来自 claude.ai/design 的 HANDOFF，**bash 隐喻不可换 / 文案不"优化"或润色**。每次内容更新先看这条，不踩雷。

- **为什么用纯 Node 0 依赖构建器** — SSG 框架（Next.js / Astro / Hugo）对于「10 个项目展示」是杀鸡用牛刀，而且终端体的 ASCII art / 等宽栅格输出是非典型 SSG 场景。自己写 `site/build.js` 反而更可控：YAML frontmatter + Markdown body → 终端壳模板填充，~500 行覆盖全部生成逻辑，零 npm 依赖。

- **RAG vault 在仓库外的设计**（5/10 v2.2.0）— `chat-api` 用的 RAG 知识库（407 .md / 4 大类 personal / work-history / current-projects / knowledge-base）放在 `~/Desktop/Claude-Project/maxwell-rag-sources/` 独立 Obsidian Vault，**绝不入公开 git**。原因：① 含真实 PII（手机号 / 真名 / 财务数据），公开仓库零容忍；② vault 可独立迭代（重新 LLM-judge 分级 / 重 sanitize），不影响 maxwell-homepage 仓库；③ embeddings.json 84MB build artifact 也走 rsync 推服务器、不入 git。

- **chat-api 体验优先 token 不计较** — V2 LLM 化身的设计哲学：`max_tokens 2000 / topK 20 / 单条 8000 字符 / Rate 20 req/min/IP`，所有上限都给最大空间。doubao-pro 256K context 也没必要省 token。原则是「访客体验 > 后端账单」，反正流量不大。

- **CSP 连锁修复教训**（5/10 事故复盘）— `script-src 'self'` 启用后 V1 主页 + 详情页**整页空白**，根因是 inline `<script>`（IO observer / referrer 路由）被 CSP 拦截。修复链 3 步：① V1/V2/详情页所有 inline 提取到 `reveal.js` / `detail-init.js`；② `deploy.sh` Stage 4 / 5 复制清单**必须**含所有 .js 文件（V1 路径 + 根目录两处都要）；③ `detail-init.js` 加 100ms `setTimeout` fallback 强制 `add('in')` 防 IO 未 fire。教训：**CSP 升级要全栈 audit + 部署清单是隐藏依赖**。

- **简历归档作为子模块的位置正当性** — `MaxwellLi-AIProductManager.{md,html}` + `versions/` 跟 `site/` 主页源码合并到同一仓库，原因是简历和个人主页本质是「展示自己」的两个 channel，分开维护会有命名 / 内容同步成本（实际 5/9 业务改名 Maxwell-Resume → maxwell-homepage 就是基于这个洞察）。
