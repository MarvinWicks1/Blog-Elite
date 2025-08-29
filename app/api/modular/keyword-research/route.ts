import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Request payload type
interface KeywordResearchRequest {
  primaryKeyword: string;
  topic: string;
  targetAudience: string;
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

// Expected response structure from AI
interface KeywordResearchResult {
  primaryKeyword: string;
  keywordAnalysis: string;
  semanticKeywords: string[];
  longTailKeywords: string[];
  relatedQuestions: string[];
  contentGaps: string[];
  targetKeywordDensity: string; // e.g., "1.5%-2.5%"
  seoOpportunities: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as KeywordResearchRequest;

    const { primaryKeyword, topic, targetAudience, userSettings } = body || {};

    if (!primaryKeyword || !topic || !targetAudience) {
      return NextResponse.json(
        { error: 'Missing required fields: primaryKeyword, topic, targetAudience' },
        { status: 400 }
      );
    }

    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const model = userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google;

    if (provider === 'google' && !apiKey) {
      return NextResponse.json(
        { error: 'Missing Google API key in userSettings.aiSettings.apiKeys.google' },
        { status: 400 }
      );
    }

    const aiModel = await getAIModel(provider, model, apiKey as string);

    // Compose an instruction for the AI to return strict JSON only
    const systemInstruction = `You are a world-class SEO strategist. Return ONLY a valid JSON object with keys: primaryKeyword, keywordAnalysis, semanticKeywords, longTailKeywords, relatedQuestions, contentGaps, targetKeywordDensity, seoOpportunities. No prose.`;
    const userPrompt = `Perform keyword research for the following:
Primary keyword: ${primaryKeyword}
Topic: ${topic}
Target audience: ${targetAudience}

Requirements:
- Provide at least 10 semanticKeywords (array of strings)
- Provide at least 5 longTailKeywords (array of strings)
- Provide at least 5 relatedQuestions (array of strings)
- contentGaps (array of strings)
- seoOpportunities (array of strings)
- targetKeywordDensity as a percentage range string (e.g., "1.5%-2.5%")
- keywordAnalysis as a concise paragraph
Respond with strict JSON only.`;

    // Using Google Generative AI placeholder getAIModel which returns a model with .generateContent
    // Fallback if other providers are added later
    // @ts-ignore - aiModel shape depends on provider; current impl returns Google Generative Model
    const aiResult = await aiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] });

    // @ts-ignore - Accessing text() helper from Google SDK response
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: KeywordResearchResult | null = null;
    try {
      // Some models may wrap JSON in markdown fences; strip if present
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (_) {
      return NextResponse.json(
        { error: 'AI did not return valid JSON' },
        { status: 502 }
      );
    }

    // Validate structure and minimum counts
    const valid = parsed
      && typeof parsed.primaryKeyword === 'string'
      && typeof parsed.keywordAnalysis === 'string'
      && Array.isArray(parsed.semanticKeywords) && parsed.semanticKeywords.length >= 10
      && Array.isArray(parsed.longTailKeywords) && parsed.longTailKeywords.length >= 5
      && Array.isArray(parsed.relatedQuestions) && parsed.relatedQuestions.length >= 5
      && Array.isArray(parsed.contentGaps)
      && typeof parsed.targetKeywordDensity === 'string'
      && Array.isArray(parsed.seoOpportunities);

    if (!valid) {
      return NextResponse.json(
        { error: 'Validation failed: ensure minimum counts and correct structure per brief.' },
        { status: 422 }
      );
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error('Keyword Research Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during keyword research' },
      { status: 500 }
    );
  }
}


