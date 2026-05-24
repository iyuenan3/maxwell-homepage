# ROADMAP — maxwell-homepage
<!-- 节奏。不放可执行 TODO 颗粒(→项目 TODO / worklog)，只放方向。 -->

## Now（当前焦点）
- **内容三处同步**：简历 MD/HTML、主页 `site/public/index.html`(via home-data.js)、README 的定位语 / 项目命名 / 4 大独立项目保持一致。
- **RAG 索引维护**：知识源（vault / worklog / ai-knowledge）变动后 `npm run update` 重建 + 部署，保持化身答案新鲜。
- **隐私防御稳态**：4 层求职过滤的关键词 4 处同步；化身翻车（泄露 / 伪造归属）随时修。

## Next
- **核实并消除 newapi 端点 drift**：chat-api 配置对齐 newapi-proxy 当前端点（具体值见 `../newapi-proxy/AIREADME/SPEC.md`），见 RELATIONS drift flag。
- **同步 nginx 安全头**：核对服务器实际 4 安全头，把仓库 `site/nginx.conf` 补齐到与服务器一致（消除 drift，见 DEPLOYMENT / MEMORY）。
- **prompt cache 验证**：切回 doubao 系列后理论上恢复 cache 透传（deepseek 时代预计无命中），实测 TTFT / 命中率确认。

## Later
- newapi-proxy 二阶段：上游切到 newapi 内网（`127.0.0.1:3000/v1`），newapi-proxy 侧记为 planned 入向（跨项目，走转达流程）。
- 详情页 `timeline` 组件（截图接口已预留，未渲染）按需启用。

## 已搁置（+原因）
- **chat-api server-side session**（防伪造对话历史的方案 B）：工程量大 → 改用 system-prompt 强化（方案 D），已搁置 server-side 实现。
- **`commands.js pushSystemMsg` 引 dompurify**（千野 P2）：HOME_DATA 是静态受控 JS，数据完全受控 → 数据动态化前不做。
- **简历 short-story 项目展示**：CLAUDE.md 曾约束"副业不写"，5/11 反转为可作 Vibe Coding 工程亮点，但当前简历未纳入 —— 状态按需，不强推。
