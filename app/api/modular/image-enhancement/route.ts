import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '../../../../lib/ai-providers';

// Input types
interface KeywordResearchResult {
  primaryKeyword: string;
  keywordAnalysis: string;
  semanticKeywords: string[];
  longTailKeywords: string[];
  relatedQuestions: string[];
  contentGaps: string[];
  targetKeywordDensity: string;
  seoOpportunities: string[];
}

interface HumanizedContent {
  content: string;
  title?: string;
  sections?: string[];
}

// Request payload for this route
interface ImageEnhancementRequest {
  humanizedContent: HumanizedContent;
  articleTitle: string;
  keywordResearch: KeywordResearchResult;
  userSettings?: {
    aiSettings?: {
      selectedProvider?: string;
      selectedModel?: string;
      apiKeys?: {
        google?: string;
        unsplash?: string;
      };
    };
  };
}

// Expected AI output structure for image strategy - UPDATED to match pipeline expectations
interface ImageStrategyResponse {
  imageStrategy: {
    overview: string;
    visualTheme: string;
    colorPalette: string;
    styleGuidelines: string;
  };
  imageRecommendations: Array<{
    id: string;
    placement: string;
    description: string;
    altText: string;
    caption: string;
    unsplashQuery: string;
    unsplashUrl?: string;
    relevanceScore: number;
    seoValue: string;
  }>;
  placementStrategy: {
    heroImage: string;
    sectionBreaks: string[];
    infographicOpportunities: string[];
    callToActionImages: string[];
  };
  technicalSpecs: {
    dimensions: string;
    formats: string[];
    optimizationTips: string[];
    accessibilityGuidelines: string[];
  };
  // ADDED: images field that the pipeline expects
  images: Array<{
    id: string;
    placement: string;
    description: string;
    altText: string;
    caption: string;
    unsplashQuery: string;
    unsplashUrl?: string;
    relevanceScore: number;
    seoValue: string;
    thumbnailUrl?: string;
    photographer?: string;
    unsplashProfile?: string;
    downloadUrl?: string;
  }>;
}

// Unsplash API response types
interface UnsplashPhoto {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImageEnhancementRequest;

    const { humanizedContent, articleTitle, keywordResearch, userSettings } = body || {};

    // Validate required inputs
    if (!humanizedContent || !articleTitle || !keywordResearch) {
      return NextResponse.json(
        { error: 'Missing required fields: humanizedContent, articleTitle, and keywordResearch' },
        { status: 400 }
      );
    }

    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const model = userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;
    const unsplashKey = userSettings?.aiSettings?.apiKeys?.unsplash || process.env.UNSPLASH_ACCESS_KEY || process.env.UPSPLASH_API_KEY;

    if (provider === 'google' && !apiKey) {
      return NextResponse.json(
        { error: 'Missing Google API key (set userSettings.aiSettings.apiKeys.google or process.env.GOOGLE_API_KEY)' },
        { status: 400 }
      );
    }

    if (!unsplashKey) {
      return NextResponse.json(
        { error: 'Missing Unsplash API key (set userSettings.aiSettings.apiKeys.unsplash, process.env.UNSPLASH_ACCESS_KEY, or process.env.UPSPLASH_API_KEY)' },
        { status: 400 }
      );
    }

    const aiModel = await getAIModel(provider, model, apiKey as string);

    // IMPROVED: More strict and explicit system instruction
    const systemInstruction = `You are a visual content strategist and image optimization expert. Your task is to analyze content and generate a comprehensive image strategy that enhances user engagement and SEO performance.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object - no markdown, no prose, no explanations
2. The response must be parseable by JSON.parse() without any preprocessing
3. Follow the exact structure specified in the prompt
4. All required fields must be present and properly formatted
5. Scores must be numbers between 1-10
6. Arrays must contain at least the minimum number of items specified

If you cannot generate valid JSON, return a simple error message.`;

    // IMPROVED: More structured and demanding user prompt
    const userPrompt = `Content Analysis Request:

Article Title: ${articleTitle}

Primary Keyword: ${keywordResearch.primaryKeyword}
Semantic Keywords: ${keywordResearch.semanticKeywords.join(', ')}
Related Questions: ${keywordResearch.relatedQuestions.join(', ')}

Content Overview: ${humanizedContent.content.substring(0, 500)}...

REQUIRED JSON STRUCTURE - Generate EXACTLY this format:

{
  "imageStrategy": {
    "overview": "string describing overall image strategy",
    "visualTheme": "string describing visual theme",
    "colorPalette": "string describing color scheme",
    "styleGuidelines": "string describing style rules"
  },
  "imageRecommendations": [
    {
      "id": "unique-id-1",
      "placement": "hero|section-break|infographic|cta",
      "description": "detailed description of image purpose",
      "altText": "SEO-optimized alt text",
      "caption": "engaging caption for the image",
      "unsplashQuery": "search term for Unsplash API",
      "relevanceScore": 8,
      "seoValue": "high|medium|low"
    }
  ],
  "placementStrategy": {
    "heroImage": "description of hero image strategy",
    "sectionBreaks": ["description1", "description2"],
    "infographicOpportunities": ["opportunity1", "opportunity2"],
    "callToActionImages": ["cta1", "cta2"]
  },
  "technicalSpecs": {
    "dimensions": "recommended image dimensions",
    "formats": ["jpg", "png", "webp"],
    "optimizationTips": ["tip1", "tip2", "tip3"],
    "accessibilityGuidelines": ["guideline1", "guideline2"]
  }
}

CONSTRAINTS:
- imageRecommendations must have EXACTLY 3 items
- relevanceScore must be a number 1-10
- All strings must be non-empty
- No markdown formatting in any field
- Return ONLY the JSON object, nothing else`;

