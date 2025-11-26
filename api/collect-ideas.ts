// Vercel Edge Function: Reddit API 호출 (서버 사이드)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'Reddit API credentials not configured',
        message: 'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set in Vercel environment variables'
      });
    }

    // OAuth2 토큰 가져오기
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Reddit OAuth error: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error('Failed to get access token from Reddit API:', tokenData);
      return res.status(500).json({
        success: false,
        error: 'Failed to get access token from Reddit API',
        details: 'Token response did not contain access_token'
      });
    }

    console.log('Reddit access token obtained successfully');

    // 수집 대상 서브레딧 (webdev는 403 에러가 발생하므로 제외)
    const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur'];
    const allPosts: any[] = [];

    // 각 서브레딧에서 게시물 수집
    for (const subreddit of subreddits) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`;
        console.log(`Fetching posts from r/${subreddit}...`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${subreddit}: ${response.status} - ${errorText}`);
          
          // 403 에러인 경우, 인증 없이 시도 (공개 서브레딧)
          if (response.status === 403) {
            console.log(`Trying ${subreddit} without OAuth (public access)...`);
            const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
            const publicResponse = await fetch(publicUrl, {
              headers: {
                'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
              },
            });
            
            if (publicResponse.ok) {
              const publicData = await publicResponse.json() as { data?: { children?: Array<{ data?: any }> } };
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
                    url: `https://www.reddit.com${child.data.permalink}`,
                    createdAt: new Date(child.data.created_utc * 1000).toISOString(),
                  }));
                console.log(`Collected ${posts.length} posts from r/${subreddit} (public access)`);
                allPosts.push(...posts);
              }
            }
          }
          continue;
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        
        console.log(`r/${subreddit} response structure:`, {
          hasData: !!data?.data,
          hasChildren: !!data?.data?.children,
          childrenLength: data?.data?.children?.length || 0,
          firstChildSample: data?.data?.children?.[0] ? {
            hasData: !!data.data.children[0].data,
            id: data.data.children[0].data?.id,
            title: data.data.children[0].data?.title?.substring(0, 50),
          } : null,
        });
        
        if (data?.data?.children && data.data.children.length > 0) {
          const posts = data.data.children
            .filter((child: { data?: any }) => {
              if (!child.data) {
                console.warn(`Skipping child without data in r/${subreddit}`);
                return false;
              }
              return true;
            })
            .map((child: { data: any }) => ({
              redditId: child.data.id,
              title: child.data.title,
              content: child.data.selftext || '',
              subreddit: child.data.subreddit,
              author: child.data.author,
              upvotes: child.data.ups || 0,
              // permalink는 이미 /r/subreddit/comments/post_id/slug/ 형식으로 제공됨
              // www.reddit.com과 결합하여 완전한 URL 생성
              url: `https://www.reddit.com${child.data.permalink}`,
              createdAt: new Date(child.data.created_utc * 1000).toISOString(),
            }));
          
          console.log(`Collected ${posts.length} posts from r/${subreddit}`);
          if (posts.length > 0) {
            console.log(`Sample post from r/${subreddit}:`, {
              redditId: posts[0].redditId,
              title: posts[0].title.substring(0, 50),
              subreddit: posts[0].subreddit,
            });
          }
          allPosts.push(...posts);
        } else {
          console.warn(`No posts found in r/${subreddit}. Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        }

        // Rate Limit 준수
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error);
        // 에러가 발생해도 다음 서브레딧 계속 처리
      }
    }

    console.log(`Total posts collected: ${allPosts.length}`);

    // 중복 제거
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.redditId, post])).values()
    );

    console.log(`Unique posts after deduplication: ${uniquePosts.length}`);

    return res.status(200).json({
      success: true,
      count: uniquePosts.length,
      ideas: uniquePosts,
    });
  } catch (error) {
    console.error('Collection error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
