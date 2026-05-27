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
      role:       'AI 产品经理 · FDE 工程师 · Vibe Coding 全栈',
      previously: '全境骑行 (2025.03 - 2026.04) · Nokia (2018.08 - 2024.04) · 华为 (2016.07 - 2018.07)',
      household:  '<em>7</em> cats · <em>2</em> dogs · 1 wife',
      tags:       'claude-code · openclaw · multi-agent · llm-wiki · full-stack · INTJ',
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
        hash:    'e2d9f04',
        branches: [
          { name: 'HEAD → main' },
          { name: 'origin/main' },
        ],
        date:    '2026-04 → present · 独立战场',
        subject: '[feat] AI 产品经理 · FDE 工程师 · Vibe Coding 全栈',
        body: `2026-04 起转为独立交付：从产品定义、吃透客户业务、全栈实现到生产部署，端到端落地 AI 方案。沉淀 Multi-Agent 编排 · LLM Wiki 知识工程化 · Vibe Coding 工作流 三条方法论主线。
<ul class="commit-items">
  <li><span class="b">PetsLog · 多宠 AI 健康记录</span>：Cursor → OpenClaw → LLM 自然语言录入三次范式跨越，最终「微信说一句话，LLM 自动拆字段归档」，砍掉小程序对接微信机器人 + Notion。</li>
  <li><span class="b">小红书自运营系统</span>：OpenClaw 多 Agent Roundtable（议题加权 + 并行议事 + 人工裁决）→ 产品化为 Electron 桌面端 SaaS，内嵌 Go xiaohongshu-mcp + 14 工具，买断 + LLM 月费商业化。</li>
  <li><span class="b">worklog × maxwellii.com</span>：个人知识系统：worklog（LLM Wiki 三层架构输入引擎）+ AIREADME（跨项目方法论模板）+ maxwellii.com（活简历 RAG 化身，407 .md / 自写向量检索 + 12 段 prompt 防御）。</li>
  <li><span class="b">FDE 实战交付者</span>：第一性原理重构业务流程 + MVP 锚定优先级，将通用 AI 能力快速定制到客户生产环境；既能独立交付，也能融入 AI Native 团队担纲核心落地。</li>
</ul>
<span class="dim"># see also: $ ls -lah projects/</span>`,
        tags:    ['Claude Code', 'Multi-Agent', 'LLM Wiki', 'RAG', 'FDE', 'Vibe Coding'],
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
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-08', slug: 'eastern-wisdom',           dir: true,  zh: '东方智慧 · 中式传统文化 SaaS',                 desc: 'monorepo 多 app 中式文化 SaaS · 已上线「取名」（八字 4 阶段 AI 流水线）与「东方占卜」（小六壬 / 梅花易数）两款 · 共享 Python 命理计算层 + 朱砂印博物馆视觉',                                       stack: 'next.js 16 · 阿里云百炼 · python · monorepo' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-08', slug: 'multiplayer-xiaoshuo',     dir: true,  zh: '多人与 AI 互动共创小说',                       desc: '3-8 人多人 AI 共创互动叙事 H5 · AI 隐形 DM 实时生成剧情 + 隐藏属性驱动叙事效果（非多数决投票）+ 个性化结局 + 服务端 puppeteer PDF 导出',                                                                       stack: 'vue3 · socket.io · 阿里云百炼 · puppeteer' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-10', slug: 'maxwell-homepage',         dir: true,  zh: 'worklog × maxwellii.com · 个人知识系统',               desc: '个人知识系统 · worklog（Karpathy LLM Wiki 三层架构「输入引擎」，摄入时编译）+ maxwellii.com（终端体主页 + RAG 化身「输出界面」，407 .md 多源平衡 + 12 段防御）',                                              stack: 'obsidian · claude-code · next.js · rag' },
      { perm: '-rw-------', state: 'active',   date: '2026-05-06', slug: 'claude-financial-research', dir: false, zh: '智投研 · A 股权益研究系统',                    desc: 'A 股 200 亿+ 标的池基本面研究（1,095 只）· 健康度评分 9 版迭代至 v3.4（可接受率 79.6%）+ Daily Wave 盘后日更 + Next.js 选股器 · 严守「不输出投资建议」合规边界',                                          stack: 'claude-code · csv · pdf · next.js · fastapi', priv: true },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-05-06', slug: 'short-story',              dir: true,  zh: '短篇小说 · 番茄平台商业短篇',                  desc: '番茄平台商业短篇创作工作流 · 黄金 8 步法 + 9 品类 + 情绪曲线轮换 + 扩写策略库 + Playwright 自动发布 · 累计 108 篇 / 91.5 万字',                       stack: 'claude-code · playwright · python · txt' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-05-03', slug: 'openclaw',                 dir: true,  zh: 'OpenClaw · AI 助理平台',                       desc: '本机 AI 助理平台基座 ·「Max」主 Agent 预加载 15 核心能力模块（全栈 + 产品 + DevOps）+ 3 生产级自定义 Skill + 凌晨 cron 自动构建知识库',          stack: 'openclaw · ark-code · agent-main · cron' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-04-08', slug: 'petslog',                  dir: true,  zh: 'PetsLog · 多宠 AI 健康记录',                       desc: '多宠家庭 AI 健康记录工具 · 三代范式迭代（Cursor 4h MVP → OpenClaw 多 Agent 工程化 → LLM 自然语言录入取消表单）· 一句话自动归档',                                                              stack: 'uni-app · 微信云开发 · 阿里云百炼 · claude-code' },
      { perm: '-rwxr-xr-x', state: 'active', date: '2025-03-12', slug: 'xhs-agency',               dir: false, zh: '小红书自运营系统',      desc: '从前司 Multi-Agent Roundtable 内部自动化（单人运营 2-3h/日 → 1h/周）演化为独立商业化桌面应用 · Electron + Go MCP（CDP attach）+ 自营 LLM 中转 + 14 工具全链路',                                                    stack: 'electron · go · playwright · openclaw'},
      { perm: 'drwxr-xr-x', state: 'archived', date: '2024-04-15', slug: 'k8s-om',                   dir: true,  zh: 'k8s-om · K8s 多租户运维工具集',                desc: 'Nokia RAN 容器化平台运维工具集 · Ansible Playbooks 实现 K8s 多租户批量管理（创建 / 权限 / 用量）+ Helm 3 一键部署 · 已开源',                                                                     stack: 'ansible · helm3 · python' },
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
      daily: 'Claude Code  ·  OpenClaw  ·  Multi-Agent  ·  LLM Wiki  ·  Next.js 16  ·  Vue 3  ·  TypeScript  ·  Python',
      often: 'Socket.IO  ·  Redis  ·  Node.js  ·  Kubernetes  ·  Jenkins / GHA  ·  doubao  ·  DeepSeek V4',
      done:  'OpenStack  ·  Ansible  ·  Robot Framework  ·  autossh + FRP  ·  阿里云 / FinOps  ·  Playwright  ·  RAG',
    },

    /* ── history / 学历 ─────────────────────────────── */
    history: {
      edu:     '杭州电子科技大学 · 自动化 · 本科（2012-09 → 2016-06）<br><span class="dim">自行车协会会长 · 第一届「华东高校车协发展论坛」发起人</span>',
      patents: '6 项 · 机械 / 电子方向（2011 - 2015）<br><span class="dim">充气式无线电测向天线 / 安全电动卷帘门 / 凹形减速带 / 带 USB 插座的键盘 / 带磁机油排放螺栓 / 磁性机油标尺</span>',
    },

    /* ── tagline (V1 顶部 tagline) ──────────────────── */
    tagline: {
      ver:    'v1.10.0',
      sync:   '2026-05-10',
    },

    /* ── signoff (V1 底部) ──────────────────────────── */
    signoff: {
      echo:   '字以载道，码以谋生',
      end:    'end of stream · last sync 2026-05-07 17:42:04 +0800',
    },

    /* ── V2 hero (仅 V2 用,V1 不引用) ──────────────── */
    hero: {
      role:    'AI 产品经理 · FDE 工程师 · Vibe Coding 全栈',
      live:    '杭州 · last push 5h ago · ● online',
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
