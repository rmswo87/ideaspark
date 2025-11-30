# 로컬 개발 환경 설정 가이드

## 개요

로컬 개발 환경에서 아이디어 수집 기능을 테스트하려면 Supabase Edge Function을 배포해야 합니다.

## ⚠️ 중요 사항

- **Reddit API는 CORS 정책 때문에 브라우저에서 직접 호출할 수 없습니다.**
- 반드시 서버 사이드 API (Supabase Edge Function 또는 Vercel Edge Function)를 통해 호출해야 합니다.
- 로컬 개발 환경에서는 Supabase Edge Function을 사용합니다 (Vite 프록시를 통해).

## 🚀 빠른 시작

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. Supabase 로그인

```bash
supabase login
```

브라우저가 열리면 Supabase 계정으로 로그인하세요.

### 3. 프로젝트 연결

```bash
cd 11.25/my_first_project/IdeaSpark
supabase link --project-ref djxiousdavdwwznufpzs
```

프로젝트 REF는 Supabase 대시보드 → Settings → General → Reference ID에서 확인할 수 있습니다.

### 4. Edge Function 배포

```bash
supabase functions deploy collect-ideas --no-verify-jwt
```

### 5. 환경 변수 설정 (Secrets)

Reddit API 자격 증명을 Supabase Edge Function에 설정합니다:

**방법 1: CLI 사용**

```bash
supabase secrets set REDDIT_CLIENT_ID=your_reddit_client_id
supabase secrets set REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

**방법 2: Supabase 대시보드 사용**

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. Edge Functions → Settings → Secrets
4. 다음 Secrets 추가:
   - `REDDIT_CLIENT_ID`: Reddit API Client ID
   - `REDDIT_CLIENT_SECRET`: Reddit API Client Secret

### 6. 로컬 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=https://djxiousdavdwwznufpzs.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 7. 개발 서버 실행

```bash
npm run dev
```

### 8. 테스트

브라우저에서 `http://localhost:5173` 접속 후 "아이디어 수집" 버튼을 클릭하세요.

## 🔍 문제 해결

### 404 에러: "Requested function was not found"

**원인**: Supabase Edge Function이 배포되지 않았습니다.

**해결**:
```bash
supabase functions deploy collect-ideas --no-verify-jwt
```

### 401 에러: "No API key found in request"

**원인**: Supabase API key가 설정되지 않았습니다.

**해결**: `.env.local` 파일에 `VITE_SUPABASE_ANON_KEY` 설정 확인

### 500 에러: "Reddit API credentials not configured"

**원인**: Reddit API 자격 증명이 Supabase Edge Function에 설정되지 않았습니다.

**해결**: Supabase Secrets에 `REDDIT_CLIENT_ID`와 `REDDIT_CLIENT_SECRET` 설정

### CORS 에러

**원인**: Vite 프록시 설정 문제

**해결**: `vite.config.ts`의 프록시 설정 확인

## 📝 Reddit API 자격 증명 얻기

1. Reddit 계정으로 로그인: https://www.reddit.com
2. Preferences → Apps → 개발자용 앱으로 이동
3. "create another app..." 클릭
4. 앱 정보 입력:
   - **name**: IdeaSpark (또는 원하는 이름)
   - **type**: script
   - **description**: Idea collection app
   - **about url**: (선택사항)
   - **redirect uri**: http://localhost:5173 (로컬 개발용)
5. "create app" 클릭
6. 생성된 앱에서:
   - **client_id**: 앱 이름 아래에 표시됨
   - **secret**: "secret" 필드에 표시됨

## 🔄 Edge Function 재배포

코드를 수정한 후 재배포:

```bash
supabase functions deploy collect-ideas --no-verify-jwt
```

## 📚 참고 자료

- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Reddit API 문서](https://www.reddit.com/dev/api/)
- [Vite 프록시 설정](https://vitejs.dev/config/server-options.html#server-proxy)

