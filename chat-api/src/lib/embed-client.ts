/**
 * OpenAI-compatible embedding client.
 * 直连火山方舟 Ark 调用 `doubao-embedding-vision` (2048-dim)，
 * 走标准 `/embeddings` 端点（Ark OpenAI 兼容）。
 *
 * Batch size is the caller's responsibility — pass in chunks of <= 10
 * to stay within the upstream concurrency window.
 */

export interface EmbedClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function createEmbedClient(config: EmbedClientConfig) {
  const url = `${config.baseUrl}/embeddings`;

  return {
    /** Returns one float[2048] per input string, in the same order. */
    async embed(input: string | string[]): Promise<number[][]> {
      const inputs = Array.isArray(input) ? input : [input];
      if (inputs.length === 0) return [];

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          input: inputs,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(
          `Embedding API ${res.status}: ${errText.slice(0, 300)}`,
        );
      }

      const json = (await res.json()) as {
        data: { embedding: number[]; index: number }[];
      };

      return [...json.data]
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);
    },
  };
}
