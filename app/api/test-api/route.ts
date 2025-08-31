import { NextRequest, NextResponse } from 'next/server';
import { getAIModel } from '@/lib/ai-providers';

// Define a type for the request body to ensure proper data handling
interface RequestBody {
  apiKey?: string;
  provider?: string;
  model?: string;
  userSettings?: {
    aiSettings?: {
      selectedProvider?: string;
      selectedModel?: string;
      apiKeys?: {
        google?: string;
      };
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userSettings } = (await req.json()) as RequestBody;

    if (!userSettings?.aiSettings?.apiKeys?.google) {
      return NextResponse.json(
        { error: 'API key is missing in userSettings' },
        { status: 400 }
      );
    }

    const apiKey = userSettings.aiSettings.apiKeys.google;
    const provider = userSettings.aiSettings.selectedProvider || 'google';
    const model = userSettings.aiSettings.selectedModel || 'gemini-1.5-pro';

    // This attempts to create an AI model to validate the key
    const aiModel = await getAIModel(provider, model, apiKey);

    return NextResponse.json(
      { 
        message: 'API key validated successfully!',
        provider: provider,
        model: model
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('API Test Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during API validation' },
      { status: 500 }
    );
  }
}
