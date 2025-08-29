import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Input type matches the output of the keyword research route
interface KeywordResearchResult {
  primaryKeyword: string;
  keywordAnalysis: string;
  semanticKeywords: string[];
  longTailKeywords: string[];
  relatedQuestions: string[];
  contentGaps: string[];
  targetKeywordDensity: string;
  seoOpportunities: string[];
}

// Request payload for this route: keyword research plus AI config
interface ContentBriefRequest {
  keywordResearch: KeywordResearchResult;
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

// Expected AI output structure
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContentBriefRequest;

    const { keywordResearch, userSettings } = body || {};

    if (!keywordResearch) {
      return NextResponse.json(
        { error: 'Missing required field: keywordResearch (output from Expert Keyword Research step)' },
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

    const systemInstruction = `You are a world-class content strategist. Using the provided keyword research JSON, return ONLY a valid JSON object with sections: audienceProfile, contentStrategy (must include a uniqueAngle), and successMetrics. No prose.`;

    const userPrompt = `Keyword research data (JSON):\n\n${JSON.stringify(keywordResearch, null, 2)}\n\nRequirements:\n- audienceProfile: include demographics, psychographics, painPoints (array), searchIntent.\n- contentStrategy: include uniqueAngle (explicit and non-generic), outline (array of sections), toneAndStyle, internalLinks (array), externalCitations (array).\n- successMetrics: include primaryKPIs (array) and optionally secondaryKPIs/targetRankings.\nRespond with strict JSON only.`;

    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] });
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: ContentBriefResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (_) {
      return NextResponse.json(
        { error: 'AI did not return valid JSON' },
        { status: 502 }
      );
    }

    // Validation: ensure all required sections and unique angle + clear metrics
    const valid = parsed
      && parsed.audienceProfile
      && typeof parsed.audienceProfile.demographics === 'string'
      && typeof parsed.audienceProfile.psychographics === 'string'
      && Array.isArray(parsed.audienceProfile.painPoints)
      && typeof parsed.audienceProfile.searchIntent === 'string'
      && parsed.contentStrategy
      && typeof parsed.contentStrategy.uniqueAngle === 'string'
      && parsed.contentStrategy.uniqueAngle.trim().length > 0
      && Array.isArray(parsed.contentStrategy.outline)
      && typeof parsed.contentStrategy.toneAndStyle === 'string'
      && Array.isArray(parsed.contentStrategy.internalLinks)
      && Array.isArray(parsed.contentStrategy.externalCitations)
      && parsed.successMetrics
      && Array.isArray(parsed.successMetrics.primaryKPIs)
      && parsed.successMetrics.primaryKPIs.length > 0;

    if (!valid) {
      return NextResponse.json(
        { error: 'Validation failed: ensure audienceProfile, contentStrategy with uniqueAngle, and successMetrics with primaryKPIs are present.' },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error('Content Brief Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating the content brief' },
      { status: 500 }
    );
  }
}


