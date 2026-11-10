# DEPLOYMENT — maxwell-homepage
<!-- 跑哪/怎么跑/共享什么。共享底座自身配置→其独立节点；key→哪都不写。 -->

## 个人主页运行与维护边界（2026-11-10）

- 最近一次验收中，主页三个容器的启动时间未变化；公网首页与源站 V1 为 `200`，公开 `hi` 对话返回完整 SSE、`deepseek-flash` 和非零用量，无流式错误。
- 主页仍经独立 `18080` 提供服务。域名 HTTPS 上线须另行确认仅面向主页的入口方案，不以其他服务的历史接入流程作为默认步骤。
- 本仓库只维护主页部署。外部 Docker 网络 `edge` 和被 `maxwellii-preview` 只读挂载的 Origin CA 目录仍是当前配置引用的资源，不能因移除文档关联而删除。
- 用户已于 2026-11-09 报告提交 maxwellii.com 新增备案，本次未查询审核进度，也未撤回或重复提交。下方较早备案状态保留为历史。
- 本次仅清理仓库内容和引用，不部署、不重建 RAG，不修改 DNS、服务器、其他仓库或业务数据。

## 主机 + 环境
- **当前域名状态**：2026-10-30 用户选择阿里云备案并将权威 DNS 迁入阿里云，备案期间主页域名离线。主域与 `www` 已预置北京 A 记录但保持暂停，尚未完成备案或北京域名 HTTPS 上线，见下方 DNS 与备案流程。
- **旧生产 Origin 已退役**：`alicloud-sg`（`admin@47.84.100.47`）于 2026-10-31 按用户明确授权清理全部业务和数据，不新增备份。PM2、nginx、Redis、FRP 及业务目录、日志、证书和历史业务备份已移除；保留系统、SSH 和 ECS 实例。它不再是可切回的生产源站，不能靠恢复 DNS 或运行旧发布命令恢复服务，详见退役节。
- **默认发布 Origin（域名待验收）**：2026-10-31 起为 `alicloud-bj`（`admin@39.96.12.136:22`），Ubuntu 24.04，Docker + Compose。此前域名在杭州和北京的公网 HTTP 均返回明确的 `403 Non-compliance ICP Filing`；默认发布目标改变不代表备案阻断解决或域名 HTTPS 已上线。
- **发布目录**：`/srv/maxwell-homepage/current -> releases/20261030-64a0093`。Compose 项目为 `maxwellii-homepage`，配置在 `current/ops/compose.yaml`。旧机原 `/home/admin/maxwellii-site/`、`/home/admin/maxwellii-chat-api/` 已删除。
- **北京 chat-api**：容器 `maxwellii-chat-api`，Node.js 24.14.0、Next.js 16.3.0，UID/GID 10001（专用用户 `maxwellii`），主机仅发布 `127.0.0.1:3002`，CPU 1 核、内存 768 MiB。镜像版本与摘要固定；只读容器根文件系统、禁止提权、丢弃全部 capability。应用及日志目录为可写挂载，日志位于 `/var/lib/maxwellii/chat-api-logs/`。
- **北京静态站**：容器 `maxwellii-site`，Caddy 2.11.3，只读挂载 `current/site/`。私有入口保持 `127.0.0.1:3080 -> :8080`，另发布独立公网 `0.0.0.0:18080 -> :8081`。`ops/caddy/site.Caddyfile` 保留静态路由、缓存、HSTS 和即时 SSE 反代；SSE 路径不启用 gzip。CPU 0.25 核、内存 128 MiB，非 root 用户，保留官方 Caddy 二进制所需的 `NET_BIND_SERVICE` bounding capability，见 MEMORY。
- **独立 HTTPS 验收**：`preview` profile 的 `maxwellii-preview` 仅发布 `127.0.0.1:3443`，加载 `ops/caddy/edge-homepage.caddy`，使用真实 Origin CA 证书严格校验。它不占用公网端口，不修改其他服务。
- **持久数据**：`shared/.env.local` 与 `shared/data/` 通过软链接入应用目录，归 `maxwellii` 所有。共享目录权限 700，配置与索引权限 600；配置备份位于 `shared/config-backups/`。本轮经单独授权传输，未重跑索引。
- **SSL 证书**：北京副本位于 `/home/admin/edge/caddy_data/maxwellii-origin/maxwellii.com.{pem,key}`，私钥 root:root、600，证书与私钥公钥摘要一致。2026-10-31 仅删除新加坡机的共享证书副本，未撤销证书，北京副本保留，已停用子域不恢复。Origin CA 不是浏览器公有信任证书，阿里云 DNS 直连上线前须配置公有可信证书，不能把当前 preview 的 Origin CA 校验等同于浏览器直连验收。
- **杭州候选退役**：`115.29.187.72` 的本次新增资源在完整离机备份校验后清理，具体范围见本文件备份节。原有业务和原先已安装的 Node.js 保留。

