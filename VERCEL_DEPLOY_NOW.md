# Vercel 배포 즉시 실행 가이드

## ⚠️ 현재 상태
- Vercel CLI 설치 완료 (버전 41.7.4)
- 로그인 필요 (아직 로그인 안 됨)
- 프로젝트 생성 안 됨

---

## 🚀 즉시 실행할 명령어

### 1단계: 로그인
```bash
cd E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark
vercel login
```

### 2단계: 프로젝트 생성 및 배포
```bash
vercel
```

**질문에 답변**:
1. Set up and deploy? → `Y`
2. Which scope? → 본인 계정 선택
3. Link to existing project? → `N`
4. What's your project's name? → `ideaspark`
5. In which directory? → `./`
6. Override settings? → `N`

### 3단계: 프로덕션 배포
```bash
vercel --prod
```

---

## 🔐 환경변수 설정 (배포 후 필수!)

Vercel 대시보드 → Settings → Environment Variables

**추가할 변수**:
- `REDDIT_CLIENT_ID` = VDotRqwD04VR1c1bshVLbQ
- `REDDIT_CLIENT_SECRET` = (실제 Secret)
- `VITE_SUPABASE_URL` = https://djxiousdavdwwznufpzs.supabase.co
- `VITE_SUPABASE_ANON_KEY` = (Anon Key)
- `VITE_OPENROUTER_API_KEY` = (OpenRouter Key)
- `VITE_OPENROUTER_MODEL` = meta-llama/llama-3.1-8b-instruct
- `VITE_AI_PROVIDER` = openrouter

---

**위 명령어들을 순서대로 실행하세요!**

