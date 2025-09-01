import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('👤 Humanize Content API - Received body:', JSON.stringify(body, null, 2));
    
    const { content, primaryKeyword } = body;
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: content must be a non-empty string' },
        { status: 400 }
      );
    }
    
    // Basic text heuristics to estimate AI-detection risk proxy
    const computeHeuristics = (text: string) => {
      const tokens = text.toLowerCase().match(/[a-z0-9']+/g) || [];
      const uniqueTokens = new Set(tokens);
      const typeTokenRatio = tokens.length > 0 ? uniqueTokens.size / tokens.length : 0;
      const sentences = text.split(/[.!?]+\s/).filter(Boolean);
      const sentenceLengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
      const avgLen = sentenceLengths.length ? sentenceLengths.reduce((a,b)=>a+b,0) / sentenceLengths.length : 0;
      const variance = sentenceLengths.length ? sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLen, 2), 0) / sentenceLengths.length : 0;
      // Heuristic risk score: lower diversity and lower variance => higher risk
      const diversityScore = Math.min(1, typeTokenRatio * 4); // cap
      const varianceScore = Math.min(1, Math.sqrt(variance) / 20);
      const aiRiskScore = Math.max(0, 1 - (diversityScore * 0.6 + varianceScore * 0.4));
      return { typeTokenRatio, avgSentenceLength: avgLen, sentenceLengthVariance: variance, aiRiskScore };
    };
    
    const before = computeHeuristics(content);

    // Generate mock humanized content
    const mockHumanizedContent = content
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bmoreover\b/gi, 'also')
      + `\n\n<!-- Humanized Content -->\n<!-- Enhanced with conversational transitions, concrete examples, and varied sentence structures. -->`;
    const after = computeHeuristics(mockHumanizedContent);
    
    const mockHumanization = {
      humanizedContent: mockHumanizedContent,
      humanizationScore: Math.round(((1 - after.aiRiskScore) * 100 + 75) / 2),
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
        authenticityScore: Math.round((1 - after.aiRiskScore) * 100)
      },
      aiDetectionRisk: {
        before: Number(before.aiRiskScore.toFixed(3)),
        after: Number(after.aiRiskScore.toFixed(3)),
        reduction: Number(Math.max(0, before.aiRiskScore - after.aiRiskScore).toFixed(3)),
        notes: after.aiRiskScore < before.aiRiskScore ? 'Risk reduced via improved diversity and sentence variance' : 'No reduction detected'
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
