// Vercel Edge Function: Reddit API 호출 (서버 사이드)
// 관리자만 수집 가능
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 관리자 권한 체크
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized',
        message: '관리자만 아이디어 수집이 가능합니다.'
      });
    }

    // Supabase 클라이언트 초기화 (Service Role Key 사용)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured',
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 토큰에서 사용자 정보 추출
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: '유효하지 않은 인증 토큰입니다.'
      });
    }

    // admins 테이블에서 관리자 확인
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError || !adminData) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: '관리자만 아이디어 수집이 가능합니다.'
      });
    }

    console.log(`[Manual Collection] Admin user ${user.id} initiated idea collection`);
  } catch (authError) {
    console.error('Admin check error:', authError);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: '관리자 권한 확인 중 오류가 발생했습니다.'
    });
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

    // Reddit API에서 이미지 URL 추출 (Reddit API 공식 문서 기반)
    // 참고: https://www.reddit.com/dev/api/
    function extractImageUrl(post: any): string | null {
      try {
        // Reddit API 공식 문서에 따르면 preview.images[0].source.url이 가장 신뢰할 수 있는 이미지 URL입니다
        // 1. preview.images에서 고해상도 이미지 추출 (최우선 - Reddit API 공식 권장)
        if (post.preview?.images?.[0]) {
          const previewImage = post.preview.images[0];
          
          // source.url (가장 고해상도, Reddit API 공식 문서 권장)
          if (previewImage.source?.url) {
            let imageUrl = previewImage.source.url
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            
            // preview.redd.it URL인 경우 -> i.redd.it 원본 URL로 변환
            if (imageUrl.includes('preview.redd.it')) {
              const convertedUrl = convertPreviewToOriginal(imageUrl);
              if (convertedUrl) {
                console.log('Converted preview.redd.it to i.redd.it from preview.source.url:', convertedUrl);
                return convertedUrl;
              }
            }
            
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('Found preview source image:', imageUrl);
              return imageUrl;
            }
          }
          
          // variants (다양한 해상도)
          if (previewImage.variants?.gif?.source?.url) {
            let imageUrl = previewImage.variants.gif.source.url
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            
            if (imageUrl.includes('preview.redd.it')) {
              const convertedUrl = convertPreviewToOriginal(imageUrl);
              if (convertedUrl) {
                console.log('Converted preview.redd.it to i.redd.it from preview.variants.gif:', convertedUrl);
                return convertedUrl;
              }
            }
            
            if (imageUrl && imageUrl.startsWith('http')) {
              console.log('Found preview gif variant:', imageUrl);
              return imageUrl;
            }
          }
          
          // resolutions에서 가장 큰 이미지
          if (previewImage.resolutions?.length > 0) {
            const largestImage = previewImage.resolutions[previewImage.resolutions.length - 1];
            if (largestImage?.url) {
              let imageUrl = largestImage.url
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
              
              if (imageUrl.includes('preview.redd.it')) {
                const convertedUrl = convertPreviewToOriginal(imageUrl);
                if (convertedUrl) {
                  console.log('Converted preview.redd.it to i.redd.it from preview.resolutions:', convertedUrl);
                  return convertedUrl;
                }
              }
              
              if (imageUrl && imageUrl.startsWith('http')) {
                console.log('Found preview resolution image:', imageUrl);
                return imageUrl;
              }
            }
          }
        }

        // 2. post.url이 직접 이미지 URL인 경우
        if (post.url) {
          const url = post.url;
          const urlLower = url.toLowerCase();
          const urlWithoutQuery = urlLower.split('?')[0];
          
          // preview.redd.it URL인 경우 -> i.redd.it 원본 URL로 변환
          if (url.includes('preview.redd.it')) {
            const convertedUrl = convertPreviewToOriginal(url);
            if (convertedUrl) {
              console.log('Converted preview.redd.it to i.redd.it from post.url:', convertedUrl);
              return convertedUrl;
            }
            // 변환 실패 시 원본 URL 반환
            console.log('Failed to convert preview.redd.it URL, keeping original:', post.url);
            return post.url;
          }
          
          // i.redd.it 도메인인 경우 그대로 반환
          if (url.includes('i.redd.it')) {
            console.log('Found i.redd.it image URL:', post.url);
            return post.url;
          }
          
          // 이미지 확장자로 끝나는 경우
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
          if (imageExtensions.some(ext => urlWithoutQuery.endsWith(ext))) {
            console.log('Found image URL by extension:', post.url);
            return post.url;
          }
          
          // 외부 이미지 호스팅 서비스
          if (url.includes('imgur.com') || url.includes('gfycat.com') || url.includes('redgifs.com') || 
              url.includes('i.imgur.com') || url.includes('media.giphy.com')) {
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
        
        // 5. domain이 redd.it이고 url이 있는 경우 (Reddit 이미지 호스팅)
        if (post.url && post.url.includes('redd.it')) {
          console.log('Found redd.it image URL:', post.url);
          return post.url;
        }

        // 6. thumbnail이 유효한 이미지 URL인 경우 (기본 썸네일 제외)
        if (post.thumbnail && 
            post.thumbnail !== 'default' && 
            post.thumbnail !== 'self' && 
            post.thumbnail !== 'nsfw' &&
            post.thumbnail !== 'spoiler' &&
            post.thumbnail.startsWith('http')) {
          console.log('Found thumbnail image:', post.thumbnail);
          return post.thumbnail;
        }
        
        // 7. media 필드 확인 (Reddit API의 media 객체)
        if (post.media?.oembed?.thumbnail_url) {
          console.log('Found media oembed thumbnail:', post.media.oembed.thumbnail_url);
          return post.media.oembed.thumbnail_url;
        }
        
        if (post.media?.reddit_video?.fallback_url) {
          // 비디오인 경우 썸네일 찾기
          const thumbnailUrl = post.media.reddit_video.fallback_url.replace(/\.mp4$/, '.jpg');
          if (thumbnailUrl !== post.media.reddit_video.fallback_url) {
            console.log('Found video thumbnail:', thumbnailUrl);
            return thumbnailUrl;
          }
        }

        // 디버깅: 이미지를 찾지 못한 경우 상세 로그 출력
        console.log('No image found for post:', {
          url: post.url,
          post_hint: post.post_hint,
          is_reddit_media_domain: post.is_reddit_media_domain,
          has_preview: !!post.preview,
          preview_keys: post.preview ? Object.keys(post.preview) : [],
          thumbnail: post.thumbnail,
          has_media: !!post.media,
        });

        return null;
      } catch (error) {
        console.error('Error extracting image URL:', error);
        return null;
      }
    }

    // preview.redd.it URL을 i.redd.it 원본 URL로 변환하는 헬퍼 함수
    // Reddit API 공식 문서 기반: preview.redd.it URL은 쿼리 파라미터를 포함하지만,
    // 실제 원본 이미지는 i.redd.it에 있으며 파일명에서 이미지 ID를 추출할 수 있습니다
    function convertPreviewToOriginal(previewUrl: string): string | null {
      try {
        // preview.redd.it URL에서 파일명 추출
        // 예: https://preview.redd.it/trying-this-again-after-3-years-to-see-if-gpt-5-can-v0-2f6bfp2hjj5g1.png?width=640&crop=smart&auto=webp&s=...
        const match = previewUrl.match(/preview\.redd\.it\/([^?]+)/);
        if (!match || !match[1]) {
          return null;
        }
        
        const filename = match[1];
        console.log('Extracted filename from preview.redd.it:', filename);
        
        // 파일명에서 실제 이미지 ID 추출
        // 패턴 1: v0-{이미지ID}.{확장자} (예: v0-2f6bfp2hjj5g1.png)
        const v0Pattern = filename.match(/v0-([a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp))/i);
        if (v0Pattern && v0Pattern[1]) {
          const imageId = v0Pattern[1];
          const originalUrl = `https://i.redd.it/${imageId}`;
          console.log('Converted using v0 pattern:', originalUrl);
          return originalUrl;
        }
        
        // 패턴 2: 파일명 끝부분이 이미지 ID인 경우 (예: ...-2f6bfp2hjj5g1.png)
        // 하이픈으로 구분된 마지막 부분이 이미지 ID일 수 있음
        const parts = filename.split('-');
        const lastPart = parts[parts.length - 1];
        if (lastPart && /^[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)$/i.test(lastPart)) {
          const originalUrl = `https://i.redd.it/${lastPart}`;
          console.log('Converted using last part pattern:', originalUrl);
          return originalUrl;
        }
        
        // 패턴 3: 파일명 전체가 이미지 ID인 경우 (드물지만 가능)
        if (/^[a-zA-Z0-9]+\.(png|jpg|jpeg|gif|webp)$/i.test(filename)) {
          const originalUrl = `https://i.redd.it/${filename}`;
          console.log('Converted using full filename pattern:', originalUrl);
          return originalUrl;
        }
        
        console.log('Could not extract image ID from filename:', filename);
        return null;
      } catch (error) {
        console.error('Error converting preview.redd.it URL:', error);
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
