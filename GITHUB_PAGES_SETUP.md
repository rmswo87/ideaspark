# GitHub Pages 배포 가이드

## ⚠️ 중요 사항

GitHub Pages는 **정적 파일만 제공**하므로 Vercel Edge Functions는 사용할 수 없습니다.

**해결 방법:**
- ✅ **Supabase Edge Functions** 사용 (권장)
  - GitHub Pages와 함께 사용 가능
  - 무료 플랜 제공
  - 전 세계 엣지 배포
  - 설정 가이드: [SUPABASE_EDGE_FUNCTIONS_SETUP.md](./SUPABASE_EDGE_FUNCTIONS_SETUP.md)

**작동하는 기능:**
- ✅ 프론트엔드 UI 테스트
- ✅ Supabase 클라이언트 연결 (브라우저에서 직접 호출)
- ✅ Supabase Edge Functions (API 엔드포인트)
- ✅ React Router 라우팅
- ✅ 모든 클라이언트 사이드 기능

## 🚀 배포 방법

### 방법 1: GitHub Actions 자동 배포 (권장)

1. **GitHub 저장소 설정**
   - GitHub 저장소로 이동: https://github.com/rmswo87/ideaspark
   - 저장소 → Settings → Pages
   - Source: "GitHub Actions" 선택
   - 저장 버튼 클릭
   
   **참고**: GitHub Pages는 정적 파일만 호스팅 가능합니다 (Edge Functions 불가). Vercel Functions는 GitHub Pages에서 작동하지 않으므로, Supabase Edge Functions를 사용해야 합니다.

2. **Secrets 설정**
   - 저장소 → Settings → Secrets and variables → Actions
   - 다음 Secrets 추가:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_OPENROUTER_API_KEY`
     - `VITE_OPENROUTER_MODEL` (선택)
     - `VITE_AI_PROVIDER` (선택)
     - `VITE_API_PROVIDER=supabase` (Supabase Edge Functions 사용 시)

3. **Supabase Edge Functions 설정** (필수)
   - [SUPABASE_EDGE_FUNCTIONS_SETUP.md](./SUPABASE_EDGE_FUNCTIONS_SETUP.md) 참고
   - `collect-ideas` 및 `translate-text` 함수 배포 필요

3. **자동 배포**
   - `main` 브랜치에 푸시하면 자동으로 배포됩니다
   - Actions 탭에서 배포 상태 확인

### 방법 2: 수동 배포 (gh-pages 패키지)

```bash
# gh-pages 패키지 설치
npm install --save-dev gh-pages

# 배포 실행
npm run deploy:gh-pages
```

## 📝 배포 후 접속

배포가 완료되면 다음 URL로 접속:
- `https://rmswo87.github.io/ideaspark/`

## 🔧 로컬 테스트

GitHub Pages와 동일한 환경에서 테스트:

```bash
# GitHub Pages base path로 빌드
npm run build:gh-pages

# 빌드 결과 미리보기
npm run preview
```

## ⚙️ 환경 변수

GitHub Pages 배포 시 환경 변수는 GitHub Secrets에 설정해야 합니다.

로컬 테스트 시 `.env.local` 파일 사용:
```env
VITE_GITHUB_PAGES=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🔄 Vercel과의 차이점

| 기능 | Vercel | GitHub Pages + Supabase |
|------|--------|------------------------|
| 정적 파일 | ✅ | ✅ |
| Edge Functions | ✅ (Vercel) | ✅ (Supabase) |
| 환경 변수 | 대시보드 설정 | GitHub Secrets + Supabase Secrets |
| 자동 배포 | ✅ | ✅ (Actions) |
| 커스텀 도메인 | ✅ | ✅ |
| 무료 한도 | 일일 100개 배포 | 무제한 |
| API 엔드포인트 | `/api/*` | `https://[project].supabase.co/functions/v1/*` |

## 💡 권장 사용법

1. **GitHub Pages**: 프론트엔드 UI 테스트, 빠른 검증
2. **Vercel**: 프로덕션 배포 (Edge Functions 포함)

Vercel 배포 한도가 리셋되면 Vercel로 전환하세요.

