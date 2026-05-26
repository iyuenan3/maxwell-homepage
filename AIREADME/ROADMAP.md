# ROADMAP — maxwell-homepage
<!-- 节奏。不放可执行 TODO 颗粒(→项目 TODO / worklog)，只放方向。 -->

## Now（当前焦点）
- **内容同步**：主页 `site/public/index.html`(via home-data.js) + README 的定位语 / 项目命名 / 4 大独立项目保持一致；简历已迁 worklog，定位变化需跨项目同步。
- **RAG 索引维护**：知识源（vault / worklog / ai-knowledge）变动后 `npm run update` 重建 + 部署，保持化身答案新鲜。
- **隐私防御稳态**：4 层求职过滤的关键词 4 处同步；化身翻车（泄露 / 伪造归属）随时修。

## Next
- **观察直连 Ark 线上表现**：TTFT（首查 ~5.5s，多为 RAG context prefill）/ 成本 / 错误率，跑一段时间确认稳态。
- **同步 nginx 安全头**：核对服务器实际 4 安全头，把仓库 `site/nginx.conf` 补齐到与服务器一致（消除 drift，见 DEPLOYMENT / MEMORY）。
- **prompt cache 验证**：切回 doubao 系列后理论上恢复 cache 透传（deepseek 时代预计无命中），实测 TTFT / 命中率确认。

## Later
- **（已放弃）newapi-proxy 内网二阶段** —— 2026-05-24 chat-api 改直连火山方舟 Ark，不再经 newapi，此方案作废。
- 详情页 `timeline` 组件（截图接口已预留，未渲染）按需启用。

## 已搁置（+原因）
- **chat-api server-side session**（防伪造对话历史的方案 B）：工程量大 → 改用 system-prompt 强化（方案 D），已搁置 server-side 实现。
- **`commands.js pushSystemMsg` 引 dompurify**（千野 P2）：HOME_DATA 是静态受控 JS，数据完全受控 → 数据动态化前不做。
- **简历 short-story 项目展示**：是否纳入简历的决策现归 worklog（简历已迁）；本仓库不再涉及。
