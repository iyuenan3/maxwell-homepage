# maxwellii.com v2 重设计 — DESIGN-NOTES

> 本文档是 [Maxwell × claude design] 在 2026-05-09 完整对话的最终纪要 + 接力工作 spec。
> claude design 已上下文溢出无法继续，本档由 Claude Code 从 23 张截图回溯还原 + Maxwell 校对补齐。
>
> **状态**：v2 设计稿（pre-implementation）。所有 ✅ 项已与 Maxwell 校对，⏳ 项进入实现阶段时再决。
> **目录**：本目录 `site/v2-redesign/` 是 v2 改造沙盒，所有新文件汇集于此；线上 `site/public/` 暂不动。
> **HANDOFF 协议**：任何实现 Claude Code 必须读完本文档后再动 site/v2-redesign/ 之外的代码。

---

## § 0 · 现状与目标

### 当前线上（v1）特征
- `site/public/index.html` 终端壳 + 8 行 kv whoami + `ls projects/` 10 行 + `ls pets/` + git log + history + signoff（朱砂方印 李越男印）
- 纯静态展示式，访客只能"读"，不能"问"
- v1 信息密度高，但访客 30 秒后已无新信息可看

### v2 目标
**主页 = 一次 Claude CLI session**。
- 把"展示式"改为"对话式"：访客打开就能跟 AI 版 Maxwell 聊
- LLM 接火山方舟 / 阿里百炼 Coding Plan（OpenAI 兼容），喂 Maxwell wiki + 简历做 system prompt
- 终端隐喻保留（HANDOFF 边界硬性）
- 一屏放下所有核心信息，零 scroll 即可上手

### Why now
- v1 已稳定上线，CSS / 缓存 / 部署链路都跑顺了 — 重构无后顾之忧
- Maxwell 当前求职定位是 "AI 产品经理 + Vibe Coding 全栈" — 主页本身就该是一个 LLM 产品 demo
- 访客主体是 HR / 技术圈友邻 / 投资 — 这类人对"和 AI 聊"的好奇 >> 对静态简历的耐心

---

## § 1 · 5 条线整体架构

claude design 早期讨论过 5 条改造线，最终收敛到 **C+D 主线 + E 视觉**：

| 线 | 名字 | 状态 | 取舍理由 |
|---|---|---|---|
| A | 引导式访谈（HR/技术/投资 身份预设 checkbox） | ❌ 否决 | 仪式感重 / 强迫访客做选择 / 不符合 zero-friction |
| B | 持久输入框（底部 prompt） | ✅ 合到 C | 单独立不住，跟 C 合并 = 对话本体 |
| **C** | **AI 对话** | **✅ 主线** | 核心价值：访客真能跟 AI Maxwell 聊 |
| D | 内容鲜活（neofetch / tail-f livelog / now / 彩蛋 / 主题切换） | ✅ 全部要做 | 给主页加纵深感、终端文化彩蛋 |
| E | 视觉冲击（像素头像 → 眼镜表情系统） | ✅ step 1 已落地 | 对话主角的"脸"，跟随状态变化 |

**收敛逻辑**：
1. A 否决 → 信任 LLM 自己识别访客身份（§ 6）
2. B 合到 C → 持久输入框就是对话本体
3. C 是主菜，D 是配菜（核心对话框 + 周边趣味）
4. E 给对话主角"一张脸" → 已经从复杂像素头像（ANSI / 1-bit / GameBoy）简化到了 Claude CLI 风的字符表情 [●][●]

---

## § 2 · Hero 区设计 — 方案 ① ✅

### 决策
**删除 v1 的 8 行 kv whoami 卡片，由"眼镜头像 + 3 行 ROLE/LIVE/HISTORY"完全接管**。

### 理由
- v1 whoami 的"信息"功能（name / location / role / contact / household ...）由对话本体接管：访客直接问"你住哪儿？""有几只猫？"比扫一张静态卡更真实 100 倍
- bio / household / contact 这些"软"信息，让 Maxwell 在对话里说才有人格
- 简洁就是力量 — 终端美学最强烈
- 看不见的信息可以通过 `/contact` `/family` 这类命令拉出来

