# Pixel 4a 활용 무한 저화질 이미지/영상 스토리지 구현 가이드

**작성일**: 2025년 1월 30일  
**목적**: Google Pixel 4a의 무한 고품질(High Quality) 저장 혜택을 활용하여 웹 애플리케이션의 이미지/영상 스토리지 구축  
**대상**: IdeaSpark 프로젝트

---

## 📱 Pixel 4a Google Photos 혜택 확인

### 현재 상태
- **Pixel 4a**: 2020년 8월 출시
- **Google Photos 정책**: 2021년 6월 1일부터 무제한 저장 종료
- **Pixel 4a 혜택**: 
  - ✅ **고품질(High Quality) 무제한 저장 가능** (원본화질은 아님)
  - ⚠️ 고품질은 압축되지만 대부분의 경우 시각적 차이 없음
  - ⚠️ 영상도 고품질로 무제한 저장 가능

### 확인 방법
1. Pixel 4a에서 Google Photos 앱 열기
2. 설정 → 백업 → 저장 공간 확인
3. "고품질 무제한" 표시 여부 확인

---

## 🎯 구현 목표

### 목표
Pixel 4a를 중간 서버로 활용하여 웹 애플리케이션에서 업로드된 이미지/영상을 자동으로 Google Photos에 백업하고, 필요시 공개 URL을 제공

### 아키텍처
```
웹 애플리케이션 (IdeaSpark)
    ↓ (이미지/영상 업로드 요청)
Vercel Serverless Function
    ↓ (Pixel 4a로 전송)
Pixel 4a (항상 켜져 있음, 고정 IP 또는 DDNS)
    ↓ (Google Photos 자동 백업 - 고품질 무제한)
Google Photos (무한 저장)
    ↓ (공개 URL 생성 - Google Drive API 활용)
웹 애플리케이션에 URL 반환
```

---

## 🏗️ 구현 단계

### Phase 1: Pixel 4a Android 앱 개발 (Week 1-2)

#### Task 1.1: Android 프로젝트 설정 (Day 1-2)
**작업 내용**:
- Android Studio 프로젝트 생성
- 최소 SDK: Android 10 (API 29)
- 타겟 SDK: Android 14 (API 34)
- Kotlin 언어 사용

**필요한 권한**:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**파일 구조**:
```
PixelStorageApp/
├── app/
│   ├── src/main/
│   │   ├── java/com/ideaspark/storage/
│   │   │   ├── MainActivity.kt
│   │   │   ├── ImageReceiverService.kt
│   │   │   ├── GooglePhotosUploader.kt
│   │   │   └── NetworkServer.kt
│   │   └── res/
│   └── build.gradle
└── build.gradle
```

#### Task 1.2: HTTP 서버 구현 (Day 3-4)
**목적**: 웹 애플리케이션에서 이미지/영상을 받을 수 있는 HTTP 서버

**기술 스택**:
- NanoHTTPD (경량 HTTP 서버 라이브러리)

**구현 내용**:
```kotlin
// NetworkServer.kt
import fi.iki.elonen.NanoHTTPD

class NetworkServer(port: Int) : NanoHTTPD(port) {
    override fun serve(session: IHTTPSession): Response {
        when (session.uri) {
            "/upload" -> {
                // 이미지/영상 파일 수신
                val files = session.parms
                val imageData = session.inputStream.readBytes()
                // 로컬 저장소에 저장
                val file = saveToLocalStorage(imageData)
                // Google Photos에 업로드
                val photoId = uploadToGooglePhotos(file)
                // 공개 URL 생성 및 반환
                val publicUrl = createPublicUrl(photoId)
                return newFixedLengthResponse(Response.Status.OK, "application/json", 
                    """{"url": "$publicUrl", "photoId": "$photoId"}""")
            }
            "/health" -> {
                return newFixedLengthResponse(Response.Status.OK, "text/plain", "OK")
            }
        }
        return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not Found")
    }
}
```

**의존성 추가** (`build.gradle`):
```gradle
dependencies {
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
}
```

#### Task 1.3: Google Photos API 연동 (Day 5-7)
**목적**: 수신한 이미지/영상을 Google Photos에 자동 업로드

**필요한 설정**:
1. Google Cloud Console에서 프로젝트 생성
2. Google Photos Library API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 서비스 계정 키 생성 (선택)

