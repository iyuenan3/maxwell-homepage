# MEMORY — maxwell-homepage
<!-- 踩坑/失败/事故，append-only。别重复踩坑。决策→DECISIONS。 -->

## detail-init.js 多处共用 → 某路径 404 → 整页空白 · 2026-05-10
- 现象: 加 CSP 提取 inline script 后，V1 主页 / 详情页 间歇性整页空白。
- 根因: `detail-init.js` 被 V1(`/v1/`) 主页和详情页(`/p/*.html` 通过 `../` 解析到根) 共用；deploy 只复制到部分目录，缺的那层加载 404 → 脚本不执行 → IO observer 没 reveal 内容 → 空白。
- 结论/避免: deploy.sh Stage 4(V1) + Stage 5(根) 都要 rsync `detail-init.js`；加新外部 .js 时检查根/`/v1/`/`/p/` 三层引用路径，任一 404 都会让该路径页面空白。脚本加 100ms setTimeout fallback 强制 reveal。

## nginx 整 server 块覆盖 → 丢 /api/chat → POST 405 · 2026-05-11
- 现象: 加 admin 反代后，maxwellii.com 的 chat 对话整体 POST 405。
- 根因: 从仓库整个 server 块覆盖推送时，把只在服务器上、没回写仓库的 `location /api/chat` 块整段丢了；请求 fallback 到 SPA index.html（只接 GET）。
- 结论/避免: `site/nginx.conf` 是唯一权威，所有 location 必须完整存在仓库；推 nginx 前 ssh `grep -A 8 'location'` 对比本地确认无遗漏；只加 1 个 location 时可单独 ssh `sudo vi` 加，别整块覆盖。

## env NEWAPI_* 被 shell rc 污染 → embedding 拿到 HTML · 2026-05-19
- 现象: 本地 `npm run rag` 时 embedding 端返回 HTML（newapi 前端 SPA），`JSON.parse(<!doctype html>)` 报错；但 curl / node fetch 直打端点正常。
- 根因: 第一版 env 用 `NEWAPI_*`，与用户 shell rc 全局 export 的同名变量撞；`loadEnv()` 的 `!process.env[m]` 保护让 .env.local 的值被跳过 → 用了 shell 的域名版端点（而非 IP 版）→ 命中 newapi 前端。
- 结论/避免: 内部 LLM 模块 env 用模块级 prefix（`CHAT_LLM_*`），别复用外部工具官方 prefix；排查"fetch 返回错误内容"先 `env | grep <前缀>` 查 shell 污染。见 ADR-005。

## SSH ControlMaster mux socket 挂死 → deploy 卡死 · 2026-05-13
- 现象: `bash site/deploy.sh` 卡 Stage 1 不动；新发 `ssh alicloud-sg "echo ok"` 也挂着不返回；`ConnectTimeout` 不生效。
- 根因: `~/.ssh/config` ControlMaster auto 的 mux master 进程偶发挂死（网络抖动/休眠后），socket 还在但不接受新 channel；ssh client 先去复用 mux，没走 TCP 握手 → 无限挂起。
- 结论/避免: 一行修复 `ssh -O exit alicloud-sg`（socket 立即消失）。预防：久未用先 `ssh alicloud-sg "date"` 烫连接，5s 不通先 `ssh -O exit` 清掉。

## Cloudflare Browser Cache TTL 覆盖 origin max-age=0 · 2026-05-09
- 现象: nginx CSS 设 `max-age=0, must-revalidate`，但浏览器实际拿到 `max-age=14400`，CSS 改动 4h 后才生效。
- 根因: Cloudflare Browser Cache TTL 默认 4h，覆盖 origin 的 `max-age=0`。
- 结论/避免: CF 后台 Caching → Configuration → Browser Cache TTL 设 "Respect Existing Headers" 才让 origin 生效；之后 CSS 改动 `bash site/deploy.sh` + ETag 校验自动生效，不需 `?v=` cache bust。

## RAG source 黑名单 hardcode 项目名 → 项目改名后正则静默失效 → 求职 chunk 泄露 · 2026-05-28
- 现象: 本应被 P0 第 4 层「整源黑名单」挡住的某 worklog 求职项目内容，有少量 chunk 漏入 embeddings.json，可被化身检索到。
- 根因: 该求职项目在 worklog 改了名，但 build-embeddings.mjs 的 source 黑名单正则 hardcode 了旧项目名；改名后新名不再命中黑名单，又因该内容走 loadWiki 通道（非 worklog walk 的 wiki/job 前缀排除），两道防线都没拦住。
- 结论/避免: 按 source 名 hardcode 的黑名单正则，关联项目一改名就静默失效（改名是隐蔽的防线失效源）。已补新名条目堵回（具体黑名单条目按红线不列）。P0 第 4 层依赖手维护正则，是已知脆弱点，重构可考虑用 frontmatter 隐私标记替代 hardcode 名单。见 ADR-003 / ADR-011。

## 敏感词差点硬编码进公开仓 → 过滤机制本身会制造泄露 · 2026-06-05
- 现象: 为排除当前雇主内部项目，初版思路准备把雇主名、项目名和私密 slug 直接写进过滤正则与 prompt。
- 根因: 只关注运行时不泄露，忽略了仓库本身公开，硬编码过滤词等于把秘密主动发布到 GitHub。
- 结论/避免: 敏感运行时词只从 gitignore 的 `.env.local` 注入；源码只提交变量名、通用 frontmatter 标记和缺省行为。提交前扫描全部跟踪文件与 diff，不能只检查运行时输出。见 ADR-012。

## 化身把雇主经历误当骑行战绩 → 无数据时编造数字 · 2026-06-14
- 现象: 化身把任职过的单车旅游公司与个人骑行表现混在一起，生成了没有事实依据的爬坡成绩。
- 根因: RAG 中存在公司与骑行语义，但没有个人成绩数据；模型为完整回答而自行补全数字。
- 结论/避免: system prompt 明确公司经历与竞技战绩无关；骑行表现和身体数据统一固定回避，绝不估算、绝不输出数字。见 ADR-013。
