#!/usr/bin/env node
// Explicit paid smoke test. Only synthetic text is sent; no index or source files are read.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { getChatConfig, getEmbedConfig, getRagConfig, getTextRequestOptions } from "../llm-config.mjs";
import { requestEmbeddings } from "../embedding-contract.mjs";
import { textCompletion } from "./text-completion.mjs";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv(fileURLToPath(new URL("..", import.meta.url)));
const chat = getChatConfig(), embed = getEmbedConfig(), rag = getRagConfig();
try {
  if (!process.argv.includes("--text-only")) {
    const start = Date.now();
    const vectors = await requestEmbeddings(embed,
      ["A synthetic public test about cats.", "A synthetic public test about software."], { timeoutMs: 30_000 });
    console.log(JSON.stringify({ test: "embedding", model: embed.model,
      count: vectors.length, dimensions: vectors[0].length, elapsedMs: Date.now() - start }));
  }
  const judged = await textCompletion(rag, { model: rag.judgeModel,
    prompt: 'Return JSON only: {"safe":true}. This is a synthetic public interface test.', maxTokens: 300, json: true });
  assert.equal(JSON.parse(judged).safe, true);
  console.log(JSON.stringify({ test: "judge", validJson: true }));
  const sanitized = await textCompletion(rag, { model: rag.sanitizeModel,
    prompt: 'Synthetic privacy test. Replace the person name in "Alice writes software" with [NAME]. Return only the replacement sentence.', maxTokens: 100 });
  assert.ok(sanitized.includes("[NAME]") && !sanitized.includes("Alice"));
  console.log(JSON.stringify({ test: "sanitize", placeholder: true, removedName: true }));
  const stream = await fetch(`${chat.baseUrl}/chat/completions`, {
    method: "POST", redirect: "error",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chat.apiKey}` },
    body: JSON.stringify({ model: chat.model, stream: true, stream_options: { include_usage: true },
      temperature: 0.7, max_tokens: 100, ...getTextRequestOptions(),
      messages: [{ role: "user", content: "Reply only with OK." }] }),
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(stream.status, 200);
  const sse = await stream.text();
  let content = "", reasoning = "", usage = null, finish = null;
  for (const line of sse.split("\n")) {
    if (!line.startsWith("data: ") || line.trim() === "data: [DONE]") continue;
    const data = JSON.parse(line.slice(6));
    content += data.choices?.[0]?.delta?.content || "";
    reasoning += data.choices?.[0]?.delta?.reasoning_content || "";
    usage = data.usage || usage;
    finish = data.choices?.[0]?.finish_reason || finish;
  }
  assert.ok(sse.includes("data: [DONE]") && content.trim());
  assert.equal(finish, "stop");
  assert.equal(reasoning.length, 0);
  assert.ok(usage && usage.total_tokens > 0);
  assert.equal(usage.completion_tokens_details?.reasoning_tokens || 0, 0);
  console.log(JSON.stringify({ test: "chat-stream", model: chat.model, done: true,
    reasoningChars: 0, hasUsage: true, finish }));
} catch (error) {
  console.error(JSON.stringify({ error: error.message, causeCode: error.cause?.code }));
  process.exitCode = 1;
}
