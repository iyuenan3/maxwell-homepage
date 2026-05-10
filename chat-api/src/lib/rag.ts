/**
 * RAG runtime: load embeddings.json once, cosine top-K with multi-source
 * balancing. Index file is built offline by `scripts/build-embeddings.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import { createEmbedClient } from "./embed-client";

export interface RagChunk {
  id: string;
  source: string;
  /** 4 大类：personal / work-history / current-projects / knowledge-base / other */
  category?: string;
  section: string;
  text: string;
  vector: number[];
}

/** Fallback: chunks built before v2 may not have category field */
const SOURCE_CATEGORY: Record<string, string> = {
  resume: "personal",
  "home-data": "personal",
  pets: "personal",                       // v3
  "notion-pets": "personal",              // 兼容
  "resume-archive": "personal",
  "worklog-diary": "personal",
  nokia: "work-history",
  huawei: "work-history",
  quanjing: "work-history",
  "notion-job": "work-history",           // 兼容
  detail: "current-projects",
  wiki: "current-projects",
  worklog: "knowledge-base",
  "ai-knowledge": "knowledge-base",
  "projects/openclaw": "knowledge-base",  // v3
  "openclaw-config": "knowledge-base",    // 兼容
};

function getCategory(chunk: RagChunk): string {
  return chunk.category || SOURCE_CATEGORY[chunk.source.split(":")[0]] || "other";
}

export interface RagIndex {
  model: string;
  dim: number;
  builtAt: string;
  count: number;
  chunks: RagChunk[];
}

export interface RetrieveResult {
  chunk: RagChunk;
  score: number;
}

let _index: RagIndex | null = null;

export function loadIndex(): RagIndex {
  if (_index) return _index;
  const indexPath = path.join(process.cwd(), "data/embeddings.json");
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `embeddings.json not found at ${indexPath} — run \`npm run reindex\``,
    );
  }
  _index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as RagIndex;
  console.log(
    `[rag] loaded ${_index.count} chunks (${_index.dim}d, builtAt ${_index.builtAt})`,
  );
  return _index;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export interface RetrieveOptions {
  topK?: number;
  /** 每个 category 大类（personal/work-history/...）最多保留几条 — 多源平衡 */
  perCategoryMax?: number;
}

/**
 * Embed `query` and return top-K chunks ranked by cosine similarity, with
 * per-source quota to keep results balanced across (resume / home-data /
 * detail / wiki).
 */
export async function retrieve(
  embedClient: ReturnType<typeof createEmbedClient>,
  query: string,
  opts: RetrieveOptions = {},
): Promise<RetrieveResult[]> {
  const { topK = 8, perCategoryMax = 3 } = opts;
  const idx = loadIndex();

  const [queryVec] = await embedClient.embed(query);
  if (!queryVec) return [];

  const scored: RetrieveResult[] = idx.chunks.map((chunk) => ({
    chunk,
    score: cosine(queryVec, chunk.vector),
  }));
  scored.sort((a, b) => b.score - a.score);

  // 多源平衡：用 chunk.category（v2）或 SOURCE_CATEGORY 兜底
  const categoryCounts: Record<string, number> = {};
  const out: RetrieveResult[] = [];
  for (const r of scored) {
    const cat = getCategory(r.chunk);
    if ((categoryCounts[cat] ?? 0) >= perCategoryMax) continue;
    out.push(r);
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    if (out.length >= topK) break;
  }
  return out;
}

/**
 * 把召回结果拼成给 LLM 看的 context 文本块。
 * 每段带 [来源: ...] 头，让模型知道"这段来自哪"，可以引用。
 */
export function formatContext(results: RetrieveResult[]): string {
  if (results.length === 0) return "（无相关检索结果）";
  return results
    .map(
      (r) =>
        `[来源: ${r.chunk.source} > ${r.chunk.section} · score=${r.score.toFixed(3)}]\n${r.chunk.text}`,
    )
    .join("\n\n---\n\n");
}
