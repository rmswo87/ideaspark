import { supabase } from '@/lib/supabase'

export type SortOption = 'latest' | 'popular' | 'subreddit'

export interface Idea {
  id: string
  reddit_id?: string
  title: string
  content: string
  subreddit: string
  author: string
  upvotes: number
  num_comments?: number
  url: string
  category: string

  collected_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Reddit 게시물을 아이디어로 변환하여 저장
 */
export async function saveIdeas(ideas: RedditPost[]): Promise<Idea[]> {
  if (!ideas || ideas.length === 0) {
    return [];
  }

  const ideasToSave = ideas.map(idea => ({
    reddit_id: idea.redditId,
    title: idea.title,
    content: idea.content,
    subreddit: idea.subreddit,
    author: idea.author,
    upvotes: idea.upvotes,
    // num_comments 컬럼은 ideas 테이블에 없으므로 제거
    url: idea.url,
    category: categorizeIdea(idea),
  }));

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
      // 더 자세한 에러 메시지 생성
      const errorMessage = error.message || 'Unknown database error';
      throw new Error(`Failed to save ideas to database: ${errorMessage} (Code: ${error.code || 'N/A'})`);
    }

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
    'development': ['code', 'programming', 'developer', 'app', 'software', 'api', 'framework', 'library', 'github', 'stack', 'tech', 'coding', 'algorithm', 'database', 'backend', 'frontend', 'react', 'javascript', 'python', 'node', 'web', 'mobile', 'ios', 'android'],
    'design': ['design', 'ui', 'ux', 'figma', 'sketch', 'prototype', 'wireframe', 'mockup', 'brand', 'logo', 'graphic', 'visual', 'aesthetic', 'layout'],
    'business': ['business', 'startup', 'revenue', 'profit', 'market', 'sales', 'customer', 'client', 'funding', 'investor', 'vc', 'angel', 'equity', 'valuation', 'mrr', 'arr', 'saas', 'b2b', 'b2c', 'pricing', 'strategy', 'growth', 'marketing'],
    'product': ['product', 'feature', 'launch', 'mvp', 'beta', 'release', 'version', 'update', 'roadmap'],
    'education': ['learn', 'course', 'tutorial', 'education', 'teaching', 'student', 'school', 'university', 'skill', 'training'],
    'general': []
  };

  const text = `${idea.title} ${idea.content}`.toLowerCase();
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return category;
    }
  }
  
  return 'general';
}

interface RedditPost {
  redditId: string
  title: string
  content: string
  subreddit: string
  author: string
  upvotes: number
  numComments?: number
  url: string
}

/**
 * 단일 아이디어 가져오기
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
 * 아이디어 목록 가져오기 (필터링 및 정렬 지원)
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

  if (filters?.category && filters.category !== 'all' && filters.category.trim() !== '') {
    query = query.eq('category', filters.category);
  }

  if (filters?.subreddit && filters.subreddit !== 'all' && filters.subreddit.trim() !== '') {
    query = query.eq('subreddit', filters.subreddit);
  }

  if (filters?.sort === 'popular') {
    query = query.order('upvotes', { ascending: false });
  } else if (filters?.sort === 'subreddit') {
    query = query.order('subreddit', { ascending: true })
                 .order('collected_at', { ascending: false });
  } else {
    query = query.order('collected_at', { ascending: false });
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching ideas:', error);
    throw error;
  }

  // 정렬 검증: popular일 때 upvotes 순서 확인 및 필요시 클라이언트에서 재정렬
  if (filters?.sort === 'popular' && data && data.length > 1) {
    let isSorted = true;
    for (let i = 1; i < data.length; i++) {
      if ((data[i-1].upvotes || 0) < (data[i].upvotes || 0)) {
        isSorted = false;
        break;
      }
    }
    if (!isSorted) {
      data.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }
  }

  if (!data || data.length === 0) {
    return [];
  }

  let result = data;

  if (filters?.search && filters.search.trim() !== '') {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(idea =>
      idea.title.toLowerCase().includes(searchLower) ||
      idea.content.toLowerCase().includes(searchLower) ||
      idea.subreddit.toLowerCase().includes(searchLower)
    );
  }

  // 추천순 정렬 보완: 항상 클라이언트 사이드에서 재정렬하여 확실하게
  if (filters?.sort === 'popular') {
    result = result.sort((a, b) => {
      const aUpvotes = a.upvotes || 0;
      const bUpvotes = b.upvotes || 0;
      return bUpvotes - aUpvotes;
    });
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

  const stats = {
    total: data?.length || 0,
    byCategory: {} as Record<string, number>,
    bySubreddit: {} as Record<string, number>,
  };

  data?.forEach(idea => {
    stats.byCategory[idea.category] = (stats.byCategory[idea.category] || 0) + 1;
    stats.bySubreddit[idea.subreddit] = (stats.bySubreddit[idea.subreddit] || 0) + 1;
  });

  return stats;
}

/**
 * 서브레딧 목록 가져오기
 */
export async function getSubreddits(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('subreddit')
    .order('subreddit', { ascending: true });

  if (error) {
    console.error('Error fetching subreddits:', error);
    return [];
  }

  const uniqueSubreddits = Array.from(new Set(data?.map(i => i.subreddit) || []));
  return uniqueSubreddits;
<<<<<<< HEAD
}
=======
}
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
