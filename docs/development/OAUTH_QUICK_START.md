# 🚀 OAuth 빠른 시작 가이드

**작성일**: 2025년 1월 30일  
**목적**: Google/GitHub OAuth를 빠르게 설정하는 단계별 가이드

---

## 📋 사전 준비

### Supabase 프로젝트 정보 확인

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. **Settings** > **API** 이동
4. **Project URL** 확인:
   ```
   https://djxiousdavdwwznufpzs.supabase.co
   ```
5. **리디렉션 URI** 확인:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > 💡 이 URL을 Google과 GitHub 설정에 사용합니다!

---

## 🔵 Google OAuth 설정 (5분)

### 1. Google Cloud Console 설정

1. **[Google Cloud Console](https://console.cloud.google.com/)** 접속
2. 프로젝트 선택 또는 생성
3. **"API 및 서비스"** > **"OAuth 동의 화면"**
   - 외부 선택 → 만들기
   - 앱 이름: `IdeaSpark`
   - 사용자 지원 이메일 선택
   - 저장 후 계속 (범위, 테스트 사용자 건너뛰기)
4. **"API 및 서비스"** > **"사용자 인증 정보"**
5. **"+ 사용자 인증 정보 만들기"** > **"OAuth 클라이언트 ID"**
6. 설정:
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `IdeaSpark Web Client`
   - 승인된 리디렉션 URI: 
     ```
     https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
     ```
7. **"만들기"** 클릭
8. **클라이언트 ID**와 **클라이언트 보안 비밀번호** 복사 ⚠️

### 2. Supabase에 입력

1. Supabase Dashboard > **Authentication** > **Providers**
2. **Google** 클릭
3. **Client ID** 붙여넣기
4. **Client Secret** 붙여넣기
5. **"GitHub enabled"** 토글 **ON**
6. **"Save"** 클릭

### 3. Site URL 설정 (중요!)

1. Supabase Dashboard > **Settings** > **Authentication** > **URL Configuration**
2. **"Site URL"**을 애플리케이션 도메인으로 설정:
   ```
   https://ideaspark-pi.vercel.app
   ```
3. **"Redirect URLs"**에 다음 추가:
   ```
   https://ideaspark-pi.vercel.app/**
   ```
4. **"Save"** 클릭

> 💡 이렇게 설정하면 OAuth 리디렉션 후 Supabase URL 대신 애플리케이션 도메인이 표시됩니다!

---

## 🐙 GitHub OAuth 설정 (3분)

### 1. GitHub OAuth App 생성

1. **GitHub** > 프로필 > **Settings** > **Developer settings** > **OAuth Apps**
2. **"New OAuth App"** 클릭
3. 입력:
   - Application name: `IdeaSpark`
   - Homepage URL: `http://localhost:5173` (또는 실제 도메인)
   - Authorization callback URL:
     ```
     https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
     ```
4. **"Register application"** 클릭
5. **Client ID** 복사
6. **"Generate a new client secret"** 클릭
7. **Client secret** 복사 ⚠️ (한 번만 표시!)

### 2. Supabase에 입력

1. Supabase Dashboard > **Authentication** > **Providers**
2. **GitHub** 클릭
3. **Client ID** 붙여넣기
4. **Client Secret** 붙여넣기
5. **"GitHub enabled"** 토글 **ON**
6. **"Save"** 클릭

---

## ✅ 테스트

1. 애플리케이션의 `/auth` 페이지 접속
2. **"Google로 계속하기"** 클릭 → Google 로그인 화면으로 이동 확인
3. **"GitHub로 계속하기"** 클릭 → GitHub 로그인 화면으로 이동 확인

---

## ⚠️ 주의사항

### 리디렉션 URI 불일치 에러

**에러**: `redirect_uri_mismatch`

**해결**:
1. Google Cloud Console / GitHub에서 리디렉션 URI 확인
2. 정확히 `https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback` 형식인지 확인
3. 프로젝트 URL이 다르면 Supabase Dashboard > Settings > API에서 확인

### Provider 미활성화 에러

**에러**: `provider is not enabled`

**해결**:
1. Supabase Dashboard > Authentication > Providers
2. Google/GitHub Provider의 토글이 **ON**인지 확인
3. Client ID와 Secret이 입력되어 있는지 확인

---

## 📚 상세 가이드

더 자세한 설명이 필요하면:
- **`docs/development/OAUTH_SETUP_GUIDE.md`** 참고

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

