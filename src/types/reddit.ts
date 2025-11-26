// Reddit API 관련 타입 정의

export interface RedditPost {
  redditId: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  upvotes: number;
  url: string;
  createdAt: Date;
}

export interface RedditConfig {
  clientId?: string;
  clientSecret?: string;
  userAgent: string;
}

export interface RedditApiResponse {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        selftext: string;
        subreddit: string;
        author: string;
        ups: number;
        permalink: string;
        created_utc: number;
      };
    }>;
  };
}

