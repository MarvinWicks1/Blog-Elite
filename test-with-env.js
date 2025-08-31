// Test script for the Smart Image Enhancement API using environment variables
// Run with: node test-with-env.js

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Use Node.js built-in HTTP module
const http = require('http');

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
  }
  // Note: Not including userSettings - will use environment variables
};

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/modular/image-enhancement',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testImageEnhancementAPI() {
  try {
    console.log('🚀 Testing Smart Image Enhancement API with Environment Variables...\n');
    
    // Check if environment variables are loaded
    console.log('🔑 Environment Variables Check:');
    console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('  UPSPLASH_API_KEY:', process.env.UPSPLASH_API_KEY ? '✅ Set' : '❌ Missing');
    console.log('  UNSPLASH_ACCESS_KEY:', process.env.UNSPLASH_ACCESS_KEY ? '✅ Set' : '❌ Missing');
    console.log('');
    
    console.log('📡 Sending request to API...');
    const response = await makeRequest(testRequest);
    
    if (response.status === 200) {
      console.log('✅ API Response Success!');
      console.log('📊 Image Strategy Overview:', response.data.imageStrategy.overview);
      console.log('🎨 Visual Theme:', response.data.imageStrategy.visualTheme);
      console.log('🖼️  Number of Image Recommendations:', response.data.imageRecommendations.length);
      
      console.log('\n📸 Sample Image Recommendations:');
      response.data.imageRecommendations.slice(0, 2).forEach((rec, index) => {
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
      console.log('  Dimensions:', response.data.technicalSpecs.dimensions);
      console.log('  Formats:', response.data.technicalSpecs.formats.join(', '));
      console.log('  Optimization Tips:', response.data.technicalSpecs.optimizationTips.length, 'tips provided');
      
    } else {
      console.log('❌ API Error:', response.status);
      console.log('Error Details:', response.data.error);
      
      if (response.data.error.includes('API key')) {
        console.log('\n💡 To fix this error:');
        console.log('1. Make sure GOOGLE_API_KEY is set in .env.local');
        console.log('2. Make sure UPSPLASH_API_KEY is set in .env.local');
        console.log('3. Restart your Next.js development server after setting environment variables');
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.log('\n💡 Make sure the Next.js development server is running on port 3001');
    console.log('   Run: npm run dev');
  }
}

// Run the test
testImageEnhancementAPI();
