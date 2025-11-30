# Supabase Edge Functions 설정 가이드

## 개요

GitHub Pages 배포 시 Vercel Edge Functions 대신 Supabase Edge Functions를 사용합니다.

## 🚀 설정 방법

### 1. Supabase CLI 설치

```bash
npm install -g supabase
```

### 2. Supabase 로그인

```bash
supabase login
```

### 3. 프로젝트 연결

```bash
# 프로젝트 디렉토리로 이동
cd 11.25/my_first_project/IdeaSpark

# Supabase 프로젝트 연결
supabase link --project-ref [YOUR_PROJECT_REF]
```

프로젝트 REF는 Supabase 대시보드 → Settings → General → Reference ID에서 확인할 수 있습니다.

### 4. Edge Functions 배포

```bash
# collect-ideas 함수 배포
supabase functions deploy collect-ideas --no-verify-jwt

# translate-text 함수 배포
supabase functions deploy translate-text --no-verify-jwt
```

### 5. 환경 변수 설정 (Secrets)

Supabase 대시보드 → Edge Functions → Settings → Secrets에서 다음을 설정:

```
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key (선택)
PAPAGO_CLIENT_ID=your_papago_client_id (선택)
PAPAGO_CLIENT_SECRET=your_papago_client_secret (선택)
TRANSLATION_PROVIDER=google|papago|libretranslate (선택, 기본값: google)
```

또는 CLI로 설정:

```bash
supabase secrets set REDDIT_CLIENT_ID=your_reddit_client_id
supabase secrets set REDDIT_CLIENT_SECRET=your_reddit_client_secret
supabase secrets set GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
```

### 6. GitHub Pages 환경 변수 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서:

```
VITE_API_PROVIDER=supabase
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📝 API 엔드포인트

배포 후 다음 URL로 접근:

- `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/collect-ideas`
- `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/translate-text`

## 🔄 Vercel 복귀

Vercel로 복귀하려면:

1. GitHub Secrets에서 `VITE_API_PROVIDER` 제거 또는 `vercel`로 설정
2. `main` 브랜치로 체크아웃
3. Vercel 배포

**브랜치 관리:**
- `main`: Vercel 배포용 (기본)
- `github-pages-deployment`: GitHub Pages + Supabase Edge Functions (테스트)

## ⚠️ 주의사항

- Supabase Edge Functions는 Deno 런타임을 사용합니다
- Vercel Edge Functions와 코드가 약간 다릅니다 (Deno vs Node.js)
- JWT 검증을 비활성화했으므로 공개 API로 사용됩니다

## 💡 장점

- ✅ GitHub Pages와 함께 사용 가능
- ✅ 무료 플랜 제공
- ✅ 전 세계 엣지 배포
- ✅ Vercel과 유사한 기능

