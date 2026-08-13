#!/usr/bin/env node
/**
 * scan-sources.mjs — Phase 1: 扫描 8 大数据源，输出 manifest 供 Maxwell 审稿
 *
 * 流程：
 *   walk → (skip 二进制/代码/excludeDirs) → readContent (md/pdf) → regex 隐私扫
 *   → doubao-pro file-level judge → 自动决策 → 输出 manifest.json + report.md
 *
 * 增量：mtime 没变就复用上次 LLM 结果（manifest.json 持久化）
 *
 * 用法：
 *   cd chat-api && node scripts/scan-sources.mjs              # 增量
 *   cd chat-api && node scripts/scan-sources.mjs --force      # 全部重 judge
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_API_ROOT = path.resolve(__dirname, "..");

// ── ENV ─────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(CHAT_API_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.local not found at ${envPath}`);
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const CHAT_LLM_API_KEY = process.env.CHAT_LLM_API_KEY;
const CHAT_LLM_BASE_URL = process.env.CHAT_LLM_BASE_URL;
const JUDGE_MODEL = "doubao-seed-2.0-pro";
const FORCE = process.argv.includes("--force");
const ONLY_SOURCE = process.argv
  .find((a) => a.startsWith("--source="))
  ?.split("=")[1];

if (!CHAT_LLM_API_KEY || !CHAT_LLM_BASE_URL) {
  throw new Error("CHAT_LLM_API_KEY / CHAT_LLM_BASE_URL missing in .env.local");
}

// ── 数据源配置（migration v3 后：vault 内 + 不搬的本地源）───
const HOME = os.homedir();
const VAULT_ROOT = path.join(HOME, "Desktop/Projects/maxwell-rag-sources");

const SOURCES = [
  // ── vault 内的源（已 pre-sanitize，全 .md）──
  { label: "nokia",             path: path.join(VAULT_ROOT, "nokia"),             extensions: [".md"] },
  { label: "pets",              path: path.join(VAULT_ROOT, "pets"),              extensions: [".md"] },
  { label: "huawei",            path: path.join(VAULT_ROOT, "huawei"),            extensions: [".md"] },
  { label: "quanjing",          path: path.join(VAULT_ROOT, "quanjing"),          extensions: [".md"] },
  { label: "resume-archive",    path: path.join(VAULT_ROOT, "resume-archive"),    extensions: [".md"] },
  { label: "projects/openclaw", path: path.join(VAULT_ROOT, "projects/openclaw"), extensions: [".md"] },
  { label: "hdu",               path: path.join(VAULT_ROOT, "hdu"),               extensions: [".md"] },

  // ── 不搬的源（保持原位置，每天可能更新）──
  // P0 隐私边界：diaries 整源排除（每日日记含面试 + 私人反思，访客不该看）
  // P0 隐私边界：worklog/wiki/job/ 整目录排除（公司情报档案 / 面试录音 / 求职文案 / 谈薪）
  {
    label: "worklog",
    path: path.join(HOME, "Desktop/Projects/worklog"),
    extensions: [".md"],
    excludeRelpaths: ["diaries", "wiki/job"],
  },
  // ai-knowledge: 2026-05-26 项目已归档，移出 RAG 源（不再索引）。
  // build-embeddings.mjs / rag.ts 里残留的 "ai-knowledge" category 映射是无害死键，下次重构再清。
];

// ── 隐私 regex（a 层兜底） ──────────────────────────────
const PRIVACY_PATTERNS = [
  { name: "phone", re: /(?<![0-9])(1[3-9]\d{9})(?![0-9])/g },
  { name: "id_card", re: /\b\d{17}[\dXx]\b/g },
  { name: "api_key_sk", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "api_key_ark", re: /\bark-[A-Za-z0-9-]{30,}\b/g },
  { name: "bank_card", re: /(?<![0-9])\d{16,19}(?![0-9])/g },
];

function regexScan(text) {
  const hits = {};
  for (const { name, re } of PRIVACY_PATTERNS) {
    const matches = text.match(re);
    if (matches?.length) hits[name] = matches.length;
  }
  return hits;
}

// ── PDF 转文本（pdf-parse v2: class-based API） ─────────
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
  } catch {
    return null; // 让上层标 error
  }
}

// ── frontmatter 私有判定（P0：雇主机密/私有 wiki 页整源排除）──────
// visibility:private / rag_exclude:true 的 md 文件根本不进 manifest，
// 不经 LLM judge（不依赖 judge 判对）。通用机制，未来同类项目零改动。
// 如雇主内部平台项目的私有 wiki 页（worklog/wiki/projects/ 下，机密）。
function isMdFrontmatterPrivate(fullpath) {
  let head;
  try {
    const fd = fs.openSync(fullpath, "r");
    const buf = Buffer.alloc(1024);
    const n = fs.readSync(fd, buf, 0, 1024, 0);
    fs.closeSync(fd);
    head = buf.toString("utf8", 0, n);
  } catch {
    return false;
  }
  if (!head.startsWith("---")) return false;
  const end = head.indexOf("\n---", 3);
  const fm = end === -1 ? head : head.slice(0, end);
  return /^\s*visibility:\s*["']?private["']?\s*$/im.test(fm) ||
    /^\s*rag_exclude:\s*["']?true["']?\s*$/im.test(fm);
}

// ── 文件遍历 ────────────────────────────────────────────
function walkSource(source) {
  const out = [];
  const root = source.path;
  if (!fs.existsSync(root)) {
    console.warn(`  [skip] source not found: ${root}`);
    return out;
  }
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      // skip dotfiles / node_modules
      if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
      const fullpath = path.join(dir, ent.name);
      const relpath = path.relative(root, fullpath);
      if (
        source.excludeRelpaths?.some(
          (ex) => relpath === ex || relpath.startsWith(ex + path.sep),
        )
      )
        continue;
      if (ent.isDirectory()) {
        stack.push(fullpath);
        continue;
      }
      const ext = path.extname(ent.name).toLowerCase();
      if (!source.extensions.includes(ext)) continue;
      // P0：frontmatter 标私有的 md 直接跳过，不进 manifest（雇主机密/私有页）
      if (ext === ".md" && isMdFrontmatterPrivate(fullpath)) {
        console.log(`  [private] skip (frontmatter): ${relpath}`);
        continue;
      }
      let stat;
      try {
        stat = fs.statSync(fullpath);
      } catch {
        continue;
      }
      out.push({
        fullpath,
        relpath,
        ext,
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    }
  }
  return out;
}

// ── LLM judge prompt ────────────────────────────────────
function buildJudgePrompt(filepath, parent_dir, preview) {
  return `你是 Maxwell 个人 AI 化身知识库的审稿员。看下面文件预览，判断是否入库。

文件路径: ${filepath}
父目录: ${parent_dir}
内容预览（head 1000 字 + tail 500 字）:
---
${preview}
---

【判断标准】

V (value 价值):
  H 高: Maxwell 真实的方法论 / 决策过程 / 思考反思 / 项目复盘 / 独特经历 / 个人观点 / 学习心得 / AMA / self-portrait
  M 中: 含信息但通用 (流程文档 / 范式总结 / 转载但加了 Maxwell 注释)
  L 低: 纯代码 / 纯配置 / 例会纪要 / 模板 / 自动生成 / 全篇转载他人

P (privacy 隐私):
  G 公开: 简历对外内容 / 已发博客 / GitHub README / 项目对外口径 / 主页 facts
  Y 工作敏感: 公司内部细节 / 项目代号 / 内部流程 / 同事职位（可入但脱敏）
  R 强隐私: 手机号 / 身份证 / 密码 / API key / 银行卡 / 私人情绪宣泄 / 第三方未公开评价 / 不该流出的内部 wiki / **面试经历 / 求职活动 / HR 面 / CEO 面 / 面试录音转写 / 第三方公司内部情报分析 / 谈薪策略 / Offer 协商 / BOSS 招呼语 / 面试自我介绍模板**

⚠️ P0 红线：**含任何求职 / 面试 / 第三方公司内部分析内容 → 强制 P=R + value=L（即使方法论价值高，也判 L 让 decideAction → exclude）**。访客是潜在雇主 / 客户，泄露代价巨大。

needs_sanitize (脱敏标志):
  true: 文件含 (a) 实际金额数字（¥/元/万/RMB/工资/报价/合同金额，不含百分比/比率） 或 (b) 第三方人名（除 Maxwell / 李越男 / 公开人物 Karpathy / Andrej / Ilya / Sam Altman / 张俊林） 或 (c) 第三方公司名（除白名单：华为 / Nokia / 全境骑行 / Anthropic / 字节跳动 / OpenAI / Cursor / 火山方舟 / Volcano Engine / Claude / DeepSeek）
  false: 无任何上述类别 或 全部为公开实体

【输出要求】
严格输出 JSON 一行，不要 markdown / 不要解释 / 不要代码块包裹:
{"value":"H|M|L","privacy":"G|Y|R","lang":"zh|en|mixed","summary":"<60字内 specific 摘要>","needs_sanitize":true|false}

summary 写作要求（重要，避免敏感信息泄漏）：
- 要 **specific 描述文件主题**，但**不写具体人名 / 公司名 / 客户名 / 金额 / 项目代号**
- 用类别词替代：「某客户」/「某医院」/「某项目」/「[金额]」/「内部代号 X」
- 例：
  - ✅ "Q2 RICE 漏斗复盘 + 5 个决策日记 + FinOps -31%"
  - ❌ "全境骑行 Q2 RICE + 张总会议 + 5 万合同"
  - ✅ "宠物过敏检测记录"
  - ❌ "中农 XX 实验室乔治过敏报告"`;
}

async function llmJudge(filepath, parent_dir, content) {
  const head = content.slice(0, 1000);
  const tail = content.length > 1500 ? content.slice(-500) : "";
  const preview = tail
    ? `${head}\n\n[... 中间省略 ${content.length - 1500} 字 ...]\n\n${tail}`
    : head;
  const prompt = buildJudgePrompt(filepath, parent_dir, preview);

  const res = await fetch(`${CHAT_LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAT_LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      temperature: 0.1, // 判断要稳定
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`judge ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  let text = json.choices?.[0]?.message?.content?.trim() || "";
  text = text
    .replace(/^```(?:json)?\n?/i, "")
    .replace(/\n?```$/, "")
    .trim();
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[^{}]+\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error(`unparseable: ${text.slice(0, 200)}`);
  }
}

async function llmJudgeWithRetry(filepath, parent_dir, content) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await llmJudge(filepath, parent_dir, content);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

// ── 自动决策 ────────────────────────────────────────────
function decideAction(value, privacy, privacy_hits) {
  const hitCount = Object.values(privacy_hits || {}).reduce((a, b) => a + b, 0);
  if (hitCount >= 3) return "review";
  if (value === "L") return "exclude";
  if (value === "H") {
    if (privacy === "R") return "review";
    return "include";
  }
  if (value === "M") {
    if (privacy === "G") return "include";
    if (privacy === "Y") return "review";
    return "exclude";
  }
  return "review";
}

// ── 增量 ────────────────────────────────────────────────
function loadCachedManifest() {
  const p = path.join(__dirname, "manifest.json");
  if (!fs.existsSync(p)) return new Map();
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map();
  for (const item of arr) map.set(item.fullpath, item);
  return map;
}

// ── 并发控制 ────────────────────────────────────────────
async function runConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;

  async function loop() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await worker(items[i], i);
      } catch (e) {
        results[i] = { ...items[i], action: "error", error: e.message };
      }
      done++;
      if (done % 5 === 0 || done === items.length) {
        process.stdout.write(`\r  ${done}/${items.length}  `);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => loop());
  await Promise.all(workers);
  process.stdout.write("\n");
  return results;
}

// ── 报告生成 ────────────────────────────────────────────
function renderReport(manifest) {
  const bySource = {};
  for (const item of manifest) {
    bySource[item.source_label] ??= [];
    bySource[item.source_label].push(item);
  }

  const stat = { include: 0, review: 0, exclude: 0, error: 0 };
  for (const m of manifest) stat[m.action] = (stat[m.action] || 0) + 1;
  const sanCount = manifest.filter((m) => m.needs_sanitize).length;

  let md = `# Manifest Report — ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n`;
  md += `## 总览\n\n`;
  md += `- 总文件: **${manifest.length}**\n`;
  md += `- ✅ include: **${stat.include}**\n`;
  md += `- ⚠️ review (要 Maxwell 审): **${stat.review}**\n`;
  md += `- ❌ exclude: **${stat.exclude}**\n`;
  md += `- 🔥 error: **${stat.error || 0}**\n`;
  md += `- 🟡 needs_sanitize: **${sanCount}**\n\n`;
  md += `> **审稿方法**：编辑 \`scripts/manifest.json\` 改 \`action\` 字段（include/exclude），改完通知我跑下一步 build\n\n`;

  for (const [label, items] of Object.entries(bySource)) {
    md += `## ${label} (${items.length})\n\n`;
    md += `| 文件 | V | P | Sani | Hits | 摘要 | 决策 |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    items.sort((a, b) => {
      const ord = { review: 0, error: 1, include: 2, exclude: 3 };
      return (ord[a.action] ?? 9) - (ord[b.action] ?? 9);
    });
    for (const item of items) {
      const icon = {
        include: "✅",
        review: "⚠️",
        exclude: "❌",
        error: "🔥",
      }[item.action] || "?";
      const san = item.needs_sanitize ? "🟡" : "-";
      const hits = item.privacy_hits && Object.keys(item.privacy_hits).length
        ? Object.entries(item.privacy_hits).map(([k, v]) => `${k}:${v}`).join(",")
        : "-";
      const summary = (item.summary || item.error || "").slice(0, 60);
      md += `| \`${item.relpath}\` | ${item.value || "-"} | ${item.privacy || "-"} | ${san} | ${hits} | ${summary} | ${icon} ${item.action} |\n`;
    }
    md += `\n`;
  }

  return md;
}

function writeOutputs(manifest) {
  const manifestPath = path.join(__dirname, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const sizeKB = (fs.statSync(manifestPath).size / 1024).toFixed(1);
  console.log(`✓ wrote ${manifestPath} (${sizeKB} KB)`);

  const reportPath = path.join(__dirname, "manifest-report.md");
  fs.writeFileSync(reportPath, renderReport(manifest));
  console.log(`✓ wrote ${reportPath}`);
}

// ── MAIN ────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  const cached = FORCE ? new Map() : loadCachedManifest();

  console.log("=== scan-sources Phase 1 ===");
  console.log(`mode: ${FORCE ? "FORCE (re-judge all)" : "incremental"}`);
  console.log(`model: ${JUDGE_MODEL}\n`);

  // 1. walk all sources (or only one if --source=<label>)
  const sourcesToRun = ONLY_SOURCE
    ? SOURCES.filter((s) => s.label === ONLY_SOURCE)
    : SOURCES;
  if (ONLY_SOURCE && sourcesToRun.length === 0) {
    throw new Error(`--source=${ONLY_SOURCE} not found in SOURCES`);
  }
  if (ONLY_SOURCE) console.log(`(filtered to source: ${ONLY_SOURCE})\n`);

  const allFiles = [];
  for (const source of sourcesToRun) {
    const files = walkSource(source);
    console.log(`→ ${source.label.padEnd(18)} ${String(files.length).padStart(4)} files`);
    for (const f of files) {
      f.source_label = source.label;
      f.parent_dir = path.basename(path.dirname(f.fullpath));
      allFiles.push(f);
    }
  }
  console.log(`\n→ total candidates: ${allFiles.length}\n`);

  // 2. 增量过滤
  const toJudge = [];
  const reused = [];
  for (const f of allFiles) {
    const c = cached.get(f.fullpath);
    if (c && c.mtime === f.mtime && c.value && c.privacy) {
      reused.push({ ...c, ...f }); // 用 cached LLM 结果，更新文件元数据
    } else {
      toJudge.push(f);
    }
  }
  console.log(`→ reuse cached: ${reused.length}, fresh judge: ${toJudge.length}\n`);

  if (toJudge.length === 0) {
    writeOutputs(reused);
    return;
  }

  // 3. judge (10 concurrent — 火山方舟可承受)
  console.log("=== judging (concurrency=10) ===");
  const fresh = await runConcurrent(toJudge, 10, async (f) => {
    let content;
    try {
      if (f.ext === ".pdf") {
        content = await readPdf(f.fullpath);
        if (!content) {
          return { ...f, action: "error", error: "pdf parse failed", privacy_hits: {} };
        }
      } else {
        content = fs.readFileSync(f.fullpath, "utf8");
      }
    } catch (e) {
      return { ...f, action: "error", error: e.message.slice(0, 100), privacy_hits: {} };
    }

    if (content.trim().length < 50) {
      return {
        ...f,
        action: "exclude",
        value: "L",
        privacy: "G",
        lang: "zh",
        summary: "(too short, skipped)",
        needs_sanitize: false,
        privacy_hits: {},
      };
    }

    const privacy_hits = regexScan(content);
    const judge = await llmJudgeWithRetry(f.fullpath, f.parent_dir, content);
    const action = decideAction(judge.value, judge.privacy, privacy_hits);

    return { ...f, ...judge, privacy_hits, action };
  });

  // 4. 合并 + 输出
  const finalManifest = [...reused, ...fresh].sort((a, b) =>
    a.fullpath.localeCompare(b.fullpath),
  );
  writeOutputs(finalManifest);

  const stat = { include: 0, review: 0, exclude: 0, error: 0 };
  for (const m of finalManifest) stat[m.action] = (stat[m.action] || 0) + 1;
  console.log(
    `\n✓ done in ${Math.round((Date.now() - t0) / 1000)}s · include=${stat.include} review=${stat.review} exclude=${stat.exclude} error=${stat.error || 0}`,
  );
  if ((stat.error || 0) > 0) {
    throw new Error(
      `scan incomplete: ${stat.error} file(s) failed judge/read; aborting before reindex`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
