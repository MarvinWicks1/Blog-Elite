# Targeted Refinement API Route

## Overview

The **Targeted Refinement API Route** (`/api/modular/targeted-refinement`) is the final step in the content creation pipeline. It takes a complete, humanized article along with professional and authenticity review reports to produce a final, publication-ready version.

## Purpose

This route serves as the "master content refinement specialist" that:
- Applies feedback from professional content reviews
- Implements authenticity improvements to reduce AI-like patterns
- Produces a final, polished article ready for publication
- Ensures the content meets both quality and authenticity standards

## Route Location

```
app/api/modular/targeted-refinement/route.ts
```

## API Endpoint

- **Method**: POST
- **Path**: `/api/modular/targeted-refinement`
- **Content-Type**: `application/json`

## Request Structure

### Input Payload

```typescript
interface TargetedRefinementRequest {
  completeArticle: CompleteArticle;
  professionalReview: ProfessionalReview;
  authenticityReview: AIAuthenticityReview;
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
```

### Required Fields

1. **completeArticle**: The full article content to be refined
   - `title`: Article title
   - `introduction`: Opening section
   - `sections`: Array of content sections
   - `conclusion`: Closing section
   - `faq`: Optional FAQ section
   - `seoOptimization`: Optional SEO metadata
   - `images`: Optional image descriptions

2. **professionalReview**: Feedback from professional content critic
   - `qualityScores`: Numerical ratings (1-10) for various aspects
   - `improvementRecommendations`: Critical, important, and optional improvements
   - `publicationReadiness`: Assessment of publication readiness

3. **authenticityReview**: AI authenticity analysis results
   - `humanizationRecommendations`: Critical, important, and optional humanization steps
   - `overallAssessment`: Overall authenticity grade and readiness

## Response Structure

### Success Response

```typescript
interface RefinedArticleResponse {
  refinedArticle: CompleteArticle;           // The final, refined article
  refinementSummary: {
    changesMade: string[];                   // Specific changes applied
    improvementsApplied: string[];           // Improvements implemented
    qualityEnhancements: string[];           // Quality improvements made
    authenticityImprovements: string[];      // Authenticity improvements made
  };
  finalQualityMetrics: {
    professionalScore: number;               // Final professional score (1-10)
    authenticityScore: number;               // Final authenticity score (0-100)
    publicationReadiness: boolean;           // Whether article is ready for publication
    confidence: number;                      // Confidence in the refinement (1-10)
  };
  refinementNotes: {
    professionalFeedback: string;            // Summary of professional feedback application
    authenticityFeedback: string;            // Summary of authenticity feedback application
    overallAssessment: string;               // Overall assessment of the refinement
  };
}
```

### Response Metadata

```typescript
{
  success: true,
  refinement: RefinedArticleResponse,
  metadata: {
    refinementDate: string;                  // ISO timestamp of refinement
    articleTitle: string;                    // Title of the refined article
    originalWordCount: number;               // Word count of original article
    refinedWordCount: number;                // Word count of refined article
    wordCountChange: number;                 // Change in word count
    sectionsCount: number;                   // Number of sections
    finalProfessionalScore: number;          // Final professional quality score
    finalAuthenticityScore: number;          // Final authenticity score
    publicationReady: boolean;               // Publication readiness status
    refinementConfidence: number;            // Confidence in the refinement
  }
}
```

## AI Integration

### AI Model

The route uses the `getAIModel` function from `@/lib/ai-providers.ts` to connect to AI services.

**Default Configuration:**
- **Provider**: Google
- **Model**: gemini-1.5-pro
- **API Key**: From `userSettings.aiSettings.apiKeys.google` or `process.env.GOOGLE_API_KEY`

### AI Role

The AI acts as a **Master Content Refinement Specialist** with:
- 25+ years of experience in publishing and content strategy
- Expertise in applying professional feedback
- Skills in humanizing AI-generated content
- Ability to maintain content quality while improving authenticity

### AI Instructions

The AI systematically applies:
1. **Critical professional feedback** (must-fix items)
2. **Critical authenticity improvements** (must-humanize items)
3. **Important professional improvements** (should-fix items)
4. **Important authenticity improvements** (should-humanize items)
5. **Optional improvements** where they enhance quality

## Validation

### Input Validation

- Ensures all required fields are present
- Validates article structure (title, sections, etc.)
- Checks review data completeness
- Verifies API key availability

### AI Response Validation

- Validates JSON structure and format
- Ensures refined article meets requirements
- Verifies quality metrics are within expected ranges
- Confirms changes were actually made during refinement

### Error Handling

- **400**: Missing or invalid required fields
- **422**: AI response validation failed
- **502**: AI service error or invalid response
- **500**: Internal server error

## Testing

### Test Files

1. **`targeted-refinement-test-request.json`**: Sample request payload
2. **`test-targeted-refinement.js`**: Validation script

### Running Tests

```bash
# Validate route implementation
node test-targeted-refinement.js

# Test with actual API (requires running Next.js server)
curl -X POST http://localhost:3000/api/modular/targeted-refinement \
  -H "Content-Type: application/json" \
  -d @targeted-refinement-test-request.json
```

### Test Data

The test request includes:
- Complete AI healthcare article
- Professional review with scores and recommendations
- Authenticity analysis with humanization suggestions
- Sample user settings

## Usage Examples

### Basic Usage

```typescript
const response = await fetch('/api/modular/targeted-refinement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    completeArticle: articleData,
    professionalReview: professionalReviewData,
    authenticityReview: authenticityReviewData
  })
});

const result = await response.json();
```

### With Custom AI Settings

```typescript
const response = await fetch('/api/modular/targeted-refinement', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    completeArticle: articleData,
    professionalReview: professionalReviewData,
    authenticityReview: authenticityReviewData,
    userSettings: {
      aiSettings: {
        selectedProvider: 'google',
        selectedModel: 'gemini-1.5-pro',
        apiKeys: { google: 'your-api-key' }
      }
    }
  })
});
```

## Integration Points

### Content Pipeline

This route is typically called after:
1. Content generation and assembly
2. Professional content review
3. AI authenticity analysis
4. Humanization (if needed)

### Output Usage

The refined article is ready for:
- Direct publication
- Final editorial review
- SEO optimization
- Content distribution

## Best Practices

1. **Always validate inputs** before sending to the API
2. **Handle errors gracefully** with appropriate user feedback
3. **Store the refined article** for future reference
4. **Monitor quality metrics** to ensure improvement
5. **Use appropriate AI models** for your content type

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure Google API key is set in environment or user settings
2. **Invalid Input**: Check that all required fields are present and properly formatted
3. **AI Response Errors**: Verify AI service is accessible and responding correctly
4. **Validation Failures**: Ensure AI response meets expected structure requirements

### Debug Mode

Enable detailed logging by checking the console for:
- Input validation results
- AI response parsing
- Validation failures
- Error details

## Dependencies

- **Next.js**: API route framework
- **Google Generative AI**: AI service provider
- **TypeScript**: Type safety and interfaces
- **AI Providers**: Centralized AI service management

## Security Considerations

- API keys are handled securely through environment variables
- Input validation prevents malicious payloads
- AI responses are validated before processing
- Error messages don't expose sensitive information

## Performance Notes

- AI processing time depends on content length and complexity
- Response validation adds minimal overhead
- Word count calculations are efficient
- Metadata generation is lightweight

## Future Enhancements

Potential improvements:
- Support for additional AI providers
- Batch processing capabilities
- Quality metrics tracking over time
- Custom refinement templates
- Integration with content management systems
