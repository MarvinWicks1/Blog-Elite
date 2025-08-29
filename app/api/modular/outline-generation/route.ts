import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Input matches content-brief output
interface ContentBriefResponse {
  audienceProfile: {
    demographics: string;
    psychographics: string;
    painPoints: string[];
    searchIntent: string;
  };
  contentStrategy: {
    uniqueAngle: string;
    outline: string[];
    toneAndStyle: string;
    internalLinks: string[];
    externalCitations: string[];
  };
  successMetrics: {
    primaryKPIs: string[];
    secondaryKPIs?: string[];
    targetRankings?: string[];
  };
}

interface OutlineGenerationRequest {
  contentBrief: ContentBriefResponse;
  userSettings?: {
    aiSettings?: {
      selectedProvider?: string;
      selectedModel?: string;
      apiKeys?: {
        google?: string;
      };
    };
  };
}

interface OutlineResponse {
  title: string;
  introductionPlan: string;
  mainSections: Array<{
    heading: string;
    keyPoints: string[];
    references?: string[];
    estimatedWordCount?: number;
  }>;
  faqSection: {
    questions: string[];
    approach: string;
  };
  conclusionPlan: string;
  estimatedTotalWordCount: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OutlineGenerationRequest;
    const { contentBrief, userSettings } = body || {};

    if (!contentBrief) {
      return NextResponse.json(
        { error: 'Missing required field: contentBrief (output from Strategic Content Brief step)' },
        { status: 400 }
      );
    }

    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const model = userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;

    if (provider === 'google' && !apiKey) {
      return NextResponse.json(
        { error: 'Missing Google API key (set userSettings.aiSettings.apiKeys.google or process.env.GOOGLE_API_KEY)' },
        { status: 400 }
      );
    }

    const aiModel = await getAIModel(provider, model, apiKey as string);

    const systemInstruction = `You are a master content editor. Using the provided content brief, create a detailed article outline. Return ONLY valid JSON with keys: title, introductionPlan, mainSections (>=3), faqSection, conclusionPlan, estimatedTotalWordCount. No prose.`;

    const userPrompt = `Content brief (JSON):\n\n${JSON.stringify(contentBrief, null, 2)}\n\nRequirements:\n- Title reflecting the unique angle.\n- introductionPlan: compelling hook and promise.\n- mainSections: at least 3 sections, each with a heading and keyPoints (array). Include optional references and estimatedWordCount per section.\n- faqSection: include questions and approach for concise answers.\n- conclusionPlan: wrap-up + call-to-action.\n- estimatedTotalWordCount: integer (must be >= 2000).\nRespond with strict JSON only.`;

    // @ts-ignore - provider specific shape
    const aiResult = await aiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] });
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: OutlineResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (_) {
      return NextResponse.json(
        { error: 'AI did not return valid JSON' },
        { status: 502 }
      );
    }

    const valid = parsed
      && typeof parsed.title === 'string'
      && typeof parsed.introductionPlan === 'string'
      && Array.isArray(parsed.mainSections) && parsed.mainSections.length >= 3
      && parsed.mainSections.every(s => typeof s.heading === 'string' && Array.isArray(s.keyPoints))
      && parsed.faqSection && Array.isArray(parsed.faqSection.questions) && typeof parsed.faqSection.approach === 'string'
      && typeof parsed.conclusionPlan === 'string'
      && typeof parsed.estimatedTotalWordCount === 'number' && parsed.estimatedTotalWordCount >= 2000;

    if (!valid) {
      return NextResponse.json(
        { error: 'Validation failed: need >=3 mainSections and estimatedTotalWordCount >= 2000 with required fields.' },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error('Outline Generation Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating the outline' },
      { status: 500 }
    );
  }
}