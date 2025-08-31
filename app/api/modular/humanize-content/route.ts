import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('👤 Humanize Content API - Received body:', JSON.stringify(body, null, 2));
    
    const { content, primaryKeyword } = body;
    
    // Generate mock humanized content
    const mockHumanizedContent = content + `\n\n<!-- Humanized Content -->\n<!-- This content has been enhanced with natural language, personal anecdotes, and conversational tone to improve reader engagement and authenticity. -->`;
    
    const mockHumanization = {
      humanizedContent: mockHumanizedContent,
      humanizationScore: 88,
      improvements: [
        'Added conversational tone',
        'Included personal examples',
        'Enhanced readability',
        'Improved engagement factors'
      ],
      metrics: {
        originalReadability: 75,
        newReadability: 88,
        engagementScore: 82,
        authenticityScore: 85
      }
    };

    return NextResponse.json(mockHumanization);

  } catch (error) {
    console.error('❌ Humanize Content API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in humanize-content API' },
      { status: 500 }
    );
  }
}