## 怎么起

### 静态站点（改 site/* 后）
```bash
bash site/deploy.sh
# 默认 alicloud-bj:/srv/maxwell-homepage/current/site（目录归 admin 所有）
# build.js（V1 index + 12 详情页）→ 5 stage rsync：
#   Stage1 V2→根 / Stage2 data/→data/ / Stage3 p/→p/(--delete) / Stage4 V1→v1/ / Stage5 detail-init.js→根
# 历史 SSH_HOST / REMOTE_DIR 覆盖机制仍保留，但新加坡机已退役，不是可用发布目标
```

### chat-api（改后端 / 重建索引后）
```bash
(cd chat-api && npm run lint && npm run build && npm audit --omit=dev)
bash chat-api/deploy.sh
# 默认 PROCESS_MANAGER=docker，目标为北京 current/chat-api（仓库根执行）
# PROCESS_MANAGER=pm2 仅保留历史兼容分支，原目标已清理，不可直接用于发布
# build 失败即中止；代码同步排除 .env*、data/、node_modules、构建缓存、RAG 清单与迁移报告
# 索引单文件上传 → SHA256 校验 → 备份旧索引 → 原子替换
# docker 分支：容器内以专用用户 npm ci --omit=dev → 只重建 chat-api 容器
```

北京通过 `sudo docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml up -d chat-api site` 启动；需要独立 TLS 验收时另加 `--profile preview up -d preview`。初次准备 UID/GID 10001、持久目录、配置与索引软链、现有 `edge` 网络及证书副本后才能启动，不能只上传 Compose 文件就视为迁移完成。

`ops/compose.yaml` 与 Caddy 配置需要单独同步、`docker compose config --quiet` 和 `caddy validate`，后端 deploy 不自动发布 `ops/`。站点容器挂载发布目录的真实路径，切换 `current` 软链后必须只重建本项目容器，不能假定挂载自动跟随软链。Caddy 配置以目录挂载，避免单文件 bind mount 与原子替换的 inode 漂移。

### 北京独立公网 IP 入口

`http://39.96.12.136:18080/` 提供公开 V2、`/v1/`、详情页、资源和同源 `/api/chat`，不经共享网关，也不改变域名。`site.Caddyfile` 引入 `public-ip.Caddyfile`，公网监听先拒绝 `/admin*`、`/_next*`、`/.env*` 与 `/.git*`，再转发本容器私有站点入口；客户端地址头由连接地址重写，不信任请求自报地址。管理日志继续使用 SSH 或私有严格 TLS 入口。

2026-10-30，主机端口探针在安全组放行前可本地监听，但两条公网链路都超时。用户报告新增入方向 TCP 18080、来源 `0.0.0.0/0` 后，两条公网链路均验证成功，服务器不另改 UFW 或共享防火墙策略。该入口是明文 HTTP，只用于公开访问与验收，不能在此输入管理 token 或敏感内容，也不代表域名备案或 HTTPS 切换已完成。

