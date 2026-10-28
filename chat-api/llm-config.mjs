// Qwen text generation and the existing Ark embedding use separate credentials.
const QWEN_BASE_URL = "https://coding.dashscope.aliyuncs.com/v1";

/** @param {Record<string, string | undefined>} [env] */
export function getChatConfig(env = process.env) {
  return {
    baseUrl: (env.CHAT_LLM_BASE_URL || QWEN_BASE_URL).replace(/\/+$/, ""),
    apiKey: env.CHAT_LLM_API_KEY || "",
    model: env.CHAT_LLM_MODEL || "qwen3.7-plus",
  };
}

/** @param {Record<string, string | undefined>} [env] */
export function getRagConfig(env = process.env) {
  return {
    ...getChatConfig(env),
    judgeModel: env.RAG_JUDGE_MODEL || "qwen3.7-plus",
    sanitizeModel: env.RAG_SANITIZE_MODEL || "qwen3.7-plus",
  };
}

/** @param {Record<string, string | undefined>} [env] */
export function getEmbedConfig(env = process.env) {
  // Never fall back to CHAT_LLM_*: Qwen must not receive the existing Ark vectors.
  return {
    baseUrl: (env.EMBED_LLM_BASE_URL || "").replace(/\/+$/, ""),
    apiKey: env.EMBED_LLM_API_KEY || "",
    model: "doubao-embedding-vision",
  };
}
