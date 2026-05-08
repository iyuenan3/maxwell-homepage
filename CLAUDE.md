# Maxwell-Resume — 简历仓库工作指引

> 个人简历仓库 [github.com/iyuenan3/Maxwell-Resume](https://github.com/iyuenan3/Maxwell-Resume)（公开）。维护 Maxwell（李越男）不同时期的简历版本。

## 仓库结构

```
├── README.md                                   # 仓库说明 + 版本索引页（GitHub 首页渲染）
├── .gitignore                                  # 忽略 .DS_Store 等系统文件
├── CLAUDE.md                                   # 本文件
├── MaxwellLi-<TargetRole>.md                   # 当前最新简历（根目录不带日期，常驻）
├── MaxwellLi-<TargetRole>.html                 # A4 打印优化版
├── assets/avatar.jpg                           # 头像（README 与 site/public/ 各持一份）
├── site/                                        # maxwellii.com 个人主页源码（已上线 2026-05-08）
│   ├── public/      # 静态文件根（index.html / styles.css / avatar.jpg / p/）
│   │   └── p/       # ← build 输出，详情页 11 项（gitignore，部署时现 build）
│   ├── data/projects/<slug>.md  # ← 二级页面数据源（11 个，git tracked）
│   ├── templates/   # _base.html 终端壳模板
│   ├── build.js     # ← Node 纯实现，零依赖，详情页构建器
│   ├── nginx.conf   # 生产 nginx 配置模板
│   ├── deploy.sh    # node build.js → rsync（部署 SOP 见根 README）
│   ├── .gitignore   # 忽略 public/p/
│   └── .env.example
└── versions/                                    # 历史版本归档（带归档日期）
    └── MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}
```

## 文件命名约定

- **根目录最新版**：`MaxwellLi-<TargetRole>.{md,html}`（不带日期，常驻）
- **versions/ 归档版**：`MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}`（归档日期，永远不再变）

主名格式：姓名（英文名 + 姓拼音驼峰 `MaxwellLi`）+ 目标岗位（驼峰）

- **目标岗位随求职定位演进**：
  - `AIProductManager` — 当前定位（2026.05 起，AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师）
  - `ProductManager` — 转型期（2024-12，Nokia 离职后投递，DevOps 背景转产品）
  - `DevOpsEngineer` — 早期定位（2018-2024，云平台运维开发，Nokia 时期）
- 文件类型：`.md` / `.html` 为根目录最新版；`.pdf` 为历史归档版（来自当年实际投递的 PDF）
- 无 `Latest` 后缀；根目录文件不带日期，归档到 `versions/` 时才加日期

## 关键约定

### 1. 公开仓库隐私脱敏
- 手机号必须打码：`15958170755` → `xxxxx170755`
- 邮箱保留完整（公开联系方式）
- 历史版本（`versions/`）保留原样不动

### 2. 内容边界
- **可写入简历的当前公开项目**：eastern-wisdom、multiplayer-xiaoshuo、worklog、AI-Knowleage、claude-financial-research（外部顾问，原名 yuan-MBP-a股200亿投研 / equity-200b）、PetsLog（GitHub 双仓库 Cursor + OpenClaw）、OpenClaw-Customize-Skills、k8s-om
- **不写入简历**：short-story（番茄小说短篇创作） — 副业感不利于 AI 求职定位
- **历史已删除的负面/失效内容**：IoT 软硬一体化（无对应经历）、OpenClaw 实战专家标签（已不符合 v4 定位）、PetsLog 56.7% 通过率（负面数据已删，但 PetsLog 项目本身已恢复展示"双工具对比"亮点）

### 3. 表达风格
- 离职时间用月份精度（如 `2025.03 - 2026.04`，不带日）
- 半角冒号统一并列项（`Blog: maxwellii.com`）
- 数据范围用 `–`（en dash）：`2–8 人` 而非 `2-8 人`
- 项目段格式：粗体小标题 → blockquote 引用块（链接 + 技术栈一行）→ bullet 列表

### 4. HTML 排版规范
- A4 页面，边距 8mm 上下 / 15mm 左右
- **目标：A4 两页**（不是一页），允许适度舒展，不必极限压缩
- 字号 9.1pt，行距 1.38（当前参数最初为单页极限压缩设；两页目标下可放宽到 9.5pt + 行距 1.4-1.5，更易读）
- 主色 #1a5276（科技蓝），强调色 #c0392b（朱砂红，仅用于 blockquote 边框）
- 字体 EB Garamond / Ma Shan Zheng / 系统中文回退
- `page-break-after: avoid` 在所有 h2/h3/h4 上
- meta viewport / description 必须有
- 所有 URL 必须用 `<a href>` 让 PDF 可点

### 5. maxwellii.com 个人主页（已上线 2026-05-08）

- 源码在 `site/public/`，部署 SOP 见根 README「个人主页 — maxwellii.com」段
- 部署架构：Cloudflare 代理 → 47.84.100.47 origin (`singapore` SSH) → `/home/admin/maxwellii-site/`
- **内容三处必须同步**：简历 MD/HTML / 主页 `site/public/index.html` / README.md（定位语、4 大独立项目、项目命名）
- **HANDOFF 边界（来自原始设计稿）**：终端隐喻不能换、文案不要"优化"或润色、有禁词清单（抚仙湖 / 骑行 / 公路车 / 诗人 / 诗歌 / 丁克 / 0 kids / 感情 / 婚姻）
- **shell 隐喻**：终端壳一律 `bash`（titlebar `~/iyuenan3 — bash — 100×40`），不要写 `zsh`

### 5.1 二级详情页（site/p/<slug>.html）

主页 `ls projects/` 11 行各对应一个详情页。**纯静态、零运行时依赖、无 npm 包**：

- **数据**：`site/data/projects/<slug>.md`（YAML frontmatter + body markdown 段）
- **模板**：`site/templates/_base.html`（终端壳骨架）+ build.js 内置 9 个组件
- **构建**：`node site/build.js` → 输出 `site/public/p/<slug>.html`（gitignore）
- **部署**：`bash site/deploy.sh` 已串好 build → rsync 流程

**11 项 slug 与 wiki mapping**（带 wiki_slug 的 build 时主动读 `worklog/wiki/projects/<wiki_slug>.md` 抽 fact）：

| URL slug | wiki_slug | status |
|----------|----------|--------|
| eastern-wisdom | eastern-wisdom | live |
| multiplayer-xiaoshuo | multiplayer-xiaoshuo | live |
| worklog | worklog | wip |
| ai-knowleage | AI-Knowleage | wip |
| openclaw | openclaw | daemon |
| claude-financial-research | yuan-MBP-a股200亿投研 | ext（对外化名，不出现内部代号） |
| ifind-agent | yuan-MBP-ifind-agent | archived |
| petslog / openclaw-customize-skills / k8s-om / xhs-5agent-pipeline | _（无 wiki）_ | released / archived |

**9 个命令组件**（每项目挑 4-6 个，readme 必选 / links 必选）：
`readme` / `links` / `git_log` / `decisions` / `stats` / `notes` / `stack` / `ps` / `history` / `timeline`（截图接口预留，先不渲染）

**编辑详情页内容**：改 `site/data/projects/<slug>.md` 的 body 即可。`## README` / `## NOTES` / `## DECISIONS` / `## TIMELINE` 等 H2 段对应组件 output（`## DECISIONS` 留空时 build 自动从 wiki 决策日志拉）。改完 `bash site/deploy.sh` 一键发版。

### 6. BOSS 直聘打招呼语（独立场景）

- 每段上限 200 字（不是 150）；BOSS 字数算法约 = Python `len()` × 0.770
- 当前最新版本及取舍原则见 memory `feedback_boss_zhipin.md`
- 涉及打招呼语调整时优先看那份 memory 文件

## 新增版本工作流

```bash
# 假设当前根目录是 MaxwellLi-AIProductManager.{md,html}（无日期），
# 要把它归档为 0610 历史版，并在根目录写新最新版

# 1. 根目录文件归档到 versions/，加上归档日期
git mv MaxwellLi-AIProductManager.md  versions/MaxwellLi-AIProductManager-20260610.md
git mv MaxwellLi-AIProductManager.html versions/MaxwellLi-AIProductManager-20260610.html

# 2. 在根目录写新的 MaxwellLi-AIProductManager.{md,html}（依然不带日期）
# 3. 更新 README.md 版本历史表（新增 20260610 归档行；⭐ 行只更新日期和定位，文件链接不变）
# 4. git add + commit + push（仅当用户明确指令时）
```

## 改简历前的必读

修改简历前，先读 `~/Desktop/Claude-Project/worklog/wiki/index.md` 和最近一篇日记，建立 Maxwell 当前状态全貌。Maxwell 多项目并行进行，简历定位需基于真实近况而非旧记忆。

## 不要做的事

- 不要主动 commit / push（必须等用户明确指令）
- 不要把 short-story 项目内容写到简历里
- 不要修改 `versions/` 下的历史版本（它们是快照，应保持原样）
- 不要把 OpenClaw 标签放回当前简历定位（已不符合现状）
- 不要在公开版本展示完整手机号
- 不要再启用 `Resume-Latest.md` 这种带 `Latest` 后缀的命名
- 不要再提醒 git commit author 问题（Maxwell 是英文名，主机名不影响识别 — 用户 2026-05-07 确认）