修改此入口时，先备份 `compose.yaml`、`caddy/site.Caddyfile` 与已有的 `caddy/public-ip.Caddyfile`，验证后仅执行 `sudo docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml up -d --no-deps --force-recreate site`。当前上线前备份位于 `shared/config-backups/20261030-203546-before-public-ip/`，回滚恢复原 Compose 与站点配置后，仅重建 `site` 即撤回公网监听，保留私有 3080；无须改 DNS 或重启后端及其他服务。

北京每日 token 失效使用 `ops/systemd/maxwellii-admin-token-reset-docker.service`，安装时名称为 `maxwellii-admin-token-reset.service`，配合同目录 `.timer`，执行 `ops/reset-admin-token.mjs` 后仅重启本项目 chat-api。原 systemd 后端与非 Docker reset 模板保留用于历史恢复，不用于北京部署，`PROCESS_MANAGER=systemd` 已拒绝。

日常发布不修改共享网关、unit 或其他服务。当前采用原目录同步与重启，可能短暂停顿，不承诺零停机或自动代码回滚。

本地 `.env` 或环境变量中的发布参数仍可覆盖默认值。默认目标切换只改变后续发布去向，不会自动同步代码、重启容器、备份或清理旧机，也不启用 DNS；原有发布时索引校验、备份及原子替换机制保留。

### RAG 索引更新（知识源变动后，本地跑 ~30 min）
```bash
cd chat-api && npm run update      # = scan(增量 judge) + reindex(4 层 filter + chunk+embed) + deploy
cd chat-api && npm run scan:force  # 改了 judge prompt 必须全量重 judge（~50 min 全链路）
```

`npm run update` 只允许在 scan `error=0` 且 sanitize 全部成功后进入 embedding 和 deploy。账户额度不足会 fail-fast，旧 `embeddings.json` 与生产服务保持不变；恢复额度后必须从 scan 重跑，不得跳过失败阶段直接部署旧 manifest。

2026-10-28 仅迁移 chat / judge / sanitize，不运行 `npm run update` 或全量 reindex。`npm run scan` 的新审稿请求使用 Qwen，既有 manifest 仍按 mtime 增量复用；需要全部重新审稿时单独运行 `npm run scan:force`。Embedding 待后续迁移，当前不能以文本接口成功宣称完整 RAG 恢复。

### 仅重建现有脱敏片段的向量

以下命令在 `chat-api/` 执行，不扫描原始知识库、不运行 judge/sanitize，也不触发部署：

```bash
npm run reembed -- --dry-run  # 本地检查、计数，无外部调用
npm run check:models         # 少量纯合成样例，实际调用收费接口
npm run reembed -- --activate # 备份旧索引、重建并校验候选、原子替换本地索引
```

若只需要候选而不替换，使用 `npm run reembed`（与上面的 activate 模式二选一），输出 `data/embeddings.candidate.json`；已有候选会拒绝覆盖。旧索引保存在用户私有数据目录 `.local/share/maxwell-homepage/backups/reembed-*/`，目录 700、文件 600，复制后验证 SHA256。任何上游错误、向量异常或源文件变动都阻断替换。当前进程缓存索引，替换后须重启本项目后端，配置与索引应一起发布或回滚。

2026-11-09 本地验收已完成：DeepSeek JSON 审稿、合成脱敏、SSE/usage、关闭思考，以及真实本地 RAG 对话与合成隐私词的 0-token 拦截通过；17 项离线测试、lint/build 通过。初验曾被通用 Key 的 Embedding 端点限制阻断，补充独立分组 Key 后已生成并启用 2,929 条 `qwen3.7-text-embedding` 2048 维向量。旧索引的 2,932 条片段完整私有备份，排除 3 条命中现行敏感词表的片段，其余文本、元数据和旧 `sanitize_model` 均逐条核对不变。新索引 SHA256 为 `9855f450f18d8ec3ad909315e75c530c47a3b19b49c8630a19e83f3bb55e5b42`。四类公开查询均召回相关内容，真实 HTTP/SSE 日志证明检索未降级为空 context。未部署、切域名、重新扫描原始资料或批量重跑脱敏，代码与文档尚未提交，不宣称生产环境已迁移。

