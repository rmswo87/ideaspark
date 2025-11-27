// 무료 번역 API (Google Translate 또는 Papago)
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

  try {
    // Google Translate API 사용 (무료 티어: 월 500,000자)
    // 또는 Papago API 사용 (무료 티어: 일 10,000자)
    const provider = process.env.TRANSLATION_PROVIDER || 'libretranslate';
    
    if (provider === 'papago') {
      return await translateWithPapago(text, sourceLang, targetLang, res);
    } else if (provider === 'google') {
      return await translateWithGoogle(text, sourceLang, targetLang, res);
    } else {
      return await translateWithLibreTranslate(text, sourceLang, targetLang, res);
    }
  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
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
) {
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
      }
    );

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.translations || !data.data.translations[0]) {
      throw new Error('Invalid response from Google Translate API');
    }

    return res.status(200).json({
      translatedText: data.data.translations[0].translatedText,
      success: true,
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
) {
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
    });

    if (!response.ok) {
      throw new Error(`Papago API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.message || !data.message.result || !data.message.result.translatedText) {
      throw new Error('Invalid response from Papago API');
    }

    return res.status(200).json({
      translatedText: data.message.result.translatedText,
      success: true,
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
) {
  try {
    // LibreTranslate 공개 인스턴스 사용
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text.substring(0, 5000), // LibreTranslate는 최대 5000자
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.translatedText) {
      throw new Error('Invalid response from LibreTranslate API');
    }

    return res.status(200).json({
      translatedText: data.translatedText,
      success: true,
      provider: 'libretranslate',
    });
  } catch (error) {
    console.error('LibreTranslate error:', error);
    throw error;
  }
}
