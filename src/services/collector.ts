// 아이디어 수집 자동화 서비스
import { saveIdeas } from './ideaService';
import { supabase } from '@/lib/supabase';
import type { RedditPost } from '@/types/reddit';

/**
 * API 엔드포인트 URL 가져오기
 */
function getApiUrl(endpoint: string): string {
  const provider = import.meta.env.VITE_API_PROVIDER;
  const baseUrl = window.location.origin;
  const functionName = endpoint.replace('/api/', '');
  
  // GitHub Pages 환경 감지 (CORS 문제 회피)
  const isGitHubPages = window.location.hostname.includes('github.io');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  console.log(`🌐 API URL 결정: 환경=${isGitHubPages ? 'GitHub Pages' : isLocalhost ? 'Localhost' : 'Other'}, Provider=${provider}`);
  
  // GitHub Pages에서는 CORS 문제로 인해 수집 기능을 비활성화
  if (isGitHubPages && endpoint.includes('collect-ideas')) {
    console.warn('⚠️ GitHub Pages에서는 수집 기능이 제한됩니다 (CORS 정책)');
    throw new Error('GitHub Pages에서는 수집 기능을 사용할 수 없습니다');
  }
  
  // 환경 변수로 명시적으로 provider가 설정된 경우
  if (provider === 'supabase' && !isGitHubPages) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('[Collector] VITE_SUPABASE_URL not set, falling back to Vercel');
      return `${baseUrl}${endpoint}`;
    }
    // Supabase Edge Functions URL 직접 사용
    return `${supabaseUrl}/functions/v1/${functionName}`;
  } else if (provider === 'cloudflare') {
    const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
    if (!workerUrl) {
      console.warn('[Collector] VITE_CLOUDFLARE_WORKER_URL not set, falling back to Vercel');
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

// 로컬 개발 환경 함수는 제거됨 (서버 사이드 API 사용)

/**
 * 아이디어 수집 메인 함수 (서버 사이드 API 호출)
 * 
 * 참고: Reddit API는 CORS 정책 때문에 브라우저에서 직접 호출할 수 없습니다.
 * 반드시 서버 사이드 API를 통해 호출해야 합니다. */
export async function collectIdeas(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {

  try {
    // 서버 사이드 API 호출
    // GitHub Pages 환경에서는 Supabase Edge Function 사용, Vercel에서는 Vercel API 사용
    const isGitHubPages = window.location.hostname.includes('github.io');
    const apiUrl = isGitHubPages 
      ? getApiUrl('/api/collect-ideas') // GitHub Pages: Supabase Edge Function
      : `${window.location.origin}/api/collect-ideas`; // Vercel: Vercel API
    
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
      });    }

    if (!result.success) {
      return {
        success: false,
        count: 0,
        error: result.error || 'Unknown error',
      };
    }

    // 수집된 아이디어를 데이터베이스에 저장
    if (result.ideas && result.ideas.length > 0) {
      if (import.meta.env.DEV) {
        console.log('[Collector] Saving', result.ideas.length, 'ideas to database...');
      }      
      // RedditPost 형식으로 변환
      const ideas: RedditPost[] = result.ideas.map((idea: any) => ({
        redditId: idea.redditId,
        title: idea.title,
        content: idea.content,
        subreddit: idea.subreddit,
        author: idea.author,
        upvotes: idea.upvotes,
        numComments: idea.numComments || 0,        url: idea.url,
        createdAt: new Date(idea.createdAt),
      }));

      try {
        const savedIdeas = await saveIdeas(ideas);
        if (import.meta.env.DEV) {
          console.log('[Collector] Successfully saved', savedIdeas.length, 'ideas to database');
        }
      } catch (saveError) {
        if (import.meta.env.DEV) {
          console.error('[Collector] Error saving ideas to database:', saveError);
        }
        throw saveError;
      }    }

    return {
      success: true,
      count: result.count || 0,
    };
  } catch (error) {
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
      error: errorMessage,    };
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
}
