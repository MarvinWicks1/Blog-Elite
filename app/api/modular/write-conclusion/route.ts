import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🏁 Write Conclusion API - Received body:', JSON.stringify(body, null, 2));
    
    const primaryKeyword = body?.primaryKeyword || 'topic';
    const userSettings = body?.userSettings || {};
    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;
    const fallbackMode = provider === 'google' && !apiKey;
    if (fallbackMode) {
      console.warn('🟡 Write Conclusion: Running in fallback mode (missing Google API key).');
    }
    
    // Generate a mock conclusion
    const mockConclusion = `## Conclusion: Mastering ${primaryKeyword}

As we've explored throughout this comprehensive guide, ${primaryKeyword} represents a fundamental shift in how we approach modern challenges. The insights and strategies we've covered provide a solid foundation for anyone looking to excel in this field.

Key takeaways include:
- Understanding the core principles of ${primaryKeyword}
- Implementing best practices for optimal results
- Avoiding common pitfalls and challenges
- Staying updated with the latest developments

Remember, success with ${primaryKeyword} comes from consistent practice, continuous learning, and applying the concepts we've discussed. Start with the basics, build gradually, and don't hesitate to experiment with different approaches.

The journey to mastering ${primaryKeyword} is ongoing, but with the knowledge you've gained here, you're well-equipped to take the next steps. Keep learning, keep practicing, and you'll see remarkable results in your endeavors.`;

    return NextResponse.json({
      conclusion: mockConclusion,
      wordCount: mockConclusion.split(' ').length
    });

  } catch (error) {
    console.error('❌ Write Conclusion API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in write-conclusion API' },
      { status: 500 }
    );
  }
}
