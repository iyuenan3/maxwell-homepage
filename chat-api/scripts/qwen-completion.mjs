// Shared non-streaming request for RAG judging and sanitization.
export async function qwenCompletion(config, { model, prompt, maxTokens, json = false }) {
  if (!config.baseUrl || !config.apiKey || !model) {
    throw new Error("CHAT_LLM_BASE_URL / CHAT_LLM_API_KEY / Qwen model missing");
  }
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: maxTokens,
      enable_thinking: false,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    // Only log status and upstream error code, never the source text or credential.
    const body = await res.json().catch(() => ({}));
    const code = body.error?.code || body.code || "upstream_error";
    throw new Error(`Qwen ${res.status}: ${code}`);
  }
  const body = await res.json();
  const choice = body.choices?.[0];
  const text = choice?.message?.content;
  if (choice?.finish_reason !== "stop" || typeof text !== "string" || !text.trim()) {
    throw new Error(`Qwen incomplete response (${choice?.finish_reason || "missing"})`);
  }
  return text.trim();
}
