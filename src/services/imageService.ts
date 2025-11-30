// 이미지 업로드 서비스
// Supabase Storage 대신 Imgur API 사용 (무료, 공개 URL 즉시 제공)
import { uploadPostImage as uploadToImgur } from './imgurService';
import { supabase } from '@/lib/supabase';

// 이미지 저장소 선택 (환경 변수로 제어)
const IMAGE_STORAGE_PROVIDER = import.meta.env.VITE_IMAGE_STORAGE_PROVIDER || 'imgur'; // 'imgur' | 'supabase' | 'google-drive'

/**
 * 이미지 업로드 (게시글용)
 * Imgur API를 기본으로 사용하며, 환경 변수로 변경 가능
 */
export async function uploadPostImage(file: File, userId: string): Promise<string> {
  // Imgur API 사용 (기본값)
  if (IMAGE_STORAGE_PROVIDER === 'imgur') {
    return uploadToImgur(file, userId);
  }

  // Supabase Storage 사용 (기존 방식)
  if (IMAGE_STORAGE_PROVIDER === 'supabase') {
    return uploadPostImageToSupabase(file, userId);
  }

  // Google Drive 사용 (향후 구현)
  if (IMAGE_STORAGE_PROVIDER === 'google-drive') {
    const { uploadPostImage: uploadToGoogleDrive } = await import('./googleDriveService');
    return uploadToGoogleDrive(file, userId);
  }

  // 기본값: Imgur
  return uploadToImgur(file, userId);
}

/**
 * Supabase Storage에 이미지 업로드 (기존 방식, 선택적 사용)
 */
async function uploadPostImageToSupabase(file: File, userId: string): Promise<string> {  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/posts/${Date.now()}.${fileExt}`;

  // post-images 버킷 사용 (이미 생성되었다고 가정)
  let bucketName = 'post-images';
  let { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  // 버킷이 없으면 avatars 버킷 시도 (fallback)
  if (error && (error.message.includes('Bucket not found') || error.message.includes('not found'))) {
    bucketName = 'avatars';
    const result = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    data = result.data;
    error = result.error;
  }

  // avatars도 없으면 profiles 버킷 시도 (fallback)
  if (error && (error.message.includes('Bucket not found') || error.message.includes('not found'))) {
    bucketName = 'profiles';
    const result = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });
    data = result.data;
    error = result.error;
  }

  if (error) {
    throw new Error(
      `이미지 업로드에 실패했습니다: ${error.message}\n\n` +
      'Supabase Dashboard에서 Storage 버킷을 확인하세요:\n' +
      '1. Storage 메뉴로 이동\n' +
      '2. post-images 또는 avatars 버킷이 있는지 확인\n' +
      '3. 없으면 "New bucket"으로 생성 (Public bucket 체크)'
    );
  }

  if (!data) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  // 실제 Supabase 퍼블릭 URL은 서버(프록시)에서만 사용하고,
  // 클라이언트에는 앱 도메인 기준 프록시 URL만 노출하여 Supabase 주소를 숨긴다.
  const path = data.path;
  const proxyBase =
    import.meta.env.VITE_IMAGE_PROXY_BASE_URL ||
    (typeof window !== 'undefined' ? `${window.location.origin}/api/image-proxy` : '/api/image-proxy');

  // 예: /api/image-proxy?bucket=post-images&path=userId/posts/....png
  const proxyUrl = `${proxyBase}?bucket=${encodeURIComponent(bucketName)}&path=${encodeURIComponent(path)}`;

  return proxyUrl;
}

/**
 * 프로필 사진 업로드
 * Imgur API를 기본으로 사용하며, 환경 변수로 변경 가능
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Imgur API 사용 (기본값)
  if (IMAGE_STORAGE_PROVIDER === 'imgur') {
    const { uploadAvatar: uploadAvatarToImgur } = await import('./imgurService');
    return uploadAvatarToImgur(file, userId);
  }

  // Supabase Storage 사용 (기존 방식)
  if (IMAGE_STORAGE_PROVIDER === 'supabase') {
    return uploadAvatarToSupabase(file, userId);
  }

  // Google Drive 사용 (향후 구현)
  if (IMAGE_STORAGE_PROVIDER === 'google-drive') {
    const { uploadAvatar: uploadAvatarToGoogleDrive } = await import('./googleDriveService');
    return uploadAvatarToGoogleDrive(file, userId);
  }

  // 기본값: Imgur
  const { uploadAvatar: uploadAvatarToImgur } = await import('./imgurService');
  return uploadAvatarToImgur(file, userId);
}

/**
 * Supabase Storage에 프로필 사진 업로드 (기존 방식, 선택적 사용)
 */
async function uploadAvatarToSupabase(file: File, userId: string): Promise<string> {  // 파일 유효성 검사
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드 가능합니다.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar/${Date.now()}.${fileExt}`;

  // avatars 버킷 사용 (이미 생성되었다고 가정)
  const bucketName = 'avatars';
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    // 버킷이 없으면 profiles 버킷 시도 (fallback)
    if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
      const fallbackBucketName = 'profiles';
      const fallbackResult = await supabase.storage
        .from(fallbackBucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (fallbackResult.error) {
        throw new Error(
          '프로필 사진 업로드를 위해 Supabase Storage 버킷이 필요합니다.\n\n' +
          'Supabase Dashboard에서 다음을 수행하세요:\n' +
          '1. Storage 메뉴로 이동\n' +
          '2. "New bucket" 클릭\n' +
          '3. 이름: avatars (또는 profiles)\n' +
          '4. "Public bucket" 체크\n' +
          '5. 생성 후 다시 시도하세요.'
        );
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(fallbackBucketName)
        .getPublicUrl(fallbackResult.data.path);
      return publicUrl;
    }
    
    throw new Error(
      `프로필 사진 업로드에 실패했습니다: ${error.message}`
    );
  }

  if (!data) {
    throw new Error('프로필 사진 업로드에 실패했습니다.');
  }

  // Public URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrl;
}

