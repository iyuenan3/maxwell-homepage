# 李越男 Maxwell

xxxxx170755 | limaxwell93@gmail.com  
LinkedIn: linkedin.com/in/iyuenan3 | GitHub: github.com/iyuenan3 | Blog: limaxwell93.wordpress.com

---

## 个人定位

**AI 产品经理 | AI 落地顾问 | Vibe Coding 全栈工程师**

10 年技术研发与产品管理复合背景（华为 → Nokia → 全境骑行 AI 产品负责人）。2025.10 起转入独立战场，承接外部 AI 落地咨询 + 一线 AI 产品端到端交付，建立了 **Multi-Agent 编排、LLM Wiki 知识工程化、Vibe Coding 工作流**三条方法论主线。擅长以第一性原理重构业务流程，能力定位是"助企业把 AI 工作流真正落到生产的实战 builder" — 既适合独立顾问交付，也适合加入 AI 初创 Day One 团队。

---

## 核心技能

  - **Vibe Coding 全栈实战**：Claude Code 主战工具、Skill 开发、多项目并行编排、SOP 化提示词系统、Sub-Agent 协作、Karpathy LLM Wiki 知识库工程化
  - **AI 产品工程化**：Multi-Agent 架构（OpenClaw → Claude Code CLI 演进实践）、Prompt Engineering、**RAG 工程化（vault 4 大类多源平衡 + 12 段防御 prompt）**、零代码到生产级的全栈交付、MVP 策略 + RICE 优先级评估
  - **业务流程自动化**：跨系统集成（飞书 API 全家桶 / Notion / 阿里云 / iFinD）、**Playwright MCP / agent-browser 拟人化交互**、防风控与容错机制设计、SOP 标准化体系建设
  - **全栈技术栈**：Next.js 16 / Vue 3 / TypeScript / Python / Node.js / Socket.IO / Redis / 火山引擎 doubao-pro / DeepSeek V4 Flash / **SSE 流式生成 / 服务端 PDF（puppeteer 字体子集嵌入）**
  - **基础设施与 DevOps**：Kubernetes 容器化、Jenkins / GitHub Actions CI/CD、autossh + FRP 双通道隧道、阿里云架构（FinOps 成本 -31%）、敏捷开发（Scrum）+ 跨部门协作枢纽、**CSP / X-Frame-Options 等安全头加固**

---

## 独立项目与顾问实战 (2025.10 至今)

### 1. maxwellii.com · 终端体个人主页 + V2 LLM 化身对话（已上线生产）

> maxwellii.com · 静态站点（Node 0 依赖构建器）+ chat-api（Next.js + RAG + SSE）+ Cloudflare 代理 + 阿里云新加坡

  - **终端体设计**：bash 隐喻 + CRT 扫描线 + 朱砂方印 + JetBrains Mono / Noto Serif SC，11 项目独立二级详情页（每项目 cat README.md 风格 + 中英双 H1 + 5 状态系统：planned/active/live/paused/archived）
  - **V2 LLM 化身对话**（5/10 v2.2.0）：右下角浮窗对话，访客可与"AI 版 Maxwell"实时对话；后端 chat-api（Next.js）+ doubao-pro 256K context + SSE 流式 + Token HUD 实时显示 input/output/total
  - **自建 RAG vault**：407 份 .md 知识库，按 4 大类（personal / work-history / current-projects / knowledge-base）分级 + 多源平衡（perCategoryMax）+ 12 段 system prompt 防御层（防 RAG 知识污染 / 防伪造对话历史注入 / 防 prompt injection）
  - **安全工程化**：千野渗透测试报告 P0+P1 全修（CSP `script-src 'self'` + 4 个安全响应头 + Markdown 链接 URL scheme 校验 + token-hud textContent 防 XSS + Rate limit 20 req/min/IP）
  - **Vibe Coding 工程实践**：纯 Node 0 依赖构建器（YAML frontmatter + Markdown body → 终端壳模板填充，~500 行覆盖 11 详情页生成）+ deploy.sh 严格 build 检查 + 自动化部署 SOP

### 2. PetsLog · 多宠 AI 健康记录工具（个人开源 · 三代工具范式演进）

> github.com/iyuenan3/Cursor-PetsLog + github.com/iyuenan3/OpenClaw-PetsLog · v3：uni-app 双端（小程序 + H5）+ 阿里云百炼 LLM + 微信云开发 + Claude Code

  - **真实痛点驱动**：家中 7 猫 2 狗，看病时医生问病史答不上来；记事本和 Notion 都太重，急救场景连录入都来不及
  - **三个工具范式跨越**：v1（2025.09 Cursor + uni-app + uniCloud，4 小时跑通 MVP）→ v2（2026.01-03 OpenClaw 重构，8000 行 / 32 E2E / 38 docs / 双端 + CI/CD，作为系统学习 OpenClaw 的载体，单 Agent 长期记忆 + 多 Agent 协作两种模式都跑过）→ v3（2026.04 起 Claude Code + 阿里云百炼，**录入彻底改为 LLM 自然语言对话**）
  - **v3 范式反思**：保留应用形态（uni-app + 微信云开发）但**录入这一步完全取消传统表单**——一句话或语音 → LLM 自动提取宠物身份/事件/体重/用药 → 归档时间线。AI 时代独立开发者真正的杠杆点不是"少写代码"，而是**重新定义用户与系统的交互界面**
  - **AI 滥用防护**：严格 system prompt（"结构化提取机器"，不聊天）+ 强制 JSON 输出 + 前端防呆 + 频率限制
  - **开源策略**：架构 / 产品设计 / AI 提示词公开做简历加成，完整商业代码留私有仓

