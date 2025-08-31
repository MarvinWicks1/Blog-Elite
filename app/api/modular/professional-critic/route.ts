import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '../../../../lib/ai-providers';

// Input types for the professional critic
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
interface ProfessionalCriticRequest {
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

// Expected AI output structure for professional review
interface ProfessionalReviewResponse {
  criticProfile: {
    name: string;
    credentials: string;
    experience: string;
    reviewDate: string;
  };
  qualityScores: {
    contentStructure: number; // 1-10
    writingQuality: number; // 1-10
    seoOptimization: number; // 1-10
    audienceEngagement: number; // 1-10
    factualAccuracy: number; // 1-10
    overallPresentation: number; // 1-10
  };
  overallScore: number; // 1-10, calculated average
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    contentGaps: string[];
    styleObservations: string;
  };
  improvementRecommendations: {
    critical: string[]; // Must-fix items
    important: string[]; // Should-fix items
    optional: string[]; // Nice-to-have improvements
  };
  publicationReadiness: {
    isReady: boolean;
    confidence: number; // 1-10
    requiredActions: string[];
  };
  professionalOpinion: string; // Overall assessment paragraph
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProfessionalCriticRequest;

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

    const systemInstruction = `You are Dr. Marcus Thompson, a distinguished blog critic with 30 years of experience in content evaluation, digital publishing, and editorial standards. You have reviewed thousands of articles and have an impeccable eye for quality, structure, and audience engagement.

Your role is to provide a comprehensive, professional review of the submitted article. You must be thorough, objective, and constructive in your feedback. You are known for your high standards and ability to identify both strengths and areas for improvement.

CRITICAL REQUIREMENT: You must return ONLY a valid JSON object with the EXACT structure specified. No markdown formatting, no prose text, no explanations outside the JSON. The response must be parseable JSON that matches the required interface exactly.

The JSON must include these exact keys at the root level:
- qualityScores: object with 6 numeric scores (1-10)
- overallScore: calculated average of the 6 scores
- improvementRecommendations: object with critical, important, and optional arrays
- criticProfile: object with name, credentials, experience, reviewDate
- detailedAnalysis: object with strengths, weaknesses, contentGaps, styleObservations
- publicationReadiness: object with isReady, confidence, requiredActions
- professionalOpinion: string

If you cannot provide a complete response, return a valid JSON with placeholder values rather than incomplete data.`;

    // Prepare the content for review
    const contentForReview = `
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

    const userPrompt = `Professional Article Review Request:

Please review the following article with the expertise and standards of Dr. Marcus Thompson, distinguished blog critic with 30 years of experience.

ARTICLE CONTENT:
${contentForReview}

REQUIREMENTS:
Generate a comprehensive professional review and return ONLY a valid JSON object with this EXACT structure:

{
  "qualityScores": {
    "contentStructure": <number 1-10>,
    "writingQuality": <number 1-10>,
    "seoOptimization": <number 1-10>,
    "audienceEngagement": <number 1-10>,
    "factualAccuracy": <number 1-10>,
    "overallPresentation": <number 1-10>
  },
  "overallScore": <calculated average of the 6 scores>,
  "improvementRecommendations": {
    "critical": ["<must-fix item 1>", "<must-fix item 2>"],
    "important": ["<should-fix item 1>", "<should-fix item 2>"],
    "optional": ["<nice-to-have improvement 1>", "<nice-to-have improvement 2>"]
  },
  "criticProfile": {
    "name": "Dr. Marcus Thompson",
    "credentials": "<your credentials>",
    "experience": "<your experience>",
    "reviewDate": "<current date>"
  },
  "detailedAnalysis": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>", "<weakness 2>"],
    "contentGaps": ["<gap 1>", "<gap 2>"],
    "styleObservations": "<detailed style analysis>"
  },
  "publicationReadiness": {
    "isReady": <boolean>,
    "confidence": <number 1-10>,
    "requiredActions": ["<action 1>", "<action 2>"]
  },
  "professionalOpinion": "<comprehensive overall assessment paragraph>"
}

