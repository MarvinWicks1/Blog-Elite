const fs = require('fs');
const path = require('path');

// Read the test request data
const testRequestPath = path.join(__dirname, 'targeted-refinement-test-request.json');
const testRequest = JSON.parse(fs.readFileSync(testRequestPath, 'utf8'));

// Test the API endpoint
async function testTargetedRefinement() {
  try {
    console.log('🧪 Testing Targeted Refinement API Route...\n');
    
    // Check if the route file exists
    const routePath = path.join(__dirname, 'app', 'api', 'modular', 'targeted-refinement', 'route.ts');
    if (!fs.existsSync(routePath)) {
      console.error('❌ Route file not found at:', routePath);
      return;
    }
    
    console.log('✅ Route file found at:', routePath);
    
    // Read and validate the route file
    const routeContent = fs.readFileSync(routePath, 'utf8');
    
    // Check for required components
    const checks = [
      { name: 'POST handler', pattern: /export async function POST/ },
      { name: 'getAIModel import', pattern: /import.*getAIModel.*from/ },
      { name: 'CompleteArticle interface', pattern: /interface CompleteArticle/ },
      { name: 'ProfessionalReview interface', pattern: /interface ProfessionalReview/ },
      { name: 'AIAuthenticityReview interface', pattern: /interface AIAuthenticityReview/ },
      { name: 'TargetedRefinementRequest interface', pattern: /interface TargetedRefinementRequest/ },
      { name: 'RefinedArticleResponse interface', pattern: /interface RefinedArticleResponse/ },
      { name: 'Input validation', pattern: /Validate required inputs/ },
      { name: 'AI model connection', pattern: /getAIModel.*provider.*model.*apiKey/ },
      { name: 'Response validation', pattern: /Validate AI response structure/ },
      { name: 'Error handling', pattern: /catch.*error/ }
    ];
    
    let passedChecks = 0;
    console.log('\n🔍 Validating route implementation...\n');
    
    checks.forEach(check => {
      if (check.pattern.test(routeContent)) {
        console.log(`✅ ${check.name}: Found`);
        passedChecks++;
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    });
    
    console.log(`\n📊 Route validation: ${passedChecks}/${checks.length} checks passed`);
    
    if (passedChecks === checks.length) {
      console.log('\n🎉 All checks passed! The route appears to be properly implemented.');
    } else {
      console.log('\n⚠️  Some checks failed. Please review the route implementation.');
    }
    
    // Validate test request structure
    console.log('\n🔍 Validating test request structure...\n');
    
    const requiredFields = [
      'completeArticle',
      'professionalReview', 
      'authenticityReview',
      'userSettings'
    ];
    
    const completeArticleFields = [
      'title', 'introduction', 'sections', 'conclusion'
    ];
    
    const professionalReviewFields = [
      'qualityScores', 'improvementRecommendations', 'publicationReadiness'
    ];
    
    const authenticityReviewFields = [
      'humanizationRecommendations', 'overallAssessment'
    ];
    
    let requestValid = true;
    
    // Check top-level fields
    requiredFields.forEach(field => {
      if (!testRequest[field]) {
        console.log(`❌ Missing required field: ${field}`);
        requestValid = false;
      } else {
        console.log(`✅ Found required field: ${field}`);
      }
    });
    
    // Check completeArticle structure
    if (testRequest.completeArticle) {
      completeArticleFields.forEach(field => {
        if (!testRequest.completeArticle[field]) {
          console.log(`❌ Missing completeArticle field: ${field}`);
          requestValid = false;
        } else {
          console.log(`✅ Found completeArticle field: ${field}`);
        }
      });
    }
    
    // Check professionalReview structure
    if (testRequest.professionalReview) {
      professionalReviewFields.forEach(field => {
        if (!testRequest.professionalReview[field]) {
          console.log(`❌ Missing professionalReview field: ${field}`);
          requestValid = false;
        } else {
          console.log(`✅ Found professionalReview field: ${field}`);
        }
      });
    }
    
    // Check authenticityReview structure
    if (testRequest.authenticityReview) {
      authenticityReviewFields.forEach(field => {
        if (!testRequest.authenticityReview[field]) {
          console.log(`❌ Missing authenticityReview field: ${field}`);
          requestValid = false;
        } else {
          console.log(`✅ Found authenticityReview field: ${field}`);
        }
      });
    }
    
    console.log(`\n📊 Test request validation: ${requestValid ? 'PASSED' : 'FAILED'}`);
    
    if (requestValid) {
      console.log('\n🎯 Test request is properly structured and ready for API testing!');
      console.log('\n📝 To test the API:');
      console.log('1. Set your Google API key in the test request file');
      console.log('2. Start your Next.js development server');
      console.log('3. Send a POST request to /api/modular/targeted-refinement');
      console.log('4. Use the test request data as the request body');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testTargetedRefinement();
