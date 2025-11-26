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
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((fetchError) => {
      // 네트워크 에러 처리
      throw new Error(`API 서버에 연결할 수 없습니다. Vercel 배포가 완료되었는지 확인하세요. (${fetchError.message})`);
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        count: 0,
        error: result.error || 'Unknown error',
      };
    }

    // 수집된 아이디어를 데이터베이스에 저장
    if (result.ideas && result.ideas.length > 0) {
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

      await saveIdeas(ideas);
    }

    return {
      success: true,
      count: result.count || 0,
    };
  } catch (error) {
    console.error('Collection error:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 중복 아이디어 제거
 */
function removeDuplicates(ideas: RedditPost[]): RedditPost[] {
  const seen = new Set<string>();
  return ideas.filter(idea => {
    if (seen.has(idea.redditId)) {
      return false;
    }
    seen.add(idea.redditId);
    return true;
  });
}

/**
 * 특정 서브레딧에서만 수집 (서버 사이드 API 사용)
 */
export async function collectFromSubreddit(
  subreddit: string,
  limit: number = 25
): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  // 전체 수집 함수를 사용 (서브레딧 필터링은 서버 사이드에서 처리 가능)
  // 현재는 전체 수집만 지원
  return collectIdeas();
}