### Hero 区 ASCII 草图
```
┌─────────────────────────────────────────────────────┐
│ [titlebar]                                          │
│ ASCII title "Maxwellii"                             │
│ tagline · v3.0.8 · 杭州                             │
│ ───────────────────────────────────────────────────│
│ $ whoami                                            │
│ ┌─┐  Maxwell · 李越男 · 杭州  [github] [in]        │
│ │░│  ROLE     AI 产品经理 · AI 落地顾问 · Vibe ... │
│ └─┘  LIVE     杭州 · last push 5h ago · ● online   │
│      HISTORY  Nokia 6yr · 杭州 2yr · 全栈 1yr      │
│                                                     │
│ Maxwell:                                            │
│ 嘿，我是李越男，今天想聊点什么？                    │
│ > _                                                 │
│                                                     │
│   快捷指令                                          │
│   /projects /git log /stack /pets /history /help    │
└─────────────────────────────────────────────────────┘
```

整体 30 行左右，一屏装下，零 scroll 即可上手。对话开始后才会延展。

### Spec
| 元素 | 值 |
|---|---|
| 头像区 | `.avatar-emote` (来自 emotes.css) — 96×96, 无 border, JetBrains Mono, amber #d4a04c |
| face 字号 | 26px / weight 500 / letter-spacing -1px |
| mouth 字号 | 22px / weight 600 / margin-top 8px |
| ROLE/LIVE/HISTORY label | amber, weight 500, 等宽对齐 |
| 链接 [github] [in] | cyan, hover 改色 |
| 输入框 prompt | `> _` 前缀, cursor blink |
| 快捷指令 chip | 一排 chip 横排，hover 加 border-color amber |

---

## § 3 · 3 行摘要 V1 ✅

### 内容（最终）
```
ROLE     AI 产品经理 · AI 落地顾问 · Vibe Coding 全栈
LIVE     杭州 · last push 5h ago · ● online
HISTORY  Nokia 6yr · 杭州 2yr · 全栈 1yr
```

### LIVE 行 build.js 注入逻辑
- `last push Xh ago` 由 `git log -1 --format=%ar` 取最近一次 commit 时间，构建时注入
- `● online` 静态固定（绿色 #8bb47a）
- 不写 `2 prod · 6 active` —— Maxwell 觉得"做了多少个项目"不该是 hero 卖点

### 决策记录：为什么不加 STACK / LINKS / CONTACT

| 候选行 | 否决理由 |
|---|---|
| STACK | 跟 ROLE "Vibe Coding 全栈" 信息重复 / 6 个标签视觉太挤 / 具体技术名对访客价值低（"难也用 Claude Code"） |
| CONTACT | 3 秒摘要不该放联系方式 — 访客还没决定要不要联系就被推 email/wechat 不礼貌 / 让 LLM 在对话里主动给 |
| LINKS | 用户已经在 maxwellii.com 上了，再放 maxwellii.com/blog 链接怪 / github & linkedin 已经在头像旁边的 [github] [in] 按钮里了 |

### 决策记录：为什么删掉"话题清单"
早期讨论有过：
```
可以聊聊: AI 项目落地 · 多项目并行 · 大厂出走 · 7 猫 2 狗
```
否决理由：**LLM 在对话开始后主动引导**比"静态话题菜单"强 10 倍。对话产品里，访客自己说想聊什么 >> 访客从你预设清单里选。

---

## § 4 · 眼镜表情系统（E 线 step 1）✅ 已落地

### 设计哲学
学 Claude CLI 启动时那个简单字符表情。摒弃复杂像素头像（ANSI / 1-bit dither / GameBoy 都试过，复杂且出戏）。

