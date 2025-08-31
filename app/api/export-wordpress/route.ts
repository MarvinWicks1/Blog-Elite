import { NextRequest, NextResponse } from 'next/server'

interface WordPressExportRequest {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  categories?: string[]
  featuredImage?: string
  status?: 'draft' | 'publish'
  siteUrl: string
  username: string
  applicationPassword: string
}

interface WordPressPost {
  title: string
  content: string
  excerpt?: string
  status: string
  categories?: number[]
  tags?: string[]
  featured_media?: number
  meta?: {
    _yoast_wpseo_title?: string
    _yoast_wpseo_metadesc?: string
    _yoast_wpseo_focuskw?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WordPressExportRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content || !body.siteUrl || !body.username || !body.applicationPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, siteUrl, username, or applicationPassword' },
        { status: 400 }
      )
    }

    // Prepare WordPress post data
    const postData: WordPressPost = {
      title: body.title,
      content: body.content,
      status: body.status || 'draft',
      excerpt: body.excerpt,
      tags: body.tags,
      categories: body.categories?.map(cat => {
        // Convert category names to IDs (you might want to implement category mapping)
        return 1 // Default category ID
      })
    }

    // If there's a featured image URL, try to upload it first
    if (body.featuredImage) {
      try {
        const mediaId = await uploadImageToWordPress(
          body.featuredImage,
          body.siteUrl,
          body.username,
          body.applicationPassword
        )
        if (mediaId) {
          postData.featured_media = mediaId
        }
      } catch (error) {
        console.warn('Failed to upload featured image:', error)
        // Continue without featured image
      }
    }

    // Create the post in WordPress
    const response = await fetch(`${body.siteUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${body.username}:${body.applicationPassword}`).toString('base64')}`
      },
      body: JSON.stringify(postData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress API error:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'Failed to create WordPress post',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    const createdPost = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Post created successfully in WordPress',
      postId: createdPost.id,
      postUrl: createdPost.link,
      editUrl: createdPost.link.replace(body.siteUrl, `${body.siteUrl}/wp-admin/post.php?post=${createdPost.id}&action=edit`)
    })

  } catch (error) {
    console.error('WordPress export error:', error)
    return NextResponse.json(
      { error: 'Internal server error during WordPress export' },
      { status: 500 }
    )
  }
}

async function uploadImageToWordPress(
  imageUrl: string,
  siteUrl: string,
  username: string,
  applicationPassword: string
): Promise<number | null> {
  try {
    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image')
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])
    
    // Create form data for WordPress media upload
    const formData = new FormData()
    formData.append('file', imageBlob, 'featured-image.jpg')
    
    // Upload to WordPress media library
    const uploadResponse = await fetch(`${siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString('base64')}`
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to WordPress')
    }

    const uploadedMedia = await uploadResponse.json()
    return uploadedMedia.id

  } catch (error) {
    console.error('Image upload error:', error)
    return null
  }
}
