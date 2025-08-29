import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { getModelFromProvider, type Provider } from '@/lib/ai-providers';
import { parseJsonObject } from '@/lib/utils';
import { validateKeywordResearch, validateContentBrief, type KeywordResearchData } from '@/lib/pipeline-validation';

export const runtime = 'nodejs';

type RequestBody = {
  research?: KeywordResearchData;
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

  if (!body?.research) {
    return Response.json({ ok: false, error: 'Missing research' }, { status: 400 });
  }

  // Data integrity: ensure Step 1 output is valid
  let research: KeywordResearchData;
  try {
    research = validateKeywordResearch(body.research);
  } catch (e) {
    return Response.json({ ok: false, error: `Invalid Step 1 input: ${(e as Error).message}` }, { status: 400 });
  }

  const provider: Provider = body.provider || 'openai';
  const model = body.model;
  const apiKey = body.apiKey;

  try {
    const { model: aiModel, resolvedModelName } = getModelFromProvider(provider, apiKey, model);

    const prompt = `You are a world-class content strategist. Based on the provided keyword research, produce STRICT JSON only with keys:
{
  "audienceProfile": {
    "description": string,
    "painPoints": string[],
    "goals": string[]
  },
  "contentStrategy": {
    "uniqueAngle": string,
    "structureApproach": string,
    "toneAndStyle": string
  },
  "successMetrics": string[]
}
Rules:
- Return ONLY JSON. No extra text.
- Tailor to the given research context.
- Use concrete, actionable language.`;

    const { text } = await generateText({
      model: aiModel,
      prompt: `${prompt}\n\nResearch JSON:\n${JSON.stringify(research, null, 2)}`,
    });

    const raw = parseJsonObject(text) as unknown;
    const validated = validateContentBrief(raw);

    return Response.json({ ok: true, provider, model: resolvedModelName, result: validated }, { status: 200 });
  } catch (err) {
    const message = (err as Error)?.message || 'Unknown error';
    const status = /missing api key/i.test(message) ? 400 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}

