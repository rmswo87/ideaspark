# 로컬 개발 가이드

## 로컬 개발 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 설정
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
VITE_AI_PROVIDER=openrouter

# API Provider (Vercel 또는 Supabase)
VITE_API_PROVIDER=vercel

# GitHub Pages 설정 (로컬에서는 필요 없음)
# VITE_GITHUB_PAGES=false
```

### 2. 로컬 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드 테스트

```bash
# 프로덕션 빌드 테스트
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 로컬에서 테스트할 항목

1. **필터링 기능**
   - 카테고리 필터
   - 서브레딧 필터
   - 정렬 옵션
   - 검색 기능

2. **모바일 반응형**
   - 화면 크기 조정 (Chrome DevTools)
   - 터치 인터랙션
   - 레이아웃 적응

3. **성능**
   - 로딩 속도
   - 메모리 사용량
   - 네트워크 요청

## 배포 전 체크리스트

- [ ] 로컬에서 모든 기능 정상 작동 확인
- [ ] 모바일 반응형 테스트 완료
- [ ] 빌드 에러 없음
- [ ] TypeScript 타입 에러 없음
- [ ] 콘솔 에러 없음
