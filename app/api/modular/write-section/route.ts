import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const safeStringify = (obj: any) => JSON.stringify(obj, (k, v) => (k.toLowerCase().includes('apikey') ? '***' : v), 2);
    console.log('📚 Write Section API - Received body:', safeStringify(body));
    
    const sectionIndex = body?.sectionIndex || 0;
    const primaryKeyword = body?.primaryKeyword || 'topic';
    const headingFromOutline = body?.outline?.mainSections?.[sectionIndex]?.heading;
    const sectionHeading = headingFromOutline || `Section ${sectionIndex + 1}`;
    const userSettings = body?.userSettings || {};
    const provider = userSettings?.aiSettings?.selectedProvider || 'google';
    const apiKey = userSettings?.aiSettings?.apiKeys?.google || process.env.GOOGLE_API_KEY;
    const fallbackMode = provider === 'google' && !apiKey;
    if (fallbackMode) {
      console.warn('🟡 Write Section: Running in fallback mode (missing Google API key).');
    }
    
    // Generate a mock section
    const mockSection = `## ${sectionHeading}

This section provides comprehensive coverage of ${primaryKeyword} and its importance in today's context. We'll explore the fundamental concepts and practical applications that make this topic so valuable.

Key insights include:
- The core principles behind ${primaryKeyword}
- Real-world applications and examples
- Best practices for implementation
- Common challenges and solutions

By the end of this section, you'll have a solid foundation in ${primaryKeyword} and be ready to apply these concepts in your own projects.`;

    return NextResponse.json({
      section: mockSection,
      wordCount: mockSection.split(' ').length,
      sectionIndex: sectionIndex
    });

  } catch (error) {
    console.error('❌ Write Section API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in write-section API' },
      { status: 500 }
    );
  }
}
