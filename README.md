# IdeaSpark MVP

Reddit에서 실시간으로 수집한 아이디어를 분석하고 PRD로 변환하여 빠르게 MVP를 구축할 수 있도록 도와주는 AI 기반 아이디어 발굴 및 프로젝트 기획 플랫폼

## 최신 업데이트 (2025-11-27)

- WBS Gantt 차트 크기 최적화 완료
- PRD 생성 시 실제 아이디어 내용 기반 생성으로 개선
- 모든 TypeScript 빌드 에러 수정 완료

## 🚀 빠른 시작

### 로컬 개발 (Vercel 배포 후)

```bash
# 단일 명령어로 모든 서버 실행
vercel dev
```

### 프로덕션 배포

```bash
# Vercel에 배포
vercel --prod
```

## 📋 환경 변수 설정

`.env.local` 파일에 다음 환경변수를 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_MODEL=google/gemini-flash-1.5
VITE_AI_PROVIDER=openrouter
```

Vercel 배포 시에는 Vercel 대시보드에서 환경변수를 설정하세요.

## 🛠️ 기술 스택

- **Frontend**: React 19 + Vite + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Vercel (Edge Functions)
- **AI**: OpenRouter (무료 모델)
- **API**: Reddit API (OAuth2)

## 📚 문서

### 빠른 시작
- [환경 변수 설정](./docs/setup/ENV_SETUP.md)
- [로컬 개발 가이드](./docs/development/LOCAL_DEVELOPMENT.md)

### 배포
- [Vercel 배포 가이드](./docs/deployment/VERCEL_DEPLOY.md)
- [GitHub Pages 배포](./docs/deployment/GITHUB_PAGES_SETUP.md)
- [Supabase Edge Functions](./docs/deployment/SUPABASE_EDGE_FUNCTIONS_SETUP.md)

### 설정
- [OpenRouter API 설정](./docs/setup/OPENROUTER_SETUP.md)
- [Imgur 설정](./docs/setup/IMGUR_SETUP.md)
- [관리자 가이드](./docs/setup/ADMIN_GUIDE.md)
- [문제 해결 가이드](./docs/setup/TROUBLESHOOTING.md)

### 개발 문서
- [개발 진행 리포트](./docs/development/DEVELOPMENT_PROGRESS_REPORT.md)
- [세션 연속성 문서](./docs/development/SESSION_CONTINUITY.md)
- [리팩토링 계획](./docs/development/REFACTORING_PLAN.md)

전체 문서는 `docs/` 폴더를 참고하세요.
