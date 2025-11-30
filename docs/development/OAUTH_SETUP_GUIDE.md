# 🔐 OAuth Provider 설정 가이드

**작성일**: 2025년 1월 30일  
**목적**: Supabase에서 Google/GitHub OAuth Provider 활성화 방법

---

## ⚠️ 중요: 에러 해결

다음 에러가 발생하는 경우:
```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

이는 **Supabase Dashboard에서 OAuth Provider가 활성화되지 않았기 때문**입니다.

---

## 📋 Google OAuth 설정

### 1단계: Google Cloud Console에서 OAuth 클라이언트 생성

#### A. Google Cloud Console 접속 및 프로젝트 선택

1. **[Google Cloud Console](https://console.cloud.google.com/)** 접속
2. Google 계정으로 로그인
3. 상단 프로젝트 선택 드롭다운 클릭
4. 기존 프로젝트 선택 또는 **"새 프로젝트"** 클릭
   - 새 프로젝트 생성 시:
     - 프로젝트 이름: `IdeaSpark` (또는 원하는 이름)
     - **"만들기"** 클릭
     - 프로젝트 생성 완료까지 1-2분 소요

#### B. OAuth 동의 화면 설정

1. 좌측 메뉴에서 **"API 및 서비스"** > **"OAuth 동의 화면"** 클릭
2. **"외부"** 선택 후 **"만들기"** 클릭
3. 필수 정보 입력:
   - **앱 이름**: `IdeaSpark`
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **앱 로고**: (선택사항)
   - **앱 도메인**: (선택사항)
   - **개발자 연락처 정보**: 본인 이메일 입력
4. **"저장 후 계속"** 클릭
5. **"범위"** 화면에서 **"저장 후 계속"** 클릭 (기본 범위 사용)
6. **"테스트 사용자"** 화면에서 **"저장 후 계속"** 클릭 (선택사항)
7. **"요약"** 화면에서 **"대시보드로 돌아가기"** 클릭

#### C. OAuth 클라이언트 ID 생성

1. 좌측 메뉴에서 **"API 및 서비스"** > **"사용자 인증 정보"** 클릭
2. 상단 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"OAuth 클라이언트 ID"** 선택
4. **애플리케이션 유형**: **"웹 애플리케이션"** 선택
5. **이름**: `IdeaSpark Web Client` (또는 원하는 이름)
6. **승인된 리디렉션 URI** 섹션에서 **"+ URI 추가"** 클릭
7. 다음 URI를 **정확히** 입력 (복사-붙여넣기 권장):
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **매우 중요**: 
   > - 프로젝트 URL이 다르면 `djxiousdavdwwznufpzs` 부분을 본인의 Supabase 프로젝트 참조 ID로 변경
   > - Supabase Dashboard > Authentication > Providers > Google에서 "Callback URL" 확인 가능
   > - URL 끝에 슬래시(`/`)가 **없어야** 합니다
   > - `http://`가 아닌 `https://`를 사용해야 합니다
   > - 대소문자 구분합니다
8. **"만들기"** 클릭
9. **팝업 창에서 다음 정보 복사** (나중에 다시 볼 수 없으므로 중요!):
   - **클라이언트 ID**: 긴 문자열 (예: `123456789-abcdefg.apps.googleusercontent.com`)
   - **클라이언트 보안 비밀번호**: 긴 문자열 (예: `GOCSPX-xxxxxxxxxxxxx`)
   > 💡 **팁**: 안전한 곳에 저장해두세요!
10. **"확인"** 클릭하여 팝업 닫기

---

### 2단계: Supabase Dashboard에 Google OAuth 설정

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"Authentication"** 클릭
4. **"Providers"** 탭 선택
5. **"Google"** Provider 찾기 (또는 검색)
6. **"Google"** 카드 클릭하여 설정 모달 열기
7. **"Client ID"** 필드에 Google Cloud Console에서 복사한 **클라이언트 ID** 붙여넣기
8. **"Client Secret"** 필드에 Google Cloud Console에서 복사한 **클라이언트 보안 비밀번호** 붙여넣기
   > 💡 **팁**: Client Secret 필드 오른쪽 눈 아이콘으로 표시/숨김 전환 가능
