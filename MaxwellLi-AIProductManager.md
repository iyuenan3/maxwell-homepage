# 李越男 Maxwell

xxxxx170755 | limaxwell93@gmail.com  
LinkedIn: linkedin.com/in/iyuenan3 | GitHub: github.com/iyuenan3 | Blog: limaxwell93.wordpress.com

---

## 个人定位

**AI 产品经理 | AI 落地顾问 | Vibe Coding 全栈工程师**

10 年技术研发与产品管理复合背景（华为 → Nokia → 全境骑行 AI 产品负责人）。2026.04 离职后转入独立项目与顾问实战，建立了 Multi-Agent 编排、LLM Wiki 知识库工程化、生产级 SaaS/H5 全栈交付的完整方法论闭环。擅长以第一性原理重构业务流程，能力定位是"助企业把 AI 工作流真正落到生产的实战 builder" — 既适合独立顾问交付，也适合加入 AI 初创 Day One 团队。

> 已交付 2 个上生产 AI 产品：[naming.maxwellii.com](https://naming.maxwellii.com)（海外华人取名 SaaS）+ [tale.maxwellii.com](https://tale.maxwellii.com)（多人实时叙事 H5）；同步推进 6 个并行工程化项目。

---

## 核心技能

  - **Vibe Coding 全栈实战**：Claude Code 主战工具、Skill 开发、多项目并行编排、SOP 化提示词系统、Sub-Agent 协作、Karpathy LLM Wiki 知识库工程化
  - **AI 产品工程化**：Multi-Agent 架构（OpenClaw → Claude Code CLI 演进实践）、Prompt Engineering、RAG 知识库、零代码到生产级的全栈交付、MVP 策略 + RICE 优先级评估
  - **业务流程自动化**：跨系统集成（飞书 API 全家桶 / Notion / 阿里云 / iFinD）、Playwright 拟人化交互、防风控与容错机制设计、SOP 标准化体系建设
  - **全栈技术栈**：Next.js 16 / Vue 3 / TypeScript / Python / Node.js / Socket.IO / Redis / 火山引擎 doubao / DeepSeek V4 Flash
  - **基础设施与 DevOps**：Kubernetes 容器化、Jenkins / GitHub Actions CI/CD、autossh + FRP 双通道隧道、阿里云架构（FinOps 成本 -31%）、敏捷开发（Scrum）+ 跨部门协作枢纽

---

## 独立项目与顾问实战 (2026.04 至今)

### 1. eastern-wisdom · 海外华人取名 SaaS（已上线生产）

> [naming.maxwellii.com](https://naming.maxwellii.com) · Next.js 16 + TypeScript + Python 3.9 + 火山引擎 doubao-seed-2.0-lite + 阿里云新加坡

  - **4-Stage AI 流水线**：Bazi 八字 → 候选字筛选 → AI 生成 → 验证评分（TypeScript 编排层 + Python 计算层，ThreadPoolExecutor 并行调用）
  - **三档付费体系**（$5.90 / $9.90 / $24.90），Premium 输出双语历史人物深度文化报告
  - **Claude Design 博物馆出版物美学**：朱砂红印章 + 米纸底色 + EB Garamond + Ma Shan Zheng 行楷
  - **零数据库架构**：JWT 预览令牌（HMAC-SHA256，30 分钟 TTL）+ 文件存储 + TTL 自动清理
  - **monorepo 工程化**：npm workspaces + PM2 双实例 + Nginx + Method A 双语全站铺设

### 2. multiplayer-xiaoshuo · 多人实时共创叙事 H5（已上线生产）

> [tale.maxwellii.com](https://tale.maxwellii.com) · Vue 3 + Vant + Socket.IO + Node.js + Redis + DeepSeek V4 Flash

  - **2–8 人同房间**扮演角色，AI 根据隐藏属性值实时生成剧情（无投票机制，30 秒倒计时，AI 替身补位）
  - **10 个题材剧本**（古装宫斗 / 武侠江湖 / 谍战特工 / 仙侠修真 / 星际科幻 等），统一封面美学语言
  - **8 步流水线开发**：5 个并行 Agent 同时写后端模块；上下文分层摘要（近 5 轮全文 + 每 5 轮压缩 200 字 + 全局大纲）
  - **生产部署**：PM2 + Nginx 共享新加坡服务器 SNI 多域名

### 3. worklog + AI-Knowledge · 知识工程化双子项目

  - **worklog**：基于 Karpathy LLM Wiki 三层架构（Schema/Wiki/Raw）的工作日记 & 知识库系统，自创"摄入时编译 vs 查询时编译"的编译器范式，3 天迭代到 v2.2
  - **AI-Knowledge**：AI 开源项目研究知识库，A+B+C 三级递进研究方法（README 精读 → 横向对比 → 源码 Clone 分析），**55 Wiki 页 / 78 raw 资料 / 0 死链 / 0 矛盾 / 0 孤儿页面**，自带 Lint 健康检查流程
  - **价值**：验证"LLM 维护 Wiki"的工程可行性 — 一次 Ingest 触及 10+ 页面，维护成本趋近于零

### 4. claude-financial-research · A 股 200 亿+ 权益研究系统（外部顾问）

> 基于 [Anthropic 官方 financial-services](https://github.com/anthropics/financial-services)（6 Skill + 10 Template）+ Claude Code CLI 单人协作 + 扁平 CSV + 财报/公告 PDF + 七模块固定结构 Markdown 报告

  - **标的池**：A 股市值 ≥ 200 亿元（实测 1,095 只清洗 ST 后），每月初快照固定
  - **核心纪律**：只采信 iFinD 导出 CSV + 定期财报 PDF + 官方公告 PDF；**不输出任何投资建议**（合规边界）
  - **七模块报告结构**：主营业务 / 财务趋势 / 资产负债 / 估值分位 / 同业对比 / 核心优势 / 潜在风险
  - **第一性原理决策**：5/5 自研 OpenClaw 三 Agent 方案 → 看到 Anthropic 官方 financial-services 后 5/6 整体推翻，转向"用官方 skills + 不写投资建议"路线 — 体现"愿意推翻自家架构去用更优解"的工程判断力

---

## 工作经历

### 杭州全境骑行文旅有限公司 | 软件部主管 / AI 产品负责人 | 2025.03 - 2026.04

**核心成果**：主导公司数字化与自动化重构，基于 OpenClaw 打造企业级 AI 数字员工平台，重塑多部门业务 SOP，推动全国门店系统的平滑切换。

**1. AI 数字员工平台（核心内部产品）**

  - 打通飞书全套 API（文档 / 多维表格 / 审批流），跨系统数据自动流转；阿里云 text-embedding-v4 RAG 检索；Cron 调度 + 场景化 Prompt 模板保障稳定输出
  - **新媒体侧**：分析海量历史订单定位低复购套餐，输出"储值转券包"优化策略，规避合规风险并提升私域用户粘性
  - **研发侧**：需求进度同步、缺陷追踪、自动化测试执行交由 Agent 托管，规范技术对接流程

**2. 小红书全链路自动化运营（多 Agent 协作产品）**

  - 拆分 5 个标准化节点 + 5 Agent 角色（文案生成 / 图片匹配 / 发布执行 / 互动引流 / 运营分析），流水线作业各司其职
  - Playwright 驱动真实浏览器拟人化交互；针对小红书页面频改设计语义化 UI 定位策略；异常重试 + 频率控制等防风控机制
  - **业务价值**：单人每日运营时间从 2-3h/日 压缩至每周 1h 素材统筹，矩阵账号曝光与自然流量获取实现质的跃升

**3. 需求治理与标准化 SOP 建设**

  - **需求中台漏斗**：作为跨部门需求枢纽，引入 RICE 评分模型，梳理并确认 54 条关键业务需求
  - **MVP 策略**：确立"稳定性优先于功能丰富度"原则，输出《全境骑行系统功能拆分》，保障首店（西溪湿地）无 P0 级事故平滑过渡
  - **SOP 知识库**：主导编制《后台操作手册》《异常处理 QA 集》《软件配置需求处理》等 7 套标准化文件，**技术部日常响应频次降低 40%**
  - **敏捷转型与 FinOps**：瀑布转敏捷，**交付周期缩短 30%**；阿里云架构优化，**IT 采购成本降低 31%**

---

### Nokia | DevOps Engineer | 2018.08 - 2024.04

**核心成果**：无线接入网络（RAN）容器化平台与自动化运维体系建设。

  - **K8s / OpenStack 平台建设**：规划、设计、搭建并维护 OpenStack + Kubernetes 平台，支持 vCU/vDU 自动化部署
  - **CI/CD 流水线**：搭建 Jenkins 流水线，优化 Job 配置提升部署速度与质量
  - **自动化测试开发**：Python + Robot Framework 开发 29 例自动化测试用例，**基础功能覆盖 100%，测试时间缩短 50%**
  - **运维工具开发**：自研 `k8s-om`（K8s 多租户批量管理 Ansible 工具，支持租户创建 / 权限配置 / 用量限制）+ `Kuashaw`（vCU/vDU 部署参数简化工具，集成删建、升降级）
  - **技术创新**：申请并通过 **9 项 Innovation Idea**（代码错误统计分析工具、K8s 自动修复脚本等）
  - **开源贡献**：与 RedHat 合作测试商用 K8s 平台，识别并协助解决 **11 个关键性问题**

---

### 华为 | 开发工程师 | 2016.07 - 2018.07

**云核心网研究部（2016.07 - 2017.11）**

  - **Compass4nfv 项目**：OPNFV 开源集成项目，独立完成 OpenStack **Newton** 版本集成，发现并协助修复 Ceilometer 项目 Bug
  - **动态扩容**：实现计算节点不中断业务扩容；针对内网环境实现 OpenStack 离线部署，推动商业化落地
  - **代码调优 + 网络优化**：修改千余行不规范 Ansible 代码；完成 DPDK + SR-IOV 集成与调试

**2012 实验室（2017.12 - 2018.07）**

  - **低照度样机项目**：负责配准算法开发、图像视频采集与测试
  - **算法优化**：采用 ORB + APAP 算法提高精度，Matlab 仿真测试；与海康黑光球机对比测试制定评估标准

---

## 个人开源项目

  - **PetsLog**（[Cursor-PetsLog](https://github.com/iyuenan3/Cursor-PetsLog) + [OpenClaw-PetsLog](https://github.com/iyuenan3/OpenClaw-PetsLog)）：宠物健康管理系统 · uni-app 双端（微信小程序 + H5）+ Vue3 + uniCloud + ECharts + Notion API · 用药记录 / 健康报告 / 提醒推送 / 离线模式 / 语音输入 · 同需求双工具实现对比
  - **[OpenClaw-Customize-Skills](https://github.com/iyuenan3/OpenClaw-Customize-Skills)**：自定义 Skill 库，含 moltbook-daily（日报生成）/ wordpress-blog-writer（博客全链路）/ story-writer（故事创作）等
  - **[k8s-om](https://github.com/iyuenan3/k8s-om)**：K8s 运维自动化工具集（Ansible Playbooks），批量租户管理 + 权限/用量配置 + Helm3 环境

---

## 教育经历

**杭州电子科技大学 | 自动化 | 本科 | 2012.09 - 2016.06**  
毕业设计：摄像机白平衡算法研究。校园活动：自行车协会会长，第一届"华东高校车协发展论坛"发起人。

---

## 个人专利（6 项 · 早期跨学科创新积累）

  - 《充气式无线电测向天线》CN204809402U
  - 《安全电动卷帘门》CN203476183U
  - 《凹形减速带》CN203144932U
  - 《带 USB 插座的键盘》CN202956727U
  - 《带磁机油排放螺栓》CN202181935U
  - 《磁性机油标尺》CN202181936U
