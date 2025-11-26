// 아이디어 수집 자동화 서비스
import { saveIdeas } from './ideaService';
import type { RedditPost } from '@/types/reddit';

/**
 * 아이디어 수집 메인 함수 (서버 사이드 API 호출)
 */
export async function collectIdeas(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
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
      console.log('[Collector] Saving', result.ideas.length, 'ideas to database...');
      
      // RedditPost 형식으로 변환
      const ideas: RedditPost[] = result.ideas.map((idea: any) => ({
        redditId: idea.redditId,
        title: idea.title,
        content: idea.content,
        subreddit: idea.subreddit,
        author: idea.author,
        upvotes: idea.upvotes,
        url: idea.url,
        createdAt: new Date(idea.createdAt),
      }));

      try {
        const savedIdeas = await saveIdeas(ideas);
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
    }

    return {
      success: true,
      count: result.count || 0,
    };
  } catch (error) {
    console.error('[Collector] Collection error:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
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
}

