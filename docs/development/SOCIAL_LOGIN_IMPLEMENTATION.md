# 🔐 소셜 로그인 구현 가이드

**작성일**: 2025년 1월 30일  
**예상 작업량**: 5일  
**우선순위**: [P1] 단기 (1-2주 내)

---

## 📋 작업 개요

Google OAuth와 GitHub OAuth를 통한 소셜 로그인 기능을 구현합니다.

---

## 🎯 구현 목표

1. **Google OAuth 로그인** 구현
2. **GitHub OAuth 로그인** 구현
3. **소셜 로그인 UI 개선** (모바일 최적화 포함)
4. **에러 처리 및 사용자 경험 개선**

---

## 📝 단계별 구현 계획

### 1단계: Supabase OAuth Provider 설정 (수동 작업 필요)

#### Google OAuth 설정

1. **Google Cloud Console 설정**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - 새 프로젝트 생성 또는 기존 프로젝트 선택
   - "API 및 서비스" > "사용자 인증 정보" 이동
   - "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
   - 애플리케이션 유형: "웹 애플리케이션"
   - 승인된 리디렉션 URI 추가:
     ```
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     ```
   - 클라이언트 ID와 클라이언트 시크릿 복사

2. **Supabase Dashboard 설정**
   - Supabase Dashboard > Authentication > Providers 이동
   - Google Provider 활성화
   - Client ID와 Client Secret 입력
   - Redirect URL 확인 (자동 생성됨)

#### GitHub OAuth 설정

1. **GitHub OAuth App 생성**
   - GitHub > Settings > Developer settings > OAuth Apps 이동
   - "New OAuth App" 클릭
   - Application name: "IdeaSpark"
   - Homepage URL: `https://[YOUR_DOMAIN]`
   - Authorization callback URL:
     ```
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     ```
   - Client ID와 Client Secret 복사

2. **Supabase Dashboard 설정**
   - Supabase Dashboard > Authentication > Providers 이동
   - GitHub Provider 활성화
   - Client ID와 Client Secret 입력
   - Redirect URL 확인 (자동 생성됨)

---

### 2단계: 코드 구현

#### 파일 수정 대상
- `src/pages/AuthPage.tsx` - 소셜 로그인 버튼 추가 및 로직 구현
- `src/hooks/useAuth.ts` - 소셜 로그인 상태 관리 (필요 시)

#### 구현 내용

1. **소셜 로그인 버튼 추가**
   - Google 로그인 버튼
   - GitHub 로그인 버튼
   - 모바일 최적화된 디자인
   - 로딩 상태 표시

2. **소셜 로그인 로직 구현**
   - `supabase.auth.signInWithOAuth()` 사용
   - 에러 처리
   - 리디렉션 후 세션 확인

3. **UI 개선**
   - 소셜 로그인 버튼 스타일링
   - 구분선 (Divider) 추가
   - 아이콘 추가 (Google, GitHub)

---

## 🔧 기술 스택

- **Supabase Auth**: OAuth Provider 지원
- **React**: UI 컴포넌트
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링

---

## 📱 모바일 최적화 고려사항

- 소셜 로그인 버튼 최소 44px × 44px
- 터치하기 쉬운 크기
- 반응형 레이아웃
- 로딩 상태 명확히 표시

---

## ✅ 완료 체크리스트

### Supabase 설정
- [ ] Google OAuth Provider 활성화
- [ ] GitHub OAuth Provider 활성화
- [ ] Redirect URL 확인

### 코드 구현
- [ ] Google 로그인 버튼 추가
- [ ] GitHub 로그인 버튼 추가
- [ ] 소셜 로그인 로직 구현
- [ ] 에러 처리 구현
- [ ] 로딩 상태 표시

### UI 개선
- [ ] 소셜 로그인 버튼 스타일링
- [ ] 구분선 추가
- [ ] 아이콘 추가
- [ ] 모바일 최적화

### 테스트
- [ ] Google 로그인 테스트
- [ ] GitHub 로그인 테스트
- [ ] 에러 처리 테스트
- [ ] 모바일 테스트

---

## 📚 참고 문서

- [Supabase Auth OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth GitHub Guide](https://supabase.com/docs/guides/auth/social-login/auth-github)

---

**작성자**: AI Assistant  
**상태**: 진행 중  
**다음 단계**: 코드 구현 시작

