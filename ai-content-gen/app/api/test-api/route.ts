import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const runtime = 'nodejs';

type Provider = 'openai' | 'anthropic' | 'google';

type RequestBody = {
  apiKey?: string;
  provider?: Provider;
  model?: string;
};

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-haiku-latest';
    case 'google':
      return 'gemini-1.5-flash';
  }
}

function getModelInstance(provider: Provider, apiKey: string, modelName?: string) {
  const resolvedModel = modelName || getDefaultModel(provider);

  if (provider === 'openai') {
    const openai = createOpenAI({ apiKey });
    return { model: openai(resolvedModel), provider, resolvedModel } as const;
  }

  if (provider === 'anthropic') {
    const anthropic = createAnthropic({ apiKey });
    return { model: anthropic(resolvedModel), provider, resolvedModel } as const;
  }

  // google
  const google = createGoogleGenerativeAI({ apiKey });
  return { model: google(resolvedModel), provider, resolvedModel } as const;
}

type NormalizedError = {
  status?: number;
  code?: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractError(err: unknown): NormalizedError {
  if (isRecord(err)) {
    const statusCandidate = (('status' in err ? err.status : undefined) ?? ('statusCode' in err ? err.statusCode : undefined));
    const status = typeof statusCandidate === 'number' ? statusCandidate : undefined;

    const nestedError = isRecord(err.error) ? err.error : undefined;
    const codeRaw = (('code' in err ? err.code : undefined) ?? (nestedError && 'code' in nestedError ? nestedError.code : undefined));
    const code = typeof codeRaw === 'string' ? codeRaw : undefined;

    const messageRaw = (('message' in err ? err.message : undefined) ?? (nestedError && 'message' in nestedError ? nestedError.message : undefined));
    const message = typeof messageRaw === 'string' ? messageRaw : String(err);

    return { status, code, message };
  }
  return { message: String(err) };
}

function mapErrorToStatusAndMessage(err: unknown) {
  // Attempt to normalize common provider error shapes
  const { status, code, message } = extractError(err);
  const text = message.toLowerCase();

  // Invalid API key
  if (status === 401 || code === 'invalid_api_key' || text.includes('invalid api key') || text.includes('unauthorized')) {
    return { status: 400, message: 'Invalid API key' } as const;
  }

  // Rate limit
  if (status === 429 || code === 'rate_limit_exceeded' || text.includes('rate limit')) {
    // Requirement mentions 400/500; report as 500 with clear message
    return { status: 500, message: 'API rate limit exceeded' } as const;
  }

  // Quota / billing
  if (text.includes('quota') || text.includes('billing')) {
    return { status: 500, message: 'API quota exceeded or billing issue' } as const;
  }

  // Network/DNS/Timeout
  if (text.includes('network') || text.includes('timed out') || text.includes('fetch failed') || text.includes('dns')) {
    return { status: 500, message: 'Network error connecting to provider' } as const;
  }

  // Fallback
  return { status: 500, message: 'Unknown error validating API key' } as const;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: RequestBody;
  try {
    body = await req.json();
  } catch (err) {
    console.error('[test-api] Invalid JSON body', { err });
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const apiKey = (body?.apiKey || '').trim();
  const provider: Provider = (body?.provider as Provider) || 'openai';
  const modelOverride = body?.model?.trim() || undefined;

  if (!apiKey) {
    console.warn('[test-api] Missing apiKey in request');
    return Response.json({ ok: false, error: 'Missing apiKey' }, { status: 400 });
  }

  try {
    const { model, resolvedModel } = getModelInstance(provider, apiKey, modelOverride);

    // Minimal connectivity check: tiny generation
    const { finishReason } = await generateText({
      model,
      prompt: 'ping',
    });

    const durationMs = Date.now() - startedAt;
    console.info('[test-api] Validation success', { provider, model: resolvedModel, finishReason, durationMs });

    return Response.json(
      {
        ok: true,
        provider,
        model: resolvedModel,
        message: 'API key is valid',
        responseMs: durationMs,
      },
      { status: 200 },
    );
  } catch (err) {
    const mapped = mapErrorToStatusAndMessage(err);
    const durationMs = Date.now() - startedAt;

    // Log detailed error without leaking the API key
    const normalized = extractError(err);
    console.error('[test-api] Validation failure', {
      provider,
      model: modelOverride || getDefaultModel(provider),
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      durationMs,
    });

    return Response.json(
      {
        ok: false,
        provider,
        error: mapped.message,
        details: extractError(err).message || 'Unknown error',
      },
      { status: mapped.status },
    );
  }
}

