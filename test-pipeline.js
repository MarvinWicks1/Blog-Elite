// Test script for content-pipeline endpoint
const testPipeline = async () => {
  try {
    console.log('🧪 Testing content-pipeline endpoint...');
    
    const response = await fetch('http://localhost:3000/api/modular/content-pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryKeyword: 'artificial intelligence',
        topic: 'How to implement AI in business',
        targetAudience: 'Business owners and managers'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Pipeline failed with status ${response.status}:`, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Pipeline completed successfully!');
    console.log('📊 Pipeline status:', data.pipelineStatus);
    console.log('📋 Stages completed:', Object.keys(data.stages).filter(key => data.stages[key].status === 'completed').length);
    
    if (data.finalContent) {
      console.log('📝 Final content length:', data.finalContent.seoOptimizedContent?.length || 'N/A');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Run the test
testPipeline();