9. **"Callback URL (for OAuth)"** 필드 확인:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **중요**: 이 URL을 Google Cloud Console의 "승인된 리디렉션 URI"에 정확히 입력했는지 확인!
10. **"Site URL"** 설정 확인:
    - Supabase Dashboard > **Settings** > **Authentication** > **URL Configuration**
    - **"Site URL"**을 애플리케이션 도메인으로 설정:
      ```
      https://ideaspark-pi.vercel.app
      ```
    - **"Redirect URLs"**에 다음 추가:
      ```
      https://ideaspark-pi.vercel.app/**
      ```
    > 💡 이렇게 설정하면 OAuth 리디렉션 후 Supabase URL 대신 애플리케이션 도메인이 표시됩니다!
11. **"GitHub enabled"** 토글 스위치를 **ON (녹색)**으로 변경
   > ✅ 이제 Client ID와 Secret이 입력되어 있으므로 토글이 활성화됩니다!
11. **"Save"** 버튼 클릭
12. 성공 메시지 확인

---

## 📋 GitHub OAuth 설정

### 1단계: GitHub에서 OAuth App 생성

#### A. GitHub Developer Settings 접속

1. **GitHub** 접속 및 로그인
2. 우측 상단 프로필 아이콘 클릭
3. **"Settings"** 클릭
4. 좌측 메뉴 하단에서 **"Developer settings"** 클릭
5. 좌측 메뉴에서 **"OAuth Apps"** 선택

#### B. 새 OAuth App 생성

1. **"New OAuth App"** 버튼 클릭 (또는 **"Register a new application"**)
2. 다음 정보 입력:
   - **Application name**: `IdeaSpark`
     > 💡 사용자가 GitHub 로그인 시 보게 될 앱 이름
   - **Homepage URL**: ⚠️ **중요!**
     ```
     https://ideaspark-pi.vercel.app
     ```
     > ⚠️ **중요**: 
     > - 프로덕션 환경에서는 실제 도메인(`https://ideaspark-pi.vercel.app`)을 입력해야 합니다
     > - 이 URL이 GitHub OAuth 승인 페이지에 표시됩니다
     > - 로컬 개발 중이면 `http://localhost:5173`도 추가 가능
   - **Application description**: (선택사항)
     ```
     Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼
     ```
   - **Authorization callback URL**: ⚠️ **가장 중요!**
     ```
     https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
     ```
     > ⚠️ **중요**: 
     > - 프로젝트 URL이 다르면 `djxiousdavdwwznufpzs` 부분을 본인의 Supabase 프로젝트 참조 ID로 변경
     > - Supabase Dashboard > Settings > API에서 확인 가능
     > - 이 URL은 정확히 일치해야 합니다!
3. **"Register application"** 버튼 클릭

#### C. Client ID와 Client Secret 복사

1. 생성된 OAuth App 페이지로 이동
2. **"Client ID"** 섹션에서 긴 문자열 복사
   > 💡 예: `Iv1.8a61f9b3a7aba766`
3. **"Client secrets"** 섹션에서 **"Generate a new client secret"** 클릭
4. 새 클라이언트 시크릿 생성 확인
5. **"Client secret"** 값 복사
   > ⚠️ **중요**: 이 값은 한 번만 표시됩니다! 안전한 곳에 저장하세요!
   > 💡 나중에 다시 볼 수 없으므로 복사해두세요!

---

### 2단계: Supabase Dashboard에 GitHub OAuth 설정

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"Authentication"** 클릭
4. **"Providers"** 탭 선택
5. **"GitHub"** Provider 찾기 (또는 검색)
6. **"GitHub"** 카드 클릭하여 설정 모달 열기
7. **"Client ID"** 필드에 GitHub에서 복사한 **Client ID** 붙여넣기
8. **"Client Secret"** 필드에 GitHub에서 복사한 **Client secret** 붙여넣기
   > 💡 **팁**: Client Secret 필드 오른쪽 눈 아이콘으로 표시/숨김 전환 가능
9. **"Callback URL (for OAuth)"** 필드 확인:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **중요**: 이 URL을 GitHub OAuth App의 "Authorization callback URL"에 정확히 입력했는지 확인!
10. **"GitHub enabled"** 토글 스위치를 **ON (녹색)**으로 변경
    > ✅ 이제 Client ID와 Secret이 입력되어 있으므로 토글이 활성화됩니다!
