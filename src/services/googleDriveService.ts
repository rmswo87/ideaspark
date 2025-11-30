// Google Drive API를 사용한 이미지 업로드 서비스
// Google 계정의 15GB 무료 저장 공간 활용

/**
 * Google Drive API를 사용하여 이미지를 업로드하고 공개 URL을 생성합니다.
 * 
 * 참고: Google Photos API는 공개 URL을 제공하지 않으므로,
 * Google Drive API를 사용하여 이미지를 저장하고 공개 URL을 생성합니다.
 */

interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  scope: string;
}

let googleDriveConfig: GoogleDriveConfig | null = null;

/**
 * Google Drive API 초기화
 */
export function initGoogleDrive(clientId: string, apiKey: string): void {
  googleDriveConfig = {
    clientId,
    apiKey,
    scope: 'https://www.googleapis.com/auth/drive.file',
  };
}

/**
 * Google OAuth 2.0 인증
 */
export async function authenticateGoogleDrive(): Promise<string | null> {
  if (!googleDriveConfig) {
    throw new Error('Google Drive가 초기화되지 않았습니다.');
  }

  return new Promise((resolve) => {
    // Google OAuth 2.0 인증 플로우
    // gapi 라이브러리 사용 필요
    // 실제 구현은 Google API JavaScript Client Library 필요
    
    // 임시 구현 (실제로는 gapi 라이브러리 사용)
    resolve(null);
  });
}

/**
 * Google Drive에 이미지 업로드
 */
export async function uploadImageToGoogleDrive(
  file: File,
  accessToken: string
): Promise<string> {
  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
  }

  // 1. 파일 메타데이터 생성
  const metadata = {
    name: file.name,
    mimeType: file.type,
  };

  // 2. multipart 업로드
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Drive 업로드 실패: ${error.error?.message || 'Unknown error'}`);
    }

    const fileData = await response.json();
    const fileId = fileData.id;

    // 3. 파일을 공개로 설정
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    // 4. 공개 URL 반환
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('이미지 업로드 중 알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 게시글용 이미지 업로드 (Google Drive 사용)
 */
export async function uploadPostImage(file: File, _userId: string): Promise<string> {
  // 사용자 인증 필요
  const accessToken = await authenticateGoogleDrive();
  if (!accessToken) {
    throw new Error('Google Drive 인증이 필요합니다.');
  }

  return uploadImageToGoogleDrive(file, accessToken);
}

/**
 * 프로필 사진 업로드 (Google Drive 사용)
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadPostImage(file, userId);
}

