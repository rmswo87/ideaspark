# 로컬 개발 vs 프로덕션 환경 동작 방식

## 개요

IdeaSpark는 로컬 개발 환경과 프로덕션 환경(Vercel 배포)에서 자동으로 적절한 API를 선택합니다.

## 환경 구분

### 로컬 개발 환경 (`npm run dev`)
- **조건**: `import.meta.env.DEV === true`
- **API 선택**:
  - `VITE_SUPABASE_URL`이 설정되어 있으면 → **Supabase Edge Function** (Vite 프록시 사용)
  - `VITE_SUPABASE_URL`이 없으면 → **Vercel Edge Function** 시도 (로컬에서는 작동하지 않음)

### 프로덕션 환경 (Vercel 배포)
- **조건**: `import.meta.env.DEV === false`
- **API 선택**:
  - `VITE_API_PROVIDER=supabase` → **Supabase Edge Function** 직접 사용
  - `VITE_API_PROVIDER=vercel` 또는 설정 안 함 → **Vercel Edge Function** 사용 (기본값)

## 동작 흐름

### 로컬 개발 환경

```
브라우저 요청
  ↓
http://localhost:5173/functions/v1/collect-ideas
  ↓
Vite 프록시 (vite.config.ts)
  ↓
https://[project].supabase.co/functions/v1/collect-ideas
  ↓
Supabase Edge Function
```

### Vercel 프로덕션 환경

```
브라우저 요청
  ↓
https://[project].vercel.app/api/collect-ideas
  ↓
Vercel Edge Function (api/collect-ideas.ts)
  ↓
Reddit API
```

## 환경 변수 설정

### 로컬 개발 환경 (`.env.local`)

```env
# Supabase 설정 (로컬 테스트용)
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Reddit API 자격 증명 (선택사항 - Supabase Edge Function에 설정되어 있으면 불필요)
VITE_REDDIT_CLIENT_ID=your_client_id
VITE_REDDIT_CLIENT_SECRET=your_client_secret
```

### Vercel 프로덕션 환경

**Vercel 대시보드 → Settings → Environment Variables:**

```env
# Vercel Edge Function 사용 (기본값)
# VITE_API_PROVIDER 설정 안 함 또는 VITE_API_PROVIDER=vercel

# Reddit API 자격 증명 (Vercel Edge Function용)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

**또는 Supabase Edge Function 사용:**

```env
VITE_API_PROVIDER=supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 확인 사항

### ✅ Vercel 배포 시 정상 작동 보장

1. **자동 환경 감지**: `import.meta.env.DEV`로 로컬/프로덕션 자동 구분
2. **기본값**: 프로덕션 환경에서 `VITE_API_PROVIDER`가 설정되지 않으면 자동으로 Vercel Edge Function 사용
3. **로컬 전용 코드**: 로컬 개발 환경에서만 Supabase Edge Function 사용 (Vite 프록시)

### ⚠️ 주의사항

1. **로컬 개발 환경**:
   - Supabase Edge Function을 사용하려면 `VITE_SUPABASE_URL` 설정 필요
   - Supabase Edge Function이 배포되어 있어야 함 (`supabase functions deploy collect-ideas`)

2. **Vercel 프로덕션 환경**:
   - `VITE_API_PROVIDER`를 설정하지 않으면 자동으로 Vercel Edge Function 사용
   - Vercel Edge Function에 Reddit API 자격 증명 설정 필요

## 테스트 방법

### 로컬 테스트
```bash
npm run dev
# 브라우저에서 http://localhost:5173 접속
# "아이디어 수집" 버튼 클릭
```

### Vercel 배포 테스트
```bash
# Vercel에 배포
vercel --prod

# 배포된 URL에서 테스트
# https://[project].vercel.app 접속
# "아이디어 수집" 버튼 클릭
```

## 문제 해결

### 로컬에서 404 에러
- Supabase Edge Function이 배포되어 있는지 확인
- `supabase functions deploy collect-ideas` 실행

### Vercel에서 404 에러
- `api/collect-ideas.ts` 파일이 존재하는지 확인
- Vercel 대시보드에서 Edge Function이 배포되었는지 확인

### CORS 에러
- 로컬: Vite 프록시 설정 확인 (`vite.config.ts`)
- 프로덕션: Vercel Edge Function의 CORS 헤더 확인