11. (선택사항) **"Allow users without an email"** 토글 설정
    - GitHub에서 이메일을 제공하지 않는 사용자도 로그인 허용 여부
    - 기본값: OFF (이메일 필수)
12. **"Save"** 버튼 클릭
13. 성공 메시지 확인

---

## ✅ 확인 방법

### 설정 확인
1. Supabase Dashboard > Authentication > Providers
2. Google/GitHub Provider 카드 확인:
   - **"Enabled"** 상태 표시 확인
   - 토글 스위치가 **ON (녹색)**인지 확인
   - Client ID가 입력되어 있는지 확인 (Secret은 숨김 처리됨)

### 빠른 체크리스트
- [ ] Google Cloud Console에서 OAuth 클라이언트 ID 생성 완료
- [ ] Google Cloud Console에 리디렉션 URI 등록 완료
- [ ] Supabase에 Google Client ID 입력 완료
- [ ] Supabase에 Google Client Secret 입력 완료
- [ ] Google Provider 토글 ON
- [ ] GitHub에서 OAuth App 생성 완료
- [ ] GitHub에 리디렉션 URI 등록 완료
- [ ] Supabase에 GitHub Client ID 입력 완료
- [ ] Supabase에 GitHub Client Secret 입력 완료
- [ ] GitHub Provider 토글 ON

### 테스트
1. 애플리케이션의 `/auth` 페이지 접속
2. **"Google로 계속하기"** 또는 **"GitHub로 계속하기"** 버튼 클릭
3. OAuth 인증 플로우 진행
4. 성공적으로 리디렉션되면 설정 완료!

---

## 🔧 문제 해결

### ⚠️ 에러: `redirect_uri_mismatch` (400 오류)

**증상:**
```
액세스 차단됨: 이 앱의 요청이 잘못되었습니다
400 오류: redirect_uri_mismatch
```

**원인:**
Google Cloud Console에 등록한 리디렉션 URI와 실제 요청하는 URI가 정확히 일치하지 않음

**해결 방법:**
1. **Supabase Dashboard** > **Authentication** > **Providers** > **Google** 클릭
2. **"Callback URL (for OAuth)"** 필드의 URL 복사
3. **Google Cloud Console** > **API 및 서비스** > **사용자 인증 정보** 이동
4. OAuth 클라이언트 ID 클릭
5. **"승인된 리디렉션 URI"** 섹션 확인
6. Supabase에서 복사한 URL과 **정확히 일치**하는지 확인
7. 다르면 수정:
   - 잘못된 URI 삭제
   - **"+ URI 추가"** 클릭
   - Supabase에서 복사한 정확한 URL 붙여넣기
   - **"저장"** 클릭
8. 1-2분 대기 후 다시 테스트

**확인 사항:**
- ✅ URL 끝에 `/` (슬래시)가 없어야 함
- ✅ `https://` 프로토콜 사용 (http 아님)
- ✅ 프로젝트 참조 ID 정확함
- ✅ `/auth/v1/callback` 경로 정확함

**상세 가이드**: `docs/development/OAUTH_TROUBLESHOOTING.md` 참고

---

### 에러: "provider is not enabled"
- **원인**: Supabase Dashboard에서 Provider가 활성화되지 않음
- **해결**: 위의 "2단계: Supabase Dashboard 설정"을 다시 확인하고 토글을 ON으로 변경

### 에러: "invalid_client"
- **원인**: Client ID 또는 Client Secret이 잘못됨
- **해결**: 
  1. Google Cloud Console / GitHub에서 Client ID와 Secret 다시 복사
  2. Supabase Dashboard에 정확히 입력 (공백 없이)

---

## 📝 프로젝트 정보

**현재 Supabase 프로젝트 URL**: `https://djxiousdavdwwznufpzs.supabase.co`

**리디렉션 URI**: `https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback`

> ⚠️ **주의**: 프로젝트가 다르면 URL도 다를 수 있습니다. Supabase Dashboard에서 정확한 URL을 확인하세요.

---

## 🔗 참고 링크

- [Supabase Auth OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Auth GitHub Guide](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Google Cloud Console](https://console.cloud.google.com/)
- [GitHub OAuth Apps](https://github.com/settings/developers)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

