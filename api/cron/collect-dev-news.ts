// Vercel Cron Job용 API 엔드포인트: 개발 소식 자동 수집
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 개발 관련 서브레딧 목록 (AI, 개발 팁, 최신 트렌드 중심)
const DEV_SUBREDDITS = [
  // AI 관련 (우선순위 높음)
  'artificial',           // AI 일반
  'MachineLearning',      // 머신러닝
  'OpenAI',               // OpenAI
  'ChatGPT',              // ChatGPT
  'ClaudeAI',             // Claude AI
  'LocalLLaMA',           // LLaMA
  'singularity',          // AI 미래/특이점
  'agi',                  // AGI (Artificial General Intelligence)
  
  // 개발 팁 및 최신 트렌드
  'webdev',               // 웹 개발
  'programming',          // 프로그래밍 일반
  'learnprogramming',     // 프로그래밍 학습
  'ExperiencedDevs',      // 경험 있는 개발자
  'cscareerquestions',    // 개발자 커리어
  
  // 주요 기술 스택
  'javascript',           // JavaScript
  'reactjs',              // React
  'node',                 // Node.js
  'Python',               // Python
  'golang',               // Go
  'rust',                 // Rust
  'cpp',                  // C++
  'typescript',           // TypeScript
  
  // 인프라 및 DevOps
  'devops',               // DevOps
  'aws',                  // AWS
  'kubernetes',           // Kubernetes
  'docker',               // Docker
  'linux',                // Linux
  'git',                  // Git
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Vercel Cron Job은 GET 요청을 보냄
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 보안: CRON_SECRET 확인 (Vercel Cron은 Authorization 헤더에 자동으로 추가)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false,
        error: 'Reddit API credentials not configured',
      });
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const weeklyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); // 최근 7일
    const monthlyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); // 최근 30일

    const allPosts: any[] = [];

    // 각 서브레딧에서 게시물 수집 (daily, weekly, monthly 모두)
    const subredditsToCollect = DEV_SUBREDDITS.slice(0, 10);
    
    for (const subreddit of subredditsToCollect) {
      try {
        // Daily: hot (오늘 인기)
        const dailyUrl = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=20`;
        await collectFromUrl(dailyUrl, accessToken, subreddit, 'daily', dailyDate, allPosts);
        
        // Weekly: top/week (주간 인기)
        const weeklyUrl = `https://oauth.reddit.com/r/${subreddit}/top.json?t=week&limit=20`;
        await collectFromUrl(weeklyUrl, accessToken, subreddit, 'weekly', weeklyDate, allPosts);
        
        // Monthly: top/month (월간 인기)
        const monthlyUrl = `https://oauth.reddit.com/r/${subreddit}/top.json?t=month&limit=20`;
        await collectFromUrl(monthlyUrl, accessToken, subreddit, 'monthly', monthlyDate, allPosts);
      } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error);
        continue;
      }
    }

    // 인기 소식만 필터링 (upvotes 기준) - 기간별로 다른 기준 적용
    const filteredPosts = allPosts.filter(post => {
      const upvotes = post.upvotes || 0;
      if (post.period_type === 'daily') {
        return upvotes >= 50;
      } else if (post.period_type === 'weekly') {
        return upvotes >= 100;
      } else if (post.period_type === 'monthly') {
        return upvotes >= 200;
      }
      return upvotes >= 50;
    });

    // 수집한 게시물을 데이터베이스에 저장
    if (filteredPosts.length > 0) {
      const newsToInsert = filteredPosts.map(post => ({
        reddit_id: post.reddit_id,
        title: post.title,
        content: post.content || null,
        subreddit: post.subreddit,
        author: post.author || null,
        upvotes: post.upvotes || 0,
        url: post.url,
        category: post.category || null,
        tags: post.tags || null,
        period_type: post.period_type || 'daily',
        period_date: post.period_date,
      }));

      const { error: insertError } = await supabase
        .from('dev_news')
        .upsert(newsToInsert, {
          onConflict: 'reddit_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error('Error saving dev news:', insertError);
        return res.status(500).json({
          success: false,
          error: `Failed to save dev news: ${insertError.message}`,
          count: filteredPosts.length,
        });
      }
    }

    // 오래된 데이터 자동 삭제
    // 위클리: 8일째 지나간 데이터 삭제
    // 먼슬리: 31일째 지나간 데이터 삭제
    const deleteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8);
    const { error: deleteError } = await supabase
      .from('dev_news')
      .delete()
      .lt('period_date', deleteDate.toISOString().split('T')[0]);

    if (deleteError) {
      console.error('Error deleting old dev news:', deleteError);
    }

    return res.status(200).json({
      success: true,
      count: filteredPosts.length,
      totalCollected: allPosts.length,
      filteredCount: filteredPosts.length,
      message: `Successfully collected ${filteredPosts.length} popular dev news items (filtered from ${allPosts.length} total)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error collecting dev news:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// 게시글 카테고리 분류 (AI, 개발 팁 중심)
function categorizePost(post: any): string {
  const title = (post.title || '').toLowerCase();
  const content = (post.selftext || '').toLowerCase();
  const text = `${title} ${content}`;

  // AI 관련 카테고리 우선 검색
  if (text.includes('openai') || text.includes('chatgpt') || text.includes('claude') || 
      text.includes('gemini') || text.includes('llm') || text.includes('prompt engineering') ||
      text.includes('vibecoding') || text.includes('vibe coding') || text.includes('copilot')) {
    return 'ai';
  }

  // 개발 팁 및 튜토리얼
  if (text.includes('tutorial') || text.includes('how to') || text.includes('guide') ||
      text.includes('learn') || text.includes('getting started')) {
    return 'tutorial';
  }
  
  // 개발 팁 및 노하우
  if (text.includes('tip') || text.includes('trick') || text.includes('hack') ||
      text.includes('best practice') || text.includes('pattern') || text.includes('노하우') ||
      text.includes('꿀팁')) {
    return 'tip';
  }
  
  // 최신 소식 및 릴리즈
  if (text.includes('news') || text.includes('announcement') || text.includes('release') ||
      text.includes('update') || text.includes('launch') || text.includes('new feature')) {
    return 'news';
  }
  
  // 토론 및 의견
  if (text.includes('discussion') || text.includes('opinion') || text.includes('thought') ||
      text.includes('question') || text.includes('ask') || text.includes('질문')) {
    return 'discussion';
  }
  
  // 리소스 및 도구
  if (text.includes('resource') || text.includes('tool') || text.includes('library') ||
      text.includes('framework') || text.includes('package') || text.includes('plugin')) {
    return 'resource';
  }
  
  return 'general';
}

// 태그 추출 (AI, 개발 팁, 최신 트렌드 중심)
function extractTags(post: any): string[] {
  const tags: string[] = [];
  const title = (post.title || '').toLowerCase();
  const content = (post.selftext || '').toLowerCase();
  const text = `${title} ${content}`;

  // AI 관련 키워드 (우선순위 높음)
  const aiKeywords = [
    'openai', 'chatgpt', 'gpt-4', 'gpt-3', 'gpt',
    'claude', 'anthropic', 'gemini', 'google ai',
    'llama', 'llm', 'large language model',
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'neural network', 'transformer', 'attention',
    'prompt engineering', 'fine-tuning', 'rag', 'retrieval augmented generation',
    'copilot', 'github copilot', 'cursor', 'vibecoding', 'vibe coding',
  ];

  // 개발 팁 및 최신 트렌드
  const devTipKeywords = [
    'tip', 'trick', 'hack', 'best practice', 'pattern',
    'tutorial', 'guide', 'how to', 'learn',
    'trend', 'latest', 'new', 'update', 'release',
    'productivity', 'efficiency', 'optimization',
  ];

  // 기술 스택 태그
  const techKeywords = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt',
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp',
    'node', 'express', 'fastapi', 'django', 'flask',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'database', 'sql', 'mongodb', 'postgresql', 'redis',
  ];

  // AI 키워드 우선 검색
  aiKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword.replace(/\s+/g, '-'));
    }
  });

  // 개발 팁 키워드 검색
  devTipKeywords.forEach(keyword => {
    if (text.includes(keyword) && tags.length < 5) {
      tags.push(keyword.replace(/\s+/g, '-'));
    }
  });

  // 기술 스택 키워드 검색
  techKeywords.forEach(keyword => {
    if (text.includes(keyword) && tags.length < 5) {
      tags.push(keyword);
    }
  });

  return tags.slice(0, 5); // 최대 5개 태그
}

// URL에서 게시물 수집 헬퍼 함수
async function collectFromUrl(
  url: string,
  accessToken: string,
  subreddit: string,
  periodType: 'daily' | 'weekly' | 'monthly',
  periodDate: Date,
  allPosts: any[]
): Promise<void> {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
      },
    });

    if (!response.ok) {
      // 403 에러인 경우 공개 접근 시도
      if (response.status === 403) {
        const publicUrl = url.replace('https://oauth.reddit.com', 'https://www.reddit.com');
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
                  period_type: periodType,
                  period_date: periodDate.toISOString().split('T')[0],
                };
              });
            allPosts.push(...posts);
          }
        }
        return;
      }
      return;
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
            period_type: periodType,
            period_date: periodDate.toISOString().split('T')[0],
          };
        });
      allPosts.push(...posts);
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

