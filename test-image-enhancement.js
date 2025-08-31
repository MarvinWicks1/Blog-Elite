// Test script for the Smart Image Enhancement API
// Run with: node test-image-enhancement.js

const testRequest = {
  humanizedContent: {
    content: "Digital marketing has evolved significantly over the past decade, with artificial intelligence and machine learning playing increasingly important roles. From personalized content recommendations to automated ad optimization, AI is transforming how businesses connect with their audiences.",
    title: "Digital Marketing Guide",
    sections: [
      "Introduction to AI in Marketing",
      "Personalization Strategies",
      "Automation Tools and Platforms"
    ]
  },
  articleTitle: "The Complete Guide to AI-Powered Digital Marketing in 2024",
  keywordResearch: {
    primaryKeyword: "AI digital marketing",
    keywordAnalysis: "High search volume, competitive keyword with growing interest in AI-powered marketing solutions",
    semanticKeywords: [
      "artificial intelligence marketing",
      "machine learning advertising",
      "automated marketing campaigns"
    ],
    longTailKeywords: [
      "how to use AI for digital marketing",
      "best AI marketing tools 2024"
    ],
    relatedQuestions: [
      "How does AI improve digital marketing ROI?",
      "What are the best AI marketing platforms?"
    ],
    contentGaps: [
      "Practical implementation guides",
      "ROI measurement frameworks"
    ],
    targetKeywordDensity: "2-3%",
    seoOpportunities: [
      "Create comprehensive guides",
      "Include case studies"
    ]
  },
  userSettings: {
    aiSettings: {
      selectedProvider: "google",
      selectedModel: "gemini-1.5-pro",
      apiKeys: {
        google: process.env.GOOGLE_API_KEY || "YOUR_GOOGLE_API_KEY_HERE",
        unsplash: process.env.UNSPLASH_ACCESS_KEY || "YOUR_UNSPLASH_ACCESS_KEY_HERE"
      }
    }
  }
};

async function testImageEnhancementAPI() {
  try {
    console.log('🚀 Testing Smart Image Enhancement API...\n');
    
         const response = await fetch('http://localhost:3001/api/modular/image-enhancement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response Success!');
      console.log('📊 Image Strategy Overview:', data.imageStrategy.overview);
      console.log('🎨 Visual Theme:', data.imageStrategy.visualTheme);
      console.log('🖼️  Number of Image Recommendations:', data.imageRecommendations.length);
      
      console.log('\n📸 Sample Image Recommendations:');
      data.imageRecommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.placement}: ${rec.description}`);
        console.log(`     Alt Text: ${rec.altText}`);
        console.log(`     Relevance Score: ${rec.relevanceScore}/10`);
        console.log(`     SEO Value: ${rec.seoValue}`);
        if (rec.unsplashUrl) {
          console.log(`     Unsplash URL: ${rec.unsplashUrl}`);
        }
        console.log('');
      });
      
      console.log('🔧 Technical Specifications:');
      console.log('  Dimensions:', data.technicalSpecs.dimensions);
      console.log('  Formats:', data.technicalSpecs.formats.join(', '));
      console.log('  Optimization Tips:', data.technicalSpecs.optimizationTips.length, 'tips provided');
      
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('Error Details:', data.error);
      
      if (data.error.includes('API key')) {
        console.log('\n💡 To fix this error:');
        console.log('1. Set GOOGLE_API_KEY environment variable');
        console.log('2. Set UNSPLASH_ACCESS_KEY environment variable');
        console.log('3. Or provide API keys in the userSettings.aiSettings.apiKeys object');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

// Run the test
testImageEnhancementAPI();
