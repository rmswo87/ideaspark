// 번역 서비스 (무료 번역 API 사용)
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
    const response = await fetch('/api/translate-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        sourceLang: sourceLang,
        targetLang: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    // success가 false여도 translatedText가 있으면 사용 (원본 텍스트일 수 있음)
    if (data.translatedText) {
      // 실제로 번역되었는지 확인 (원본과 다르면 번역된 것)
      if (data.success === true) {
        return data.translatedText;
      } else {
        // success가 false지만 translatedText가 있으면 원본 텍스트를 반환한 것
        // 원본과 비교해서 다르면 번역된 것으로 간주
        return data.translatedText !== text ? data.translatedText : text;
      }
    } else {
      throw new Error('Translation failed: No translated text');
    }
  } catch (error) {
    console.error('Translation service error:', error);
    // 실패 시 원본 텍스트 반환
    return text;
  }
}

/**
 * Reddit 아이디어의 제목과 내용 번역
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

    // 제목과 내용을 병렬로 번역
    const [translatedTitleResult, translatedContentResult] = await Promise.allSettled([
      translateText(title, 'en', 'ko'),
      translateText(content, 'en', 'ko'),
    ]);

    // 번역 결과 처리
    // 원본과 다르면 번역된 것으로 간주
    const translatedTitle = translatedTitleResult.status === 'fulfilled' 
      ? (translatedTitleResult.value !== title && translatedTitleResult.value.trim() !== title.trim() 
          ? translatedTitleResult.value 
          : null)
      : null;
    
    const translatedContent = translatedContentResult.status === 'fulfilled'
      ? (translatedContentResult.value !== content && translatedContentResult.value.trim() !== content.trim()
          ? translatedContentResult.value 
          : null)
      : null;

    // 하나라도 번역 성공하면 success로 처리
    const success = translatedTitle !== null || translatedContent !== null;
    
    // 디버깅을 위한 로그
    if (!success) {
      console.warn('Translation failed for:', {
        title: title.substring(0, 50),
        content: content.substring(0, 50),
        titleResult: translatedTitleResult.status,
        contentResult: translatedContentResult.status,
      });
    }

    return {
      title: translatedTitle,
      content: translatedContent,
      translatedUrl: translatedUrl,
      success: success,
      note: success ? undefined : '번역을 불러올 수 없습니다. 원문을 표시합니다.',
    };
  } catch (error) {
    console.error('Translation service error:', error);
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
