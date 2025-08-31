import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Input types for the AI authenticity review
interface CompleteArticle {
  title: string;
  introduction: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  conclusion: string;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  seoOptimization?: {
    metaDescription: string;
    keywords: string[];
    titleTag: string;
  };
  images?: Array<{
    description: string;
    altText: string;
    placement: string;
  }>;
}

// Request payload for this route
interface AIAuthenticityReviewRequest {
  content: string;
  primaryKeyword?: string;
  completeArticle?: CompleteArticle;
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

// Expected AI output structure for authenticity review - UPDATED to match pipeline expectations
interface AIAuthenticityReviewResponse {
  authenticityScore: number; // 0-100, where 100 is completely human-like
  humanLikeness: number; // 0-100, how human-like the content appears
  originalityScore: number; // 0-100, how original and unique the content is
  feedback: string[]; // List of feedback points
  improvements: string[]; // List of improvement suggestions
  authenticityMarkers: {
    hasPersonalExamples: boolean;
    variedVocabulary: boolean;
    naturalTransitions: boolean;
    uniqueInsights: boolean;
  };
  humanizationRecommendations: {
    critical: string[]; // Must-fix items for authenticity
    important: string[]; // Should-fix items
    optional: string[]; // Nice-to-have improvements
    specificExamples: string[]; // Concrete examples of changes
  };
  overallAssessment: {
    summary: string;
    authenticityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    publicationReadiness: boolean;
    requiredActions: string[];
  };
  // ADDED: riskAssessment field that the pipeline might expect
  riskAssessment: {
    aiDetectionRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 AI Authenticity Review API: Starting process');
    
    const body = (await req.json()) as AIAuthenticityReviewRequest;
    console.log('📋 AI Authenticity Review Input Validation:', {
      hasContent: !!body.content,
      hasCompleteArticle: !!body.completeArticle,
      hasPrimaryKeyword: !!body.primaryKeyword,
      contentLength: body.content?.length || 0
    });
    
    const { content, primaryKeyword, completeArticle, userSettings } = body;
    
    // Validate required inputs
    if (!content && !completeArticle) {
      console.error('❌ AI Authenticity Review: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: either content or completeArticle must be provided' },
        { status: 400 }
      );
    }

    // Prepare content for analysis
    let contentForAnalysis = '';
    if (completeArticle) {
      contentForAnalysis = `
TITLE: ${completeArticle.title}

INTRODUCTION:
${completeArticle.introduction || 'No introduction provided'}

SECTIONS:
${completeArticle.sections.map((section, index) => 
  `${index + 1}. ${section.title}\n${section.content}`
).join('\n\n')}

CONCLUSION:
${completeArticle.conclusion || 'No conclusion provided'}

FAQ:
${completeArticle.faq ? completeArticle.faq.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n') : 'No FAQ provided'}

SEO OPTIMIZATION:
${completeArticle.seoOptimization ? 
  `Meta Description: ${completeArticle.seoOptimization.metaDescription}\nKeywords: ${completeArticle.seoOptimization.keywords.join(', ')}\nTitle Tag: ${completeArticle.seoOptimization.titleTag}` : 
  'No SEO optimization provided'}

IMAGES:
${completeArticle.images ? 
  completeArticle.images.map(img => `${img.placement}: ${img.description} (Alt: ${img.altText})`).join('\n') : 
  'No images provided'}
`;
    } else {
      contentForAnalysis = content;
    }

    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const model = userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;

    console.log('🔑 AI Authenticity Review: API Configuration:', {
      provider,
      model,
      hasGoogleApiKey: !!apiKey
    });

    if (provider === 'google' && !apiKey) {
      console.error('❌ AI Authenticity Review: Missing Google API key');
      return NextResponse.json(
        { error: 'Missing Google API key (set userSettings.aiSettings.apiKeys.google or process.env.GOOGLE_API_KEY)' },
        { status: 400 }
      );
    }

    console.log('🤖 AI Authenticity Review: Initializing AI model');
    const aiModel = await getAIModel(provider, model, apiKey as string);

    // IMPROVED: More strict and explicit system instruction
    const systemInstruction = `You are Dr. Sarah Chen, a leading AI detection specialist and computational linguist with 15 years of experience in natural language processing, AI content analysis, and authenticity verification. You have developed advanced algorithms for detecting AI-generated content and have consulted with major publishing platforms on content authenticity standards.

Your role is to analyze the submitted content for AI-like patterns and provide a comprehensive authenticity assessment. You must be thorough, objective, and provide specific, actionable recommendations for humanization.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object - no markdown, no prose, no explanations
2. The response must be parseable by JSON.parse() without any preprocessing
3. Follow the exact structure specified in the prompt
4. All required fields must be present and properly formatted
5. Scores must be numbers between 0-100
6. Arrays must contain at least one item
7. Boolean values must be true or false
8. Enums must match exactly specified values

If you cannot generate valid JSON, return a simple error message.`;

