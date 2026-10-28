# ROADMAP — maxwell-homepage
<!-- 节奏。不放可执行 TODO 颗粒(→项目 TODO / worklog)，只放方向。 -->

## Now（当前焦点）
- **公开履历与项目画像**：V1 按最新简历展示经批准的职业时间线与技术栈；主页、README、详情页与化身 prompt 维持 9 个精选项目，静态任职事实与化身披露继续隔离。
- **RAG 索引维护**：知识源（外部 vault，含 hdu / worklog）变动后按索引维护流程重建 + 部署，保持化身答案新鲜。
- **隐私防御稳态**：维护求职过滤、frontmatter 私有标记、env 注入的雇主机密过滤与骑行数据回避；化身翻车（泄露 / 伪造归属 / 编造数据）随时修。
- **Qwen 文本迁移**：在线对话、RAG 审稿与脱敏先直连 Qwen，Embedding 保留旧索引与独立配置，向量服务不可用时以空 context 继续对话。

## Next
- **Embedding 单独迁移**：另行选择向量供应商、重建并验证索引；文本能力迁移不代表完整 RAG 恢复。
- **同步 nginx 安全头**：核对服务器实际 4 安全头，把仓库 `site/nginx.conf` 补齐到与服务器一致（消除 drift，见 DEPLOYMENT / MEMORY）。
- **Qwen 稳态观察与凭证用途调整**：持续核对 SSE `meta.model`、TTFT、usage 与错误率，长期切换为支持应用后端的通用 API 凭证。

## Later
- **（已放弃）newapi-proxy 内网二阶段** —— 2026-05-24 chat-api 改直连火山方舟 Ark，不再经 newapi，此方案作废。
- 详情页 `timeline` 组件（截图接口已预留，未渲染）按需启用。

## 已搁置（+原因）
- **chat-api server-side session**（防伪造对话历史的方案 B）：工程量大 → 改用 system-prompt 强化（方案 D），已搁置 server-side 实现。
- **`commands.js pushSystemMsg` 引 dompurify**（千野 P2）：HOME_DATA 是静态受控 JS，数据完全受控 → 数据动态化前不做。
- **简历 short-story 项目展示**：是否纳入简历的决策现归 worklog（简历已迁）；本仓库不再涉及。
