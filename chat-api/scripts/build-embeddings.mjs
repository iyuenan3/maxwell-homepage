#!/usr/bin/env node
/**
 * build-embeddings.mjs — RAG indexing pipeline (v2)
 *
 * 数据源：
 *   主源（手工真相源，永远 include，无 sanitize）:
 *     1. worklog/wiki/job/me/resume/MaxwellLi-AIPMorFDE.md → resume（2026-05-26 迁自本仓库根，worklog 成简历真相源；5-27 改名 + 扩 FDE 定位）
 *     2. ../site/data/home-data.js                → home-data
 *     3. ../site/data/projects/<slug>.md          → detail:<slug>
 *     4. ~/Desktop/Claude-Project/worklog/wiki/projects/<slug>.md → wiki:<slug>
 *   manifest 源（scan-sources.mjs 产出 + Maxwell 审稿）:
 *     5. scripts/manifest.json 中 action="include" 的所有文件
 *        needs_sanitize=true 的 chunks 走 chunk-level LLM 脱敏
 *
 * 4 大类（用于 RAG 多源平衡 perCategoryMax）:
 *   personal / work-history / current-projects / knowledge-base
 *
 * 用法：
 *   npm run reindex          # 全量重建
 *   npm run reindex:dry      # 只 chunk 不调 API
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const CHAT_API_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(CHAT_API_ROOT, "..");
const HOME = os.homedir();
const WORKLOG_WIKI = path.join(
  HOME,
  "Desktop/Claude-Project/worklog/wiki/projects",
);

// 简历真相源 2026-05-26 迁至 worklog（统一知识库管理）；loadResume 主源通道直读，
// 不经 scan-sources 的 worklog walk，故 wiki/job 排除不影响它（无需白名单）。
const RESUME_PATH = path.join(HOME, "Desktop/Claude-Project/worklog/wiki/job/me/resume/MaxwellLi-AIPMorFDE.md");
const HOME_DATA_PATH = path.join(REPO_ROOT, "site/data/home-data.js");
const DETAIL_DIR = path.join(REPO_ROOT, "site/data/projects");
const MANIFEST_PATH = path.join(__dirname, "manifest.json");
const OUT_PATH = path.join(CHAT_API_ROOT, "data/embeddings.json");

// chunk 参数：体验优先，每 chunk 更大语义更完整（doubao-embedding 上限 8K tokens）
const TARGET_CHUNK_CHARS = 2000; // 中文 ~1300 token / chunk
const MAX_CHUNK_CHARS = 3000;
const MIN_CHUNK_CHARS = 200;     // 提高最小 → 过滤碎片噪声
const EMBED_BATCH_SIZE = 10;
const SANITIZE_CONCURRENCY = 10;

// chunk-level 求职/面试关键词过滤（P0 隐私边界第 4 层防御）
// 防御漏网：wiki:projects/* / detail / home-data 等 hardcoded 源不走 LLM judge,
// 可能含求职 mention（如 worklog.md changelog 提到面试活动 / chemai-demo 关联段提及）.
// 匹配的 chunk 整段丢弃，不入索引。
const JOB_INTERVIEW_CHUNK_FILTER = /面试|面经|面试官|面试题|面试录音|求职|找工作|应聘|招聘|投简历|投了几家|在面|跳槽|HR\s*面|CEO\s*面|终面|一面|二面|三面|谈薪|薪资期望|期望薪资|当前薪资|\bOffer\b|BOSS\s*直聘|招呼语|offerhelper/i;

// source 整源黑名单：项目本身就是求职/面试辅助工具的，所有 chunks 一律 drop
// 即使 chunk text 不含明显关键词（如功能模块设计表格），仍然完整排除
const JOB_INTERVIEW_SOURCE_BLACKLIST = [
  /^wiki:jobs-hunt$/,    // 求职神器（原 offerhelper，5/20 改名），含正在进行的公司面试进度，整源排除
  /^wiki:offerhelper$/,  // 兼容旧名（防回退 / 历史 chunk）
  // ⚠️ 教训：求职类项目改名会让此黑名单失效（offerhelper→jobs-hunt 即漏过一次）。
  //    新增/改名求职相关 wiki 项目时务必同步此处。
];

function hasJobInterviewContent(text) {
  return JOB_INTERVIEW_CHUNK_FILTER.test(text);
}

function isJobInterviewSource(source) {
  return JOB_INTERVIEW_SOURCE_BLACKLIST.some((p) => p.test(source));
}

// ── 雇主机密过滤（P0 隐私边界，与求职/面试同级，但 universal 不豁免任何源）──
// 当前雇主的内部平台项目：访客=潜在雇主/同行，绝不能被问出当前雇主的产品/项目。
// 雇主名/项目名散落在 wiki/index.md（头部+日记表+项目表）/ log.md / todos.md /
// worklog.md / claude-financial-research.md 等多个 chunk，任何含此词的 chunk 整段 drop。
// 与"面试官"等正当产品叙事不同，雇主名无正当理由出现在任何对外输出（含 resume/
// home-data/detail），故 universal、不走 FILTER_EXEMPT。
// ⚠️ 敏感词本身绝不入公开仓：从 gitignore 的 .env.local 读 EMPLOYER_CONFIDENTIAL_TERMS
//    （逗号分隔）+ PRIVATE_SOURCE_SLUGS。懒加载缓存，不依赖 loadEnv 调用顺序。
function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function envList(name) {
  return (process.env[name] || "").split(",").map((s) => s.trim()).filter(Boolean);
}

let _employerRe; // undefined=未初始化, null=无配置词
function hasEmployerConfidential(text) {
  if (_employerRe === undefined) {
    const terms = envList("EMPLOYER_CONFIDENTIAL_TERMS");
    _employerRe = terms.length ? new RegExp(terms.map(escapeRe).join("|"), "i") : null;
  }
  return _employerRe ? _employerRe.test(text) : false;
}

// 私有/雇主源整源黑名单（兜底）：主防线是 loadWiki 的 frontmatter flag 自动排除
// （visibility:private / rag_exclude:true），此处按 slug 防 frontmatter 漏写/typo。
let _privateSlugRe;
function isPrivateSource(source) {
  if (_privateSlugRe === undefined) {
    const slugs = envList("PRIVATE_SOURCE_SLUGS");
    _privateSlugRe = slugs.length
      ? new RegExp(`^wiki:(${slugs.map(escapeRe).join("|")})$`)
      : null;
  }
  return _privateSlugRe ? _privateSlugRe.test(source) : false;
}

// frontmatter flag 通用私有判定：未来同类雇主/机密 wiki 项目零改动自动排除
function isFrontmatterPrivate(meta) {
  return meta.visibility === "private" || meta.rag_exclude === "true";
}

const DRY_RUN = process.argv.includes("--dry-run");

// ── env ──────────────────────────────────────────────────
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
const EMBED_MODEL = "doubao-embedding-vision";
const SANITIZE_MODEL = "doubao-seed-2.0-pro";

if (!DRY_RUN && (!CHAT_LLM_API_KEY || !CHAT_LLM_BASE_URL)) {
  throw new Error("CHAT_LLM_API_KEY / CHAT_LLM_BASE_URL missing in .env.local");
}

// ── 4 大类 source category ───────────────────────────────
const SOURCE_CATEGORY = {
  // personal
  resume: "personal",
  "home-data": "personal",
  pets: "personal",                         // ← v3: 原 notion-pets 改名
  "notion-pets": "personal",                // 兼容旧 manifest
  "resume-archive": "personal",
  hdu: "personal",                          // 杭电本科教育 / 毕业设计（学业背景）
  // work-history
  nokia: "work-history",                    // ← v3: 含原 notion-job 内容（合并）
  huawei: "work-history",
  quanjing: "work-history",
  "notion-job": "work-history",             // 兼容旧 manifest
  // current-projects
  detail: "current-projects",
  wiki: "current-projects",
  // knowledge-base
  worklog: "knowledge-base",
  "ai-knowledge": "knowledge-base",
  "projects/openclaw": "knowledge-base",    // ← v3: 原 openclaw-config 改名
  "openclaw-config": "knowledge-base",      // 兼容旧 manifest
};

function categorize(sourceLabel) {
  const key = sourceLabel.split(":")[0];
  return SOURCE_CATEGORY[key] || "other";
}

// ── frontmatter strip ────────────────────────────────────
function stripFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { meta: {}, body: text };
  const fm = text.slice(4, end);
  const body = text.slice(end + 5);
  const meta = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body };
}

// ── markdown chunker ─────────────────────────────────────
function chunkMarkdown(text, sourceLabel, opts = {}) {
  const lines = text.split("\n");
  const sections = [];
  let cur = { heading: "(intro)", body: [] };

  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (m) {
      if (cur.body.length || cur.heading !== "(intro)") sections.push(cur);
      cur = { heading: m[2].trim(), body: [] };
    } else {
      cur.body.push(line);
    }
  }
  if (cur.body.length) sections.push(cur);

  const chunks = [];
  for (const sec of sections) {
    const body = sec.body.join("\n").trim();
    if (body.length < MIN_CHUNK_CHARS) continue;

    if (body.length <= MAX_CHUNK_CHARS) {
      chunks.push({ section: sec.heading, text: body });
      continue;
    }

    const paragraphs = body.split(/\n\s*\n+/);
    let buf = "";
    for (const p of paragraphs) {
      if (buf && buf.length + p.length + 2 > TARGET_CHUNK_CHARS) {
        chunks.push({ section: sec.heading, text: buf.trim() });
        buf = p;
      } else {
        buf += (buf ? "\n\n" : "") + p;
      }
    }
    if (buf.trim().length >= MIN_CHUNK_CHARS) {
      chunks.push({ section: sec.heading, text: buf.trim() });
    }
  }

  return chunks.map((c, i) => ({
    id: `${sourceLabel}#${i}`,
    source: sourceLabel,
    category: categorize(sourceLabel),
    section: c.section,
    text: c.text,
    needs_sanitize: opts.needs_sanitize || false,
  }));
}

// ── PDF reader (pdf-parse v2: class-based API) ──────────
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
    return null;
  }
}

// ── 主源 loaders ─────────────────────────────────────────
function loadResume() {
  console.log("→ load resume");
  const text = fs.readFileSync(RESUME_PATH, "utf8");
  return chunkMarkdown(text, "resume");
}

function loadHomeData() {
  console.log("→ load home-data.js");
  const D = require(HOME_DATA_PATH);
  const out = [];

  out.push({
    id: "home#whoami",
    source: "home-data",
    category: categorize("home-data"),
    section: "whoami",
    needs_sanitize: false,
    text: [
      `${D.whoami.name}，${D.whoami.location}。`,
      `当前角色：${D.whoami.role}。`,
      `经历：${D.whoami.previously}。`,
      `家庭：${D.whoami.household.replace(/<[^>]+>/g, "")}。`,
      `标签：${D.whoami.tags}。`,
      `联系：邮箱 ${D.whoami.contact.email}，微信 ${D.whoami.contact.wechat}。`,
      `链接：${D.whoami.links.map((l) => l.url).join(" / ")}。`,
    ].join(" "),
  });

  D.gitLog.forEach((c, i) => {
    out.push({
      id: `home#gitlog-${i}`,
      source: "home-data",
      category: categorize("home-data"),
      section: `gitLog · ${c.date}`,
      needs_sanitize: false,
      text: [
        `[${c.date}] ${c.subject}`,
        c.body.replace(/<[^>]+>/g, ""),
        `技术栈：${(c.tags || []).join(" · ")}`,
      ].join("\n"),
    });
  });

  D.projects.forEach((p) => {
    out.push({
      id: `home#project-${p.slug}`,
      source: "home-data",
      category: categorize("home-data"),
      section: `project · ${p.slug}`,
      needs_sanitize: false,
      text: [
        `${p.zh}（${p.state}，${p.date}）`,
        `slug: ${p.slug}`,
        `描述：${p.desc}`,
        `技术栈：${p.stack}`,
      ].join("\n"),
    });
  });

  if (D.pets?.length) {
    out.push({
      id: "home#pets",
      source: "home-data",
      category: categorize("home-data"),
      section: "pets",
      needs_sanitize: false,
      text:
        "宠物之家 (7 cats + 2 dogs)：\n" +
        D.pets
          .map((p) => `- ${p.name}（${p.desc}，${p.status}，since ${p.date}）`)
          .join("\n"),
    });
  }

  if (D.stack) {
    out.push({
      id: "home#stack",
      source: "home-data",
      category: categorize("home-data"),
      section: "stack",
      needs_sanitize: false,
      text: [
        `daily（每天用）：${D.stack.daily}`,
        `often（常用）：${D.stack.often}`,
        `done（用过 / 退役）：${D.stack.done}`,
      ].join("\n"),
    });
  }

  if (D.history) {
    out.push({
      id: "home#history",
      source: "home-data",
      category: categorize("home-data"),
      section: "history",
      needs_sanitize: false,
      text: [
        D.history.edu ? `教育：${D.history.edu.replace(/<[^>]+>/g, "")}` : "",
        D.history.patents
          ? `专利：${D.history.patents.replace(/<[^>]+>/g, "")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  return out;
}

function loadDetailPages() {
  console.log("→ load site/data/projects/*.md");
  const files = fs
    .readdirSync(DETAIL_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(DETAIL_DIR, f));

  const out = [];
  for (const file of files) {
    const slug = path.basename(file, ".md");
    const raw = fs.readFileSync(file, "utf8");
    const { body } = stripFrontmatter(raw);
    if (body.trim().length < MIN_CHUNK_CHARS) continue;
    out.push(...chunkMarkdown(body, `detail:${slug}`));
  }
  return out;
}

function loadWiki() {
  console.log("→ load worklog/wiki/projects/*.md");
  if (!fs.existsSync(WORKLOG_WIKI)) {
    console.warn(`  (wiki dir not found, skip): ${WORKLOG_WIKI}`);
    return [];
  }
  const files = fs
    .readdirSync(WORKLOG_WIKI)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(WORKLOG_WIKI, f));

  const out = [];
  let skippedPrivate = 0;
  for (const file of files) {
    const slug = path.basename(file, ".md");
    const text = fs.readFileSync(file, "utf8");
    if (text.trim().length < MIN_CHUNK_CHARS) continue;
    // P0：frontmatter visibility:private / rag_exclude:true 的私有页整源排除
    // （如雇主机密的私有项目页）。通用机制，未来同类项目零改动。
    const { meta } = stripFrontmatter(text);
    if (isFrontmatterPrivate(meta)) {
      skippedPrivate++;
      continue;
    }
    out.push(...chunkMarkdown(text, `wiki:${slug}`));
  }
  if (skippedPrivate > 0) {
    console.log(`  (wiki: skipped ${skippedPrivate} private page(s) via frontmatter flag)`);
  }
  return out;
}

// ── manifest loader（scan-sources 输出） ────────────────
async function loadFromManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.log(`→ no manifest.json (skip): ${MANIFEST_PATH}`);
    return [];
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const included = manifest.filter((m) => m.action === "include");
  console.log(
    `→ load manifest: ${included.length} include / ${manifest.length} total`,
  );

  const out = [];
  for (const item of included) {
    let content;
    try {
      if (item.ext === ".pdf") {
        content = await readPdf(item.fullpath);
        if (!content) {
          console.warn(`  [pdf parse failed] ${item.relpath}`);
          continue;
        }
      } else {
        content = fs.readFileSync(item.fullpath, "utf8");
      }
    } catch (e) {
      console.warn(`  [read failed] ${item.relpath}: ${e.message.slice(0, 80)}`);
      continue;
    }

    // strip frontmatter (vault 文件 + detail 文件都可能有 frontmatter)
    const { body } = stripFrontmatter(content);
    content = body;

    if (content.trim().length < MIN_CHUNK_CHARS) continue;

    // source label: <label>:<rel-without-ext-slashed>
    const stem = item.relpath
      .replace(/\.(md|pdf)$/i, "")
      .replace(/[\/\\]/g, "_")
      .slice(0, 80);
    const sourceLabel = `${item.source_label}:${stem}`;
    // vault 已 file-level pre-sanitize → 跳过 chunk-level sanitize
    // 检测：fullpath 在 vault root 下 OR manifest 标了 migrated
    const VAULT_ROOT_CHECK = path.join(os.homedir(), "Desktop/Claude-Project/maxwell-rag-sources");
    const isVaultFile = item.fullpath?.startsWith(VAULT_ROOT_CHECK);
    const needsSanitize = (item.migrated || isVaultFile) ? false : (item.needs_sanitize === true);
    out.push(
      ...chunkMarkdown(content, sourceLabel, {
        needs_sanitize: needsSanitize,
      }),
    );
  }
  return out;
}

// ── chunk-level sanitize ─────────────────────────────────
const SANITIZE_PROMPT = (chunkText) => `你是隐私脱敏助手。把下面文本中的敏感实体替换为占位符。

【替换规则】
- 第三方人名（不在 KEEP 列表）→ [姓名]
- 第三方公司名（不在 KEEP 列表）→ [公司]
- 实际金额数字（含 ¥/元/万/RMB/工资/报价/合同金额；不含百分比/比率/技术指标如 -31% / 2x）→ [金额]
- 保留：段落结构 / 标点 / 项目代号 / 技术名词 / 公开事实

【KEEP 白名单（绝对禁止脱敏，无论上下文如何，原样保留）】
本人姓名（最高优先级，凡是出现都保留）：李越男 / Li Yuenan / Li Maxwell / Maxwell / 越男 / iyuenan3 / limaxwell93
其他人名（公开人物）：Karpathy / Andrej / Ilya / Sam Altman / 张俊林
宠物名（猫狗，禁止脱敏）：小葵 / 飞流 / 乔治 / 吉吉 / 五百 / 花轮 / 红豆 / 小七 / 多多
公司名：华为 / Nokia / 全境骑行 / Anthropic / 字节跳动 / OpenAI / Cursor / 火山方舟 / Volcano Engine / Claude / DeepSeek / 字节 / 阿里 / 腾讯 / Microsoft / Google / Meta

⚠️ 关键提醒：本文件几乎所有出现的人名都是**李越男本人**（Maxwell 自己的笔记 / 简历 / 工作记录），默认应保留为「李越男」或「Maxwell」，**不要替换为 [姓名]**。只有明确指代第三方（如同事「张三经理」/ 客户「李四」/ 医院 vet 名）才替换。

【输入】
${chunkText}

【输出】
直接给脱敏后的文本，不加任何解释、标注、JSON 包裹、代码块包裹。保持原段落结构与标点。`;

async function sanitizeText(text) {
  const res = await fetch(`${CHAT_LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAT_LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: SANITIZE_MODEL,
      temperature: 0.1,
      max_tokens: 2000,
      messages: [{ role: "user", content: SANITIZE_PROMPT(text) }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`sanitize ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  let result = json.choices?.[0]?.message?.content?.trim() || "";
  // 去除可能的 markdown 包裹
  result = result.replace(/^```(?:\w+)?\n?/, "").replace(/\n?```$/, "");
  return result;
}

async function sanitizeWithRetry(text) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await sanitizeText(text);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

async function sanitizeChunks(chunks) {
  const targets = chunks.map((c, i) => ({ c, i })).filter((x) => x.c.needs_sanitize);
  if (targets.length === 0) {
    console.log("→ no chunks need sanitize\n");
    return chunks;
  }
  console.log(`=== sanitizing ${targets.length} chunks (concurrency=${SANITIZE_CONCURRENCY}) ===`);

  let next = 0;
  let done = 0;
  let failed = 0;
  async function loop() {
    while (next < targets.length) {
      const { c } = targets[next++];
      try {
        c.text = await sanitizeWithRetry(c.text);
        c.sanitized = true;
      } catch (e) {
        c.sanitized = false;
        c.sanitize_error = e.message.slice(0, 100);
        failed++;
      }
      done++;
      if (done % 10 === 0 || done === targets.length) {
        process.stdout.write(`\r  ${done}/${targets.length}  `);
      }
    }
  }
  await Promise.all(Array.from({ length: SANITIZE_CONCURRENCY }, () => loop()));
  process.stdout.write("\n");
  if (failed) console.warn(`  ⚠️ ${failed} chunks sanitize failed (kept original text)`);
  return chunks;
}

// ── embedding ───────────────────────────────────────────
async function embedBatch(texts) {
  const url = `${CHAT_LLM_BASE_URL}/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHAT_LLM_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`embed batch failed ${res.status}: ${err.slice(0, 300)}`);
  }
  const json = await res.json();
  return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

async function embedWithRetry(texts, label) {
  // 429 退避更激进：5s / 20s / 60s / 120s / 240s
  const waits = [5000, 20000, 60000, 120000, 240000];
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await embedBatch(texts);
    } catch (e) {
      if (attempt === 5) {
        console.log(`\n  ${label} batch failed 5x, falling back to single`);
        const out = [];
        for (let i = 0; i < texts.length; i++) {
          process.stdout.write(`    single ${i + 1}/${texts.length}... `);
          // single fallback 也 retry 几次
          let single = null;
          for (let s = 1; s <= 4; s++) {
            try {
              const v = await embedBatch([texts[i]]);
              single = v[0];
              break;
            } catch (se) {
              if (s === 4) throw se;
              await new Promise((r) => setTimeout(r, 5000 * s));
            }
          }
          out.push(single);
          await new Promise((r) => setTimeout(r, 500)); // 间隔
          console.log("ok");
        }
        return out;
      }
      const wait = waits[attempt - 1];
      console.log(`\n  ${label} attempt ${attempt} failed (${e.message.slice(0, 80)}), retry in ${Math.round(wait / 1000)}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("unreachable");
}

const EMBED_BATCH_INTERVAL_MS = 600; // 控速：每 batch 间隔，防火山方舟账户级限流

async function embedAll(chunks) {
  const out = new Array(chunks.length);
  const totalBatches = Math.ceil(chunks.length / EMBED_BATCH_SIZE);
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => `${c.section}\n${c.text}`);
    const label = `batch ${i / EMBED_BATCH_SIZE + 1}/${totalBatches}`;
    process.stdout.write(`  embed ${label} (${batch.length})... `);
    const t0 = Date.now();
    const vectors = await embedWithRetry(texts, label);
    for (let j = 0; j < vectors.length; j++) out[i + j] = vectors[j];
    console.log(`${Date.now() - t0}ms`);
    // 控速间隔（最后一批不用等）
    if (i + EMBED_BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, EMBED_BATCH_INTERVAL_MS));
    }
  }
  return out;
}

// ── main ─────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log("=== build-embeddings v2 ===");
  console.log(DRY_RUN ? "(dry-run: skip embedding + sanitize)\n" : "");

  const rawChunks = [
    ...loadResume(),
    ...loadHomeData(),
    ...loadDetailPages(),
    ...loadWiki(),
    ...(await loadFromManifest()),
  ];

  // P0 隐私边界第 4 层防御：chunk-level 求职/面试过滤
  // 双检查：source 整源黑名单 + chunk text 关键词
  // 豁免手工 curated 的对外公开主源（resume / home-data / detail）：这些本就是
  // 发布给公众/招聘看的内容，"面试官"等是正当产品叙事而非隐私泄露；filter 仅
  // 针对自动 ingest 源（manifest 的 worklog/nokia/… + wiki）里漏网的求职隐私。
  const FILTER_EXEMPT_SOURCES = new Set(["resume", "home-data", "detail"]);
  const filteredBySource = {};
  const employerBySource = {};
  const chunks = rawChunks.filter((c) => {
    const sk = c.source.split(":")[0];
    // 雇主机密层（universal，连 curated 公开源也查）：先于求职豁免执行
    if (isPrivateSource(c.source) || hasEmployerConfidential(c.text)) {
      employerBySource[sk] = (employerBySource[sk] || 0) + 1;
      return false;
    }
    if (FILTER_EXEMPT_SOURCES.has(sk)) return true;
    if (isJobInterviewSource(c.source) || hasJobInterviewContent(c.text)) {
      filteredBySource[sk] = (filteredBySource[sk] || 0) + 1;
      return false;
    }
    return true;
  });
  const employerCount = Object.values(employerBySource).reduce((a, b) => a + b, 0);
  if (employerCount > 0) {
    console.log(`\n→ employer-confidential filter (terms from .env.local): dropped ${employerCount} chunks`);
    for (const [k, v] of Object.entries(employerBySource).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k.padEnd(18)} -${v}`);
    }
  }
  const filteredCount = rawChunks.length - chunks.length - employerCount;
  if (filteredCount > 0) {
    console.log(`\n→ chunk-level job/interview filter: dropped ${filteredCount} chunks`);
    for (const [k, v] of Object.entries(filteredBySource).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k.padEnd(18)} -${v}`);
    }
  }

  // 统计
  const sourceCount = {};
  const categoryCount = {};
  const sanCount = chunks.filter((c) => c.needs_sanitize).length;
  for (const c of chunks) {
    const sk = c.source.split(":")[0];
    sourceCount[sk] = (sourceCount[sk] || 0) + 1;
    categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
  }
  console.log(`\n→ chunks: ${chunks.length} (sanitize-flagged: ${sanCount})`);
  console.log("→ by source:");
  for (const [k, v] of Object.entries(sourceCount).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(18)} ${v}`);
  }
  console.log("→ by category:");
  for (const [k, v] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k.padEnd(18)} ${v}`);
  }
  const totalChars = chunks.reduce((a, c) => a + c.text.length, 0);
  console.log(
    `→ total chars: ${totalChars} (avg ${Math.round(totalChars / chunks.length)}/chunk)\n`,
  );

  if (DRY_RUN) {
    console.log("dry-run: showing first 3 chunks\n");
    for (const c of chunks.slice(0, 3)) {
      console.log(`--- ${c.id} [${c.section}] needs_sanitize=${c.needs_sanitize} ---`);
      console.log(c.text.slice(0, 200) + (c.text.length > 200 ? "..." : ""));
      console.log();
    }
    return;
  }

  // 1. sanitize (in-place 修改 chunk.text for needs_sanitize=true)
  await sanitizeChunks(chunks);

  // 2. embedding
  console.log("=== embedding ===");
  const vectors = await embedAll(chunks);

  const dim = vectors[0]?.length;
  if (!dim) throw new Error("no vectors returned");
  for (let i = 0; i < chunks.length; i++) chunks[i].vector = vectors[i];

  const payload = {
    model: EMBED_MODEL,
    sanitize_model: SANITIZE_MODEL,
    dim,
    builtAt: new Date().toISOString(),
    count: chunks.length,
    chunks,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload));
  const sizeMB = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(
    `\n✓ wrote ${OUT_PATH}\n  ${chunks.length} chunks · ${dim} dim · ${sizeMB} MB · ${Math.round((Date.now() - t0) / 1000)}s`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
