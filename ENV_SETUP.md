# 환경 변수 설정 가이드

## .env.local 파일 설정

프로젝트 루트(`11.25/my_first_project/IdeaSpark/`)에 `.env.local` 파일을 생성하고 다음 내용을 복사하여 붙여넣으세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=https://djxiousdavdwwznufpzs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeGlvdXNkYXZkd3d6bnVmcHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTY3NjEsImV4cCI6MjA3OTczMjc2MX0.i2V-FZddBMUbUht8GuVMrMpWL1iNahSyHijsP_rAGSo

# Reddit API 설정 (Personal Use Script)
# Reddit 개발자 페이지: https://www.reddit.com/prefs/apps
# Personal Use Script를 client_id로 사용
VITE_REDDIT_CLIENT_ID=VDotRqwD04VR1c1bshVLbQ
# Secret은 Reddit 개발자 페이지에서 확인하세요
VITE_REDDIT_CLIENT_SECRET=여기에_Reddit_Secret_입력

# 로컬 개발 서버용 (서버 사이드에서 사용)
# .env.local에 추가하되, VITE_ 접두사 없이 사용
REDDIT_CLIENT_ID=VDotRqwD04VR1c1bshVLbQ
REDDIT_CLIENT_SECRET=여기에_Reddit_Secret_입력

# AI API 설정 (OpenRouter 무료 모델 사용 권장)
# OpenRouter: https://openrouter.ai/
# 무료 할당량: 일일 50회, 분당 20회
VITE_OPENROUTER_API_KEY=여기에_OpenRouter_API_Key_입력
VITE_OPENROUTER_MODEL=google/gemini-flash-1.5
# 다른 무료 모델 옵션:
# - meta-llama/llama-3.1-8b-instruct
# - mistralai/mistral-7b-instruct
# - google/gemini-flash-1.5 (기본값, 빠르고 무료)

# AI Provider 선택 (openrouter, openai, claude)
VITE_AI_PROVIDER=openrouter

# 기타 AI API (선택사항)
# VITE_OPENAI_API_KEY=
# VITE_CLAUDE_API_KEY=

# 번역 API 설정 (선택사항, 없으면 LibreTranslate 무료 버전 사용)
# Google Translate API (무료 티어: 월 500,000자)
# https://cloud.google.com/translate/docs/setup
GOOGLE_TRANSLATE_API_KEY=

# Papago API (무료 티어: 일 10,000자)
# https://developers.naver.com/apps/#/register
PAPAGO_CLIENT_ID=
PAPAGO_CLIENT_SECRET=

# 번역 API Provider 선택 (google, papago, libretranslate)
# libretranslate는 완전 무료이므로 API 키가 없어도 사용 가능
TRANSLATION_PROVIDER=libretranslate
```

## Reddit Secret 확인 방법

1. https://www.reddit.com/prefs/apps 접속
2. 로그인 후 생성한 앱 선택
3. "secret" 필드 확인
4. 위의 `VITE_REDDIT_CLIENT_SECRET`과 `REDDIT_CLIENT_SECRET`에 입력

## 로컬 개발 서버 실행

### 1. API 서버 실행 (터미널 1)
```bash
cd 11.25/my_first_project/IdeaSpark
npx tsx api/collect-ideas-local.ts
```

### 2. 개발 서버 실행 (터미널 2)
```bash
cd 11.25/my_first_project/IdeaSpark
npm run dev
```

## Vercel 배포 시 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

- `REDDIT_CLIENT_ID`: VDotRqwD04VR1c1bshVLbQ
- `REDDIT_CLIENT_SECRET`: (Reddit Secret)

## 중요 사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- Reddit Secret은 절대 공개하지 마세요
- 로컬 개발 시에는 두 개의 터미널이 필요합니다 (API 서버 + 개발 서버)

