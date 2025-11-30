# 🔧 OAuth 문제 해결 가이드

**작성일**: 2025년 1월 30일  
**목적**: OAuth 설정 중 발생하는 일반적인 문제 해결

---

## ❌ 에러: `redirect_uri_mismatch` (400 오류)

### 증상
```
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
400 오류: redirect_uri_mismatch
```

### 원인
Google Cloud Console에 등록한 **리디렉션 URI**와 실제 요청하는 URI가 **정확히 일치하지 않음**

---

## ✅ 해결 방법

### 1단계: Supabase의 실제 Callback URL 확인

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** 이동
4. **Google** Provider 클릭
5. **"Callback URL (for OAuth)"** 필드의 URL 복사
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **이 URL을 정확히 복사하세요!**

---

### 2단계: Google Cloud Console에서 리디렉션 URI 확인 및 수정

1. **[Google Cloud Console](https://console.cloud.google.com/)** 접속
2. 프로젝트 선택
3. **"API 및 서비스"** > **"사용자 인증 정보"** 이동
4. 생성한 **OAuth 2.0 클라이언트 ID** 클릭
5. **"승인된 리디렉션 URI"** 섹션 확인

#### 문제 발견 시:

**기존 URI가 다른 경우:**
- 잘못된 URI 삭제
- **"+ URI 추가"** 클릭
- Supabase에서 복사한 정확한 URL 붙여넣기:
  ```
  https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
  ```
- **"저장"** 클릭

#### 확인 사항:
- ✅ URL 끝에 `/` (슬래시)가 없는지 확인
- ✅ `http://`가 아닌 `https://`인지 확인
- ✅ 프로젝트 참조 ID가 정확한지 확인 (`djxiousdavdwwznufpzs`)
- ✅ `/auth/v1/callback` 경로가 정확한지 확인

---

### 3단계: 변경사항 적용 대기

Google Cloud Console에서 변경한 리디렉션 URI는 **즉시 적용**되지만, 때로는 **1-2분** 정도 걸릴 수 있습니다.

---

### 4단계: 다시 테스트

1. 애플리케이션의 `/auth` 페이지 접속
2. **"Google로 계속하기"** 클릭
3. 정상적으로 Google 로그인 화면으로 이동하는지 확인

---

## 🔍 추가 확인 사항

### Google Cloud Console 설정 확인

1. **OAuth 동의 화면** 설정 확인:
   - **"API 및 서비스"** > **"OAuth 동의 화면"**
   - **"앱 게시 상태"**: 테스트 중 또는 프로덕션
   - **"테스트 사용자"**: 본인 이메일 추가 (테스트 중인 경우)

2. **OAuth 클라이언트 ID** 확인:
   - **"API 및 서비스"** > **"사용자 인증 정보"**
   - 클라이언트 ID가 활성화되어 있는지 확인
   - **"승인된 리디렉션 URI"**에 정확한 URL이 있는지 확인

### Supabase 설정 확인

1. **Authentication** > **Providers** > **Google**
2. **Client ID**가 정확히 입력되어 있는지 확인
3. **Client Secret**이 정확히 입력되어 있는지 확인
4. **"GitHub enabled"** 토글이 **ON**인지 확인
5. **"Callback URL"**이 표시된 URL과 Google Cloud Console의 URI가 일치하는지 확인

---

## 📋 체크리스트

### Google Cloud Console
- [ ] OAuth 동의 화면 설정 완료
- [ ] OAuth 클라이언트 ID 생성 완료
- [ ] 승인된 리디렉션 URI에 정확한 URL 등록:
  ```
  https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
  ```
- [ ] URL에 슬래시(`/`)가 끝에 없음
- [ ] `https://` 프로토콜 사용 (http 아님)
- [ ] 프로젝트 참조 ID 정확함

### Supabase Dashboard
- [ ] Google Provider 활성화됨 (토글 ON)
- [ ] Client ID 정확히 입력됨
- [ ] Client Secret 정확히 입력됨
- [ ] Callback URL 확인됨

---

## 🚨 다른 일반적인 에러

### 에러: `invalid_client`
- **원인**: Client ID 또는 Client Secret이 잘못됨
- **해결**: Google Cloud Console에서 다시 복사하여 Supabase에 정확히 입력

### 에러: `access_denied`
- **원인**: 사용자가 로그인을 취소함
- **해결**: 정상적인 동작, 사용자가 다시 시도하면 됨

### 에러: `provider is not enabled`
- **원인**: Supabase에서 Provider가 활성화되지 않음
- **해결**: Supabase Dashboard > Authentication > Providers에서 토글 ON

---

## 💡 팁

1. **리디렉션 URI는 정확히 일치해야 합니다**
   - 대소문자 구분
   - 슬래시(`/`) 위치 정확
   - 프로토콜(`https://`) 정확

2. **변경사항 적용 시간**
   - Google Cloud Console: 즉시 또는 1-2분
   - Supabase: 즉시

3. **테스트 환경**
   - 로컬 개발: `http://localhost:5173`
   - 프로덕션: 실제 도메인
   - 리디렉션 URI는 항상 Supabase의 callback URL 사용

---

## 📚 참고 링크

- [Google OAuth 2.0 설정 가이드](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Supabase Auth OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

