// 아이디어 수집 자동화 서비스
import { saveIdeas } from './ideaService';
<<<<<<< HEAD
import { supabase } from '@/lib/supabase';
import type { RedditPost } from '@/types/reddit';

/**
 * API 엔드포인트 URL 가져오기
 */
function getApiUrl(endpoint: string): string {
  const provider = import.meta.env.VITE_API_PROVIDER;
  const baseUrl = window.location.origin;
  const functionName = endpoint.replace('/api/', '');
  
  // 환경 변수로 명시적으로 provider가 설정된 경우
  if (provider === 'supabase') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      if (import.meta.env.DEV) {
        console.warn('[Collector] VITE_SUPABASE_URL not set, falling back to Vercel');
      }
      return `${baseUrl}${endpoint}`;
    }
    // Supabase Edge Functions URL 직접 사용
    return `${supabaseUrl}/functions/v1/${functionName}`;
  } else if (provider === 'cloudflare') {
    const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
    if (!workerUrl) {
      if (import.meta.env.DEV) {
        console.warn('[Collector] VITE_CLOUDFLARE_WORKER_URL not set, falling back to Vercel');
      }
      return `${baseUrl}${endpoint}`;
    }
    return `${workerUrl}${endpoint}`;
  } else if (provider === 'vercel') {
    // Vercel 명시적으로 설정된 경우
    return `${baseUrl}${endpoint}`;
  }
  
  // provider가 설정되지 않은 경우: Vercel 기본값
  // 로컬 개발 환경에서는 Vercel Edge Function이 작동하지 않을 수 있지만,
  // 프로덕션 환경(Vercel 배포)에서는 정상 작동합니다
  return `${baseUrl}${endpoint}`;
}

/**
 * 로컬 개발 환경에서 클라이언트 사이드에서 직접 Reddit API 호출
 */
async function collectIdeasLocal(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials not configured. Please set VITE_REDDIT_CLIENT_ID and VITE_REDDIT_CLIENT_SECRET in .env.local');
    }

    // OAuth2 토큰 가져오기 (UTF-8 안전 Base64 인코딩)
    const credentials = btoa(unescape(encodeURIComponent(`${clientId}:${clientSecret}`)));
    
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
    const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur'];
    const allPosts: RedditPost[] = [];

    // 각 서브레딧에서 게시물 수집
    for (const subreddit of subreddits) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
          },
        });

        if (!response.ok) {
          // 403 에러인 경우, 공개 API로 시도
          if (response.status === 403) {
            const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
            const publicResponse = await fetch(publicUrl, {
              headers: {
                'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
              },
            });
            
            if (publicResponse.ok) {
              const publicData = await publicResponse.json() as { data?: { children?: Array<{ data?: any }> } };
              if (publicData?.data?.children && publicData.data.children.length > 0) {
                const posts: RedditPost[] = publicData.data.children
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
                    createdAt: new Date(child.data.created_utc * 1000),
                  }));
                allPosts.push(...posts);
              }
            }
          }
          continue;
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        
        if (data?.data?.children && data.data.children.length > 0) {
          const posts: RedditPost[] = data.data.children
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
              createdAt: new Date(child.data.created_utc * 1000),
            }));
          
          allPosts.push(...posts);
        }

        // Rate Limit 준수
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`Error fetching ${subreddit}:`, error);
        }
        // 에러가 발생해도 다음 서브레딧 계속 처리
      }
    }

    // 중복 제거
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.redditId, post])).values()
    );

    // 수집된 아이디어를 데이터베이스에 저장
    if (uniquePosts.length > 0) {
      try {
        const savedIdeas = await saveIdeas(uniquePosts);
        if (import.meta.env.DEV) {
          console.log('[Collector] Successfully saved', savedIdeas.length, 'ideas to database');
        }
      } catch (saveError) {
        if (import.meta.env.DEV) {
          console.error('[Collector] Error saving ideas to database:', saveError);
        }
        throw saveError;
      }
    }

    return {
      success: true,
      count: uniquePosts.length,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[Collector] Local collection error:', error);
    }
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 아이디어 수집 메인 함수 (서버 사이드 API 호출)
 * 
 * 참고: Reddit API는 CORS 정책 때문에 브라우저에서 직접 호출할 수 없습니다.
 * 반드시 서버 사이드 API를 통해 호출해야 합니다.
