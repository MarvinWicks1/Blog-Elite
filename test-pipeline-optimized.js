const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  primaryKeyword: 'artificial intelligence',
  topic: 'AI in modern business',
  targetAudience: 'Business professionals and technology enthusiasts',
  baseUrl: 'http://localhost:3000',
  timeout: 120000, // 2 minutes
  qualityThresholds: {
    professionalScore: 8.0,
    authenticityScore: 80,
    confidence: 7.0
  }
};

// Test results tracking
const testResults = {
  startTime: new Date(),
  stages: {},
  errors: [],
  warnings: [],
  qualityScores: {},
  finalArticle: null,
  success: false
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📋';
  console.log(`${prefix} [${timestamp}] ${message}`);
  
  if (type === 'error') {
    testResults.errors.push({ timestamp, message });
  } else if (type === 'warning') {
    testResults.warnings.push({ timestamp, message });
  }
};

const makeRequest = async (endpoint, data) => {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(TEST_CONFIG.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};

const validateStageOutput = (stageName, data, validationRules) => {
  log(`Validating ${stageName} output...`);
  
  for (const [field, rule] of Object.entries(validationRules)) {
    if (!data[field]) {
      throw new Error(`${stageName}: Missing required field '${field}'`);
    }
    
    if (rule.type && typeof data[field] !== rule.type) {
      throw new Error(`${stageName}: Field '${field}' must be ${rule.type}, got ${typeof data[field]}`);
    }
    
    if (rule.minLength && data[field].length < rule.minLength) {
      throw new Error(`${stageName}: Field '${field}' too short (${data[field].length} < ${rule.minLength})`);
    }
    
    if (rule.minValue && data[field] < rule.minValue) {
      throw new Error(`${stageName}: Field '${field}' below minimum (${data[field]} < ${rule.minValue})`);
    }
  }
  
  log(`${stageName} validation passed`, 'success');
};

// Test the complete pipeline
const testCompletePipeline = async () => {
  log('🚀 Starting comprehensive pipeline test...');
  
  try {
    // Test 1: Content Brief Generation
    log('Testing Stage 1: Content Brief Generation');
    const briefData = await makeRequest('/api/modular/generate-brief', {
      primaryKeyword: TEST_CONFIG.primaryKeyword,
      topic: TEST_CONFIG.topic,
      targetAudience: TEST_CONFIG.targetAudience
    });
    
    validateStageOutput('Brief Generation', briefData, {
      title: { type: 'string', minLength: 10 },
      summary: { type: 'string', minLength: 50 },
      keyObjectives: { type: 'object' },
      contentStructure: { type: 'object' }
    });
    
    testResults.stages.brief = { status: 'passed', data: briefData };
    
    // Test 2: Content Outline Generation
    log('Testing Stage 2: Content Outline Generation');
    const outlineData = await makeRequest('/api/modular/generate-outline', {
      primaryKeyword: TEST_CONFIG.primaryKeyword,
      topic: TEST_CONFIG.topic,
      targetAudience: TEST_CONFIG.targetAudience
    });
    
    validateStageOutput('Outline Generation', outlineData, {
      title: { type: 'string', minLength: 10 },
      mainSections: { type: 'object' },
      faqSection: { type: 'object' }
    });
    
    testResults.stages.outline = { status: 'passed', data: outlineData };
    
    // Test 3: Introduction Writing
    log('Testing Stage 3: Introduction Writing');
    const introData = await makeRequest('/api/modular/write-introduction', {
      outline: outlineData,
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('Introduction Writing', introData, {
      introduction: { type: 'string', minLength: 100 },
      wordCount: { type: 'number', minValue: 100 },
      includesPrimaryKeyword: { type: 'boolean' }
    });
    
    testResults.stages.introduction = { status: 'passed', data: introData };
    
    // Test 4: Section Writing (test first section)
    log('Testing Stage 4: Section Writing');
    const sectionData = await makeRequest('/api/modular/write-section', {
      outline: outlineData,
      sectionIndex: 0,
      previousSections: [],
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('Section Writing', sectionData, {
      section: { type: 'string', minLength: 300 },
      wordCount: { type: 'number', minValue: 300 },
      sectionIndex: { type: 'number' }
    });
    
    testResults.stages.section = { status: 'passed', data: sectionData };
    
    // Test 5: FAQ Generation
    log('Testing Stage 5: FAQ Generation');
    const faqData = await makeRequest('/api/modular/generate-faq', {
      outline: outlineData,
      sections: [sectionData.section],
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('FAQ Generation', faqData, {
      faqs: { type: 'object' },
      count: { type: 'number', minValue: 3 }
    });
    
    testResults.stages.faq = { status: 'passed', data: faqData };
    
    // Test 6: Conclusion Writing
    log('Testing Stage 6: Conclusion Writing');
    const conclusionData = await makeRequest('/api/modular/write-conclusion', {
      outline: outlineData,
      introduction: introData.introduction,
      sections: [sectionData.section],
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('Conclusion Writing', conclusionData, {
      conclusion: { type: 'string', minLength: 100 },
      wordCount: { type: 'number', minValue: 100 }
    });
    
    testResults.stages.conclusion = { status: 'passed', data: conclusionData };
    
    // Test 7: Content Assembly
    log('Testing Stage 7: Content Assembly');
    const assemblyData = await makeRequest('/api/modular/assemble-content', {
      title: outlineData.title,
      introduction: introData.introduction,
      sections: [sectionData.section],
      faqs: faqData.faqs,
      conclusion: conclusionData.conclusion,
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('Content Assembly', assemblyData, {
      assembledContent: { type: 'string', minLength: 1000 },
      wordCount: { type: 'number', minValue: 1000 }
    });
    
    testResults.stages.assembly = { status: 'passed', data: assemblyData };
    
    // Test 8: SEO Analysis
    log('Testing Stage 8: SEO Analysis');
    const seoAnalysisData = await makeRequest('/api/modular/seo-analysis', {
      content: assemblyData.assembledContent,
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('SEO Analysis', seoAnalysisData, {
      seoScore: { type: 'number', minValue: 1 },
      keywordDensity: { type: 'number', minValue: 0 },
      metaTitle: { type: 'string', minLength: 10 }
    });
    
    testResults.stages.seoAnalysis = { status: 'passed', data: seoAnalysisData };
    
    // Test 9: SEO Implementation
    log('Testing Stage 9: SEO Implementation');
    const seoImplementationData = await makeRequest('/api/modular/seo-implementation', {
      content: assemblyData.assembledContent,
      seoAnalysis: seoAnalysisData,
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('SEO Implementation', seoImplementationData, {
      optimizedContent: { type: 'string', minLength: 1000 },
      seoScore: { type: 'number', minValue: 1 }
    });
    
    testResults.stages.seoImplementation = { status: 'passed', data: seoImplementationData };
    
    // Test 10: Content Humanization
    log('Testing Stage 10: Content Humanization');
    const humanizationData = await makeRequest('/api/modular/humanize-content', {
      content: seoImplementationData.optimizedContent,
      primaryKeyword: TEST_CONFIG.primaryKeyword
    });
    
    validateStageOutput('Content Humanization', humanizationData, {
      humanizedContent: { type: 'string', minLength: 1000 },
      humanizationScore: { type: 'number', minValue: 1 }
    });
    
    testResults.stages.humanization = { status: 'passed', data: humanizationData };
    
    // Test 11: Keyword Research
    log('Testing Stage 11: Keyword Research');
    const keywordData = await makeRequest('/api/modular/keyword-research', {
      primaryKeyword: TEST_CONFIG.primaryKeyword,
      topic: TEST_CONFIG.topic,
      targetAudience: TEST_CONFIG.targetAudience
    });
    
    validateStageOutput('Keyword Research', keywordData, {
      primaryKeyword: { type: 'string', minLength: 1 },
      semanticKeywords: { type: 'object' },
      relatedQuestions: { type: 'object' }
    });
    
    testResults.stages.keywordResearch = { status: 'passed', data: keywordData };
    
    // Test 12: Image Enhancement
    log('Testing Stage 12: Image Enhancement');
    const imageData = await makeRequest('/api/modular/image-enhancement', {
      humanizedContent: {
        content: humanizationData.humanizedContent,
        title: outlineData.title,
        sections: [sectionData.section]
      },
      articleTitle: outlineData.title,
      keywordResearch: keywordData
    });
    
    validateStageOutput('Image Enhancement', imageData, {
      imageRecommendations: { type: 'object' },
      images: { type: 'object' }
    });
    
    testResults.stages.imageEnhancement = { status: 'passed', data: imageData };
    
    // Test 13: Professional Review
    log('Testing Stage 13: Professional Review');
    const reviewData = await makeRequest('/api/modular/professional-critic', {
      completeArticle: {
        title: outlineData.title,
        introduction: introData.introduction,
        sections: [{ title: outlineData.mainSections[0].heading, content: sectionData.section }],
        conclusion: conclusionData.conclusion,
        faq: faqData.faqs,
        seoOptimization: seoImplementationData.metaTags,
        images: imageData.images || []
      }
    });
    
    validateStageOutput('Professional Review', reviewData, {
      qualityScores: { type: 'object' },
      overallScore: { type: 'number', minValue: 1 },
      improvementRecommendations: { type: 'object' }
    });
    
    testResults.stages.professionalReview = { status: 'passed', data: reviewData };
    testResults.qualityScores.professional = reviewData.overallScore;
    
    // Test 14: AI Authenticity Review
    log('Testing Stage 14: AI Authenticity Review');
    const authenticityData = await makeRequest('/api/modular/ai-authenticity-review', {
      content: humanizationData.humanizedContent,
      primaryKeyword: TEST_CONFIG.primaryKeyword,
      completeArticle: {
        title: outlineData.title,
        introduction: introData.introduction,
        sections: [{ title: outlineData.mainSections[0].heading, content: sectionData.section }],
        conclusion: conclusionData.conclusion,
        faq: faqData.faqs,
        seoOptimization: seoImplementationData.metaTags,
        images: imageData.images || []
      }
    });
    
    validateStageOutput('AI Authenticity Review', authenticityData, {
      authenticityScore: { type: 'number', minValue: 1 },
      humanizationRecommendations: { type: 'object' },
      overallAssessment: { type: 'object' }
    });
    
    testResults.stages.authenticityReview = { status: 'passed', data: authenticityData };
    testResults.qualityScores.authenticity = authenticityData.authenticityScore;
    
    // Test 15: Targeted Refinement
    log('Testing Stage 15: Targeted Refinement');
    const refinementData = await makeRequest('/api/modular/targeted-refinement', {
      completeArticle: {
        title: outlineData.title,
        introduction: introData.introduction,
        sections: [{ title: outlineData.mainSections[0].heading, content: sectionData.section }],
        conclusion: conclusionData.conclusion,
        faq: faqData.faqs,
        seoOptimization: seoImplementationData.metaTags,
        images: imageData.images || []
      },
      professionalReview: reviewData,
      authenticityReview: authenticityData
    });
    
    validateStageOutput('Targeted Refinement', refinementData, {
      finalArticle: { type: 'object' },
      refinement: { type: 'object' },
      metadata: { type: 'object' }
    });
    
    testResults.stages.targetedRefinement = { status: 'passed', data: refinementData };
    testResults.finalArticle = refinementData.finalArticle;
    
    // Quality threshold validation
    const finalQuality = refinementData.refinement?.finalQualityMetrics;
    if (finalQuality) {
      testResults.qualityScores.final = {
        professional: finalQuality.professionalScore,
        authenticity: finalQuality.authenticityScore,
        confidence: finalQuality.confidence
      };
      
      const meetsThresholds = 
        finalQuality.professionalScore >= TEST_CONFIG.qualityThresholds.professionalScore &&
        finalQuality.authenticityScore >= TEST_CONFIG.qualityThresholds.authenticityScore &&
        finalQuality.confidence >= TEST_CONFIG.qualityThresholds.confidence;
      
      if (meetsThresholds) {
        log('🎉 All quality thresholds met!', 'success');
        testResults.success = true;
      } else {
        log('⚠️ Some quality thresholds not met', 'warning');
        testResults.success = false;
      }
    }
    
    // Test 16: Complete Pipeline
    log('Testing Stage 16: Complete Pipeline Integration');
    const pipelineData = await makeRequest('/api/modular/content-pipeline', {
      primaryKeyword: TEST_CONFIG.primaryKeyword,
      topic: TEST_CONFIG.topic,
      targetAudience: TEST_CONFIG.targetAudience
    });
    
    validateStageOutput('Complete Pipeline', pipelineData, {
      pipelineStatus: { type: 'string' },
      stages: { type: 'object' },
      finalArticle: { type: 'object' }
    });
    
    testResults.stages.completePipeline = { status: 'passed', data: pipelineData };
    
    log('🎉 All pipeline stages completed successfully!', 'success');
    
  } catch (error) {
    log(`Pipeline test failed: ${error.message}`, 'error');
    testResults.success = false;
  }
  
  // Generate test report
  generateTestReport();
};

const generateTestReport = () => {
  const endTime = new Date();
  const duration = endTime - testResults.startTime;
  
  const report = {
    testConfiguration: TEST_CONFIG,
    testResults: {
      success: testResults.success,
      duration: `${duration}ms`,
      startTime: testResults.startTime.toISOString(),
      endTime: endTime.toISOString(),
      stages: testResults.stages,
      qualityScores: testResults.qualityScores,
      errors: testResults.errors,
      warnings: testResults.warnings,
      finalArticle: testResults.finalArticle ? {
        title: testResults.finalArticle.title,
        wordCount: testResults.finalArticle.introduction?.split(' ').length + 
                   (testResults.finalArticle.sections || []).reduce((sum, s) => sum + s.content.split(' ').length, 0) +
                   testResults.finalArticle.conclusion?.split(' ').length,
        sections: testResults.finalArticle.sections?.length || 0
      } : null
    },
    summary: {
      totalStages: Object.keys(testResults.stages).length,
      passedStages: Object.values(testResults.stages).filter(s => s.status === 'passed').length,
      failedStages: Object.values(testResults.stages).filter(s => s.status === 'failed').length,
      errorCount: testResults.errors.length,
      warningCount: testResults.warnings.length,
      qualityThresholdsMet: testResults.success
    }
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, 'pipeline-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 PIPELINE TEST SUMMARY');
  console.log('========================');
  console.log(`✅ Success: ${testResults.success ? 'YES' : 'NO'}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📋 Stages: ${report.summary.passedStages}/${report.summary.totalStages} passed`);
  console.log(`❌ Errors: ${report.summary.errorCount}`);
  console.log(`⚠️  Warnings: ${report.summary.warningCount}`);
  
  if (testResults.qualityScores.final) {
    console.log('\n🎯 QUALITY SCORES');
    console.log('================');
    console.log(`Professional: ${testResults.qualityScores.final.professional}/10`);
    console.log(`Authenticity: ${testResults.qualityScores.final.authenticity}/100`);
    console.log(`Confidence: ${testResults.qualityScores.final.confidence}/10`);
  }
  
  if (testResults.finalArticle) {
    console.log('\n📝 FINAL ARTICLE');
    console.log('===============');
    console.log(`Title: ${testResults.finalArticle.title}`);
    console.log(`Word Count: ${report.testResults.finalArticle.wordCount}`);
    console.log(`Sections: ${report.testResults.finalArticle.sections}`);
  }
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
};

// Run the test
if (require.main === module) {
  testCompletePipeline().catch(error => {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { testCompletePipeline, TEST_CONFIG };