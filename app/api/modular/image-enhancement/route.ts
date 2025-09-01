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

    const fallbackMode = !(provider !== 'google' || apiKey) || !unsplashKey;

    let aiModel: any = null;
    if (!fallbackMode) {
      aiModel = await getAIModel(provider, model, apiKey as string);
    } else {
      console.warn('🟡 Image Enhancement: Running in fallback mode (missing API keys).');
    }

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

    let parsed: ImageStrategyResponse | null = null;

    if (!fallbackMode) {
      // Generate image strategy using AI
      // @ts-ignore - aiModel is provider-specific; current provider returns Google Generative Model
      const aiResult = await aiModel.generateContent({ 
        contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }] 
      });
      
      // @ts-ignore
      const textResponse: string = aiResult?.response?.text?.() || '';

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
            console.error('All JSON parsing attempts failed, switching to local fallback strategy');
            break;
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
    }

    if (!parsed) {
      // Local deterministic fallback generation
      const topKeywords = [keywordResearch.primaryKeyword, ...(keywordResearch.semanticKeywords || []).slice(0, 3)].filter(Boolean);
      const makeRec = (id: string, placement: string, desc: string, query: string, score: number) => ({
        id,
        placement,
        description: desc,
        altText: `${articleTitle}: ${desc}`,
        caption: desc,
        unsplashQuery: query,
        relevanceScore: score,
        seoValue: score >= 8 ? 'high' : 'medium'
      });

      const recs = [
        makeRec('hero-1', 'hero', `Hero image illustrating ${topKeywords[0] || 'the topic'} in action`, `${topKeywords[0] || keywordResearch.primaryKeyword} concept`, 9),
        makeRec('break-1', 'section-break', `Section break photo related to ${(topKeywords[1] || 'strategy')} use case`, `${topKeywords[1] || keywordResearch.primaryKeyword} workflow`, 8),
        makeRec('info-1', 'infographic', `Infographic opportunity summarizing key steps for ${(topKeywords[2] || 'implementation')}`, `${topKeywords[2] || keywordResearch.primaryKeyword} steps infographic`, 8)
      ];

      parsed = {
        imageStrategy: {
          overview: `Use clean, professional visuals that reinforce ${keywordResearch.primaryKeyword} and its applications. Favor high-contrast imagery with clear focal points to improve scannability and retention.`,
          visualTheme: 'Modern, tech-forward, human-centric',
          colorPalette: 'Deep blues, teals, neutral grays; accent with warm highlights',
          styleGuidelines: 'Landscape orientation, ample negative space, avoid clichés, ensure strong alt text'
        },
        imageRecommendations: recs,
        placementStrategy: {
          heroImage: 'Place a bold hero image above the H1 with subtle overlay for legibility',
          sectionBreaks: ['Use contextual imagery at major section boundaries to reset attention'],
          infographicOpportunities: ['Summarize process or framework into a single visual'],
          callToActionImages: ['Use authentic imagery near CTAs to build trust']
        },
        technicalSpecs: {
          dimensions: '1200x630 (Open Graph), 1600x900 (in-article)',
          formats: ['jpg', 'png', 'webp'],
          optimizationTips: ['Compress to <200KB where possible', 'Serve next-gen formats', 'Add descriptive alt text'],
          accessibilityGuidelines: ['Alt text describes purpose, not just content', 'Avoid text embedded in images']
        },
        images: recs
      } as ImageStrategyResponse;
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
        if (fallbackMode) {
          // Fallback to Unsplash Source (no API key required) for actual images
          const q = encodeURIComponent(rec.unsplashQuery || keywordResearch.primaryKeyword)
          return {
            ...rec,
            unsplashUrl: `https://source.unsplash.com/1600x900/?${q}`,
            thumbnailUrl: `https://source.unsplash.com/400x225/?${q}`,
            downloadUrl: `https://source.unsplash.com/1600x900/?${q}`
          };
        }
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
        
        // Fallback to Unsplash Source if API search fails
        const q2 = encodeURIComponent(rec.unsplashQuery || keywordResearch.primaryKeyword)
        return {
          ...rec,
          unsplashUrl: `https://source.unsplash.com/1600x900/?${q2}`,
          thumbnailUrl: `https://source.unsplash.com/400x225/?${q2}`,
          downloadUrl: `https://source.unsplash.com/1600x900/?${q2}`
        };
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