    // Generate image strategy using AI
    // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
    const aiResult = await aiModel.generateContent({ 
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
    });
    
    // @ts-ignore
    const textResponse: string = aiResult?.response?.text?.() || '';

    let parsed: ImageStrategyResponse | null = null;
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
        console.log(`✅ JSON parsed successfully on attempt ${jsonParseAttempts + 1}`);
      } catch (parseError) {
        jsonParseAttempts++;
        console.warn(`JSON parsing attempt ${jsonParseAttempts} failed:`, parseError);
        
        if (jsonParseAttempts >= maxParseAttempts) {
          // FINAL FALLBACK: Return structured error instead of crashing
          console.error('All JSON parsing attempts failed, returning structured error response');
          return NextResponse.json(
            { 
              error: 'AI did not return valid JSON for image strategy',
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
            console.log('✅ JSON parsed after truncation');
            break;
          }
        } catch (truncateError) {
          console.warn('Truncation attempt failed:', truncateError);
        }
      }
    }

    // Validate AI response structure
    if (!parsed || !parsed.imageRecommendations || parsed.imageRecommendations.length < 3) {
      return NextResponse.json(
        { 
          error: 'AI response validation failed: must include at least 3 image recommendations',
          debugInfo: {
            hasParsedData: !!parsed,
            hasImageRecommendations: !!parsed?.imageRecommendations,
            recommendationCount: parsed?.imageRecommendations?.length || 0
          }
        },
        { status: 400 }
      );
    }

    // Enhance image recommendations with Unsplash data
    const enhancedRecommendations = await Promise.all(
      parsed.imageRecommendations.map(async (rec) => {
        try {
          // Search Unsplash for relevant images
          const searchQuery = encodeURIComponent(rec.unsplashQuery);
          const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=1&orientation=landscape`,
            {
              headers: {
                'Authorization': `Client-ID ${unsplashKey}`,
                'Accept-Version': 'v1'
              }
            }
          );

          if (unsplashResponse.ok) {
            const unsplashData: UnsplashSearchResponse = await unsplashResponse.json();
            if (unsplashData.results.length > 0) {
              const photo = unsplashData.results[0];
              return {
                ...rec,
                unsplashUrl: photo.urls.regular,
                thumbnailUrl: photo.urls.thumb,
                photographer: photo.user.name,
                unsplashProfile: photo.links.html,
                downloadUrl: photo.urls.regular
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch Unsplash data for query: ${rec.unsplashQuery}`, error);
        }
        
        // Return original recommendation if Unsplash fetch fails
        return rec;
      })
    );

    // Update the response with enhanced recommendations and add the images field
    const finalResponse = {
      ...parsed,
      imageRecommendations: enhancedRecommendations,
      images: enhancedRecommendations // ADDED: This is what the pipeline expects
    };

    // Final validation: ensure we have at least 3 valid image recommendations
    const validRecommendations = finalResponse.imageRecommendations.filter(
      rec => rec.placement && rec.description && rec.altText && rec.unsplashQuery
    );

    if (validRecommendations.length < 3) {
      return NextResponse.json(
        { 
          error: 'Validation failed: must have at least 3 complete image recommendations',
          debugInfo: {
            totalRecommendations: finalResponse.imageRecommendations.length,
            validRecommendations: validRecommendations.length,
            validationDetails: finalResponse.imageRecommendations.map(rec => ({
              hasPlacement: !!rec.placement,
              hasDescription: !!rec.description,
              hasAltText: !!rec.altText,
              hasUnsplashQuery: !!rec.unsplashQuery
            }))
          }
        },
        { status: 400 }
      );
    }

    console.log('✅ Image enhancement completed successfully with', validRecommendations.length, 'valid recommendations');
    return NextResponse.json(finalResponse, { status: 200 });
  } catch (error) {
    console.error('Image Enhancement Error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while generating the image enhancement strategy',
        debugInfo: {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
