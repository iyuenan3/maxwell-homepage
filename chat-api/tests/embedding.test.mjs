import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { test } from "node:test";
import { assertEmbeddingIndex, assertIndexMatchesConfig, requestEmbeddings } from "../embedding-contract.mjs";

const config = { baseUrl: "https://embed.example/v1", apiKey: "synthetic-key", model: "test-model", dimensions: 2 };
const index = { model: "test-model", dim: 2, builtAt: "2026-01-01", count: 1,
  chunks: [{ id: "a", source: "detail:demo", section: "Intro", text: "Public project.", vector: [1, 0] }] };

test("embedding requests send dimensions and reorder responses by index", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.equal(url, config.baseUrl + "/embeddings");
    assert.deepEqual(JSON.parse(options.body), { model: config.model, input: ["one", "two"], dimensions: 2, encoding_format: "float" });
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ model: config.model, data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] });
  });
  assert.deepEqual(await requestEmbeddings(config, []), []);
  assert.equal(calls, 0);
  assert.deepEqual(await requestEmbeddings(config, ["one", "two"]), [[1, 0], [0, 1]]);
  assert.equal(calls, 1);
});

test("online embeddings allow ten seconds while explicit offline deadlines stay unchanged", async (t) => {
  const deadlines = [];
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, "timeout", (milliseconds) => {
    deadlines.push(milliseconds);
    return timeout(milliseconds);
  });
  t.mock.method(globalThis, "fetch", async () => Response.json({ data: [{ index: 0, embedding: [1, 0] }] }));
  await requestEmbeddings(config, "public query");
  await requestEmbeddings(config, "public offline sample", { timeoutMs: 30_000 });
  assert.deepEqual(deadlines, [10_000, 30_000]);
});

test("embedding rejects wrong models, dimensions, counts, indices and invalid values", async (t) => {
  const responses = [
    { model: "wrong", data: [{ index: 0, embedding: [1, 0] }] },
    { data: [] }, { data: [{ index: 1, embedding: [1, 0] }] },
    { data: [{ index: 0, embedding: [1] }] },
    { data: [{ index: 0, embedding: [null, 1] }] },
    { data: [{ index: 0, embedding: [0, 0] }] },
    { data: [{ index: 0, embedding: ["1", 0] }] },
  ];
  for (const response of responses) {
    const mocked = t.mock.method(globalThis, "fetch", async () => Response.json(response));
    await assert.rejects(requestEmbeddings(config, "test"), /Embedding/);
    mocked.mock.restore();
  }
  t.mock.method(globalThis, "fetch", async () => Response.json({ data: [
    { index: 0, embedding: [1, 0] }, { index: 0, embedding: [0, 1] },
  ] }));
  await assert.rejects(requestEmbeddings(config, ["one", "two"]), /indices/);
});

test("embedding errors never include upstream request excerpts", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: { code: "model_not_found", message: "private request excerpt" },
  }, { status: 400 }));
  await assert.rejects(requestEmbeddings(config, "test"), { message: "Embedding API 400: model_not_found", status: 400 });
});

test("index contract rejects wrong dimensions, malformed vectors and counts", () => {
  assertEmbeddingIndex(index);
  assertIndexMatchesConfig(index, config);
  assert.throws(() => assertIndexMatchesConfig(index, { ...config, model: "other" }), /mismatch/);
  assert.throws(() => assertIndexMatchesConfig(index, { ...config, dimensions: 3 }), /mismatch/);
  assert.throws(() => assertEmbeddingIndex({ ...index, count: 0 }), /metadata/);
  assert.throws(() => assertEmbeddingIndex({ ...index, chunks: [{ ...index.chunks[0], vector: [NaN, 1] }] }), /invalid/);
});

test("real runtime retrieval rejects incompatible index before sending query", async (t) => {
  const source = fs.readFileSync(new URL("../src/lib/rag.ts", import.meta.url), "utf8");
  let javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  javascript = javascript.replace('"../../embedding-contract.mjs"', JSON.stringify(new URL("../embedding-contract.mjs", import.meta.url).href));
  const { retrieve } = await import("data:text/javascript;base64," + Buffer.from(javascript).toString("base64"));
  t.mock.method(fs, "existsSync", () => true);
  t.mock.method(fs, "readFileSync", () => JSON.stringify(index));
  let calls = 0;
  const client = { ...config, model: "different-model", embed: async () => { calls++; return [[1, 0]]; } };
  await assert.rejects(retrieve(client, "public query"), /mismatch/);
  assert.equal(calls, 0);
  client.model = config.model;
  const results = await retrieve(client, "public query");
  assert.equal(calls, 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].score, 1);
});