### 形态规格
- **形态**：方框眼镜 + 镜片字符 `[●][●]`
- **气质**：方向 C（闭眼→眨开，有人味，不冷不机械）
- **尺寸**：face 26px / mouth 22px（Hero 区集成版）/ standalone 预览页 face 96px
- **颜色**：amber #d4a04c
- **形状**：**无圆框**（重要：原版有圆框被否决）
- **字体**：JetBrains Mono weight 500/600
- **特效**：drop-shadow 发光（hover 时 + loading 时脉动）

### 22 个表情库（已在 `glasses-emotes.html` 里定义完）

#### BASIC · 基础
| key | face | mouth | name | desc |
|---|---|---|---|---|
| idle | `[●][●]` |  | 待机 | 默认睁眼 |
| blink | `[─][─]` |  | 眨眼 | 快速闭一下 |
| smile | `[●][●]` | `◡` | 微笑 | 默认 + 嘴笑 |
| happy | `[◠][◠]` | `ᴗ` | 开心 | 弯月眼 |
| focus | `[━][━]` | `—` | 专注 | 眯眼 |
| sleep | `[z][z]` | `___` | 休眠 | 空闲超时 |

#### ACTIONS · 交互（随机/循环）
| key | face | mouth | name | desc |
|---|---|---|---|---|
| typing | `[●][●]` | `___` | 打字 | 思考输出（动） |
| loading | `[◐][◑]` | `···` | 加载 | 等待中（动） |
| look_l | `[●·][●·]` |  | 左看 | 思考 |
| look_r | `[·●][·●]` |  | 右看 | 走神 |
| look_up | `[˙][˙]` |  | 抬头 | 想问题 |
| curious | `[●·][·●]` | `?` | 好奇 | 左右各一 |
| wink | `[●][─]` | `ᴗ` | 俏皮眨眼 | 单眼 |

#### MOOD · 情绪（彩蛋）
| key | face | mouth | name | desc |
|---|---|---|---|---|
| surprise | `[○][○]` | `o` | 惊讶 | 瞳孔放大 |
| shock | `[◎][◎]` | `O` | 震惊 | 彻底懵 |
| squint | `[›][‹]` | `⌒` | 审视 | 挑剔脸 |
| sleepy | `[─][─]` | `~zZ` | 困倦 | 半闭 |
| cool | `[■][■]` | `—` | 酷 | 墨镜模式 |
| love | `[♥][♥]` | `ᴗ` | 喜欢 | Ta 看到了喜欢的 |
| success | `[✓][✓]` | `ᴗ` | 成功 | all good |
| error | `[✕][✕]` | `×` | 出错 | something broke |
| glitch | `[#][@]` | `!?` | 故障 | 罕见彩蛋 |

### 开场动画帧序列（11 帧，约 2.5s 总长）
```js
const OPENING_FRAMES = [
  { face: ' ',          mouth: '',  ms: 200 },  // 黑屏
  { face: ' .   . ',    mouth: '',  ms: 220 },  // 微亮
  { face: '──   ──',    mouth: '',  ms: 260 },  // 闭眼
  { face: '──   ──',    mouth: '',  ms: 180 },  // 闭眼保持
  { face: '[─] [─]',    mouth: '',  ms: 280 },  // 镜框出现
  { face: '[─] [─]',    mouth: '',  ms: 150 },
  { face: '[●] [●]',    mouth: '',  ms: 120 },  // 第一次睁
  { face: '[─] [─]',    mouth: '',  ms: 90  },  // 眨一下
  { face: '[●] [●]',    mouth: '',  ms: 200 },
  { face: '[●][●]',     mouth: '',  ms: 200 },  // 收紧（间距收窄）
  { face: '[●][●]',     mouth: 'ᴗ', ms: 600 },  // 微笑收尾 → idle
];
```

### 交互触发 mapping
| 触发条件 | 表情 |
|---|---|
| hover 项目 ls-row | `focus` |
| hover git log | `look_l` 或 `look_r` 随机 |
| hover 宠物 | `love` |
| hover 印章（如保留） / 链接 | `surprise` |
| 命令执行中 | `typing` 或 `loading` |
| 命令成功返回 | 短暂 `success` 后回 `idle` |
| 命令出错 | 短暂 `error` 后回 `idle` |
| 空闲 30s | `sleepy` |
| 空闲 60s+ | `sleep` |
| 用户开始输入 | `typing` |
| LLM 流式回答中 | `typing` 持续 |
| LLM 回答完成 | `smile` 短暂后 `idle` |

