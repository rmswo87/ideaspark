// 무료 번역 API (LibreTranslate, Google Translate, 또는 Papago)
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

  const { text, sourceLang = 'en', targetLang = 'ko' } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  // 텍스트가 너무 길면 잘라내기 (5000자 제한)
  const textToTranslate = text.substring(0, 5000);

  try {
    // 기본값: LibreTranslate (완전 무료)
    // 환경변수로 provider 설정 가능: 'libretranslate', 'google', 'papago'
    const provider = process.env.TRANSLATION_PROVIDER || 'libretranslate';
    
    if (provider === 'papago') {
      return await translateWithPapago(textToTranslate, sourceLang, targetLang, res);
    } else if (provider === 'google') {
      return await translateWithGoogle(textToTranslate, sourceLang, targetLang, res);
    } else {
      // 기본값: LibreTranslate
      return await translateWithLibreTranslate(textToTranslate, sourceLang, targetLang, res);
    }
  } catch (error) {
    console.error('Translation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translation error details:', {
      message: errorMessage,
      textLength: textToTranslate.length,
      sourceLang,
      targetLang,
    });
    
    // 실패 시 원본 텍스트 반환 (에러가 아닌 성공 응답으로)
    return res.status(200).json({
      translatedText: textToTranslate,
      success: false,
      provider: 'none',
      error: errorMessage,
      note: '번역에 실패했습니다. 원본 텍스트를 표시합니다.',
    });
  }
}

/**
 * Google Translate API 사용 (무료 티어: 월 500,000자)
 */
async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string,
  res: VercelResponse
): Promise<VercelResponse> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    // API 키가 없으면 LibreTranslate 사용 (완전 무료)
    return await translateWithLibreTranslate(text, sourceLang, targetLang, res);
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Google Translate API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
    
    if (!data.data || !data.data.translations || !data.data.translations[0] || !data.data.translations[0].translatedText) {
      throw new Error('Invalid response from Google Translate API');
    }

    return res.status(200).json({
      translatedText: data.data.translations[0].translatedText,
      success: true,
      provider: 'google',
    });
  } catch (error) {
    console.error('Google Translate error:', error);
    // 실패 시 LibreTranslate로 폴백
    return await translateWithLibreTranslate(text, sourceLang, targetLang, res);
  }
}

/**
 * Papago API 사용 (무료 티어: 일 10,000자)
 */
async function translateWithPapago(
  text: string,
  sourceLang: string,
  targetLang: string,
  res: VercelResponse
): Promise<VercelResponse> {
  const clientId = process.env.PAPAGO_CLIENT_ID;
  const clientSecret = process.env.PAPAGO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // API 키가 없으면 LibreTranslate 사용
    return await translateWithLibreTranslate(text, sourceLang, targetLang, res);
  }

  try {
    // Papago 언어 코드 변환
    const papagoSourceLang = sourceLang === 'en' ? 'en' : sourceLang;
    const papagoTargetLang = targetLang === 'ko' ? 'ko' : targetLang;

    const response = await fetch('https://openapi.naver.com/v1/papago/n2mt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: new URLSearchParams({
        source: papagoSourceLang,
        target: papagoTargetLang,
        text: text.substring(0, 5000), // Papago는 최대 5000자
      }),
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Papago API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as { message?: { result?: { translatedText?: string } } };
    
    if (!data.message || !data.message.result || !data.message.result.translatedText) {
      throw new Error('Invalid response from Papago API');
    }

    return res.status(200).json({
      translatedText: data.message.result.translatedText,
      success: true,
      provider: 'papago',
    });
  } catch (error) {
    console.error('Papago error:', error);
    // 실패 시 LibreTranslate로 폴백
    return await translateWithLibreTranslate(text, sourceLang, targetLang, res);
  }
}

/**
 * LibreTranslate 사용 (완전 무료, 오픈소스)
 * 공개 인스턴스 사용: https://libretranslate.com
 */
async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
  res: VercelResponse
): Promise<VercelResponse> {
  try {
    // LibreTranslate 공개 인스턴스 사용
    // 여러 인스턴스 시도 (rate limit 대비)
    const instances = [
      'https://libretranslate.com',
      'https://translate.argosopentech.com',
    ];

    let lastError: Error | null = null;

    for (const instance of instances) {
      try {
        const response = await fetch(`${instance}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
          }),
          // 타임아웃 설정 (10초)
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.warn(`LibreTranslate instance ${instance} failed: ${response.status} ${errorText}`);
          lastError = new Error(`LibreTranslate API error: ${response.status}`);
          continue; // 다음 인스턴스 시도
        }

        const data = await response.json() as { translatedText?: string; error?: string };
        
        if (data.error) {
          console.warn(`LibreTranslate instance ${instance} returned error: ${data.error}`);
          lastError = new Error(data.error);
          continue;
        }

        if (!data.translatedText) {
          console.warn(`LibreTranslate instance ${instance} returned invalid response`);
          lastError = new Error('Invalid response from LibreTranslate API');
          continue;
        }

        // 성공
        return res.status(200).json({
          translatedText: data.translatedText,
          success: true,
          provider: 'libretranslate',
        });
      } catch (instanceError) {
        console.warn(`LibreTranslate instance ${instance} failed:`, instanceError);
        lastError = instanceError instanceof Error ? instanceError : new Error('Unknown error');
        continue; // 다음 인스턴스 시도
      }
    }

    // 모든 인스턴스 실패
    throw lastError || new Error('All LibreTranslate instances failed');
  } catch (error) {
    console.error('LibreTranslate error:', error);
    throw error;
  }
}
