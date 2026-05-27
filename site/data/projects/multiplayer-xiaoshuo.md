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
  - node.js
  - redis
  - 阿里云百炼
  - puppeteer
---

## README

多人实时共创互动叙事 H5（tale.maxwellii.com），3-8 名玩家同房间扮演角色，AI 担任隐形 DM 实时生成世界观和剧情推进。核心机制：每人每轮获得独立专属选项，不是多数决投票，AI 按每个角色的 3 个隐藏属性（好感/狠辣/声望，玩家不可见，0-100）隐式判定行动叙事效果，10-30 回合走向个性化结局。

V2「剧聊」以 5 个题材标签（武侠/架空历史/言情/宫斗/悬疑）替代 V1 的 10 个固定剧本，AI 实时生成世界观和角色；3 种投票机制（危急时刻/公共决策/主动结束）约束剧情节奏；服务端 puppeteer PDF 导出（字体子集嵌入解决微信 X5/iOS Safari 跨端兼容），nginx proxy_read_timeout 180s 支撑长渲染。

AI 调用经 8 节点优化方案：8 人局 30 回合约 70 次调用，比原方案省 60%。上下文分层压缩：近 5 轮保留全文，更早每 5 轮合并 200 字摘要，维持叙事连贯的同时控制 token 消耗。

2026-05-24 AI 上游从火山方舟切到阿里云百炼 qwen3.6-plus，回合延迟从 doubao-seed-2.0-lite 的约 10 秒降至约 1 秒。生产 PM2 端口 3099，与 naming.maxwellii.com 共享 47.84.100.47 的 443 SNI，8 天 Redis TTL 加 7 天 cleanup cron 兜底。

## NOTES

- **AI 隐式判定 vs 多数决投票**：传统多人桌游靠投票，用户感受是"少数服从多数"；本项目每人独立选项加 AI 按隐藏属性判定，用户感受是"角色个性被 AI 感知"。属性数值对玩家不可见，避免出现"反向最优策略"（比如故意压某个属性）破坏叙事沉浸。

- **服务端 PDF 贵但稳**：前端 html2pdf.js 在移动端 webview 丢字和排版错乱，多轮修复未根治，根因是中文字体在 iOS Safari/微信 X5 的渲染差异。转服务端 puppeteer 一次解决。Debian 字体名必须用「Noto Serif CJK SC」，靠 fc-list 确认，不能靠经验猜测。教训：前端导出 PDF 看起来轻量，真机适配代价远超预期。

- **OpenAI 兼容协议的战略价值**：AI 上游换了三次（doubao → deepseek → 百炼 qwen3.6-plus），每次只改 3 个 env 变量，代码零改动。这是架构决策，不是偶然，选型时就要求上游必须兼容 OpenAI 协议，否则每次切换都是重构。
