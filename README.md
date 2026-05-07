<p align="center">
  <img src="./assets/avatar.jpg" alt="Maxwell Li" width="150" />
</p>

# Maxwell Resume

李越男 (Maxwell Li) 的简历仓库。

## 当前简历

| 文件 | 说明 |
|------|------|
| [MaxwellLi-AIProductManager.md](./MaxwellLi-AIProductManager.md) | 简历正文（Markdown） |
| [MaxwellLi-AIProductManager.html](./MaxwellLi-AIProductManager.html) | 打印 / PDF 优化版（A4 单页布局，朱砂红配色） |

**定位**：AI 产品经理 | AI 落地顾问 | Vibe Coding 全栈工程师

**已交付的生产级产品**：
- [naming.maxwellii.com](https://naming.maxwellii.com) — 海外华人取名 SaaS
- [tale.maxwellii.com](https://tale.maxwellii.com) — 多人实时共创叙事 H5

## 个人主页 — maxwellii.com

终端体设计的个人静态展示页（与简历配套）。已上线：https://maxwellii.com

| 属性 | 值 |
|------|-----|
| 源码 | `site/public/` |
| nginx 配置 | `site/nginx.conf`（生产模板） |
| 部署脚本 | `site/deploy.sh`（rsync 同步） |
| 部署架构 | Cloudflare 代理 → 47.84.100.47 origin (`singapore` SSH) → `/home/admin/maxwellii-site/` |
| SSL 证书 | 复用 `/etc/nginx/ssl/maxwellii.com.{pem,key}`（与 naming.* / tale.* 共用） |

### 本地预览

```bash
cd site/public && python3 -m http.server 8080
```

### 日常发布

```bash
bash site/deploy.sh
```

### 首次部署（一次性）

```bash
scp site/nginx.conf singapore:/tmp/maxwellii.conf
ssh singapore 'sudo mv /tmp/maxwellii.conf /etc/nginx/sites-available/maxwellii && \
               sudo ln -sf /etc/nginx/sites-available/maxwellii /etc/nginx/sites-enabled/maxwellii && \
               sudo nginx -t && sudo systemctl reload nginx && \
               mkdir -p /home/admin/maxwellii-site'
bash site/deploy.sh
```

> ⚠️ Cloudflare SSL/TLS 模式必须为 **Full** 或 **Full (strict)**，否则 nginx 80 → https 重定向 + Cloudflare Flexible 会触发无限循环。

## 版本历史

按时间倒序排列。标 ⭐ 为当前最新版（位于仓库根目录），其余归档于 `versions/`。

| 日期 | 文件 | 定位 |
|------|------|------|
| 2026-05-08 ⭐ | [.md](./MaxwellLi-AIProductManager.md) · [.html](./MaxwellLi-AIProductManager.html) | AI 产品经理 / AI 落地顾问 / Vibe Coding 全栈工程师 |
| 2026-04-10 | [.md](./versions/MaxwellLi-AIProductManager-20260410.md) · [.html](./versions/MaxwellLi-AIProductManager-20260410.html) | 技术负责人 / AI 工程化专家 / OpenClaw 实战专家 |
| 2026-03-11 | [.md](./versions/MaxwellLi-AIProductManager-20260311.md) | 技术负责人 / AI 工程化专家 / 平台产品负责人（v1.0 初版） |
| 2024-12-10 | [.pdf](./versions/MaxwellLi-ProductManager-20241210.pdf) | 产品经理（DevOps 转型）— 7 年云平台运维开发背景，Nokia 离职后投递 |
| 2024-11-15 | [.pdf](./versions/MaxwellLi-DevOpsEngineer-20241115.pdf) | DevOps 工程师 |
| 2018-05-22 | [.pdf](./versions/MaxwellLi-DevOpsEngineer-20180522.pdf) | DevOps 工程师（华为转 Nokia 之前） |

## 联系方式

- 邮箱：limaxwell93@gmail.com（首选）
- LinkedIn: [linkedin.com/in/iyuenan3](https://linkedin.com/in/iyuenan3)
- GitHub: [github.com/iyuenan3](https://github.com/iyuenan3)
- Blog: [limaxwell93.wordpress.com](https://limaxwell93.wordpress.com)

> 出于公开仓库隐私考虑，简历中的手机号已打码处理。如需联系电话，请发邮件索取。

## 导出 PDF

用任意 Markdown 编辑器（Typora / VS Code）打开当前简历的 `.md` 文件，或浏览器打开 `.html` 文件 → 打印为 PDF（A4，无页眉页脚）。

## 文件命名约定

- **根目录最新版**：`MaxwellLi-<TargetRole>.{md,html}`（不带日期，常驻）
- **versions/ 归档版**：`MaxwellLi-<TargetRole>-YYYYMMDD.{md,html,pdf}`（带归档日期）

主名格式：姓名（英文名+姓拼音驼峰 `MaxwellLi`）+ 目标岗位（驼峰，如 `AIProductManager`）。当前最新版常驻根目录无日期；某次更新后旧版归档到 `versions/` 时再加上当时的日期戳。
