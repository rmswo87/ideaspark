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

    // 개발 관련성 점수 계산 및 필터링
    const postsWithScore = allPosts.map(post => ({
      ...post,
      devRelevanceScore: calculateDevRelevanceScore(post),
    }));

    // 개발 관련성 점수 3점 이상만 필터링 (개발과 무관한 콘텐츠 제거)
    const devRelevantPosts = postsWithScore.filter(post => post.devRelevanceScore >= 3);

    // 인기 소식만 필터링 (upvotes 기준) - 기간별로 다른 기준 적용
    const filteredPosts = devRelevantPosts.filter(post => {
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

      // 중복 제거: 같은 reddit_id와 period_type 조합이 있으면 제거
      const uniquePosts = new Map<string, any>();
      for (const post of newsToInsert) {
        const key = `${post.reddit_id}_${post.period_type}`;
        if (!uniquePosts.has(key)) {
          uniquePosts.set(key, post);
        }
      }
      const deduplicatedPosts = Array.from(uniquePosts.values());

      const { error: insertError } = await supabase
        .from('dev_news')
        .upsert(deduplicatedPosts, {
          onConflict: 'reddit_id,period_type',
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

// 개발 관련성 점수 계산 (키워드 기반)
function calculateDevRelevanceScore(post: any): number {
  const title = (post.title || '').toLowerCase();
  const content = (post.selftext || '').toLowerCase();
  const text = `${title} ${content}`;
  
  let score = 0;

  // 기술 스택 키워드 (각 1점)
  const techStackKeywords = [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt',
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'cpp', 'c++',
    'node', 'express', 'fastapi', 'django', 'flask', 'spring',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
    'database', 'sql', 'mongodb', 'postgresql', 'redis', 'mysql',
    'html', 'css', 'scss', 'sass', 'tailwind', 'bootstrap',
    'git', 'github', 'gitlab', 'ci/cd', 'jenkins',
  ];
  
  // 개발 개념 키워드 (각 1점)
  const devConceptKeywords = [
    'api', 'rest', 'graphql', 'microservice', 'monolith',
    'framework', 'library', 'package', 'npm', 'yarn', 'pip',
    'algorithm', 'data structure', 'design pattern', 'architecture',
    'testing', 'unit test', 'integration test', 'e2e',
    'deployment', 'production', 'staging', 'devops',
    'performance', 'optimization', 'scalability', 'security',
    'code', 'programming', 'development', 'software', 'application',
  ];
  
  // 개발 활동 키워드 (각 1점)
  const devActivityKeywords = [
    'coding', 'programming', 'developing', 'building',
    'tutorial', 'guide', 'how to', 'learn', 'getting started',
    'tip', 'trick', 'hack', 'best practice', 'pattern',
    'debug', 'fix', 'bug', 'error', 'issue',
  ];
  
  // AI/ML 키워드 (각 2점 - 높은 가중치)
  const aiKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'openai', 'chatgpt', 'gpt', 'claude', 'gemini', 'llm',
    'neural network', 'transformer', 'nlp', 'computer vision',
    'prompt engineering', 'fine-tuning', 'rag', 'copilot',
  ];
  
  // 개발과 무관한 키워드 (점수 감점)
  const nonDevKeywords = [
    'girlfriend', 'boyfriend', 'dating', 'relationship', '여자친구', '남자친구',
    'nano banana', '나노 바나나', 'drawing', 'art', '그리기',
    'food', 'recipe', 'cooking', '음식', '요리',
    'game', 'gaming', 'play', '게임',
    'movie', 'film', '영화',
    'music', 'song', '음악',
  ];
  
  // 점수 계산
  techStackKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  
  devConceptKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  
  devActivityKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  
  aiKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 2;
  });
  
  // 개발과 무관한 키워드가 많으면 감점
  let nonDevCount = 0;
  nonDevKeywords.forEach(keyword => {
    if (text.includes(keyword)) nonDevCount += 1;
  });
  if (nonDevCount >= 2) {
    score = Math.max(0, score - 3); // 최소 0점
  }
  
  return score;
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

// Reddit API에서 콘텐츠 추출 (selftext 또는 selftext_html)
function extractContent(post: any): string {
  // selftext가 있으면 사용
  if (post.selftext && post.selftext.trim().length > 0) {
    return post.selftext.trim();
  }
  
  // selftext_html이 있으면 HTML 태그 제거 후 사용
  if (post.selftext_html && post.selftext_html.trim().length > 0) {
    // HTML 태그 제거 (간단한 정규식)
    const text = post.selftext_html
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/&nbsp;/g, ' ') // &nbsp;를 공백으로
      .replace(/&amp;/g, '&') // &amp;를 &로
      .replace(/&lt;/g, '<') // &lt;를 <로
      .replace(/&gt;/g, '>') // &gt;를 >로
      .replace(/&quot;/g, '"') // &quot;를 "로
      .replace(/&#39;/g, "'") // &#39;를 '로
      .trim();
    
    if (text.length > 0) {
      return text;
    }
  }
  
  return '';
}

// Reddit API에서 이미지 URL 추출
function extractImageUrl(post: any): string | null {
  try {
    // 0. post.url이 직접 이미지 URL인 경우 (최우선 - 가장 확실한 방법)
    if (post.url) {
      const url = post.url.toLowerCase();
      const urlWithoutQuery = url.split('?')[0];
      
      // preview.redd.it 또는 i.redd.it 도메인인 경우 무조건 이미지
      if (url.includes('preview.redd.it') || url.includes('i.redd.it')) {
        console.log('Found Reddit image URL (preview/i.redd.it):', post.url);
        return post.url;
      }
      
      // 이미지 확장자로 끝나는 경우
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      if (imageExtensions.some(ext => urlWithoutQuery.endsWith(ext))) {
        console.log('Found image URL by extension:', post.url);
        return post.url;
      }
      
      // 외부 이미지 호스팅 서비스
      if (url.includes('imgur.com') || url.includes('gfycat.com') || url.includes('redgifs.com') || 
          url.includes('i.imgur.com') || url.includes('media.giphy.com')) {
        console.log('Found external image URL:', post.url);
        return post.url;
      }
    }

    // 1. is_reddit_media_domain이 true인 경우 url이 이미지
    if (post.is_reddit_media_domain && post.url) {
      console.log('Found Reddit media domain image:', post.url);
      return post.url;
    }

    // 2. post_hint가 'image'인 경우 url이 이미지
    if (post.post_hint === 'image' && post.url) {
      console.log('Found image by post_hint:', post.url);
      return post.url;
    }
    
    // 3. domain이 redd.it이고 url이 있는 경우 (Reddit 이미지 호스팅)
    if (post.url && post.url.includes('redd.it')) {
      console.log('Found redd.it image URL:', post.url);
      return post.url;
    }

    // 4. preview.images에서 고해상도 이미지 추출 (모든 가능한 필드 확인)
    if (post.preview?.images?.[0]) {
      const previewImage = post.preview.images[0];
      
      // source.url (가장 고해상도)
      if (previewImage.source?.url) {
        let imageUrl = previewImage.source.url
          .replace(/&amp;/g, '&')
          .replace(/&amp;/g, '&'); // 이중 인코딩 방지
        if (imageUrl && imageUrl.startsWith('http')) {
          console.log('Found preview source image:', imageUrl);
          return imageUrl;
        }
      }
      
      // variants (다양한 해상도)
      if (previewImage.variants?.gif?.source?.url) {
        let imageUrl = previewImage.variants.gif.source.url.replace(/&amp;/g, '&');
        if (imageUrl && imageUrl.startsWith('http')) {
          console.log('Found preview gif variant:', imageUrl);
          return imageUrl;
        }
      }
      
      // resolutions에서 가장 큰 이미지
      if (previewImage.resolutions?.length > 0) {
        const largestImage = previewImage.resolutions[previewImage.resolutions.length - 1];
        if (largestImage?.url) {
          let imageUrl = largestImage.url.replace(/&amp;/g, '&');
          if (imageUrl && imageUrl.startsWith('http')) {
            console.log('Found preview resolution image:', imageUrl);
            return imageUrl;
          }
        }
      }
    }

    // 5. thumbnail이 유효한 이미지 URL인 경우 (기본 썸네일 제외)
    if (post.thumbnail && 
        post.thumbnail !== 'default' && 
        post.thumbnail !== 'self' && 
        post.thumbnail !== 'nsfw' &&
        post.thumbnail !== 'spoiler' &&
        post.thumbnail.startsWith('http')) {
      console.log('Found thumbnail image:', post.thumbnail);
      return post.thumbnail;
    }
    
    // 6. media 필드 확인 (Reddit API의 media 객체)
    if (post.media?.oembed?.thumbnail_url) {
      console.log('Found media oembed thumbnail:', post.media.oembed.thumbnail_url);
      return post.media.oembed.thumbnail_url;
    }
    
    if (post.media?.reddit_video?.fallback_url) {
      // 비디오인 경우 썸네일 찾기
      const thumbnailUrl = post.media.reddit_video.fallback_url.replace(/\.mp4$/, '.jpg');
      if (thumbnailUrl !== post.media.reddit_video.fallback_url) {
        console.log('Found video thumbnail:', thumbnailUrl);
        return thumbnailUrl;
      }
    }

    // 디버깅: 이미지를 찾지 못한 경우 상세 로그 출력
    console.log('No image found for post:', {
      url: post.url,
      post_hint: post.post_hint,
      is_reddit_media_domain: post.is_reddit_media_domain,
      has_preview: !!post.preview,
      preview_keys: post.preview ? Object.keys(post.preview) : [],
      thumbnail: post.thumbnail,
      has_media: !!post.media,
    });

    return null;
  } catch (error) {
    console.error('Error extracting image URL:', error);
    return null;
  }
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
                  content: extractContent(post),
                  subreddit: post.subreddit,
                  author: post.author,
                  upvotes: post.ups || 0,
                  num_comments: post.num_comments || 0,
                  image_url: extractImageUrl(post),
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
            content: extractContent(post),
            subreddit: post.subreddit,
            author: post.author,
            upvotes: post.ups || 0,
            num_comments: post.num_comments || 0,
            image_url: extractImageUrl(post),
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