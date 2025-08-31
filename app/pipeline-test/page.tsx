'use client';

import { useState } from 'react';

interface PipelineStage {
  status: 'completed' | 'failed' | 'in_progress';
  data?: unknown;
}

interface PipelineResponse {
  pipelineStatus: 'completed' | 'failed' | 'in_progress';
  stages: {
    brief: PipelineStage;
    outline: PipelineStage;
    introduction: PipelineStage;
    sections: PipelineStage;
    faqs: PipelineStage;
    conclusion: PipelineStage;
    contentAssembly: PipelineStage;
    seoAnalysis: PipelineStage;
    seoImplementation: PipelineStage;
  };
  finalContent?: {
    seoOptimizedContent: string;
    seoMetrics: unknown;
    validation: unknown;
  };
  error?: string;
}

export default function PipelineTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = async () => {
    setIsRunning(true);
    setError(null);
    setPipelineResult(null);

    try {
      // Use sample data instead of loading external files
      const brief = {
        audienceProfile: {
          demographics: "Beginner runners (0-2 years experience) aged 25-45, interested in running their first marathon. Income level: Mid-range, predominantly urban/suburban dwellers.",
          psychographics: "Motivated, goal-oriented, health-conscious individuals seeking achievement and community. They value comfort, affordability, and reliable information.",
          painPoints: [
            "Overwhelmed by the variety of running shoes available.",
            "Unsure how to choose the right shoe for their foot type and running style.",
            "Concerned about injuries and finding affordable options.",
            "Lack of clear guidance tailored to beginner marathoners."
          ],
          searchIntent: "Informational and transactional. They seek expert advice to make informed purchasing decisions and successfully complete their first marathon."
        },
        contentStrategy: {
          uniqueAngle: "Empowering beginner marathoners to confidently choose the perfect running shoes through a data-driven, personalized approach, focusing on injury prevention and long-term running success.",
          outline: [
            "Understanding Your Foot Type and Running Style",
            "The Science of Running Shoe Cushioning and Support for Beginners",
            "Top 10 Running Shoes for Beginner Marathoners (Data-Backed Recommendations)",
            "Fitting Room Follies: Avoiding Common Shoe Fitting Mistakes",
            "Injury Prevention: Choosing Shoes that Protect Your Body"
          ],
          toneAndStyle: "Empowering, encouraging, informative, data-driven, and empathetic. Avoid jargon, use clear language, and maintain a positive tone."
        }
      };

      const outline = {
        title: "Conquer Your First Marathon: The Data-Driven Guide to Choosing the Perfect Running Shoes",
        introductionPlan: "Dreaming of crossing that marathon finish line? Your journey starts with the right shoes. Choosing the wrong pair can lead to painful injuries and derail your training. This guide empowers you to make a data-driven decision, ensuring a comfortable and successful marathon experience.",
        mainSections: [
          {
            heading: "Understanding Your Foot Type and Running Style",
            keyPoints: [
              "The Wet Test: Determining your arch type (high, neutral, flat).",
              "Analyzing your gait: Overpronation, neutral pronation, supination.",
              "Matching your foot type and gait to the right shoe category."
            ]
          },
          {
            heading: "The Science of Running Shoe Cushioning and Support for Beginners",
            keyPoints: [
              "Different cushioning materials: EVA, PU, Gel.",
              "The role of stability features: medial posts, guide rails.",
              "Understanding shoe drop and its impact on running form."
            ]
          },
          {
            heading: "Top 10 Running Shoes for Beginner Marathoners",
            keyPoints: [
              "Curated list of best shoes based on foot type, running style, and budget.",
              "Detailed reviews of each shoe highlighting key features and benefits.",
              "Comparison table summarizing price, cushioning, support, and weight."
            ]
          }
        ],
        faqSection: {
          questions: [
            "How often should I replace my running shoes?",
            "What's the difference between trail running shoes and road running shoes?",
            "Can I wear my regular sneakers for marathon training?",
            "Do I need expensive shoes for my first marathon?"
          ],
          approach: "Provide concise and practical answers based on expert advice and research, avoiding jargon and complex explanations."
        },
        conclusionPlan: "Choosing the right running shoes is a crucial step towards achieving your marathon goals. By following the advice in this guide, you'll be well-equipped to find the perfect pair that supports your journey and keeps you injury-free.",
        estimatedTotalWordCount: 2000
      };

      console.log('🚀 Starting Content Pipeline...');

      const response = await fetch('/api/modular/content-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief,
          outline,
          primaryKeyword: 'running shoes for beginners',
          userSettings: {
            aiSettings: {
              selectedProvider: 'google',
              selectedModel: 'gemini-1.5-pro'
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Pipeline failed: ${response.statusText}`);
      }

      const result: PipelineResponse = await response.json();
      setPipelineResult(result);

      if (result.pipelineStatus === 'completed') {
        console.log('🎉 Pipeline completed successfully!');
      } else {
        console.error('❌ Pipeline failed:', result.error);
      }

    } catch (err) {
      console.error('Pipeline error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'in_progress': return '⏳';
      default: return '⏸️';
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'in_progress': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Content Pipeline Test
          </h1>
          <p className="text-xl text-gray-600">
            Test the complete AI content generation workflow from brief to SEO-optimized content
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Pipeline Control
            </h2>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isRunning
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRunning ? '🔄 Running Pipeline...' : '🚀 Run Complete Pipeline'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}
        </div>

        {pipelineResult && (
          <div className="space-y-6">
            {/* Pipeline Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Pipeline Status: {pipelineResult.pipelineStatus.toUpperCase()}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(pipelineResult.stages).map(([stageName, stage]) => (
                  <div
                    key={stageName}
                    className={`p-4 rounded-lg border-2 ${
                      stage.status === 'completed'
                        ? 'border-green-200 bg-green-50'
                        : stage.status === 'failed'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStageIcon(stage.status)}</span>
                      <span className={`font-medium capitalize ${getStageColor(stage.status)}`}>
                        {stageName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: <span className={getStageColor(stage.status)}>{stage.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Content */}
            {pipelineResult.finalContent && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  🎯 Final SEO-Optimized Content
                </h3>
                
                {/* SEO Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {pipelineResult.finalContent.seoMetrics.newScore}
                    </div>
                    <div className="text-sm text-blue-800">New SEO Score</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      +{pipelineResult.finalContent.seoMetrics.improvement}
                    </div>
                    <div className="text-sm text-green-800">Improvement</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {pipelineResult.finalContent.seoMetrics.keywordDensity.toFixed(2)}%
                    </div>
                    <div className="text-sm text-purple-800">Keyword Density</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {pipelineResult.finalContent.seoMetrics.readabilityScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-orange-800">Readability</div>
                  </div>
                </div>

                {/* Validation */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-800 mb-3">Validation Results</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(pipelineResult.finalContent.validation).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg text-center ${
                          value === true
                            ? 'bg-green-100 text-green-800'
                            : value === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <div className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm">
                          {typeof value === 'boolean' ? (value ? 'PASS' : 'FAIL') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-3">Content Preview</h4>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {pipelineResult.finalContent.seoOptimizedContent.substring(0, 1000)}
                      {pipelineResult.finalContent.seoOptimizedContent.length > 1000 && '...'}
                    </pre>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Total length: {pipelineResult.finalContent.seoOptimizedContent.length} characters
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Run Complete Pipeline" to start the automated workflow</li>
            <li>The pipeline will execute all 7 stages automatically</li>
            <li>Monitor progress through the stage indicators</li>
            <li>View the final SEO-optimized content and metrics</li>
            <li>Check validation results to ensure quality standards</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
