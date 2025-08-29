import { NextRequest } from 'next/server';
import { generateText } from 'ai';
import { getModelFromProvider, type Provider } from '@/lib/ai-providers';
import { parseJsonObject } from '@/lib/utils';
import { validateContentBrief, validateOutline, type ContentBriefData } from '@/lib/pipeline-validation';

export const runtime = 'nodejs';

type RequestBody = {
  brief?: ContentBriefData;
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

  if (!body?.brief) {
    return Response.json({ ok: false, error: 'Missing brief' }, { status: 400 });
  }

  // Data integrity: ensure Step 2 output is valid
  let brief: ContentBriefData;
  try {
    brief = validateContentBrief(body.brief);
  } catch (e) {
    return Response.json({ ok: false, error: `Invalid Step 2 input: ${(e as Error).message}` }, { status: 400 });
  }

  const provider: Provider = body.provider || 'openai';
  const model = body.model;
  const apiKey = body.apiKey;

  try {
    const { model: aiModel, resolvedModelName } = getModelFromProvider(provider, apiKey, model);

    const prompt = `You are a master content editor and outline specialist. Based on the content brief, produce STRICT JSON only with keys:
{
  "title": string,
  "introductionPlan": string,
  "mainSections": Array<{ "heading": string, "summary": string, "keyPoints": string[] }>,
  "faqPlan": string[],
  "conclusionPlan": string,
  "estimatedWordCount": number
}
Rules:
- Return ONLY JSON. No commentary.
- Provide at least 3 mainSections.
- Set estimatedWordCount to 2000 or more.
- Ensure keyPoints are concrete and non-duplicative.`;

    const { text } = await generateText({
      model: aiModel,
      prompt: `${prompt}\n\nContent Brief JSON:\n${JSON.stringify(brief, null, 2)}`,
    });

    const raw = parseJsonObject(text) as unknown;
    const validated = validateOutline(raw);

    return Response.json({ ok: true, provider, model: resolvedModelName, result: validated }, { status: 200 });
  } catch (err) {
    const message = (err as Error)?.message || 'Unknown error';
    const status = /missing api key/i.test(message) ? 400 : 500;
    return Response.json({ ok: false, error: message }, { status });
  }
}

