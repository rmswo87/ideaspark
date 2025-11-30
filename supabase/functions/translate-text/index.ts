// Supabase Edge Function: 텍스트 번역 (무료 번역 API)
// GitHub Pages 배포 시 사용

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { text, sourceLang = 'en', targetLang = 'ko' } = body

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google Translate API 무료 티어: 월 500,000자
    // 안전하게 제한: 제목은 100자, 내용은 200자로 제한하여 한도 관리
    const maxLength = 300
    const textToTranslate = text.substring(0, maxLength)

    // 기본값: Google Translate (API 키가 있으면), 없으면 LibreTranslate
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY')
    const provider = apiKey ? (Deno.env.get('TRANSLATION_PROVIDER') || 'google') : 'libretranslate'
    
    if (provider === 'papago') {
      return await translateWithPapago(textToTranslate, sourceLang, targetLang, corsHeaders)
    } else if (provider === 'google') {
      return await translateWithGoogle(textToTranslate, sourceLang, targetLang, corsHeaders, apiKey!)
    } else {
      // 기본값: LibreTranslate
      return await translateWithLibreTranslate(textToTranslate, sourceLang, targetLang, corsHeaders)
    }
  } catch (error) {
    console.error('Translation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // 실패 시 원본 텍스트 반환 (에러가 아닌 성공 응답으로)
    const textToTranslate = typeof text === 'string' ? text.substring(0, 300) : ''
    return new Response(
      JSON.stringify({
        translatedText: textToTranslate,
        success: false,
        provider: 'none',
        error: errorMessage,
        note: '번역에 실패했습니다. 원본 텍스트를 표시합니다.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Google Translate API 사용
 */
async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string,
  corsHeaders: Record<string, string>,
  apiKey: string
): Promise<Response> {
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
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Google Translate API error: ${response.status} ${errorText}`)
    }

    const data = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } }
    
    if (!data.data || !data.data.translations || !data.data.translations[0] || !data.data.translations[0].translatedText) {
      throw new Error('Invalid response from Google Translate API')
    }

    const translatedText = data.data.translations[0].translatedText

    return new Response(
      JSON.stringify({
        translatedText: translatedText,
        success: true,
        provider: 'google',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Google Translate error:', error)
    // 실패 시 LibreTranslate로 폴백
    return await translateWithLibreTranslate(text, sourceLang, targetLang, corsHeaders)
  }
}

/**
 * Papago API 사용
 */
async function translateWithPapago(
  text: string,
  sourceLang: string,
  targetLang: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const clientId = Deno.env.get('PAPAGO_CLIENT_ID')
  const clientSecret = Deno.env.get('PAPAGO_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    return await translateWithLibreTranslate(text, sourceLang, targetLang, corsHeaders)
  }

  try {
    const response = await fetch('https://openapi.naver.com/v1/papago/n2mt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      body: new URLSearchParams({
        source: sourceLang === 'en' ? 'en' : sourceLang,
        target: targetLang === 'ko' ? 'ko' : targetLang,
        text: text.substring(0, 5000),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Papago API error: ${response.status} ${errorText}`)
    }

    const data = await response.json() as { message?: { result?: { translatedText?: string } } }
    
    if (!data.message || !data.message.result || !data.message.result.translatedText) {
      throw new Error('Invalid response from Papago API')
    }

    return new Response(
      JSON.stringify({
        translatedText: data.message.result.translatedText,
        success: true,
        provider: 'papago',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Papago error:', error)
    return await translateWithLibreTranslate(text, sourceLang, targetLang, corsHeaders)
  }
}

/**
 * LibreTranslate 사용 (완전 무료, 오픈소스)
 */
async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const instances = [
      'https://libretranslate.com',
      'https://translate.argosopentech.com',
    ]

    let lastError: Error | null = null

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
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.warn(`LibreTranslate instance ${instance} failed: ${response.status} ${errorText}`)
          lastError = new Error(`LibreTranslate API error: ${response.status}`)
          continue
        }

        const data = await response.json() as { translatedText?: string; error?: string }
        
        if (data.error) {
          console.warn(`LibreTranslate instance ${instance} returned error: ${data.error}`)
          lastError = new Error(data.error)
          continue
        }

        if (!data.translatedText) {
          console.warn(`LibreTranslate instance ${instance} returned invalid response`)
          lastError = new Error('Invalid response from LibreTranslate API')
          continue
        }

        // 성공
        return new Response(
          JSON.stringify({
            translatedText: data.translatedText,
            success: true,
            provider: 'libretranslate',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (instanceError) {
        console.warn(`LibreTranslate instance ${instance} failed:`, instanceError)
        lastError = instanceError instanceof Error ? instanceError : new Error('Unknown error')
        continue
      }
    }

    // 모든 인스턴스 실패
    throw lastError || new Error('All LibreTranslate instances failed')
  } catch (error) {
    console.error('LibreTranslate error:', error)
    throw error
  }
}

