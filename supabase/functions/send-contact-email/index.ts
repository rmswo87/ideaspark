// Supabase Edge Function: 문의 이메일 알림 전송
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ADMIN_EMAIL = "bzjay53@gmail.com";
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
const ALLOWED_ORIGINS = [
  "https://ideaspark-pi.vercel.app",
  "https://ideaspark.vercel.app",
  "http://localhost:5173",
  "https://rmswo87.github.io"
]

serve(async (req) => {
  const requestOrigin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]

  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, company, phone, subject, message } = await req.json()

    // 이메일 본문 생성
    const emailBody = `
새로운 문의가 접수되었습니다.

이름: ${name}
이메일: ${email}
${company ? `회사: ${company}\n` : ''}${phone ? `전화: ${phone}\n` : ''}
제목: ${subject}

내용:
${message}

---
IdeaSpark 문의 시스템
접수 시간: ${new Date().toLocaleString('ko-KR')}
    `.trim()

    // Resend API를 사용한 이메일 전송 (환경 변수에서 API 키 가져오기)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      // Resend API 키가 없으면 로그만 남기고 성공으로 처리
      return new Response(
        JSON.stringify({ success: true, message: 'Email notification logged (no API key)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'IdeaSpark <noreply@ideaspark.com>', // Resend에서 설정한 도메인 사용
        to: [ADMIN_EMAIL],
        subject: `[IdeaSpark 문의] ${subject}`,
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">새로운 문의가 접수되었습니다</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>이름:</strong> ${name}</p>
              <p><strong>이메일:</strong> ${email}</p>
              ${company ? `<p><strong>회사:</strong> ${company}</p>` : ''}
              ${phone ? `<p><strong>전화:</strong> ${phone}</p>` : ''}
              <p><strong>제목:</strong> ${subject}</p>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h3 style="color: #333;">문의 내용:</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              ---<br/>
              IdeaSpark 문의 시스템<br/>
              접수 시간: ${new Date().toLocaleString('ko-KR')}
            </p>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Failed to send email:', errorText)
      throw new Error(`Email sending failed: ${errorText}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully:', emailData)

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
