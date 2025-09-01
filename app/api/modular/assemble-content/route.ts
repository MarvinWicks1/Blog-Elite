import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔧 Assemble Content API - Received body:', JSON.stringify(body, null, 2));
    
    const { title, introduction, sections, faqs, conclusion, primaryKeyword, outline } = body;

    // Ensure all inputs are treated as plain text to avoid leaking HTML/comments downstream
    const stripHtmlComments = (text: string) => typeof text === 'string' ? text.replace(/<!--[\s\S]*?-->/g, '') : '';
    const toPlain = (text: any) => typeof text === 'string' ? stripHtmlComments(text).replace(/<[^>]+>/g, '') : '';

    const chooseTitle = () => toPlain(title) || toPlain(outline?.title) || 'Generated Blog Post';

    // Ensure each section mentions the primary keyword at least once (light-touch insertion)
    const ensureKeyword = (sectionText: string): string => {
      const text = toPlain(sectionText) || '';
      if (!primaryKeyword) return text;
      const hasKw = new RegExp(`\\b${primaryKeyword.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(text);
      if (hasKw) return text;
      // If the section starts with a heading line, insert a context sentence after it
      const lines = text.split('\n');
      if (lines.length > 0 && /^##\s+/.test(lines[0])) {
        lines.splice(1, 0, `In the context of ${primaryKeyword}, this section provides practical insight.`);
        return lines.join('\n');
      }
      return `In the context of ${primaryKeyword}, ${text}`;
    };

    // De-duplicate repeated paragraphs across the final content
    const dedupeParagraphs = (content: string): string => {
      const paras = content.split(/\n\n+/);
      const seen = new Set<string>();
      const result: string[] = [];
      for (const p of paras) {
        const k = p.trim().toLowerCase();
        if (!k) continue;
        if (!seen.has(k)) {
          seen.add(k);
          result.push(p);
        }
      }
      return result.join('\n\n');
    };
    
    // Assemble the content
    const assembledContentRaw = `${chooseTitle()}

${toPlain(introduction) || 'Introduction placeholder'}

${sections?.map((section: string) => `${ensureKeyword(section)}`).join('\n\n') || '## Main Content\n\nContent sections will appear here.'}

${faqs ? `## Frequently Asked Questions

${faqs.map((faq: any) => `### ${toPlain(faq.question)}

${toPlain(faq.answer)}`).join('\n\n')}` : ''}

${toPlain(conclusion) || '## Conclusion\n\nConclusion will appear here.'}`;

    const assembledContent = dedupeParagraphs(assembledContentRaw);

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
