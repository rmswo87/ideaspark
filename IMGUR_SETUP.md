# Imgur API 이미지 저장 설정 가이드

## 🎯 개요

Supabase Storage 대신 **Imgur API**를 사용하여 이미지를 무료로 저장할 수 있습니다.

**장점:**
- ✅ 완전 무료
- ✅ 공개 URL 즉시 제공
- ✅ OAuth 인증 불필요 (API 키만으로 사용)
- ✅ 구현이 매우 간단
- ✅ Supabase Storage 할당량 절약

**단점:**
- ⚠️ 무료 계정은 일일 업로드 제한 (1,250장/일)
- ⚠️ 이미지가 공개적으로 노출됨 (삭제 불가)

## 📋 설정 방법

### 1. Imgur API 키 발급

1. [Imgur API](https://api.imgur.com/oauth2/addclient) 접속
2. **Application name**: `IdeaSpark` (또는 원하는 이름)
3. **Authorization type**: `Anonymous usage without user authorization` 선택
4. **Authorization callback URL**: `https://your-domain.com` (선택사항)
5. **Application website**: `https://your-domain.com` (선택사항)
6. **Email**: 본인 이메일
7. **Description**: `IdeaSpark 이미지 저장용` (선택사항)
8. **Submit** 클릭
9. **Client ID** 복사

### 2. 환경 변수 설정

`.env.local` 파일에 다음을 추가:

```env
# 이미지 저장소 선택 (imgur | supabase | google-drive)
VITE_IMAGE_STORAGE_PROVIDER=imgur

# Imgur API 키
VITE_IMGUR_CLIENT_ID=your-imgur-client-id-here
```

### 3. Vercel 환경 변수 설정 (배포 시)

1. Vercel Dashboard 접속
2. 프로젝트 선택 > Settings > Environment Variables
3. 다음 변수 추가:
   - `VITE_IMAGE_STORAGE_PROVIDER`: `imgur`
   - `VITE_IMGUR_CLIENT_ID`: `your-imgur-client-id-here`

## 🔄 Supabase Storage로 되돌리기

Supabase Storage를 다시 사용하려면:

```env
VITE_IMAGE_STORAGE_PROVIDER=supabase
```

또는 환경 변수를 제거하면 기본값으로 Imgur이 사용됩니다.

## 📊 사용량 제한

- **무료 계정**: 일일 1,250장 업로드 제한
- **대역폭**: 제한 없음
- **저장 공간**: 무제한

일일 제한을 초과하면 다음날까지 대기해야 합니다.

## 🔒 보안 고려사항

- Imgur에 업로드된 이미지는 **공개적으로 접근 가능**합니다.
- 이미지 URL을 알고 있으면 누구나 접근할 수 있습니다.
- 민감한 이미지는 업로드하지 마세요.

## 🚀 사용 방법

코드 변경 없이 자동으로 Imgur API를 사용합니다:

```typescript
import { uploadPostImage } from '@/services/imageService';

// 자동으로 Imgur API 사용 (환경 변수에 따라)
const imageUrl = await uploadPostImage(file, userId);
```

## 📝 참고사항

- Imgur API는 이미지 URL을 즉시 반환하므로 프록시가 필요 없습니다.
- 기존 Supabase Storage 코드는 그대로 유지되며, 환경 변수로 전환 가능합니다.
- Google Drive API는 향후 구현 예정입니다.