### 当前代码状态
| 文件 | 状态 | 路径 |
|---|---|---|
| `glasses-emotes.html` | ✅ 完整可运行（独立预览） | `site/v2-redesign/glasses-emotes.html` |
| `emotes.css` | ✅ 集成样式骨架（.avatar-emote 类） | `site/v2-redesign/emotes.css` |
| `emotes.js` | ❌ 未抽出（JS 还 inline 在 preview HTML 里） | 待 Phase 2 抽出 |
| 主页集成 | ❌ 未做 | 待 Phase 1-2 |

### Phase 2 实现要点（emotes.js 抽出 + 集成）
- 把 `glasses-emotes.html` 的 `<script>` 块抽到 `emotes.js`
- 暴露全局 API：`window.glassesEmote.set(key)` / `playOpening()` / `playLoading()` / `playTyping()`
- 主页加 `<div class="avatar-emote">...</div>` + `<script src="emotes.js"></script>`
- sessionStorage flag 控制开场动画只在第一次访问播放
- 自动监听 hover/idle 事件触发对应表情

---

## § 5 · 对话 LLM 接入（C 线主体）⏳ 未实施

### 后端架构 — 参考 eastern-wisdom（同台 alicloud-sg）

eastern-wisdom 已经跑通的模式（直接复用）：

| 项 | eastern-wisdom 现状 | maxwellii.com chat 用法 |
|---|---|---|
| LLM 接入 | 火山方舟 Coding Plan, OpenAI 兼容 | 同（共享 VOLCANO_API_KEY） |
| baseUrl | `https://ark.cn-beijing.volces.com/api/coding/v3` | 同 |
| 模型 | `doubao-seed-2.0-lite`（轻量、便宜、快） | 同（也可换 deepseek-v3） |
| AI client | `packages/shared/src/ai-client.ts` (50 行 fetch) | **直接复用** |
| Rate limit | `packages/shared/src/rate-limit.ts` (in-memory Map) | **直接复用** |
| 部署 | rsync + pm2 to `/home/admin/eastern-wisdom/` | 加一个 app 进 monorepo or 独立 |

### 推荐方案：piggyback on eastern-wisdom monorepo

```
eastern-wisdom/
├── apps/
│   ├── chinese-name/      ← 现有
│   └── maxwellii-chat/    ← 新加（最小 Next.js app, 只暴露 /api/chat）
├── packages/shared/       ← AI client + rate-limit 复用
└── scripts/deploy.sh      ← 已有，加 -w apps/maxwellii-chat 即可
```

`apps/maxwellii-chat/` 极简，只 1 个文件：`src/app/api/chat/route.ts`：
- POST /api/chat → 接收 `{ messages: [...] }`
- 加 system prompt（来自 §6）
- 调 ai-client.chat()
- 流式返回 SSE（stream: true）

nginx 路由：在 `maxwellii.com` 的 server block 加 `location /api/chat` proxy_pass localhost:3002（chat app 的 pm2 端口）。

### 安全 / 限流
- per-IP rate limit：20 msg/h（在 eastern-wisdom 的 rate-limit 上扩窗口）
- max_tokens：256-512（短回答 / 省钱 / 强迫 LLM 言简意赅）
- temperature：0.7
- system prompt 锁定身份（"你只回答关于 Maxwell / 李越男 的问题，其他婉拒"）
- CORS：限定 `Access-Control-Allow-Origin: https://maxwellii.com`

