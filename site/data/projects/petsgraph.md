---
slug: petsgraph
name_en: "PetsGraph · Real-Pet Desktop Companion"
name_zh: "PetsGraph · 真实宠物桌面陪伴"
status: live
since: 2026-08-08
links:
  url: https://github.com/iyuenan3/petsgraph/releases
  source: https://github.com/iyuenan3/petsgraph
  docs: https://github.com/iyuenan3/petsgraph/tree/main/AIREADME
commands:
  - readme
  - links
  - git_log
  - decisions
  - stats
  - stack
  - notes
wiki_slug: petsgraph
stack:
  - swift
  - appkit
  - core graphics
  - github actions
  - seedance
---

## README

PetsGraph 是一个开源的 macOS 真实宠物桌面陪伴应用。它不生成通用卡通宠物，而是从真实宠物照片出发，为每只宠物建立独立的身份与动作资产，再由图状态机在桌面上组合成自然、安静、不会突然跳切的日常行为。

首个公开版本 v0.4.0 收录了 Maxwell 的猫五百，共 53 个动作片段、14 个状态节点、39 条转移边和 6866 帧素材。应用面向 Apple Silicon、macOS 14 及以上版本，离线运行，不采集遥测数据。

运行时使用 Swift、AppKit 与 Core Graphics。生成模型负责提供动作候选，脚本负责抠图、切帧和机械检查，最终身份一致性、动作自然度和闭环效果仍由人工视觉验收决定。

## NOTES

- **先把不打扰做对**：桌面陪伴的默认状态是安静睡觉。移动、互动和特效必须克制，宠物不能持续抢夺注意力。

- **图比播放列表更适合生命感**：每个动作是节点，转场是带条件的边。宠物可以根据状态切换动作，同时避免视频片段之间的硬切。

- **每只宠物都是独立资产工程**：身份参考、动作候选、验收记录和运行时素材彼此隔离，不能把一只宠物的风格结论机械复制给另一只。

- **视觉验收高于机械通过**：透明度、帧数和尺寸检查只能证明素材可运行，不能证明动作像这只宠物。公开发布前仍需要 Maxwell 对身份与动作逐项确认。
