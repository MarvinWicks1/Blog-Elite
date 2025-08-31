import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔍 SEO Analysis API - Received body:', JSON.stringify(body, null, 2));
    
    const { content, primaryKeyword } = body;
    
    // Generate mock SEO analysis
    const mockSeoAnalysis = {
      seoScore: 85,
      keywordDensity: 2.1,
      readabilityScore: 78,
      metaTitle: `Complete Guide to ${primaryKeyword || 'Your Topic'} - Expert Tips & Strategies`,
      metaDescription: `Learn everything about ${primaryKeyword || 'this topic'} with our comprehensive guide. Discover expert strategies, best practices, and actionable insights.`,
      focusKeyword: primaryKeyword || 'topic',
      suggestions: [
        'Include more internal links',
        'Optimize image alt tags',
        'Add schema markup',
        'Improve heading structure'
      ]
    };

    return NextResponse.json(mockSeoAnalysis);

  } catch (error) {
    console.error('❌ SEO Analysis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in seo-analysis API' },
      { status: 500 }
    );
  }
}