### 前端 — 流式打字 + markdown
| 功能 | 实现 |
|---|---|
| 流式打字 | fetch /api/chat with `stream: true` → 读 SSE chunk → 逐字符 typewriter render（10-20ms/char） |
| markdown 渲染 | 边流边渲，用现成的 marked.js 或自研 mdToHtml（跟 site/build.js 一致） |
| 代码块 | fenced code 用 `<pre>` 渲染，cyan border |
| 链接 | autolink + target=\_blank |
| /cmd 静态命令拦截 | 见 §7，命令不走 LLM |
| 头像表情联动 | typing 状态: `glassesEmote.set('typing')`; 完成: `'smile' → 'idle'`; 错: `'error'` |
| 对话气泡区分 | A + B + C 三种全要：A 终端前缀 (`maxwell:` / `you:`) + B 头像 mini 跟随 + C 缩进/不同背景 |
| LocalStorage 持久化 | sessionStorage 存当前 session 对话，访客刷新不丢；提供 /clear 清空 |

### 对话气泡形态（A+B+C 混合 ✅）
```
┌─ you ──────────────────────────────────────
│  > 你为什么离开 Nokia？

┌─ maxwell ──────────────────────────────  [●][●]
│  在 Nokia 待了 9 年... [流式打字进行中]_
```

- A: `you:` / `maxwell:` 前缀（终端隐喻）
- B: maxwell 回答时右上角带 mini avatar [●][●]，跟随表情
- C: 用户消息缩进左侧，maxwell 消息缩进右侧；背景用淡 amber 区分

---

## § 6 · system prompt 喂什么 ✅

### 决策：**全喂**

不做"静态 + 动态弱召"分层。直接把 Maxwell 全部公开内容塞 system prompt：

#### 必喂（静态身份）
- `MaxwellLi-AIProductManager.md`（最新简历）
- `site/public/index.html`（v1 whoami / projects / pets / history 文本）
- `site/data/projects/*.md` 10 项详情页 body（项目细节）
- `worklog/wiki/index.md`（项目生态全貌）

#### 访客身份识别 = LLM 自己看
不在前端做身份预设。LLM 根据访客消息口吻自己推断：
- 访客问"上家薪资 / 期望薪资 / 远程吗"→ HR
- 访客问"用啥框架 / 怎么部署 / 性能多少"→ 技术
- 访客问"商业模式 / 用户数 / 财务情况"→ 投资

system prompt 里写一段："根据用户语气自适应，不要主动问 'who are you'。"

#### SCRIPTED few-shot（Maxwell 自己写）
由 Maxwell 准备一份 `chat-fewshot.md`，列出常见问题的标准答法：
- 为什么离开 Nokia
- 现在做啥项目
- 你的 AI 落地方法论
- 一个人怎么并行 6 个项目
- ...

few-shot 也塞 system prompt（控制语气 + 防 LLM 编造细节）。

### Token 预算
- 简历：~2k token
- index.html 文本：~1.5k
- 10 项 projects 摘要：~5k（裁去技术细节，保留卖点）
- wiki/index.md：~2k
- few-shot：~3k
- **合计 ~13.5k token system prompt**

doubao-seed-2.0-lite 上下文 32k 应该够。如果超了：
- few-shot 可以选最热的 5-8 个，不是全部
- projects 摘要可以从 10 项压到 4 项（简历里的 4 大项）

---

## § 7 · /cmd 快捷栏 ✅

### 决策：F + E 混合

```
┌─ Hero 区上方 ──────────────────┐
│  ROLE / LIVE / HISTORY         │
│  Maxwell:                      │
│  嘿，我是李越男 ...             │
│  > _                           │
│                                │
│  快捷指令                       │
│  /projects /git log /stack ... │  ← 输入框下方一排 chip
└────────────────────────────────┘
```

输入框下方一排可点的 chip（F 方案），鼠标悬浮 chip 时输入框显示 hint（E 方案）。

### 命令列表（暂时只保留已确认的 ✅）

| 命令 | 行为 | 实现 |
|---|---|---|
| `/projects` | 渲染 v1 的 ls projects/ 10 行（不打 LLM） | 静态 fetch |
| `/git log` | 渲染最近 4 条 commit | 构建时注入 / 静态 |
| `/stack` | 渲染技术栈卡 | 静态 |
| `/pets` | 渲染 ls pets/（9 个宠物） | 静态 |
| `/history` | 渲染 ASCII timeline | 静态 |
| `/help` | 列出所有命令 | 静态 |

