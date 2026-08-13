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

## 火山额度耗尽时 RAG 管线继续前进 → 未审稿文件与未脱敏原文可能进入下游 · 2026-08-13
- 现象: 增量 scan 的 22 个 fresh judge 全部错误后仍进入 reindex；133 个 sanitize chunks 全部失败后日志提示保留原文，并继续调用 embedding。embedding 返回 `AccountQuotaExceeded` 后人工中止，生产部署尚未发生。
- 根因: scan 把逐文件 error 只写进 manifest，不影响进程退出码；sanitize 捕获错误后标记 `sanitized=false`，却把原始 `text` 留在 chunks 中继续执行；embedding 对确定性的账户额度错误仍进行长退避和单条 fallback。
- 结论/避免: RAG 离线构建必须 fail-closed。scan `error>0` 阻断后续；sanitize 任一失败阻断 embedding；账户额度错误立即失败。完成声明必须核对本地新产物、远端哈希、目标 PM2 和生产问答，不能以脚本进入下一阶段代替成功。见 ADR-017。

## 脱敏高并发遇到火山连接抖动 → 少量 chunk 重试耗尽导致整轮安全中止 · 2026-08-13
- 现象: 额度恢复后的重建在 sanitize 160/232 时，有 2 个 chunk 连续遇到 443 connect timeout；fail-closed 如期在 embedding 前终止，未生成或部署部分索引。
- 根因: 脱敏并发 10，单 chunk 仅 3 次短退避重试；火山直连偶发连接超时时，1.5/3 秒窗口不足以跨过抖动。
- 结论/避免: 脱敏并发降为 5，瞬时错误最多重试 5 次，退避 2/5/10/20 秒；额度错误仍立即失败。成功结果按模型、prompt 与原文内容哈希写入 gitignored 本地缓存，失败重跑只补缺口。降低并发与缓存只改变吞吐和可恢复性，不改变 fail-closed 和脱敏内容契约。

## 本地直连 Ark 反复超时，默认代理链路反而稳定 · 2026-08-13
- 现象: 清空代理后两轮 sanitize 分别在 160/232 和 10/232 因 connect timeout 安全中止；恢复终端默认代理后，232/232 全部完成，后续 294 批 embedding 仅遇到账户级限速并通过退避完成。
- 根因: 本机到 Ark 的公网直连在长任务中存在间歇性 443 建连抖动，默认代理链路在本次窗口更稳定；`no_proxy` 只适用于本地与内网，不代表外部模型端点一定应直连。
- 结论/避免: 外部模型长任务遵循“直连复现一次，失败后恢复默认代理”策略；每段成功结果立即写断点缓存。`AccountRateLimitExceeded` 可退避重试，`AccountQuotaExceeded` 必须立即失败，两者不能混为一类。

## 框架升级后真实问答 502，但静态拦截正常 · 2026-08-14
- 现象: Next.js 16.3.0 部署后，隐私静态拦截返回完整 SSE，真实 RAG 问答却返回 502；Next 进程在线，生产依赖审计为 0。
- 根因: 生产日志中 embedding 与 chat 上游同时返回 `AccountQuotaExceeded`，属于 Ark 月度额度耗尽，不是框架升级、RAG 文件或 PM2 回归；上游给出的本次重置时间为 2026-08-25 23:59:59（北京时间）。
- 结论/避免: 发布验收必须同时覆盖静态拦截与真实模型路径，前者通过不能替代后者。确定性额度错误不重试；升级套餐或换用明确获准的 Ark key 后，必须重新做 RAG 检索、DeepSeek SSE、模型元数据和隐私拦截四项回读。长期应为离线 RAG 构建与线上问答预留独立额度边界。

## 本地更换 key 后生产仍使用旧值，PM2 在线不能证明凭证生效 · 2026-08-14
- 现象: 本地 `.env.local` 已更换获准 key，但生产文件仍是旧 key；PM2 进程保持 online，无法从进程状态判断真实模型路径是否恢复。
- 根因: 本地配置变化不会自动同步到服务器，PM2 也不会自动重新读取磁盘上的 env 文件；同时，本机失活的 SSH ControlMaster 复用连接会让普通 SSH 命令卡住，干扰部署判断。
- 结论/避免: 轮换前只比较变量长度与哈希指纹，确认除目标 key 外没有配置漂移；同步后核对 600 权限并用 `pm2 reload --update-env` 重载。验收必须包含真实 RAG 问答、SSE 完成、`meta.model` 和 0 token 隐私拦截，并从生产日志白名单字段回读 RAG 命中。SSH mux 假活时先绕过复用建立新连接，不把无响应当作远端写入失败或成功。

## 修改 V1 静态履历时，双用途 home-data 会把内容同时送入 RAG · 2026-08-14
- 现象: V1 按最新简历加入当前任职摘要后，第一次 `reindex:dry` 仍把对应 resume 与 home-data chunks 列入可索引集合；静态页面尚未部署，但若继续全量重建，化身上下文会获得这些内容。
- 根因: `site/data/home-data.js` 既是 V1 / V2 静态展示数据，也是 `build-embeddings.mjs` 的 curated RAG 主源；原雇主词表没有覆盖新公开的实体，curated 源又豁免普通求职过滤。
- 结论/避免: 履历更新不能只做站点构建。发布前先跑 RAG dry-run，确认 universal 雇主过滤明确丢弃 resume / home-data 命中；同步生产词表并重载 chat-api 后，再部署静态站和执行公网 0 token 回读。静态公开与化身披露是两条独立验收链。
