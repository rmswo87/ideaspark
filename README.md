# IdeaSpark MVP

Reddit에서 실시간으로 수집한 아이디어를 분석하고 PRD로 변환하여 빠르게 MVP를 구축할 수 있도록 도와주는 AI 기반 아이디어 발굴 및 프로젝트 기획 플랫폼

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

- [진행 상황 보고서](./PROGRESS_REPORT.md)
- [Vercel 배포 가이드](./VERCEL_DEPLOY.md)
- [환경 변수 설정 가이드](./ENV_SETUP.md)
- [관리자 가이드](./ADMIN_GUIDE.md)
- [문제 해결 가이드](./TROUBLESHOOTING.md)