⏳ 未来候选（不在 v2 首版）：
- `/now` — 当下在做什么（本周状态卡）
- `/contact` — 拉联系方式
- `/clear` `/reset` — 清屏 / 重置对话
- `/quit` — 关闭对话回老主页（见 § 11.11）
- `/ask <q>` — 显式调 LLM（其实直接打字就行，可省）

---

## § 8 · 完整页面流程 30 行 ASCII

```
┌─ ~/iyuenan3 — bash — 100×40 ─────────────────────────┐
│                                                       │
│  $ neofetch                                           │
│  ┌─┐  Maxwell · 李越男 · 杭州       [github] [in]   │
│  │░│  ROLE     AI 产品经理 · AI 落地顾问             │
│  └─┘  LIVE     杭州 · last push 5h · ● online       │
│       HISTORY  Nokia 6yr · 杭州 2yr · 全栈 1yr      │
│                                                       │
│  $ chat                                               │
│  maxwell: 嘿，我是李越男，今天想聊点什么？           │
│  you:    > _                                          │
│                                                       │
│  快捷指令                                             │
│  /projects /git log /stack /pets /history /help       │
│                                                       │
│ ──────────────── 对话开始后向下延展 ──────────────── │
│                                                       │
│  $ tail -f ~/livelog                                  │
│  [底部小区域] 2026-05-09 14:22 push maxwell-homepage │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### D 线模块叠在哪
- **neofetch 欢迎屏** = Hero 区本体（`$ neofetch` 命令风）
- **tail -f livelog** = 页面底部小区域，3-5 条最近事件滚动（git push / 项目 update / blog post）
- **now 状态卡** = `/now` 命令触发，本周在做什么 / 本月进度
- **彩蛋** = 在对话框输 `cowsay hello` `coffee` 触发 ASCII art / `↑↑↓↓←→←→BA` Konami code 触发隐藏表情

---

## § 9 · HANDOFF 边界（硬性）

### 不能动的
- **终端隐喻**：所有 UI 必须在终端窗口隐喻内（titlebar / 命令前缀 / 等宽字体 / dark bg）
- **shell 语义**：一律 `bash`，不要 `zsh`
- **文案不要"优化"或润色**：Maxwell 已经反复打磨过，照抄不要改字
- **禁词清单**：不出现 抚仙湖 / 骑行 / 公路车 / 诗人 / 诗歌 / 丁克 / 0 kids / 感情 / 婚姻

### 可以动的
- 颜色微调（amber/cyan/green hex）
- 字体回退栈
- 字号 / 行距 / 间距（前提是终端美学不破）
- 动画 timing
- 表情库扩充（22 个之外加新的）

### 删掉的
- ❌ 朱砂方印 李越男印 signoff（v1 有，v2 删）
- ❌ 8 行 kv whoami 卡片（被新 Hero 接管）
- ❌ 话题清单（"可以聊聊: AI 项目落地 · ..."）

---

## § 10 · 分阶段落地路径

| Phase | 内容 | 依赖 | 可独立预览 |
|---|---|---|---|
| **1** | Hero 区静态重构 — 删旧 whoami / 加新眼镜头像位 + ROLE/LIVE/HISTORY 3 行 + 输入框样式 + /cmd chip 排 | 无 | ✅ 纯 HTML/CSS |
| **2** | 眼镜表情系统集成 — 抽 emotes.js / 主页加载 / 开场动画 / hover 触发 / idle 态 | Phase 1 | ✅ 仍纯前端 |
| **3** | /cmd 静态命令拦截 — 命令面板 / 渲染 projects/git log/stack/pets/history/help 内容 | Phase 1, 2 | ✅ 仍纯前端 |
| **4** | LLM API 后端 — 在 eastern-wisdom monorepo 加 apps/maxwellii-chat / nginx /api/chat 路由 / system prompt 准备 | 无（与 1-3 并行） | 部署后 curl 测 |
| **5** | 对话前端 — 输入框接 /api/chat / SSE 流式 / markdown 渲染 / 气泡 A+B+C / sessionStorage | Phase 3, 4 | 端到端 |
| **6** | 表情 + LLM 联动 — typing / loading / smile / error 跟随 LLM 状态切换 | Phase 2, 5 | 完整 |
| **7** | D 线 tail -f livelog / 彩蛋 cowsay / Konami | 主线完成后 | ✅ 增量 |
| **8** | review + 一次性 deploy 替换线上 | 全部完成 | maxwellii.com |

---

## § 11 · Open Questions ✅（Maxwell 已答）

| # | 问题 | Maxwell 回答 | 备注 |
|---|---|---|---|
| 1 | 后端选什么？ | 参考 eastern-wisdom，同台 alicloud-sg | ✅ 已 § 5 落地 |
| 2 | LLM 选什么？ | 火山方舟 或 阿里百炼 Coding Plan，OpenAI 兼容 | ✅ doubao-seed-2.0-lite（沿用 eastern-wisdom 配置） |
| 3 | rate limit 多少？ | 后面再讨论 | ⏳ Phase 4 实现时再决 |
| 4 | system prompt 喂啥？ | 全喂（简历 + 主页 + 10 项 + wiki + few-shot） | ✅ 已 § 6 落地 |
| 5 | 访客身份识别？ | LLM 自己识别 | ✅ 不在前端做选择 |
| 6 | SCRIPTED few-shot 谁写？ | Maxwell 自己写 | ⏳ Maxwell 准备 chat-fewshot.md |
| 7 | /cmd 命令完整列表？ | 暂时只保留已确认的 6 个 | ✅ 已 § 7 落地 |
| 8 | 对话气泡区分？ | A + B + C 三个全要 | ✅ 已 § 5 落地 |
| 9 | 朱砂方印 signoff 还要吗？ | 删掉 | ✅ 已 § 9 删除 |
| 10 | D 线模块要做哪些？ | neofetch + tail -f livelog + now + 彩蛋 全部要做 | ✅ 已 § 8 / Phase 7 落地 |
| 11 | 进对话后怎么回老主页？ | `/quit` 退出 + 另在某位置保留一个回主页按钮 | ✅ Phase 1 在 hero 区右上角加 `[exit]` 按钮 |

---

## 附录 A · 文件清单（v2-redesign 沙盒）

```
site/v2-redesign/
├── DESIGN-NOTES.md            ← 本文件
├── glasses-emotes.html        ✅ 独立预览（22 表情库 + 开场动画）
├── emotes.css                 ✅ 主页集成样式骨架
├── (Phase 1) index.html       ⏳ 新主页 v2
├── (Phase 2) emotes.js        ⏳ 抽出的全局表情控制 API
├── (Phase 3) commands.js      ⏳ /cmd 静态命令路由器
├── (Phase 4) chat-fewshot.md  ⏳ Maxwell 写的对话 few-shot
├── (Phase 5) chat.js          ⏳ 对话前端（SSE / markdown / 气泡）
├── (Phase 5) chat.css         ⏳ 对话气泡样式
├── (Phase 7) easter.js        ⏳ Konami / cowsay 彩蛋
└── screenshots/               ⏳ 改前 / 改后对比
```

## 附录 B · 后端文件（eastern-wisdom 仓库）

```
eastern-wisdom/apps/maxwellii-chat/
├── package.json
├── ecosystem.config.cjs        ← pm2 config（参考 chinese-name）
└── src/app/api/chat/route.ts   ← /api/chat handler（SSE 流式）
```

nginx 改动（生产 /etc/nginx/sites-enabled/maxwellii.com.conf）：
```nginx
location /api/chat {
    proxy_pass http://127.0.0.1:3002;
    proxy_http_version 1.1;
    proxy_buffering off;             # 关键：SSE 不能 buffer
    proxy_set_header Connection '';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

**END · DESIGN-NOTES.md v1**
