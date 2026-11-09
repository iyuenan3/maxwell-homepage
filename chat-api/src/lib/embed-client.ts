/** OpenAI-compatible query embedding client with a ten-second deadline. */
import { requestEmbeddings } from "../../embedding-contract.mjs";

export interface EmbedClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions: number;
}

export function createEmbedClient(config: EmbedClientConfig) {
  const settings = { ...config };
  return {
    model: settings.model,
    dimensions: settings.dimensions,
    async embed(input: string | string[]): Promise<number[][]> {
      return requestEmbeddings(settings, input);
    },
  };
}