**구현 내용**:
```kotlin
// GooglePhotosUploader.kt
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.photoslibrary.v1.PhotosLibrary
import com.google.api.services.photoslibrary.v1.PhotosLibraryScopes

class GooglePhotosUploader {
    private val photosLibrary: PhotosLibrary
    
    init {
        // OAuth 2.0 인증
        val credential = GoogleCredential.fromStream(
            context.assets.open("credentials.json")
        ).createScoped(PhotosLibraryScopes.all())
        
        photosLibrary = PhotosLibrary.Builder(
            NetHttpTransport(),
            JacksonFactory.getDefaultInstance(),
            credential
        ).setApplicationName("IdeaSpark Storage").build()
    }
    
    suspend fun uploadImage(file: File): String {
        // 1. 업로드 토큰 생성
        val uploadToken = photosLibrary.uploads()
            .upload(file.readBytes())
            .execute()
            .uploadToken
        
        // 2. 미디어 아이템 생성 (고품질로 저장)
        val newMediaItem = NewMediaItem().apply {
            description = "IdeaSpark Upload"
            simpleMediaItem = SimpleMediaItem().apply {
                uploadToken = uploadToken
            }
        }
        
        val batchCreateRequest = BatchCreateMediaItemsRequest().apply {
            albumId = null // 루트에 저장
            newMediaItems = listOf(newMediaItem)
        }
        
        val response = photosLibrary.mediaItems()
            .batchCreate(batchCreateRequest)
            .execute()
        
        return response.newMediaItemResults[0].mediaItem.id
    }
}
```

**의존성 추가**:
```gradle
dependencies {
    implementation 'com.google.apis:google-api-services-photoslibrary:v1-rev20230620-2.0.0'
    implementation 'com.google.api-client:google-api-client-android:2.2.0'
}
```

#### Task 1.4: 공개 URL 생성 (Day 8-9)
**문제**: Google Photos API는 공개 URL을 직접 제공하지 않음

**해결책**: Google Drive API를 활용하여 공개 URL 생성

**구현 내용**:
```kotlin
// GoogleDriveUrlGenerator.kt
import com.google.api.services.drive.Drive
import com.google.api.services.drive.model.File

class GoogleDriveUrlGenerator {
    private val drive: Drive
    
    suspend fun createPublicUrl(photoId: String): String {
        // 1. Google Photos에서 미디어 아이템 가져오기
        val mediaItem = photosLibrary.mediaItems().get(photoId).execute()
        
        // 2. Google Drive에 파일 복사
        val driveFile = File().apply {
            name = mediaItem.filename
            mimeType = mediaItem.mimeType
        }
        
        val copiedFile = drive.files().create(driveFile)
            .setFields("id, webViewLink")
            .execute()
        
        // 3. 공개 권한 설정
        val permission = Permission().apply {
            type = "anyone"
            role = "reader"
        }
        drive.permissions().create(copiedFile.id, permission).execute()
        
        // 4. 공개 URL 반환
        return copiedFile.webViewLink
    }
}
```

#### Task 1.5: 백그라운드 서비스 구현 (Day 10-12)
**목적**: 앱이 백그라운드에서도 작동하도록 Foreground Service 구현

**구현 내용**:
```kotlin
// ImageReceiverService.kt
import android.app.Service
import android.content.Intent
import android.os.IBinder

class ImageReceiverService : Service() {
    private lateinit var server: NetworkServer
    
    override fun onCreate() {
        super.onCreate()
        // Foreground Service로 시작
        startForeground(
            NOTIFICATION_ID,
            createNotification("이미지 수신 서버 실행 중")
        )
        
        // HTTP 서버 시작
        server = NetworkServer(8080)
        server.start()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        server.stop()
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
}
```

**AndroidManifest.xml**:
```xml
<service
    android:name=".ImageReceiverService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="dataSync" />
```

#### Task 1.6: 네트워크 설정 (Day 13-14)
**목적**: Pixel 4a의 고정 IP 또는 DDNS 설정

**옵션 1: 고정 IP (로컬 네트워크)**
- 라우터에서 Pixel 4a에 고정 IP 할당
- 예: `192.168.0.100:8080`

**옵션 2: DDNS (외부 접근)**
- No-IP, DuckDNS 등 DDNS 서비스 사용
- 예: `ideaspark-storage.ddns.net:8080`

