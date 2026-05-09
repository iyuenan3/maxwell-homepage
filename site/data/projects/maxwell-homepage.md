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
  - decisions
  - stack
  - notes
wiki_slug: maxwell-homepage
stack:
  - html
  - css
  - node.js
  - nginx
  - cloudflare
  - markdown
---

## README

Maxwell 的个人主页仓库（5/9 由 `Maxwell-Resume` 改名为 `maxwell-homepage`），承担两个职责：

1. **maxwellii.com 个人主页源码**（`site/`）— 终端体设计的静态站点，bash 隐喻 + CRT 扫描线 + 朱砂方印 + JetBrains Mono / Noto Serif SC。主页 `ls -lah projects/` 列出 10 项（含本仓库自身），每行点进对应详情页（终端 `cat README.md` 风格 + 中英双 H1）。
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

## NOTES

（待补 — 终端体设计稿不能改 / 文案不要润色 / 禁词清单 的工作流细节；为什么不用 SSG 框架而用纯 Node 0 依赖；name_en + name_zh 双名规范的演进史；简历归档子模块的位置正当性）
