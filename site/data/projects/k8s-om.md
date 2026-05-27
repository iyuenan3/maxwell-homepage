---
slug: k8s-om
name_en: "k8s-om · Multi-Tenant K8s Toolkit"
name_zh: "k8s-om · K8s 多租户运维工具集"
status: archived
since: 2024-04-15
links:
  url: ""
  source: https://github.com/iyuenan3/k8s-om
  docs: ""
commands:
  - readme
  - links
wiki_slug: ""
stack:
  - ansible
  - helm 3
  - python
  - kubernetes
---

## README

Nokia RAN（无线接入网络）容器化平台运维工具集，支撑 vCU/vDU 自动化部署期间的 K8s 日常运维，已开源。核心功能：多租户批量创建、租户权限配置（RBAC）、资源用量配置（ResourceQuota）的 Ansible Playbooks + Helm 3 一键部署 vCU/vDU 环境 + Python 封装常用运维命令。

背景：Maxwell 在 Nokia 任 DevOps Engineer（2018.08-2024.04）规划设计搭建维护 OpenStack + Kubernetes 平台。同期与 RedHat 合作测试商用 K8s 平台，解决 11 个关键问题，Python + Robot Framework 自动化测试覆盖 100%，申请通过 9 项 Nokia Innovation Idea。配套工具 Kuashaw 负责 vCU/vDU 部署参数简化。

## NOTES

- **多租户批量管理的工程价值：** 每个测试团队/环境对应一个 K8s 租户，手动创建租户/配 RBAC/设 ResourceQuota 是高频重复操作，出错率高且无法审计。Ansible Playbooks 幂等化让操作可重复、可回溯，新人有标准入口而非靠老人口传。**减少人工错误比提升执行速度更重要**，这是运维工具设计的核心取舍。

- **Helm 3 vs 自写部署脚本：** vCU/vDU 是电信级软件，版本依赖复杂，环境间差异大。Helm 3 Chart 打包让环境可一键重建、版本可回滚，而自写脚本在版本迭代时迅速腐化。**选 Helm 3 是可维护性优先于灵活性**，对长期维护的基础设施，标准化工具的约束是优点而非缺点。
