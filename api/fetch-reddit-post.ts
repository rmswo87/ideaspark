// Vercel Edge Function: Reddit URL에서 특정 게시물 내용 가져오기
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Reddit URL is required' });
    }

    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'Reddit API credentials not configured'
      });
    }

    // OAuth2 토큰 가져오기
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Reddit OAuth error: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get access token from Reddit API',
      });
    }

    // Reddit URL에서 post ID 추출
    // 형식: https://www.reddit.com/r/subreddit/comments/[post_id]/[slug]/
    const urlMatch = url.match(/\/r\/[^/]+\/comments\/([^/]+)\//);
    if (!urlMatch || !urlMatch[1]) {
      return res.status(400).json({ error: 'Invalid Reddit URL format' });
    }

    const postId = urlMatch[1];
    const subredditMatch = url.match(/\/r\/([^/]+)\//);
    const subreddit = subredditMatch ? subredditMatch[1] : '';

    // Reddit API로 게시물 조회
    // 형식: https://oauth.reddit.com/r/subreddit/comments/[post_id]/.json
    const apiUrl = subreddit 
      ? `https://oauth.reddit.com/r/${subreddit}/comments/${postId}/.json`
      : `https://oauth.reddit.com/comments/${postId}/.json`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
      },
    });

    if (!response.ok) {
      // OAuth 실패 시 공개 API 시도
      const publicUrl = subreddit 
        ? `https://www.reddit.com/r/${subreddit}/comments/${postId}/.json`
        : `https://www.reddit.com/comments/${postId}/.json`;
      
      const publicResponse = await fetch(publicUrl, {
        headers: {
          'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
        },
      });

      if (!publicResponse.ok) {
        return res.status(500).json({
          success: false,
          error: `Failed to fetch Reddit post: ${publicResponse.status}`,
        });
      }

      const publicData = await publicResponse.json() as any[];
      if (!publicData || publicData.length === 0 || !publicData[0]?.data?.children?.[0]?.data) {
        return res.status(404).json({
          success: false,
          error: 'Post not found',
        });
      }

      const postData = publicData[0].data.children[0].data;
      
      // HTML에서 텍스트 추출 헬퍼 함수
      function extractTextFromHtml(html: string): string {
        if (!html) return '';
        return html
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
      }

      // 게시물 내용 추출
      let content = '';
      if (postData.selftext && 
          postData.selftext.trim() !== '' && 
          postData.selftext !== '[removed]' && 
          postData.selftext !== '[deleted]') {
        content = postData.selftext;
      } else if (postData.selftext_html) {
        content = extractTextFromHtml(postData.selftext_html);
      }

      return res.status(200).json({
        success: true,
        content: content,
        title: postData.title || '',
        upvotes: postData.ups || 0,
      });
    }

    const data = await response.json() as any[];
    if (!data || data.length === 0 || !data[0]?.data?.children?.[0]?.data) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const postData = data[0].data.children[0].data;

    // HTML에서 텍스트 추출 헬퍼 함수
    function extractTextFromHtml(html: string): string {
      if (!html) return '';
      return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    }

    // 게시물 내용 추출
    let content = '';
    if (postData.selftext && 
        postData.selftext.trim() !== '' && 
        postData.selftext !== '[removed]' && 
        postData.selftext !== '[deleted]') {
      content = postData.selftext;
    } else if (postData.selftext_html) {
      content = extractTextFromHtml(postData.selftext_html);
    }

    return res.status(200).json({
      success: true,
      content: content,
      title: postData.title || '',
      upvotes: postData.ups || 0,
    });
  } catch (error) {
    console.error('Error fetching Reddit post:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
