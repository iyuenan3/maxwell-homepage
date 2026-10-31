# DEPLOYMENT — maxwell-homepage
<!-- 跑哪/怎么跑/共享什么。共享底座自身配置→其独立节点；key→哪都不写。 -->

## 主机 + 环境
- **当前域名状态**：2026-10-30 用户选择阿里云备案并将权威 DNS 迁入阿里云，备案期间主页域名离线。主域与 `www` 已预置北京 A 记录但保持暂停，尚未完成备案或北京域名 HTTPS 上线，见下方 DNS 与备案流程。
- **旧生产 Origin 已退役**：`alicloud-sg`（`admin@47.84.100.47`）于 2026-10-31 按用户明确授权清理全部业务和数据，不新增备份。PM2、nginx、Redis、FRP 及业务目录、日志、证书和历史业务备份已移除；保留系统、SSH 和 ECS 实例。它不再是可切回的生产源站，不能靠恢复 DNS 或运行旧发布命令恢复服务，详见退役节。
- **默认发布 Origin（域名待验收）**：2026-10-31 起为 `alicloud-bj`（`admin@39.96.12.136:22`），Ubuntu 24.04，Docker + Compose。此前域名在杭州和北京的公网 HTTP 均返回明确的 `403 Non-compliance ICP Filing`；默认发布目标改变不代表备案阻断解决或域名 HTTPS 已上线。
- **发布目录**：`/srv/maxwell-homepage/current -> releases/20261030-64a0093`。Compose 项目为 `maxwellii-homepage`，配置在 `current/ops/compose.yaml`。旧机原 `/home/admin/maxwellii-site/`、`/home/admin/maxwellii-chat-api/` 已删除。
- **北京 chat-api**：容器 `maxwellii-chat-api`，Node.js 24.14.0、Next.js 16.3.0，UID/GID 10001（专用用户 `maxwellii`），主机仅发布 `127.0.0.1:3002`，CPU 1 核、内存 768 MiB。镜像版本与摘要固定；只读容器根文件系统、禁止提权、丢弃全部 capability。应用及日志目录为可写挂载，日志位于 `/var/lib/maxwellii/chat-api-logs/`。
- **北京静态站**：容器 `maxwellii-site`，Caddy 2.11.3，只读挂载 `current/site/`。私有入口保持 `127.0.0.1:3080 -> :8080`，另发布独立公网 `0.0.0.0:18080 -> :8081`。`ops/caddy/site.Caddyfile` 保留静态路由、缓存、HSTS 和即时 SSE 反代；SSE 路径不启用 gzip。CPU 0.25 核、内存 128 MiB，非 root 用户，保留官方 Caddy 二进制所需的 `NET_BIND_SERVICE` bounding capability，见 MEMORY。
- **独立 HTTPS 验收**：`preview` profile 的 `maxwellii-preview` 仅发布 `127.0.0.1:3443`，加载 `ops/caddy/edge-homepage.caddy`，使用真实 Origin CA 证书严格校验。它不占用公网端口，不修改或 reload 现有 `edge-caddy`。
- **持久数据**：`shared/.env.local` 与 `shared/data/` 通过软链接入应用目录，归 `maxwellii` 所有。共享目录权限 700，配置与索引权限 600；配置备份位于 `shared/config-backups/`。本轮经单独授权传输，未重跑索引。
- **共享网关**：现有 Docker 外部网络 `edge` 复用但不重建，既有网关、站点、许可证、new-api 与 FRP 服务均不重启。共享网关属主见 RELATIONS，未来只追加本项目路由，不覆盖其完整配置。目前尚未接入共享网关。
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
# build 失败即中止；代码同步排除 .env*、data/、node_modules、构建缓存
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

### 旧生产 nginx 配置（仅历史恢复参考）

2026-10-31 新加坡 nginx 软件包、虚拟主机配置和证书副本已清理，不再执行旧推送命令。`site/nginx.conf` 仍保留历史根目录与路由契约，不能用于北京。未来若获准重建旧环境，须先重新准备服务、目录、凭证与证书，再核对所有 location（尤其 `/api/chat`）和安全头，配置校验通过后才能启用；这不是现有生产回滚路径。

### 北京公网切换前置条件

