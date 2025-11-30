// Reddit 번역 페이지에서 번역된 텍스트 추출
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

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Reddit 번역 URL 생성
    const redditUrl = new URL(url);
    redditUrl.searchParams.set('lang', 'ko');
    
    // Reddit 번역 페이지 가져오기
    const response = await fetch(redditUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.reddit.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit page: ${response.status}`);
    }

    const html = await response.text();
    
    // HTML에서 번역된 제목과 내용 추출
    // Reddit의 번역된 콘텐츠는 data-testid나 특정 클래스를 사용
    let translatedTitle = '';
    let translatedContent = '';

    // 제목 추출 시도 (여러 패턴 시도)
    const titlePatterns = [
      /<h1[^>]*data-testid="post-content"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<a[^>]*data-testid="post-content"[^>]*>([^<]+)<\/a>/i,
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        translatedTitle = match[1].trim();
        break;
      }
    }

    // 본문 추출 시도
    const contentPatterns = [
      /<div[^>]*data-testid="post-content"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*md[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<article[^>]*>([\s\S]*?)<\/article>/i,
    ];

    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // HTML 태그 제거
        translatedContent = match[1]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500); // 최대 500자로 제한
        if (translatedContent.length > 0) break;
      }
    }

    // JSON 데이터에서 추출 시도 (Reddit은 JSON-LD나 초기 상태에 번역 데이터 포함 가능)
    const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        // Reddit의 JSON 구조에 따라 번역된 데이터 찾기
        if (jsonData?.props?.pageProps?.post?.title) {
          translatedTitle = jsonData.props.pageProps.post.title;
        }
        if (jsonData?.props?.pageProps?.post?.selftext) {
          translatedContent = jsonData.props.pageProps.post.selftext.substring(0, 500);
        }
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
    }

    // 번역된 내용이 없으면 원본 URL만 반환
    if (!translatedTitle && !translatedContent) {
      return res.status(200).json({
        translatedUrl: redditUrl.toString(),
        title: null,
        content: null,
        success: true,
        note: '번역된 내용을 추출할 수 없습니다. 번역 페이지를 직접 확인해주세요.',
      });
    }

    return res.status(200).json({
      translatedUrl: redditUrl.toString(),
      title: translatedTitle || null,
      content: translatedContent || null,
      success: true,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    });
  }
}
