// Supabase Edge Function: Reddit API 호출 (서버 사이드)
// GitHub Pages 배포 시 사용

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 허용된 Origin 목록 (로컬 개발 및 배포 환경)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ideaspark-pi.vercel.app',
  'https://ideaspark.vercel.app',
  'https://rmswo87.github.io',
]

serve(async (req) => {
  const requestOrigin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : '*'

  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // 24시간
  }

  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const clientId = Deno.env.get('REDDIT_CLIENT_ID')
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Reddit API credentials not configured',
          message: 'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set in Supabase Edge Function secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OAuth2 토큰 가져오기
    const credentials = btoa(`${clientId}:${clientSecret}`)
    
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Reddit OAuth error: ${tokenResponse.status} ${errorText}`)
    }

    const tokenData = await tokenResponse.json() as { access_token?: string }
    const accessToken = tokenData.access_token
    
    if (!accessToken) {
      console.error('Failed to get access token from Reddit API:', tokenData)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to get access token from Reddit API',
          details: 'Token response did not contain access_token'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Reddit access token obtained successfully')

    // 수집 대상 서브레딧
    const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur']
    const allPosts: any[] = []

    // 각 서브레딧에서 게시물 수집
    for (const subreddit of subreddits) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`
        console.log(`Fetching posts from r/${subreddit}...`)
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to fetch ${subreddit}: ${response.status} - ${errorText}`)
          
          // 403 에러인 경우, 인증 없이 시도 (공개 서브레딧)
          if (response.status === 403) {
            console.log(`Trying ${subreddit} without OAuth (public access)...`)
            const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`
            const publicResponse = await fetch(publicUrl, {
              headers: {
                'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
              },
            })
            
            if (publicResponse.ok) {
              const publicData = await publicResponse.json() as { data?: { children?: Array<{ data?: any }> } }
              if (publicData?.data?.children && publicData.data.children.length > 0) {
                const posts = publicData.data.children
                  .filter((child: { data?: any }) => child.data)
                  .map((child: { data: any }) => ({
                    redditId: child.data.id,
                    title: child.data.title,
                    content: child.data.selftext || '',
                    subreddit: child.data.subreddit,
                    author: child.data.author,
                    upvotes: child.data.ups || 0,
                    numComments: child.data.num_comments || 0,
                    url: `https://www.reddit.com${child.data.permalink}`,
                    createdAt: new Date(child.data.created_utc * 1000).toISOString(),
                  }))
                console.log(`Collected ${posts.length} posts from r/${subreddit} (public access)`)
                allPosts.push(...posts)
              }
            }
          }
          continue
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } }
        
        if (data?.data?.children && data.data.children.length > 0) {
          const posts = data.data.children
            .filter((child: { data?: any }) => {
              if (!child.data) {
                console.warn(`Skipping child without data in r/${subreddit}`)
                return false
              }
              return true
            })
            .map((child: { data: any }) => ({
              redditId: child.data.id,
              title: child.data.title,
              content: child.data.selftext || '',
              subreddit: child.data.subreddit,
              author: child.data.author,
              upvotes: child.data.ups || 0,
              numComments: child.data.num_comments || 0,
              url: `https://www.reddit.com${child.data.permalink}`,
              createdAt: new Date(child.data.created_utc * 1000).toISOString(),
            }))
          
          console.log(`Collected ${posts.length} posts from r/${subreddit}`)
          allPosts.push(...posts)
        } else {
          console.warn(`No posts found in r/${subreddit}`)
        }

        // Rate Limit 준수
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error)
        // 에러가 발생해도 다음 서브레딧 계속 처리
      }
    }

    console.log(`Total posts collected: ${allPosts.length}`)

    // 중복 제거
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.redditId, post])).values()
    )

    console.log(`Unique posts after deduplication: ${uniquePosts.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        count: uniquePosts.length,
        ideas: uniquePosts,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Collection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

