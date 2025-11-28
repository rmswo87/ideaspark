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
  num_comments?: number;
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
    num_comments: idea.numComments || 0,
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
export type SortOption = 'latest' | 'popular' | 'subreddit' | 'comments';

/**
 * 특정 ID의 아이디어 가져오기
 */
export async function getIdea(id: string): Promise<Idea | null> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching idea:', error);
    return null;
  }

  return data;
}

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
  // 모든 컬럼 선택 (*는 num_comments도 포함)
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
  // 댓글순은 클라이언트 사이드에서 정렬 (num_comments 컬럼 정렬 시 Supabase 에러 방지)
  if (filters?.sort === 'popular') {
    // 추천순: upvotes 기준 내림차순
    query = query.order('upvotes', { ascending: false });
  } else if (filters?.sort === 'subreddit') {
    // 서브레딧순: 서브레딧 이름 기준 오름차순, 그 다음 최신순
    query = query.order('subreddit', { ascending: true })
                 .order('collected_at', { ascending: false });
  } else if (filters?.sort === 'comments') {
    // 댓글순: 클라이언트 사이드에서 정렬하므로 최신순으로 먼저 가져옴
    query = query.order('collected_at', { ascending: false });
  } else {
    // 최신순 (기본값)
    query = query.order('collected_at', { ascending: false });
  }

  // limit과 offset은 댓글순 정렬 전에 적용하지 않음 (클라이언트 정렬 후 적용)
  // 댓글순일 때는 더 많은 데이터를 가져와서 정렬해야 하므로 limit을 적용하지 않음
  if (filters?.sort !== 'comments') {
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
  } else {
    // 댓글순일 때는 최대 500개까지 가져와서 정렬 (너무 많은 데이터 방지)
    query = query.limit(500);
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

  let result = data;

  // 클라이언트 사이드 검색 (Supabase full-text search는 나중에 구현)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(idea =>
      idea.title.toLowerCase().includes(searchLower) ||
      idea.content.toLowerCase().includes(searchLower) ||
      idea.subreddit.toLowerCase().includes(searchLower)
    );
  }

  // 댓글순 정렬 (클라이언트 사이드)
  if (filters?.sort === 'comments') {
    // 디버깅: 정렬 전 데이터 확인
    console.log('[IdeaService] Sorting by comments. Total items:', result.length);
    const sampleBefore = result.slice(0, 10).map(i => ({ 
      title: i.title.substring(0, 30), 
      num_comments: i.num_comments,
      upvotes: i.upvotes,
      collected_at: i.collected_at
    }));
    console.log('[IdeaService] Sample num_comments values (first 10):', sampleBefore);
    
    // num_comments 값 분포 확인
    const commentsDistribution = result.reduce((acc, idea) => {
      const comments = idea.num_comments ?? 0;
      acc[comments] = (acc[comments] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    console.log('[IdeaService] num_comments distribution:', commentsDistribution);
    
    result = result.sort((a, b) => {
      // num_comments를 숫자로 변환 (null, undefined, 문자열 등 처리)
      const commentsA = typeof a.num_comments === 'number' ? a.num_comments : (a.num_comments ? parseInt(String(a.num_comments), 10) : 0);
      const commentsB = typeof b.num_comments === 'number' ? b.num_comments : (b.num_comments ? parseInt(String(b.num_comments), 10) : 0);
      
      // NaN 체크
      const numA = isNaN(commentsA) ? 0 : commentsA;
      const numB = isNaN(commentsB) ? 0 : commentsB;
      
      // 댓글 수가 같으면 최신순
      if (numA === numB) {
        const dateA = a.collected_at ? new Date(a.collected_at).getTime() : 0;
        const dateB = b.collected_at ? new Date(b.collected_at).getTime() : 0;
        return dateB - dateA;
      }
      
      // 댓글 수 기준 내림차순
      return numB - numA;
    });

    // 디버깅: 정렬 후 데이터 확인
    const sampleAfter = result.slice(0, 10).map(i => ({ 
      title: i.title.substring(0, 30), 
      num_comments: i.num_comments,
      upvotes: i.upvotes,
      collected_at: i.collected_at
    }));
    console.log('[IdeaService] After sorting. Top 10 items:', sampleAfter);
    console.log('[IdeaService] Top 10 num_comments values:', result.slice(0, 10).map(i => i.num_comments));

    // 클라이언트 정렬 후 limit과 offset 적용
    if (filters?.offset) {
      result = result.slice(filters.offset, filters.offset + (filters.limit || 10));
    } else if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }
  }

  return result;
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
