import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Input types for the AI authenticity critic
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
interface AIAuthenticityRequest {
  completeArticle: CompleteArticle;
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

// Expected AI output structure for authenticity analysis
interface AIAuthenticityResponse {
  authenticityScore: number; // 0-100, where 100 is completely human-like
  riskAssessment: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number; // 1-10
    detectionProbability: number; // 0-100, likelihood of being flagged as AI
    riskFactors: string[];
  };
  aiPatternAnalysis: {
    repetitiveLanguage: number; // 0-100, higher = more repetitive
    unnaturalFlow: number; // 0-100, higher = more unnatural
    genericPhrasing: number; // 0-100, higher = more generic
    structuralRigidity: number; // 0-100, higher = more rigid
    vocabularyDiversity: number; // 0-100, higher = more diverse
  };
  humanizationRecommendations: {
    critical: string[]; // Must-fix items for authenticity
    important: string[]; // Should-fix items
    optional: string[]; // Nice-to-have improvements
    specificExamples: string[]; // Concrete examples of changes
  };
  contentStrengths: {
    humanLikeElements: string[];
    naturalLanguageFeatures: string[];
    authenticVoice: string[];
  };
  contentWeaknesses: {
    aiIndicators: string[];
    roboticPatterns: string[];
    artificialElements: string[];
  };
  overallAssessment: {
    summary: string;
    authenticityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    publicationReadiness: boolean;
    requiredActions: string[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIAuthenticityRequest;

    const { completeArticle, userSettings } = body || {};

    // Validate required inputs
    if (!completeArticle || !completeArticle.title || !completeArticle.sections) {
      return NextResponse.json(
        { error: 'Missing required fields: completeArticle must include title and sections' },
        { status: 400 }
      );
    }

    // Validate that we have at least some content
    if (!completeArticle.introduction && completeArticle.sections.length === 0) {
      return NextResponse.json(
        { error: 'Complete article must have at least introduction or sections' },
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

    const systemInstruction = `You are Dr. Sarah Chen, a leading AI detection specialist and computational linguist with 15 years of experience in natural language processing, AI content analysis, and authenticity verification. You have developed advanced algorithms for detecting AI-generated content and have consulted with major publishing platforms on content authenticity standards.

Your role is to analyze the submitted article for AI-like patterns and provide a comprehensive authenticity assessment. You must be thorough, objective, and provide specific, actionable recommendations for humanization.

CRITICAL: You must return ONLY a valid JSON object with the EXACT structure specified. Do not include any text before or after the JSON. The JSON must be properly formatted and valid.`;

    // Prepare the content for analysis
    const contentForAnalysis = `
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

    const userPrompt = `AI Authenticity Analysis Request:

Please analyze the following article for AI-generated content patterns and provide a comprehensive authenticity assessment using the expertise of Dr. Sarah Chen, AI detection specialist.

ARTICLE CONTENT:
${contentForAnalysis}

REQUIREMENTS:
Generate a comprehensive AI authenticity analysis including:

1. authenticityScore: Rate from 0-100 (100 = completely human-like)
2. riskAssessment: Risk level, confidence, detection probability, and risk factors
3. aiPatternAnalysis: Scores for repetitive language, unnatural flow, generic phrasing, structural rigidity, and vocabulary diversity
4. humanizationRecommendations: Critical, important, and optional improvements with specific examples
5. contentStrengths: Human-like elements, natural language features, and authentic voice
6. contentWeaknesses: AI indicators, robotic patterns, and artificial elements
7. overallAssessment: Summary, authenticity grade (A-F), publication readiness, and required actions

ANALYSIS CRITERIA:
- Repetitive Language: Check for overused phrases, repetitive sentence structures
- Unnatural Flow: Assess sentence transitions, paragraph coherence, logical progression
- Generic Phrasing: Identify clichéd expressions, overly formal language, lack of personality
- Structural Rigidity: Evaluate paragraph length consistency, formulaic organization
- Vocabulary Diversity: Measure word variety, synonym usage, language richness

Be thorough, constructive, and provide specific, actionable feedback for humanization. Focus on patterns that AI detection tools commonly identify.

RESPONSE FORMAT - Return ONLY this JSON structure:
{
  "authenticityScore": 85,
  "riskAssessment": {
    "riskLevel": "LOW",
    "confidence": 8,
    "detectionProbability": 15,
    "riskFactors": ["slight repetition in technical terms"]
  },
  "aiPatternAnalysis": {
    "repetitiveLanguage": 20,
    "unnaturalFlow": 15,
    "genericPhrasing": 25,
    "structuralRigidity": 30,
    "vocabularyDiversity": 75
  },
  "humanizationRecommendations": {
    "critical": ["Reduce repetition of 'running shoes' in first paragraph"],
    "important": ["Add more conversational transitions between sections"],
    "optional": ["Include personal anecdotes or examples"],
    "specificExamples": ["Replace 'Choosing the right running shoes' with 'Finding your perfect pair'"]
  },
  "contentStrengths": {
    "humanLikeElements": ["Natural conversational tone", "Varied sentence structures"],
    "naturalLanguageFeatures": ["Good use of contractions", "Personal pronouns"],
    "authenticVoice": ["Encouraging and supportive tone"]
  },
  "contentWeaknesses": {
    "aiIndicators": ["Some repetitive phrase patterns"],
    "roboticPatterns": ["Formulaic section transitions"],
    "artificialElements": ["Overly structured paragraph organization"]
  },
  "overallAssessment": {
    "summary": "The content shows strong human-like qualities with natural language flow and engaging tone, though some repetitive patterns could be improved.",
    "authenticityGrade": "B",
    "publicationReadiness": true,
    "requiredActions": ["Reduce repetitive language", "Improve section transitions"]
  }
}

Respond with strict JSON only, no additional text.`;

    // Generate AI authenticity analysis using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: AIAuthenticityResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for authenticity analysis' },
        { status: 502 }
      );
    }

    // Validate AI response structure
    if (!parsed || typeof parsed.authenticityScore !== 'number') {
      return NextResponse.json(
        { error: 'AI response validation failed: must include authenticityScore' },
        { status: 422 }
      );
    }

    // Validate authenticity score range
    if (parsed.authenticityScore < 0 || parsed.authenticityScore > 100) {
      return NextResponse.json(
        { error: 'Invalid authenticityScore: must be between 0-100' },
        { status: 422 }
      );
    }

    // Validate risk assessment structure
    if (!parsed.riskAssessment || !parsed.riskAssessment.riskLevel || !parsed.riskAssessment.confidence) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include complete riskAssessment' },
        { status: 422 }
      );
    }

    // Validate risk level enum values
    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validRiskLevels.includes(parsed.riskAssessment.riskLevel)) {
      return NextResponse.json(
        { error: 'Invalid riskLevel: must be one of LOW, MEDIUM, HIGH, or CRITICAL' },
        { status: 422 }
      );
    }

    // Validate confidence score range
    if (parsed.riskAssessment.confidence < 1 || parsed.riskAssessment.confidence > 10) {
      return NextResponse.json(
        { error: 'Invalid confidence score: must be between 1-10' },
        { status: 422 }
      );
    }

    // Validate AI pattern analysis scores
    if (!parsed.aiPatternAnalysis) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include aiPatternAnalysis' },
        { status: 422 }
      );
    }

    const patternScores = [
      'repetitiveLanguage', 'unnaturalFlow', 'genericPhrasing', 
      'structuralRigidity', 'vocabularyDiversity'
    ];
    
    for (const scoreKey of patternScores) {
      const score = parsed.aiPatternAnalysis[scoreKey as keyof typeof parsed.aiPatternAnalysis];
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return NextResponse.json(
          { error: `Invalid ${scoreKey} score: must be a number between 0-100` },
          { status: 422 }
        );
      }
    }

    // Validate that recommendations are actionable
    if (!parsed.humanizationRecommendations || 
        (!parsed.humanizationRecommendations.critical?.length && 
         !parsed.humanizationRecommendations.important?.length)) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include actionable humanization recommendations' },
        { status: 422 }
      );
    }

    // Validate authenticity grade
    if (!parsed.overallAssessment || !parsed.overallAssessment.authenticityGrade) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include authenticityGrade in overallAssessment' },
        { status: 422 }
      );
    }

    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!validGrades.includes(parsed.overallAssessment.authenticityGrade)) {
      return NextResponse.json(
        { error: 'Invalid authenticityGrade: must be one of A, B, C, D, or F' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: parsed,
      metadata: {
        analysisDate: new Date().toISOString(),
        articleTitle: completeArticle.title,
        wordCount: contentForAnalysis.split(' ').length,
        sectionsCount: completeArticle.sections.length,
        authenticityScore: parsed.authenticityScore,
        riskLevel: parsed.riskAssessment.riskLevel
      }
    });

  } catch (error) {
    console.error('AI authenticity critic route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authenticity analysis' },
      { status: 500 }
    );
  }
}
