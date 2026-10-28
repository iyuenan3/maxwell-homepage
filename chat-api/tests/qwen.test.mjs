import assert from "node:assert/strict";
import { test } from "node:test";
import { getChatConfig, getEmbedConfig, getRagConfig } from "../llm-config.mjs";
import { qwenCompletion } from "../scripts/qwen-completion.mjs";

test("Qwen text configuration never supplies embedding credentials", () => {
  const env = { CHAT_LLM_API_KEY: "text-test-key" };
  assert.equal(getChatConfig(env).model, "qwen3.7-plus");
  assert.equal(getRagConfig(env).judgeModel, "qwen3.7-plus");
  assert.equal(getRagConfig(env).sanitizeModel, "qwen3.7-plus");
  assert.deepEqual(getEmbedConfig(env), {
    baseUrl: "", apiKey: "", model: "doubao-embedding-vision",
  });
  const config = getEmbedConfig({
    ...env, EMBED_LLM_API_KEY: "embed-test-key", EMBED_LLM_BASE_URL: "https://embed.example/v1/",
  });
  assert.equal(config.apiKey, "embed-test-key");
  assert.equal(config.baseUrl, "https://embed.example/v1");
});

test("RAG model overrides do not change online chat", () => {
  const env = { RAG_JUDGE_MODEL: "judge-test-model", RAG_SANITIZE_MODEL: "sanitize-test-model" };
  assert.equal(getRagConfig(env).judgeModel, "judge-test-model");
  assert.equal(getRagConfig(env).sanitizeModel, "sanitize-test-model");
  assert.equal(getChatConfig(env).model, "qwen3.7-plus");
});

const config = { baseUrl: "https://qwen.example/v1", apiKey: "text-test-key" };

test("judge and sanitizer send direct Qwen requests with thinking disabled", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({ choices: [{ finish_reason: "stop", message: { content: "safe output" } }] });
  });
  for (const json of [true, false]) {
    assert.equal(await qwenCompletion(config, {
      model: "qwen3.7-plus", prompt: "synthetic input", maxTokens: 100, json,
    }), "safe output");
  }
  assert.equal(requests.length, 2);
  for (const r of requests) {
    assert.equal(r.url, "https://qwen.example/v1/chat/completions");
    assert.equal(r.options.headers.Authorization, "Bearer text-test-key");
    assert.equal(r.body.enable_thinking, false);
    assert.equal(r.body.thinking, undefined);
    assert.equal(r.body.model, "qwen3.7-plus");
    assert.ok(r.options.signal instanceof AbortSignal);
  }
  assert.deepEqual(requests[0].body.response_format, { type: "json_object" });
  assert.equal(requests[1].body.response_format, undefined);
});

test("RAG requests reject empty, truncated, and refused responses", async (t) => {
  for (const choice of [
    { finish_reason: "length", message: { content: "partial" } },
    { finish_reason: "stop", message: { content: " " } },
    { finish_reason: "content_filter", message: { content: "blocked" } },
    { finish_reason: "stop", message: { reasoning_content: "only reasoning" } },
  ]) {
    const mock = t.mock.method(globalThis, "fetch", async () => Response.json({ choices: [choice] }));
    await assert.rejects(qwenCompletion(config, {
      model: "qwen3.7-plus", prompt: "synthetic input", maxTokens: 100,
    }), /incomplete response/);
    mock.mock.restore();
  }
});

test("upstream errors expose only status and code, not request contents", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: { code: "AccountQuotaExceeded", message: "private input and key" },
  }, { status: 403 }));
  await assert.rejects(qwenCompletion(config, {
    model: "qwen3.7-plus", prompt: "synthetic input", maxTokens: 100,
  }), { message: "Qwen 403: AccountQuotaExceeded" });
});
