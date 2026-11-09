import { getTextRequestOptions } from "../llm-config.mjs";

// Shared non-streaming request for RAG judging and sanitization.
export async function textCompletion(config, { model, prompt, maxTokens, json = false }) {
  if (!config.baseUrl || !config.apiKey || !model) {
    throw new Error("CHAT_LLM_BASE_URL / CHAT_LLM_API_KEY / text model missing");
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
      ...getTextRequestOptions(),
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60_000),
    redirect: "error",
  });
  if (!res.ok) {
    // Only log status and upstream error code, never the source text or credential.
    const body = await res.json().catch(() => ({}));
    const rawCode = body.error?.code || body.code;
    const code = typeof rawCode === "string" && /^[A-Za-z0-9_.-]{1,64}$/.test(rawCode)
      ? rawCode : "upstream_error";
    const error = new Error(`Text API ${res.status}: ${code}`);
    Object.assign(error, { status: res.status });
    throw error;
  }
  const body = await res.json();
  const choice = body.choices?.[0];
  const text = choice?.message?.content;
  if (choice?.finish_reason !== "stop" || typeof text !== "string" || !text.trim()) {
    throw new Error("Text API incomplete response");
  }
  return text.trim();
}
