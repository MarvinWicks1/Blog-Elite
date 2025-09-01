import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

interface GenerateOutlineRequest {
  primaryKeyword: string;
  topic?: string;
  targetAudience?: string;
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

interface ContentOutline {
  title: string;
  introductionPlan: string;
  mainSections: Array<{
    heading: string;
    keyPoints: string[];
    references?: string[];
    estimatedWordCount?: number;
    seoKeywords?: string[];
  }>;
  faqSection: {
    questions: string[];
    approach: string;
  };
  conclusionPlan: string;
  estimatedTotalWordCount: number;
  seoOptimization: {
    primaryKeyword: string;
    semanticKeywords: string[];
    longTailKeywords: string[];
    metaDescription: string;
    titleTag: string;
  };
  contentFlow: string[];
  engagementHooks: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateOutlineRequest;
    console.log('📋 Generate Outline API - Received body:', JSON.stringify(body, null, 2));
    
    const { primaryKeyword, topic, targetAudience, userSettings } = body;
    
    // Input validation with defensive design
    if (!primaryKeyword || typeof primaryKeyword !== 'string' || primaryKeyword.trim().length === 0) {
      console.error('❌ Invalid primaryKeyword provided');
      return NextResponse.json(
        { error: 'primaryKeyword is required and must be a non-empty string' },
        { status: 400 }
      );
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
    const aiModel = await getAIModel(provider, model, apiKey as string);

    // EXPERT-LEVEL PROMPT ENGINEERING
    const systemInstruction = `You are a Senior Content Architect and SEO strategist with 12+ years of experience in content planning, user experience design, and search engine optimization. Your role is to create detailed, strategic content outlines that serve as blueprints for high-performing blog posts.

CONTEXTUAL AWARENESS:
- You are working within a 16-step content generation pipeline
- This outline will be consumed by content writing, SEO optimization, and humanization modules
- The goal is to create content that scores 8/10+ on professional review and passes AI authenticity checks
- Each section must provide clear direction for the content writing stage
- SEO optimization must be built into the outline structure

STRICT CONSTRAINTS:
- Return ONLY a valid JSON object with the EXACT structure specified
- All fields must be present and properly formatted
- Main sections must contain 4-6 sections with detailed key points
- Each section must have 3-5 key points minimum
- Estimated word counts must be realistic and add up to the total
- SEO keywords must be relevant and include semantic variations
- FAQ questions must address real user intent and pain points

DEFENSIVE DESIGN:
- If you cannot fulfill the request, return a clear error message in JSON format
- Validate that the outline provides comprehensive coverage of the topic
- Ensure logical flow and progression from basic to advanced concepts
- Include engagement hooks and content flow strategies
- Provide clear direction for each subsequent pipeline stage

CRITICAL: The output must be parseable JSON that can be directly consumed by the content writing stage without modification.`;

    const userPrompt = `Content Outline Generation Request:

PRIMARY KEYWORD: ${primaryKeyword}
TOPIC: ${topic || 'Comprehensive guide and best practices'}
TARGET AUDIENCE: ${targetAudience || 'Professionals and enthusiasts seeking expert knowledge'}

MISSION: Create a detailed content outline that will guide the creation of a high-quality, SEO-optimized blog post that scores 8/10+ on professional review and passes AI authenticity detection.

REQUIRED JSON STRUCTURE - Generate EXACTLY this format:

{
  "title": "Compelling, SEO-optimized title that includes the primary keyword",
  "introductionPlan": "Detailed plan for creating an engaging introduction that hooks readers and establishes authority",
  "mainSections": [
    {
      "heading": "Clear, descriptive section heading",
      "keyPoints": [
        "Specific key point 1",
        "Specific key point 2",
        "Specific key point 3",
        "Specific key point 4"
      ],
      "estimatedWordCount": 600,
      "seoKeywords": ["keyword1", "keyword2", "keyword3"]
    }
  ],
  "faqSection": {
    "questions": [
      "Specific user question 1",
      "Specific user question 2",
      "Specific user question 3",
      "Specific user question 4"
    ],
    "approach": "Detailed approach for answering FAQs comprehensively"
  },
  "conclusionPlan": "Detailed plan for creating a compelling conclusion with actionable next steps",
  "estimatedTotalWordCount": 2500,
  "seoOptimization": {
    "primaryKeyword": "${primaryKeyword}",
    "semanticKeywords": ["semantic1", "semantic2", "semantic3"],
    "longTailKeywords": ["long-tail1", "long-tail2", "long-tail3"],
    "metaDescription": "Compelling meta description under 160 characters",
    "titleTag": "SEO-optimized title tag under 60 characters"
  },
  "contentFlow": [
    "Flow element 1",
    "Flow element 2",
    "Flow element 3"
  ],
  "engagementHooks": [
    "Engagement hook 1",
    "Engagement hook 2",
    "Engagement hook 3"
  ]
}

OUTLINE REQUIREMENTS:
1. Title must be compelling, SEO-optimized, and include the primary keyword
2. Introduction plan must provide clear direction for hooking readers
3. Main sections must provide comprehensive topic coverage with logical progression
4. Each section must have specific, actionable key points
5. FAQ questions must address real user intent and pain points
6. Conclusion plan must provide clear direction for actionable takeaways
7. Word counts must be realistic and add up to the total
8. SEO optimization must include primary keyword and semantic variations
9. Content flow must ensure logical progression and reader engagement
10. Engagement hooks must be strategically placed throughout the content

SECTION STRUCTURE GUIDELINES:
- Start with foundational concepts and build to advanced topics
- Include practical examples and real-world applications
- Address common challenges and provide solutions
- Ensure each section provides clear value to the reader
- Maintain consistent tone and style throughout
- Include transition points between sections

RESPOND WITH STRICT JSON ONLY - NO MARKDOWN, NO PROSE, NO EXPLANATIONS OUTSIDE THE JSON STRUCTURE.`;

    // Generate content outline using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: ContentOutline | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for content outline generation' },
        { status: 502 }
      );
    }