=======
import type { RedditPost } from '@/types/reddit';

/**
 * 아이디어 수집 메인 함수 (서버 사이드 API 호출)
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
 */
export async function collectIdeas(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
<<<<<<< HEAD

  try {
    // 서버 사이드 API 호출
    // Provider에 따라 자동으로 엔드포인트 선택:
    // - Vercel: /api/collect-ideas (Vercel Edge Function)
    // - Supabase: https://[project].supabase.co/functions/v1/collect-ideas
    // - Cloudflare: https://[worker].workers.dev/api/collect-ideas
    const apiUrl = getApiUrl('/api/collect-ideas');
    
    if (import.meta.env.DEV) {
      console.log('[Collector] Calling API:', apiUrl);
    }
    
    // Supabase Edge Function인 경우 API key 헤더 추가
    const isSupabaseFunction = apiUrl.includes('/functions/v1/');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (isSupabaseFunction) {
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseAnonKey) {
        headers['apikey'] = supabaseAnonKey;
        headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
      } else {
        // supabase 클라이언트에서 키 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        // anon key는 supabase 클라이언트에서 가져올 수 없으므로 환경 변수 필수
        if (import.meta.env.DEV) {
          console.warn('[Collector] VITE_SUPABASE_ANON_KEY not set, API call may fail');
        }
      }
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
    }).catch((fetchError) => {
      // 네트워크 에러 처리
      if (import.meta.env.DEV) {
        console.error('[Collector] Fetch error:', fetchError);
        console.error('[Collector] API URL:', apiUrl);
      }
      throw new Error(`API 서버에 연결할 수 없습니다: ${fetchError.message}`);
    });

    // response가 Promise인 경우 (폴백된 경우)
    if (response && typeof (response as any).then === 'function') {
      return await response;
    }

    if (import.meta.env.DEV) {
      console.log('[Collector] API response status:', response.status, response.statusText);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (import.meta.env.DEV) {
        console.error('[Collector] API error response:', errorData);
        console.error('[Collector] API URL:', apiUrl);
        console.error('[Collector] Response status:', response.status);
      }
      
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    const result = await response.json();
    if (import.meta.env.DEV) {
      console.log('[Collector] API result summary:', {
        success: result.success,
        count: result.count,
        ideasLength: result.ideas?.length || 0,
      });
=======
  try {
    // 서버 사이드 API 호출
    // Vercel 배포 후: /api/collect-ideas (Vercel Edge Function)
    // 로컬 개발: vercel dev 사용 시 자동으로 프록시됨
    const apiUrl = '/api/collect-ideas';
    
    console.log('[Collector] Calling API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((fetchError) => {
      // 네트워크 에러 처리
      console.error('[Collector] Fetch error:', fetchError);
      throw new Error(`API 서버에 연결할 수 없습니다. Vercel 배포가 완료되었는지 확인하세요. (${fetchError.message})`);
    });

    console.log('[Collector] API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Collector] API error response:', errorData);
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Collector] API result (full):', JSON.stringify(result, null, 2));
    console.log('[Collector] API result summary:', {
      success: result.success,
      count: result.count,
      ideasLength: result.ideas?.length || 0,
      ideasIsArray: Array.isArray(result.ideas),
      error: result.error,
    });
    
    // 첫 번째 아이디어 샘플 확인
    if (result.ideas && result.ideas.length > 0) {
      console.log('[Collector] First idea sample:', result.ideas[0]);
    } else {
      console.warn('[Collector] result.ideas is:', result.ideas);
      console.warn('[Collector] result.ideas type:', typeof result.ideas);
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
    }

    if (!result.success) {
      return {
        success: false,
        count: 0,
        error: result.error || 'Unknown error',
      };
    }

    // 수집된 아이디어를 데이터베이스에 저장
    if (result.ideas && result.ideas.length > 0) {
<<<<<<< HEAD
      if (import.meta.env.DEV) {
        console.log('[Collector] Saving', result.ideas.length, 'ideas to database...');
      }
=======
      console.log('[Collector] Saving', result.ideas.length, 'ideas to database...');
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
      
      // RedditPost 형식으로 변환
      const ideas: RedditPost[] = result.ideas.map((idea: any) => ({
        redditId: idea.redditId,
        title: idea.title,
        content: idea.content,
        subreddit: idea.subreddit,
        author: idea.author,
        upvotes: idea.upvotes,
<<<<<<< HEAD
        numComments: idea.numComments || 0,
=======
        numComments: idea.numComments || 0, // Reddit API에서 가져온 댓글 수 포함
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
        url: idea.url,
        createdAt: new Date(idea.createdAt),
      }));

      try {
        const savedIdeas = await saveIdeas(ideas);
<<<<<<< HEAD
        if (import.meta.env.DEV) {
          console.log('[Collector] Successfully saved', savedIdeas.length, 'ideas to database');
        }
      } catch (saveError) {
        if (import.meta.env.DEV) {
          console.error('[Collector] Error saving ideas to database:', saveError);
        }
        throw saveError;
      }
=======
        console.log('[Collector] Successfully saved', savedIdeas.length, 'ideas to database');
      } catch (saveError) {
        console.error('[Collector] Error saving ideas to database:', saveError);
        console.error('[Collector] Error type:', typeof saveError);
        console.error('[Collector] Error details:', saveError instanceof Error ? {
          message: saveError.message,
          stack: saveError.stack,
        } : saveError);
        
        // 에러를 다시 throw하여 상위에서 처리할 수 있도록
        throw saveError;
      }
    } else {
      console.warn('[Collector] No ideas to save. API returned:', result);
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
    }

    return {
      success: true,
      count: result.count || 0,
    };
  } catch (error) {
<<<<<<< HEAD
    if (import.meta.env.DEV) {
      console.error('[Collector] Collection error:', error);
    }
    
    // 에러 메시지 개선
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Supabase Edge Function 404 에러인 경우 더 명확한 메시지
    if (errorMessage.includes('Supabase Edge Function이 배포되지 않았습니다')) {
      // 이미 명확한 메시지가 있음
    } else if (errorMessage.includes('404') || errorMessage.includes('NOT_FOUND')) {
      errorMessage = `API 엔드포인트를 찾을 수 없습니다. 로컬 개발 환경에서는 Supabase Edge Function을 배포해야 합니다:\n\n` +
        `1. Supabase CLI 설치: npm install -g supabase\n` +
        `2. 로그인: supabase login\n` +
        `3. 프로젝트 연결: supabase link --project-ref djxiousdavdwwznufpzs\n` +
        `4. 함수 배포: supabase functions deploy collect-ideas --no-verify-jwt\n` +
        `5. 환경 변수 설정: supabase secrets set REDDIT_CLIENT_ID=... REDDIT_CLIENT_SECRET=...`;
    }
    
    return {
      success: false,
      count: 0,
      error: errorMessage,
=======
    console.error('[Collector] Collection error:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
    };
  }
}

/**
 * 특정 서브레딧에서만 수집 (서버 사이드 API 사용)
 */
export async function collectFromSubreddit(
  _subreddit: string,
  _limit: number = 25
): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  // 전체 수집 함수를 사용 (서브레딧 필터링은 서버 사이드에서 처리 가능)
  // 현재는 전체 수집만 지원
  return collectIdeas();
<<<<<<< HEAD
}

=======
}
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
