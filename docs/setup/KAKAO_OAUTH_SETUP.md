# Kakao OAuth 설정 가이드

**작성일**: 2025년 1월 30일  
**목적**: IdeaSpark 프로젝트에서 Kakao 로그인을 위한 설정 가이드

---

## ⚠️ 중요: Kakao OAuth 에러 해결

다음 에러가 발생하는 경우:
```
잘못된 요청 (KOE205)
설정하지 않은 동의 항목: account_email
```

이는 **Kakao Developers에서 `account_email` 동의 항목이 활성화되지 않았기 때문**입니다.

---

## 📋 Kakao Developers 설정

### 1단계: 카카오 개발자 센터 접속

1. **[카카오 개발자 센터](https://developers.kakao.com/)** 접속
2. 카카오 계정으로 로그인
3. **"내 애플리케이션"** 메뉴 클릭

### 2단계: 애플리케이션 생성 또는 선택

1. 기존 애플리케이션 선택 또는 **"애플리케이션 추가하기"** 클릭
2. 애플리케이션 이름: `IdeaSpark` (또는 원하는 이름)
3. **"저장"** 클릭

### 3단계: 플랫폼 설정

1. 좌측 메뉴에서 **"앱 설정"** > **"플랫폼"** 클릭
2. **"Web 플랫폼 등록"** 클릭
3. 사이트 도메인 입력:
   - 프로덕션: `https://ideaspark-pi.vercel.app`
   - 개발 환경 (선택사항): `http://localhost:5173`
4. **"저장"** 클릭

### 4단계: 카카오 로그인 활성화

1. 좌측 메뉴에서 **"제품 설정"** > **"카카오 로그인"** 클릭
2. **"활성화 설정"** 토글을 **ON**으로 변경
3. **"Redirect URI 등록"** 클릭
4. Redirect URI 입력:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **중요**: 이 URL을 정확히 입력해야 합니다. Supabase 프로젝트의 인증 콜백 URL입니다.
5. **"저장"** 클릭

### 5단계: 동의 항목 설정 (⚠️ 필수)

1. 좌측 메뉴에서 **"제품 설정"** > **"카카오 로그인"** > **"동의항목"** 클릭
2. **"필수 동의"** 또는 **"선택 동의"** 섹션에서 다음 항목을 활성화:

   **필수 동의 항목:**
   - ✅ **닉네임** (`profile_nickname`)
     - 동의 목적: 서비스 이용자 식별
     - 필수 여부: 필수
   
   **선택 동의 항목 (Supabase가 요청하는 경우):**
   - ✅ **카카오계정(이메일)** (`account_email`)
     - 동의 목적: 서비스 이용자 식별 및 계정 관리
     - 필수 여부: 선택
     - ⚠️ **중요**: Supabase가 기본적으로 email을 요청하므로, 이 항목을 활성화하지 않으면 에러가 발생합니다.

3. 각 항목의 **"활성화"** 토글을 **ON**으로 변경
4. **"저장"** 클릭

### 6단계: REST API 키 확인

1. 좌측 메뉴에서 **"앱 설정"** > **"앱 키"** 클릭
2. **"REST API 키"** 복사 (이것이 Client ID입니다)
3. **"Client Secret"**은 Kakao OAuth 2.0에서는 사용하지 않습니다.

---

## 📋 Supabase Dashboard 설정

### 1단계: Kakao Provider 활성화

1. **[Supabase Dashboard](https://supabase.com/dashboard)** 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"Authentication"** > **"Providers"** 클릭
4. **"Kakao"** 카드 클릭하여 설정 모달 열기

### 2단계: Client ID 입력

1. **"Client ID"** 필드에 Kakao Developers에서 복사한 **REST API 키** 붙여넣기
2. **"Client Secret"** 필드는 비워둡니다 (Kakao OAuth 2.0에서는 사용하지 않음)
3. **"Callback URL (for OAuth)"** 필드 확인:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
   > ⚠️ **중요**: 이 URL을 Kakao Developers의 Redirect URI에 정확히 입력했는지 확인!

### 3단계: Provider 활성화

1. **"Kakao enabled"** 토글 스위치를 **ON (녹색)**으로 변경
2. **"Save"** 버튼 클릭
3. 성공 메시지 확인

---

## ✅ 확인 방법

### 설정 확인

1. Supabase Dashboard > Authentication > Providers
2. Kakao Provider 카드 확인:
   - **"Enabled"** 상태 표시 확인
   - 토글 스위치가 **ON (녹색)**인지 확인
   - Client ID가 입력되어 있는지 확인

2. Kakao Developers > 내 애플리케이션 > 카카오 로그인 > 동의항목
   - **"닉네임"** (`profile_nickname`) 활성화 확인
   - **"카카오계정(이메일)"** (`account_email`) 활성화 확인 (Supabase가 요청하는 경우)

### 빠른 체크리스트

- [ ] Kakao Developers에서 애플리케이션 생성 완료
- [ ] Web 플랫폼 등록 완료
- [ ] Redirect URI 등록 완료 (Supabase 콜백 URL)
- [ ] 카카오 로그인 활성화 완료
- [ ] 동의 항목 설정 완료 (닉네임, 이메일)
- [ ] Supabase에 Kakao Client ID 입력 완료
- [ ] Kakao Provider 토글 ON

### 테스트

1. 애플리케이션의 `/auth` 페이지 접속
2. **"카카오 로그인"** 버튼 클릭
3. Kakao 인증 페이지로 리디렉션 확인
4. 로그인 후 성공적으로 리디렉션되면 설정 완료!

---

## 🔧 문제 해결

### 에러: "앱 관리자 설정 오류 (KOE006)"

**원인**: Kakao Developers에서 앱 설정이 완료되지 않았거나, Redirect URI가 일치하지 않음

**해결 방법**:
1. **Kakao Developers > 내 애플리케이션 > 앱 설정 > 플랫폼** 확인:
   - Web 플랫폼이 등록되어 있는지 확인
   - 사이트 도메인이 정확히 입력되어 있는지 확인
   - 프로덕션: `https://ideaspark-pi.vercel.app`
   - 개발 환경: `http://localhost:5173` (선택사항)

2. **Kakao Developers > 내 애플리케이션 > 제품 설정 > 카카오 로그인** 확인:
   - **"활성화 설정"** 토글이 **ON**인지 확인
   - **"Redirect URI"**가 정확히 설정되어 있는지 확인:
     ```
     https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
     ```
   - ⚠️ **중요**: URI는 정확히 일치해야 하며, 끝에 슬래시(`/`)가 있으면 안 됩니다.

3. **Kakao Developers > 내 애플리케이션 > 앱 설정 > 앱 키** 확인:
   - REST API 키가 정상적으로 발급되어 있는지 확인
   - Supabase Dashboard에 입력한 Client ID와 일치하는지 확인

4. **앱 상태 확인**:
   - 앱이 정상적으로 활성화되어 있는지 확인
   - 앱 삭제 또는 비활성화 상태가 아닌지 확인

5. **캐시 및 재시도**:
   - 브라우저 캐시 삭제 후 재시도
   - 몇 분 후 다시 시도 (설정 변경 후 반영 시간 필요)

### 에러: "설정하지 않은 동의 항목: account_email"

**원인**: Kakao Developers에서 `account_email` 동의 항목이 활성화되지 않음

**해결 방법**:
1. Kakao Developers > 내 애플리케이션 > 카카오 로그인 > 동의항목
2. **"카카오계정(이메일)"** (`account_email`) 항목 찾기
3. **"활성화"** 토글을 **ON**으로 변경
4. **"저장"** 클릭
5. 다시 로그인 시도

### 에러: "잘못된 요청 (KOE205)"

**원인**: Redirect URI가 일치하지 않거나, 동의 항목이 설정되지 않음

**해결 방법**:
1. Kakao Developers의 Redirect URI와 Supabase의 Callback URL이 정확히 일치하는지 확인
2. 동의 항목이 모두 활성화되어 있는지 확인
3. Supabase Dashboard에서 Kakao Provider가 활성화되어 있는지 확인

---

## 📌 참고 사항

### Supabase와 Kakao OAuth

- Supabase는 기본적으로 사용자 이메일을 요청합니다.
- 따라서 Kakao Developers에서 `account_email` 동의 항목을 활성화해야 합니다.
- 만약 이메일이 필요하지 않다면, Supabase Dashboard에서 "Allow users without an email" 옵션을 활성화할 수 있지만, 이는 권장되지 않습니다.

### 보안 고려사항

- REST API 키는 공개되어도 안전하지만, Client Secret은 절대 공개하지 마세요.
- Redirect URI는 정확히 일치해야 하며, 와일드카드를 사용할 수 없습니다.
- 프로덕션 환경에서는 HTTPS를 사용해야 합니다.

---

## 🔗 관련 문서

- [Kakao Developers 문서](https://developers.kakao.com/docs)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 표준](https://oauth.net/2/)

