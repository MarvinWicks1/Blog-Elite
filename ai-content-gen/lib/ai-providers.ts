import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export type Provider = 'openai' | 'anthropic' | 'google';

export function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-haiku-latest';
    case 'google':
      return 'gemini-1.5-flash';
  }
}

export function getModelFromProvider(provider: Provider, apiKey?: string, modelName?: string) {
  const resolvedModelName = modelName || getDefaultModel(provider);

  if (provider === 'openai') {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) throw new Error('Missing API key for OpenAI');
    const openai = createOpenAI({ apiKey: key });
    return { model: openai(resolvedModelName), provider, resolvedModelName } as const;
  }

  if (provider === 'anthropic') {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('Missing API key for Anthropic');
    const anthropic = createAnthropic({ apiKey: key });
    return { model: anthropic(resolvedModelName), provider, resolvedModelName } as const;
  }

  const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error('Missing API key for Google Generative AI');
  const google = createGoogleGenerativeAI({ apiKey: key });
  return { model: google(resolvedModelName), provider, resolvedModelName } as const;
}

