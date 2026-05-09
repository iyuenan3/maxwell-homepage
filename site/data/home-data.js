/* ============================================================
   home-data.js — maxwellii.com 主页数据真相源
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
      role:       'AI 产品经理 · AI 落地顾问 · Vibe Coding 全栈',
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
        date:    '2026-04 → present · 独立项目与顾问实战',
        subject: '[feat] AI 产品落地顾问 / Vibe Coding 全栈交付',
        body:    '离职后转入独立战场。已上线 <span class="b">2 个生产 AI 产品</span>： naming.maxwellii.com（海外华人取名 SaaS）+ tale.maxwellii.com（多人实时叙事 H5）；同步推进 <span class="b">worklog / AI-Knowledge</span>（Karpathy LLM Wiki 三层架构知识库）+ A 股 200 亿+ 权益投研系统等 6 个并行项目。建立 Multi-Agent 编排、LLM Wiki 工程化、生产级全栈交付的完整方法论闭环。',
        tags:    ['Claude Code', 'Next.js 16', 'Vue 3', 'Socket.IO', 'doubao', 'DeepSeek V4'],
      },
      {
        hash:    'a7f3c91',
        branches: [
          { name: 'tag: v9.0' },
        ],
        date:    '2025-03 → 2026-04 · 杭州全境骑行文旅有限公司',
        subject: '[feat] 软件研发中心负责人',
        body:    '基于 <span class="b">OpenClaw</span> 打造企业级 AI 数字员工平台，打通飞书全套 API + RAG 检索 + Cron 调度。小红书全链路 5-Agent 自动化（文案 / 图片 / 发布 / 互动 / 分析），单人运营时间 2-3h/日 → 1h/周。建立 RICE 需求漏斗（54 条）+ 7 套 SOP（技术部响应频次 -40%），敏捷转型交付周期 -30%，FinOps 优化 IT 成本 -31%。',
        tags:    ['OpenClaw', 'Multi-Agent', 'RAG', 'Playwright', '飞书 API', 'FinOps'],
      },
      {
        hash:    '3b8e2d4',
        date:    '2018-08 → 2024-04 · Nokia',
        subject: '[feat] DevOps Engineer · RAN 容器化平台',
        body:    '无线接入网络（RAN）容器化平台建设。规划与维护 <span class="b">OpenStack / Kubernetes</span> 平台，搭建 Jenkins 流水线，用 Python + Robot Framework 写了 29 例自动化测试（基础功能覆盖 100% / 测试时间 -50%）。开发 k8s-om、Kuashaw 两个内部工具；9 个 Innovation Idea 获批；和 RedHat 合作识别 11 个关键问题。',
        tags:    ['Kubernetes', 'OpenStack', 'Jenkins', 'Ansible', 'SRE'],
      },
      {
        hash:    'f01a2bc',
        date:    '2016-07 → 2018-07 · 华为',
        subject: '[init] 开发工程师 · 云核心网研究部 / 2012 实验室',
        body:    '早期在 OPNFV / Compass4nfv，独立完成 OpenStack <span class="b">Newton</span> 版本集成，发现并协助修复 Ceilometer Bug，做过不中断业务扩容、DPDK / SR-IOV 调优、内网离线部署。后期在 2012 实验室做低照度样机，用 ORB / APAP 算法做配准。',
        tags:    ['OpenStack', 'DPDK', 'Image Stitching', 'Matlab'],
        last:    true,  // 最后一段不画 graph line
      },
    ],

    /* ── projects / 有趣的项目 ──────────────────────── */
    projects: [
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-04-22', slug: 'eastern-wisdom',           dir: true,  zh: '东方智慧 · 海外华人取名 SaaS',                 desc: '八字命理 + AI 4-Stage 流水线（八字推算 → 候选字筛选 → AI 生成 → 评分验证），为海外华人生成中文名，三档付费',                                                                stack: 'next.js 16 · doubao' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-04-30', slug: 'multiplayer-xiaoshuo',     dir: true,  zh: '多人小说 · 多人互动小说 H5',                   desc: '2-8 人同房间扮演角色 + AI 根据隐藏属性值实时判定剧情走向（30s 倒计时 / AI 替身补位 / 10 个题材剧本）',                                                                  stack: 'vue3 · socket.io · deepseek' },
      { perm: '-rwxr-xr-x', state: 'live',     date: '2026-05-08', slug: 'maxwell-homepage',         dir: true,  zh: 'maxwellii.com · 终端体个人主页',               desc: 'bash 隐喻终端体个人主页（CRT 扫描线 + 朱砂方印）+ 10 项项目展示（Node 零依赖构建器）+ 简历多版本归档',                                                                       stack: 'html · node.js · nginx' },
      { perm: '-rw-------', state: 'active',   date: '2026-05-06', slug: 'claude-financial-research', dir: false, zh: '智投研 · A 股权益研究系统',                    desc: '基于 Anthropic 官方 financial-services 的 A 股 200 亿+ 标的池基本面研究，七模块固定结构 + 严守"不输出投资建议"合规边界',                                                  stack: 'claude-code · csv · pdf', priv: true },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-05-03', slug: 'worklog',                  dir: true,  zh: '工作日志 · AI 自动日记 + LLM Wiki 知识库',     desc: '基于 Karpathy LLM Wiki 三层架构（Schema / Wiki / Raw）的工作日记 + 知识沉淀系统，自创"摄入时编译"编译器范式',                                                            stack: 'llm-wiki · markdown' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-05-06', slug: 'ai-knowledge',             dir: true,  zh: 'AI 知识库 · 开源项目研究图谱',                 desc: 'A+B+C 三级递进研究 AI 工具链开源项目（README → 横向对比 → 源码 Clone）· 55 Wiki / 78 raw / 0 死链 / 自带 Lint',                                                            stack: 'obsidian · lint' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-04-26', slug: 'openclaw',                 dir: true,  zh: 'OpenClaw · AI 助理平台',                       desc: '本机 / 云端均可部署的 AI 助理平台，火山方舟 ark-code-latest 基座 + Gateway loopback + 7 内置 + 3 自定义 Skill',                                                              stack: 'openclaw · volcengine · cron' },
      { perm: 'drwxr-xr-x', state: 'active',   date: '2026-04-08', slug: 'petslog',                  dir: true,  zh: 'PetsLog · 宠物健康伴侣',                       desc: 'uni-app 双端（小程序 + H5）宠物健康伴侣 · 用药 / 报告 / 提醒 / 离线 · 同需求 Cursor + OpenClaw 双工具实现对比',                                                              stack: 'vue · uni-app · cursor · openclaw' },
      { perm: '-rw-------', state: 'archived', date: '2025-03-12', slug: 'xhs-agency',               dir: false, zh: '小红书 Agency · 多 Agent 全自动账号运营',      desc: 'OpenClaw 主控 + 4 子 agent 周会 Roundtable（议题动态加权 + 人工实时裁决）+ Playwright 全链路 + 草稿箱 human-in-the-loop',                                                    stack: 'openclaw · playwright · cron', priv: true },
      { perm: 'drwxr-xr-x', state: 'archived', date: '2024-04-15', slug: 'k8s-om',                   dir: true,  zh: 'k8s-om · K8s 多租户运维工具集',                desc: 'Ansible Playbooks + Helm3 一键 K8s 多租户管理（创建 / 权限 / 用量），Nokia RAN 容器化平台底座（已开源）',                                                                     stack: 'ansible · helm3' },
    ],

    /* ── pets / 我的毛孩子们 ────────────────────────── */
    pets: [
      { perm: '-rwxr-xr-x', star: '★ 6.10', date: '2019-04-21', name: '小葵', desc: '西伯利亚森林猫 · 探险冠军，日均 6k 步',           status: 'running' },
      { perm: '-rwxr-xr-x', star: '★ 5.04', date: '2020-10-23', name: '飞流', desc: '布偶猫 · 安静派',                                    status: 'idle' },
      { perm: '-rwxr-xr-x', star: '★ 3.07', date: '2022-07-09', name: '乔治', desc: '塞尔凯克卷毛猫 · 过敏减轻， 喜欢啃草',              status: 'on meds' },
      { perm: '-rwxr-xr-x', star: '★ 3.03', date: '2022-11-11', name: '吉吉', desc: '英短 · 26.01 起渐渐信任， 可以抱可以摸',            status: 'healing' },
      { perm: '-rwxr-xr-x', star: '★ 6.09', date: '2019-06-02', name: '五百', desc: '美短 · 25 上半年尿闭史，目前稳定',                  status: 'stable' },
      { perm: '-rwxr-xr-x', star: '★ 7.09', date: '2018-06-02', name: '花轮', desc: '布偶猫 · 中耳炎',                                    status: 'on meds' },
      { perm: '-rwxr-xr-x', star: '★ 0.10', date: '2025-04-23', name: '红豆', desc: '三花猫 · 喜欢上树',                                  status: 'climbing' },
      { perm: 'drwxr-xr-x', star: '★ 1.08', date: '2024-07-01', name: '小七', desc: '中华田园犬 · 24 年丽江捡到，飞盘选手， 车后排专属座位', status: 'running', dir: true },
      { perm: 'drwxr-xr-x', star: '★ 4.00', date: '2025-10-??', name: '多多', desc: '柯基 · 25.10 丽江捡到的遗弃犬， 在小七影响下学会飞盘', status: 'recovered', dir: true },
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
      ver:    'v10.0.0',
      role:   'AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师',
      city:   '杭州',
      sync:   '2026-05-08',
    },

    /* ── signoff (V1 底部) ──────────────────────────── */
    signoff: {
      echo:   '字以载道，码以谋生',
      end:    'end of stream — last sync 2026-05-07 17:42:04 +0800',
    },

    /* ── V2 hero (仅 V2 用,V1 不引用) ──────────────── */
    hero: {
      role:    'AI 产品经理 · AI 落地顾问 · Vibe Coding 全栈',
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
