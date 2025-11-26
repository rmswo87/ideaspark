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

  const { data, error } = await supabase
    .from('ideas')
    .upsert(ideasToSave, { 
      onConflict: 'reddit_id',
      ignoreDuplicates: false 
    })
    .select();

  if (error) {
    console.error('Error saving ideas:', error);
    throw error;
  }

  return data || [];
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
 * 아이디어 목록 가져오기
 */
export async function getIdeas(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<Idea[]> {
  let query = supabase
    .from('ideas')
    .select('*')
    .order('collected_at', { ascending: false });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
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

  // 데이터가 없으면 빈 배열 반환 (샘플 데이터 제거)
  if (!data || data.length === 0) {
    return [];
  }

  // 클라이언트 사이드 검색 (Supabase full-text search는 나중에 구현)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    return data.filter(idea =>
      idea.title.toLowerCase().includes(searchLower) ||
      idea.content.toLowerCase().includes(searchLower)
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
}> {
  const { data, error } = await supabase
    .from('ideas')
    .select('category');

  if (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, byCategory: {} };
  }

  const byCategory: Record<string, number> = {};
  (data || []).forEach(idea => {
    byCategory[idea.category] = (byCategory[idea.category] || 0) + 1;
  });

  return {
    total: data?.length || 0,
    byCategory,
  };
}