    // Validate AI response structure
    if (!parsed || !parsed.title || !parsed.mainSections || !Array.isArray(parsed.mainSections)) {
      console.error('❌ AI response validation failed - missing core fields:', {
        hasTitle: !!parsed?.title,
        hasMainSections: !!parsed?.mainSections,
        mainSectionsIsArray: Array.isArray(parsed?.mainSections),
        receivedKeys: parsed ? Object.keys(parsed) : 'NO_DATA'
      });
      return NextResponse.json(
        { error: 'AI response validation failed: must include title and mainSections array' },
        { status: 422 }
      );
    }

    // Validate outline quality
    if (parsed.mainSections.length < 3 || parsed.mainSections.length > 8) {
      return NextResponse.json(
        { error: 'Invalid mainSections: must contain 3-8 sections' },
        { status: 422 }
      );
    }

    // Validate each section
    for (let i = 0; i < parsed.mainSections.length; i++) {
      const section = parsed.mainSections[i];
      if (!section.heading || !section.keyPoints || !Array.isArray(section.keyPoints)) {
        return NextResponse.json(
          { error: `Invalid section ${i + 1}: must include heading and keyPoints array` },
          { status: 422 }
        );
      }
      
      if (section.keyPoints.length < 3) {
        return NextResponse.json(
          { error: `Invalid section ${i + 1}: must include at least 3 key points` },
          { status: 422 }
        );
      }
    }

    // Validate FAQ section
    if (!parsed.faqSection || !parsed.faqSection.questions || !Array.isArray(parsed.faqSection.questions)) {
      return NextResponse.json(
        { error: 'Invalid faqSection: must include questions array' },
        { status: 422 }
      );
    }

    if (parsed.faqSection.questions.length < 3) {
      return NextResponse.json(
        { error: 'Invalid faqSection: must include at least 3 questions' },
        { status: 422 }
      );
    }

    // Validate word count
    if (parsed.estimatedTotalWordCount < 1500 || parsed.estimatedTotalWordCount > 5000) {
      return NextResponse.json(
        { error: 'Invalid estimatedTotalWordCount: must be between 1500-5000 words' },
        { status: 422 }
      );
    }

    console.log('✅ Content outline generated successfully');
    console.log('📊 Outline validation passed:', {
      hasTitle: true,
      mainSectionsCount: parsed.mainSections.length,
      faqQuestionsCount: parsed.faqSection.questions.length,
      estimatedTotalWordCount: parsed.estimatedTotalWordCount
    });

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('❌ Generate Outline API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in generate-outline API' },
      { status: 500 }
    );
  }
}
