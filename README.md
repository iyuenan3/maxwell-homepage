<p align="center">
  <img src="./assets/avatar.jpg" alt="Maxwell Li" width="150" />
</p>

# Maxwell-Homepage

李越男 (Maxwell Li) 的个人主页仓库 — **maxwellii.com 终端体网站源码 + AI 化身对话后端 (chat-api)**。

[![version](https://img.shields.io/badge/version-2.9.0-1a5276)](./AIREADME/CHANGELOG.md) [![site](https://img.shields.io/badge/site-maxwellii.com-c0392b)](https://maxwellii.com)

> 5/9 由 `Maxwell-Resume` 改名为 `maxwell-homepage`：从「简历仓库」扩展到「个人主页 + AI 化身」。GitHub 自动 redirect 旧 URL，外链不会 404。简历归档 2026-05-26 迁至 Maxwell 私有知识库统一管理（本仓库不再存简历文件）。
>
> **工程文档（架构 / 部署 / 决策 / 接口契约 / 版本史）见 [`AIREADME/`](./AIREADME/)** —— 本仓库的 AI 原生真相源。变更日志见 [`AIREADME/CHANGELOG.md`](./AIREADME/CHANGELOG.md)。

## 个人主页 — maxwellii.com

终端体设计的个人静态站点（已上线 https://maxwellii.com）：bash 隐喻 + CRT 扫描线 + 朱砂方印 + 等宽/衬线中文字体。主页 `ls -lah projects/` 列出 9 个项目（含本仓库自身），每行点进对应详情页（终端 `cat README.md` 风格 + 中英双 H1）。两种模式：**V1 简介**（`/v1/`）与 **V2 化身对话**（主域 `/`，右下角 chat 框接 AI 版 Maxwell）。

| 属性 | 值 |
|------|-----|
| 主域 | https://maxwellii.com |
| 子站点 | naming.maxwellii.com（取名 SaaS）/ tale.maxwellii.com（多人小说 H5）|
| 源码 | `site/public/`（V1）· `site/v2-redesign/`（V2）· `site/data/projects/<slug>.md`（详情页数据）|
| 构建 | `site/build.js`（纯 Node 零依赖）→ `bash site/deploy.sh` 发版 |

> 部署架构 / nginx / CDN 缓存 / 构建管线等工程细节见 [`AIREADME/DEPLOYMENT.md`](./AIREADME/DEPLOYMENT.md) + [`AIREADME/ARCHITECTURE.md`](./AIREADME/ARCHITECTURE.md)。

### 9 项目

| URL slug | 中文双名 | 状态 |
|---|---|---|
| eastern-wisdom | 东方智慧 · 海外华人取名 SaaS | ● live |
| multiplayer-xiaoshuo | 多人小说 · 多人互动小说 H5 | ● live |
| maxwell-homepage | worklog × maxwellii.com · 个人知识系统 | ● live |
| claude-financial-research | 智投研 · A 股权益研究系统 | ◐ active |
| short-story | 短篇小说 · 番茄平台商业短篇 | ◐ active |
| openclaw | OpenClaw · AI 助理平台 | ◐ active |
| petslog | PetsLog · 宠物健康伴侣 | ◐ active |
| xhs-agency | 小红书自运营系统 | ◐ active |
| k8s-om | k8s-om · K8s 多租户运维工具集 | ✕ archived |

## AI 化身对话 — chat-api

maxwellii.com 主页右下角对话框背后运行的 LLM 化身后端。访客直接问关于 Maxwell 的任何事（背景 / 项目 / 技术栈 / 经历 / 宠物），AI 基于 RAG 检索本地知识库回答。**架构层面只读本地文件**，不抓博客 / 不收用户输入入库；含 RAG 检索 + 隐私防御 + SSE 流式 + 限流的完整工程。

> 模型 / RAG 管线 / 隐私防御 / API 契约见 [`AIREADME/ARCHITECTURE.md`](./AIREADME/ARCHITECTURE.md) + [`AIREADME/SPEC.md`](./AIREADME/SPEC.md)。

## 简历

简历正文与多版本归档 2026-05-26 起统一维护在 Maxwell 的私有知识库（不在本公开仓库）。获取方式：

- **直接问 AI 版 Maxwell** —— maxwellii.com 右下角对话框（化身基于简历 + 项目档案回答）
- LinkedIn / 邮件索取完整简历

**当前定位**：AI 产品经理 | FDE 工程师 | Vibe Coding 全栈工程师

**已交付的生产级产品**：
- [naming.maxwellii.com](https://naming.maxwellii.com) — 海外华人取名 SaaS
- [tale.maxwellii.com](https://tale.maxwellii.com) — 多人实时共创叙事 H5

## 联系方式

- 邮箱：limaxwell93@gmail.com（首选）
- LinkedIn: [linkedin.com/in/iyuenan3](https://linkedin.com/in/iyuenan3)
- GitHub: [github.com/iyuenan3](https://github.com/iyuenan3)
- Blog: [limaxwell93.wordpress.com](https://limaxwell93.wordpress.com)

> 出于公开仓库隐私考虑，简历中的手机号已打码处理。如需联系电话请发邮件索取。
