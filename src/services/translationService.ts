// 번역 서비스
export interface TranslatedContent {
  title: string | null;
  content: string | null;
  translatedUrl: string;
  success: boolean;
  note?: string;
}

/**
 * Reddit 번역 페이지에서 번역된 텍스트 가져오기
 */
export async function getTranslatedContent(redditUrl: string): Promise<TranslatedContent> {
  try {
    const response = await fetch('/api/translate-reddit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: redditUrl }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
