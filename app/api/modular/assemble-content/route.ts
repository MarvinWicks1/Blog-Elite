import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔧 Assemble Content API - Received body:', JSON.stringify(body, null, 2));
    
    const { title, introduction, sections, faqs, conclusion, primaryKeyword } = body;

    // Ensure all inputs are treated as plain text to avoid leaking HTML/comments downstream
    const stripHtmlComments = (text: string) => typeof text === 'string' ? text.replace(/<!--[\s\S]*?-->/g, '') : '';
    const toPlain = (text: any) => typeof text === 'string' ? stripHtmlComments(text).replace(/<[^>]+>/g, '') : '';
    
    // Assemble the content
    const assembledContent = `${toPlain(title) || 'Generated Blog Post'}

${toPlain(introduction) || 'Introduction placeholder'}

${sections?.map((section: string, index: number) => `## Section ${index + 1}

${toPlain(section)}`).join('\n\n') || '## Main Content\n\nContent sections will appear here.'}

${faqs ? `## Frequently Asked Questions

${faqs.map((faq: any) => `### ${toPlain(faq.question)}

${toPlain(faq.answer)}`).join('\n\n')}` : ''}

${toPlain(conclusion) || '## Conclusion\n\nConclusion will appear here.'}`;

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
