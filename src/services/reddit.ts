// Reddit API 클라이언트 구현 (OAuth2 인증)
import type { RedditPost, RedditConfig, RedditApiResponse } from '@/types/reddit';

class RedditClient {
  private baseUrl = 'https://www.reddit.com';
  private oauthUrl = 'https://www.reddit.com/api/v1';
  private config: RedditConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: RedditConfig) {
    this.config = config;
  }

  /**
   * OAuth2 토큰 가져오기 (Client Credentials Grant)
   * Personal Use Script를 사용한 인증
   */
  private async getAccessToken(): Promise<string> {
    // 토큰이 아직 유효한 경우 재사용
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.config.clientId || import.meta.env.VITE_REDDIT_CLIENT_ID;
    const clientSecret = this.config.clientSecret || import.meta.env.VITE_REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Reddit API credentials are not configured. Please set VITE_REDDIT_CLIENT_ID and VITE_REDDIT_CLIENT_SECRET in .env.local');
    }

    try {
      // Base64 인코딩
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(`${this.oauthUrl}/access_token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.config.userAgent,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Reddit OAuth error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // 토큰 만료 시간 설정 (보통 3600초, 여유있게 3500초로 설정)
      this.tokenExpiry = Date.now() + (data.expires_in - 100) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error);
      throw error;
    }
  }

  /**
   * 서브레딧 게시물 가져오기 (OAuth2 인증 사용)
   */
  async fetchSubredditPosts(
    subreddit: string,
    limit: number = 25,
    sort: 'hot' | 'new' | 'top' = 'hot'
  ): Promise<RedditPost[]> {
    try {
      // OAuth2 토큰 가져오기
      const token = await this.getAccessToken();

      const url = `${this.baseUrl}/r/${subreddit}/${sort}.json?limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': this.config.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      const data: RedditApiResponse = await response.json();
      return this.parsePosts(data);
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      throw error;
    }
  }

  /**
   * Reddit API 응답을 RedditPost 배열로 변환
   */
  private parsePosts(data: RedditApiResponse): RedditPost[] {
    if (!data?.data?.children) {
      return [];
    }

    return data.data.children.map((child) => ({
      redditId: child.data.id,
      title: child.data.title,
      content: child.data.selftext || '',
      subreddit: child.data.subreddit,
      author: child.data.author,
      upvotes: child.data.ups || 0,
      // permalink는 이미 /r/subreddit/comments/post_id/slug/ 형식으로 제공됨
      // www.reddit.com과 결합하여 완전한 URL 생성
      url: `https://www.reddit.com${child.data.permalink}`,
      createdAt: new Date(child.data.created_utc * 1000),
    }));
  }

  /**
   * 여러 서브레딧에서 게시물 가져오기
   */
  async fetchMultipleSubreddits(
    subreddits: string[],
    limit: number = 25,
    sort: 'hot' | 'new' | 'top' = 'hot'
  ): Promise<RedditPost[]> {
    const allPosts: RedditPost[] = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchSubredditPosts(subreddit, limit, sort);
        allPosts.push(...posts);
        // Rate Limit 준수 (60 req/min)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to fetch from r/${subreddit}:`, error);
        // 에러가 발생해도 다음 서브레딧 계속 처리
      }
    }

    return allPosts;
  }
}

// Reddit 클라이언트 인스턴스 생성
export const redditClient = new RedditClient({
  userAgent: 'IdeaSpark/1.0 (by /u/ideaspark)',
  clientId: import.meta.env.VITE_REDDIT_CLIENT_ID,
  clientSecret: import.meta.env.VITE_REDDIT_CLIENT_SECRET,
});
