# ✅ OAuth 설정 완료 가이드

**작성일**: 2025년 1월 30일  
**목적**: Google/GitHub OAuth 설정을 완료하고 테스트하는 최종 가이드

---

## 📋 설정 체크리스트

### ✅ 완료된 작업 (코드)

- [x] Google OAuth 로그인 버튼 및 로직 구현
- [x] GitHub OAuth 로그인 버튼 및 로직 구현
- [x] 소셜 로그인 UI 개선 (모바일 최적화)
- [x] Toast 알림 통합
- [x] 에러 처리 및 로딩 상태
- [x] OAuth 콜백 처리 로직

### ⚠️ 수동 설정 필요 (Supabase Dashboard)

#### 1. Google OAuth 설정

**Google Cloud Console:**
- [x] OAuth 동의 화면 설정 완료
- [x] OAuth 클라이언트 ID 생성 완료
- [x] 승인된 리디렉션 URI 설정: `https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback`
- [x] 승인된 도메인 추가: `ideaspark-pi.vercel.app`

**Supabase Dashboard:**
- [ ] Authentication > Providers > Google
- [ ] Client ID 입력
- [ ] Client Secret 입력
- [ ] "Google enabled" 토글 ON
- [ ] Save 클릭

**참고 문서**: `docs/development/OAUTH_SETUP_GUIDE.md`

---

#### 2. GitHub OAuth 설정

**GitHub:**
- [x] OAuth App 생성 완료
- [x] Homepage URL: `https://ideaspark-pi.vercel.app`
- [x] Authorization callback URL: `https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback`

**Supabase Dashboard:**
- [ ] Authentication > Providers > GitHub
- [ ] Client ID 입력
- [ ] Client Secret 입력
- [ ] "GitHub enabled" 토글 ON
- [ ] Save 클릭

**참고 문서**: `docs/development/OAUTH_SETUP_GUIDE.md`

---

#### 3. Supabase URL 설정

**Supabase Dashboard:**
- [ ] Settings > Authentication > URL Configuration
- [ ] Site URL: `https://ideaspark-pi.vercel.app`
- [ ] Redirect URLs:
  - `https://ideaspark-pi.vercel.app/**` (프로덕션)
  - `http://localhost:5173/**` (로컬 개발, 선택사항)
- [ ] Save 클릭

**참고 문서**: `docs/development/OAUTH_REDIRECT_SETUP.md`

---

## ✅ 테스트 방법

### 1. 로컬 개발 환경 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173/auth 접속
# Google/GitHub 로그인 버튼 클릭
# OAuth 인증 완료 후 로컬호스트로 리디렉션 확인
```

### 2. 프로덕션 환경 테스트

1. Vercel 배포 확인
2. `https://ideaspark-pi.vercel.app/auth` 접속
3. Google/GitHub 로그인 버튼 클릭
4. OAuth 인증 완료 후 프로덕션 URL로 리디렉션 확인

---

## 🔧 문제 해결

### OAuth 승인 페이지에 Supabase URL이 표시되는 경우

**정상 동작입니다.** Supabase를 사용하는 한 OAuth 승인 페이지에 Supabase URL이 표시되는 것은 기술적 제약사항입니다.

**참고 문서**: `docs/development/OAUTH_CONSENT_SCREEN_URL.md`

### 리디렉션 에러가 발생하는 경우

1. Supabase Redirect URLs 확인
2. Google/GitHub OAuth App의 Authorization callback URL 확인
3. 브라우저 캐시 삭제 후 재시도

**참고 문서**: `docs/development/OAUTH_TROUBLESHOOTING.md`

---

## 📝 설정 완료 후 확인 사항

- [ ] Google 로그인 정상 작동
- [ ] GitHub 로그인 정상 작동
- [ ] 로컬 개발 환경에서 테스트 완료
- [ ] 프로덕션 환경에서 테스트 완료
- [ ] 리디렉션 정상 작동 (애플리케이션 도메인으로 이동)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

