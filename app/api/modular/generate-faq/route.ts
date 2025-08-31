import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('❓ Generate FAQ API - Received body:', JSON.stringify(body, null, 2));
    
    const primaryKeyword = body?.primaryKeyword || 'topic';
    
    // Generate mock FAQs
    const mockFaqs = [
      {
        question: `What is ${primaryKeyword} and why is it important?`,
        answer: `${primaryKeyword} is a fundamental concept that plays a crucial role in modern applications. Understanding it is essential for anyone looking to excel in this field.`
      },
      {
        question: `How can I get started with ${primaryKeyword}?`,
        answer: `Getting started with ${primaryKeyword} involves understanding the basics, practicing with simple examples, and gradually building up to more complex applications.`
      },
      {
        question: `What are the common challenges when working with ${primaryKeyword}?`,
        answer: `Common challenges include understanding the underlying principles, avoiding common pitfalls, and staying updated with the latest developments in the field.`
      },
      {
        question: `How does ${primaryKeyword} compare to other similar concepts?`,
        answer: `${primaryKeyword} offers unique advantages in terms of flexibility, performance, and ease of use compared to alternatives.`
      }
    ];

    return NextResponse.json({
      faqs: mockFaqs,
      count: mockFaqs.length
    });

  } catch (error) {
    console.error('❌ Generate FAQ API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error in generate-faq API' },
      { status: 500 }
    );
  }
}
