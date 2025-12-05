// Vercel Edge Function: 개발 소식 수집 (Reddit API 호출)
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 개발 관련 서브레딧 목록
const DEV_SUBREDDITS = [
  'webdev',           // 웹 개발
  'programming',      // 프로그래밍 일반
  'learnprogramming', // 프로그래밍 학습
  'MachineLearning',  // 머신러닝
  'artificial',       // AI
  'javascript',       // JavaScript
  'reactjs',          // React
  'node',             // Node.js
  'Python',           // Python
  'golang',           // Go
  'rust',             // Rust
  'cpp',              // C++
  'cscareerquestions', // 개발자 커리어
  'ExperiencedDevs',  // 경험 있는 개발자
  'devops',           // DevOps
  'aws',              // AWS
  'kubernetes',       // Kubernetes
  'docker',           // Docker
  'linux',            // Linux
  'git',              // Git
];

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
      return res.status(500).json({
        success: false,
        error: 'Failed to get access token from Reddit API',
      });
    }

    // 기간 계산
    const now = new Date();
    const dailyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    const weeklyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const monthlyDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const allPosts: any[] = [];

    // 각 서브레딧에서 게시물 수집 (최대 10개 서브레딧, 각 10개 게시물)
    const subredditsToCollect = DEV_SUBREDDITS.slice(0, 10);
    
    for (const subreddit of subredditsToCollect) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=10`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
          },
        });

        if (!response.ok) {
          // 403 에러인 경우 공개 접근 시도
          if (response.status === 403) {
            const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
            const publicResponse = await fetch(publicUrl, {
              headers: {
                'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
              },
            });
            
            if (publicResponse.ok) {
              const publicData = await publicResponse.json() as { data?: { children?: Array<{ data?: any }> } };
              if (publicData?.data?.children) {
                const posts = publicData.data.children
                  .filter((child: { data?: any }) => child.data)
                  .map((child: { data: any }) => {
                    const post = child.data;
                    return {
                      reddit_id: post.name || post.id,
                      title: post.title,
                      content: post.selftext || '',
                      subreddit: post.subreddit,
                      author: post.author,
                      upvotes: post.ups || 0,
                      url: `https://www.reddit.com${post.permalink}`,
                      category: categorizePost(post),
                      tags: extractTags(post),
                      period_type: 'daily',
                      period_date: dailyDate.toISOString().split('T')[0],
                    };
                  });
                allPosts.push(...posts);
              }
            }
          }
          continue;
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        
        if (data?.data?.children) {
          const posts = data.data.children
            .filter((child: { data?: any }) => child.data)
            .map((child: { data: any }) => {
              const post = child.data;
              return {
                reddit_id: post.name || post.id,
                title: post.title,
                content: post.selftext || '',
                subreddit: post.subreddit,
                author: post.author,
                upvotes: post.ups || 0,
                url: `https://www.reddit.com${post.permalink}`,
                category: categorizePost(post),
                tags: extractTags(post),
                period_type: 'daily',
                period_date: dailyDate.toISOString().split('T')[0],
              };
            });
          allPosts.push(...posts);
        }
      } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error);
        continue;
      }
    }

    return res.status(200).json({
      success: true,
      count: allPosts.length,
      posts: allPosts,
    });
  } catch (error) {
    console.error('Error collecting dev news:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 게시글 카테고리 분류
function categorizePost(post: any): string {
  const title = (post.title || '').toLowerCase();
  const content = (post.selftext || '').toLowerCase();
  const text = `${title} ${content}`;

  if (text.includes('tutorial') || text.includes('how to') || text.includes('guide')) {
    return 'tutorial';
  }
  if (text.includes('tip') || text.includes('trick') || text.includes('hack')) {
    return 'tip';
  }
  if (text.includes('news') || text.includes('announcement') || text.includes('release')) {
    return 'news';
  }
  if (text.includes('discussion') || text.includes('opinion') || text.includes('thought')) {
    return 'discussion';
  }
  if (text.includes('resource') || text.includes('tool') || text.includes('library')) {
    return 'resource';
  }
  
  return 'general';
}

// 태그 추출
function extractTags(post: any): string[] {
  const tags: string[] = [];
  const title = (post.title || '').toLowerCase();
  const content = (post.selftext || '').toLowerCase();
  const text = `${title} ${content}`;

  // 기술 스택 태그
  const techKeywords = [
    'react', 'vue', 'angular', 'svelte',
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp',
    'node', 'express', 'nextjs', 'nuxt',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'ai', 'ml', 'machine learning', 'deep learning',
    'database', 'sql', 'mongodb', 'postgresql',
  ];

  techKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword);
    }
  });

  return tags.slice(0, 5); // 최대 5개 태그
}

