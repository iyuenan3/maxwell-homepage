#!/usr/bin/env node
/**
 * rag-search.mjs — 本地 RAG 检索调试器
 *
 * 用法：
 *   npm run rag -- "你家有几只猫"             # top-10 默认
 *   npm run rag -- "RICE 漏斗" --topk 20      # 自定义 top-K
 *   npm run rag -- "openclaw" --full          # 显示完整 chunk text，不截断
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAT_API_ROOT = path.resolve(__dirname, "..");
const EMBED_PATH = path.join(CHAT_API_ROOT, "data/embeddings.json");

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
const EMBED_MODEL = "doubao-embedding-vision";

// ── parse args ─────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--topk") flags.topk = parseInt(args[++i]);
  else if (args[i] === "--full") flags.full = true;
  else if (args[i] === "--cat") flags.cat = args[++i];
  else if (args[i].startsWith("--")) console.warn(`unknown flag: ${args[i]}`);
  else positional.push(args[i]);
}
const query = positional.join(" ").trim();
const TOP_K = flags.topk || 10;

if (!query) {
  console.error("usage: npm run rag -- \"<query>\" [--topk N] [--full] [--cat <category>]");
  console.error("  --topk N       返回 top-N（默认 10）");
  console.error("  --full         显示完整 chunk text（默认前 200 字）");
  console.error("  --cat <name>   只检索某 category (personal/work-history/current-projects/knowledge-base)");
  process.exit(1);
}

// ── load embeddings.json ────────────────────────────────
process.stderr.write("loading embeddings.json... ");
const t0 = Date.now();
const idx = JSON.parse(fs.readFileSync(EMBED_PATH, "utf8"));
process.stderr.write(`${idx.count} chunks (${idx.dim}d) in ${Date.now() - t0}ms\n`);

// ── embed query ─────────────────────────────────────────
process.stderr.write("embedding query... ");
const t1 = Date.now();
const res = await fetch(`${CHAT_LLM_BASE_URL}/embeddings`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CHAT_LLM_API_KEY}`,
  },
  body: JSON.stringify({ model: EMBED_MODEL, input: [query] }),
});
if (!res.ok) {
  console.error(`\nembedding failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
const queryVec = (await res.json()).data[0].embedding;
process.stderr.write(`${Date.now() - t1}ms\n`);

// ── cosine similarity ──────────────────────────────────
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

process.stderr.write("scoring... ");
const t2 = Date.now();
const candidates = flags.cat
  ? idx.chunks.filter((c) => c.category === flags.cat)
  : idx.chunks;
const scored = candidates.map((chunk) => ({
  chunk,
  score: cosine(queryVec, chunk.vector),
}));
scored.sort((a, b) => b.score - a.score);
process.stderr.write(`${Date.now() - t2}ms\n\n`);

// ── output ─────────────────────────────────────────────
console.log(`=== Top ${TOP_K} for: "${query}" ===\n`);
for (let i = 0; i < Math.min(TOP_K, scored.length); i++) {
  const r = scored[i];
  const preview = flags.full
    ? r.chunk.text
    : r.chunk.text.slice(0, 200) + (r.chunk.text.length > 200 ? "..." : "");
  const cat = r.chunk.category ? ` [${r.chunk.category}]` : "";
  const san = r.chunk.needs_sanitize ? " 🟡san" : "";
  console.log(`#${(i + 1).toString().padStart(2)} score=${r.score.toFixed(3)}${cat}${san}`);
  console.log(`    source: ${r.chunk.source}`);
  console.log(`    section: ${r.chunk.section}`);
  console.log(`    text: ${preview}`);
  console.log();
}

// ── category 分布 ──────────────────────────────────────
const catCount = {};
for (const r of scored.slice(0, TOP_K)) {
  const c = r.chunk.category || "?";
  catCount[c] = (catCount[c] || 0) + 1;
}
console.log("=== category distribution (top-K) ===");
for (const [k, v] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(20)} ${v}`);
}
