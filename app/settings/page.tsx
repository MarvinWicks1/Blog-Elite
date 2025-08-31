"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Key, Brain, Gauge, Globe, Mail, Download, CheckCircle, AlertCircle } from 'lucide-react'

interface Settings {
  aiProviders: {
    openai: {
      apiKey: string
      model: string
      enabled: boolean
    }
    anthropic: {
      apiKey: string
      model: string
      enabled: boolean
    }
    google: {
      apiKey: string
      model: string
      enabled: boolean
    }
  }
  quality: {
    minQualityScore: number
    minWordCount: number
    minSeoScore: number
    autoRefinement: boolean
  }
  wordpress: {
    siteUrl: string
    username: string
    applicationPassword: string
    autoPublish: boolean
    defaultStatus: 'draft' | 'publish'
  }
  export: {
    defaultFormat: 'markdown' | 'html' | 'wordpress'
    includeImages: boolean
    includeMetadata: boolean
  }
}

const DEFAULT_SETTINGS: Settings = {
  aiProviders: {
    openai: {
      apiKey: '',
      model: 'gpt-4',
      enabled: true
    },
    anthropic: {
      apiKey: '',
      model: 'claude-3-sonnet-20240229',
      enabled: false
    },
    google: {
      apiKey: '',
      model: 'gemini-1.5-pro',
      enabled: false
    }
  },
  quality: {
    minQualityScore: 8.0,
    minWordCount: 2000,
    minSeoScore: 7.0,
    autoRefinement: true
  },
  wordpress: {
    siteUrl: '',
    username: '',
    applicationPassword: '',
    autoPublish: false,
    defaultStatus: 'draft'
  },
  export: {
    defaultFormat: 'markdown',
    includeImages: true,
    includeMetadata: true
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('blog-elite-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      // Save to localStorage
      localStorage.setItem('blog-elite-settings', JSON.stringify(settings))
      
      // Here you would typically also save to your backend
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) })
      
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current: any = newSettings
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  const testWordPressConnection = async () => {
    if (!settings.wordpress.siteUrl || !settings.wordpress.username || !settings.wordpress.applicationPassword) {
      alert('Please fill in all WordPress credentials first')
      return
    }

    try {
      const response = await fetch('/api/test-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: settings.wordpress.siteUrl,
          username: settings.wordpress.username,
          applicationPassword: settings.wordpress.applicationPassword
        })
      })

      if (response.ok) {
        alert('WordPress connection successful!')
      } else {
        alert('WordPress connection failed. Please check your credentials.')
      }
    } catch (error) {
      alert('Failed to test WordPress connection. Please try again.')
    }
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>
            ⚙️ Application Settings
          </h1>
          <p style={{ color: '#4b5563' }}>
            Configure AI providers, quality thresholds, and export preferences
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Save Status */}
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">Settings saved successfully!</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">Failed to save settings. Please try again.</span>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="ai-providers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-providers" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="wordpress" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              WordPress
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          {/* AI Providers Tab */}
          <TabsContent value="ai-providers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  OpenAI Configuration
                </CardTitle>
                <CardDescription>
                  Configure your OpenAI API key and preferred model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="openai-enabled"
                    checked={settings.aiProviders.openai.enabled}
                    onChange={(e) => updateSetting('aiProviders.openai.enabled', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="openai-enabled" className="text-sm font-medium">
                    Enable OpenAI
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    OpenAI API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={settings.aiProviders.openai.apiKey}
                    onChange={(e) => updateSetting('aiProviders.openai.apiKey', e.target.value)}
                    disabled={!settings.aiProviders.openai.enabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <Select
                    value={settings.aiProviders.openai.model}
                    onValueChange={(value) => updateSetting('aiProviders.openai.model', value)}
                    disabled={!settings.aiProviders.openai.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Anthropic Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Anthropic API key and preferred model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anthropic-enabled"
                    checked={settings.aiProviders.anthropic.enabled}
                    onChange={(e) => updateSetting('aiProviders.anthropic.enabled', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="anthropic-enabled" className="text-sm font-medium">
                    Enable Anthropic
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Anthropic API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="sk-ant-..."
                    value={settings.aiProviders.anthropic.apiKey}
                    onChange={(e) => updateSetting('aiProviders.anthropic.apiKey', e.target.value)}
                    disabled={!settings.aiProviders.anthropic.enabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <Select
                    value={settings.aiProviders.anthropic.model}
                    onValueChange={(value) => updateSetting('aiProviders.anthropic.model', value)}
                    disabled={!settings.aiProviders.anthropic.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Google Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Google AI API key and preferred model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="google-enabled"
                    checked={settings.aiProviders.google.enabled}
                    onChange={(e) => updateSetting('aiProviders.google.enabled', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="google-enabled" className="text-sm font-medium">
                    Enable Google AI
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={settings.aiProviders.google.apiKey}
                    onChange={(e) => updateSetting('aiProviders.google.apiKey', e.target.value)}
                    disabled={!settings.aiProviders.google.enabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <Select
                    value={settings.aiProviders.google.model}
                    onValueChange={(value) => updateSetting('aiProviders.google.model', value)}
                    disabled={!settings.aiProviders.google.enabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Quality Thresholds
                </CardTitle>
                <CardDescription>
                  Set minimum quality standards for generated content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Minimum Quality Score
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={settings.quality.minQualityScore}
                    onChange={(e) => updateSetting('quality.minQualityScore', parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Word Count
                  </label>
                  <Input
                    type="number"
                    min="500"
                    step="100"
                    value={settings.quality.minWordCount}
                    onChange={(e) => updateSetting('quality.minWordCount', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Readability Threshold
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={settings.quality.minSeoScore}
                    onChange={(e) => updateSetting('quality.minSeoScore', parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-refinement"
                    checked={settings.quality.autoRefinement}
                    onChange={(e) => updateSetting('quality.autoRefinement', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="auto-refinement" className="text-sm font-medium">
                    Enable Auto-Refinement
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WordPress Tab */}
          <TabsContent value="wordpress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  WordPress Integration
                </CardTitle>
                <CardDescription>
                  Configure your WordPress site for direct publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    WordPress Site URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://yoursite.com"
                    value={settings.wordpress.siteUrl}
                    onChange={(e) => updateSetting('wordpress.siteUrl', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Username
                  </label>
                  <Input
                    placeholder="your_username"
                    value={settings.wordpress.username}
                    onChange={(e) => updateSetting('wordpress.username', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Application Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Your application password"
                    value={settings.wordpress.applicationPassword}
                    onChange={(e) => updateSetting('wordpress.applicationPassword', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Default Post Status
                  </label>
                  <Select
                    value={settings.wordpress.defaultStatus}
                    onValueChange={(value: 'draft' | 'publish') => updateSetting('wordpress.defaultStatus', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="publish">Publish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-publish"
                    checked={settings.wordpress.autoPublish}
                    onChange={(e) => updateSetting('wordpress.autoPublish', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="auto-publish" className="text-sm font-medium">
                    Auto-publish to WordPress
                  </label>
                </div>
                
                <Button onClick={testWordPressConnection} variant="outline" className="w-full">
                  Test WordPress Connection
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Preferences
                </CardTitle>
                <CardDescription>
                  Configure default export settings and formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    Default Export Format
                  </label>
                  <Select
                    value={settings.export.defaultFormat}
                    onValueChange={(value: 'markdown' | 'html' | 'wordpress') => updateSetting('export.defaultFormat', value)}
                  >
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
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-images"
                    checked={settings.export.includeImages}
                    onChange={(e) => updateSetting('export.includeImages', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="include-images" className="text-sm font-medium">
                    Include Images in Export
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-metadata"
                    checked={settings.export.includeMetadata}
                    onChange={(e) => updateSetting('export.includeMetadata', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="include-metadata" className="text-sm font-medium">
                    Include Metadata (SEO, tags, etc.)
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