先完成备案并解决接入阻断，再为主域和 `www` 配置浏览器公有可信证书。`edge-homepage.caddy` 当前引用 Origin CA，不能直接照搬到无 Cloudflare 代理的公网入口。单独备份共享网关配置，按属主文档追加本项目路由，校验后仅 reload 网关，不重建已有容器。原配置为单文件挂载，写入与回滚必须保留 inode，不能直接用原子替换假设容器已读取新文件。先指定目标 IP 完成携带域名的公网严格 TLS、页面与真实对话验收，同时确认已有入口不变，再启用已暂停的两条 A 记录。失败时恢复北京已验收配置或暂停解析，不能再切回已清理的新加坡机。当前尚未执行网关接入或域名 HTTPS 上线。

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
- 北京独立公网入口：`http://39.96.12.136:18080/`，公开页面与对话可用，管理日志页与 Next 内部资源在此入口统一 404；现有 80/443/8888 和域名入口不变。
- 北京私有预览：本机运行 `ssh -N -L 13080:127.0.0.1:3080 alicloud-bj` 后访问 `http://127.0.0.1:13080/`。传输经 SSH 加密，不要求安装 Origin CA；不要把 3080、3443 或 3002 直接暴露公网。
- 路由 / 缓存 / 安全头细节见 SPEC ② + 下方运维约束。

## 共享底座引用
- **文本 LLM = 百炼 Qwen（直连）**：`CHAT_LLM_BASE_URL=https://coding.dashscope.aliyuncs.com/v1`，`CHAT_LLM_MODEL` / `RAG_JUDGE_MODEL` / `RAG_SANITIZE_MODEL` 当前均为 `qwen3.7-plus`，共享 `CHAT_LLM_API_KEY`。本次按用户指定使用 Coding Plan；[官方用途限制](https://help.aliyun.com/zh/model-studio/coding-plan-faq) 将其定位于交互式编程工具，网站后端与自动化脚本不在允许用途内，长期运行应换成通用按量 API。通用 API 可以通过同一变量改用账号对应的业务空间端点，无需 new-api 或关闭 TLS 校验。
- **Embedding 暂留 Ark**：`EMBED_LLM_BASE_URL` / `EMBED_LLM_API_KEY` 保存迁移前的向量端点和凭证，与 Qwen 完全分离。火山不可用时，查询最长等待 5 秒后使用空 context 对话；模型和 `embeddings.json` 本次不变。
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
- **保留边界**：不清空用户主目录，不删除 SSH 配置、授权密钥、系统日志、系统服务或通用运行时，不释放 ECS。保留原有 CUPS 系统服务，其 631 端口仍监听；不能将“业务清理完成”描述为“只剩 SSH 端口”。
- **读回验收**：新的 SSH 会话可登录，sshd PID、配置及授权密钥指纹未变；业务服务为 not-found/inactive，精确删除目标均不存在，80/443/3002/6379 不再监听。北京容器 ID、启动时间、重启次数和索引 SHA256 不变，本机及旧机访问北京公网首页均为 200，V1 为 200，管理路径为 404。未重新部署北京、调用模型或修改 DNS。
- **恢复边界**：新加坡本次业务数据及历史日志无法通过本次备份恢复。北京运行副本、代码仓库和此前杭州迁移备份仍保留，但不等于已保存全部新加坡业务数据。后续上线与回滚按北京配置和域名暂停方案执行，不恢复三个已停用子域。

## 运维约束
- ⚠️ **SSH mux 挂死**：`~/.ssh/config` ControlMaster auto 的 mux socket 偶发挂死 → 所有走 alicloud-sg 的 ssh/rsync 无限挂起（deploy 卡 Stage 1）。修复一行 `ssh -O exit alicloud-sg`。预防：久未用先 `ssh alicloud-sg "date"` 烫连接。
- nginx 安全头：2026-10-30 实读旧机配置同样只有 HSTS，迁移保持原状，未补加 CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy。后续安全加固应单独验证页面兼容性，不把历史 changelog 当作当前已生效证据。
- `.env.local` 含 key、管理 token 与私密过滤词，部署后 chmod 600；任何真实值都不得进入跟踪文件或命令输出。
- 本地模型配置备份位于 gitignored 的 `data/config-backups/`，不随 deploy 同步；`.env.local` 也不自动同步。发布时通过 SSH 加密通道仅替换已核对的模型变量，先保存远端可恢复备份，保留生产独立的管理 token 和隐私词表。
- 新机迁移中的 `.env.local`、RAG 索引与 TLS 私钥均须明确授权后通过 SSH 传输，不能因普通代码发布已获准而默认扩大到敏感文件。源站验收使用官方 Origin CA 根证书与指定 IP，不能用 `curl -k` 掩盖 TLS 错误；切 DNS 后需通过带唯一标记的公网请求和新机日志确认真实回源。
