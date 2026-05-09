<p align="center">
  <img src="./assets/avatar.jpg" alt="Maxwell Li" width="150" />
</p>

# Maxwell-Homepage

李越男 (Maxwell Li) 的个人主页仓库 — **maxwellii.com 终端体网站源码 + 简历多版本归档**。

> 5/9 由 `Maxwell-Resume` 改名为 `maxwell-homepage`：项目职责从「简历仓库」扩展为「个人主页 + 简历归档」，简历是其中一个子模块。GitHub 自动 redirect 旧 URL，外链不会 404。

## 个人主页 — maxwellii.com

终端体设计的个人静态站点（**已上线 https://maxwellii.com**）。bash 隐喻 + CRT 扫描线 + 朱砂方印 + JetBrains Mono / Noto Serif SC。

主页 `ls -lah projects/` 列出 10 项（含本仓库自身），每行点进对应详情页（终端 `cat README.md` 风格 + 中英双 H1）。

| 属性 | 值 |
|------|-----|
| 主域 | https://maxwellii.com |
| 子站点 | naming.maxwellii.com（取名 SaaS）/ tale.maxwellii.com（多人小说 H5） |
| 源码 | `site/public/`（index.html / styles.css / avatar.jpg / p/<slug>.html × 10） |
| 数据 | `site/data/projects/<slug>.md × 10`（YAML frontmatter + body） |
| 模板 | `site/templates/_base.html`（终端壳骨架） |
| 构建 | `site/build.js`（纯 Node 零依赖） |
| 部署脚本 | `site/deploy.sh`（rsync 到 alicloud-sg） |
| nginx 配置 | `site/nginx.conf`（生产模板，远端为 sites-available/maxwellii） |
| 部署架构 | Cloudflare 代理 → 47.84.100.47 origin (`alicloud-sg` SSH) → `/home/admin/maxwellii-site/` |
| SSL 证书 | 复用 `*.maxwellii.com.{pem,key}`（与 naming.* / tale.* 共用 SNI） |

### 项目命名规范 v2（5/9 落地）

`site/data/projects/<slug>.md` frontmatter 必含 4 件套：

```yaml
slug: <kebab-case>           # URL + 内部代号
name_en: "Brand · Positioning"   # 对外英文双名
name_zh: "品牌 · 定位"            # 对外中文双名
wiki_slug: <slug or empty>   # 关联 worklog wiki/projects/<wiki_slug>.md
```

主页 ls 三层 stacked 显示：slug（cyan）/ name_en `|` name_zh（amber）/ description（接近白）。详情页 page-header 是终端 `$ cat <slug>/README.md` + 中英双 H1（中文为主 / 英文副标）。

### 10 项 mapping

| URL slug | 中文双名 | 状态 |
|---|---|---|
| eastern-wisdom | 东方智慧 · 海外华人取名 SaaS | ● live |
| multiplayer-xiaoshuo | 多人小说 · 多人互动小说 H5 | ● live |
| maxwell-homepage | maxwellii.com · 终端体个人主页 | ● live |
| worklog | 工作日志 · AI 自动日记 + LLM Wiki 知识库 | ◐ active |
| ai-knowledge | AI 知识库 · 开源项目研究图谱 | ◐ active |
| openclaw | OpenClaw · AI 助理平台 | ◐ active |
| claude-financial-research | 智投研 · A 股权益研究系统 | ◐ active |
| petslog | PetsLog · 宠物健康伴侣 | ◐ active |
| k8s-om | k8s-om · K8s 多租户运维工具集 | ✕ archived |
| xhs-5agent-pipeline | 小红书 Agency · 多 Agent 全自动账号运营 | ✕ archived |

### 本地预览

```bash
cd site/public && python3 -m http.server 8080
```

### 日常发布

```bash
bash site/deploy.sh
# = node site/build.js（生成 10 个详情页）+ rsync site/public/ → alicloud-sg:/home/admin/maxwellii-site/
```

### nginx 配置变更（不在 deploy.sh 流程里）

