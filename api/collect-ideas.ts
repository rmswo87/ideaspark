// Vercel Edge Function: Reddit API 호출 (서버 사이드)
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
    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    // 환경 변수 디버깅 (민감한 정보는 마스킹)
    console.log('Reddit API credentials check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
    });

    if (!clientId || !clientSecret) {
      console.error('Reddit API credentials missing:', {
        REDDIT_CLIENT_ID: !!process.env.REDDIT_CLIENT_ID,
        REDDIT_CLIENT_SECRET: !!process.env.REDDIT_CLIENT_SECRET,
        VITE_REDDIT_CLIENT_ID: !!process.env.VITE_REDDIT_CLIENT_ID,
        VITE_REDDIT_CLIENT_SECRET: !!process.env.VITE_REDDIT_CLIENT_SECRET,
      });
      return res.status(500).json({ 
        error: 'Reddit API credentials not configured',
        message: 'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set in Vercel environment variables (without VITE_ prefix for server-side)'      });
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
      console.error('Failed to get access token from Reddit API:', tokenData);
      return res.status(500).json({
        success: false,
        error: 'Failed to get access token from Reddit API',
        details: 'Token response did not contain access_token'
      });
    }

    console.log('Reddit access token obtained successfully');

    // HTML에서 텍스트 추출 헬퍼 함수
    function extractTextFromHtml(html: string): string {
      if (!html) return '';
      // HTML 태그 제거
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
        // 1. url이 preview.redd.it 또는 i.redd.it인 경우 (최우선 처리)
        if (post.url) {
          const url = post.url.toLowerCase();
          if (url.includes('preview.redd.it') || url.includes('i.redd.it')) {
            // preview.redd.it 또는 i.redd.it 도메인인 경우 무조건 이미지로 간주
            console.log('Found Reddit image URL:', post.url);
            return post.url;
          }
        }

        // 2. url이 이미지 확장자로 끝나는 경우
        if (post.url) {
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
          const lowerUrl = post.url.toLowerCase();
          if (imageExtensions.some(ext => lowerUrl.endsWith(ext))) {
            console.log('Found image URL by extension:', post.url);
            return post.url;
          }
          // imgur, gfycat 등 외부 이미지 호스팅 서비스
          if (post.url.includes('imgur.com') || post.url.includes('gfycat.com') || post.url.includes('redgifs.com')) {
            console.log('Found external image URL:', post.url);
            return post.url;
          }
        }

        // 3. is_reddit_media_domain이 true인 경우 url이 이미지
        if (post.is_reddit_media_domain && post.url) {
          console.log('Found Reddit media domain image:', post.url);
          return post.url;
        }

        // 4. post_hint가 'image'인 경우 url이 이미지
        if (post.post_hint === 'image' && post.url) {
          console.log('Found image by post_hint:', post.url);
          return post.url;
        }

        // 5. preview.images에서 고해상도 이미지 추출
        if (post.preview?.images?.[0]?.source?.url) {
          // Reddit은 이미지 URL에 &amp;를 사용하므로 디코딩 필요
          let imageUrl = post.preview.images[0].source.url
            .replace(/&amp;/g, '&')
            .replace(/&amp;/g, '&'); // 이중 인코딩 방지
          // 모든 유효한 이미지 URL 반환
          if (imageUrl && imageUrl.startsWith('http')) {
            console.log('Found preview source image:', imageUrl);
            return imageUrl;
          }
        }

        // 6. preview.images의 resolutions에서 가장 큰 이미지
        if (post.preview?.images?.[0]?.resolutions?.length > 0) {
          const resolutions = post.preview.images[0].resolutions;
          const largestImage = resolutions[resolutions.length - 1];
          if (largestImage?.url) {
            let imageUrl = largestImage.url.replace(/&amp;/g, '&');
            // 모든 유효한 이미지 URL 반환
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('Found preview resolution image:', imageUrl);
              return imageUrl;
            }
          }
        }

        // 7. thumbnail이 유효한 이미지 URL인 경우 (기본 썸네일 제외)
        if (post.thumbnail && 
            post.thumbnail !== 'default' && 
            post.thumbnail !== 'self' && 
            post.thumbnail !== 'nsfw' &&
            post.thumbnail.startsWith('http')) {
          console.log('Found thumbnail image:', post.thumbnail);
          return post.thumbnail;
        }

        // 디버깅: 이미지를 찾지 못한 경우 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.log('No image found for post:', {
            url: post.url,
            post_hint: post.post_hint,
            is_reddit_media_domain: post.is_reddit_media_domain,
            has_preview: !!post.preview,
            thumbnail: post.thumbnail,
          });
        }

        return null;
      } catch (error) {
        console.error('Error extracting image URL:', error);
        return null;
      }
    }

    // 게시물 내용 추출 함수 (selftext, selftext_html 모두 확인)
    function extractPostContent(postData: any): string {
      // 1. selftext가 있고 유효한 경우 (비어있지 않고 [removed], [deleted]가 아닌 경우)
      if (postData.selftext && 
          postData.selftext.trim() !== '' && 
          postData.selftext !== '[removed]' && 
          postData.selftext !== '[deleted]') {
        return postData.selftext;
      }
      
      // 2. selftext_html이 있는 경우 HTML에서 텍스트 추출
      if (postData.selftext_html) {
        const extracted = extractTextFromHtml(postData.selftext_html);
        if (extracted && extracted.trim() !== '') {
          return extracted;
        }
      }
      
      // 3. 둘 다 없는 경우 빈 문자열 반환
      return '';
    }

    // 수집 대상 서브레딧 (webdev는 403 에러가 발생하므로 제외)
    const subreddits = ['SomebodyMakeThis', 'AppIdeas', 'Startup_Ideas', 'Entrepreneur'];
    const allPosts: any[] = [];

    // 각 서브레딧에서 게시물 수집
    for (const subreddit of subreddits) {
      try {
        const url = `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`;
        console.log(`Fetching posts from r/${subreddit}...`);
        
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
              // 내용이 없는 게시물에 대한 로깅
              if (!content || content.trim() === '') {
                console.warn(`Post with empty content from r/${subreddit}:`, {
                  id: child.data.id,
                  title: child.data.title?.substring(0, 50),
                  hasSelftext: !!child.data.selftext,
                  hasSelftextHtml: !!child.data.selftext_html,
                  selftextLength: child.data.selftext?.length || 0,
                });
              }
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
                console.log(`Collected ${posts.length} posts from r/${subreddit} (public access)`);
                allPosts.push(...posts);
              }
            }
          }
          continue;
        }

        const data = await response.json() as { data?: { children?: Array<{ data?: any }> } };
        
        console.log(`r/${subreddit} response structure:`, {
          hasData: !!data?.data,
          hasChildren: !!data?.data?.children,
          childrenLength: data?.data?.children?.length || 0,
          firstChildSample: data?.data?.children?.[0] ? {
            hasData: !!data.data.children[0].data,
            id: data.data.children[0].data?.id,
            title: data.data.children[0].data?.title?.substring(0, 50),
          } : null,
        });
        
        if (data?.data?.children && data.data.children.length > 0) {
          const posts = data.data.children
            .filter((child: { data?: any }) => {
              if (!child.data) {
                console.warn(`Skipping child without data in r/${subreddit}`);
                return false;
              }
              return true;
            })
            .map((child: { data: any }) => {
              const content = extractPostContent(child.data);
              // 내용이 없는 게시물에 대한 로깅
              if (!content || content.trim() === '') {
                console.warn(`Post with empty content from r/${subreddit}:`, {
                  id: child.data.id,
                  title: child.data.title?.substring(0, 50),
                  hasSelftext: !!child.data.selftext,
                  hasSelftextHtml: !!child.data.selftext_html,
                  selftextLength: child.data.selftext?.length || 0,
                });
              }
              return {
                redditId: child.data.id,
                title: child.data.title,
                content: content,
                subreddit: child.data.subreddit,
                author: child.data.author,
                upvotes: child.data.ups || 0,
                numComments: child.data.num_comments || 0,
                // permalink는 이미 /r/subreddit/comments/post_id/slug/ 형식으로 제공됨
                // www.reddit.com과 결합하여 완전한 URL 생성
                url: `https://www.reddit.com${child.data.permalink}`,
                createdAt: new Date(child.data.created_utc * 1000).toISOString(),
              };
            });
          
          console.log(`Collected ${posts.length} posts from r/${subreddit}`);
          if (posts.length > 0) {
            console.log(`Sample post from r/${subreddit}:`, {
              redditId: posts[0].redditId,
              title: posts[0].title.substring(0, 50),
              subreddit: posts[0].subreddit,
              contentLength: posts[0].content?.length || 0,
            });
          }
          allPosts.push(...posts);
        } else {
          console.warn(`No posts found in r/${subreddit}. Response:`, JSON.stringify(data, null, 2).substring(0, 500));
        }

        // Rate Limit 준수
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error fetching ${subreddit}:`, error);
        // 에러가 발생해도 다음 서브레딧 계속 처리
      }
    }

    console.log(`Total posts collected: ${allPosts.length}`);

    // 중복 제거
    const uniquePosts = Array.from(
      new Map(allPosts.map(post => [post.redditId, post])).values()
    );

    console.log(`Unique posts after deduplication: ${uniquePosts.length}`);

    return res.status(200).json({
      success: true,
      count: uniquePosts.length,
      ideas: uniquePosts,
    });
  } catch (error) {
    console.error('Collection error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}