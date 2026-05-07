# Maxwell-Resume — 简历仓库工作指引

> 个人简历仓库 [github.com/iyuenan3/Maxwell-Resume](https://github.com/iyuenan3/Maxwell-Resume)（公开）。维护 Maxwell（李越男）不同时期的简历版本。

## 仓库结构

```
├── README.md                                   # 仓库说明 + 版本索引页（GitHub 首页渲染）
├── .gitignore                                  # 忽略 .DS_Store 等系统文件
├── CLAUDE.md                                   # 本文件
├── MaxwellLi-<TargetRole>-YYYYMMDD.md          # 当前最新简历（根目录仅放最新）
├── MaxwellLi-<TargetRole>-YYYYMMDD.html        # A4 打印优化版
└── versions/                                    # 历史版本归档
    └── MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}
```

## 文件命名约定

`MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}`

- 主名格式：姓名（英文名 + 姓拼音驼峰 `MaxwellLi`）+ 目标岗位（驼峰）+ 8 位日期戳
- **目标岗位随求职定位演进**：
  - `AIProductManager` — 当前定位（2026.05 起，AI 产品独立顾问 / Claude Code 全栈实战）
  - `ProductManager` — 转型期（2024-12，Nokia 离职后投递，DevOps 背景转产品）
  - `DevOpsEngineer` — 早期定位（2018-2024，云平台运维开发，Nokia 时期）
- 文件类型：`.md` / `.html` 为最新版；`.pdf` 为历史归档版（来自当年实际投递的 PDF）
- 最新版与历史版**命名格式一致**，仅位置不同（根目录 vs `versions/`）。无 `Latest` 后缀

## 关键约定

### 1. 公开仓库隐私脱敏
- 手机号必须打码：`15958170755` → `xxxxx170755`
- 邮箱保留完整（公开联系方式）
- 历史版本（`versions/`）保留原样不动

### 2. 内容边界
- **可写入简历的当前公开项目**：eastern-wisdom、multiplayer-xiaoshuo、worklog、AI-Knowleage、yuan-MBP-a股200亿投研
- **不写入简历**：short-story（番茄小说短篇创作） — 副业感不利于 AI 求职定位
- **删除的内容**：PetsLog（负面数据）、IoT 软硬一体化（无对应经历）、OpenClaw 实战专家标签（已不符合当前定位）

### 3. 表达风格
- 离职时间用月份精度（如 `2025.03 - 2026.04`，不带日）
- 半角冒号统一并列项（`Blog: maxwellii.com`）
- 数据范围用 `–`（en dash）：`2–8 人` 而非 `2-8 人`
- 项目段格式：粗体小标题 → blockquote 引用块（链接 + 技术栈一行）→ bullet 列表

### 4. HTML 排版规范
- A4 页面，边距 8mm 上下 / 15mm 左右
- 字号 9.1pt，行距 1.38（极限压缩，目标 A4 一页）
- 主色 #1a5276（科技蓝），强调色 #c0392b（朱砂红，仅用于 blockquote 边框）
- 字体 EB Garamond / Ma Shan Zheng / 系统中文回退
- `page-break-after: avoid` 在所有 h2/h3/h4 上
- meta viewport / description 必须有
- 所有 URL 必须用 `<a href>` 让 PDF 可点

## 新增版本工作流

```bash
# 假设当前最新是 MaxwellLi-AIProductManager-20260507.{md,html}，要新增 0610 版

git mv MaxwellLi-AIProductManager-20260507.md  versions/
git mv MaxwellLi-AIProductManager-20260507.html versions/

# 在根目录写新版 MaxwellLi-AIProductManager-20260610.{md,html}
# 更新 README.md 版本历史表（新增 0610 行 + 把 0507 行 ⭐ 去掉）
# git add + commit + push（仅当用户明确指令时）
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
