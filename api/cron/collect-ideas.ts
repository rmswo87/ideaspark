// Vercel Cron Job용 API 엔드포인트
// 아이디어 수집 자동화
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 클라이언트 사이드 코드를 서버에서 실행할 수 없으므로
// 실제 구현은 Supabase Edge Function 또는 Vercel Serverless Function으로 이동 필요
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 환경변수에서 Cron Secret 확인 (보안)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // TODO: 실제 수집 로직은 Supabase Edge Function으로 이동
    // 여기서는 Supabase Edge Function을 호출하거나
    // 직접 수집 로직을 실행
    
    return res.status(200).json({ 
      success: true, 
      message: 'Collection triggered',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Collection error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

