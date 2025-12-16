// Vercel Cron Job용 API 엔드포인트: 아이디어 자동 수집
// 관리자만 실행 가능 (Vercel Cron Secret으로 보호)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Vercel Cron Job은 GET 요청을 보냄
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 보안: CRON_SECRET 확인 (Vercel Cron은 Authorization 헤더에 자동으로 추가)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron job attempt:', {
      hasAuthHeader: !!authHeader,
      hasCronSecret: !!cronSecret,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false,
        error: 'Reddit API credentials not configured',
      });
    }

    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Reddit API에서 이미지 URL 추출
    function extractImageUrl(post: any): string | null {
      try {
        // 1. preview.images[0].source.url (최우선)
        if (post.preview?.images?.[0]?.source?.url) {
          let imageUrl = post.preview.images[0].source.url
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          
          if (imageUrl.includes('preview.redd.it')) {
            const convertedUrl = convertPreviewToOriginal(imageUrl);
            if (convertedUrl) return convertedUrl;
          }
          
          if (imageUrl && imageUrl.startsWith('http')) {
            return imageUrl;
          }
        }

        // 2. post.url이 직접 이미지 URL인 경우
        if (post.url) {
          if (post.url.includes('preview.redd.it')) {
            const convertedUrl = convertPreviewToOriginal(post.url);
            if (convertedUrl) return convertedUrl;
          }
          
          if (post.url.includes('i.redd.it')) {
            return post.url;
          }
          
          const urlLower = post.url.toLowerCase();
          const urlWithoutQuery = urlLower.split('?')[0];
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
          if (imageExtensions.some(ext => urlWithoutQuery.endsWith(ext))) {
            return post.url;
          }
          
          if (post.url.includes('imgur.com') || post.url.includes('gfycat.com') || 
              post.url.includes('redgifs.com') || post.url.includes('i.imgur.com') || 
              post.url.includes('media.giphy.com')) {
            return post.url;
          }
        }

        // 3. is_reddit_media_domain이 true인 경우
        if (post.is_reddit_media_domain && post.url) {
          return post.url;
        }

        // 4. post_hint가 'image'인 경우
        if (post.post_hint === 'image' && post.url) {
          return post.url;
        }

        return null;
      } catch (error) {
        console.error('Error extracting image URL:', error);
        return null;
      }
    }

    // preview.redd.it URL을 i.redd.it 원본 URL로 변환
    function convertPreviewToOriginal(previewUrl: string): string | null {
      try {
        const match = previewUrl.match(/preview\.redd\.it\/([^?]+)/);
        if (!match || !match[1]) return null;
        
        const filename = match[1];
        const v0Pattern = filename.match(/v0-([a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp))/i);
        if (v0Pattern && v0Pattern[1]) {
          return `https://i.redd.it/${v0Pattern[1]}`;
        }
        
        const parts = filename.split('-');
        const lastPart = parts[parts.length - 1];
        if (lastPart && /^[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)$/i.test(lastPart)) {
          return `https://i.redd.it/${lastPart}`;
        }
        
        if (/^[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
          return `https://i.redd.it/${filename}`;
        }
        
        return null;
      } catch (error) {
        console.error('Error converting preview.redd.it URL:', error);
        return null;
      }
    }

    // 게시물 내용 추출 함수
    function extractPostContent(postData: any): string {
      if (postData.selftext && 
          postData.selftext.trim() !== '' && 
          postData.selftext !== '[removed]' && 
          postData.selftext !== '[deleted]') {
        return postData.selftext;
      }
      
      if (postData.selftext_html) {
        const extracted = extractTextFromHtml(postData.selftext_html);
        if (extracted && extracted.trim() !== '') {
          return extracted;
        }
      }
      
      return '';
    }

    // 수집 대상 서브레딧
    const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur'];
    const allPosts: any[] = [];

    // 각 서브레딧에서 게시물 수집
    for (const subreddit of subreddits) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`;
        console.log(`[Cron] Fetching posts from r/${subreddit}...`);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch ${subreddit}: ${response.status} - ${errorText}`);
          
          // 403 에러인 경우, 인증 없이 시도 (공개 서브레딧)
          if (response.status === 403) {
            console.log(`Trying ${subreddit} without OAuth (public access)...`);
            const publicUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
            const publicResponse = await fetch(publicUrl, {
              headers: {
                'User-Agent': 'IdeaSpark/1.0 (by /u/ideaspark)',
              },
            });
            
            if (publicResponse.ok) {
              const publicData = await publicResponse.json() as { data?: { children?: Array<{ data?: any }> } };
              if (publicData?.data?.children && publicData.data.children.length > 0) {
                const posts = publicData.data.children
                  .filter((child: { data?: any }) => child.data)
                  .map((child: { data: any }) => {
                    const content = extractPostContent(child.data);
                    return {
                      redditId: child.data.id,
                      title: child.data.title,
                      content: content,
                      subreddit: child.data.subreddit,
                      author: child.data.author,
                      upvotes: child.data.ups || 0,
                      numComments: child.data.num_comments || 0,
                      imageUrl: extractImageUrl(child.data),
                      url: `https://www.reddit.com${child.data.permalink}`,
                      createdAt: new Date(child.data.created_utc * 1000).toISOString(),
                    };
                  });
                console.log(`[Cron] Collected ${posts.length} posts from r/${subreddit} (public access)`);
                allPosts.push(...posts);
              }
            }
          }
          continue;
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        
        if (data?.data?.children && data.data.children.length > 0) {
          const posts = data.data.children
            .filter((child: { data?: any }) => child.data)
            .map((child: { data: any }) => {
              const content = extractPostContent(child.data);
              return {
                redditId: child.data.id,
                title: child.data.title,
                content: content,
                subreddit: child.data.subreddit,
                author: child.data.author,
                upvotes: child.data.ups || 0,
                numComments: child.data.num_comments || 0,
                imageUrl: extractImageUrl(child.data),
                url: `https://www.reddit.com${child.data.permalink}`,
                createdAt: new Date(child.data.created_utc * 1000).toISOString(),
              };
            });
          
          console.log(`[Cron] Collected ${posts.length} posts from r/${subreddit}`);
          allPosts.push(...posts);
        }

        // Rate Limit 준수
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Cron] Error fetching ${subreddit}:`, error);
        continue;
      }
    }

    console.log(`[Cron] Total posts collected: ${allPosts.length}`);

    // 중복 제거
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.redditId, post])).values()
    );

    console.log(`[Cron] Unique posts after deduplication: ${uniquePosts.length}`);

    // Supabase에 저장
    let savedCount = 0;
    let skippedCount = 0;

    for (const post of uniquePosts) {
      try {
        // 중복 체크 (reddit_id로)
        const { data: existing } = await supabase
          .from('ideas')
          .select('id')
          .eq('reddit_id', post.redditId)
          .maybeSingle();

        if (existing) {
          skippedCount++;
          continue;
        }

        // 카테고리 자동 분류 (간단한 키워드 기반)
        let category = 'general';
        const titleLower = post.title.toLowerCase();
        const contentLower = post.content.toLowerCase();
        const combined = `${titleLower} ${contentLower}`;

        if (combined.includes('app') || combined.includes('mobile') || combined.includes('ios') || combined.includes('android')) {
          category = 'product';
        } else if (combined.includes('design') || combined.includes('ui') || combined.includes('ux')) {
          category = 'design';
        } else if (combined.includes('business') || combined.includes('startup') || combined.includes('entrepreneur')) {
          category = 'business';
        } else if (combined.includes('learn') || combined.includes('tutorial') || combined.includes('course')) {
          category = 'education';
        } else if (combined.includes('code') || combined.includes('programming') || combined.includes('developer') || combined.includes('dev')) {
          category = 'development';
        }

        // 아이디어 저장
        const { error: insertError } = await supabase
          .from('ideas')
          .insert({
            reddit_id: post.redditId,
            title: post.title,
            content: post.content,
            subreddit: post.subreddit,
            author: post.author,
            upvotes: post.upvotes,
            num_comments: post.numComments,
            image_url: post.imageUrl,
            url: post.url,
            category: category,
            created_at: post.createdAt,
          });

        if (insertError) {
          console.error(`[Cron] Error saving post ${post.redditId}:`, insertError);
          skippedCount++;
        } else {
          savedCount++;
        }
      } catch (error) {
        console.error(`[Cron] Error processing post ${post.redditId}:`, error);
        skippedCount++;
      }
    }

    console.log(`[Cron] Saved ${savedCount} new ideas, skipped ${skippedCount} duplicates`);

    return res.status(200).json({
      success: true,
      message: 'Ideas collection completed',
      collected: uniquePosts.length,
      saved: savedCount,
      skipped: skippedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Collection error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
