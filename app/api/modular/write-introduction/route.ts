import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

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

interface WriteIntroductionRequest {
  outline: OutlineResponse;
  primaryKeyword: string;
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

interface WriteIntroductionResponse {
  introduction: string;
  wordCount: number;
  includesPrimaryKeyword: boolean;
}

function countWords(text: string): number {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(' ').length;
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return false;
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WriteIntroductionRequest;
    const { outline, primaryKeyword, userSettings } = body || {};

    if (!outline) {
      return NextResponse.json(
        { error: 'Missing required field: outline (output from Outline Generation step)' },
        { status: 400 }
      );
    }

    if (!primaryKeyword || typeof primaryKeyword !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: primaryKeyword' },
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

    const systemInstruction = `You are a compelling copywriter. Write only the article introduction text, not headings. The introduction must:
- Open with a strong hook tailored to the topic and audience.
- Clearly state the value proposition.
- Preview the content based on the outline.
- Integrate the primary keyword naturally (no stuffing).
- Aim for 230–270 words (hard limit 200–300 words).
Return ONLY the introduction paragraph(s) as plain text. No JSON, no markdown fences, no headings.`;

    const userPrompt = `Outline JSON:\n\n${JSON.stringify(outline, null, 2)}\n\nPrimary keyword: ${primaryKeyword}\n\nWrite the introduction now.`;

    // @ts-ignore - provider-specific model shape (Google Generative AI)
    const aiResult = await aiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] });
    // @ts-ignore - Google SDK response helper
    let introduction: string = aiResult?.response?.text?.() || '';
    introduction = introduction.trim().replace(/^```(?:markdown|md|text)?\n?|```$/g, '').trim();

    // Validate and optionally repair once
    let wordCount = countWords(introduction);
    let hasKeyword = containsKeyword(introduction, primaryKeyword);

    const withinRange = (n: number) => n >= 200 && n <= 300;
    let valid = withinRange(wordCount) && hasKeyword;

    if (!valid) {
      const issues: string[] = [];
      if (!withinRange(wordCount)) issues.push('Word count must be between 200 and 300 words');
      if (!hasKeyword) issues.push('Include the primary keyword naturally');

      const repairInstruction = `Your previous introduction did not meet constraints. Rewrite ONLY the introduction text. Constraints:\n- 200–300 words (target ~240).\n- Include the exact primary keyword naturally at least once.\n- Strong hook, clear value proposition, preview of sections from outline.\n- No headings, no lists, no markdown, plain text only.`;
      const repairPrompt = `Primary keyword: ${primaryKeyword}\n\nOutline (JSON):\n${JSON.stringify(outline, null, 2)}\n\nIssues to fix:\n- ${issues.join('\n- ')}\n\nRewrite now as plain text.`;

      // @ts-ignore
      const repairResult = await aiModel.generateContent({ contents: [{ role: 'user', parts: [{ text: `${repairInstruction}\n\n${repairPrompt}` }] }] });
      // @ts-ignore
      let repairText: string = repairResult?.response?.text?.() || '';
      repairText = repairText.trim().replace(/^```(?:markdown|md|text)?\n?|```$/g, '').trim();

      const repairWordCount = countWords(repairText);
      const repairHasKeyword = containsKeyword(repairText, primaryKeyword);

      if (withinRange(repairWordCount) && repairHasKeyword) {
        introduction = repairText;
        wordCount = repairWordCount;
        hasKeyword = repairHasKeyword;
        valid = true;
      }
    }

    if (!valid) {
      return NextResponse.json(
        { error: 'Validation failed: introduction must be 200–300 words and include the primary keyword naturally.' },
        { status: 422 }
      );
    }

    const response: WriteIntroductionResponse = {
      introduction,
      wordCount,
      includesPrimaryKeyword: hasKeyword,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Write Introduction Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while writing the introduction' },
      { status: 500 }
    );
  }
}


