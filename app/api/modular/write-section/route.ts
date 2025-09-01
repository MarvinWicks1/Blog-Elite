import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

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
    
    // Attempt AI-generated section if key available
    let sectionContent: string | null = null;
    try {
      if (!fallbackMode) {
        const aiModel = await getAIModel(provider, userSettings?.aiSettings?.selectedModel || 'gemini-1.5-pro', apiKey as string)
        const systemInstruction = `You are a subject-matter expert writer. Write the body for a section with the given heading and context. No headings, no markdown hashes. Return ONLY JSON: {"section":"...","wordCount":123,"sectionIndex":${sectionIndex}}.`
        const userPrompt = `Heading: ${sectionHeading}
Primary keyword: ${primaryKeyword}
Previous sections (titles only): ${(body?.previousSections || []).map((s: string) => (s.match(/^##\s*(.*)$/m) || [,''])[1]).filter(Boolean).join(', ')}
Expectations:
- 350-600 words, concrete examples and specifics
- Avoid repeating previous content
- Natural transitions and scannable short paragraphs
Return strict JSON only.`
        // @ts-ignore
        const aiResult = await aiModel.generateContent({ contents: [{ role:'user', parts:[{ text: `${systemInstruction}\n\n${userPrompt}`}]}] })
        // @ts-ignore
        const textResponse: string = aiResult?.response?.text?.() || ''
        let jsonString = textResponse.trim().replace(/^```json\n?|```$/g,'').replace(/^```\n?|```$/g,'')
        const match = jsonString.match(/\{[\s\S]*\}/)
        if (match) jsonString = match[0]
        const parsed = JSON.parse(jsonString)
        if (parsed?.section) {
          sectionContent = String(parsed.section)
        }
      }
    } catch (err) {
      console.warn('Write Section: AI generation failed, using mock.', err)
    }

    // Fallback mock
    const mockSection = `## ${sectionHeading}

This section provides comprehensive coverage of ${primaryKeyword} and its importance in today's context. We'll explore the fundamental concepts and practical applications that make this topic so valuable.

Key insights include:
- The core principles behind ${primaryKeyword}
- Real-world applications and examples
- Best practices for implementation
- Common challenges and solutions

By the end of this section, you'll have a solid foundation in ${primaryKeyword} and be ready to apply these concepts in your own projects.`;

    const finalSection = sectionContent || mockSection;
    return NextResponse.json({
      section: finalSection,
      wordCount: finalSection.split(' ').length,
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
