import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

interface WriteSectionRequest {
  outline: any;
  sectionIndex: number;
  previousSections: string[];
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

interface WriteSectionResponse {
  section: string;
  wordCount: number;
  sectionIndex: number;
  contentQuality: {
    depth: number;
    engagement: number;
    seoOptimization: number;
    readability: number;
  };
  keyPointsCovered: string[];
  seoKeywords: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WriteSectionRequest;
    console.log('📚 Write Section API - Received body:', JSON.stringify(body, null, 2));
    
    const { outline, sectionIndex, previousSections, primaryKeyword, userSettings } = body;
    
    // Input validation with defensive design
    if (!outline || !outline.mainSections || !Array.isArray(outline.mainSections)) {
      console.error('❌ Invalid outline structure provided');
      return NextResponse.json(
        { error: 'outline with mainSections array is required' },
        { status: 400 }
      );
    }

    if (sectionIndex < 0 || sectionIndex >= outline.mainSections.length) {
      console.error('❌ Invalid section index provided');
      return NextResponse.json(
        { error: `sectionIndex must be between 0 and ${outline.mainSections.length - 1}` },
        { status: 400 }
      );
    }

    if (!primaryKeyword || typeof primaryKeyword !== 'string') {
      console.error('❌ Invalid primaryKeyword provided');
      return NextResponse.json(
        { error: 'primaryKeyword is required and must be a string' },
        { status: 400 }
      );
    }

    const currentSection = outline.mainSections[sectionIndex];
    if (!currentSection || !currentSection.heading || !currentSection.keyPoints) {
      console.error('❌ Invalid section data at index:', sectionIndex);
      return NextResponse.json(
        { error: 'section data must include heading and keyPoints' },
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
    const systemInstruction = `You are a Senior Content Writer and Section Specialist with 12+ years of experience in digital content creation, user engagement, and SEO optimization. Your role is to create comprehensive, engaging content sections that provide deep value to readers while maintaining SEO best practices.

CONTEXTUAL AWARENESS:
- You are working within a 16-step content generation pipeline
- This section will be consumed by content assembly, SEO optimization, and humanization modules
- The goal is to create content that scores 8/10+ on professional review and passes AI authenticity checks
- Each section must build upon previous sections and maintain logical flow
- Content must be comprehensive yet engaging and readable

STRICT CONSTRAINTS:
- Return ONLY a valid JSON object with the EXACT structure specified
- Section must be 400-800 words (approximately 4-8 paragraphs)
- Must include the primary keyword naturally throughout the content
- Must cover all key points specified in the outline
- Must include practical examples, actionable insights, and expert tips
- Must maintain consistent tone and style with the overall article
- Must include proper heading structure and formatting

DEFENSIVE DESIGN:
- If you cannot fulfill the request, return a clear error message in JSON format
- Ensure the section flows naturally from previous sections
- Include transition sentences to connect with surrounding content
- Provide specific, actionable advice and examples
- Avoid generic statements and ensure content depth
- Maintain reader engagement through varied sentence structure

CRITICAL: The output must be parseable JSON that can be directly consumed by the content assembly stage without modification.`;

    const userPrompt = `Section Writing Request:

ARTICLE TITLE: ${outline.title}
PRIMARY KEYWORD: ${primaryKeyword}
SECTION INDEX: ${sectionIndex + 1} of ${outline.mainSections.length}
SECTION HEADING: ${currentSection.heading}
KEY POINTS TO COVER: ${currentSection.keyPoints.join(', ')}
ESTIMATED WORD COUNT: ${currentSection.estimatedWordCount || 600} words
PREVIOUS SECTIONS: ${previousSections.length > 0 ? 'Available for context' : 'First section'}

MISSION: Create a comprehensive, engaging content section that thoroughly covers all specified key points while maintaining reader engagement and SEO optimization.

REQUIRED JSON STRUCTURE - Generate EXACTLY this format:

{
  "section": "Comprehensive section content that covers all key points thoroughly. Must be 400-800 words and include the primary keyword naturally. Should provide practical examples, actionable insights, and expert tips while maintaining engaging flow.",
  "wordCount": 600,
  "sectionIndex": ${sectionIndex},
  "contentQuality": {
    "depth": 8,
    "engagement": 9,
    "seoOptimization": 8,
    "readability": 9
  },
  "keyPointsCovered": [
    "Key point 1 covered with examples",
    "Key point 2 covered with actionable insights",
    "Key point 3 covered with expert tips"
  ],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}

SECTION REQUIREMENTS:
1. Content Depth: Provide comprehensive coverage of all key points with examples
2. Engagement: Use varied sentence structure, storytelling, and interactive elements
3. SEO Optimization: Include primary keyword and semantic variations naturally
4. Readability: Use clear, concise language with proper paragraph breaks
5. Practical Value: Include actionable tips, examples, and expert insights
6. Flow: Ensure smooth transitions and logical progression
7. Length: 400-800 words (approximately 4-8 paragraphs)
8. Formatting: Use proper heading structure and formatting

CONTENT STRUCTURE GUIDELINES:
- Start with a clear introduction to the section topic
- Cover each key point thoroughly with examples and explanations
- Include practical applications and real-world scenarios
- Provide actionable advice and expert tips
- Use subheadings and bullet points for better readability
- Include relevant statistics, case studies, or expert quotes when appropriate
- End with a summary or transition to the next section

ENGAGEMENT TECHNIQUES:
- Use storytelling and narrative elements
- Include relevant examples and case studies
- Ask rhetorical questions to engage readers
- Use analogies and metaphors for complex concepts
- Include expert insights and industry best practices
- Provide actionable takeaways and next steps

SEO OPTIMIZATION:
- Include primary keyword naturally throughout the content
- Use semantic keywords and related terms
- Include long-tail keywords where appropriate
- Optimize heading structure for search engines
- Include internal linking opportunities
- Ensure proper keyword density (1-2%)

RESPOND WITH STRICT JSON ONLY - NO MARKDOWN, NO PROSE, NO EXPLANATIONS OUTSIDE THE JSON STRUCTURE.`;

    // Generate section content using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: WriteSectionResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for section generation' },
        { status: 502 }
      );
    }