### 北京灵眸模型发布（2026-11-09）

用户单独授权后，已同步后端制品、9 项模型变量和上述新索引，仅重建 `maxwellii-chat-api`。此生产结果取代上段本地阶段的“未部署”状态；未重新扫描原始资料、批量审稿或脱敏，未发布静态站、修改 DNS 或共享网关。发布时尚未提交，模型迁移与超时适配实现后续记录于 `a92a41f`。

- **运行态**：容器健康、重启次数为 0；文本、审稿和脱敏为 `deepseek-flash`，向量为 `qwen3.7-text-embedding`、2048 维。生产索引 2,929 条，SHA256 与本地一致，按生产隐私规则逐条检查为 0 个问题。独立只读、禁网校验容器已退出，不与线上进程共享内存限额。
- **实际请求**：公网 `hi` 和公开项目问答均为 200，返回完整 SSE、目标模型和非零 usage；项目问答的生产日志保留 10 条检索命中，包含目标项目。通用求职与提示词注入测试为 0-token 拦截。北京端 Embedding、JSON 审稿、合成脱敏和关闭思考的流式探针全部通过。
- **隔离验证**：首页与 V1 均为 200，管理、配置、Git 和 Next 内部路径为 404；非模型配置逐行不变，生产管理口令和隐私词表保留。Compose/Caddy 配置哈希以及其余容器的 ID、启动时间和重启次数均不变。
- **发布备份**：`shared/config-backups/20261109-before-lmuai-u0nbOh/` 保存发布前的 `env.local`、`embeddings.json` 和含生产依赖的 `chat-api.tar.gz`，目录 700、敏感文件 600；部署脚本另保留 `shared/data/embeddings.json.bak.20261109-193248`。配置、代码与索引必须成套恢复并仅重建后端；旧配置已出现上游异常，恢复旧状态不等于恢复模型可用性。

同日连续验收发现初版 5 秒向量上限导致两次降级，随后只将在线默认上限放宽到 10 秒，离线显式超时保持不变。18 项离线测试与 lint/build 通过后补充发布，配置和索引哈希不变。修正前的新模型代码与配置保存在 `shared/config-backups/20261109-before-embed-timeout-8Zb97L/`，不替代上面的迁移前完整备份。最终冷启动、连续调用、45 秒空闲后调用及问候共 5 次正常请求均召回 12 条片段，日志各保留前 10 条，RAG 错误与超时均为 0；两次隐私拦截仍为 0 token。冷启动 RAG 约 6.8 秒，其余四次约 0.2 至 0.3 秒，这是本次样例，不是长期延迟保证。

### 旧生产 nginx 配置（仅历史恢复参考）

2026-10-31 新加坡 nginx 软件包、虚拟主机配置和证书副本已清理，不再执行旧推送命令。`site/nginx.conf` 仍保留历史根目录与路由契约，不能用于北京。未来若获准重建旧环境，须先重新准备服务、目录、凭证与证书，再核对所有 location（尤其 `/api/chat`）和安全头，配置校验通过后才能启用；这不是现有生产回滚路径。

### 北京公网切换前置条件

先完成备案并解决接入阻断，再为主域和 `www` 配置浏览器公有可信证书。`edge-homepage.caddy` 当前引用 Origin CA，不能直接照搬到无 Cloudflare 代理的公网入口。后续仅面向主页确定入口与端口，先备份本项目配置并完成校验，不默认修改其他服务。先指定目标 IP 完成携带域名的公网严格 TLS、页面与真实对话验收，同时确认已有入口不变，再启用已暂停的两条 A 记录。失败时恢复北京已验收配置或暂停解析，不能再切回已清理的新加坡机。当前尚未执行域名 HTTPS 上线。

