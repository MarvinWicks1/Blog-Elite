import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Input types for the targeted refinement
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

// Professional review structure (from professional-critic route)
interface ProfessionalReview {
  criticProfile: {
    name: string;
    credentials: string;
    experience: string;
    reviewDate: string;
  };
  qualityScores: {
    contentStructure: number;
    writingQuality: number;
    seoOptimization: number;
    audienceEngagement: number;
    factualAccuracy: number;
    overallPresentation: number;
  };
  overallScore: number;
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    contentGaps: string[];
    styleObservations: string;
  };
  improvementRecommendations: {
    critical: string[];
    important: string[];
    optional: string[];
  };
  publicationReadiness: {
    isReady: boolean;
    confidence: number;
    requiredActions: string[];
  };
  professionalOpinion: string;
}

// AI authenticity review structure (from ai-authenticity-critic route)
interface AIAuthenticityReview {
  authenticityScore: number;
  riskAssessment: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    detectionProbability: number;
    riskFactors: string[];
  };
  aiPatternAnalysis: {
    repetitiveLanguage: number;
    unnaturalFlow: number;
    genericPhrasing: number;
    structuralRigidity: number;
    vocabularyDiversity: number;
  };
  humanizationRecommendations: {
    critical: string[];
    important: string[];
    optional: string[];
    specificExamples: string[];
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

// Request payload for this route
interface TargetedRefinementRequest {
  completeArticle: CompleteArticle;
  professionalReview: ProfessionalReview;
  authenticityReview: AIAuthenticityReview;
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

// Expected AI output structure for refined article
interface RefinedArticleResponse {
  refinedArticle: CompleteArticle;
  refinementSummary: {
    changesMade: string[];
    improvementsApplied: string[];
    qualityEnhancements: string[];
    authenticityImprovements: string[];
  };
  finalQualityMetrics: {
    professionalScore: number; // 1-10
    authenticityScore: number; // 0-100
    publicationReadiness: boolean;
    confidence: number; // 1-10
  };
  refinementNotes: {
    professionalFeedback: string;
    authenticityFeedback: string;
    overallAssessment: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TargetedRefinementRequest;

    const { completeArticle, professionalReview, authenticityReview, userSettings } = body || {};

    // Validate required inputs
    if (!completeArticle || !completeArticle.title || !completeArticle.sections) {
      return NextResponse.json(
        { error: 'Missing required fields: completeArticle must include title and sections' },
        { status: 400 }
      );
    }

    if (!professionalReview || !professionalReview.qualityScores || !professionalReview.improvementRecommendations) {
      return NextResponse.json(
        { error: 'Missing required fields: professionalReview must include qualityScores and improvementRecommendations' },
        { status: 400 }
      );
    }

    if (!authenticityReview || !authenticityReview.humanizationRecommendations || !authenticityReview.overallAssessment) {
      return NextResponse.json(
        { error: 'Missing required fields: authenticityReview must include humanizationRecommendations and overallAssessment' },
        { status: 400 }
      );
    }

    // Validate that we have at least some content to refine
    if (!completeArticle.introduction && completeArticle.sections.length === 0) {
      return NextResponse.json(
        { error: 'Complete article must have at least introduction or sections to refine' },
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

    const systemInstruction = `You are Master Content Refinement Specialist, an expert content editor with 25+ years of experience in publishing, content strategy, and editorial excellence. You have the unique ability to transform good content into exceptional, publication-ready articles by applying professional feedback and authenticity improvements.

Your role is to take the complete article and apply the feedback from both professional and authenticity reviews to create a final, polished version that is ready for publication. You must be thorough, creative, and ensure the final output maintains the article's core message while significantly improving its quality and authenticity.

CRITICAL: You must return ONLY a valid JSON object with the EXACT structure specified. Do not include any text before or after the JSON. The JSON must be properly formatted and valid.`;

    // Prepare the content and feedback for refinement
    const contentForRefinement = `
ORIGINAL ARTICLE:
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

PROFESSIONAL REVIEW FEEDBACK:
Overall Score: ${professionalReview.overallScore}/10
Critical Issues: ${professionalReview.improvementRecommendations.critical.join('; ')}
Important Improvements: ${professionalReview.improvementRecommendations.important.join('; ')}
Optional Enhancements: ${professionalReview.improvementRecommendations.optional.join('; ')}
Professional Opinion: ${professionalReview.professionalOpinion}

AUTHENTICITY REVIEW FEEDBACK:
Authenticity Score: ${authenticityReview.authenticityScore}/100
Risk Level: ${authenticityReview.riskAssessment.riskLevel}
Critical Humanization: ${authenticityReview.humanizationRecommendations.critical.join('; ')}
Important Humanization: ${authenticityReview.humanizationRecommendations.important.join('; ')}
Optional Humanization: ${authenticityReview.humanizationRecommendations.optional.join('; ')}
Authenticity Grade: ${authenticityReview.overallAssessment.authenticityGrade}
`;

    const userPrompt = `Targeted Content Refinement Request:

You are the Master Content Refinement Specialist. Your mission is to take the original article and apply ALL the feedback from both the professional review and authenticity review to create a final, publication-ready version.

ORIGINAL CONTENT AND FEEDBACK:
${contentForRefinement}

REFINEMENT REQUIREMENTS:

1. Apply ALL critical professional feedback (must-fix items)
2. Apply ALL critical authenticity improvements (must-humanize items)
3. Apply important professional improvements (should-fix items)
4. Apply important authenticity improvements (should-humanize items)
5. Consider optional improvements where they enhance quality
6. Maintain the article's core message and structure
7. Ensure natural, human-like language flow
8. Improve readability, engagement, and professional presentation
9. Optimize for both human readers and search engines

REFINEMENT PROCESS:
- Rewrite sections that need significant improvement
- Enhance language to sound more natural and human
- Fix structural issues identified in professional review
- Apply authenticity improvements to reduce AI-like patterns
- Maintain consistent tone and style throughout
- Ensure logical flow and transitions
- Optimize for the target audience

RESPONSE FORMAT - Return ONLY this JSON structure:
{
  "refinedArticle": {
    "title": "Refined title if needed",
    "introduction": "Refined introduction",
    "sections": [
      {
        "title": "Section title",
        "content": "Refined section content"
      }
    ],
    "conclusion": "Refined conclusion",
    "faq": [
      {
        "question": "Refined question",
        "answer": "Refined answer"
      }
    ],
    "seoOptimization": {
      "metaDescription": "Refined meta description",
      "keywords": ["refined", "keywords"],
      "titleTag": "Refined title tag"
    },
    "images": [
      {
        "description": "Refined description",
        "altText": "Refined alt text",
        "placement": "placement"
      }
    ]
  },
  "refinementSummary": {
    "changesMade": ["List of specific changes made"],
    "improvementsApplied": ["List of improvements applied"],
    "qualityEnhancements": ["List of quality enhancements"],
    "authenticityImprovements": ["List of authenticity improvements"]
  },
  "finalQualityMetrics": {
    "professionalScore": 9,
    "authenticityScore": 95,
    "publicationReadiness": true,
    "confidence": 9
  },
  "refinementNotes": {
    "professionalFeedback": "Summary of how professional feedback was applied",
    "authenticityFeedback": "Summary of how authenticity feedback was applied",
    "overallAssessment": "Overall assessment of the refinement process"
  }
}

IMPORTANT: 
- Apply ALL feedback systematically
- Ensure the refined article is significantly better than the original
- Make the content sound natural and human-written
- Maintain professional quality standards
- Return ONLY valid JSON, no additional text

Respond with strict JSON only, no additional text.`;

    // Generate refined article using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: RefinedArticleResponse | null = null;
    try {
      const jsonString = textResponse.trim().replace(/^```json\n?|```$/g, '');
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('AI response parsing failed:', parseError);
      return NextResponse.json(
        { error: 'AI did not return valid JSON for article refinement' },
        { status: 502 }
      );
    }

    // Validate AI response structure
    if (!parsed || !parsed.refinedArticle || !parsed.refinementSummary) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include refinedArticle and refinementSummary' },
        { status: 422 }
      );
    }

    // Validate refined article structure
    if (!parsed.refinedArticle.title || !parsed.refinedArticle.sections || parsed.refinedArticle.sections.length === 0) {
      return NextResponse.json(
        { error: 'AI response validation failed: refinedArticle must include title and at least one section' },
        { status: 422 }
      );
    }

    // Validate quality metrics
    if (!parsed.finalQualityMetrics) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include finalQualityMetrics' },
        { status: 422 }
      );
    }

    const { professionalScore, authenticityScore, publicationReadiness, confidence } = parsed.finalQualityMetrics;
    
    // QUALITY THRESHOLD ENFORCEMENT
    const MIN_PROFESSIONAL_SCORE = 8.0;
    const MIN_AUTHENTICITY_SCORE = 80;
    const MIN_CONFIDENCE_SCORE = 7.0;
    
    console.log('🎯 Quality Threshold Check:', {
      professionalScore,
      authenticityScore,
      confidence,
      publicationReadiness,
      meetsProfessionalThreshold: professionalScore >= MIN_PROFESSIONAL_SCORE,
      meetsAuthenticityThreshold: authenticityScore >= MIN_AUTHENTICITY_SCORE,
      meetsConfidenceThreshold: confidence >= MIN_CONFIDENCE_SCORE
    });
    
    // Check if quality thresholds are met
    const meetsQualityThresholds = 
      professionalScore >= MIN_PROFESSIONAL_SCORE &&
      authenticityScore >= MIN_AUTHENTICITY_SCORE &&
      confidence >= MIN_CONFIDENCE_SCORE;
    
    if (!meetsQualityThresholds) {
      console.warn('⚠️ Quality thresholds not met - triggering refinement cycle');
      
      // Return structured response indicating need for refinement
      return NextResponse.json({
        success: false,
        needsRefinement: true,
        qualityIssues: {
          professionalScore: professionalScore < MIN_PROFESSIONAL_SCORE ? `Below threshold (${professionalScore}/${MIN_PROFESSIONAL_SCORE})` : null,
          authenticityScore: authenticityScore < MIN_AUTHENTICITY_SCORE ? `Below threshold (${authenticityScore}/${MIN_AUTHENTICITY_SCORE})` : null,
          confidence: confidence < MIN_CONFIDENCE_SCORE ? `Below threshold (${confidence}/${MIN_CONFIDENCE_SCORE})` : null
        },
        refinement: parsed,
        finalArticle: parsed.refinedArticle,
        metadata: {
          refinementDate: new Date().toISOString(),
          articleTitle: parsed.refinedArticle.title,
          qualityStatus: 'needs_improvement',
          refinementRequired: true
        }
      });
    }
    
    console.log('✅ Quality thresholds met - article ready for publication');
    
    if (typeof professionalScore !== 'number' || professionalScore < 1 || professionalScore > 10) {
      return NextResponse.json(
        { error: 'Invalid professionalScore: must be a number between 1-10' },
        { status: 422 }
      );
    }

    if (typeof authenticityScore !== 'number' || authenticityScore < 0 || authenticityScore > 100) {
      return NextResponse.json(
        { error: 'Invalid authenticityScore: must be a number between 0-100' },
        { status: 422 }
      );
    }

    if (typeof publicationReadiness !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid publicationReadiness: must be a boolean' },
        { status: 422 }
      );
    }

    if (typeof confidence !== 'number' || confidence < 1 || confidence > 10) {
      return NextResponse.json(
        { error: 'Invalid confidence: must be a number between 1-10' },
        { status: 422 }
      );
    }

    // Validate that changes were actually made
    if (!parsed.refinementSummary.changesMade || parsed.refinementSummary.changesMade.length === 0) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include specific changes made during refinement' },
        { status: 422 }
      );
    }

    // Validate refinement notes
    if (!parsed.refinementNotes || !parsed.refinementNotes.overallAssessment) {
      return NextResponse.json(
        { error: 'AI response validation failed: must include refinementNotes with overallAssessment' },
        { status: 422 }
      );
    }

    // Calculate word count improvement
    const originalWordCount = completeArticle.introduction?.split(' ').length || 0 + 
      completeArticle.sections.reduce((sum, section) => sum + (section.content?.split(' ').length || 0), 0) + 
      (completeArticle.conclusion?.split(' ').length || 0);

    const refinedWordCount = parsed.refinedArticle.introduction?.split(' ').length || 0 + 
      parsed.refinedArticle.sections.reduce((sum, section) => sum + (section.content?.split(' ').length || 0), 0) + 
      (parsed.refinedArticle.conclusion?.split(' ').length || 0);

    return NextResponse.json({
      success: true,
      refinement: parsed,
      // Add the final article content at the top level for easy access
      finalArticle: parsed.refinedArticle,
      finalContent: {
        title: parsed.refinedArticle.title,
        introduction: parsed.refinedArticle.introduction,
        sections: parsed.refinedArticle.sections,
        conclusion: parsed.refinedArticle.conclusion,
        faq: parsed.refinedArticle.faq,
        seoOptimization: parsed.refinedArticle.seoOptimization,
        images: parsed.refinedArticle.images
      },
      // Add assembled content for easy export
      assembledContent: `${parsed.refinedArticle.introduction}\n\n${parsed.refinedArticle.sections.map(section => `## ${section.title}\n\n${section.content}`).join('\n\n')}\n\n${parsed.refinedArticle.conclusion}`,
      metadata: {
        refinementDate: new Date().toISOString(),
        articleTitle: parsed.refinedArticle.title,
        originalWordCount,
        refinedWordCount,
        wordCountChange: refinedWordCount - originalWordCount,
        sectionsCount: parsed.refinedArticle.sections.length,
        finalProfessionalScore: professionalScore,
        finalAuthenticityScore: authenticityScore,
        publicationReady: publicationReadiness,
        refinementConfidence: confidence
      }
    });

  } catch (error) {
    console.error('Targeted refinement route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during article refinement' },
      { status: 500 }
    );
  }
}
