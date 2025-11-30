# 🔄 OAuth 리디렉션 URL 설정 가이드

**작성일**: 2025년 1월 30일  
**목적**: OAuth 로그인 후 Supabase URL 대신 애플리케이션 도메인으로 리디렉션

---

## ⚠️ 문제

Google/GitHub 로그인 후 리디렉션 시 URL이 다음과 같이 표시됨:
```
djxiousdavdwwznufpzs.supabase.co(으)로 이동
```

이것은 사용자 경험에 좋지 않으므로 애플리케이션 도메인으로 변경해야 합니다.

---

## ✅ 해결 방법

### 1단계: Supabase Site URL 설정

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. **Settings** > **Authentication** 이동
4. **"URL Configuration"** 섹션 찾기
5. **"Site URL"** 필드에 애플리케이션 도메인 입력:
   ```
   https://ideaspark-pi.vercel.app
   ```
6. **"Redirect URLs"** 섹션에서 **"+ Add URL"** 클릭
7. 다음 URL들을 추가:
   - 프로덕션 환경:
     ```
     https://ideaspark-pi.vercel.app/**
     ```
   - 로컬 개발 환경 (선택사항):
     ```
     http://localhost:5173/**
     ```
     > 💡 로컬에서 OAuth 테스트를 하려면 이 URL도 추가해야 합니다!
   > 💡 `**`는 모든 경로를 허용합니다 (예: `/`, `/auth`, `/profile` 등)
8. **"Save"** 버튼 클릭

---

### 2단계: 코드 확인

코드에서 `redirectTo` 옵션이 올바르게 설정되어 있는지 확인:

```typescript
const redirectTo = import.meta.env.PROD 
  ? 'https://ideaspark-pi.vercel.app/'
  : `${window.location.origin}/`;

await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo,
  },
});
```

---

## ✅ 확인 방법

1. Google/GitHub 로그인 시도
2. OAuth 인증 완료 후
3. 리디렉션 URL이 `https://ideaspark-pi.vercel.app/`로 표시되는지 확인
4. Supabase URL이 표시되지 않는지 확인

---

## 🔧 문제 해결

### ⚠️ GitHub OAuth 승인 페이지에 Supabase URL이 표시되는 경우

**증상:**
GitHub OAuth 승인 페이지에서 "Authorizing will redirect to https://djxiousdavdwwznufpzs.supabase.co"라고 표시됨

**원인:**
GitHub OAuth App의 **"Homepage URL"**이 Supabase URL로 설정되어 있거나, 설정되지 않음

**해결 방법:**

1. **GitHub OAuth App 설정 수정** ⚠️ **가장 중요!**
   - GitHub > Settings > Developer settings > OAuth Apps
   - 생성한 OAuth App 클릭
   - **"Homepage URL"** 필드를 다음으로 수정:
     ```
     https://ideaspark-pi.vercel.app
     ```
     > ⚠️ **중요**: 이 URL이 GitHub 승인 페이지에 표시됩니다!
   - **"Authorization callback URL"**은 그대로 유지 (변경하지 마세요):
     ```
     https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
     ```
     > 💡 Authorization callback URL은 Supabase URL이어야 합니다 (인증 처리용)
   - **"Update application"** 클릭

2. **Supabase Site URL 재확인**
   - Supabase Dashboard > Settings > Authentication > URL Configuration
   - **"Site URL"**이 `https://ideaspark-pi.vercel.app`로 설정되어 있는지 확인
   - **"Redirect URLs"**에 `https://ideaspark-pi.vercel.app/**`가 추가되어 있는지 확인
   - **"Save"** 클릭

3. **캐시 클리어 및 재테스트**
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 테스트
   - GitHub OAuth App 설정 변경 후 1-2분 대기

---

### ⚠️ 로컬 개발 환경(localhost)에서 테스트하는 경우

**증상:**
로컬호스트(`http://localhost:5173`)에서 OAuth 로그인 시 Supabase URL로 리디렉션되거나 에러 발생

**원인:**
Supabase의 Redirect URLs에 로컬 개발 환경 URL이 추가되지 않음

**해결 방법:**

1. **Supabase Dashboard 설정 수정**
   - Supabase Dashboard > Settings > Authentication > URL Configuration
   - **"Redirect URLs"** 섹션에서 **"+ Add URL"** 클릭
   - 다음 URL 추가:
     ```
     http://localhost:5173/**
     ```
   - **"Save"** 버튼 클릭

2. **코드 확인**
   - `AuthPage.tsx`의 `redirectTo` 로직이 개발 환경을 올바르게 처리하는지 확인:
     ```typescript
     const redirectTo = import.meta.env.PROD 
       ? 'https://ideaspark-pi.vercel.app/'
       : `${window.location.origin}/`; // 로컬에서는 http://localhost:5173/
     ```

3. **테스트**
   - 로컬 개발 서버 실행 (`npm run dev`)
   - OAuth 로그인 시도
   - 로컬호스트로 정상 리디렉션되는지 확인

---

### 여전히 Supabase URL로 리디렉션되는 경우

1. **Supabase Dashboard 설정 확인**
   - Settings > Authentication > URL Configuration
   - Site URL이 정확히 입력되어 있는지 확인
   - Redirect URLs에 다음이 모두 추가되어 있는지 확인:
     - `https://ideaspark-pi.vercel.app/**` (프로덕션)
     - `http://localhost:5173/**` (로컬 개발, 선택사항)

2. **환경 확인**
   - 현재 테스트 환경이 로컬인지 프로덕션인지 확인
   - 로컬 환경에서는 `http://localhost:5173/**`가 Redirect URLs에 있어야 함
   - 프로덕션 환경에서는 `https://ideaspark-pi.vercel.app/**`가 Redirect URLs에 있어야 함

3. **캐시 클리어**
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 테스트

4. **코드 확인**
   - `AuthPage.tsx`의 `redirectTo` 값 확인
   - 프로덕션 환경 변수 확인

---

## 📝 참고

- **Site URL**: OAuth 리디렉션 후 기본적으로 이동할 URL
  - 프로덕션: `https://ideaspark-pi.vercel.app`
  - 로컬 개발: Supabase Site URL은 프로덕션 URL로 유지 (Redirect URLs로 로컬 처리)
- **Redirect URLs**: 허용된 리디렉션 URL 목록 (보안을 위해 제한)
  - 프로덕션: `https://ideaspark-pi.vercel.app/**`
  - 로컬 개발: `http://localhost:5173/**` (로컬 테스트 시 필수)
- **로컬 개발 환경에서 테스트하는 경우**: 
  - Supabase Redirect URLs에 `http://localhost:5173/**` 추가 필수
  - 코드는 자동으로 `window.location.origin`을 사용하므로 별도 수정 불필요

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