**옵션 3: ngrok (개발/테스트)**
- ngrok으로 터널 생성
- 예: `https://abc123.ngrok.io`

---

### Phase 2: Vercel Serverless Function 연동 (Week 3)

#### Task 2.1: 이미지 프록시 함수 수정 (Day 1-2)
**파일**: `api/image-proxy.ts` 수정

**기능 추가**:
- Pixel 4a로 이미지 전송 옵션 추가
- 환경 변수로 Pixel 4a URL 설정

**구현 내용**:
```typescript
// api/image-proxy.ts (수정)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { bucket, path, usePixel } = req.query;
  
  // Pixel 4a 사용 옵션
  if (usePixel === 'true') {
    const pixelUrl = process.env.PIXEL_4A_URL; // 예: http://192.168.0.100:8080
    const imageFile = await fetchSupabaseImage(bucket, path);
    
    // Pixel 4a로 전송
    const response = await fetch(`${pixelUrl}/upload`, {
      method: 'POST',
      body: imageFile,
      headers: { 'Content-Type': 'image/jpeg' }
    });
    
    const { url } = await response.json();
    return res.redirect(302, url);
  }
  
  // 기존 로직 (Supabase 직접 접근)
  // ...
}
```

#### Task 2.2: 이미지 업로드 서비스 수정 (Day 3-4)
**파일**: `src/services/imageService.ts` 수정

**기능 추가**:
- Pixel 4a 사용 옵션 추가
- 환경 변수로 제어

**구현 내용**:
```typescript
// src/services/imageService.ts (수정)
const USE_PIXEL_STORAGE = import.meta.env.VITE_USE_PIXEL_STORAGE === 'true';

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  if (USE_PIXEL_STORAGE) {
    // Pixel 4a로 전송
    const pixelUrl = import.meta.env.VITE_PIXEL_4A_URL;
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${pixelUrl}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const { url } = await response.json();
    return url;
  }
  
  // 기존 로직 (Imgur/Supabase)
  // ...
}
```

#### Task 2.3: 환경 변수 설정 (Day 5)
**Vercel 환경 변수**:
```env
PIXEL_4A_URL=http://192.168.0.100:8080
# 또는
PIXEL_4A_URL=https://ideaspark-storage.ddns.net:8080
```

**클라이언트 환경 변수** (`.env.local`):
```env
VITE_USE_PIXEL_STORAGE=true
VITE_PIXEL_4A_URL=http://192.168.0.100:8080
```

---

### Phase 3: 테스트 및 최적화 (Week 4)

#### Task 3.1: 기능 테스트 (Day 1-3)
**테스트 항목**:
- 이미지 업로드 → Pixel 4a 수신 → Google Photos 업로드
- 공개 URL 생성 및 반환
- 에러 처리 (네트워크 오류, 인증 실패 등)
- 백그라운드 서비스 안정성

#### Task 3.2: 성능 최적화 (Day 4-5)
**최적화 항목**:
- 이미지 압축 (업로드 전)
- 배치 업로드 (여러 이미지 한 번에)
- 캐싱 (공개 URL 캐시)
- 재시도 로직 (실패 시 자동 재시도)

#### Task 3.3: 모니터링 및 로깅 (Day 6-7)
**구현 내용**:
- 업로드 성공/실패 로그
- 성능 메트릭 (업로드 시간, 파일 크기)
- 에러 알림 (이메일 또는 푸시 알림)

---

## 🔧 기술 스택

### Android 앱
- **언어**: Kotlin
- **최소 SDK**: Android 10 (API 29)
- **HTTP 서버**: NanoHTTPD
- **Google APIs**: 
  - Google Photos Library API
  - Google Drive API
- **인증**: OAuth 2.0

### 서버 (Vercel)
- **Serverless Function**: TypeScript
- **이미지 처리**: Sharp (선택)

### 클라이언트 (React)
- **이미지 업로드**: FormData
- **에러 처리**: try-catch

---

## 📋 필수 설정

### 1. Google Cloud Console 설정
1. 프로젝트 생성
2. Google Photos Library API 활성화
3. Google Drive API 활성화
4. OAuth 2.0 클라이언트 ID 생성
5. 서비스 계정 키 생성 (선택)

### 2. Pixel 4a 설정
1. 개발자 옵션 활성화
2. USB 디버깅 활성화
3. 항상 켜두기 (전원 관리 최적화 해제)
4. Wi-Fi 항상 연결 유지

