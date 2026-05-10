---
slug: multiplayer-xiaoshuo
name_en: "Multiplayer Xiaoshuo · Interactive Multiplayer Fiction"
name_zh: "多人与 AI 互动共创小说"
status: live
since: 2026-05-08
links:
  url: https://tale.maxwellii.com
  source: private
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: multiplayer-xiaoshuo
stack:
  - vue 3
  - socket.io
  - redis
  - deepseek
  - puppeteer
---

## README

多人实时共创互动叙事 H5。3-8 名玩家在同一房间扮演角色，AI 根据每个人的**隐藏属性**（好感 / 狠辣 / 声望，0-100，玩家不可见）实时判定行动叙事效果，**不是多数决投票**——这是与同类产品的核心区别。AI 替身自动补位，60 秒倒计时超时由 AI 接管。10-30 回合推进至个性化结局。

**V2「剧聊」5/8 23:22 上线 tale.maxwellii.com**：5 题材 AI 实时生成（武侠 / 架空历史 / 言情 / 宫斗 / 悬疑）替代 V1 的 10 个固定剧本，3 通用属性统一替代 V1 的剧本独立属性，加危急时刻投票（每人每局最多 2 次）+ 公共决策 + 主动结束 三种投票，**服务端 PDF 章节导出**（puppeteer + 字体子集嵌入 + nginx 180s 超时支持长渲染）。

模型从 doubao-seed-2.0-lite 切换到 **DeepSeek V4 Flash**（回合延迟 ~10s → ~1s，10 倍速度提升）。8 天 Redis TTL + 7 天 cleanup cron 兜底。生产 PM2 `tale-server` 端口 :3099，与 naming.maxwellii.com 共享 47.84.100.47 的 443 SNI。

V1 → V2 大重构方法论：分支化（`feature/juliao`）+ 物理备份（`../multiplayer-xiaoshuo.bak-2026-05-08/`）+ 文档先行（`docs/juliao/IMPLEMENTATION.md` + `SEQUENCES.md` 未审批先 commit）+ Phase 1-7 渐进实现。AI 调用估算 8 人局 30 轮约 70 次（vs 原方案 200+，省 60%）。

## NOTES

- **AI 隐式判定 vs 多数决投票** — V2 核心设计 hypothesis：传统多人桌游用投票决定剧情走向，体验"集体决策"；本项目用 AI 根据每个角色的隐藏属性值（好感 50 / 狠辣 30 / 声望 50 起步）独立判定每个行动的叙事效果，体验"角色个性 + AI DM"。属性玩家不可见，避免数值博弈反过来"反向最优策略"破坏沉浸。

- **V1 → V2 大重构的方法论**（5/7 凌晨执行）— 改动量大（socket / AI prompts / 前端三大页全部重写、scripts/ 整个删除）任何错误都可能让 V1 也无法启动。所以走"分支化 + 物理备份 + 文档先行"三保险：① `feature/juliao` 分支隔离；② `cp -r` 物理备份 V1 完整快照（git 分支 + 物理拷贝双保险）；③ `docs/juliao/IMPLEMENTATION.md` + `SEQUENCES.md` **未审批先 commit**（commit 标"待用户审批"，让方案可追溯，即使被改也能 git diff 看演进）。

- **scripts/ 彻底删除而非保留** — V1 的 10 个剧本 JSON 在 V2 完全用 5 题材 AI 生成替代，scripts/ 失去依附。`/api/scripts` 改 410 Gone（明确"永久消失"）而非 404，给爬虫和老客户端明确信号。

- **PDF 方案从客户端转服务端** — 客户端 html2pdf.js 在真机字体兼容性问题持续（中文字体在 webview 渲染丢字 / 排版错乱），转用 puppeteer-core + 字体子集嵌入。生产服务器装 snap chromium 147 + nginx `proxy_read_timeout 180s` 支撑长 PDF 渲染。教训：**前端导出 PDF 看起来简单，真机适配代价远超预期**；服务端渲染贵（chromium 进程开销大）但稳。

- **5 题材 + 3 通用属性 vs V1 的 10 剧本 + 各自属性** — V1 是"剧本驱动"（10 个 JSON 预写好世界观 + 角色 + 属性），V2 是"题材驱动"（5 个题材标签 + AI 实时生成世界观 + 角色 + 行动）。更通用、更少人工维护、AI 生成效果好但有"剧情飘"风险。MIN_END_ROUND=10 + 危急投票 + 主动结束 三种机制约束剧情节奏。

- **「无界·局」零预设方向已废弃**（不要重提）— Maxwell 早期讨论过零预设 / 双自由文本输入 / AI 隐形 DM / 可中断 3-7 天的"无界·局"路线，与"剧聊"路线冲突。已明确决定单独立项，不在本项目实施。
