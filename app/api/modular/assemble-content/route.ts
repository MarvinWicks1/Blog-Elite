import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔧 Assemble Content API - Received body:', JSON.stringify(body, null, 2));
    
    const { title, introduction, sections, faqs, conclusion, primaryKeyword } = body;
    
    // Assemble the content
    const assembledContent = `${title || 'Generated Blog Post'}

${introduction || 'Introduction placeholder'}

${sections?.map((section: string, index: number) => `## Section ${index + 1}

${section}`).join('\n\n') || '## Main Content\n\nContent sections will appear here.'}

${faqs ? `## Frequently Asked Questions

${faqs.map((faq: any) => `### ${faq.question}

${faq.answer}`).join('\n\n')}` : ''}

${conclusion || '## Conclusion\n\nConclusion will appear here.'}`;

    const wordCount = assembledContent.split(' ').length;
    
    return NextResponse.json({
      assembledContent,
      wordCount,
      sections: sections?.length || 0,
      faqCount: faqs?.length || 0,
      hasIntroduction: !!introduction,
      hasConclusion: !!conclusion
    });

  } catch (error) {
    console.error('❌ Assemble Content API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in assemble-content API' },
      { status: 500 }
    );
  }
}
