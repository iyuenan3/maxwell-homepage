# AGENTS.md

本文件是 `maxwell-homepage` 的 Codex 启动入口。仓库公开，提交到 GitHub。详细架构、契约、决策与历史以 `AIREADME/` 为准，先读 `AIREADME/INDEX.md`。

## 启动顺序

1. 读本文件。
2. 读 `AIREADME/INDEX.md`，按任务加载对应文档。
3. 下结论或修改前，以当前代码、Git 状态和真实运行结果校验文档。
4. 需要跨会话项目历史时，使用已安装的 `stash` Skill 解析外部项目记忆，不在公开仓库保存私人记忆。

## 任务路由

| 任务 | 必读 |
|---|---|
| 了解项目、边界与跨项目依赖 | `AIREADME/CORE.md` + `AIREADME/RELATIONS.md` |
| 修改站点或 chat-api 架构 | `AIREADME/ARCHITECTURE.md` + `AIREADME/DECISIONS.md` |
| 修改 chat 化身、RAG 或隐私机制 | `AIREADME/ARCHITECTURE.md` + `AIREADME/CONVENTIONS.md` + `AIREADME/DECISIONS.md` |
| 修改 HTTP、SSE、URL 或详情页数据契约 | `AIREADME/SPEC.md` |
| 修改产品定位、主页文案或项目命名 | `AIREADME/PRD.md` + `AIREADME/CONVENTIONS.md` |
| 构建、部署与运维 | `AIREADME/DEPLOYMENT.md` + `AIREADME/MEMORY.md` |
| 版本、规划与历史事故 | `AIREADME/CHANGELOG.md` + `AIREADME/ROADMAP.md` + `AIREADME/MEMORY.md` |

## 公开仓红线

- key、token、真实手机号、私人路径、私密项目名和雇主机密绝不进入任何跟踪文件。
- 敏感运行时词只从 `chat-api/.env.local` 注入。可以提交变量名和通用机制，不能提交真实值。
- 求职、面试、谈薪、第三方公司情报、当前雇主和内部项目不得经化身泄露。
- 化身不得伪造第三方产品归属，不得编造骑行表现或身体数据。
- `chat-api/data/`、RAG manifest、`.env.local`、本地备份和本地工作指引均属于本地产物，不得纳入提交。
- 不把 `.gitignore` 当作新私密内容的安全边界。新的私人材料放入私有知识库。

## 修改与验证

- 修改含中文或引号变体的文件前，先精确读取目标段，再基于磁盘原文修改。
- 保留用户已有改动和未跟踪文件。只暂存本任务明确修改的路径。
- 站点构建：`node site/build.js`
- chat-api 静态检查：`cd chat-api && npm run lint`
- chat-api 构建：`cd chat-api && npm run build`
- RAG dry-run：`cd chat-api && npm run reindex:dry`
- RAG 全量更新与生产部署耗时较长，并会访问外部服务。只有用户明确要求时才执行。
- 生产部署、nginx 推送、commit 和 push 均需用户明确指令。

## AIREADME 维护

- 架构或数据流变化，更新 `ARCHITECTURE.md`。
- 外部接口或内容契约变化，更新 `SPEC.md`。
- 重大取舍追加到 `DECISIONS.md`，不要改写旧 ADR。
- 事故与防复发经验追加到 `MEMORY.md`。
- 发布与里程碑追加到 `CHANGELOG.md`。
- 部署方式变化，更新 `DEPLOYMENT.md`。
- 命名、文案和协作规则变化，更新 `CONVENTIONS.md`。
- 最后刷新 `INDEX.md` 的状态摘要与同步锚点，并运行 AIREADME 检查。

## 兼容说明

- Codex 以本文件为入口。
- 本机若存在被 `.gitignore` 忽略的 `CLAUDE.md`，它只用于旧 Claude 客户端兼容，不是公开真相源。
