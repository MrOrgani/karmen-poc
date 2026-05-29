import { Logger } from '@nestjs/common';
import type { LlmClient, LlmGenerateInput } from './llm.client';

type AnthropicConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
};

/**
 * Client Anthropic. Volontairement écrit sans dépendre du SDK pour garder
 * le squelette installable sans `@anthropic-ai/sdk`. À remplacer par le SDK
 * officiel dès que `LLM_PROVIDER=anthropic` est activé en prod.
 */
export class AnthropicClient implements LlmClient {
  private readonly logger = new Logger(AnthropicClient.name);

  constructor(private readonly config: AnthropicConfig) {}

  async generate({
    system,
    user,
    signal,
  }: LlmGenerateInput): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    signal?.addEventListener('abort', () => controller.abort(), { once: true });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 400,
          system: [
            {
              type: 'text',
              text: system,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: user }],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '<no body>');
        this.logger.warn(
          `Anthropic ${response.status} ${response.statusText} — ${detail.slice(0, 300)} — fallback template`,
        );
        return null;
      }

      const data = (await response.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = data.content
        ?.find((block) => block.type === 'text')
        ?.text?.trim();
      return text && text.length > 0 ? text : null;
    } catch (err) {
      this.logger.warn(
        `Anthropic error: ${(err as Error).message} — fallback template`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
