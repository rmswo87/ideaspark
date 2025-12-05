// 개발 소식 수집 서비스
import { supabase } from '@/lib/supabase';

/**
 * API 엔드포인트 URL 가져오기
 */
function getApiUrl(endpoint: string): string {
  const provider = import.meta.env.VITE_API_PROVIDER;
  const baseUrl = window.location.origin;
  const functionName = endpoint.replace('/api/', '');
  
  if (provider === 'supabase') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      return `${baseUrl}${endpoint}`;
    }
    return `${supabaseUrl}/functions/v1/${functionName}`;
  } else if (provider === 'cloudflare') {
    const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
    if (!workerUrl) {
      return `${baseUrl}${endpoint}`;
    }
    return `${workerUrl}${endpoint}`;
  }
  
  return `${baseUrl}${endpoint}`;
}

/**
 * 개발 소식 수집 메인 함수
 */
export async function collectDevNews(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const apiUrl = getApiUrl('/api/collect-dev-news');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const isSupabaseFunction = apiUrl.includes('/functions/v1/');
    if (isSupabaseFunction) {
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseAnonKey) {
        headers['apikey'] = supabaseAnonKey;
        headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
      }
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const result = await response.json() as {
      success: boolean;
      count: number;
      posts?: any[];
      error?: string;
    };

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    // 수집한 게시물을 데이터베이스에 저장
    if (result.posts && result.posts.length > 0) {
      await saveDevNews(result.posts);
    }

    return {
      success: true,
      count: result.count || 0,
    };
  } catch (error) {
    console.error('Error collecting dev news:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 개발 소식 저장
 */
async function saveDevNews(posts: any[]): Promise<void> {
  try {
    const newsToInsert = posts.map(post => ({
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

    const { error } = await supabase
      .from('dev_news')
      .upsert(newsToInsert, {
        onConflict: 'reddit_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error saving dev news:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in saveDevNews:', error);
    throw error;
  }
}

