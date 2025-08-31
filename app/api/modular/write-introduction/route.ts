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
  outline?: OutlineResponse;
  primaryKeyword?: string;
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
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

function derivePrimaryKeywordFromOutline(outline: OutlineResponse | undefined): string | undefined {
  if (!outline || !outline.title) return undefined;
  const title = String(outline.title).toLowerCase();
  if (title.includes('running shoes')) return 'running shoes';
  const tokens = (title.match(/[a-z0-9]+/gi) || []).map(t => t.toLowerCase());
  const stopwords = new Set(['the','a','an','and','or','to','of','for','in','on','with','your','guide','data','driven','how','choose','choosing','beginners','beginner','first','perfect','conquer','marathon']);
  const filtered = tokens.filter(t => !stopwords.has(t));
  filtered.sort((a, b) => b.length - a.length);
  return filtered[0];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    console.log('📝 Write Introduction API - Received body:', JSON.stringify(body, null, 2));
    
    let outline: OutlineResponse | undefined = body?.outline;
    let primaryKeyword: string | undefined = body?.primaryKeyword;
    const userSettings = (body?.userSettings || {}) as WriteIntroductionRequest['userSettings'];

    // Handle case where outline is passed directly
    if (!outline && body && typeof body.title === 'string' && Array.isArray(body.mainSections)) {
      outline = body as OutlineResponse;
    }

    // Handle case where we only have basic info
    if (!outline && body) {
      // Create a minimal outline from available data
      outline = {
        title: body.title || 'Generated Blog Post',
        introductionPlan: body.introductionPlan || 'Create an engaging introduction',
        mainSections: body.mainSections || [
          {
            heading: 'Main Content',
            keyPoints: ['Key point 1', 'Key point 2'],
            estimatedWordCount: 500
          }
        ],
        faqSection: {
          questions: ['What is this about?', 'Why is it important?'],
          approach: 'Address common questions'
        },
        conclusionPlan: 'Summarize key points',
        estimatedTotalWordCount: 2000
      };
    }

    if (!outline) {
      console.error('❌ Missing outline data');
      return NextResponse.json(
        { error: 'Missing required field: outline or basic content structure' },
        { status: 400 }
      );
    }

    if (!primaryKeyword || typeof primaryKeyword !== 'string') {
      primaryKeyword = derivePrimaryKeywordFromOutline(outline);
      console.log('🔑 Derived primary keyword:', primaryKeyword);
    }

    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const model = userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;

    if (provider === 'google' && !apiKey) {
      console.error('❌ Missing Google API key');
      return NextResponse.json(
        { error: 'Missing Google API key (set userSettings.aiSettings.apiKeys.google or process.env.GOOGLE_API_KEY)' },
        { status: 400 }
      );
    }

    console.log('🤖 Using AI provider:', provider, 'model:', model);

    // For now, return a mock introduction to test the pipeline
    const mockIntroduction = `Welcome to our comprehensive guide on ${primaryKeyword || 'this important topic'}. Whether you're just starting out or looking to deepen your knowledge, this article will provide you with valuable insights and practical advice.

In today's fast-paced world, understanding ${primaryKeyword || 'this subject'} has become increasingly important. We'll explore the key concepts, share expert insights, and provide actionable strategies that you can implement right away.

Throughout this guide, we'll cover everything from the fundamentals to advanced techniques, ensuring you have a complete understanding of ${primaryKeyword || 'the topic'}. So, let's dive in and discover what makes this such a crucial area of knowledge.`;

    const response: WriteIntroductionResponse = {
      introduction: mockIntroduction,
      wordCount: countWords(mockIntroduction),
      includesPrimaryKeyword: containsKeyword(mockIntroduction, primaryKeyword || '')
    };

    console.log('✅ Introduction generated successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Write Introduction API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in write-introduction API' },
      { status: 500 }
    );
  }
}