### 阿里云 DNS 与备案流程

- **权威 DNS 已迁移**：2026-10-30 注册商 DNS 改为 `dns15.hichina.com`、`dns16.hichina.com`。21:27（Asia/Shanghai）已从 `.com` 父区、两台阿里云权威服务器及 `1.1.1.1`、`223.5.5.5` 验证新 NS；不代表全球所有缓存已同步。
- **解析预置但暂停**：`@ A 39.96.12.136` 与 `www A 39.96.12.136`，默认线路，TTL 600 秒，均为暂停。实测根域 A 为 NOERROR 且无答案，`www` A 为 NXDOMAIN，符合用户批准的备案期间域名离线方案。
- **范围**：用户确认 `naming`、`oracle`、`tale` 三个子域停用，不恢复记录。2026-10-30 DNS 迁移未删除 Cloudflare 旧 zone、创建 Tunnel、购买额外服务或修改服务器及其他域名；2026-10-31 新加坡业务另获授权退役，北京独立 IP 入口保持原状。
- **DNSSEC**：切换前父区未查到 DS，本轮未删除 DS 或关闭 DNSSEC。
- **备案尚未提交**：域名实名认证已通过，但同账号另有一笔变更备案在审核，“新增/接入其它服务”入口禁用。待该订单结束后再申请本域名备案，不取消或修改现有订单，也不将域名实名认证视为 ICP 备案通过。
- **恢复上线门槛**：备案与接入完成、公有可信 HTTPS 和公开页面/SSE 验收通过后，按实际备案结果补齐备案展示，再启用 `@` 和 `www`；后续按适用要求办理公安备案。
- **可恢复性**：切换前后 DNS 状态另存于仓库外私有备份。必要时可将 NS 改回 `jobs.ns.cloudflare.com`、`imani.ns.cloudflare.com`；本次切换前旧权威 DNS 已无主页 A 记录，仅恢复 NS 不会自动恢复网站在线，须另行确认解析与上线授权。

## 域名 / 入口
- 预期域名路由：`https://maxwellii.com/` → V2 化身主页 · `/v1/` → V1 · `/p/<slug>.html` → 详情页 · `/api/chat` → SSE · `/admin/logs?token=` → 日志页。当前域名按备案方案暂停解析，不表示这些公网 URL 已可用。
- 北京独立公网入口：`http://39.96.12.136:18080/`，公开页面与对话可用，管理日志页与 Next 内部资源在此入口统一 404；域名上线仍需单独验收。
- 北京私有预览：本机运行 `ssh -N -L 13080:127.0.0.1:3080 alicloud-bj` 后访问 `http://127.0.0.1:13080/`。传输经 SSH 加密，不要求安装 Origin CA；不要把 3080、3443 或 3002 直接暴露公网。
- 路由 / 缓存 / 安全头细节见 SPEC ② + 下方运维约束。

## 共享底座引用
- **文本 LLM（2026-11-09 北京已部署）**：灵眸 `https://api.lmuai.com/v1`，`CHAT_LLM_MODEL` / `RAG_JUDGE_MODEL` / `RAG_SANITIZE_MODEL` 均为 `deepseek-flash`，共享 `CHAT_LLM_API_KEY`。保留标准 TLS 校验。旧百炼配置只作历史，不继续推荐 Coding Plan 用于网站后端。
- **Embedding（2026-11-09 北京已部署）**：同一灵眸 base URL，`EMBED_LLM_MODEL=qwen3.7-text-embedding`、`EMBED_LLM_DIMENSIONS=2048`，使用独立的 `EMBED_LLM_API_KEY` 分组密钥。合成请求及全量既有片段重向量化均已验证；通用 Key 虽可列出该型号，但该端点限制不能以模型列表替代验收，事故见 MEMORY。模型、维度、Key 与新索引已一起同步并完成生产读回。
- **权威 DNS = 阿里云 DNS 免费版**：主域与 `www` 预置北京 A 记录但暂停；备案后计划公有可信 HTTPS 直连，不再以 Cloudflare 代理或 Tunnel 作为当前上线方案。旧 Cloudflare zone 保留作历史与回退参考。

