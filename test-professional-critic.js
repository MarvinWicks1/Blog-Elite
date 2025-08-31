const fs = require('fs');
const path = require('path');

// Read the test request data
const testData = JSON.parse(fs.readFileSync('professional-critic-test-request.json', 'utf8'));

// Test the professional critic route
async function testProfessionalCritic() {
  try {
    console.log('🧪 Testing Professional Critic Route...\n');
    
    // Simulate the request to the API route
    const response = await fetch('http://localhost:3000/api/modular/professional-critic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Route test failed with status ${response.status}:`);
      console.error(errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Professional Critic Route Test Successful!\n');
    console.log('📊 Review Results:');
    console.log(`   Critic: ${result.review.criticProfile.name}`);
    console.log(`   Experience: ${result.review.criticProfile.experience}`);
    console.log(`   Review Date: ${result.review.criticProfile.reviewDate}\n`);
    
    console.log('🎯 Quality Scores:');
    Object.entries(result.review.qualityScores).forEach(([category, score]) => {
      const emoji = score >= 8 ? '🟢' : score >= 6 ? '🟡' : '🔴';
      console.log(`   ${emoji} ${category}: ${score}/10`);
    });
    
    console.log(`\n🏆 Overall Score: ${result.review.overallScore}/10`);
    console.log(`📝 Publication Ready: ${result.review.publicationReadiness.isReady ? 'Yes' : 'No'}`);
    console.log(`🎯 Confidence: ${result.review.publicationReadiness.confidence}/10`);
    
    console.log('\n💡 Key Recommendations:');
    if (result.review.improvementRecommendations.critical.length > 0) {
      console.log('   🔴 Critical (Must Fix):');
      result.review.improvementRecommendations.critical.forEach(rec => 
        console.log(`      • ${rec}`)
      );
    }
    
    if (result.review.improvementRecommendations.important.length > 0) {
      console.log('   🟡 Important (Should Fix):');
      result.review.improvementRecommendations.important.forEach(rec => 
        console.log(`      • ${rec}`)
      );
    }
    
    console.log('\n📋 Metadata:');
    console.log(`   Article: ${result.metadata.articleTitle}`);
    console.log(`   Word Count: ${result.metadata.wordCount}`);
    console.log(`   Sections: ${result.metadata.sectionsCount}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js development server is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

// Run the test
testProfessionalCritic();
