---
slug: eastern-wisdom
name_en: "Eastern Wisdom · Diaspora Naming SaaS"
name_zh: "东方智慧 · 海外华人取名 SaaS"
status: live
since: 2026-05-08
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
  - stack
  - notes
wiki_slug: eastern-wisdom
stack:
  - next.js 16
  - typescript
  - tailwind 4
  - python 3.9
  - 阿里云百炼
  - monorepo
---

## README

中式传统文化 SaaS monorepo，主品牌 Eastern Wisdom，各 app 共享底座（AI 流水线、Python 命理计算层、UI 套件），独立子域名部署。已上线两款：chinese-name（外国人中文起名，naming.maxwellii.com，v1.2.1）和 oriental-oracle（东方占卜，涵盖小六壬/大六壬/梅花易数，oracle.maxwellii.com，v0.5）。

chinese-name 的核心是 4 阶段 AI 流水线：八字推算（Python 计算层）→ 候选字筛选（按五行用神/忌神过滤字库）→ LLM 并发生成（阿里云百炼）→ 笔画/音韵/寓意/双语解读评分。TypeScript 编排层通过 execSync 调 Python 子进程，JSON 通信，两层各自可独立迭代。

三档付费面向海外用户：Basic 5.90 / Standard 9.90 / Premium 24.90 美元。无数据库，结果落 JSON 文件 TTL 7 天，JWT 预览令牌承载八字；部署在新加坡阿里云 2C4G 主机，PM2 双实例加 300s Nginx 超时。SSE 渐进式名字生成让首个名字 3 秒内出现并持续追加，把 Premium 等待感从"几十秒一次性出"改为"打字机式落屏"。

2026-05-24 AI 上游从火山方舟 doubao 切到阿里云百炼；共享模块（payment/auth）遵循 lazy 触发原则，等第 2 个 app 真正复用时再抽象，oriental-oracle 是触发该原则的第一个案例。

## NOTES

- **美学是定价权，不是装饰**：v1.0 重设计把常规 SaaS 审美（圆角卡片、紫渐变、CTA 按钮）整体替换为博物馆出版物调性，朱砂印章加米纸底加 EB Garamond 衬线，组件层面把 Button/Card 换成 Seal/StrokeAnim。原因不是"更漂亮"，是 Premium 24.90 美元有心智门槛，美学不到位海外用户支付意愿过不了这关。

- **不确定的数据宁可不显示**：笔画数因上游 API 不可靠（与权威字典对不上），直接从结果页删除。教训来自早期版本被用户截图追问、客服成本高于开发成本。这条原则同样适用于 oriental-oracle 中任何需要外部数据源支撑准确性的字段。

- **monorepo lazy 触发**：payment/auth 等共享模块等到真有第 2 个 app 复用时再抽象，oriental-oracle 上线前预先抽象反而引发了"过度工程化先抽象再改回去"的返工。触发条件到了再动，是比预先设计更省力的路径。

- **oriental-oracle 选冷门术数有产品逻辑**：选小六壬/大六壬/梅花易数而非塔罗，是因为塔罗已被卷烂，且 oracle 做的是真实推算（掌诀/八卦取余、体用生克），非随机模拟，用户在结果页能看到推算步骤，这是内容可信度的来源。
