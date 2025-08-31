# Smart Image Enhancement API

## Overview
The Smart Image Enhancement API is a Next.js API route that generates comprehensive image strategies for content optimization. It combines AI-powered analysis with Unsplash integration to provide intelligent image recommendations that enhance user engagement and SEO performance.

## Route Location
`app/api/modular/image-enhancement/route.ts`

## Features
- **AI-Powered Strategy**: Uses Google's Gemini AI to analyze content and generate image strategies
- **Unsplash Integration**: Automatically fetches relevant images based on AI recommendations
- **SEO Optimization**: Provides alt text, captions, and placement strategies optimized for search engines
- **Accessibility Focus**: Includes guidelines for creating accessible visual content
- **Comprehensive Output**: Delivers complete image strategy including technical specifications

## API Endpoint
```
POST /api/modular/image-enhancement
```

## Request Body Structure

### Required Fields
- `humanizedContent`: The processed content to analyze
- `articleTitle`: The title of the article
- `keywordResearch`: Keyword research data for SEO optimization

### Optional Fields
- `userSettings`: AI provider configuration and API keys

### Example Request
```json
{
  "humanizedContent": {
    "content": "Your article content here...",
    "title": "Optional title",
    "sections": ["Section 1", "Section 2"]
  },
  "articleTitle": "Your Article Title",
  "keywordResearch": {
    "primaryKeyword": "main keyword",
    "semanticKeywords": ["related", "keywords"],
    "relatedQuestions": ["Question 1", "Question 2"]
  },
  "userSettings": {
    "aiSettings": {
      "selectedProvider": "google",
      "selectedModel": "gemini-1.5-pro",
      "apiKeys": {
        "google": "YOUR_GOOGLE_API_KEY",
        "unsplash": "YOUR_UNSPLASH_ACCESS_KEY"
      }
    }
  }
}
```

## Response Structure

### Image Strategy
- `overview`: High-level image strategy summary
- `visualTheme`: Recommended visual theme and style
- `colorPalette`: Suggested color scheme
- `styleGuidelines`: Style and branding guidelines

### Image Recommendations
Array of at least 3 image recommendations, each including:
- `placement`: Where to place the image
- `description`: What the image should depict
- `altText`: SEO-optimized alt text
- `caption`: Engaging caption for the image
- `unsplashQuery`: Search query for Unsplash
- `unsplashUrl`: Direct link to the image
- `relevanceScore`: Relevance score (1-10)
- `seoValue`: SEO benefits explanation

### Placement Strategy
- `heroImage`: Hero image strategy
- `sectionBreaks`: Where to place section break images
- `infographicOpportunities`: Potential infographic placements
- `callToActionImages`: CTA image recommendations

### Technical Specifications
- `dimensions`: Recommended image dimensions
- `formats`: Supported image formats
- `optimizationTips`: Performance optimization advice
- `accessibilityGuidelines`: Accessibility best practices

## Environment Variables
Set these environment variables for the API to work:

```bash
GOOGLE_API_KEY=your_google_ai_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
# OR
UPSPLASH_API_KEY=your_unsplash_api_key
```

## API Key Setup

### Google AI API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set the `GOOGLE_API_KEY` environment variable

### Unsplash API
1. Visit [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Get your Access Key
4. Set the `UNSPLASH_ACCESS_KEY` environment variable

## Error Handling
The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Missing required fields
- `422`: Validation failed
- `500`: Internal server error
- `502`: AI service error

## Usage Examples

### cURL
```bash
curl -X POST http://localhost:3000/api/modular/image-enhancement \
  -H "Content-Type: application/json" \
  -d @image-enhancement-test-request.json
```

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/modular/image-enhancement', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    humanizedContent: { content: 'Your content...' },
    articleTitle: 'Your Title',
    keywordResearch: { /* your keyword data */ }
  })
});

const imageStrategy = await response.json();
```

## Testing
Use the provided `image-enhancement-test-request.json` file to test the API. Make sure to:
1. Replace placeholder API keys with real ones
2. Verify all required fields are present
3. Check that the response contains at least 3 image recommendations

## Dependencies
- Next.js 15+
- Google Generative AI SDK
- TypeScript support
- Fetch API (built into modern Node.js)

## Security Notes
- API keys are validated before processing
- Input validation prevents malformed requests
- Error messages don't expose sensitive information
- Rate limiting should be implemented in production

## Future Enhancements
- Support for additional AI providers (OpenAI, Anthropic)
- Image generation capabilities
- Advanced image optimization
- Bulk image processing
- Custom image source integration
