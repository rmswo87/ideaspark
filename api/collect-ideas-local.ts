/**
 * 로컬 개발용 간단한 서버 (Node.js)
 * 
 * ⚠️ 주의: 이 파일은 로컬 개발 환경에서만 사용됩니다.
 * Vercel 배포 시에는 api/collect-ideas.ts가 사용됩니다.
 * 
 * 사용 방법:
 * 1. 터미널에서 실행: npx tsx api/collect-ideas-local.ts
 * 2. 서버가 http://localhost:3000 에서 실행됩니다
 * 3. 프론트엔드에서 http://localhost:3000/api/collect-ideas 로 요청
 * 
 * 환경 변수 필요:
 * - REDDIT_CLIENT_ID
 * - REDDIT_CLIENT_SECRET
 */

import * as http from 'http';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/collect-ideas' && req.method === 'POST') {
    try {
      const clientId = process.env.REDDIT_CLIENT_ID;
      const clientSecret = process.env.REDDIT_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Reddit API credentials not configured',
        }));
        return;
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
        throw new Error('Failed to get access token from Reddit API');
      }

      // 수집 대상 서브레딧
      const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur', 'webdev'];
      const allPosts: any[] = [];

      // 각 서브레딧에서 게시물 수집
      for (const subreddit of subreddits) {
        try {
          const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
            },
          });

          if (!response.ok) {
            console.error(`Failed to fetch ${subreddit}: ${response.status}`);
            continue;
          }

          const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
          
          if (data?.data?.children) {
            const posts = data.data.children.map((child: { data?: any }) => ({
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
            
            allPosts.push(...posts);
          }

          // Rate Limit 준수
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error fetching ${subreddit}:`, error);
        }
      }

      // 중복 제거
      const uniquePosts = Array.from(
        new Map(allPosts.map(post => [post.redditId, post])).values()
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        count: uniquePosts.length,
        ideas: uniquePosts,
      }));
    } catch (error) {
      console.error('Collection error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: `Not found: ${req.url}`,
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});

