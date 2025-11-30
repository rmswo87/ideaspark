# Vercel 배포 가이드

## 🚀 빠른 배포 (5분)

### 1단계: Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login
```

### 2단계: 프로젝트 배포

```bash
cd 11.25/my_first_project/IdeaSpark

# 배포 (첫 배포)
vercel

# 질문에 답변:
# - Set up and deploy? Y
# - Which scope? (본인 계정 선택)
# - Link to existing project? N
# - Project name? ideaspark (또는 원하는 이름)
# - Directory? ./
# - Override settings? N
```

### 3단계: 환경변수 설정

Vercel 대시보드에서 환경변수 설정:
1. https://vercel.com/dashboard 접속
2. `ideaspark` 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수 추가:

```
REDDIT_CLIENT_ID = VDotRqwD04VR1c1bshVLbQ
REDDIT_CLIENT_SECRET = (실제 Reddit Secret)
VITE_SUPABASE_URL = https://djxiousdavdwwznufpzs.supabase.co
VITE_SUPABASE_ANON_KEY = (Supabase Anon Key)
VITE_OPENROUTER_API_KEY = (OpenRouter API Key)
VITE_OPENROUTER_MODEL = google/gemini-flash-1.5
VITE_AI_PROVIDER = openrouter
```

**중요**: 
- `REDDIT_CLIENT_SECRET`은 **VITE_ 접두사 없이** 설정
- 나머지는 **VITE_ 접두사 포함**하여 설정

### 4단계: 재배포

```bash
# 환경변수 적용을 위해 재배포
vercel --prod
```

### 5단계: 배포 확인

배포 완료 후 제공되는 URL 확인:
- 예: `https://ideaspark.vercel.app`
- 이 URL에서 "아이디어 수집" 버튼 클릭하여 테스트

---

## 🔧 로컬 개발 (Vercel 배포 후)

### 단일 명령어로 개발 서버 실행

```bash
cd 11.25/my_first_project/IdeaSpark

# Vercel 개발 서버 실행 (Edge Function 포함)
vercel dev
```

**장점**:
- ✅ 단일 명령어로 모든 서버 실행
- ✅ Edge Function 자동 프록시
- ✅ 환경변수 자동 로드
- ✅ 프로덕션 환경과 동일한 구조

**더 이상 필요 없음**:
- ❌ `npm run dev:api` (별도 API 서버 불필요)
- ❌ `npm run dev` (Vercel dev가 모든 것 처리)

---

## 📋 배포 체크리스트

### 배포 전
- [ ] Vercel CLI 설치 완료
- [ ] Vercel 로그인 완료
- [ ] `.env.local` 파일에 모든 환경변수 설정 확인

### 배포 중
- [ ] `vercel` 명령어 실행
- [ ] 프로젝트 이름 설정
- [ ] 배포 완료 확인

### 배포 후
- [ ] Vercel 대시보드에서 환경변수 설정
- [ ] `vercel --prod` 재배포
- [ ] 배포 URL 확인
- [ ] "아이디어 수집" 버튼 테스트

---

## 🐛 문제 해결

### 문제 1: "vercel: command not found"
**해결**: `npm install -g vercel` 재실행

### 문제 2: 환경변수가 적용되지 않음
**해결**: 
1. Vercel 대시보드에서 환경변수 확인
2. `vercel --prod` 재배포

### 문제 3: Edge Function이 작동하지 않음
**해결**:
1. `vercel.json` 확인
2. `api/collect-ideas.ts` 파일 확인
3. Vercel 대시보드에서 Functions 탭 확인

---

## 🎯 다음 단계

배포 완료 후:
1. 실제 Reddit 데이터 수집 테스트
2. PRD 생성 테스트
3. 성능 모니터링
4. 에러 추적