### 3. 네트워크 설정
1. 라우터에서 고정 IP 할당 (또는 DDNS 설정)
2. 포트 포워딩 (8080 포트)
3. 방화벽 규칙 설정

---

## ⚠️ 주의사항 및 제약사항

### 1. Google Photos API 제약사항
- **공개 URL 미제공**: Google Photos API는 공개 URL을 직접 제공하지 않음
- **해결책**: Google Drive API를 활용하여 공개 URL 생성

### 2. 네트워크 보안
- **HTTPS 권장**: 외부 접근 시 HTTPS 사용 (Let's Encrypt)
- **인증 추가**: API 키 또는 토큰 기반 인증
- **방화벽 설정**: 특정 IP만 접근 허용

### 3. Pixel 4a 유지보수
- **항상 켜두기**: 서비스 작동을 위해 항상 켜두어야 함
- **전원 관리**: 배터리 최적화 해제
- **네트워크 안정성**: Wi-Fi 연결 안정성 중요

### 4. 성능 고려사항
- **업로드 시간**: Google Photos 업로드 시간 고려 (네트워크 속도에 따라)
- **동시 업로드**: 여러 요청 동시 처리 시 성능 저하 가능
- **캐싱**: 공개 URL 캐싱으로 반복 요청 최소화

---

## 🎯 사용 시나리오

### 시나리오 1: 이미지 업로드
1. 사용자가 커뮤니티 게시글에 이미지 업로드
2. 웹 애플리케이션 → Vercel Serverless Function
3. Vercel → Pixel 4a HTTP 서버
4. Pixel 4a → Google Photos (고품질 무제한 저장)
5. Pixel 4a → Google Drive (공개 URL 생성)
6. 공개 URL 반환 → 웹 애플리케이션

### 시나리오 2: 영상 업로드
1. 사용자가 게시글에 영상 업로드
2. 동일한 플로우 (이미지와 동일)
3. Google Photos에서 영상도 고품질로 무제한 저장

---

## 📊 예상 비용

### 무료
- ✅ Google Photos 고품질 무제한 저장 (Pixel 4a 혜택)
- ✅ Google Drive 15GB 무료 저장 (공개 URL 생성용)
- ✅ Vercel Serverless Functions 무료 티어

### 유료 (선택)
- DDNS 서비스: 월 $1-5 (외부 접근 필요 시)
- 도메인: 연 $10-15 (HTTPS 인증서 포함)

---

## 🔄 대안 및 폴백

### 대안 1: Imgur API (현재 사용 중)
- **장점**: 즉시 공개 URL 제공, 구현 간단
- **단점**: 일일 1,250장 제한

### 대안 2: Supabase Storage
- **장점**: 프로젝트와 통합, 관리 용이
- **단점**: 저장 공간 제한 (무료 티어)

### 하이브리드 방식 (권장)
- **기본**: Imgur API (즉시 사용)
- **백업**: Pixel 4a → Google Photos (장기 보관)
- **선택**: 환경 변수로 전환 가능

---

## 📝 구현 체크리스트

### Phase 1: Android 앱 개발
- [ ] Android 프로젝트 생성
- [ ] HTTP 서버 구현 (NanoHTTPD)
- [ ] Google Photos API 연동
- [ ] Google Drive API 연동 (공개 URL 생성)
- [ ] 백그라운드 서비스 구현
- [ ] 네트워크 설정 (고정 IP/DDNS)

### Phase 2: Vercel 연동
- [ ] 이미지 프록시 함수 수정
- [ ] 이미지 업로드 서비스 수정
- [ ] 환경 변수 설정

### Phase 3: 테스트 및 최적화
- [ ] 기능 테스트
- [ ] 성능 최적화
- [ ] 모니터링 및 로깅

---

## 🚀 다음 단계

1. **Pixel 4a Google Photos 혜택 확인**
   - 앱에서 "고품질 무제한" 확인

2. **Android 앱 개발 시작**
   - Android Studio 프로젝트 생성
   - Phase 1 Task 1.1부터 순차 진행

3. **테스트 환경 구축**
   - 로컬 네트워크에서 테스트
   - ngrok으로 외부 접근 테스트

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일  
**참고 문서**: `PIXEL_4A_4XL_IMAGE_STORAGE_DESIGN.md`

