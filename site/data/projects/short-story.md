---
slug: short-story
name_en: "Short-Story · Tomato Platform Commercial Shorts"
name_zh: "短篇小说 · 番茄平台商业短篇"
status: archived
since: 2026-05-06
links:
  url: "https://fanqienovel.com/main/writer"
  source: private
  docs: ""
commands:
  - readme
  - links
  - decisions
  - stats
  - stack
  - notes
wiki_slug: short-story
stack:
  - claude-code
  - playwright
  - python
  - txt
---

## README

> 历史归档：该内容创作与发布工作流已停止日常维护，保留本页作为阶段性方法与自动化实践记录。

为番茄小说平台创作商业级短篇故事的 Claude Code 工作流，配套 Playwright 自动化发布。每篇 7000-10000 字 TXT 纯文本，每日配额 20 篇，覆盖 9 个品类（追妻火葬场/真假千金/重生复仇/家庭伦理/豪门总裁/悬疑惊悚/年代文/现言甜宠等）。截至 5/12 累计 108 篇约 91.5 万字，单日峰值 25 篇/19.4 万字。

写作方法论核心：黄金 8 步法（钩子/设定/冲突/中点反转/二次冲突/危机高潮/真相揭露/首尾呼应）+ 5 种情绪曲线轮换 + 3 秒原则（第一句必有冲突）。初稿字数铁律：Claude 自然写作偏克制，初稿稳定落 4500-6700 字，目标 9000-10000 字需 2-4 轮扩写，最有效手段依次为补时间跨度/补第三方视角/补职业细节/补家人线。

Playwright MCP 自动化番茄作者后台发布（extract.py 剥元信息 + publish_prep.py 驱动发布页，经 Python 脚本全流程无需手动操作）。

## NOTES

- **情感驱动 vs 情节驱动的字数结构差异：** 追妻火葬场/豪门总裁等情感驱动型初稿天然 5500-11000 字（对话密集、情绪对峙多），年代文/悬疑惊悚等情节驱动型天然 4000-6500 字，需刻意加 30%+ 对话占比和至少 2 个额外独立场景才能达标。古风世情/民国旧影初稿最短（古风~2700 字），需要完全不同的词汇体系。**不同题材扩写策略根本不同，不能用同一套方法**。

- **Playwright 操作 ProseMirror 编辑器的工程坑：** 番茄发布页用 React + ProseMirror，直接 `.value=` 不触发 React onChange，必须用 native setter + dispatch input event。ProseMirror view 实例不在 DOM 上，要遍历 `window` 顶层属性找含 `.state.doc.dispatch` 且 `.dom === pm` 的对象。试读比例走 ProseMirror transaction 比拖拽 UI 快 10 倍且不出错。**这些反直觉操作必须在工程层固定，否则每次重跑踩坑**。

- **单题材连写 3+ 篇必须刻意换模板：** 连续相似结构（如重生复仇连续两篇都是「前世吊销资格/重生提前布局」）平台审核会判同质化，同时 Claude 也会陷入结构惯性。需从角色起点、职业场景、行动逻辑三个维度强制差异化，不能只换人名和场景标签。**同质化风险来自 Claude 的生成偏好，不只是内容题材的重叠**。
