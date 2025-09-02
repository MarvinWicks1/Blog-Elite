import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { getModelFromProvider, type Provider } from '@/lib/ai-providers';
import { parseJsonObject } from '@/lib/utils';
import { validateKeywordResearch } from '@/lib/pipeline-validation';

export const runtime = 'nodejs';

type RequestBody = {
  keyword?: string;
  topic?: string;
  provider?: Provider;
  apiKey?: string;
  model?: string;
};

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const keyword = (body.keyword || '').trim();
  const topic = (body.topic || '').trim();
  const provider: Provider = body.provider || 'openai';
  const model = body.model;
  const apiKey = body.apiKey;

  if (!keyword || !topic) {
    return Response.json({ ok: false, error: 'Missing keyword or topic' }, { status: 400 });
  }

  try {
    const { model: aiModel, resolvedModelName } = getModelFromProvider(provider, apiKey, model);

    const prompt = `You are a world-class SEO strategist with 15+ years of experience. Given a primary keyword and topic, produce STRICT JSON only with these keys: 
{
  "semanticKeywords": string[] (at least 10),
  "longTailKeywords": string[] (at least 5),
  "relatedQuestions": string[] (at least 5),
  "contentGaps": string[]
}
Rules:
- Return ONLY JSON. No extra commentary.
- Provide diverse, non-duplicated items, specific to the topic and keyword.
- Use natural language strings.`;

    const { text } = await generateText({
      model: aiModel,
      prompt: `${prompt}\n\nPrimary Keyword: ${keyword}\nTopic: ${topic}`,
    });

    const raw = parseJsonObject(text) as unknown;
    const validated = validateKeywordResearch({ ...(raw as object), keyword, topic });

    return Response.json({ ok: true, provider, model: resolvedModelName, result: validated }, { status: 200 });
  } catch (err) {
    const message = (err as Error)?.message || 'Unknown error';
    const status = /missing api key/i.test(message) ? 400 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}

