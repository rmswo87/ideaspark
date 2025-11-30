// Imgur API를 사용한 이미지 업로드 서비스
// 무료로 사용 가능하며, 공개 URL을 즉시 제공합니다.

/**
 * Imgur API를 사용하여 이미지를 업로드하고 공개 URL을 반환합니다.
 * 
 * @param file - 업로드할 이미지 파일
 * @returns 공개 이미지 URL
 */
export async function uploadImageToImgur(file: File): Promise<string> {
  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  // 파일 크기 제한 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
  }

  const clientId = import.meta.env.VITE_IMGUR_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Imgur API 키가 설정되지 않았습니다.\n\n' +
      '환경 변수에 VITE_IMGUR_CLIENT_ID를 추가하세요:\n' +
      '1. .env.local 파일 생성\n' +
      '2. VITE_IMGUR_CLIENT_ID=your-client-id 추가\n' +
      '3. Imgur API 키 발급: https://api.imgur.com/oauth2/addclient'
    );
  }

  // FormData 생성
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${clientId}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.data?.error || data.data?.message || '이미지 업로드에 실패했습니다.';
      throw new Error(`Imgur 업로드 실패: ${errorMessage}`);
    }

    // Imgur는 공개 URL을 즉시 제공합니다
    const imageUrl = data.data.link;

    if (!imageUrl) {
      throw new Error('이미지 URL을 받지 못했습니다.');
    }

    return imageUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('이미지 업로드 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 게시글용 이미지 업로드 (Imgur 사용)
 */
export async function uploadPostImage(file: File, userId: string): Promise<string> {
  // userId는 로깅용으로만 사용 (Imgur는 사용자별 구분 불필요)
  return uploadImageToImgur(file);
}

/**
 * 프로필 사진 업로드 (Imgur 사용)
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadImageToImgur(file);
}