## 缓存策略
- nginx / 北京 Caddy：图片/字体 30d + immutable；CSS/JS `max-age=0, must-revalidate`（ETag 校验，改了立即生效，不需 `?v=` cache bust）；`/_next/` immutable。`/api/chat` SSE 不压缩、不缓冲。
- 历史 Cloudflare 代理配置：Browser Cache TTL 默认 4h 会覆盖 origin `max-age=0`，使用代理时需后台 Caching → Browser Cache TTL 设 "Respect Existing Headers"。当前 DNS 方案不经过该代理，此项只保留为恢复参考。

## 备份 / 升级 / 回滚
- **embeddings.json** 不入 git。2026-10-30 迁移的旧产物约 104 MB、2932 个 2048 维片段，新旧 SHA256 一致；本次未重新审稿、脱敏或 embedding。后续部署在共享数据目录保留 `embeddings.json.bak.*`，再原子替换索引。
- **manifest.json**（LLM judge 结果）不入 git，可 `npm run scan` 复现。
- **历史杭州切换回退**：2026-10-30 曾将 Cloudflare 主域与 `www` 的代理 A 记录改回 `47.84.100.47`，确认两域恢复 200，当时旧机服务、数据、证书和 cron 均保留。随后用户改选阿里云备案与 DNS，主页暂停解析；2026-10-31 默认发布改为北京，随后新加坡业务清理完成，旧回退路径已失效。
- **杭州离机备份与退役**：用户授权的本机私有目录保存 `115-migration-backup.tar.gz` 和 `nginx-generated-state.tar.gz`，权限 600、目录 700，均完成传输前后 SHA256 与压缩完整性校验。包含应用、环境文件、索引、证书、项目日志、nginx 配置、unit 及补充运行状态，可用于恢复。清理仅针对本次新增的项目目录、证书副本、专用用户、unit、nginx 与 nginx-common；不卸载既有 Node.js，不清除共享系统 journal 或原有业务历史。备份具体本机路径不写入公开仓库。
- **代码回滚**：本地 build 失败会阻断发布；同步开始后的失败不具备自动回滚，需要恢复已备份的制品或回退 DNS。索引恢复后必须重启本项目服务，避免进程继续持有旧内存索引。
- **admin token**：北京由 `maxwellii-admin-token-reset.timer` 每天 `07:00 Asia/Shanghai` 清空，再重启本项目容器。续期只修改获准的北京 `shared/.env.local`，然后 `sudo docker compose -f /srv/maxwell-homepage/current/ops/compose.yaml restart chat-api`；新加坡原 PM2 与 token reset cron 已删除，不能沿用旧机运维命令。

### 新加坡业务退役（2026-10-31）

