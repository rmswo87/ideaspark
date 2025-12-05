// 개발 소식 수집 및 관리 서비스
import { supabase } from '@/lib/supabase';

export interface DevNews {
  id: string;
  reddit_id: string;
  title: string;
  content: string | null;
  subreddit: string;
  author: string | null;
  upvotes: number;
  url: string;
  category: string | null;
  tags: string[] | null;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_date: string;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface DevNewsFilters {
  periodType?: 'daily' | 'weekly' | 'monthly';
  subreddit?: string;
  category?: string;
  limit?: number;
}

/**
 * 개발 소식 조회
 */
export async function getDevNews(filters: DevNewsFilters = {}): Promise<DevNews[]> {
  try {
    let query = supabase
      .from('dev_news')
      .select('*')
      .order('upvotes', { ascending: false })
      .order('collected_at', { ascending: false });

    if (filters.periodType) {
      query = query.eq('period_type', filters.periodType);
      
      // 기간별 날짜 필터링
      const now = new Date();
      let periodStart: Date;
      
      if (filters.periodType === 'daily') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filters.periodType === 'weekly') {
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek; // 일요일로 맞춤
        periodStart = new Date(now.getFullYear(), now.getMonth(), diff);
      } else { // monthly
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      query = query.gte('period_date', periodStart.toISOString().split('T')[0]);
    }

    if (filters.subreddit) {
      query = query.eq('subreddit', filters.subreddit);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(50); // 기본값
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching dev news:', error);
    return [];
  }
}

/**
 * 오늘의 개발 소식 조회
 */
export async function getDailyDevNews(limit: number = 10): Promise<DevNews[]> {
  return getDevNews({ periodType: 'daily', limit });
}

/**
 * 주간 개발 소식 조회
 */
export async function getWeeklyDevNews(limit: number = 20): Promise<DevNews[]> {
  return getDevNews({ periodType: 'weekly', limit });
}

/**
 * 월간 개발 소식 조회
 */
export async function getMonthlyDevNews(limit: number = 30): Promise<DevNews[]> {
  return getDevNews({ periodType: 'monthly', limit });
}

/**
 * 핫한 키워드 추출 (태그 기반)
 */
export async function getHotKeywords(limit: number = 10): Promise<Array<{ tag: string; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('dev_news')
      .select('tags')
      .not('tags', 'is', null)
      .limit(1000); // 최근 1000개 게시글에서 키워드 추출

    if (error) throw error;

    // 태그 카운트
    const tagCounts: Record<string, number> = {};
    data?.forEach(news => {
      if (news.tags && Array.isArray(news.tags)) {
        news.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // 상위 키워드 반환
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  } catch (error) {
    console.error('Error fetching hot keywords:', error);
    return [];
  }
}

/**
 * 서브레딧별 인기 소식 조회
 */
export async function getPopularBySubreddit(subreddit: string, limit: number = 5): Promise<DevNews[]> {
  return getDevNews({ subreddit, limit });
}

