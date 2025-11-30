# Vercel 배포 실행 단계

## ✅ 준비 완료 사항

1. ✅ Vercel CLI 설치 확인 (버전 41.7.4)
2. ✅ `@vercel/node` 패키지 설치 완료
3. ✅ `vercel.json` 설정 완료
4. ✅ `api/collect-ideas.ts` Edge Function 준비 완료
5. ✅ `.vercelignore` 파일 생성 완료

---

## 🚀 배포 실행 단계

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
브라우저가 열리면 Vercel 계정으로 로그인하세요.

---

### Step 2: 프로젝트 배포

```bash
vercel
```

**질문에 답변** (순서대로):
1. **Set up and deploy "E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark"?** 
   → `Y` 입력

2. **Which scope do you want to deploy to?**
   → 본인 계정 선택 (예: `YourName`)

3. **Link to existing project?**
   → `N` 입력 (새 프로젝트 생성)

4. **What's your project's name?**
   → `ideaspark` 입력

5. **In which directory is your code located?**
   → `./` 입력 (현재 디렉토리)

6. **Want to override the settings?**
   → `N` 입력

**배포 완료 후**:
- Preview URL이 표시됩니다 (예: `https://ideaspark-xxx.vercel.app`)
- 이 URL은 Preview 환경입니다

---

### Step 3: 프로덕션 배포

```bash
vercel --prod
```

이 명령어로 프로덕션 환경에 배포됩니다.

---

### Step 4: 환경변수 설정 (중요!)

배포 완료 후 **반드시** Vercel 대시보드에서 환경변수를 설정해야 합니다:

1. https://vercel.com/dashboard 접속
2. `ideaspark` 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 다음 변수 추가:

#### 서버 사이드 환경변수 (VITE_ 접두사 없이)
```
REDDIT_CLIENT_ID = VDotRqwD04VR1c1bshVLbQ
REDDIT_CLIENT_SECRET = (실제 Reddit Secret)
```

#### 클라이언트 환경변수 (VITE_ 접두사 필요)
```
VITE_SUPABASE_URL = https://djxiousdavdwwznufpzs.supabase.co
VITE_SUPABASE_ANON_KEY = (Supabase Anon Key)
VITE_OPENROUTER_API_KEY = (OpenRouter API Key)
VITE_OPENROUTER_MODEL = google/gemini-flash-1.5
VITE_AI_PROVIDER = openrouter
```

**환경변수 적용 범위**:
- ✅ **Production**: 체크
- ✅ **Preview**: 체크 (선택)
- ❌ **Development**: 체크 해제

---

### Step 5: 환경변수 적용을 위한 재배포

환경변수 설정 후:
```bash
vercel --prod
```

재배포하여 환경변수를 적용합니다.

---

## ✅ 배포 확인

### 1. 배포 URL 확인
배포 완료 후 터미널에 표시되는 URL:
- Preview: `https://ideaspark-xxx.vercel.app`
- Production: `https://ideaspark.vercel.app` (또는 커스텀 도메인)

### 2. 기능 테스트
1. 배포 URL 접속
2. "아이디어 수집" 버튼 클릭
3. 실제 Reddit 데이터 수집 확인
4. PRD 생성 테스트

---

## 🔧 배포 후 로컬 개발

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

### Vercel 대시보드에서 확인:
1. **Deployments**: 배포 상태 확인
2. **Functions**: Edge Function 작동 확인
3. **Environment Variables**: 환경변수 설정 확인
4. **Logs**: 에러 로그 확인

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
3. Vercel 대시보드 → Functions 탭 확인
4. 빌드 로그 확인

---

**다음 단계**: 위 명령어들을 순서대로 실행하세요!

