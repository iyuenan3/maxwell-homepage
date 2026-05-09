/**
 * OpenAI-compatible AI client.
 * Works with Volcano Ark, OpenAI, and any OpenAI-compatible API.
 */
export interface AIClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export function createAIClient(config: AIClientConfig) {
  const url = `${config.baseUrl}/chat/completions`;

  return {
    async chat(
      systemPrompt: string,
      userMessage: string,
      options: ChatOptions = {},
    ): Promise<string> {
      const body = JSON.stringify({
        model: config.model,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`AI API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      return json.choices[0].message.content;
    },
  };
}
