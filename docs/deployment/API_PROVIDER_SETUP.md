# API Provider 설정 가이드

## 개요

IdeaSpark는 다양한 API Provider를 지원합니다:
- **Vercel Edge Functions** (기본값): Vercel 배포 시 사용
- **Supabase Edge Functions**: GitHub Pages 배포 시 사용
- **Cloudflare Workers**: 대안으로 사용 가능

환경 변수로 쉽게 전환할 수 있습니다.

## 🔧 설정 방법

### 1. Vercel Edge Functions (기본값)

**환경 변수:**
```env
VITE_API_PROVIDER=vercel
# 또는 설정하지 않으면 기본값으로 Vercel 사용
```

**API 엔드포인트:**
- `/api/collect-ideas`

### 2. Supabase Edge Functions

**환경 변수:**
```env
VITE_API_PROVIDER=supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**API 엔드포인트:**
- `https://[project].supabase.co/functions/v1/collect-ideas`

**Supabase Edge Functions 배포:**
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# Edge Function 생성
supabase functions new collect-ideas

# 배포
supabase functions deploy collect-ideas
```

### 3. Cloudflare Workers

**환경 변수:**
```env
VITE_API_PROVIDER=cloudflare
VITE_CLOUDFLARE_WORKER_URL=https://[worker].workers.dev
```

**API 엔드포인트:**
- `https://[worker].workers.dev/api/collect-ideas`

## 🔄 Vercel 복귀

Vercel로 복귀하려면:
1. 환경 변수에서 `VITE_API_PROVIDER` 제거 또는 `vercel`로 설정
2. `main` 브랜치로 체크아웃
3. Vercel 배포

**브랜치 관리:**
- `main`: Vercel 배포용 (기본)
- `github-pages-deployment`: GitHub Pages 배포용 (테스트)

## 📝 현재 사용 중인 API

1. **`/api/collect-ideas`**: Reddit 아이디어 수집

## ⚠️ 주의사항

- GitHub Pages는 정적 파일만 제공하므로 서버 사이드 API가 필요합니다
- Supabase Edge Functions 또는 Cloudflare Workers를 사용해야 합니다
- Vercel로 복귀 시 환경 변수만 변경하면 됩니다

