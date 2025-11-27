// 아이디어 저장 및 관리 서비스
import { supabase } from '@/lib/supabase';
import type { RedditPost } from '@/types/reddit';

export interface Idea {
  id?: string;
  reddit_id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  upvotes: number;
  url: string;
  category: string;
  collected_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Reddit 게시물을 아이디어로 변환하여 저장
 */
export async function saveIdeas(ideas: RedditPost[]): Promise<Idea[]> {
  if (!ideas || ideas.length === 0) {
    console.warn('[IdeaService] No ideas to save');
    return [];
  }

  console.log('[IdeaService] Preparing to save', ideas.length, 'ideas...');

  const ideasToSave = ideas.map(idea => ({
    reddit_id: idea.redditId,
    title: idea.title,
    content: idea.content,
    subreddit: idea.subreddit,
    author: idea.author,
    upvotes: idea.upvotes,
    url: idea.url,
    category: categorizeIdea(idea),
  }));

  console.log('[IdeaService] Sample idea to save:', ideasToSave[0]);

  try {
    const { data, error } = await supabase
      .from('ideas')
      .upsert(ideasToSave, { 
        onConflict: 'reddit_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('[IdeaService] Error saving ideas:', error);
      console.error('[IdeaService] Error code:', error.code);
      console.error('[IdeaService] Error message:', error.message);
      console.error('[IdeaService] Error details:', JSON.stringify(error, null, 2));
      console.error('[IdeaService] Sample idea that failed:', ideasToSave[0]);
      
      // 더 자세한 에러 메시지 생성
      const errorMessage = error.message || 'Unknown database error';
      throw new Error(`Failed to save ideas to database: ${errorMessage} (Code: ${error.code || 'N/A'})`);
    }

    console.log('[IdeaService] Successfully saved', data?.length || 0, 'ideas');
    return data || [];
  } catch (saveError) {
    console.error('[IdeaService] Exception while saving:', saveError);
    throw saveError;
  }
}

/**
 * 간단한 키워드 기반 카테고리 분류
 */
function categorizeIdea(idea: RedditPost): string {
  const keywords = {
    'development': ['dev', 'coding', 'programming', 'tech', 'software', 'app', 'website'],
    'design': ['design', 'ui', 'ux', 'interface', 'graphic', 'visual'],
    'business': ['startup', 'business', 'entrepreneur', 'company', 'market'],
    'product': ['product', 'app', 'service', 'tool', 'platform'],
    'education': ['learn', 'education', 'course', 'tutorial', 'study'],
  };

  const content = `${idea.title} ${idea.content}`.toLowerCase();
  
  for (const [category, keys] of Object.entries(keywords)) {
    if (keys.some(key => content.includes(key))) {
      return category;
    }
  }
  
  return 'general';
}

/**
 * 정렬 옵션 타입
 */
export type SortOption = 'latest' | 'popular' | 'subreddit';

/**
 * 아이디어 목록 가져오기
 */
export async function getIdeas(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sort?: SortOption;
  subreddit?: string;
}): Promise<Idea[]> {
  let query = supabase
    .from('ideas')
    .select('*');

  // 카테고리 필터
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  // 서브레딧 필터
  if (filters?.subreddit && filters.subreddit !== 'all') {
    query = query.eq('subreddit', filters.subreddit);
  }

  // 정렬 옵션에 따른 쿼리 설정
  if (filters?.sort === 'popular') {
    // 추천순: upvotes 기준 내림차순
    query = query.order('upvotes', { ascending: false });
  } else if (filters?.sort === 'subreddit') {
    // 서브레딧순: 서브레딧 이름 기준 오름차순, 그 다음 최신순
    query = query.order('subreddit', { ascending: true })
                 .order('collected_at', { ascending: false });
  } else {
    // 최신순 (기본값)
    query = query.order('collected_at', { ascending: false });
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  // 에러 처리
  if (error) {
    console.error('Error fetching ideas:', error);
    throw error;
  }

  // 데이터가 없으면 빈 배열 반환
  if (!data || data.length === 0) {
    return [];
  }

  // 클라이언트 사이드 검색 (Supabase full-text search는 나중에 구현)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return data.filter(idea =>
      idea.title.toLowerCase().includes(searchLower) ||
      idea.content.toLowerCase().includes(searchLower) ||
      idea.subreddit.toLowerCase().includes(searchLower)
    );
  }

  return data;
}

/**
 * 아이디어 통계 가져오기
 */
export async function getIdeaStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySubreddit: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('ideas')
    .select('category, subreddit');

  if (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, byCategory: {}, bySubreddit: {} };
  }

  const byCategory: Record<string, number> = {};
  const bySubreddit: Record<string, number> = {};
  
  (data || []).forEach(idea => {
    byCategory[idea.category] = (byCategory[idea.category] || 0) + 1;
    bySubreddit[idea.subreddit] = (bySubreddit[idea.subreddit] || 0) + 1;
  });

  return {
    total: data?.length || 0,
    byCategory,
    bySubreddit,
  };
}

/**
 * 고유한 서브레딧 목록 가져오기
 */
export async function getSubreddits(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('subreddit');

  if (error) {
    console.error('Error fetching subreddits:', error);
    return [];
  }

  // 중복 제거 및 정렬
  const uniqueSubreddits = Array.from(
    new Set((data || []).map(idea => idea.subreddit))
  ).sort();

  return uniqueSubreddits;
}