```bash
cat site/nginx.conf | ssh alicloud-sg "sudo tee /etc/nginx/sites-available/maxwellii > /dev/null && sudo nginx -t && sudo systemctl reload nginx"
```

### 缓存策略（5/9 改造）

- **图片 / 字体**：`expires 30d` + `immutable`（极少变）
- **CSS / JS**：`max-age=0, must-revalidate`（每次校验 ETag，CSS 改了立即生效）
- **历史 URL** 自动 301 redirect（项目改名 / 合并兜底）

### Cloudflare 关键配置

> SSL/TLS 模式必须为 **Full** 或 **Full (strict)**，否则 nginx 80 → https 重定向 + Cloudflare Flexible 会触发无限循环。
>
> Browser Cache TTL 默认 4h（覆盖 origin `max-age=0`）。要让 origin 真正生效：Caching → Configuration → Browser Cache TTL 设 "Respect Existing Headers"。

## 简历归档（子模块）

当前最新版常驻仓库根目录：

| 文件 | 说明 |
|------|------|
| [MaxwellLi-AIProductManager.md](./MaxwellLi-AIProductManager.md) | 简历正文（Markdown） |
| [MaxwellLi-AIProductManager.html](./MaxwellLi-AIProductManager.html) | 打印 / PDF 优化版（A4 朱砂红配色） |

**当前定位**：AI 产品经理 | AI 落地顾问 | Vibe Coding 全栈工程师

**已交付的生产级产品**：
- [naming.maxwellii.com](https://naming.maxwellii.com) — 海外华人取名 SaaS
- [tale.maxwellii.com](https://tale.maxwellii.com) — 多人实时共创叙事 H5

### 版本历史

按时间倒序排列。标 ⭐ 为当前最新版（仓库根目录，不带日期）；其余归档于 `versions/`。

| 日期 | 文件 | 定位 |
|------|------|------|
| 2026-05-08 ⭐ | [.md](./MaxwellLi-AIProductManager.md) · [.html](./MaxwellLi-AIProductManager.html) | AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师 |
| 2026-04-10 | [.md](./versions/MaxwellLi-AIProductManager-20260410.md) · [.html](./versions/MaxwellLi-AIProductManager-20260410.html) | 技术负责人 / AI 工程化专家 / OpenClaw 实战专家 |
| 2026-03-11 | [.md](./versions/MaxwellLi-AIProductManager-20260311.md) | 技术负责人 / AI 工程化专家 / 平台产品负责人（v1.0 初版） |
| 2024-12-10 | [.pdf](./versions/MaxwellLi-ProductManager-20241210.pdf) | 产品经理（DevOps 转型）— 7 年云平台运维开发背景，Nokia 离职后投递 |
| 2024-11-15 | [.pdf](./versions/MaxwellLi-DevOpsEngineer-20241115.pdf) | DevOps 工程师 |
| 2018-05-22 | [.pdf](./versions/MaxwellLi-DevOpsEngineer-20180522.pdf) | DevOps 工程师（华为转 Nokia 之前） |

### 文件命名约定

- **根目录最新版**：`MaxwellLi-<TargetRole>.{md,html}`（不带日期，常驻）
- **versions/ 归档版**：`MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}`（带归档日期）

主名格式：姓名（英文名 + 姓拼音驼峰 `MaxwellLi`）+ 目标岗位（驼峰 `AIProductManager`）。当前最新版常驻根目录无日期；某次更新后旧版归档到 `versions/` 时再加上当时的日期戳。

### 导出 PDF

用 Markdown 编辑器（Typora / VS Code）打开 `.md` 文件，或浏览器打开 `.html` 文件 → 打印为 PDF（A4，无页眉页脚）。

## 联系方式

- 邮箱：limaxwell93@gmail.com（首选）
- LinkedIn: [linkedin.com/in/iyuenan3](https://linkedin.com/in/iyuenan3)
- GitHub: [github.com/iyuenan3](https://github.com/iyuenan3)
- Blog: [limaxwell93.wordpress.com](https://limaxwell93.wordpress.com)

> 出于公开仓库隐私考虑，简历中的手机号已打码处理。如需联系电话请发邮件索取。
