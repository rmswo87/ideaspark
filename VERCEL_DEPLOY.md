# Vercel 배포 단계별 가이드

## 🎯 목표
IdeaSpark 프로젝트를 Vercel에 배포하여 프로덕션 환경 구축

---

## 📋 배포 전 체크리스트

### 1단계: 프로젝트 준비 확인
- [x] `vercel.json` 파일 존재 확인
- [x] `api/collect-ideas.ts` Edge Function 준비 완료
- [x] `package.json` 빌드 스크립트 확인
- [x] `.vercelignore` 파일 생성 완료

### 2단계: Vercel CLI 확인
- [x] Vercel CLI 설치 확인 (버전 41.7.4)
- [ ] Vercel 로그인 확인 필요

---

## 🚀 배포 단계

### Step 1: Vercel 로그인 확인

터미널에서 다음 명령어 실행:
```bash
cd E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark
vercel whoami
```

**로그인되지 않은 경우**:
```bash
vercel login
```
브라우저가 열리면 Vercel 계정으로 로그인

### Step 2: 프로젝트 배포

```bash
vercel
```

**질문에 답변**:
1. **Set up and deploy?** → `Y` 입력
2. **Which scope?** → 본인 계정 선택
3. **Link to existing project?** → `N` 입력 (새 프로젝트)
4. **What's your project's name?** → `ideaspark` 입력
5. **In which directory is your code located?** → `./` 입력 (현재 디렉토리)
6. **Want to override the settings?** → `N` 입력

### Step 3: 프로덕션 배포

```bash
vercel --prod
```

---

## 🔐 환경변수 설정

배포 완료 후 Vercel 대시보드에서 환경변수 설정:

1. https://vercel.com/dashboard 접속
2. `ideaspark` 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 다음 변수 추가:

### 필수 환경변수

```
REDDIT_CLIENT_ID = VDotRqwD04VR1c1bshVLbQ
REDDIT_CLIENT_SECRET = (실제 Reddit Secret - VITE_ 접두사 없이)
```

### 클라이언트 환경변수 (VITE_ 접두사 필요)

```
VITE_SUPABASE_URL = https://djxiousdavdwwznufpzs.supabase.co
VITE_SUPABASE_ANON_KEY = (Supabase Anon Key)
VITE_OPENROUTER_API_KEY = (OpenRouter API Key)
VITE_OPENROUTER_MODEL = google/gemini-flash-1.5
VITE_AI_PROVIDER = openrouter
```

**중요**: 
- `REDDIT_CLIENT_SECRET`은 **VITE_ 접두사 없이** 설정 (서버 사이드 전용)
- 나머지는 **VITE_ 접두사 포함**하여 설정 (클라이언트에서 사용)

### 환경변수 적용 범위
- **Production**: ✅ 체크
- **Preview**: ✅ 체크 (선택)
- **Development**: ❌ 체크 해제 (로컬 `.env.local` 사용)

### Step 4: 환경변수 적용을 위한 재배포

```bash
vercel --prod
```

---

## ✅ 배포 확인

### 배포 URL 확인
배포 완료 후 터미널에 표시되는 URL:
- 예: `https://ideaspark-xxx.vercel.app`
- 또는 `https://ideaspark.vercel.app` (커스텀 도메인 설정 시)

### 기능 테스트
1. 배포 URL 접속
2. "아이디어 수집" 버튼 클릭
3. 실제 Reddit 데이터 수집 확인
4. PRD 생성 테스트

---

## 🔧 로컬 개발 (배포 후)

### Vercel 개발 서버 사용 (권장)

```bash
cd E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark
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

## 📊 배포 후 확인 사항

### 1. Edge Function 확인
- Vercel 대시보드 → Functions 탭
- `/api/collect-ideas` 함수 확인

### 2. 환경변수 확인
- Vercel 대시보드 → Settings → Environment Variables
- 모든 환경변수 설정 확인

### 3. 빌드 로그 확인
- Vercel 대시보드 → Deployments
- 최신 배포의 빌드 로그 확인

### 4. 에러 확인
- Vercel 대시보드 → Functions → Logs
- 에러 로그 확인

---

## 🐛 문제 해결

### 문제 1: "vercel: command not found"
**해결**: 
```bash
npm install -g vercel
```

### 문제 2: 로그인 실패
**해결**: 
```bash
vercel logout
vercel login
```

### 문제 3: 환경변수가 적용되지 않음
**해결**: 
1. Vercel 대시보드에서 환경변수 확인
2. `vercel --prod` 재배포

### 문제 4: Edge Function이 작동하지 않음
**해결**:
1. `vercel.json` 확인
2. `api/collect-ideas.ts` 파일 확인
3. Vercel 대시보드에서 Functions 탭 확인
4. 빌드 로그 확인

---

## 📝 다음 단계

배포 완료 후:
1. ✅ 실제 Reddit 데이터 수집 테스트
2. ✅ PRD 생성 테스트
3. ✅ 성능 모니터링
4. ✅ 에러 추적

---

**배포 완료 후**: `vercel dev` 명령어로 단일 서버 개발 환경 사용 가능
