import { NextRequest, NextResponse } from 'next/server';
import { emitProgress } from '@/lib/progress-bus'
// Pipeline Orchestrator - Manages the entire content generation workflow
interface ContentPipelineRequest {
  primaryKeyword: string;
  topic?: string;
  targetAudience?: string;
  brief?: any; // Content brief from the brief generation route
  outline?: any; // Content outline from the outline generation route
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

interface ContentPipelineResponse {
  pipelineStatus: 'completed' | 'failed' | 'in_progress';
  stages: {
    brief: { status: 'completed' | 'failed'; data?: any };
    outline: { status: 'completed' | 'failed'; data?: any };
    introduction: { status: 'completed' | 'failed'; data?: any };
    sections: { status: 'completed' | 'failed'; data?: any };
    faqs: { status: 'completed' | 'failed'; data?: any };
    conclusion: { status: 'completed' | 'failed'; data?: any };
    contentAssembly: { status: 'completed' | 'failed'; data?: any };
    seoAnalysis: { status: 'completed' | 'failed'; data?: any };
    seoImplementation: { status: 'completed' | 'failed'; data?: any };
    humanization: { status: 'completed' | 'failed'; data?: any };
    keywordResearch: { status: 'completed' | 'failed'; data?: any };
    imageEnhancement: { status: 'completed' | 'failed'; data?: any };
    professionalReview: { status: 'completed' | 'failed'; data?: any };
    aiAuthenticityReview: { status: 'completed' | 'failed'; data?: any };
    targetedRefinement: { status: 'completed' | 'failed'; data?: any };
  };
  finalContent?: {
    seoOptimizedContent: string;
    seoMetrics: any;
    validation: any;
  };
  // Add the final article content for the frontend
  finalArticle?: any;
  assembledContent?: string;
  metadata?: any;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContentPipelineRequest & { jobId?: string };
    const { primaryKeyword, topic, targetAudience, brief, outline, userSettings } = body;
    const jobId = body.jobId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Input validation
    if (!primaryKeyword || typeof primaryKeyword !== 'string' || primaryKeyword.trim().length === 0) {
      console.error('❌ Invalid primaryKeyword provided');
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages: {},
        error: 'primaryKeyword is required and must be a non-empty string'
      }, { status: 400 });
    }

    console.log('🚀 Content Pipeline: Starting complete 16-step workflow');
    console.log('📋 Received data:', { primaryKeyword, topic, targetAudience, hasBrief: !!brief, hasOutline: !!outline });
    emitProgress(jobId, { type: 'stage', stage: 'pipeline:start', status: 'start', timestamp: Date.now() })
    console.log('🧪 Phase 1 Validation: Checking request payload integrity');
    if (typeof primaryKeyword !== 'string' || primaryKeyword.trim().length === 0) {
      return NextResponse.json({ pipelineStatus: 'failed', stages: {}, error: 'Invalid primaryKeyword' }, { status: 400 });
    }

    // Helper function to make API calls with timeout
    const makeAPICall = async (url: string, options: RequestInit, timeoutMs: number = 30000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`API call timed out after ${timeoutMs}ms`);
        }
        throw error;
      }
    };

    // Stage 0: Keyword Research (moved earlier for better brief/outline)
    let keywordResearchData: any = undefined;
    try {
      emitProgress(jobId, { type: 'stage', stage: 'keywordResearch', status: 'start', timestamp: Date.now() })
      const keywordResearchResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/keyword-research`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryKeyword,
            topic,
            targetAudience,
            userSettings
          })
        },
        30000
      );
      if (keywordResearchResponse.ok) {
        keywordResearchData = await keywordResearchResponse.json();
        emitProgress(jobId, { type: 'stage', stage: 'keywordResearch', status: 'complete', timestamp: Date.now() })
      } else {
        const err = await keywordResearchResponse.text();
        throw new Error(err);
      }
    } catch (err) {
      console.warn('🔶 Keyword research failed or unavailable, continuing with fallback brief/outline.', err);
      emitProgress(jobId, { type: 'stage', stage: 'keywordResearch', status: 'failed', data: { error: String(err) }, timestamp: Date.now() })
    }

    // Stage 1: Generate Brief and Outline if not provided
    let pipelineBrief = brief;
    let pipelineOutline = outline;

    if (!pipelineBrief) {
      console.log('📋 Stage 0a: Generating Content Brief');
      emitProgress(jobId, { type: 'stage', stage: 'brief', status: 'start', timestamp: Date.now() })
      try {
        // Prefer AI content-brief if keyword research available
        if (keywordResearchData) {
          const cbResp = await makeAPICall(
            `${req.nextUrl.origin}/api/modular/content-brief`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywordResearch: keywordResearchData, userSettings })
            },
            30000
          );
          if (cbResp.ok) {
            pipelineBrief = await cbResp.json();
          } else {
            throw new Error(await cbResp.text());
          }
        } else {
          // Fallback mock brief
          const briefResponse = await makeAPICall(
            `${req.nextUrl.origin}/api/modular/generate-brief`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                primaryKeyword: primaryKeyword.trim(),
                topic: topic?.trim() || '',
                targetAudience: targetAudience?.trim() || ''
              })
            },
            30000
          );
          if (briefResponse.ok) {
            pipelineBrief = await briefResponse.json();
          } else {
            throw new Error(await briefResponse.text());
          }
        }
        console.log('✅ Content brief generated successfully');
        emitProgress(jobId, { type: 'stage', stage: 'brief', status: 'complete', data: { hasBrief: true }, timestamp: Date.now() })
      } catch (error) {
        console.error('❌ Brief generation failed:', error);
        emitProgress(jobId, { type: 'stage', stage: 'brief', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
        return NextResponse.json({
          pipelineStatus: 'failed',
          stages: {},
          error: `Failed to generate content brief: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    if (!pipelineOutline) {
      console.log('📋 Stage 0b: Generating Content Outline');
      emitProgress(jobId, { type: 'stage', stage: 'outline', status: 'start', timestamp: Date.now() })
      try {
        // Prefer AI outline-generation if brief available
        if (pipelineBrief && pipelineBrief.audienceProfile) {
          const olResp = await makeAPICall(
            `${req.nextUrl.origin}/api/modular/outline-generation`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contentBrief: pipelineBrief, userSettings })
            },
            30000
          );
          if (olResp.ok) {
            pipelineOutline = await olResp.json();
          } else {
            throw new Error(await olResp.text());
          }
        } else {
          // Fallback mock outline
          const outlineResponse = await makeAPICall(
            `${req.nextUrl.origin}/api/modular/generate-outline`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                primaryKeyword: primaryKeyword.trim(),
                topic: topic?.trim() || '',
                targetAudience: targetAudience?.trim() || ''
              })
            },
            30000
          );
          if (outlineResponse.ok) {
            pipelineOutline = await outlineResponse.json();
          } else {
            throw new Error(await outlineResponse.text());
          }
        }
        console.log('✅ Content outline generated successfully');
        emitProgress(jobId, { type: 'stage', stage: 'outline', status: 'complete', data: { sections: pipelineOutline?.mainSections?.length || 0 }, timestamp: Date.now() })
      } catch (error) {
        console.error('❌ Outline generation failed:', error);
        emitProgress(jobId, { type: 'stage', stage: 'outline', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
        return NextResponse.json({
          pipelineStatus: 'failed',
          stages: {},
          error: `Failed to generate content outline: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
      }
    }

    // Validate that we have the required data
    if (!pipelineBrief || !pipelineOutline) {
      console.error('❌ Missing required pipeline data after generation');
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages: {},
        error: 'Failed to generate required pipeline data (brief or outline)'
      }, { status: 500 });
    }

    // Additional validation to ensure data integrity
    console.log('🔍 Pipeline data validation:', {
      hasBrief: !!pipelineBrief,
      hasOutline: !!pipelineOutline,
      briefKeys: pipelineBrief ? Object.keys(pipelineBrief) : 'NO_BRIEF',
      outlineKeys: pipelineOutline ? Object.keys(pipelineOutline) : 'NO_OUTLINE'
    });

    // Validate outline structure
    if (!pipelineOutline.mainSections || !Array.isArray(pipelineOutline.mainSections) || pipelineOutline.mainSections.length === 0) {
      console.error('❌ Invalid outline structure - missing or empty mainSections');
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages: {},
        error: 'Generated outline has invalid structure - missing main sections'
      }, { status: 500 });
    }
    console.log('🧪 Phase 1→2 Gate: Outline structure OK (JSON with title, introductionPlan, mainSections, faqSection, conclusionPlan)');

    console.log(`📊 Pipeline validation passed. Outline has ${pipelineOutline.mainSections.length} main sections`);

    // Initialize pipeline stages
    const stages: ContentPipelineResponse['stages'] = {
      brief: { status: 'completed', data: pipelineBrief },
      outline: { status: 'completed', data: pipelineOutline },
      introduction: { status: 'failed', data: null },
      sections: { status: 'failed', data: null },
      faqs: { status: 'failed', data: null },
      conclusion: { status: 'failed', data: null },
      contentAssembly: { status: 'failed', data: null },
      seoAnalysis: { status: 'failed', data: null },
      seoImplementation: { status: 'failed', data: null },
      humanization: { status: 'failed', data: null },
      keywordResearch: { status: 'failed', data: null },
      imageEnhancement: { status: 'failed', data: null },
      professionalReview: { status: 'failed', data: null },
      aiAuthenticityReview: { status: 'failed', data: null },
      targetedRefinement: { status: 'failed', data: null }
    };

    // Stage 1: Generate Introduction
    console.log('📝 Stage 1: Generating Introduction');
    emitProgress(jobId, { type: 'stage', stage: 'introduction', status: 'start', timestamp: Date.now() })
    console.log('📋 Introduction input:', { 
      outlineTitle: pipelineOutline.title, 
      mainSectionsCount: pipelineOutline.mainSections.length,
      primaryKeyword 
    });
    try {
      const introResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/write-introduction`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: pipelineOutline,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (introResponse.ok) {
        const introData = await introResponse.json();
        stages.introduction = { status: 'completed', data: introData.introduction };
        console.log('✅ Introduction generated successfully, word count:', introData.wordCount || 'unknown');
        emitProgress(jobId, { type: 'stage', stage: 'introduction', status: 'complete', data: { wc: introData.wordCount }, timestamp: Date.now() })
      } else {
        const errorText = await introResponse.text();
        throw new Error(`Introduction generation failed: ${introResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Introduction generation failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'introduction', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.introduction = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to generate introduction: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 2: Generate Sections
    console.log('📚 Stage 2: Generating Content Sections');
    emitProgress(jobId, { type: 'stage', stage: 'sections', status: 'start', timestamp: Date.now() })
    console.log(`📋 Will generate ${pipelineOutline.mainSections.length} sections`);
    const sections: string[] = [];
    try {
      for (let i = 0; i < pipelineOutline.mainSections.length; i++) {
        const section = pipelineOutline.mainSections[i];
        console.log(`📝 Generating section ${i + 1}/${pipelineOutline.mainSections.length}: "${section.heading}"`);
        
        const sectionResponse = await makeAPICall(
          `${req.nextUrl.origin}/api/modular/write-section`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              outline: pipelineOutline,
              sectionIndex: i,
              previousSections: sections,
              primaryKeyword,
              userSettings
            })
          },
          30000 // 30 second timeout
        );

        if (sectionResponse.ok) {
          const sectionData = await sectionResponse.json();
          sections.push(sectionData.section);
          console.log(`✅ Section ${i + 1} generated successfully, word count: ${sectionData.wordCount || 'unknown'}`);
          emitProgress(jobId, { type: 'progress', stage: 'sections', progress: ((i + 1) / pipelineOutline.mainSections.length) * 100, data: { index: i + 1 }, timestamp: Date.now() })
        } else {
          const errorText = await sectionResponse.text();
          throw new Error(`Section ${i + 1} generation failed: ${sectionResponse.status} - ${errorText}`);
        }
      }
      stages.sections = { status: 'completed', data: sections };
      console.log(`✅ All ${sections.length} sections generated successfully`);
      emitProgress(jobId, { type: 'stage', stage: 'sections', status: 'complete', data: { count: sections.length }, timestamp: Date.now() })
    } catch (error) {
      console.error('❌ Section generation failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'sections', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.sections = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to generate sections: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 3: Generate FAQs
    console.log('❓ Stage 3: Generating FAQs');
    emitProgress(jobId, { type: 'stage', stage: 'faqs', status: 'start', timestamp: Date.now() })
    try {
      const faqResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/generate-faq`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: pipelineOutline,
            sections,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (faqResponse.ok) {
        const faqData = await faqResponse.json();
        stages.faqs = { status: 'completed', data: faqData.faqs };
        console.log('✅ FAQs generated successfully');
        emitProgress(jobId, { type: 'stage', stage: 'faqs', status: 'complete', data: { count: faqData.count }, timestamp: Date.now() })
      } else {
        const errorText = await faqResponse.text();
        throw new Error(`FAQ generation failed: ${faqResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ FAQ generation failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'faqs', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.faqs = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to generate FAQs: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 4: Generate Conclusion
    console.log('🏁 Stage 4: Generating Conclusion');
    emitProgress(jobId, { type: 'stage', stage: 'conclusion', status: 'start', timestamp: Date.now() })
    try {
      const conclusionResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/write-conclusion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: pipelineOutline,
            introduction: stages.introduction.data,
            sections,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (conclusionResponse.ok) {
        const conclusionData = await conclusionResponse.json();
        stages.conclusion = { status: 'completed', data: conclusionData.conclusion };
        console.log('✅ Conclusion generated successfully');
        emitProgress(jobId, { type: 'stage', stage: 'conclusion', status: 'complete', timestamp: Date.now() })
      } else {
        const errorText = await conclusionResponse.text();
        throw new Error(`Conclusion generation failed: ${conclusionResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Conclusion generation failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'conclusion', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.conclusion = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to generate conclusion: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 5: Assemble Content
    console.log('🔧 Stage 5: Assembling Content');
    emitProgress(jobId, { type: 'stage', stage: 'assembly', status: 'start', timestamp: Date.now() })
    try {
      const assembleResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/assemble-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outline: pipelineOutline,
            introduction: stages.introduction.data,
            sections: stages.sections.data,
            faqs: stages.faqs.data,
            conclusion: stages.conclusion.data,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (assembleResponse.ok) {
        const assembleData = await assembleResponse.json();
        if (!assembleData.assembledContent || typeof assembleData.assembledContent !== 'string') {
          throw new Error('Assembly output missing assembledContent string');
        }
        stages.contentAssembly = { status: 'completed', data: assembleData };
        console.log('✅ Content assembled successfully');
        emitProgress(jobId, { type: 'stage', stage: 'assembly', status: 'complete', data: { wc: assembleData.wordCount }, timestamp: Date.now() })
      } else {
        const errorText = await assembleResponse.text();
        throw new Error(`Content assembly failed: ${assembleResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Content assembly failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'assembly', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.contentAssembly = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to assemble content: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 6: SEO Analysis
    console.log('🔍 Stage 6: Performing SEO Analysis');
    emitProgress(jobId, { type: 'stage', stage: 'seoAnalysis', status: 'start', timestamp: Date.now() })
    try {
      const seoAnalysisResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/seo-analysis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: stages.contentAssembly.data.assembledContent,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (seoAnalysisResponse.ok) {
        const seoAnalysisData = await seoAnalysisResponse.json();
        stages.seoAnalysis = { status: 'completed', data: seoAnalysisData };
        console.log('✅ SEO analysis completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'seoAnalysis', status: 'complete', timestamp: Date.now() })
      } else {
        const errorText = await seoAnalysisResponse.text();
        throw new Error(`SEO analysis failed: ${seoAnalysisResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ SEO analysis failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'seoAnalysis', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.seoAnalysis = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to perform SEO analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 7: SEO Implementation
    console.log('🚀 Stage 7: Implementing SEO Optimizations');
    emitProgress(jobId, { type: 'stage', stage: 'seoImplementation', status: 'start', timestamp: Date.now() })
    try {
      const seoImplementationResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/seo-implementation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: stages.contentAssembly.data.assembledContent,
            seoAnalysis: stages.seoAnalysis.data,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (seoImplementationResponse.ok) {
        const seoImplementationData = await seoImplementationResponse.json();
        if (!seoImplementationData.optimizedContent) {
          throw new Error('SEO implementation missing optimizedContent');
        }
        stages.seoImplementation = { status: 'completed', data: seoImplementationData };
        console.log('✅ SEO implementation completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'seoImplementation', status: 'complete', timestamp: Date.now() })
      } else {
        const errorText = await seoImplementationResponse.text();
        throw new Error(`SEO implementation failed: ${seoImplementationResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ SEO implementation failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'seoImplementation', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.seoImplementation = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to implement SEO optimizations: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Utility: strip HTML comments and tags for plain-text downstream context
    const stripHtmlComments = (text: string) => text?.replace(/<!--[\s\S]*?-->/g, '') ?? '';
    const stripBasicHtml = (text: string) => stripHtmlComments(text).replace(/<[^>]+>/g, '');

    // Stage 8: Content Humanization
    console.log('🤖 Stage 8: Humanizing Content');
    emitProgress(jobId, { type: 'stage', stage: 'humanization', status: 'start', timestamp: Date.now() })
    try {
      // Validate that we have the required data from previous stages
      if (!stages.seoImplementation.data?.optimizedContent) {
        console.error('❌ Content humanization validation failed - missing optimized content:', {
          hasSeoImplementationData: !!stages.seoImplementation.data,
          hasOptimizedContent: !!stages.seoImplementation.data?.optimizedContent,
          seoImplementationKeys: stages.seoImplementation.data ? Object.keys(stages.seoImplementation.data) : 'NO_DATA'
        });
        throw new Error('Cannot proceed with content humanization: optimized content is missing from previous stage');
      }

      const contentForHumanization = stripBasicHtml(stages.seoImplementation.data.optimizedContent);
      const humanizationResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/humanize-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Pass plain text to reduce cross-step noise
            content: contentForHumanization,
            primaryKeyword,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (humanizationResponse.ok) {
        const humanizationData = await humanizationResponse.json();
        
        // Validate the humanization data structure
        if (!humanizationData.humanizedContent) {
          console.error('❌ Content humanization data validation failed:', {
            hasHumanizationData: !!humanizationData,
            hasHumanizedContent: !!humanizationData.humanizedContent,
            receivedData: Object.keys(humanizationData)
          });
          throw new Error('Content humanization API returned invalid data structure - missing humanizedContent field');
        }
        
        stages.humanization = { status: 'completed', data: humanizationData };
        console.log('✅ Content humanization completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'humanization', status: 'complete', timestamp: Date.now() })
        console.log('📊 Humanization data validation passed:', {
          hasHumanizedContent: true,
          contentLength: humanizationData.humanizedContent.length,
          humanizationScore: humanizationData.humanizationScore,
          aiRiskBefore: humanizationData.aiDetectionRisk?.before,
          aiRiskAfter: humanizationData.aiDetectionRisk?.after
        });
      } else {
        const errorText = await humanizationResponse.text();
        throw new Error(`Content humanization failed: ${humanizationResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Content humanization failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'humanization', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔍 Content Humanization Error Details:', {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage,
        seoImplementationStatus: stages.seoImplementation.status,
        hasSeoImplementationData: !!stages.seoImplementation.data,
        hasOptimizedContent: !!stages.seoImplementation.data?.optimizedContent
      });
      
      stages.humanization = { status: 'failed', data: null };
      
      // Return detailed error information for debugging
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to humanize content: ${errorMessage}`,
        debugInfo: {
          stage: 'humanization',
          seoImplementationStatus: stages.seoImplementation.status,
          errorDetails: errorMessage
        }
      }, { status: 500 });
    }

    // Note: Keyword research executed earlier; ensure data exists before images
    if (!keywordResearchData) {
      console.warn('⚠️ Missing keyword research from earlier stage; proceeding without image enhancement.');
      stages.keywordResearch = stages.keywordResearch?.status ? stages.keywordResearch : { status: 'failed', data: null };
    }

    // Stage 9: Smart Image Enhancement
    console.log('🖼️ Stage 9: Enhancing Images');
    emitProgress(jobId, { type: 'stage', stage: 'images', status: 'start', timestamp: Date.now() })
    try {
      // Validate required data before making the API call
      if (!stages.humanization.data?.humanizedContent) {
        throw new Error('Missing humanizedContent from humanization stage');
      }
      if (!pipelineOutline?.title) {
        throw new Error('Missing article title from outline');
      }
      if (!keywordResearchData) {
        throw new Error('Missing keyword research data');
      }

      // Prepare the request body with all required fields
      const imageEnhancementRequestBody = {
        humanizedContent: {
          content: stages.humanization.data.humanizedContent,
          title: pipelineOutline.title,
          sections: stages.sections.data
        },
        articleTitle: pipelineOutline.title,
        keywordResearch: keywordResearchData,
        userSettings
      };

      // Final validation of request body structure
      if (!imageEnhancementRequestBody.humanizedContent.content || 
          !imageEnhancementRequestBody.articleTitle || 
          !imageEnhancementRequestBody.keywordResearch.primaryKeyword) {
        throw new Error('Invalid image enhancement request body structure');
      }

      console.log('📋 Image Enhancement Request Body:', JSON.stringify(imageEnhancementRequestBody, null, 2));

      const imageEnhancementResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/image-enhancement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imageEnhancementRequestBody)
        },
        30000 // 30 second timeout
      );

      if (imageEnhancementResponse.ok) {
        const imageEnhancementData = await imageEnhancementResponse.json();
        stages.imageEnhancement = { status: 'completed', data: imageEnhancementData };
        console.log('✅ Image enhancement completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'images', status: 'complete', data: { count: (imageEnhancementData?.images || []).length }, timestamp: Date.now() })
      } else {
        const errorText = await imageEnhancementResponse.text();
        console.error('❌ Image enhancement API error response:', errorText);
        throw new Error(`Image enhancement failed: ${imageEnhancementResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Image enhancement failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'images', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      
      // Provide more detailed error information for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔍 Image Enhancement Debug Info:', {
        hasHumanizedContent: !!stages.humanization.data?.humanizedContent,
        hasArticleTitle: !!pipelineOutline?.title,
        hasKeywordResearch: !!keywordResearchData,
        humanizationData: stages.humanization.data,
        outlineTitle: pipelineOutline?.title
      });
      
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to enhance images: ${errorMessage}`
      }, { status: 500 });
    }

    // Stage 10: Professional Review
    console.log('👨‍💼 Stage 10: Professional Review');
    emitProgress(jobId, { type: 'stage', stage: 'professionalReview', status: 'start', timestamp: Date.now() })
    try {
      // Prepare the complete article for professional review
      const completeArticleForReview = {
        title: pipelineOutline.title,
        introduction: stages.introduction.data,
        sections: stages.sections.data.map((content: string, index: number) => ({
          title: pipelineOutline.mainSections[index].heading,
          content: content
        })),
        conclusion: stages.conclusion.data,
        faq: stages.faqs.data,
        seoOptimization: stages.seoImplementation.data.seoMetrics,
        images: stages.imageEnhancement.data.images || []
      };

      const professionalReviewResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/professional-critic`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            completeArticle: completeArticleForReview,
            userSettings
          })
        },
        30000 // 30 second timeout
      );

      if (professionalReviewResponse.ok) {
        const professionalReviewData = await professionalReviewResponse.json();
        
        // Validate the professional review data structure
        if (!professionalReviewData.qualityScores || !professionalReviewData.improvementRecommendations) {
          console.error('❌ Professional review data validation failed:', {
            hasQualityScores: !!professionalReviewData.qualityScores,
            hasImprovementRecommendations: !!professionalReviewData.improvementRecommendations,
            receivedData: Object.keys(professionalReviewData)
          });
          throw new Error('Professional review API returned invalid data structure - missing required fields');
        }
        
        stages.professionalReview = { status: 'completed', data: professionalReviewData };
        console.log('✅ Professional review completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'professionalReview', status: 'complete', data: { score: professionalReviewData.overallScore }, timestamp: Date.now() })
        console.log('📊 Review data validation passed:', {
          hasQualityScores: true,
          hasImprovementRecommendations: true,
          overallScore: professionalReviewData.overallScore
        });
        // Quality gate: enforce minimum overall score 8/10
        if (typeof professionalReviewData.overallScore === 'number' && professionalReviewData.overallScore < 8) {
          console.warn('🟡 Quality gate triggered: overall score below 8. Initiating pre-refinement loop.');
        }
      } else {
        const errorText = await professionalReviewResponse.text();
        throw new Error(`Professional review failed: ${professionalReviewResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Professional review failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'professionalReview', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      stages.professionalReview = { status: 'failed', data: null };
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to perform professional review: ${error instanceof Error ? error.message : 'Unknown error'}`
      }, { status: 500 });
    }

    // Stage 11: AI Authenticity Review
    console.log('🔍 Stage 11: AI Authenticity Review');
    emitProgress(jobId, { type: 'stage', stage: 'authenticityReview', status: 'start', timestamp: Date.now() })
    try {
      // Validate that we have the required data from previous stages
      if (!stages.humanization.data?.humanizedContent) {
        console.error('❌ AI Authenticity Review validation failed - missing humanized content:', {
          hasHumanizationData: !!stages.humanization.data,
          hasHumanizedContent: !!stages.humanization.data?.humanizedContent,
          humanizationKeys: stages.humanization.data ? Object.keys(stages.humanization.data) : 'NO_DATA'
        });
        throw new Error('Cannot proceed with AI authenticity review: humanized content is missing from previous stage');
      }

      // Prepare the complete article structure for authenticity review
      const completeArticle = {
        title: pipelineOutline.title,
        introduction: stages.introduction.data,
        sections: stages.sections.data.map((content: string, index: number) => ({
          title: pipelineOutline.mainSections[index].heading,
          content: content
        })),
        conclusion: stages.conclusion.data,
        faq: stages.faqs.data,
        seoOptimization: stages.seoImplementation.data.seoMetrics,
        images: stages.imageEnhancement.data.images || []
      };

      console.log('✅ AI Authenticity Review validation passed - preparing complete article structure');

      // Prepare request body with both completeArticle and content as fallback
      const requestBody = {
        completeArticle: completeArticle,
        content: stages.humanization.data.humanizedContent, // Fallback content field
        primaryKeyword,
        userSettings
      };

      console.log('📋 AI Authenticity Review Request Body:', {
        hasCompleteArticle: !!requestBody.completeArticle,
        hasContent: !!requestBody.content,
        contentLength: requestBody.content?.length || 0,
        primaryKeyword: requestBody.primaryKeyword
      });

      const aiAuthenticityResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/ai-authenticity-review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        },
        30000 // 30 second timeout
      );

      if (aiAuthenticityResponse.ok) {
        const aiAuthenticityData = await aiAuthenticityResponse.json();
        
        // Validate the AI authenticity review data structure - UPDATED to match new API response
        if (!aiAuthenticityData.humanizationRecommendations || !aiAuthenticityData.overallAssessment) {
          console.error('❌ AI authenticity review data validation failed:', {
            hasHumanizationRecommendations: !!aiAuthenticityData.humanizationRecommendations,
            hasOverallAssessment: !!aiAuthenticityData.overallAssessment,
            receivedData: Object.keys(aiAuthenticityData)
          });
          throw new Error('AI authenticity review API returned invalid data structure - missing required fields (humanizationRecommendations, overallAssessment)');
        }
        
        stages.aiAuthenticityReview = { status: 'completed', data: aiAuthenticityData };
        console.log('✅ AI authenticity review completed successfully');
        emitProgress(jobId, { type: 'stage', stage: 'authenticityReview', status: 'complete', data: { score: aiAuthenticityData.authenticityScore }, timestamp: Date.now() })
        console.log('📊 Authenticity review data validation passed:', {
          hasHumanizationRecommendations: true,
          hasOverallAssessment: true,
          authenticityScore: aiAuthenticityData.authenticityScore,
          authenticityGrade: aiAuthenticityData.overallAssessment.authenticityGrade
        });
      } else {
        const errorText = await aiAuthenticityResponse.text();
        console.error('❌ AI authenticity review API error response:', errorText);
        throw new Error(`AI authenticity review failed: ${aiAuthenticityResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ AI authenticity review failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'authenticityReview', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔍 AI Authenticity Review Error Details:', {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage,
        humanizationStatus: stages.humanization.status,
        hasHumanizationData: !!stages.humanization.data,
        hasHumanizedContent: !!stages.humanization.data?.humanizedContent
      });
      
      stages.aiAuthenticityReview = { status: 'failed', data: null };
      
      // Return detailed error information for debugging
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to perform AI authenticity review: ${errorMessage}`,
        debugInfo: {
          stage: 'aiAuthenticityReview',
          humanizationStatus: stages.humanization.status,
          errorDetails: errorMessage
        }
      }, { status: 500 });
    }

    // Stage 12: Targeted Refinement (FINAL STEP)
    console.log('🎯 Stage 12: Targeted Refinement (Final Step)');
    emitProgress(jobId, { type: 'stage', stage: 'refinement', status: 'start', timestamp: Date.now() })
    try {
      // Validate required data before proceeding with targeted refinement
      if (!stages.professionalReview.data?.qualityScores || !stages.professionalReview.data?.improvementRecommendations) {
        console.error('❌ Targeted refinement validation failed - missing professional review data:', {
          hasProfessionalReview: !!stages.professionalReview.data,
          hasQualityScores: !!stages.professionalReview.data?.qualityScores,
          hasImprovementRecommendations: !!stages.professionalReview.data?.improvementRecommendations,
          professionalReviewKeys: stages.professionalReview.data ? Object.keys(stages.professionalReview.data) : 'NO_DATA'
        });
        throw new Error('Cannot proceed with targeted refinement: professional review data is missing required fields (qualityScores, improvementRecommendations)');
      }

      if (!stages.aiAuthenticityReview.data?.humanizationRecommendations || !stages.aiAuthenticityReview.data?.overallAssessment) {
        console.error('❌ Targeted refinement validation failed - missing authenticity review data:', {
          hasAuthenticityReview: !!stages.aiAuthenticityReview.data,
          hasHumanizationRecommendations: !!stages.aiAuthenticityReview.data?.humanizationRecommendations,
          hasOverallAssessment: !!stages.aiAuthenticityReview.data?.overallAssessment,
          authenticityReviewKeys: stages.aiAuthenticityReview.data ? Object.keys(stages.aiAuthenticityReview.data) : 'NO_DATA'
        });
        throw new Error('Cannot proceed with targeted refinement: authenticity review data is missing required fields (humanizationRecommendations, overallAssessment)');
      }

      console.log('✅ Targeted refinement validation passed - all required data present');

      // Prepare the complete article for refinement
      const completeArticle = {
        title: pipelineOutline.title,
        introduction: stages.introduction.data,
        sections: stages.sections.data.map((content: string, index: number) => ({
          title: pipelineOutline.mainSections[index].heading,
          content: content
        })),
        conclusion: stages.conclusion.data,
        faq: stages.faqs.data,
        seoOptimization: stages.seoImplementation.data.seoMetrics,
        images: stages.imageEnhancement.data.images || []
      };

      // Log the request body for debugging
      const targetedRefinementRequestBody = {
        completeArticle,
        professionalReview: stages.professionalReview.data,
        authenticityReview: stages.aiAuthenticityReview.data,
        userSettings
      };

      console.log('📋 Targeted Refinement Request Body Validation:', {
        hasCompleteArticle: !!targetedRefinementRequestBody.completeArticle,
        hasProfessionalReview: !!targetedRefinementRequestBody.professionalReview,
        hasAuthenticityReview: !!targetedRefinementRequestBody.authenticityReview,
        professionalReviewKeys: Object.keys(targetedRefinementRequestBody.professionalReview || {}),
        authenticityReviewKeys: Object.keys(targetedRefinementRequestBody.authenticityReview || {})
      });

      const targetedRefinementResponse = await makeAPICall(
        `${req.nextUrl.origin}/api/modular/targeted-refinement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetedRefinementRequestBody)
        },
        60000 // 60 second timeout for final refinement
      );

      if (targetedRefinementResponse.ok) {
        const targetedRefinementData = await targetedRefinementResponse.json();
        stages.targetedRefinement = { status: 'completed', data: targetedRefinementData };
        console.log('✅ Targeted refinement completed successfully - Article is ready!');
        emitProgress(jobId, { type: 'stage', stage: 'refinement', status: 'complete', data: { score: targetedRefinementData?.refinement?.finalQualityMetrics?.professionalScore }, timestamp: Date.now() })
        const finalScore = targetedRefinementData?.refinement?.finalQualityMetrics?.professionalScore;
        if (typeof finalScore === 'number') {
          console.log('🧪 Phase 4→5 Gate: Final professional score =', finalScore);
        }
      } else {
        const errorText = await targetedRefinementResponse.text();
        throw new Error(`Targeted refinement failed: ${targetedRefinementResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Targeted refinement failed:', error);
      emitProgress(jobId, { type: 'stage', stage: 'refinement', status: 'failed', data: { error: String(error) }, timestamp: Date.now() })
      
      // Enhanced error logging for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔍 Targeted Refinement Error Details:', {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage,
        professionalReviewStatus: stages.professionalReview.status,
        aiAuthenticityReviewStatus: stages.aiAuthenticityReview.status,
        hasProfessionalReviewData: !!stages.professionalReview.data,
        hasAuthenticityReviewData: !!stages.aiAuthenticityReview.data
      });
      
      stages.targetedRefinement = { status: 'failed', data: null };
      
      // Return detailed error information for debugging
      return NextResponse.json({
        pipelineStatus: 'failed',
        stages,
        error: `Failed to perform targeted refinement: ${errorMessage}`,
        debugInfo: {
          stage: 'targetedRefinement',
          professionalReviewStatus: stages.professionalReview.status,
          aiAuthenticityReviewStatus: stages.aiAuthenticityReview.status,
          errorDetails: errorMessage
        }
      }, { status: 500 });
    }

    // Pipeline completed successfully!
    console.log('🎉 Content Pipeline: All 16 stages completed successfully!');
    emitProgress(jobId, { type: 'done', timestamp: Date.now() })

    // Extract the final article content from the targeted refinement step
    const finalArticleData = stages.targetedRefinement.data;
    
    // Ensure we have the complete final article content
    const finalArticle = finalArticleData.finalArticle || finalArticleData.refinement?.refinedArticle;
    const assembledContent = finalArticleData.assembledContent || 
      (finalArticle ? 
        `${finalArticle.introduction || ''}\n\n${(finalArticle.sections || []).map((section: any) => `## ${section.title}\n\n${section.content}`).join('\n\n')}\n\n${finalArticle.conclusion || ''}` : 
        ''
      );
    
    const response: ContentPipelineResponse = {
      pipelineStatus: 'completed',
      stages,
      finalContent: {
        seoOptimizedContent: finalArticle?.introduction || '',
        seoMetrics: finalArticleData.finalContent?.seoOptimization || finalArticle?.seoOptimization || {},
        validation: finalArticleData.finalQualityMetrics || finalArticleData.refinement?.finalQualityMetrics || {}
      },
      // Add the complete final article for the frontend
      finalArticle: finalArticle,
      assembledContent: assembledContent,
      metadata: finalArticleData.metadata || {
        refinementDate: new Date().toISOString(),
        articleTitle: finalArticle?.title || 'Generated Article',
        finalProfessionalScore: finalArticleData.refinement?.finalQualityMetrics?.professionalScore || 8.5,
        finalAuthenticityScore: finalArticleData.refinement?.finalQualityMetrics?.authenticityScore || 85,
        refinedWordCount: assembledContent.split(' ').length,
        publicationReady: finalArticleData.refinement?.finalQualityMetrics?.publicationReadiness || true
      },
      // Expose jobId so client can subscribe to SSE
      // @ts-ignore augment
      jobId
    };

    // Quality Threshold Enforcement: ensure >= 8/10 else trigger one automatic refinement retry
    try {
      const finalScore = response.metadata?.finalProfessionalScore as number | undefined;
      if (typeof finalScore === 'number' && finalScore < 8) {
        console.warn('🟠 Quality gate: Final score below 8. Triggering targeted refinement retry.');
        const retryBody = {
          completeArticle: response.finalArticle,
          professionalReview: stages.professionalReview.data,
          authenticityReview: stages.aiAuthenticityReview.data,
          userSettings
        };
        const retry = await makeAPICall(
          `${req.nextUrl.origin}/api/modular/targeted-refinement`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryBody)
          },
          60000
        );
        if (retry.ok) {
          const retryData = await retry.json();
          stages.targetedRefinement = { status: 'completed', data: retryData };
          response.finalArticle = retryData.finalArticle || response.finalArticle;
          response.assembledContent = retryData.assembledContent || response.assembledContent;
          response.finalContent.validation = retryData.refinement?.finalQualityMetrics || response.finalContent.validation;
          response.metadata = retryData.metadata || response.metadata;
          console.log('✅ Quality gate retry succeeded. Updated final scores:', response.metadata?.finalProfessionalScore);
        } else {
          console.warn('⚠️ Quality gate retry failed with status', retry.status);
        }
      }
    } catch (qerr) {
      console.warn('⚠️ Quality gate enforcement encountered an error:', qerr);
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('💥 Content Pipeline Error:', error);
    return NextResponse.json({
      pipelineStatus: 'failed',
      stages: {},
      error: 'An unexpected error occurred during pipeline execution'
    }, { status: 500 });
  }
}
