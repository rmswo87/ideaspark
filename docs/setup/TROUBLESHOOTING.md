# 문제 해결 가이드

## "Failed to fetch" 에러 해결 방법

### 문제
아이디어 수집 버튼을 클릭했을 때 "Failed to fetch" 또는 "로컬 API 서버에 연결할 수 없습니다" 에러가 발생합니다.

### 해결 방법

#### 1단계: 로컬 API 서버 실행 확인

**터미널 1에서 다음 명령어 실행:**
```bash
cd 11.25/my_first_project/IdeaSpark
npm run dev:api
```

**정상 실행 시 다음과 같은 메시지가 표시됩니다:**
```
Local API server running on http://localhost:3000
```

#### 2단계: 개발 서버 실행

**터미널 2에서 다음 명령어 실행:**
```bash
cd 11.25/my_first_project/IdeaSpark
npm run dev
```

#### 3단계: 환경 변수 확인

`.env.local` 파일에 다음이 설정되어 있는지 확인:
```env
REDDIT_CLIENT_ID=VDotRqwD04VR1c1bshVLbQ
REDDIT_CLIENT_SECRET=여기에_실제_Secret_입력
```

**중요:** `REDDIT_CLIENT_SECRET`은 `VITE_` 접두사 없이 설정해야 합니다 (서버 사이드에서만 사용).

#### 4단계: 포트 확인

- API 서버: `http://localhost:3000`
- 개발 서버: `http://localhost:5173` (또는 Vite가 지정한 포트)

두 서버가 모두 실행 중이어야 합니다.

### 자주 발생하는 문제

#### 문제 1: "로컬 API 서버에 연결할 수 없습니다"
- **원인:** API 서버가 실행되지 않음
- **해결:** 터미널 1에서 `npm run dev:api` 실행

#### 문제 2: "Reddit API credentials not configured"
- **원인:** `.env.local`에 `REDDIT_CLIENT_ID` 또는 `REDDIT_CLIENT_SECRET`이 없음
- **해결:** `.env.local` 파일 확인 및 수정

#### 문제 3: "Reddit OAuth error: 401"
- **원인:** Reddit API 키가 잘못되었거나 Secret이 틀림
- **해결:** Reddit 개발자 페이지에서 Secret 확인

#### 문제 4: 포트 3000이 이미 사용 중
- **원인:** 다른 프로그램이 포트 3000을 사용 중
- **해결:** 
  - 다른 프로그램 종료
  - 또는 `api/collect-ideas-local.ts`에서 `PORT` 값을 변경 (예: 3001)
  - `src/services/collector.ts`에서도 포트 번호 변경

### 빠른 확인 체크리스트

- [ ] 터미널 1에서 `npm run dev:api` 실행 중
- [ ] 터미널 2에서 `npm run dev` 실행 중
- [ ] `.env.local`에 `REDDIT_CLIENT_ID` 설정됨
- [ ] `.env.local`에 `REDDIT_CLIENT_SECRET` 설정됨 (VITE_ 접두사 없이)
- [ ] 브라우저에서 `http://localhost:5173` 접속 가능
- [ ] 브라우저 콘솔에 에러 없음

### 여전히 문제가 발생하는 경우

1. 브라우저 콘솔(F12)에서 에러 메시지 확인
2. 터미널에서 API 서버 로그 확인
3. `.env.local` 파일이 프로젝트 루트에 있는지 확인
4. Reddit API 키가 올바른지 확인

