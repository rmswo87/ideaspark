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
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'ko'
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
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
    
    if (data.success && data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error('Translation failed');
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
    // 제목과 내용을 병렬로 번역
    const [translatedTitle, translatedContent] = await Promise.all([
      translateText(title, 'en', 'ko'),
      translateText(content, 'en', 'ko'),
    ]);

    // 번역 URL 생성
    const translatedUrl = new URL(redditUrl);
    translatedUrl.searchParams.set('lang', 'ko');

    return {
      title: translatedTitle !== title ? translatedTitle : null,
      content: translatedContent !== content ? translatedContent : null,
      translatedUrl: translatedUrl.toString(),
      success: true,
    };
  } catch (error) {
    console.error('Translation service error:', error);
    // 실패 시 번역 URL만 반환
    const translatedUrl = new URL(redditUrl);
    translatedUrl.searchParams.set('lang', 'ko');
    return {
      title: null,
      content: null,
      translatedUrl: translatedUrl.toString(),
      success: false,
      note: '번역을 불러올 수 없습니다.',
    };
  }
}
