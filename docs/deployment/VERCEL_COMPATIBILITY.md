# Vercel 호환성 가이드

## ✅ Vercel 복귀 시 코드 충돌 없음

현재 코드는 **Vercel과 GitHub Pages 모두에서 정상 작동**하도록 설계되었습니다.

### 환경 변수 기반 분기

1. **`VITE_GITHUB_PAGES` 환경 변수**
   - GitHub Pages: `VITE_GITHUB_PAGES=true` 설정
   - Vercel: 환경 변수 미설정 (기본값 `undefined`)

2. **`basename` 설정** (`src/App.tsx`)
   ```typescript
   const basename = import.meta.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark' : undefined;
   ```
   - GitHub Pages: `/ideaspark` 사용
   - Vercel: `undefined` (기본 경로 `/` 사용)

3. **`base` 설정** (`vite.config.ts`)
   ```typescript
   base: process.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark/' : '/',
   ```
   - GitHub Pages: `/ideaspark/` 사용
   - Vercel: `/` 사용

### 파일별 역할

| 파일 | GitHub Pages | Vercel | 설명 |
|------|-------------|--------|------|
| `public/404.html` | ✅ 사용 | ❌ 무시 | SPA 라우팅 지원 |
| `vercel.json` | ❌ 무시 | ✅ 사용 | Vercel rewrites 설정 |
| `.github/workflows/deploy-gh-pages.yml` | ✅ 사용 | ❌ 무시 | GitHub Actions 워크플로우 |

### Vercel 복귀 시 체크리스트

1. **환경 변수 확인**
   - Vercel 대시보드에서 `VITE_GITHUB_PAGES` 환경 변수 **제거** (또는 설정 안 함)
   - 다른 환경 변수는 그대로 유지

2. **배포 확인**
   - Vercel 자동 배포가 정상 작동하는지 확인
   - `vercel.json`의 `rewrites` 설정이 SPA 라우팅을 처리하는지 확인

3. **코드 변경 불필요**
   - ✅ `src/App.tsx` - 환경 변수로 자동 분기
   - ✅ `vite.config.ts` - 환경 변수로 자동 분기
   - ✅ `vercel.json` - Vercel 전용 설정 (GitHub Pages에서 무시됨)
   - ✅ `public/404.html` - GitHub Pages 전용 (Vercel에서 무시됨)

### 주의사항

- **환경 변수만 제거하면 됩니다**: Vercel에서 `VITE_GITHUB_PAGES` 환경 변수를 설정하지 않으면 자동으로 Vercel 모드로 작동합니다.
- **코드 수정 불필요**: 모든 분기 처리는 환경 변수로 자동화되어 있습니다.
- **`vercel.json` 유지**: Vercel 배포 시 SPA 라우팅을 위해 필요합니다.

## 🔄 GitHub Pages ↔ Vercel 전환

### GitHub Pages → Vercel
1. Vercel 프로젝트 연결
2. 환경 변수 설정 (Vercel 대시보드)
   - `VITE_GITHUB_PAGES` **제거** (또는 설정 안 함)
   - 다른 환경 변수는 그대로 설정
3. 자동 배포 확인

### Vercel → GitHub Pages
1. GitHub Actions 워크플로우 확인
2. GitHub Secrets에 환경 변수 설정
   - `VITE_GITHUB_PAGES=true` 추가
   - 다른 환경 변수도 설정
3. `main` 브랜치에 푸시하여 배포 트리거

## 📝 요약

**코드는 이미 Vercel과 GitHub Pages 모두를 지원하도록 설계되어 있습니다.**
- 환경 변수만으로 자동 분기
- 추가 코드 수정 불필요
- 충돌 없이 안전하게 전환 가능

