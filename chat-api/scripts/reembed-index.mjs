#!/usr/bin/env node
// Re-vectorize an existing reviewed index, without reading any original sources.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { getEmbedConfig } from "../llm-config.mjs";
import { assertEmbeddingIndex, assertIndexMatchesConfig, assertVector, requestEmbeddings } from "../embedding-contract.mjs";
import { indexExportIssue } from "./rag-privacy.mjs";
import { loadLocalEnv } from "./load-env.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function embedWithRetry(embed, config, texts) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await embed(config, texts, { timeoutMs: 30_000 });
    } catch (error) {
      const retryable = error.status === 429 || error.status === 408 || error.status >= 500 ||
        error.name === "TimeoutError" || (error instanceof TypeError && error.message === "fetch failed");
      if (!retryable || /quota|insufficient/i.test(error.message) || attempt >= 2) throw error;
      await wait((attempt + 1) * 2_000);
    }
  }
}

export async function reembedIndex({ inputPath, outputPath, backupRoot, config,
  dryRun = false, activate = false, batchSize = 10, intervalMs = 600,
  embed = requestEmbeddings, progress = () => {} }) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10) throw new Error("Invalid batch size");
  if (path.resolve(inputPath) === path.resolve(outputPath)) throw new Error("Candidate must differ from source");
  if (fs.existsSync(outputPath)) throw new Error("Candidate already exists; use a new output path");
  const originalBytes = fs.readFileSync(inputPath);
  const originalHash = sha256(originalBytes);
  const original = JSON.parse(originalBytes.toString("utf8"));
  assertEmbeddingIndex(original);
  const excluded = {};
  const retained = original.chunks.filter((chunk) => {
    const reason = indexExportIssue(chunk);
    if (reason === "unsanitized") throw new Error("Source contains incomplete sanitization; no export permitted");
    if (reason) excluded[reason] = (excluded[reason] || 0) + 1;
    return !reason;
  });
  if (!retained.length) throw new Error("No safe chunks remain");
  const summary = { sourceModel: original.model, targetModel: config.model, dimensions: config.dimensions,
    sourceCount: original.count, retainedCount: retained.length, excluded,
    sourceSha256: originalHash, characters: retained.reduce((sum, c) => sum + c.section.length + c.text.length + 1, 0) };
  progress({ stage: "preflight", ...summary });
  if (dryRun) return summary;

  fs.mkdirSync(backupRoot, { recursive: true, mode: 0o700 });
  const backupDir = fs.mkdtempSync(path.join(backupRoot, "reembed-"));
  fs.chmodSync(backupDir, 0o700);
  const backupPath = path.join(backupDir, "embeddings.json");
  fs.copyFileSync(inputPath, backupPath, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(backupPath, 0o600);
  if (sha256(fs.readFileSync(backupPath)) !== originalHash) throw new Error("Backup verification failed");
  progress({ stage: "backup", backupPath });

  // Check account permissions and vector shape before any retained knowledge is sent.
  const probe = await embedWithRetry(embed, config, ["Synthetic public embedding compatibility check."]);
  if (probe.length !== 1) throw new Error("Embedding probe count mismatch");
  assertVector(probe[0], config.dimensions);
  const chunks = [];
  for (let i = 0; i < retained.length; i += batchSize) {
    const batch = retained.slice(i, i + batchSize);
    const vectors = await embedWithRetry(embed, config, batch.map((c) => c.section + "\n" + c.text));
    if (vectors.length !== batch.length) throw new Error("Embedding response count mismatch");
    for (const vector of vectors) assertVector(vector, config.dimensions);
    chunks.push(...batch.map((chunk, j) => ({ ...chunk, vector: vectors[j] })));
    progress({ stage: "embedding", completed: chunks.length, total: retained.length });
    if (chunks.length < retained.length && intervalMs) await wait(intervalMs);
  }
  const payload = { ...original, model: config.model, dim: config.dimensions,
    builtAt: new Date().toISOString(), count: chunks.length, chunks,
    reembedding: { source_sha256: originalHash, source_model: original.model,
      source_dim: original.dim, source_builtAt: original.builtAt,
      source_count: original.count, excluded_count: original.count - chunks.length } };
  // sanitize_model and all retained chunk metadata/text are preserved, not relabeled.
  assertEmbeddingIndex(payload);
  assertIndexMatchesConfig(payload, config);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  const temporary = outputPath + ".partial-" + process.pid;
  fs.writeFileSync(temporary, JSON.stringify(payload), { flag: "wx", mode: 0o600 });
  const readback = JSON.parse(fs.readFileSync(temporary, "utf8"));
  assertEmbeddingIndex(readback);
  if (sha256(fs.readFileSync(inputPath)) !== originalHash) throw new Error("Source changed during migration; no activation");
  // Link exclusively so a concurrent candidate writer cannot be overwritten.
  fs.linkSync(temporary, outputPath);
  fs.unlinkSync(temporary);
  if (activate) fs.renameSync(outputPath, inputPath);
  const result = { ...summary, backupPath, outputPath: activate ? inputPath : outputPath,
    activated: activate, sha256: sha256(fs.readFileSync(activate ? inputPath : outputPath)) };
  progress({ stage: "complete", ...result });
  return result;
}

async function main() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  loadLocalEnv(root);
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--dry-run", "--activate"].includes(arg))) {
    throw new Error("Usage: npm run reembed -- [--dry-run] [--activate]");
  }
  await reembedIndex({ inputPath: path.join(root, "data/embeddings.json"),
    outputPath: path.join(root, "data/embeddings.candidate.json"),
    backupRoot: path.join(os.homedir(), ".local/share/maxwell-homepage/backups"),
    config: getEmbedConfig(), dryRun: args.includes("--dry-run"), activate: args.includes("--activate"),
    progress: (status) => console.log(JSON.stringify(status)),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
