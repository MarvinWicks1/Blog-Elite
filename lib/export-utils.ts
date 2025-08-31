export interface ExportOptions {
  format: 'markdown' | 'html' | 'wordpress'
  includeImages: boolean
  includeMetadata: boolean
  includeAuthorBio?: boolean
}

export interface ContentData {
  title: string
  content: string
  excerpt?: string
  keywords?: string[]
  tags?: string[]
  categories?: string[]
  author?: {
    name: string
    bio?: string
    website?: string
  }
  images?: Array<{
    url: string
    alt: string
    caption?: string
  }>
  seoData?: {
    metaTitle?: string
    metaDescription?: string
    focusKeyword?: string
  }
  qualityMetrics?: {
    qualityScore?: number
    wordCount?: number
    seoScore?: number
    readabilityScore?: number
  }
}

export function exportToMarkdown(content: ContentData, options: ExportOptions): string {
  let markdown = ''
  
  // Title
  markdown += `# ${content.title}\n\n`
  
  // Excerpt
  if (content.excerpt) {
    markdown += `> ${content.excerpt}\n\n`
  }
  
  // Metadata
  if (options.includeMetadata && content.seoData) {
    markdown += `<!--\n`
    markdown += `SEO Meta Title: ${content.seoData.metaTitle || content.title}\n`
    markdown += `SEO Meta Description: ${content.seoData.metaDescription || content.excerpt || ''}\n`
    markdown += `Focus Keyword: ${content.seoData.focusKeyword || ''}\n`
    markdown += `-->\n\n`
  }
  
  // Content
  markdown += content.content + '\n\n'
  
  // Images
  if (options.includeImages && content.images && content.images.length > 0) {
    markdown += `## Images\n\n`
    content.images.forEach(image => {
      markdown += `![${image.alt}](${image.url})`
      if (image.caption) {
        markdown += `\n*${image.caption}*`
      }
      markdown += '\n\n'
    })
  }
  
  // Tags and Categories
  if (content.tags && content.tags.length > 0) {
    markdown += `**Tags:** ${content.tags.join(', ')}\n\n`
  }
  
  if (content.categories && content.categories.length > 0) {
    markdown += `**Categories:** ${content.categories.join(', ')}\n\n`
  }
  
  // Author Bio
  if (options.includeAuthorBio && content.author) {
    markdown += `## About the Author\n\n`
    markdown += `**${content.author.name}**`
    if (content.author.bio) {
      markdown += `\n\n${content.author.bio}`
    }
    if (content.author.website) {
      markdown += `\n\nWebsite: ${content.author.website}`
    }
    markdown += '\n\n'
  }
  
  // Quality Metrics
  if (options.includeMetadata && content.qualityMetrics) {
    markdown += `<!--\n`
    markdown += `Quality Metrics:\n`
    markdown += `- Overall Quality Score: ${content.qualityMetrics.qualityScore || 'N/A'}/10\n`
    markdown += `- Word Count: ${content.qualityMetrics.wordCount || 'N/A'}\n`
    markdown += `- SEO Score: ${content.qualityMetrics.seoScore || 'N/A'}/10\n`
    markdown += `- Readability Score: ${content.qualityMetrics.readabilityScore || 'N/A'}/10\n`
    markdown += `-->\n`
  }
  
  return markdown
}