    // IMPROVED: More structured and demanding user prompt
    const userPrompt = `AI Authenticity Review Request:

Please analyze the following content for AI-generated content patterns and provide a comprehensive authenticity assessment using the expertise of Dr. Sarah Chen, AI detection specialist.

CONTENT TO ANALYZE:
${contentForAnalysis}

PRIMARY KEYWORD: ${primaryKeyword || 'Not specified'}

REQUIRED JSON STRUCTURE - Generate EXACTLY this format:

{
  "authenticityScore": 85,
  "humanLikeness": 88,
  "originalityScore": 92,
  "feedback": [
    "Content shows natural human writing patterns",
    "Varied sentence structures detected",
    "Personal insights and examples included",
    "Conversational tone maintained"
  ],
  "improvements": [
    "Enhanced personal anecdotes",
    "Added unique perspectives",
    "Improved natural language flow",
    "Strengthened human voice"
  ],
  "authenticityMarkers": {
    "hasPersonalExamples": true,
    "variedVocabulary": true,
    "naturalTransitions": true,
    "uniqueInsights": true
  },
  "humanizationRecommendations": {
    "critical": ["Reduce repetition of technical terms"],
    "important": ["Add more conversational transitions"],
    "optional": ["Include personal anecdotes"],
    "specificExamples": ["Replace 'utilize' with 'use' in paragraph 3"]
  },
  "overallAssessment": {
    "summary": "The content shows strong human-like qualities with natural language flow and engaging tone, though some repetitive patterns could be improved.",
    "authenticityGrade": "B",
    "publicationReadiness": true,
    "requiredActions": ["Reduce repetitive language", "Improve section transitions"]
  },
  "riskAssessment": {
    "aiDetectionRisk": "medium",
    "riskFactors": ["Some repetitive language patterns", "Technical terminology overuse"],
    "mitigationStrategies": ["Vary sentence structures", "Use more conversational language"]
  }
}

CONSTRAINTS:
- authenticityScore, humanLikeness, originalityScore must be numbers 0-100
- All arrays must contain at least one item
- authenticityGrade must be exactly A, B, C, D, or F
- publicationReadiness must be true or false
- aiDetectionRisk must be exactly "low", "medium", or "high"
- All boolean values must be true or false
- No markdown formatting in any field
- Return ONLY the JSON object, nothing else

ANALYSIS CRITERIA:
- Authenticity Score: Overall assessment of how human-like the content is
- Human Likeness: Specific evaluation of natural language patterns
- Originality Score: Assessment of unique insights and creative elements
- Personal Examples: Presence of real-world examples and personal insights
- Varied Vocabulary: Diversity in word choice and expression
- Natural Transitions: Smooth flow between ideas and sections
- Unique Insights: Original perspectives and analysis
- AI Detection Risk: Assessment of likelihood of being flagged by AI detection tools

Be thorough, constructive, and provide specific, actionable feedback for humanization. Focus on patterns that AI detection tools commonly identify.`;

    console.log('🤖 AI Authenticity Review: Sending request to AI model');

    // Generate AI authenticity review using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text() || '';

    console.log('🤖 AI Authenticity Review: AI Response received, length:', textResponse.length);
    console.log('🤖 AI Authenticity Review: AI Response preview:', textResponse.substring(0, 200));

    let parsed: AIAuthenticityReviewResponse | null = null;
    let jsonParseAttempts = 0;
    const maxParseAttempts = 3;

