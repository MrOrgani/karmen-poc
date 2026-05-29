import { Logger, Module, type Provider } from '@nestjs/common';
import { LLM_CLIENT, NullLlmClient, type LlmClient } from './llm.client';
import { AnthropicClient } from './anthropic.client';

/**
 * Env-driven LLM client factory, shared across features (follow-ups, decisions).
 * Defaults to NullLlmClient (template/deterministic fallback) unless a provider is
 * explicitly configured — the repo runs with no API key out of the box.
 */
const llmProvider: Provider = {
  provide: LLM_CLIENT,
  useFactory: (): LlmClient => {
    const logger = new Logger('LlmModule');
    const provider = process.env.LLM_PROVIDER ?? 'none';
    if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logger.warn(
          '🤖 [LlmModule.factory] LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is missing → NullLlmClient (template fallback)',
        );
        return new NullLlmClient();
      }
      const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
      logger.log(
        `🤖 [LlmModule.factory] provider=anthropic model=${model} → AnthropicClient active`,
      );
      return new AnthropicClient({
        apiKey,
        model,
        timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? 4000),
      });
    }
    logger.log(
      `🤖 [LlmModule.factory] LLM_PROVIDER=${provider} → NullLlmClient (deterministic template, no API call)`,
    );
    return new NullLlmClient();
  },
};

@Module({
  providers: [llmProvider],
  exports: [LLM_CLIENT],
})
export class LlmModule {}
