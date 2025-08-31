import { NextRequest, NextResponse } from 'next/server'

interface WordPressTestRequest {
  siteUrl: string
  username: string
  applicationPassword: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WordPressTestRequest = await request.json()
    
    // Validate required fields
    if (!body.siteUrl || !body.username || !body.applicationPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: siteUrl, username, or applicationPassword' },
        { status: 400 }
      )
    }

    // Test WordPress connection by fetching site info
    const response = await fetch(`${body.siteUrl}/wp-json/wp/v2/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${body.username}:${body.applicationPassword}`).toString('base64')}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress connection test failed:', response.status, errorText)
      
      return NextResponse.json(
        { 
          error: 'WordPress connection failed',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      )
    }

    // Test user authentication by fetching current user
    const userResponse = await fetch(`${body.siteUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${body.username}:${body.applicationPassword}`).toString('base64')}`
      }
    })

    if (!userResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: 'Invalid username or application password',
          status: userResponse.status
        },
        { status: userResponse.status }
      )
    }

    const userData = await userResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'WordPress connection successful',
      siteInfo: {
        name: userData.name,
        username: userData.slug,
        capabilities: userData.capabilities,
        siteUrl: body.siteUrl
      }
    })

  } catch (error) {
    console.error('WordPress connection test error:', error)
    return NextResponse.json(
      { error: 'Internal server error during connection test' },
      { status: 500 }
    )
  }
}
