import type { VercelRequest, VercelResponse } from '@vercel/node';

// 이미지 프록시 함수
// /api/image-proxy?bucket=post-images&path=userId/posts/....png
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { bucket, path } = req.query;

  if (!bucket || !path || typeof bucket !== 'string' || typeof path !== 'string') {
    res.status(400).send('Missing bucket or path');
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    res.status(500).send('Supabase URL is not configured');
    return;
  }

  const targetUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path}`;

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).send(text);
      return;
    }

    // 원본 Content-Type 유지
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    // 캐시 헤더(원하면 조정 가능)
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('Image proxy error:', error);
    res.status(500).send('Failed to proxy image');
  }
}
<<<<<<< HEAD


=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
