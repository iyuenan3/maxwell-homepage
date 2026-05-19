#!/usr/bin/env node
/**
 * migrate-to-vault.mjs — 一次性迁移：Downloads/Backup 源 → Obsidian Vault
 *
 * 流程：
 *   manifest.json (include + review)
 *     → 去重 (D14: OneDrive 副本)
 *     → 排除 nokia/项目/* (D13)
 *     → 计算 vault 新路径（按 source_label 分发 + strip 哈希）
 *     → PDF → markdown (pdf-parse)
 *     → file-level pre-sanitize (needs_sanitize=true 跑 LLM, retry 5x, 失败跳过)
 *     → 加 frontmatter (5 字段) → 写 vault
 *   ↓
 *   复制 .obsidian/ 配置 from worklog
 *   ↓
 *   生成 vault README.md
 *   ↓
 *   更新 manifest.json：source_label 重映射 + 路径相对化 + 删 fullpath
 *
 * 详细规则见 docs/RAG-VAULT-MIGRATION.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import os from "node:os";

const DRY_RUN = process.argv.includes("--dry-run");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_API_ROOT = path.resolve(__dirname, "..");
const HOME = os.homedir();
const VAULT_ROOT = path.join(HOME, "Desktop/Claude-Project/maxwell-rag-sources");
const WORKLOG_OBSIDIAN = path.join(HOME, "Desktop/Claude-Project/worklog/.obsidian");
const MANIFEST_PATH = path.join(__dirname, "manifest.json");
const REPORT_PATH = path.join(__dirname, "migration-report.md");

// ── env ─────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(CHAT_API_ROOT, ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();
const CHAT_LLM_API_KEY = process.env.CHAT_LLM_API_KEY;
const CHAT_LLM_BASE_URL = process.env.CHAT_LLM_BASE_URL;
const SANITIZE_MODEL = "doubao-seed-2.0-pro";

// ── source label 重映射 (旧 → 新) ────────────────────
const LABEL_REMAP = {
  "notion-job": "nokia",
  "notion-pets": "pets",
  "openclaw-config": "projects/openclaw",
  // 其他保持不变
};

// 4 大类
const SOURCE_CATEGORY = {
  resume: "personal",
  "home-data": "personal",
  pets: "personal",
  "resume-archive": "personal",
  "worklog-diary": "personal",
  nokia: "work-history",
  huawei: "work-history",
  quanjing: "work-history",
  detail: "current-projects",
  wiki: "current-projects",
  worklog: "knowledge-base",
  "ai-knowledge": "knowledge-base",
  "projects/openclaw": "knowledge-base",
};

// 哪些 source 要搬到 vault（其他保持原位置）
const VAULT_SOURCES = new Set([
  "notion-job", "notion-pets", "nokia", "huawei", "quanjing",
  "resume-archive", "openclaw-config",
]);

// ── helpers ─────────────────────────────────────────
function stripNotionHash(name) {
  // Notion 文件/目录名末尾的 32 位 hex hash → 替换为末 4 位
  return name.replace(/\s+([a-f0-9]{32})/g, (_, hash) => `-${hash.slice(-4)}`);
}

function decodeUrlSafe(s) {
  // Notion 附件文件名常含 URL encoding（如 %E4%B9%94 = '乔'），逐段 decode
  try {
    return s.split("/").map((seg) => {
      try { return decodeURIComponent(seg); } catch { return seg; }
    }).join("/");
  } catch {
    return s;
  }
}

function newLabel(oldLabel) {
  return LABEL_REMAP[oldLabel] || oldLabel;
}

function category(label) {
  return SOURCE_CATEGORY[label] || "other";
}

// 计算 vault 内目标路径（相对 VAULT_ROOT）
function computeVaultRelpath(item) {
  const label = newLabel(item.source_label);
  let rel = item.relpath;

  // 1. URL decode (Notion 附件文件名常被 URL encoded)
  rel = decodeUrlSafe(rel);

  // 2. strip 哈希
  rel = stripNotionHash(rel);

  // PDF → md
  if (rel.toLowerCase().endsWith(".pdf")) {
    rel = rel.slice(0, -4) + ".md";
  }

  // 按 source 分发到子目录
  switch (item.source_label) {
    case "notion-job": {
      // 73 文件 → nokia/interview-prep/<rel>，去掉重复的「面试宝典/」前缀
      let r = rel;
      if (r.startsWith("面试宝典/")) r = r.slice("面试宝典/".length);
      return path.join("nokia/interview-prep", r);
    }
    case "nokia":
      // 去掉 OneDrive 前缀，归到 nokia/work/<topic>/<rest>
      // OneDrive paths: Nokia_OneDrive/[Documents/]?<topic>/...
      // 非 OneDrive: <中文 topic>/...
      let workRel = rel;
      if (workRel.startsWith("Nokia_OneDrive/Documents/")) {
        workRel = workRel.slice("Nokia_OneDrive/Documents/".length);
      } else if (workRel.startsWith("Nokia_OneDrive/")) {
        workRel = workRel.slice("Nokia_OneDrive/".length);
      }
      // 中文目录映射到英文（让 vault 更国际化）
      const dirMap = {
        "项目": "projects",
        "文档": "docs",
        "Notebook": "notebook",
        "OpenStack": "openstack",
        "Innovation": "innovation",
        "Kubernetes": "kubernetes",
        "Environment": "environment",
      };
      const parts = workRel.split("/");
      if (dirMap[parts[0]]) parts[0] = dirMap[parts[0]];
      // 嵌套 Notebook 也映射
      if (parts[0] === "docs" && parts[1] === "Notebook") parts[1] = "notebook";
      return path.join("nokia/work", parts.join("/"));
    case "notion-pets":
      return path.join("pets", rel);
    case "huawei":
      return path.join("huawei", path.basename(rel));
    case "quanjing":
      return path.join("quanjing", rel);
    case "resume-archive":
      return path.join("resume-archive", path.basename(rel));
    case "openclaw-config":
      return path.join("projects/openclaw", rel);
    default:
      return path.join(label, rel);
  }
}

// PDF reader (pdf-parse v2 class API)
let _PDFParseClass = null;
async function getPDFParse() {
  if (!_PDFParseClass) {
    const mod = await import("pdf-parse");
    _PDFParseClass = mod.PDFParse;
  }
  return _PDFParseClass;
}
async function readPdf(filepath) {
  try {
    const PDFParse = await getPDFParse();
    const buf = fs.readFileSync(filepath);
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    return result?.text || null;
  } catch (e) {
    return null;
  }
}

// ── sanitize (LLM) ──────────────────────────────────
const SANITIZE_PROMPT = (text) => `你是隐私脱敏助手。把下面文本中的敏感实体替换为占位符。

【替换规则】
- 第三方人名（不在 KEEP 列表）→ [姓名]
- 第三方公司名（不在 KEEP 列表）→ [公司]
- 实际金额数字（含 ¥/元/万/RMB/工资/报价/合同金额；不含百分比/比率/技术指标如 -31%）→ [金额]
- 保留：段落结构 / 标点 / 项目代号 / 技术名词 / 公开事实

【KEEP 白名单（绝对禁止脱敏，无论上下文如何，原样保留）】
本人姓名（最高优先级，凡是出现都保留）：李越男 / Li Yuenan / Li Maxwell / Maxwell / 越男 / iyuenan3 / limaxwell93
其他人名（公开人物）：Karpathy / Andrej / Ilya / Sam Altman / 张俊林
宠物名（猫狗，禁止脱敏）：小葵 / 飞流 / 乔治 / 吉吉 / 五百 / 花轮 / 红豆 / 小七 / 多多
公司名：华为 / Nokia / 全境骑行 / Anthropic / 字节跳动 / OpenAI / Cursor / 火山方舟 / Volcano Engine / Claude / DeepSeek / 字节 / 阿里 / 腾讯 / Microsoft / Google / Meta

⚠️ 关键提醒：本文件几乎所有出现的人名都是李越男本人（Maxwell 自己的笔记 / 简历 / 工作记录），默认应保留为「李越男」或「Maxwell」，**不要替换为 [姓名]**。只有明确指代第三方（如同事「张三经理」/ 客户「李四」/ 医院 vet 名）才替换。

【输入】
${text}

【输出】
直接给脱敏后的文本，不加任何解释、标注、JSON 包裹、代码块包裹。保持原段落结构与标点。`;

async function sanitizeOnce(text) {
  const res = await fetch(`${CHAT_LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAT_LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: SANITIZE_MODEL,
      temperature: 0.1,
      max_tokens: 4000,
      messages: [{ role: "user", content: SANITIZE_PROMPT(text) }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`sanitize ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  let out = json.choices?.[0]?.message?.content?.trim() || "";
  out = out.replace(/^```(?:\w+)?\n?/, "").replace(/\n?```$/, "");
  return out;
}

async function sanitizeWithRetry(text) {
  const waits = [3000, 8000, 20000, 45000, 90000];
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await sanitizeOnce(text);
    } catch (e) {
      if (attempt === 5) throw e;
      await new Promise((r) => setTimeout(r, waits[attempt - 1]));
    }
  }
}

// ── 去重逻辑 (D14) ──────────────────────────────────
function dedupOneDrive(items) {
  // group by (basename, size) — 优先保留非 OneDrive 路径
  const groups = new Map();
  for (const item of items) {
    const key = `${path.basename(item.relpath)}::${item.size}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  const keep = new Set();
  const removed = [];
  for (const [key, group] of groups) {
    if (group.length === 1) {
      keep.add(group[0].fullpath);
    } else {
      const nonOd = group.filter((g) => !g.relpath.includes("Nokia_OneDrive"));
      const winner = nonOd[0] || group[0];
      keep.add(winner.fullpath);
      for (const g of group) {
        if (g.fullpath !== winner.fullpath) {
          removed.push({ removed: g.fullpath, kept: winner.fullpath });
        }
      }
    }
  }
  return { keep, removed };
}

// ── frontmatter ─────────────────────────────────────
function buildFrontmatter(item, newLabel) {
  const tags = [category(newLabel), newLabel.replace(/\//g, "-")];
  // 加几个 topic tag (从 vault relpath 子目录推)
  const vaultRel = computeVaultRelpath(item);
  const dirParts = path.dirname(vaultRel).split("/").slice(1, 3); // 跳过 source_label 顶层
  for (const p of dirParts) {
    if (p && !tags.includes(p) && !p.includes("-")) tags.push(p);
  }

  // YAML escape: 双引号包 summary（防特殊字符）
  const sum = (item.summary || "").replace(/"/g, '\\"');
  return `---
source_label: ${newLabel}
value: ${item.value || "M"}
privacy: ${item.privacy || "Y"}
summary: "${sum}"
tags: [${tags.join(", ")}]
---

`;
}

// ── 复制 .obsidian 配置 ────────────────────────────
function copyObsidianConfig() {
  const target = path.join(VAULT_ROOT, ".obsidian");
  if (fs.existsSync(target)) {
    console.log("→ .obsidian/ already exists, skip");
    return;
  }
  if (!fs.existsSync(WORKLOG_OBSIDIAN)) {
    console.warn(`⚠️  worklog/.obsidian not found at ${WORKLOG_OBSIDIAN}, skip`);
    return;
  }
  execSync(`cp -r "${WORKLOG_OBSIDIAN}" "${target}"`);
  console.log(`✓ copied .obsidian/ from worklog`);
}

// ── 生成 vault README ─────────────────────────────
function writeVaultReadme(stats) {
  const readme = `# Maxwell RAG Sources Vault

> Maxwell 个人 AI 化身的 RAG 知识源 vault，集中归档来自 Downloads/Notion 导出 / 工作存档 / 个人简历等的真实材料。
> 文件已经 LLM pre-sanitize（人名 / 公司 / 金额脱敏），可在 Obsidian 中浏览与编辑。

**最后迁移：** ${new Date().toISOString().slice(0, 10)}
**总文件数：** ${stats.written}（OneDrive 去重 ${stats.deduped} / nokia projects exclude ${stats.excluded_projects} / sanitize 失败跳过 ${stats.sanitize_failed}）

## 目录结构

\`\`\`
.
├── nokia/                  Nokia 工作时期（2018.08-2024.04）
│   ├── interview-prep/     离职准备（DevOps/K8s/OpenStack 面试题整理）
│   └── work/               实际工作产出（OneDrive 同步去重后）
│       ├── notebook/       个人技术笔记 (含 blog)
│       ├── openstack/      OpenStack 相关
│       ├── docs/           文档汇总
│       └── innovation/     创新提案
├── pets/                   宠物档案（猫驱虫记录、健康档案等）
├── huawei/                 华为时期（2016.07-2018.07，技术文档）
├── quanjing/               全境骑行时期（2025.03-2026.04）
├── resume-archive/         个人简历归档（多版本演进）
└── projects/
    └── openclaw/           OpenClaw 平台配置
\`\`\`

## 不在此 vault 的源（保留原位置）

- \`worklog/\` — 工作日志主项目（每日更新，不搬动）
- \`worklog/diaries/\` — 日记
- \`ai-knowledge/\` — AI 知识库
- \`maxwell-homepage/site/data/\` — 主页 + 详情页数据源
- 简历当前版（仓库根 \`MaxwellLi-AIProductManager.md\`）

## Frontmatter 规范

每个文件含 5 字段：
- \`source_label\` — RAG source 标识（如 nokia / pets / projects/openclaw）
- \`value\` — H/M/L (LLM 评估的价值)
- \`privacy\` — G/Y/R (公开 / 工作敏感 / 强隐私)
- \`summary\` — 一句话类别化摘要（不含具体客户/金额）
- \`tags\` — Obsidian 用的标签（含 category + source_label + topic）

## 更新流程

新增 / 修改 vault 文件后，触发完整 RAG 重建：

\`\`\`bash
cd ~/Desktop/Claude-Project/maxwell-homepage/chat-api
npm run update     # = scan (judge 增量) + reindex + deploy (~40 min)
\`\`\`

## 不要做的事

- ❌ 不要把这个 vault commit 到 GitHub（含真实姓名 / 内部细节）
- ❌ 不要恢复 32 位 hash 文件名（已 strip 末 4 位作唯一标识）
- ❌ 不要在 frontmatter 写真实客户 / 金额（应该是类别词）
`;
  fs.writeFileSync(path.join(VAULT_ROOT, "README.md"), readme);
}

// ── main ───────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log("=== migrate-to-vault ===\n");

  // 1. load manifest, filter to vault sources & include/review
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const vaultItems = manifest.filter(
    (m) =>
      VAULT_SOURCES.has(m.source_label) &&
      (m.action === "include" || m.action === "review"),
  );
  console.log(`→ vault candidates: ${vaultItems.length} (from ${manifest.length} total)`);

  // 2. D13: exclude nokia/项目/*
  const beforeProjFilter = vaultItems.length;
  const filteredProj = vaultItems.filter(
    (m) => !(m.source_label === "nokia" && m.relpath.startsWith("项目/")),
  );
  const excludedProjects = beforeProjFilter - filteredProj.length;
  console.log(`→ D13 exclude nokia/项目/*: -${excludedProjects} (now ${filteredProj.length})`);

  // 3. D14: dedup OneDrive
  const { keep, removed } = dedupOneDrive(filteredProj);
  const dedupedItems = filteredProj.filter((m) => keep.has(m.fullpath));
  console.log(`→ D14 dedup OneDrive: -${removed.length} (now ${dedupedItems.length})`);

  // dry-run: 只输出路径映射 sample，不创建文件
  if (DRY_RUN) {
    console.log("\n=== DRY RUN: showing first 30 path mappings ===");
    const sourceCount = {};
    for (const item of dedupedItems) {
      const lab = newLabel(item.source_label);
      sourceCount[lab] = (sourceCount[lab] || 0) + 1;
    }
    console.log("\nby new source_label:");
    for (const [k, v] of Object.entries(sourceCount).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(20)} ${v}`);
    }
    console.log("\nsample paths:");
    for (const item of dedupedItems.slice(0, 30)) {
      const tgt = computeVaultRelpath(item);
      const san = item.needs_sanitize ? " 🟡san" : "";
      console.log(`  ${item.source_label} → ${newLabel(item.source_label)}${san}`);
      console.log(`    ${item.relpath}`);
      console.log(`    → ${tgt}`);
    }
    console.log(`\n(dry-run, no files written)`);
    return;
  }

  // 4. ensure VAULT_ROOT
  fs.mkdirSync(VAULT_ROOT, { recursive: true });

  // 5. copy .obsidian
  copyObsidianConfig();

  // 6. migrate each item
  const report = {
    written: [],
    skipped_sanitize: [],
    skipped_read: [],
    excluded_projects: excludedProjects,
    deduped: removed.length,
  };

  console.log(`\n=== migrating ${dedupedItems.length} files (concurrency=10) ===`);
  const CONCURRENCY = 10;
  let done = 0;

  async function processItem(item) {
    const newLab = newLabel(item.source_label);
    const vaultRel = computeVaultRelpath(item);
    const targetPath = path.join(VAULT_ROOT, vaultRel);

    // skip-existing: 已写入的文件复用（断点续传）
    if (fs.existsSync(targetPath)) {
      report.written.push({ from: item.fullpath, to: targetPath, source_label: newLab, skipped_existing: true });
      return;
    }

    let content;
    try {
      if (item.ext === ".pdf") {
        content = await readPdf(item.fullpath);
        if (!content) {
          report.skipped_read.push({ file: item.fullpath, reason: "pdf parse failed" });
          return;
        }
      } else {
        content = fs.readFileSync(item.fullpath, "utf8");
      }
    } catch (e) {
      report.skipped_read.push({ file: item.fullpath, reason: e.message.slice(0, 100) });
      return;
    }

    if (item.needs_sanitize) {
      try {
        content = await sanitizeWithRetry(content);
      } catch (e) {
        report.skipped_sanitize.push({ file: item.fullpath, reason: e.message.slice(0, 100) });
        return;
      }
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buildFrontmatter(item, newLab) + content);
    report.written.push({ from: item.fullpath, to: targetPath, source_label: newLab });
  }

  // 并发跑：N 个 worker 共消费一个 queue
  let nextIdx = 0;
  async function worker() {
    while (nextIdx < dedupedItems.length) {
      const i = nextIdx++;
      await processItem(dedupedItems[i]);
      done++;
      if (done % 5 === 0 || done === dedupedItems.length) {
        process.stdout.write(`\r  ${done}/${dedupedItems.length}  `);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  process.stdout.write("\n");

  // 7. update manifest
  // 已迁移的 vault items：改 source_label / fullpath（→ vault relpath）/ action 不变
  const writtenMap = new Map();
  for (const r of report.written) {
    writtenMap.set(r.from, r);
  }
  const failedSet = new Set([
    ...report.skipped_sanitize.map((x) => x.file),
    ...report.skipped_read.map((x) => x.file),
  ]);
  const removedFullpaths = new Set(removed.map((x) => x.removed));
  const projectsExcludedSet = new Set(
    vaultItems
      .filter((m) => m.source_label === "nokia" && m.relpath.startsWith("项目/"))
      .map((m) => m.fullpath),
  );

  const newManifest = [];
  for (const m of manifest) {
    if (writtenMap.has(m.fullpath)) {
      // 迁移成功 → 改 path 和 label
      const r = writtenMap.get(m.fullpath);
      const vaultRel = path.relative(VAULT_ROOT, r.to);
      newManifest.push({
        ...m,
        source_label: r.source_label,
        relpath: vaultRel,
        fullpath: r.to,
        original_fullpath: m.fullpath, // 留 reference
        migrated: true,
      });
    } else if (failedSet.has(m.fullpath)) {
      // 迁移失败 → 改 action 为 exclude，标 reason
      newManifest.push({
        ...m,
        action: "exclude",
        migrate_failed: true,
      });
    } else if (removedFullpaths.has(m.fullpath)) {
      newManifest.push({
        ...m,
        action: "exclude",
        dedup_removed: true,
      });
    } else if (projectsExcludedSet.has(m.fullpath)) {
      newManifest.push({
        ...m,
        action: "exclude",
        d13_projects_excluded: true,
      });
    } else {
      // 未迁移（worklog/ai-knowledge/diaries 等保留原位置的）
      newManifest.push(m);
    }
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));
  console.log(`✓ updated manifest.json (${newManifest.length} entries)`);

  // 8. write vault README
  writeVaultReadme({
    written: report.written.length,
    deduped: report.deduped,
    excluded_projects: report.excluded_projects,
    sanitize_failed: report.skipped_sanitize.length,
  });
  console.log(`✓ wrote vault README.md`);

  // 9. write migration report
  let md = `# Migration Report — ${new Date().toISOString().slice(0, 16)}\n\n`;
  md += `## 总览\n\n`;
  md += `- vault 候选: ${vaultItems.length}\n`;
  md += `- D13 exclude nokia/项目/*: -${report.excluded_projects}\n`;
  md += `- D14 dedup OneDrive: -${report.deduped}\n`;
  md += `- 实际尝试迁移: ${dedupedItems.length}\n`;
  md += `- ✅ 写入 vault: **${report.written.length}**\n`;
  md += `- 🔥 PDF 读取失败: ${report.skipped_read.length}\n`;
  md += `- 🔥 sanitize 失败 (重试 5x 仍失败): ${report.skipped_sanitize.length}\n\n`;

  if (report.skipped_sanitize.length) {
    md += `## sanitize 失败明细\n\n`;
    for (const x of report.skipped_sanitize) {
      md += `- \`${x.file}\` — ${x.reason}\n`;
    }
    md += `\n`;
  }
  if (report.skipped_read.length) {
    md += `## PDF 读取失败明细\n\n`;
    for (const x of report.skipped_read) {
      md += `- \`${x.file}\` — ${x.reason}\n`;
    }
    md += `\n`;
  }

  md += `## OneDrive 去重明细 (前 20 个)\n\n`;
  for (const r of removed.slice(0, 20)) {
    md += `- 删 \`${r.removed.split("/").slice(-3).join("/")}\` (留 \`${r.kept.split("/").slice(-3).join("/")}\`)\n`;
  }

  fs.writeFileSync(REPORT_PATH, md);
  console.log(`✓ wrote ${REPORT_PATH}`);

  console.log(`\n=== done in ${Math.round((Date.now() - t0) / 1000)}s ===`);
  console.log(`vault: ${VAULT_ROOT}`);
  console.log(`written: ${report.written.length} / failed_sanitize: ${report.skipped_sanitize.length} / failed_read: ${report.skipped_read.length}`);
}

main().catch((e) => {
  console.error("\n FATAL:", e);
  process.exit(1);
});