    // IMPROVED: Multiple parsing attempts with fallback strategies
    while (jsonParseAttempts < maxParseAttempts && !parsed) {
      try {
        let jsonString = textResponse.trim();
        
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/^```json\n?|```$/g, '');
        jsonString = jsonString.replace(/^```\n?|```$/g, '');
        
        // Try to find JSON content between curly braces
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        parsed = JSON.parse(jsonString);
        console.log(`✅ AI Authenticity Review: JSON parsed successfully on attempt ${jsonParseAttempts + 1}`);
      } catch (parseError) {
        jsonParseAttempts++;
        console.warn(`❌ AI Authenticity Review: JSON parsing attempt ${jsonParseAttempts} failed:`, parseError);
        
        if (jsonParseAttempts >= maxParseAttempts) {
          // FINAL FALLBACK: Return structured error instead of crashing
          console.error('❌ AI Authenticity Review: All JSON parsing attempts failed, returning structured error response');
          return NextResponse.json(
            { 
              error: 'AI did not return valid JSON for authenticity review',
              debugInfo: {
                rawResponse: textResponse.substring(0, 500),
                parseAttempts: jsonParseAttempts,
                lastParseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
              }
            },
            { status: 400 }
          );
        }
        
        // Try to fix common JSON issues
        try {
          // Remove any trailing text after the JSON
          const lastBraceIndex = textResponse.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            const truncatedResponse = textResponse.substring(0, lastBraceIndex + 1);
            parsed = JSON.parse(truncatedResponse);
            console.log('✅ AI Authenticity Review: JSON parsed after truncation');
            break;
          }
        } catch (truncateError) {
          console.warn('❌ AI Authenticity Review: Truncation attempt failed:', truncateError);
        }
      }
    }

    console.log('🔍 AI Authenticity Review: Validating parsed response structure');

    // Validate AI response structure
    if (!parsed || typeof parsed.authenticityScore !== 'number') {
      console.error('❌ AI Authenticity Review: AI response validation failed - missing authenticityScore');
      return NextResponse.json(
        { 
          error: 'AI response validation failed: must include authenticityScore',
          debugInfo: {
            hasParsedData: !!parsed,
            hasAuthenticityScore: !!parsed?.authenticityScore,
            authenticityScoreType: typeof parsed?.authenticityScore
          }
        },
        { status: 400 }
      );
    }

    // Validate score ranges
    if (parsed.authenticityScore < 0 || parsed.authenticityScore > 100) {
      return NextResponse.json(
        { error: 'Invalid authenticityScore: must be between 0-100' },
        { status: 400 }
      );
    }

    if (typeof parsed.humanLikeness !== 'number' || parsed.humanLikeness < 0 || parsed.humanLikeness > 100) {
      return NextResponse.json(
        { error: 'Invalid humanLikeness: must be a number between 0-100' },
        { status: 400 }
      );
    }

    if (typeof parsed.originalityScore !== 'number' || parsed.originalityScore < 0 || parsed.originalityScore > 100) {
      return NextResponse.json(
        { error: 'Invalid originalityScore: must be a number between 0-100' },
        { status: 400 }
      );
    }

    // Validate required arrays
    if (!Array.isArray(parsed.feedback) || parsed.feedback.length === 0) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include non-empty feedback array' },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsed.improvements) || parsed.improvements.length === 0) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include non-empty improvements array' },
        { status: 400 }
      );
    }

    // Validate authenticity markers
    if (!parsed.authenticityMarkers || typeof parsed.authenticityMarkers.hasPersonalExamples !== 'boolean') {
      return NextResponse.json(
        { error: 'AI response validation failed: must include authenticityMarkers with boolean values' },
        { status: 400 }
      );
    }

    // Validate humanization recommendations
    if (!parsed.humanizationRecommendations || 
        !Array.isArray(parsed.humanizationRecommendations.critical) ||
        !Array.isArray(parsed.humanizationRecommendations.important) ||
        !Array.isArray(parsed.humanizationRecommendations.optional) ||
        !Array.isArray(parsed.humanizationRecommendations.specificExamples)) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include complete humanizationRecommendations structure' },
        { status: 400 }
      );
    }

    // Validate overall assessment
    if (!parsed.overallAssessment || !parsed.overallAssessment.summary || !parsed.overallAssessment.authenticityGrade) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include complete overallAssessment structure' },
        { status: 400 }
      );
    }

    // Validate authenticity grade
    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!validGrades.includes(parsed.overallAssessment.authenticityGrade)) {
      return NextResponse.json(
        { error: 'Invalid authenticityGrade: must be one of A, B, C, D, or F' },
        { status: 400 }
      );
    }

    // Validate publication readiness
    if (typeof parsed.overallAssessment.publicationReadiness !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid publicationReadiness: must be a boolean' },
        { status: 400 }
      );
    }

    // Validate risk assessment (if present)
    if (parsed.riskAssessment) {
      const validRiskLevels = ['low', 'medium', 'high'];
      if (!validRiskLevels.includes(parsed.riskAssessment.aiDetectionRisk)) {
        return NextResponse.json(
          { error: 'Invalid aiDetectionRisk: must be one of low, medium, or high' },
          { status: 400 }
        );
      }
    }

    console.log('✅ AI Authenticity Review: All validations passed successfully');
    console.log('📊 AI Authenticity Review: Final response structure:', {
      hasAuthenticityScore: !!parsed.authenticityScore,
      hasHumanLikeness: !!parsed.humanLikeness,
      hasOriginalityScore: !!parsed.originalityScore,
      hasFeedback: !!parsed.feedback,
      hasImprovements: !!parsed.improvements,
      hasAuthenticityMarkers: !!parsed.authenticityMarkers,
      hasHumanizationRecommendations: !!parsed.humanizationRecommendations,
      hasOverallAssessment: !!parsed.overallAssessment,
      hasRiskAssessment: !!parsed.riskAssessment
    });

    // FIXED: Return the data directly instead of wrapping in a review field
    // This matches what the pipeline expects: stages.aiAuthenticityReview.data
    console.log('✅ AI authenticity review completed successfully');
    return NextResponse.json(parsed, { status: 200 });

  } catch (error) {
    console.error('💥 AI Authenticity Review: Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while generating the AI authenticity review',
        debugInfo: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