- **授权与范围**：用户明确要求不做新备份，删除全部业务、Redis 数据、共享 TLS 副本和业务日志，保留系统、SSH 和 ECS 实例。已移除六条 PM2 进程记录、PM2 守护及自启动、唯一业务 cron、nginx 与 Redis 软件包、FRP 残留，以及核对过的业务目录、历史业务备份、配置和日志。Redis 清理前有 13 个键，持久文件随服务一起删除；没有可用于本次恢复的新备份，也未声称磁盘取证级擦除。
- **保留边界**：不清空用户主目录，不删除 SSH 配置、授权密钥或系统日志，不释放 ECS。初次业务清理保留系统服务和通用运行时；随后用户分别授权移除 CUPS、Chromium 及无依赖的图形组件和 Snap 基础镜像。Ubuntu 系统、snapd、SSH、DNS、DHCP 和时间同步保留。
- **读回验收**：新的 SSH 会话可登录，sshd PID、配置及授权密钥指纹未变；业务服务为 not-found/inactive，精确删除目标均不存在，80/443/3002/6379 不再监听。北京容器 ID、启动时间、重启次数和索引 SHA256 不变，本机及旧机访问北京公网首页均为 200，V1 为 200，管理路径为 404。未重新部署北京、调用模型或修改 DNS。
- **恢复边界**：新加坡本次业务数据及历史日志无法通过本次备份恢复。北京运行副本、代码仓库和此前杭州迁移备份仍保留，但不等于已保存全部新加坡业务数据。后续上线与回滚按北京配置和域名暂停方案执行，不恢复三个已停用子域。
- **CUPS 补充清理**：同日确认 CUPS Snap 未配置打印机、无打印任务，连接方只有 Chromium 的打印接口。按用户授权断开该接口，停用服务后执行 `snap remove --purge cups`，移除全部 CUPS 版本及数据，不创建快照；该阶段仍保留 Chromium 和其他 Snap。独立 SSH 会话读回卸载任务完成、包与数据目录不存在、631 无监听，非回环 TCP 监听仅剩 SSH 22。当时 Chromium 仍声明 `default-provider: cups`，存在重新安装打印依赖的可能，见 [Snap 官方接口说明](https://snapcraft.io/docs/reference/interfaces/cups-interface/)；随后 Chromium 已按追加授权卸载，见下项，不将卸载等同于永久禁止安装。
- **闲置组件与旧规则收尾**：用户追加授权撤掉旧端口规则、卸载 Chromium 和无用图形依赖、删除 CUPS 空目录。已删除 UFW 中 TCP 80、443、22222 至 22226 的 IPv4/IPv6 放行规则，仅保留 SSH 22 的显式放行，入站默认拒绝；本次未操作云安全组。已卸载 `chromium-browser` APT 过渡包、Chromium Snap、GNOME/GTK/Mesa 图形 Snap，以及核实无消费者的 `bare`、`core22`、`core24`、`core26` 基础镜像，保留 snapd 当前和上一版本。另逐项核对并删除已卸载组件的 18 个安装包缓存、Chromium/Mesa 空临时目录和 CUPS 空目录；未创建快照，软件可按需重装，已清除的数据不由本次备份恢复。
- **收尾验收**：Snap 卸载任务全部完成，仅剩 snapd，无快照；清除已不存在的 Mesa 挂载失败记录后，系统 failed units 为 0。新建 SSH 会话正常，sshd PID、配置与授权密钥指纹未变；非回环 TCP 监听仍仅 22。此次收尾释放约 3.5 GiB，根分区使用率从 17% 降至 9%；未操作北京环境或 DNS。

## 运维约束
- ⚠️ **SSH mux 挂死**：`~/.ssh/config` ControlMaster auto 的 mux socket 偶发挂死 → 所有走 alicloud-sg 的 ssh/rsync 无限挂起（deploy 卡 Stage 1）。修复一行 `ssh -O exit alicloud-sg`。预防：久未用先 `ssh alicloud-sg "date"` 烫连接。
- nginx 安全头：2026-10-30 实读旧机配置同样只有 HSTS，迁移保持原状，未补加 CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy。后续安全加固应单独验证页面兼容性，不把历史 changelog 当作当前已生效证据。
- `.env.local` 含 key、管理 token 与私密过滤词，部署后 chmod 600；任何真实值都不得进入跟踪文件或命令输出。
- 本地模型配置备份位于 gitignored 的 `data/config-backups/`，不随 deploy 同步；`.env.local` 也不自动同步。发布时通过 SSH 加密通道仅替换已核对的模型变量，先保存远端可恢复备份，保留生产独立的管理 token 和隐私词表。
- 新机迁移中的 `.env.local`、RAG 索引与 TLS 私钥均须明确授权后通过 SSH 传输，不能因普通代码发布已获准而默认扩大到敏感文件。源站验收使用官方 Origin CA 根证书与指定 IP，不能用 `curl -k` 掩盖 TLS 错误；切 DNS 后需通过带唯一标记的公网请求和新机日志确认真实回源。
