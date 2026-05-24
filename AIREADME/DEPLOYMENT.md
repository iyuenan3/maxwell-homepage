# DEPLOYMENT — maxwell-homepage
<!-- 跑哪/怎么跑/共享什么。共享底座自身配置→其独立节点；key→哪都不写。 -->

## 主机 + 环境
- **Origin**：`alicloud-sg`（SSH 别名 → `admin@47.84.100.47:22`，新加坡阿里云）。sudo 免密。
- **CDN**：Cloudflare 代理 maxwellii.com（SSL/TLS 模式必须 **Full** 或 **Full (strict)**，否则 nginx 80→https 重定向 + CF Flexible 触发无限循环）。
- **静态站点**：`/home/admin/maxwellii-site/`（nginx 直接 serve）。
- **chat-api**：`/home/admin/maxwellii-chat-api/`，PM2 进程 `maxwellii-chat-api`，`next start` fork 模式，监听 `127.0.0.1:3002`，`max_memory_restart 512M`，日志 `/home/admin/logs/`。
- **nginx**：远端 `/etc/nginx/sites-available/maxwellii`（软链 sites-enabled）；本地真相源 `site/nginx.conf`。
- **SSL 证书**：`/etc/nginx/ssl/maxwellii.com.{pem,key}`，与 naming.maxwellii.com / tale.maxwellii.com 共用 SNI。

## 怎么起

### 静态站点（改 site/* 后）
```bash
bash site/deploy.sh
# build.js（V1 index + 10 详情页）→ 5 stage rsync：
#   Stage1 V2→根 / Stage2 data/→data/ / Stage3 p/→p/(--delete) / Stage4 V1→v1/ / Stage5 detail-init.js→根
```

### chat-api（改后端 / 重建索引后）
```bash
cd chat-api && bash deploy.sh
# 检查 embeddings.json 在场 → npm run build(失败即 abort) → rsync(排除 .git/.env.example/node_modules/.next/cache)
#   → ssh chmod 600 .env.local → npm install --omit=dev → pm2 reload ecosystem.config.cjs --update-env
```

### RAG 索引更新（知识源变动后，本地跑 ~30 min）
```bash
cd chat-api && npm run update      # = scan(增量 judge) + reindex(4 层 filter + chunk+embed) + deploy
cd chat-api && npm run scan:force  # 改了 judge prompt 必须全量重 judge（~50 min 全链路）
```

### nginx 配置变更（**不在 deploy.sh 流程里，必须单独推**）
```bash
cat site/nginx.conf | ssh alicloud-sg "sudo tee /etc/nginx/sites-available/maxwellii > /dev/null && sudo nginx -t && sudo systemctl reload nginx"
```
⚠️ 推 nginx 前先 `ssh alicloud-sg "grep -A 8 'location' /etc/nginx/sites-available/maxwellii"` 对比本地，确认所有 location（尤其 `/api/chat`）都在仓库版本里（曾整块覆盖丢 `/api/chat` 致 405，见 MEMORY）。

## 域名 / 入口
- `https://maxwellii.com/` → V2 化身主页 · `/v1/` → V1 · `/p/<slug>.html` → 详情页 · `/api/chat` → SSE · `/admin/logs?token=` → 日志页。
- 路由 / 缓存 / 安全头细节见 SPEC ② + 下方运维约束。

## 共享底座引用
- **LLM 上游 = newapi-proxy**（独立节点）→ 端点/证书/模型以 `../newapi-proxy/AIREADME/SPEC.md` 为权威。chat-api 经 `CHAT_LLM_BASE_URL` 接入（自签证书 → 当前 `NODE_TLS_REJECT_UNAUTHORIZED=0`；newapi 侧已迁端点 + 改 root CA，见 RELATIONS drift flag）。
- **CDN = Cloudflare**（账号级，非本仓库管理）。

## 缓存策略
- nginx：图片/字体 `expires 30d` + immutable；CSS/JS `max-age=0, must-revalidate`（ETag 校验，改了立即生效，不需 `?v=` cache bust）；`/_next/` immutable。
- Cloudflare：Browser Cache TTL 默认 4h 会覆盖 origin `max-age=0` → 需后台 Caching → Browser Cache TTL 设 "Respect Existing Headers" 才让 origin 生效。

## 备份 / 升级 / 回滚
- **embeddings.json** 不入 git（~78 MB），本地 build + rsync 是唯一分发；`embeddings.json.bak.*` 本地保留。可从 vault 全量 `npm run reindex` 重建。
- **manifest.json**（LLM judge 结果）不入 git，可 `npm run scan` 复现。
- chat-api 回滚：deploy.sh 严格 build 检查（build 失败不 rsync，服务器跑旧版）；pm2 reload 平滑。
- admin token：每天北京时间 7:00 cron（`clear-admin-token.sh`）清空，续期跑 `/admin-url` 流程（openssl rand → 改本地+服务器 .env.local → pm2 reload --update-env）。

## 运维约束
- ⚠️ **SSH mux 挂死**：`~/.ssh/config` ControlMaster auto 的 mux socket 偶发挂死 → 所有走 alicloud-sg 的 ssh/rsync 无限挂起（deploy 卡 Stage 1）。修复一行 `ssh -O exit alicloud-sg`。预防：久未用先 `ssh alicloud-sg "date"` 烫连接。
- nginx 安全头：⚠️ 当前仓库 `site/nginx.conf` **只有 HSTS**，缺 v2.2.0 应加的 4 头（CSP / X-Frame-Options / X-Content-Type-Options / Referrer-Policy）—— 可能服务器有、仓库 drift。**推 nginx 前务必核对服务器实际配置**，别用仓库版覆盖掉服务器上的安全头（见 MEMORY / DECISIONS-008）。
- `.env.local` 含 key，部署后 chmod 600；deploy.sh 已排除 `.env.example` 不覆盖服务器真实 env。
