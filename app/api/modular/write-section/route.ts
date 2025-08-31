import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📚 Write Section API - Received body:', JSON.stringify(body, null, 2));
    
    const sectionIndex = body?.sectionIndex || 0;
    const primaryKeyword = body?.primaryKeyword || 'topic';
    
    // Generate a mock section
    const mockSection = `## Section ${sectionIndex + 1}: Understanding ${primaryKeyword}

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