EVALUATION CRITERIA:
- Content Structure: Logical flow, organization, readability
- Writing Quality: Grammar, style, tone, clarity
- SEO Optimization: Keyword usage, meta information, technical aspects
- Audience Engagement: Hook, value proposition, call-to-action
- Factual Accuracy: Information reliability, source credibility
- Overall Presentation: Professional appearance, formatting, completeness

Be thorough, constructive, and provide specific, actionable feedback. Maintain the high standards expected from a distinguished critic.

RESPOND WITH STRICT JSON ONLY - NO MARKDOWN, NO PROSE, NO EXPLANATIONS OUTSIDE THE JSON STRUCTURE.`;

    // Generate professional review using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: ProfessionalReviewResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for professional review' },
        { status: 502 }
      );
    }

    // Validate AI response structure with detailed logging
    if (!parsed || !parsed.qualityScores || !parsed.overallScore) {
      console.error('❌ AI response validation failed - missing core fields:', {
        hasQualityScores: !!parsed?.qualityScores,
        hasOverallScore: !!parsed?.overallScore,
        receivedKeys: parsed ? Object.keys(parsed) : 'NO_DATA'
      });
      
      // Attempt one-shot repair for common issues
      if (parsed && (parsed as any).review) {
        console.log('🔄 Attempting to repair wrapped response structure...');
        parsed = (parsed as any).review;
      }
      
      // Final validation after repair attempt
      if (!parsed || !parsed.qualityScores || !parsed.overallScore) {
        return NextResponse.json(
          { error: 'AI response validation failed: must include qualityScores and overallScore at root level' },
          { status: 422 }
        );
      }
    }

    // Validate that all required scores are present and within range
    const requiredScores = [
      'contentStructure', 'writingQuality', 'seoOptimization', 
      'audienceEngagement', 'factualAccuracy', 'overallPresentation'
    ];
    
    for (const scoreKey of requiredScores) {
      const score = parsed.qualityScores[scoreKey as keyof typeof parsed.qualityScores];
      if (typeof score !== 'number' || score < 1 || score > 10) {
        return NextResponse.json(
          { error: `Invalid score for ${scoreKey}: must be a number between 1-10` },
          { status: 422 }
        );
      }
    }

    // Validate overall score calculation
    const calculatedScore = Object.values(parsed.qualityScores).reduce((sum, score) => sum + score, 0) / 6;
    if (Math.abs(parsed.overallScore - calculatedScore) > 0.5) {
      // Recalculate if there's a significant discrepancy
      parsed.overallScore = Math.round(calculatedScore * 10) / 10;
    }

    // Validate that feedback is actionable
    if (!parsed.improvementRecommendations || 
        (!parsed.improvementRecommendations.critical?.length && 
         !parsed.improvementRecommendations.important?.length)) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include actionable improvement recommendations' },
        { status: 422 }
      );
    }

    console.log('✅ Professional review validation completed successfully');
    console.log('📊 Final review data:', {
      overallScore: parsed.overallScore,
      hasQualityScores: !!parsed.qualityScores,
      hasImprovementRecommendations: !!parsed.improvementRecommendations
    });

    // Return the data in the exact structure expected by the main pipeline
    return NextResponse.json({
      qualityScores: parsed.qualityScores,
      overallScore: parsed.overallScore,
      improvementRecommendations: parsed.improvementRecommendations,
      criticProfile: parsed.criticProfile,
      detailedAnalysis: parsed.detailedAnalysis,
      publicationReadiness: parsed.publicationReadiness,
      professionalOpinion: parsed.professionalOpinion,
      metadata: {
        reviewDate: new Date().toISOString(),
        articleTitle: completeArticle.title,
        wordCount: contentForReview.split(' ').length,
        sectionsCount: completeArticle.sections.length
      }
    });

  } catch (error) {
    console.error('Professional critic route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during professional review' },
      { status: 500 }
    );
  }
}
