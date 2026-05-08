---
slug: eastern-wisdom
title: eastern-wisdom
status: live
since: 2026-04-22
links:
  url: https://naming.maxwellii.com
  source: private
  docs: ""
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - notes
wiki_slug: eastern-wisdom
stack:
  - next.js 16
  - typescript strict
  - tailwind 4
  - python 3.9
  - 火山方舟 doubao
---

## README

为海外华人取地道中文名的 SaaS。把 **八字命理 + 五行平衡** 这件传统的、繁琐的、需要老师傅经验的事，编成一条 4 阶段 AI 流水线：八字推算（Python 计算层）→ 候选字筛选（按五行用神/忌神过滤字库）→ AI 生成（火山方舟 doubao 受限词表内并发出名）→ 评分验证（笔画、音韵、寓意、双语解读）。

视觉上不走"算命网站"的廉价感，而是博物馆出版物的克制气质：朱砂红印章 + 米纸底 + EB Garamond 衬线 + Ma Shan Zheng 行楷，海外用户首屏建立"这是认真做的"信任感。

三档付费，海外用户主体：Basic 5.90 / Standard 9.90 / Premium 24.90 美元；Premium 给到历史人物典故 + 双语完整报告。无数据库（结果落 `data/results/<id>.json`，TTL 7 天），JWT 预览令牌承载八字，部署在新加坡阿里云 2C4G 主机的 PM2 双实例 + 300s Nginx 超时。

5/7 凌晨上了 v1.2 渐进式名字生成（SSE 流式），首个名字 3 秒内出现并持续追加，把 Premium 等待感从"几十秒一次性出"改成"打字机式落屏"。

## NOTES

这是我离职后的第一个上生产 SaaS 产品。从 v0.1 到 v1.2 走了大半个月，每一次大版本都是一次审美博弈：

**v1.0 重设计** — 之前是产品级 Web 应用的常规审美（圆角卡片、紫色 gradient、CTA 按钮）。海外华人不需要这些套路，他们需要"中式美学的最低限度表达"。借 Claude Design 重做了一遍，把 Button / Card / Spinner 全部删掉，换成 Seal / RoundSeal / StrokeAnim（笔画动画用 IntersectionObserver 节流）。这不是"更漂亮"的问题，是定价权的问题——美学不到位，Premium 24.90 的心智门槛过不去。

**v1.1 双语方案选 Method A** — 英文为主、中文斜体小字置于下方。Method B（中英对半）会让英文母语者读起来吃力，Method C（纯英文）又丢了文化感。Method A 是付费意愿和文化氛围的平衡点。

**移除笔画数显示** — 上游 API 不可靠，宁可不显示也不显示错的。这条踩过坑：早期版本笔画数与权威字典对不上，被用户截图发邮件追问，后续客服成本高。
