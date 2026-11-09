import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { reembedIndex } from "../scripts/reembed-index.mjs";

function fixture(t, extras = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "homepage-reembed-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const config = { baseUrl: "https://embed.example/v1", apiKey: "test-key", model: "new-model", dimensions: 2 };
  const chunk = { id: "safe", source: "detail:demo", category: "current-projects", section: "Project",
    text: "A synthetic public project.", needs_sanitize: true, sanitized: true, vector: [0.4, 0.6] };
  const index = { model: "old-model", dim: 2, count: 1 + extras.length, builtAt: "2026-01-01", sanitize_model: "old-sanitizer", chunks: [chunk, ...extras] };
  const inputPath = path.join(root, "embeddings.json");
  fs.writeFileSync(inputPath, JSON.stringify(index));
  const options = { inputPath, outputPath: path.join(root, "candidate.json"), backupRoot: path.join(root, "backup"), config, intervalMs: 0 };
  return { root, index, chunk, options, original: fs.readFileSync(inputPath) };
}

test("reembedding preserves source, old sanitizer and retained chunk text; excluded chunks never leave", async (t) => {
  process.env.EMPLOYER_CONFIDENTIAL_TERMS = "SYNTHETIC-PRIVATE-COMPANY";
  t.after(() => { delete process.env.EMPLOYER_CONFIDENTIAL_TERMS; });
  const { options, original, chunk } = fixture(t, [{ id: "private", source: "resume", section: "Employment",
    text: "SYNTHETIC-PRIVATE-COMPANY private details", vector: [1, 0] }]);
  const sent = [];
  const result = await reembedIndex({ ...options, embed: async (_config, texts) => {
    sent.push(...texts); return texts.map(() => [1, 0]);
  } });
  assert.equal(sent.length, 2); // Synthetic probe plus one retained chunk.
  assert.ok(sent.every((text) => !text.includes("SYNTHETIC-PRIVATE-COMPANY")));
  assert.deepEqual(fs.readFileSync(options.inputPath), original);
  assert.deepEqual(fs.readFileSync(result.backupPath), original);
  const candidate = JSON.parse(fs.readFileSync(options.outputPath));
  assert.equal(candidate.model, "new-model");
  assert.equal(candidate.sanitize_model, "old-sanitizer");
  assert.equal(candidate.count, 1);
  assert.deepEqual({ ...candidate.chunks[0], vector: chunk.vector }, chunk);
  assert.equal(fs.statSync(result.backupPath).mode & 0o777, 0o600);
  assert.equal(result.excluded.employer, 1);
});

test("dry run performs no network or index writes", async (t) => {
  const { options, original } = fixture(t);
  let calls = 0;
  const result = await reembedIndex({ ...options, dryRun: true, embed: async () => { calls++; } });
  assert.equal(result.retainedCount, 1);
  assert.equal(calls, 0);
  assert.equal(fs.existsSync(options.outputPath), false);
  assert.equal(fs.existsSync(options.backupRoot), false);
  assert.deepEqual(fs.readFileSync(options.inputPath), original);
});

test("unsanitized input stops before any external request", async (t) => {
  const { options } = fixture(t, [{ id: "bad", source: "wiki:demo", section: "Note", text: "Raw synthetic note.", needs_sanitize: true, vector: [1, 0] }]);
  let calls = 0;
  await assert.rejects(reembedIndex({ ...options, embed: async () => { calls++; } }), /incomplete sanitization/);
  assert.equal(calls, 0);
});

test("upstream or vector failures leave old index intact with no candidate", async (t) => {
  for (const failure of ["permission", "shape"]) {
    const { options, original } = fixture(t);
    let calls = 0;
    await assert.rejects(reembedIndex({ ...options, activate: true, embed: async (_config, texts) => {
      calls++;
      if (failure === "permission") throw Object.assign(new Error("model_not_found"), { status: 400 });
      return texts.map(() => [1]);
    } }));
    assert.ok(calls > 0);
    assert.deepEqual(fs.readFileSync(options.inputPath), original);
    assert.equal(fs.existsSync(options.outputPath), false);
  }
});

test("activation happens only after validated candidate, keeping old backup", async (t) => {
  const { options, original } = fixture(t);
  const result = await reembedIndex({ ...options, activate: true, embed: async (_config, texts) => texts.map(() => [1, 0]) });
  assert.equal(result.activated, true);
  assert.equal(fs.existsSync(options.outputPath), false);
  assert.equal(JSON.parse(fs.readFileSync(options.inputPath)).model, "new-model");
  assert.deepEqual(fs.readFileSync(result.backupPath), original);
});