### 3. xhs-agency · 多 Agent Roundtable 全自动账号运营（前司 archived）

> 全境骑行内部项目 · OpenClaw 主控 + 4 子 Agent 周会 Roundtable + Playwright + Cron · 单人运营 2-3h/日 → 每周 1h

  - **Multi-Agent Roundtable 架构**：OpenClaw 主控 + 4 子 Agent（文案 / 图片 / 发布 / 互动）**周会式 Roundtable 协作**——议题动态加权 + 人工实时裁决 + 草稿箱 human-in-the-loop，不是简单流水线
  - **Playwright 全链路自动化**：拟人化点击 + 语义化 UI 定位（应对小红书页面频改）+ 防风控机制（异常重试 / 频率控制 / 真人节奏模拟）
  - **业务价值**：单人每日运营时间 **2-3h/日 → 每周 1h 素材统筹**，矩阵账号曝光与自然流量获取实现质的跃升
  - **跨范式迭代认知**：从早期"5-Agent 线性流水线"（文案→图片→发布→互动→分析）演进到"Multi-Agent Roundtable"（动态议题加权 / 多 Agent 协作议事 / 人工实时介入），是从"工具组合"到"协作范式"的认知升级

> **更多 AI 工程化项目** —— 多人小说 V2「剧聊」 / 东方智慧 / 智投研（v3.4 评级体系）/ worklog + AI-Knowledge（LLM Wiki + 4 轮研究）/ OpenClaw（Max + 15 能力）/ short-story（Playwright 自动发布 / 106 篇）等 8 项详见 maxwellii.com

---

## 工作经历

### 杭州全境骑行文旅有限公司 | 软件部主管 / AI 产品负责人 | 2025.03 - 2026.04

**核心成果**：主导公司数字化与自动化重构，基于 OpenClaw 打造企业级 AI 数字员工平台，重塑多部门业务 SOP，推动全国门店系统的平滑切换。

**1. AI 数字员工平台（核心内部产品）**

  - 打通飞书全套 API（文档 / 多维表格 / 审批流），跨系统数据自动流转；阿里云 text-embedding-v4 RAG 检索；Cron 调度 + 场景化 Prompt 模板保障稳定输出
  - **各部门定制智能助手**：数据统计 / 文案 / 报表 / 提醒，重复操作 -60% / 数据统计效率 +70% / 文案编写时间 -50%
  - **新媒体侧**：分析海量历史订单定位低复购套餐，输出"储值转券包"优化策略，规避合规风险并提升私域用户粘性
  - **研发侧**：需求进度同步、缺陷追踪、自动化测试执行交由 Agent 托管，规范技术对接流程

**2. IoT 软硬一体化产品攻坚**

  - **底层日志深度分析**：万级设备原始日志，定位 9680/9683 端口适配逻辑冲突，驱动硬件供应商完成固件级优化
  - **重大故障排查**：业务逻辑解耦（8 月车辆无法解锁，根因保险费余额耗尽且缺乏预警）/ 资源监控告警（11 月 CPU 93% 大面积宕机，配置阿里云资源阈值告警）/ 缓存失效策略（12 月车辆跨店调度后批量无法解锁）
  - **容错冗余设计**：手机定位辅助 + 应急核销链路，国庆 / 春节期间 P0 级事故为 0

**3. 跨平台生态建设与 O2O 核销**

  - **三方小程序全链路**：微信 / 支付宝 / 抖音三方小程序定义与发布，覆盖 95%+ 用户流量入口
  - **核销系统过渡**：设计"客如云核销 + 活码发券"过渡方案，确保线上活动与线下门店秒级结算

**4. 需求治理与标准化 SOP 建设**

  - **需求中台漏斗**：作为跨部门需求枢纽，引入 RICE 评分模型，梳理并确认 54 条关键业务需求
  - **MVP 策略**：确立"稳定性优先于功能丰富度"原则，输出《全境骑行系统功能拆分》，保障首店（西溪湿地）无 P0 级事故平滑过渡
  - **SOP 知识库**：主导编制《后台操作手册》《异常处理 QA 集》《软件配置需求处理》等 7 套标准化文件，**技术部日常响应频次降低 40%**
  - **敏捷转型与 FinOps**：瀑布转敏捷，**交付周期缩短 30%**；阿里云架构优化，**IT 采购成本降低 31%**；复用闭店资源**零投入支撑 3 家新店开业**

> 注：小红书 Multi-Agent Roundtable 全自动账号运营（xhs-agency）作为该时期重点子项目，详见上方独立项目段。

---

### Nokia | DevOps Engineer | 2018.08 - 2024.04

**核心成果**：无线接入网络（RAN）容器化平台与自动化运维体系建设。

  - **K8s / OpenStack 平台建设**：规划、设计、搭建并维护 OpenStack + Kubernetes 平台，支持 vCU/vDU 自动化部署
  - **CI/CD 流水线**：搭建 Jenkins 流水线，优化 Job 配置提升部署速度与质量
  - **自动化测试开发**：Python + Robot Framework 编写自动化测试用例，**基础功能覆盖 100%，测试时间缩短 50%**
  - **运维工具开发**：自研 `k8s-om`（K8s 多租户批量管理 Ansible 工具，支持租户创建 / 权限配置 / 用量限制，**已开源 github.com/iyuenan3/k8s-om**）+ `Kuashaw`（vCU/vDU 部署参数简化工具，集成删建、升降级）
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
