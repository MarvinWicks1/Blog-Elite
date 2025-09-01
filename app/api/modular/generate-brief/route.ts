import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

interface GenerateBriefRequest {
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

interface ContentBrief {
  title: string;
  summary: string;
  targetAudience: string;
  keyObjectives: string[];
  contentStructure: string[];
  tone: string;
  estimatedWordCount: number;
  seoFocus: string;
  callToAction: string;
  contentGaps: string[];
  competitiveAnalysis: string;
  successMetrics: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBriefRequest;
    console.log('📋 Generate Brief API - Received body:', JSON.stringify(body, null, 2));
    
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
    const systemInstruction = `You are a Senior Content Strategist and SEO expert with 15+ years of experience in digital marketing, content planning, and audience engagement. Your role is to create comprehensive, strategic content briefs that serve as the foundation for high-performing blog posts.

CONTEXTUAL AWARENESS:
- You are working within a 16-step content generation pipeline
- This brief will be consumed by outline generation, content writing, and SEO optimization modules
- The goal is to create content that scores 8/10+ on professional review and passes AI authenticity checks
- Target audience engagement and search engine optimization are equally important

STRICT CONSTRAINTS:
- Return ONLY a valid JSON object with the EXACT structure specified
- All fields must be present and properly formatted
- Arrays must contain 3-5 items minimum
- Estimated word count must be between 2000-4000 words
- Tone must be one of: "Professional yet accessible", "Conversational and engaging", "Authoritative and expert", "Friendly and approachable"
- SEO focus must include the primary keyword and 2-3 semantic variations

DEFENSIVE DESIGN:
- If you cannot fulfill the request, return a clear error message in JSON format
- Validate that the primary keyword is appropriate for content creation
- Ensure the brief provides actionable direction for all subsequent pipeline stages
- Include content gaps analysis to identify unique value propositions

CRITICAL: The output must be parseable JSON that can be directly consumed by the next pipeline stage without modification.`;

    const userPrompt = `Content Brief Generation Request:

PRIMARY KEYWORD: ${primaryKeyword}
TOPIC: ${topic || 'Comprehensive guide and best practices'}
TARGET AUDIENCE: ${targetAudience || 'Professionals and enthusiasts seeking expert knowledge'}

MISSION: Create a comprehensive content brief that will guide the creation of a high-quality, SEO-optimized blog post that scores 8/10+ on professional review and passes AI authenticity detection.

REQUIRED JSON STRUCTURE - Generate EXACTLY this format:

{
  "title": "Compelling, SEO-optimized title that includes the primary keyword",
  "summary": "2-3 sentence summary that hooks the reader and explains the value proposition",
  "targetAudience": "Detailed description of the intended audience with specific characteristics",
  "keyObjectives": [
    "Primary objective 1",
    "Primary objective 2", 
    "Primary objective 3",
    "Primary objective 4"
  ],
  "contentStructure": [
    "Introduction and overview",
    "Core concepts and fundamentals",
    "Practical applications and examples",
    "Advanced techniques and optimization",
    "Common challenges and solutions",
    "FAQ section for user questions",
    "Conclusion with actionable next steps"
  ],
  "tone": "Professional yet accessible",
  "estimatedWordCount": 2500,
  "seoFocus": "Primary keyword with semantic variations",
  "callToAction": "Specific, actionable next step for readers",
  "contentGaps": [
    "Identified content gap 1",
    "Identified content gap 2",
    "Identified content gap 3"
  ],
  "competitiveAnalysis": "Brief analysis of existing content and unique positioning",
  "successMetrics": [
    "Engagement metric 1",
    "SEO metric 1",
    "Conversion metric 1",
    "Quality metric 1"
  ]
}

CONTENT BRIEF REQUIREMENTS:
1. Title must be compelling and include the primary keyword naturally
2. Summary must clearly communicate value and hook the reader
3. Target audience must be specific and actionable
4. Key objectives must align with user intent and business goals
5. Content structure must provide logical flow and comprehensive coverage
6. Tone must match the target audience and content type
7. Word count must be appropriate for the topic complexity
8. SEO focus must include primary keyword and semantic variations
9. Call to action must be specific and actionable
10. Content gaps must identify unique value propositions
11. Competitive analysis must inform positioning strategy
12. Success metrics must be measurable and relevant

RESPOND WITH STRICT JSON ONLY - NO MARKDOWN, NO PROSE, NO EXPLANATIONS OUTSIDE THE JSON STRUCTURE.`;

    // Generate content brief using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: ContentBrief | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for content brief generation' },
        { status: 502 }
      );
    }

    // Validate AI response structure
    if (!parsed || !parsed.title || !parsed.summary || !parsed.keyObjectives) {
      console.error('❌ AI response validation failed - missing core fields:', {
        hasTitle: !!parsed?.title,
        hasSummary: !!parsed?.summary,
        hasKeyObjectives: !!parsed?.keyObjectives,
        receivedKeys: parsed ? Object.keys(parsed) : 'NO_DATA'
      });
      return NextResponse.json(
        { error: 'AI response validation failed: must include title, summary, and keyObjectives' },
        { status: 422 }
      );
    }

    // Validate content brief quality
    if (parsed.estimatedWordCount < 1500 || parsed.estimatedWordCount > 5000) {
      return NextResponse.json(
        { error: 'Invalid estimatedWordCount: must be between 1500-5000 words' },
        { status: 422 }
      );
    }

    if (!parsed.keyObjectives || parsed.keyObjectives.length < 3) {
      return NextResponse.json(
        { error: 'Invalid keyObjectives: must include at least 3 objectives' },
        { status: 422 }
      );
    }

    if (!parsed.contentStructure || parsed.contentStructure.length < 5) {
      return NextResponse.json(
        { error: 'Invalid contentStructure: must include at least 5 structure elements' },
        { status: 422 }
      );
    }

    console.log('✅ Content brief generated successfully');
    console.log('📊 Brief validation passed:', {
      hasTitle: true,
      hasSummary: true,
      keyObjectivesCount: parsed.keyObjectives.length,
      contentStructureCount: parsed.contentStructure.length,
      estimatedWordCount: parsed.estimatedWordCount
    });

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('❌ Generate Brief API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in generate-brief API' },
      { status: 500 }
    );
  }
}