export function exportToHTML(content: ContentData, options: ExportOptions): string {
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
  html += '<meta charset="UTF-8">\n'
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
  
  // SEO Meta Tags
  if (options.includeMetadata && content.seoData) {
    html += `<title>${content.seoData.metaTitle || content.title}</title>\n`
    html += `<meta name="description" content="${content.seoData.metaDescription || content.excerpt || ''}">\n`
    if (content.seoData.focusKeyword) {
      html += `<meta name="keywords" content="${content.seoData.focusKeyword}">\n`
    }
  } else {
    html += `<title>${content.title}</title>\n`
  }
  
  html += '<style>\n'
  html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n'
  html += 'h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }\n'
  html += 'img { max-width: 100%; height: auto; margin: 20px 0; }\n'
  html += '.excerpt { background: #f9f9f9; padding: 15px; border-left: 4px solid #007cba; margin: 20px 0; }\n'
  html += '.tags { margin: 20px 0; }\n'
  html += '.tag { background: #007cba; color: white; padding: 5px 10px; border-radius: 15px; margin-right: 10px; text-decoration: none; }\n'
  html += '.author { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }\n'
  html += '</style>\n'
  html += '</head>\n<body>\n'
  
  // Title
  html += `<h1>${content.title}</h1>\n`
  
  // Excerpt
  if (content.excerpt) {
    html += `<div class="excerpt">${content.excerpt}</div>\n`
  }
  
  // Content
  html += `<div class="content">${content.content}</div>\n`
  
  // Images
  if (options.includeImages && content.images && content.images.length > 0) {
    html += '<h2>Images</h2>\n'
    content.images.forEach(image => {
      html += `<img src="${image.url}" alt="${image.alt}"`
      if (image.caption) {
        html += ` title="${image.caption}"`
      }
      html += '>\n'
      if (image.caption) {
        html += `<p><em>${image.caption}</em></p>\n`
      }
    })
  }
  
  // Tags and Categories
  if (content.tags && content.tags.length > 0) {
    html += '<div class="tags">\n'
    html += '<strong>Tags:</strong> '
    content.tags.forEach(tag => {
      html += `<a href="#" class="tag">${tag}</a> `
    })
    html += '\n</div>\n'
  }
  
  if (content.categories && content.categories.length > 0) {
    html += '<div class="tags">\n'
    html += '<strong>Categories:</strong> '
    content.categories.forEach(category => {
      html += `<a href="#" class="tag">${category}</a> `
    })
    html += '\n</div>\n'
  }
  
  // Author Bio
  if (options.includeAuthorBio && content.author) {
    html += '<div class="author">\n'
    html += `<h3>About the Author</h3>\n`
    html += `<strong>${content.author.name}</strong>`
    if (content.author.bio) {
      html += `<p>${content.author.bio}</p>`
    }
    if (content.author.website) {
      html += `<p>Website: <a href="${content.author.website}">${content.author.website}</a></p>`
    }
    html += '</div>\n'
  }
  
  html += '</body>\n</html>'
  return html
}

export function exportToWordPress(content: ContentData, options: ExportOptions): string {
  // WordPress-ready HTML with proper formatting
  let wpContent = content.content
  
  // Convert markdown-style headers to WordPress headers
  wpContent = wpContent.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  wpContent = wpContent.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  wpContent = wpContent.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // Convert markdown-style formatting
  wpContent = wpContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  wpContent = wpContent.replace(/\*(.*?)\*/g, '<em>$1</em>')
  wpContent = wpContent.replace(/`(.*?)`/g, '<code>$1</code>')
  
  // Convert markdown-style lists
  wpContent = wpContent.replace(/^\* (.*$)/gim, '<li>$1</li>')
  wpContent = wpContent.replace(/^\- (.*$)/gim, '<li>$1</li>')
  
  // Wrap lists properly
  wpContent = wpContent.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // Convert markdown-style links
  wpContent = wpContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Add WordPress-specific formatting
  if (options.includeImages && content.images && content.images.length > 0) {
    wpContent += '\n\n<!-- wp:gallery -->\n<figure class="wp-block-gallery">\n'
    content.images.forEach(image => {
      wpContent += `<figure class="wp-block-image"><img src="${image.url}" alt="${image.alt}"`
      if (image.caption) {
        wpContent += ` title="${image.caption}"`
      }
      wpContent += '/>'
      if (image.caption) {
        wpContent += `<figcaption>${image.caption}</figcaption>`
      }
      wpContent += '</figure>\n'
    })
    wpContent += '</figure>\n<!-- /wp:gallery -->\n'
  }
  
  return wpContent
}

export function downloadContent(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