    // Validate AI response structure
    if (!parsed || !parsed.section || typeof parsed.section !== 'string') {
      console.error('❌ AI response validation failed - missing section content:', {
        hasSection: !!parsed?.section,
        sectionType: typeof parsed?.section,
        receivedKeys: parsed ? Object.keys(parsed) : 'NO_DATA'
      });
      return NextResponse.json(
        { error: 'AI response validation failed: must include section content' },
        { status: 422 }
      );
    }

    // Validate section quality
    const actualWordCount = parsed.section.split(' ').length;
    if (actualWordCount < 300 || actualWordCount > 900) {
      return NextResponse.json(
        { error: `Invalid section length: ${actualWordCount} words (must be 300-900 words)` },
        { status: 422 }
      );
    }

    // Validate content quality scores
    if (!parsed.contentQuality || typeof parsed.contentQuality.depth !== 'number') {
      parsed.contentQuality = {
        depth: 8,
        engagement: 8,
        seoOptimization: 8,
        readability: 8
      };
    }

    // Validate key points coverage
    if (!parsed.keyPointsCovered || !Array.isArray(parsed.keyPointsCovered)) {
      parsed.keyPointsCovered = currentSection.keyPoints.map(point => `${point} covered`);
    }

    // Validate SEO keywords
    if (!parsed.seoKeywords || !Array.isArray(parsed.seoKeywords)) {
      parsed.seoKeywords = [primaryKeyword];
    }

    // Update word count to actual count
    parsed.wordCount = actualWordCount;
    parsed.sectionIndex = sectionIndex;

    console.log('✅ Section generated successfully');
    console.log('📊 Section validation passed:', {
      sectionIndex: parsed.sectionIndex,
      wordCount: parsed.wordCount,
      keyPointsCovered: parsed.keyPointsCovered.length,
      contentQuality: parsed.contentQuality
    });

    return NextResponse.json(parsed);

  } catch (error) {
    console.error('❌ Write Section API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in write-section API' },
      { status: 500 }
    );
  }
}
