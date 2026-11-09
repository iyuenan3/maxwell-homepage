// Text generation and embeddings always use separate credential settings.
const LMU_BASE_URL = "https://api.lmuai.com/v1";

export function getTextRequestOptions() {
  return { thinking: { type: "disabled" } };
}

/** @param {Record<string, string | undefined>} [env] */
export function getChatConfig(env = process.env) {
  return {
    baseUrl: (env.CHAT_LLM_BASE_URL || LMU_BASE_URL).replace(/\/+$/, ""),
    apiKey: env.CHAT_LLM_API_KEY || "",
    model: env.CHAT_LLM_MODEL || "deepseek-flash",
  };
}

/** @param {Record<string, string | undefined>} [env] */
export function getRagConfig(env = process.env) {
  return {
    ...getChatConfig(env),
    judgeModel: env.RAG_JUDGE_MODEL || "deepseek-flash",
    sanitizeModel: env.RAG_SANITIZE_MODEL || "deepseek-flash",
  };
}

/** @param {Record<string, string | undefined>} [env] */
export function getEmbedConfig(env = process.env) {
  const dimensions = Number(env.EMBED_LLM_DIMENSIONS || "2048");
  if (!Number.isSafeInteger(dimensions) || dimensions <= 0) {
    throw new Error("EMBED_LLM_DIMENSIONS must be a positive integer");
  }
  // Never fall back to CHAT_LLM_* credentials, even when providers are shared.
  return {
    baseUrl: (env.EMBED_LLM_BASE_URL || LMU_BASE_URL).replace(/\/+$/, ""),
    apiKey: env.EMBED_LLM_API_KEY || "",
    model: env.EMBED_LLM_MODEL || "qwen3.7-text-embedding",
    dimensions,
  };
}
