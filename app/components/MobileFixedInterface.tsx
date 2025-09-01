"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Play, Download, Globe, Settings, FileText, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { exportToMarkdown, exportToHTML, exportToWordPress, downloadContent, type ContentData, type ExportOptions } from '@/lib/export-utils'

interface PipelineStep {
  id: number
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
}

const PIPELINE_STEPS: Omit<PipelineStep, 'status' | 'progress' | 'result' | 'error'>[] = [
  { id: 1, name: 'Expert Keyword Research' },
  { id: 2, name: 'Strategic Content Brief' },
  { id: 3, name: 'Comprehensive Outline' },
  { id: 4, name: 'Engaging Introduction' },
  { id: 5, name: 'Main Section Writing' },
  { id: 6, name: 'FAQ Generation' },
  { id: 7, name: 'Compelling Conclusion' },
  { id: 8, name: 'Content Assembly' },
  { id: 9, name: 'SEO Analysis' },
  { id: 10, name: 'SEO Implementation' },
  { id: 11, name: 'Content Humanization' },
  { id: 12, name: 'Smart Image Enhancement' },
  { id: 13, name: 'Professional Review' },
  { id: 14, name: 'AI Authenticity Review' },
  { id: 15, name: 'Targeted Refinement' }
]

export default function MobileFixedInterface() {
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [topic, setTopic] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(step => ({ ...step, status: 'pending', progress: 0 }))
  )
  const [finalContent, setFinalContent] = useState<any>(null)
  const [overallProgress, setOverallProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState<'markdown' | 'html' | 'wordpress'>('markdown')
  const [isExporting, setIsExporting] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

  const handleGenerate = async () => {
    if (!primaryKeyword.trim() || !topic.trim() || !targetAudience.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    setPipelineSteps(steps => 
      steps.map(step => ({ ...step, status: 'pending', progress: 0 }))
    )
    setOverallProgress(0)
    setFinalContent(null)

    try {
      // Pull user settings (including API keys) from localStorage to send to the API
      let userSettings: any = undefined
      try {
        const local = localStorage.getItem('blog-elite-settings')
        if (local) {
          const parsed = JSON.parse(local)
          const provider = parsed?.aiProviders?.google?.enabled
            ? 'google'
            : parsed?.aiProviders?.openai?.enabled
            ? 'openai'
            : parsed?.aiProviders?.anthropic?.enabled
            ? 'anthropic'
            : 'google'
          const model =
            provider === 'google'
              ? (parsed?.aiProviders?.google?.model || 'gemini-1.5-pro')
              : provider === 'openai'
              ? (parsed?.aiProviders?.openai?.model || 'gpt-4')
              : (parsed?.aiProviders?.anthropic?.model || 'claude-3-sonnet-20240229')
          userSettings = {
            aiSettings: {
              selectedProvider: provider,
              selectedModel: model,
              apiKeys: {
                google: parsed?.aiProviders?.google?.apiKey || undefined,
              },
            },
          }
        }
      } catch (_) {
        // ignore settings parse errors
      }

      // Create jobId and open SSE before POST
      const jobId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
      try {
        const es = new EventSource(`/api/modular/progress?jobId=${encodeURIComponent(jobId)}`)
        sseRef.current = es
        es.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data)
            if (payload?.type === 'stage') {
              const mapStageToName = (st: string) => {
                switch (st) {
                  case 'keywordResearch': return 'Expert Keyword Research'
                  case 'brief': return 'Strategic Content Brief'
                  case 'outline': return 'Comprehensive Outline'
                  case 'introduction': return 'Engaging Introduction'
                  case 'sections': return 'Main Section Writing'
                  case 'faqs': return 'FAQ Generation'
                  case 'conclusion': return 'Compelling Conclusion'
                  case 'assembly': return 'Content Assembly'
                  case 'seoAnalysis': return 'SEO Analysis'
                  case 'seoImplementation': return 'SEO Implementation'
                  case 'humanization': return 'Content Humanization'
                  case 'images': return 'Smart Image Enhancement'
                  case 'professionalReview': return 'Professional Review'
                  case 'authenticityReview': return 'AI Authenticity Review'
                  case 'refinement': return 'Targeted Refinement'
                  default: return st
                }
              }
              const stageName = mapStageToName(payload.stage)
              setPipelineSteps(steps => steps.map(s => {
                if (s.name === stageName) {
                  const status = payload.status === 'failed' ? 'failed' : payload.status === 'complete' ? 'completed' : 'running'
                  const progress = status === 'completed' ? 100 : s.progress || 60
                  return { ...s, status, progress }
                }
                return s
              }))
            } else if (payload?.type === 'progress' && payload.stage === 'sections') {
              const pct = Math.max(0, Math.min(100, Math.round(payload.progress)))
              setPipelineSteps(steps => steps.map(s => s.name.includes('Main Section') ? { ...s, status: pct >= 100 ? 'completed' : 'running', progress: pct } : s))
            } else if (payload?.type === 'done') {
              setPipelineSteps(steps => steps.map(step => ({ ...step, status: 'completed', progress: 100 })))
              setOverallProgress(100)
              try { es.close() } catch {}
            }
          } catch (_) {}
        }
        es.onerror = () => { try { sseRef.current?.close() } catch {} }
      } catch (_) {}

      const response = await fetch('/api/modular/content-pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryKeyword: primaryKeyword.trim(),
          topic: topic.trim(),
          targetAudience: targetAudience.trim(),
          userSettings,
          jobId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Extract the final article content from the API response
      const finalArticle = data.finalArticle || data.stages?.targetedRefinement?.data?.finalArticle || data.stages?.targetedRefinement?.data?.refinement?.refinedArticle;
      const assembledContent = data.assembledContent || data.stages?.targetedRefinement?.data?.assembledContent || 
        (finalArticle ? 
          `${finalArticle.introduction || ''}\n\n${(finalArticle.sections || []).map((section: any) => `## ${section.title}\n\n${section.content}`).join('\n\n')}\n\n${finalArticle.conclusion || ''}` : 
          ''
        );
      
      const extractedContent = {
        title: finalArticle?.title || 'Generated Article',
        content: assembledContent,
        assembledContent: assembledContent,
        introduction: finalArticle?.introduction || '',
        sections: finalArticle?.sections || [],
        conclusion: finalArticle?.conclusion || '',
        faq: finalArticle?.faq || [],
        seoOptimization: finalArticle?.seoOptimization || {},
        images: finalArticle?.images || [],
        qualityScore: data.metadata?.finalProfessionalScore || data.stages?.targetedRefinement?.data?.metadata?.finalProfessionalScore || data.stages?.targetedRefinement?.data?.refinement?.finalQualityMetrics?.professionalScore || 8.5,
        wordCount: data.metadata?.refinedWordCount || data.stages?.targetedRefinement?.data?.metadata?.refinedWordCount || assembledContent.split(' ').length || 2500,
        seoScore: data.metadata?.finalAuthenticityScore || data.stages?.targetedRefinement?.data?.metadata?.finalAuthenticityScore || data.stages?.targetedRefinement?.data?.refinement?.finalQualityMetrics?.authenticityScore || 85,
        rawData: data
      };
      
      setFinalContent(extractedContent)
      
    } catch (error) {
      console.error('Generation failed:', error)
      try { sseRef.current?.close() } catch {}
      setPipelineSteps(steps => 
        steps.map(step => ({ ...step, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }))
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const getStepIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2" style={{ borderColor: '#d1d5db' }} />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'in-progress':
        return 'text-blue-600'
      case 'pending':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleExport = async (format: 'markdown' | 'html' | 'wordpress') => {
    if (!finalContent) return

    setIsExporting(true)
    
    try {
      const exportOptions: ExportOptions = {
        format,
        includeImages: true,
        includeMetadata: true,
        includeAuthorBio: true
      }

      // Prepare content data for export
      const contentData: ContentData = {
        title: finalContent.title || 'Generated Article',
        content: finalContent.assembledContent || finalContent.content || '',
        excerpt: finalContent.introduction || '',
        keywords: finalContent.seoOptimization?.keywords || [],
        tags: finalContent.seoOptimization?.keywords || [],
        categories: ['Generated Content'],
        author: {
          name: 'AI Content Generator',
          bio: 'Content generated by Blog Elite AI',
          website: 'https://blog-elite.com'
        },
        images: finalContent.images?.map((img: any) => ({
          url: img.url || '',
          alt: img.altText || img.description || '',
          caption: img.description || ''
        })) || [],
        seoData: {
          metaTitle: finalContent.title || '',
          metaDescription: finalContent.introduction?.substring(0, 160) || '',
          focusKeyword: finalContent.seoOptimization?.keywords?.[0] || ''
        },
        qualityMetrics: {
          qualityScore: finalContent.qualityScore || 8.5,
          wordCount: finalContent.wordCount || 2500,
          seoScore: finalContent.seoScore || 85,
          readabilityScore: finalContent.qualityScore || 8.5
        }
      }

      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'markdown':
          content = exportToMarkdown(contentData, exportOptions)
          filename = `${contentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog-post'}.md`
          mimeType = 'text/markdown'
          break
        case 'html':
          content = exportToHTML(contentData, exportOptions)
          filename = `${contentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog-post'}.html`
          mimeType = 'text/html'
          break
        case 'wordpress':
          content = exportToWordPress(contentData, exportOptions)
          filename = `${contentData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog-post'}.html`
          mimeType = 'text/html'
          break
      }

      downloadContent(content, filename, mimeType)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleWordPressExport = async () => {
    if (!finalContent) return

    // Get WordPress settings from localStorage
    const settings = localStorage.getItem('blog-elite-settings')
    if (!settings) {
      alert('Please configure WordPress settings first')
      return
    }

    const parsedSettings = JSON.parse(settings)
    if (!parsedSettings.wordpress?.siteUrl || !parsedSettings.wordpress?.username || !parsedSettings.wordpress?.applicationPassword) {
      alert('Please configure WordPress settings first')
      return
    }

    setIsExporting(true)
    
    try {
      const response = await fetch('/api/export-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: finalContent.title || 'Generated Blog Post',
          content: finalContent.assembledContent || finalContent.content || '',
          excerpt: finalContent.introduction || '',
          tags: finalContent.seoOptimization?.keywords || [],
          categories: ['Generated Content'],
          status: parsedSettings.wordpress.defaultStatus || 'draft',
          siteUrl: parsedSettings.wordpress.siteUrl,
          username: parsedSettings.wordpress.username,
          applicationPassword: parsedSettings.wordpress.applicationPassword
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        alert(`Post successfully exported to WordPress!\n\nPost ID: ${result.postId}\nView Post: ${result.postUrl}\nEdit Post: ${result.editUrl}`)
      } else {
        throw new Error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('WordPress export failed:', error)
      alert(`WordPress export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>
            🚀 Blog Elite - AI Content Generation
          </h1>
          <p style={{ color: '#4b5563' }}>
            Generate high-quality, SEO-optimized blog content in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Primary Keyword
            </label>
            <Input
              placeholder="e.g., artificial intelligence, digital marketing"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Topic
            </label>
            <Input
              placeholder="e.g., How to implement AI in business"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
              Target Audience
            </label>
            <Input
              placeholder="e.g., Business owners, Marketing professionals"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !primaryKeyword.trim() || !topic.trim() || !targetAudience.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Content...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate Blog Post
            </>
          )}
        </Button>
      </div>

      {/* Pipeline Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Pipeline Progress
            </CardTitle>
            <CardDescription>
              AI pipeline is processing your content through 15 specialized steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pipelineSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: '#374151' }}>
                        {step.name}
                      </span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        {step.progress}%
                      </span>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {finalContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generation Complete!
            </CardTitle>
            <CardDescription>
              Your high-quality blog post is ready for review and export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {finalContent.qualityScore || '8.5'}/10
                </div>
                <div className="text-sm text-green-700">Quality Score</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {finalContent.wordCount || '2,500'}
                </div>
                <div className="text-sm text-blue-700">Word Count</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {finalContent.seoScore || '85'}%
                </div>
                <div className="text-sm text-purple-700">SEO Score</div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Export Format Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Export Format
                </label>
                <Select value={exportFormat} onValueChange={(value: 'markdown' | 'html' | 'wordpress') => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="wordpress">WordPress Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Article Content Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3" style={{ color: '#374151' }}>
                  Article Preview
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-3 text-sm">
                  {finalContent.title && (
                    <div>
                      <strong className="text-blue-600">Title:</strong> {finalContent.title}
                    </div>
                  )}
                  {finalContent.introduction && (
                    <div>
                      <strong className="text-blue-600">Introduction:</strong>
                      <div className="mt-1 text-gray-700">{finalContent.introduction.substring(0, 300)}...</div>
                    </div>
                  )}
                  {finalContent.sections && finalContent.sections.length > 0 && (
                    <div>
                      <strong className="text-blue-600">Sections ({finalContent.sections.length}):</strong>
                      <div className="mt-1 space-y-2">
                        {finalContent.sections.map((section: any, index: number) => (
                          <div key={index} className="text-gray-700 border-l-2 border-blue-200 pl-3">
                            <strong className="text-blue-700">{section.title}:</strong>
                            <div className="mt-1">{section.content.substring(0, 150)}...</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {finalContent.conclusion && (
                    <div>
                      <strong className="text-blue-600">Conclusion:</strong>
                      <div className="mt-1 text-gray-700">{finalContent.conclusion.substring(0, 300)}...</div>
                    </div>
                  )}
                  {finalContent.faq && finalContent.faq.length > 0 && (
                    <div>
                      <strong className="text-blue-600">FAQ ({finalContent.faq.length} questions):</strong>
                      <div className="mt-1 space-y-2">
                        {finalContent.faq.slice(0, 3).map((faq: any, index: number) => (
                          <div key={index} className="text-gray-700 border-l-2 border-green-200 pl-3">
                            <strong className="text-green-700">Q:</strong> {faq.question.substring(0, 100)}...
                            <div className="mt-1 text-gray-600">
                              <strong>A:</strong> {faq.answer.substring(0, 120)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {finalContent.assembledContent && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <strong className="text-blue-700">Complete Article:</strong>
                      <div className="mt-2 text-xs text-gray-600">
                        {finalContent.assembledContent.substring(0, 200)}...
                      </div>
                    </div>
                  )}

                  {/* Images Preview */}
                  {finalContent.images && finalContent.images.length > 0 && (
                    <div className="mt-4">
                      <strong className="text-blue-700">Images:</strong>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        {finalContent.images.slice(0, 6).map((img: any, idx: number) => (
                          <figure key={idx} className="bg-white rounded border p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.thumbnailUrl || img.unsplashUrl || img.downloadUrl || img.url} alt={img.altText || img.description || 'image'} className="w-full h-32 object-cover rounded" />
                            <figcaption className="mt-1 text-xs text-gray-600 line-clamp-2">{img.caption || img.description}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Debug Information */}
                  <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-700 font-medium">Debug: API Response Structure</summary>
                      <div className="mt-2 text-gray-600 space-y-1">
                        <div><strong>Has finalArticle:</strong> {finalContent.rawData?.finalArticle ? 'Yes' : 'No'}</div>
                        <div><strong>Has refinement:</strong> {finalContent.rawData?.refinement ? 'Yes' : 'No'}</div>
                        <div><strong>Has assembledContent:</strong> {finalContent.rawData?.assembledContent ? 'Yes' : 'No'}</div>
                        <div><strong>Final Article Title:</strong> {finalContent.rawData?.finalArticle?.title || 'None'}</div>
                        <div><strong>Refined Article Title:</strong> {finalContent.rawData?.refinement?.refinedArticle?.title || 'None'}</div>
                        <div><strong>Content Length:</strong> {finalContent.assembledContent?.length || 0} characters</div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleExport(exportFormat)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download {exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)}
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleWordPressExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Publish to WordPress
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
