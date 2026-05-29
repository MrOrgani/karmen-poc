export const LLM_CLIENT = Symbol('LLM_CLIENT');

export type LlmGenerateInput = {
  system: string;
  user: string;
  signal?: AbortSignal;
};

export interface LlmClient {
  /**
   * Génère du texte. Renvoie `null` pour signaler au service d'utiliser le fallback template
   * (provider désactivé, quota épuisé, timeout, erreur réseau).
   */
  generate(input: LlmGenerateInput): Promise<string | null>;
}

/** Provider désactivé : force le fallback template côté service. */
export class NullLlmClient implements LlmClient {
  generate(): Promise<string | null> {
    return Promise.resolve(null);
  }
}
