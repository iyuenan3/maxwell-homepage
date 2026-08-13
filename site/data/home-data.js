/* ============================================================
   home-data.js · maxwellii.com 主页数据真相源
   ------------------------------------------------------------
   被 V1 (build.js → site/templates/home.html → site/public/index.html)
   和 V2 (site/v2-redesign/commands.js 运行时) 共同引用。
   改这个文件后:
     - V1 跑 `node site/build.js` 重新生成 site/public/index.html
     - V2 直接刷新即可(运行时读)
   --------------------------------------------------------- */

(function (root) {
  'use strict';

  const HOME_DATA = {

    /* ── whoami / 自我介绍 ──────────────────────────── */
    whoami: {
      name:       '李越男 · Li Maxwell',
      location:   '杭州',
      role:       'AI 产品经理 · FDE · AI Native 全栈',
      previously: '全境骑行 (2025.03 - 2026.04) · Nokia (2018.08 - 2024.04) · 华为 (2016.07 - 2018.07)',
      household:  '<em>7</em> cats · <em>2</em> dogs · 1 wife',
      tags:       'codex · multi-agent · dag-workflow · llm-wiki · full-stack · INTJ',
      contact: {
        email:  'limaxwell93@gmail.com',
        wechat: 'iyuenan3',
      },
      links: [
        { url: 'https://github.com/iyuenan3',           label: 'github.com/iyuenan3' },
        { url: 'https://linkedin.com/in/iyuenan3',      label: 'linkedin.com/in/iyuenan3' },
        { url: 'https://maxwellii.com',                 label: 'maxwellii.com' },
        { url: 'https://limaxwell93.wordpress.com',     label: 'limaxwell93.wordpress.com' },
      ],
    },

    /* ── git log / 十年职业生涯 ──────────────────────── */
    gitLog: [
      {
        head:    true,  // 第一段:HEAD → main 高亮
        hash:    'e0a09ca',
        branches: [
          { name: 'HEAD → main' },
          { name: 'origin/main' },
        ],
        date:    '2026-06 → present · 遥望科技',
        subject: '[feat] 资深产品专家 / CarryGo 产品负责人',
        body: `全面负责 CarryGo 企业级 AI Agent 协作平台，统筹产品规划、架构演进与规模化落地；产品已覆盖遥望内部 1,000+ 名员工，承载 5 条公司核心业务工作流，整体效率提升 60%+。
<ul class="commit-items">
  <li><span class="b">平台规划与架构治理</span>：以 IM 为统一交互入口，搭建由 DAG 任务编排、知识与工具底座、应用市场组成的产品体系，打通从目标输入、过程追踪到结果交付的完整链路。</li>
  <li><span class="b">应用生态与业务规模化</span>：以应用市场承载和分发业务 Agent，推动直播、漫剧、签约等核心工作流接入，建立场景设计、能力接入和发布验收的标准流程。</li>
  <li><span class="b">Agent 自主执行与可信协作</span>：设计任务规划、动态拆解、并行执行、节点质检、失败重试、断点恢复与人工接管闭环，将权限、审计与异常回滚纳入治理框架。</li>
  <li><span class="b">全栈产品化与质量体系</span>：贯通前端、后端、数据库、MCP、部署与验收，建立覆盖模型效果、业务流程和真实环境的分层评测与发布标准。</li>
</ul>`,
        tags:    ['AI Agent', 'Multi-Agent', 'DAG', 'RAG', 'MCP', '产品架构'],
      },
      {
        hash:    'a7f3c91',
        branches: [
          { name: 'tag: v9.0' },
        ],
        date:    '2025-03 → 2026-04 · 杭州全境骑行文旅有限公司',
        subject: '[feat] 软件研发中心负责人',
        body: `主导公司数字化重构，覆盖全国门店系统切换，构建 <span class="b">AI 数字员工团队</span> 提升组织效率。
<ul class="commit-items">
  <li><span class="b">AI 数字员工系统</span>：基于 OpenClaw 为各部门定制智能助手（数据统计 / 文案 / 报表），技术栈 Python + 飞书 API + Notion API + 阿里云 Embedding，重复操作 -60% / 数据统计 +70% / 文案 -50%。</li>
  <li><span class="b">小红书 Multi-Agent Roundtable</span>：议题加权 + 子 Agent 协作 + 人工裁决，账号运营 2-3h/日 → 1h/周。</li>
  <li><span class="b">需求中台 + 产品标准</span>：建立 RICE 需求漏斗（54 条）+ MVP「稳定性优先」策略 + 5 套 SOP，技术响应频次 -40%。</li>
  <li><span class="b">敏捷外包交付</span>：瀑布 → 敏捷转型，交付周期 -30%，需求理解偏差 -50%；西溪湿地店全国首试 0 P0 事故。</li>
  <li><span class="b">IoT 软硬一体化攻坚</span>：
    <ul>
      <li><span class="b">底层日志分析</span>：万级设备原始日志，定位 9680 / 9683 端口适配冲突，驱动硬件供应商完成固件优化。</li>
      <li><span class="b">重大故障排查</span>：业务逻辑解耦（8 月车辆无法解锁）/ 资源监控告警（11 月 CPU 93% 宕机）/ 缓存失效策略（12 月跨店调度故障）。</li>
      <li><span class="b">容错冗余</span>：手机定位辅助 + 应急核销链路，国庆 / 春节 P0 = 0。</li>
    </ul>
  </li>
  <li><span class="b">跨平台生态</span>：微信 / 支付宝 / 抖音三方小程序覆盖 95%+ 流量入口；客如云核销 + 活码发券过渡方案。</li>
  <li><span class="b">FinOps 降本</span>：阿里云成本 -31%；复用闭店资源零投入支撑 3 家新店开业。</li>
</ul>`,
        tags:    ['OpenClaw', 'Multi-Agent', 'RAG', 'Playwright', '飞书 API', 'FinOps'],
      },
      {
        hash:    'b2d4f61',
        date:    '2024-05 → 2025-02 · 独立 AI 产品实践（PetsLog 持续迭代至今）',
        subject: '[feat] OPC 探索 · AI 全栈开发',
        body: `职业间隔期间探索一人公司与生成式 AI 产品方向，独立完成 PetsLog 从需求定义、产品设计到微信小程序上线，并在后续迭代中重构为自然语言驱动的 AI 产品。
<ul class="commit-items">
  <li><span class="b">AI 技术学习与方向探索</span>：系统学习大模型基础、Prompt Engineering 与 RAG 应用原理，围绕知识问答、内容生成和数据分析理解模型能力边界、效果评估与调用成本。</li>
  <li><span class="b">PetsLog 从 0 到 1</span>：从多宠家庭就医时难以完整说明病史的真实问题出发，使用 Copilot 与 Cursor 完成第一版微信小程序和基础健康档案体系。</li>
  <li><span class="b">AI 原生重构与可信边界</span>：先以 OpenClaw 验证 Agent 架构，再使用 Claude Code 将多步骤表单重构为一句话自然语言建档；LLM 只负责结构化提取，身份无法精确匹配时拒绝写入。</li>
  <li><span class="b">真实使用验证</span>：完成 Notion 历史档案迁移和 240 页数据核对，持续管理 9 只宠物、217 条健康记录与 46 份病历附件，形成日常记录到就医出示的业务闭环。</li>
</ul>
<span class="dim"># github.com/iyuenan3/petslog</span>`,
        tags:    ['AI Product', 'Prompt Engineering', 'RAG', 'uni-app', '微信云开发', 'Claude Code'],
      },
      {
        hash:    '3b8e2d4',
        date:    '2018-08 → 2024-04 · Nokia',
        subject: '[feat] DevOps Engineer · RAN 容器化平台',
        body: `无线接入网络（RAN）容器化平台建设与自动化运维体系。
<ul class="commit-items">
  <li><span class="b">K8s / OpenStack 平台建设</span>：规划、设计、搭建和维护 OpenStack 和 Kubernetes 平台，支持 vCU / vDU 自动化部署。</li>
  <li><span class="b">CI/CD 自动化</span>：搭建 Jenkins 流水线，优化 Job 配置提升部署速度和质量。</li>
  <li><span class="b">自动化测试开发</span>：使用 Python + Robot Framework 编写自动化测试用例，基础功能覆盖 100%，测试时间缩短 50%。</li>
  <li><span class="b">运维工具开发</span>：
    <ul>
      <li><span class="b">k8s-om</span>：Kubernetes 多租户批量管理工具（Ansible），支持租户创建 / 权限配置 / 用量限制。</li>
      <li><span class="b">Kuashaw</span>：vCU / vDU 部署参数简化工具，集成删建、升降级等功能。</li>
    </ul>
  </li>
  <li><span class="b">技术创新</span>：申请并通过 9 个 Innovation Idea（代码错误统计分析工具、K8s 自动修复脚本等）。</li>
  <li><span class="b">开源贡献</span>：与 RedHat 合作测试商用 K8s 平台，识别并协助解决 11 个关键性问题。</li>
</ul>`,
        tags:    ['Kubernetes', 'OpenStack', 'Jenkins', 'Ansible', 'SRE'],
      },
      {
        hash:    'f01a2bc',
        date:    '2016-07 → 2018-07 · 华为',
        subject: '[init] 开发工程师 · 云核心网研究部 / 2012 实验室',
        body: `<span class="b">云核心网研究部（2016.07 - 2017.11）</span>
<ul class="commit-items">
  <li><span class="b">Compass4nfv 项目</span>：OPNFV 开源集成项目，提供 OpenStack 自动部署和管理功能。</li>
  <li><span class="b">OpenStack 集成</span>：独立完成 Newton 版本集成，发现并协助修复 Ceilometer 项目 Bug。</li>
  <li><span class="b">动态扩容功能</span>：实现计算节点不中断业务扩容。</li>
  <li><span class="b">代码调优</span>：修改千余行不规范 Ansible 代码，编写模块替换低级代码。</li>
  <li><span class="b">离线部署</span>：针对公司内网环境实现 OpenStack 离线部署，推动商业化落地。</li>
  <li><span class="b">网络优化</span>：完成 DPDK 和 SR-IOV 集成与调试。</li>
</ul>
<span class="b">2012 实验室（2017.12 - 2018.07）</span>
<ul class="commit-items">
  <li><span class="b">低照度样机项目</span>：负责配准算法开发、图像视频采集与测试。</li>
  <li><span class="b">算法优化</span>：采用 ORB 和 APAP 算法提高精度，Matlab 仿真测试。</li>
  <li><span class="b">对比测试</span>：与海康黑光球机进行对比测试，制定评估标准。</li>
</ul>`,
        tags:    ['OpenStack', 'DPDK', 'Image Stitching', 'Matlab'],
        last:    true,  // 最后一段不画 graph line
      },
    ],

    /* ── projects / 有趣的项目 ──────────────────────── */
    projects: [
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-08-10', slug: 'petsgraph',                 dir: true,  zh: 'PetsGraph · 真实宠物桌面陪伴',                  desc: '开源 macOS 离线桌面陪伴运行时 · 李五百 v0.4.0 已发布 · 53 个动作片段 / 14 个节点 / 39 条边 · 完整动作图自然换姿 + 低功耗逐帧渲染',                                                      stack: 'swift · appkit · core graphics · github actions' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-10', slug: 'maxwell-homepage',         dir: true,  zh: 'worklog × maxwellii.com · 个人知识系统',        desc: 'worklog 以 LLM Wiki 摄入时编译多项目知识 · maxwellii.com 以终端体作品集 + RAG 化身安全输出 · AIREADME 与分层记忆支撑长期 AI 协作',                                                             stack: 'obsidian · codex · next.js · rag' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-08', slug: 'eastern-wisdom',           dir: true,  zh: '东方智慧 · 中式传统文化 SaaS',                 desc: 'monorepo 多 app 中式文化 SaaS · 已上线中文取名与东方占卜两款产品 · 共享 AI 流水线、Python 命理计算层和现代中式设计系统',                                                                       stack: 'next.js 16 · 阿里云百炼 · python · monorepo' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-08', slug: 'multiplayer-xiaoshuo',     dir: true,  zh: '剧聊 · 多人 AI 共创互动叙事',                  desc: '3-8 人实时共创互动叙事 H5 · AI 隐形 DM 生成世界观与剧情 · 专属选项和隐藏属性驱动个性化结局 · 服务端 PDF 收藏',                                                                            stack: 'vue 3 · socket.io · redis · 阿里云百炼' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-07-23', slug: 'larkflow',                 dir: true,  zh: 'larkflow · 飞书原生企业协作 DAG',              desc: '把多人协作目标拆成有依赖、有唯一人类 Owner、可验收和可追溯的节点 · Human / Agent / Tool 统一编排 · 草稿确认、受控返工与审计',                                                              stack: 'python · postgresql · lark · react flow' },
      { perm: '-rwxr-xr-x', state: 'active',   date: '2025-03-12', slug: 'xhs-agency',               dir: false, zh: '小红书自运营系统',                              desc: '从 Multi-Agent Roundtable 运营自动化演化为 Electron 商业桌面产品 · Chromium + Go MCP + 14 个业务工具 · 覆盖发布、互动、数据与受控自主运营',                                                                       stack: 'electron · go · react · playwright' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-04-08', slug: 'petslog',                  dir: true,  zh: 'PetsLog · 多宠 AI 健康记录',                   desc: '多宠家庭 AI 健康记录微信小程序 · 一句话自然语言录入并结构化归档 · 家庭隔离、健康时间线、体重趋势与兽医小结形成真实使用闭环',                                                                     stack: 'uni-app · 微信云开发 · 火山方舟 · typescript' },
      { perm: '-rw-------',  state: 'archived', date: '2026-05-06', slug: 'claude-financial-research', dir: false, zh: '智投研 · A 股权益研究系统',                  desc: 'A 股 200 亿以上标的池基本面研究 · 健康度评分 9 版迭代 · 以全样本评审和客观报告为核心 · 严守不输出投资建议的合规边界',                                                                        stack: 'python · csv · pdf · next.js · fastapi', priv: true },
      { perm: 'drwxr-xr-x', state: 'archived', date: '2024-04-15', slug: 'k8s-om',                   dir: true,  zh: 'k8s-om · K8s 多租户运维工具集',                desc: 'Nokia RAN 容器化平台运维工具集 · Ansible Playbooks 实现 K8s 多租户批量管理 · Helm 3 标准化部署 · 已开源',                                                                                    stack: 'ansible · helm 3 · python' },
    ],

    /* ── pets / 我的毛孩子们 ────────────────────────── */
    pets: [
      { perm: '-rwxr-xr-x', star: '★ 7.11', date: '2018-06-02', name: '花轮', desc: '布偶猫 · 腹黑长老，干坏事找弟弟背锅，听得懂"出去玩"',         status: 'chilling' },
      { perm: '-rwxr-xr-x', star: '★ 6.11', date: '2019-06-02', name: '五百', desc: '美短 · 温柔老好猫，肚子随便 rua，给个枕头睡到天荒地老',      status: 'stable' },
      { perm: '-rwxr-xr-x', star: '★ 7.00', date: '2019-04-21', name: '小葵', desc: '西伯利亚森林猫 · 全家武力天花板，情绪价值给满，日均 6k 步', status: 'caring' },
      { perm: '-rwxr-xr-x', star: '★ 5.06', date: '2020-10-23', name: '飞流', desc: '缅因猫 · 脸帅体肥描大胆小厌妹，厨房守护者',                  status: 'idle' },
      { perm: '-rwxr-xr-x', star: '★ 3.10', date: '2022-07-09', name: '乔治', desc: '塞尔凯克卷毛猫 · 粘人，8 字绕腿走，出去玩会叼礼物回家',      status: 'on meds' },
      { perm: '-rwxr-xr-x', star: '★ 3.05', date: '2022-11-11', name: '吉吉', desc: '英短 · 没有边界感，话痨，兄控，爱尿床',                       status: 'healing' },
      { perm: '-rwxr-xr-x', star: '★ 1.00', date: '2025-04-23', name: '红豆', desc: '彩狸 · 原以为是三花，没想到是彩狸，喜欢上树',                 status: 'climbing' },
      { perm: 'drwxr-xr-x', star: '★ 1.10', date: '2024-07-01', name: '小七', desc: '中华田园犬 · 飞盘选手，会牧羊，徒步登山小向导',               status: 'running', dir: true },
      { perm: 'drwxr-xr-x', star: '★ 5.00', date: '2021-05-01', name: '多多', desc: '柯基 · 25.11 云南捡的小可怜，TVT 化疗康复，跟小七学会飞盘',    status: 'recovered', dir: true },
    ],

    /* ── stack / 技术栈 ─────────────────────────────── */
    stack: {
      daily: 'AI Agent  ·  Multi-Agent  ·  DAG 工作流  ·  RAG  ·  MCP  ·  Codex  ·  飞书',
      often: 'Python  ·  TypeScript  ·  React / Next.js  ·  PostgreSQL  ·  Electron  ·  Playwright  ·  Vibe Coding',
      done:  'OpenStack  ·  Kubernetes  ·  Ansible  ·  Jenkins / GHA  ·  Swift / AppKit  ·  Socket.IO / Redis  ·  阿里云 / FinOps',
    },

    /* ── history / 学历 ─────────────────────────────── */
    history: {
      edu:     '杭州电子科技大学 · 自动化 · 本科（2012-09 → 2016-06）<br><span class="dim">自行车协会会长 · 第一届「华东高校车协发展论坛」发起人</span>',
      patents: '6 项 · 机械 / 电子方向（2011 - 2015）<br><span class="dim">充气式无线电测向天线 / 安全电动卷帘门 / 凹形减速带 / 带 USB 插座的键盘 / 带磁机油排放螺栓 / 磁性机油标尺</span>',
    },

    /* ── tagline (V1 顶部 tagline) ──────────────────── */
    tagline: {
      ver:    'v3.1.0',
      sync:   '2026-08-14',
    },

    /* ── signoff (V1 底部) ──────────────────────────── */
    signoff: {
      echo:   '字以载道，码以谋生',
      end:    'end of stream · last sync 2026-08-14 03:20:06 +0800',
    },

    /* ── V2 hero (仅 V2 用,V1 不引用) ──────────────── */
    hero: {
      role:    'AI 产品经理 · FDE · AI Native 全栈',
      live:    '杭州 · last sync 2026-08-14 · ● online',
      history: '华为 2yr · Nokia 6yr · 全境 1yr',
      links: [
        { url: 'https://github.com/iyuenan3',         label: '[github]' },
        { url: 'https://linkedin.com/in/iyuenan3',    label: '[in]' },
        { url: 'https://limaxwell93.wordpress.com',   label: '[blog]' },
      ],
    },
  };

  // UMD: Node + Browser
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HOME_DATA;
  } else {
    root.HOME_DATA = HOME_DATA;
  }
})(typeof self !== 'undefined' ? self : this);
