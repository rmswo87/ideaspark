// 번역 서비스 (무료 번역 API 사용)

/**
 * API 엔드포인트 URL 가져오기
 */
function getApiUrl(endpoint: string): string {
  const provider = import.meta.env.VITE_API_PROVIDER || 'vercel';
  const baseUrl = window.location.origin;
  
  if (provider === 'supabase') {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('[TranslationService] VITE_SUPABASE_URL not set, falling back to Vercel');
      return `${baseUrl}${endpoint}`;
    }
    // Supabase Edge Functions URL 형식: https://[project].supabase.co/functions/v1/[function-name]
    return `${supabaseUrl}/functions/v1${endpoint.replace('/api/', '')}`;
  } else if (provider === 'cloudflare') {
    const workerUrl = import.meta.env.VITE_CLOUDFLARE_WORKER_URL;
    if (!workerUrl) {
      console.warn('[TranslationService] VITE_CLOUDFLARE_WORKER_URL not set, falling back to Vercel');
      return `${baseUrl}${endpoint}`;
    }
    return `${workerUrl}${endpoint}`;
  } else {
    // Vercel (기본값)
    return `${baseUrl}${endpoint}`;
  }
}

export interface TranslatedContent {
  title: string | null;
  content: string | null;
  translatedUrl: string;
  success: boolean;
  note?: string;
}

/**
 * 텍스트 번역 (Google Translate, Papago, 또는 LibreTranslate)
 * Google Translate API 무료 티어: 월 500,000자
 * 한도 관리를 위해 제목은 100자, 내용은 200자로 제한
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ko'
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // 한도 관리를 위한 텍스트 길이 제한
  // 제목: 최대 100자, 내용: 최대 200자
  const maxLength = 200; // 안전한 한도 관리
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
  }

  try {
    // API Provider에 따라 엔드포인트 선택
    const apiUrl = getApiUrl('/api/translate-text');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Supabase Edge Functions에 필요한 인증 헤더 (익명 키)
        ...(import.meta.env.VITE_API_PROVIDER === 'supabase' && import.meta.env.VITE_SUPABASE_ANON_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        })
      },
      body: JSON.stringify({
        text: text,
        sourceLang: sourceLang,
        targetLang: targetLang,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Translation API error: ${response.status}`, errorText);
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    // success가 false여도 translatedText가 있으면 사용 (원본 텍스트일 수 있음)
    if (data.translatedText) {
      // 실제로 번역되었는지 확인 (원본과 다르면 번역된 것)
      if (data.success === true) {
        // 성공 응답이면 바로 반환
        return data.translatedText;
      } else {
        // success가 false지만 translatedText가 있으면 원본 텍스트를 반환한 것일 수 있음
        // 원본과 비교해서 다르면 번역된 것으로 간주
        const isTranslated = data.translatedText !== text && 
                            data.translatedText.trim() !== text.trim() &&
                            data.translatedText.length > 0;
        if (isTranslated) {
          return data.translatedText;
        } else {
          // 번역 실패 (원본과 동일) - 조용히 원본 반환
          throw new Error('Translation returned original text');
        }
      }
    } else {
      throw new Error('Translation failed: No translated text');
    }
  } catch (error) {
    // 번역 실패는 조용히 처리 (원본 텍스트 반환)
    // 개발 환경에서만 에러 로그 출력
    if (import.meta.env.DEV) {
      console.debug('Translation failed, using original text');
    }
    // 실패 시 원본 텍스트 반환
    return text;
  }
}

/**
 * Reddit 아이디어의 제목과 내용 번역
 * 제목은 최대 100자, 내용은 최대 200자로 제한하여 한도 관리
 */
export async function getTranslatedContent(redditUrl: string, title: string, content: string): Promise<TranslatedContent> {
  try {
    // 번역 URL 생성
    let translatedUrl: string;
    try {
      const url = new URL(redditUrl);
      url.searchParams.set('lang', 'ko');
      translatedUrl = url.toString();
    } catch (error) {
      translatedUrl = redditUrl;
    }

    // 제목과 내용을 적절한 길이로 제한
    const titleToTranslate = title.substring(0, 100); // 제목은 100자
    const contentToTranslate = content.substring(0, 200); // 내용은 200자

    // 제목과 내용을 병렬로 번역
    const [translatedTitleResult, translatedContentResult] = await Promise.allSettled([
      translateText(titleToTranslate, 'en', 'ko'),
      translateText(contentToTranslate, 'en', 'ko'),
    ]);

    // 번역 결과 처리
    // 원본과 다르면 번역된 것으로 간주
    let translatedTitle: string | null = null;
    if (translatedTitleResult.status === 'fulfilled') {
      const translated = translatedTitleResult.value;
      // 원본과 다르고, 실제로 번역된 것으로 보이는 경우
      if (translated !== titleToTranslate && 
          translated.trim() !== titleToTranslate.trim() &&
          translated.length > 0) {
        translatedTitle = translated;
      }
    }
    
    let translatedContent: string | null = null;
    if (translatedContentResult.status === 'fulfilled') {
      const translated = translatedContentResult.value;
      // 원본과 다르고, 실제로 번역된 것으로 보이는 경우
      if (translated !== contentToTranslate && 
          translated.trim() !== contentToTranslate.trim() &&
          translated.length > 0) {
        translatedContent = translated;
      }
    }

    // 하나라도 번역 성공하면 success로 처리
    const success = translatedTitle !== null || translatedContent !== null;
    
    // 개발 환경에서만 로그 출력 (프로덕션에서는 조용히 처리)
    if (import.meta.env.DEV) {
      if (!success) {
        // 개발 환경에서만 번역 실패 로그 출력 (한 번만)
        console.debug('Translation unavailable, using original text');
      }
    }

    return {
      title: translatedTitle,
      content: translatedContent,
      translatedUrl: translatedUrl,
      success: success,
      note: success ? undefined : '번역을 불러올 수 없습니다. 원문을 표시합니다.',
    };
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (import.meta.env.DEV) {
      console.debug('Translation service error:', error);
    }
    // 실패 시 번역 URL만 반환
    let translatedUrl: string;
    try {
      const url = new URL(redditUrl);
      url.searchParams.set('lang', 'ko');
      translatedUrl = url.toString();
    } catch {
      translatedUrl = redditUrl;
    }
    return {
      title: null,
      content: null,
      translatedUrl: translatedUrl,
      success: false,
      note: '번역을 불러올 수 없습니다.',
    };
  }
}

