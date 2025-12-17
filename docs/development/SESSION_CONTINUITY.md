# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 12월 5일  
**최종 업데이트**: 2025년 12월 15일  
**목적**: 새 채팅 세션에서 프로젝트 맥락을 빠르게 파악하고 작업을 이어갈 수 있도록 전체 상황 정리  
**대상**: AI Assistant 및 개발자

---

## ⚠️ 중요: Git 작업 경로 (절대 준수 필수)

### 프로젝트 경로
**절대 경로**: `E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark`  
**상대 경로**: `11.25/my_first_project/IdeaSpark`

### Git 작업 규칙
1. **반드시 프로젝트 폴더에서만 Git 작업 수행**
   ```bash
   cd "E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark"
   # 또는
   cd "11.25/my_first_project/IdeaSpark"
   ```

2. **최상위 cursor 폴더에서 Git 작업 금지**
   - ❌ `E:\study\Business\Develope\cursor`에서 git push 하면 안 됨
   - ✅ `11.25/my_first_project/IdeaSpark`에서만 git push 해야 함

3. **Git 저장소 확인 방법**
   ```bash
   git rev-parse --show-toplevel
   # 출력: E:/study/Business/Develope/cursor/11.25/my_first_project/IdeaSpark
   ```

4. **Remote 확인**
   ```bash
   git remote -v
   # 출력: origin  https://github.com/rmswo87/ideaspark.git (fetch)
   #      origin  https://github.com/rmswo87/ideaspark.git (push)
   ```

### GitHub 저장소 정보 (절대 변경 금지)

**공식 GitHub 저장소**: `https://github.com/rmswo87/ideaspark`

**약속사항**:
- ✅ **오직 `rmswo87/ideaspark` 저장소에만 푸시합니다**
- ❌ **다른 계정(`bzjay53` 등)이나 다른 저장소(`sparkideas-frontend` 등)에 절대 푸시하지 않습니다**
- ✅ **모든 배포는 `rmswo87/ideaspark` 저장소를 기준으로 합니다**
- ✅ **Vercel 배포는 `rmswo87/ideaspark` 저장소와 연결되어 있습니다**

---

## 📌 프로젝트 개요

### 프로젝트명
**IdeaSpark** - Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼

### 핵심 가치 제안
1. **실시간 아이디어 발굴**: Reddit API를 통한 다양한 분야의 불편함과 니즈 자동 수집
2. **자동화된 기획 문서**: AI 기반 PRD/개발계획서/제안서 자동 생성으로 기획 시간 90% 단축
3. **AI 기반 아이디어 평가**: 비타민/경쟁율/섹시함 점수로 아이디어 품질 평가
4. **개발 소식 피드**: Reddit에서 수집한 최신 개발 소식, AI 트렌드, 개발 팁 제공
5. **활발한 커뮤니티**: SNS 스타일 피드로 아이디어 공유 및 협업

### 타겟 사용자
- **주 타겟**: 개발자, 기획자, 창업가 (2030 세대)
- **부 타겟**: 프로젝트 매니저, 프리랜서 개발자

---

## 🏗️ 기술 스택 및 아키텍처

### 프론트엔드
- **프레임워크**: React 19.2.3 ✅ (보안 패치 완료, 2025-12-15)
- **빌드 도구**: Vite 7.2.4
- **언어**: TypeScript 5.9.3
- **UI 라이브러리**: 
  - Shadcn/UI (Radix UI 기반, tweakcn caffeine 테마 적용)
  - Tailwind CSS 4.1.17
  - Lucide React (아이콘)
- **라우팅**: React Router DOM 7.9.6
- **마크다운**: react-markdown 10.1.0, remark-gfm, rehype-raw
- **PDF 생성**: jspdf 3.0.4

### 백엔드 & 인프라
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **배포**: 
  - Vercel (프로덕션, 자동 배포) - https://ideaspark-pi.vercel.app
  - GitHub Pages (백업 배포)
- **서버리스 함수**: Vercel Edge Functions
- **이미지 저장**: Imgur API (기본값), Supabase Storage (선택)

### AI 서비스
- **AI Provider**: OpenRouter API
- **기본 모델**: `meta-llama/llama-3.1-8b-instruct` (무료)
- **대체 모델**: `google/gemini-flash-1.5` (무료)
- **용도**: PRD 생성, 개발 계획서 생성, 제안서 생성, 아이디어 평가

### 외부 API
- **Reddit API**: OAuth2 인증, 아이디어 수집, 개발 소식 수집
- **Imgur API**: 이미지 업로드 및 저장

### 데이터베이스 (Supabase PostgreSQL)
**주요 테이블**:
- `ideas`: Reddit에서 수집한 아이디어
- `prds`: 생성된 PRD 문서
- `development_plans`: 생성된 개발 계획서
- `proposals`: 생성된 제안서
- `idea_implementations`: 아이디어 실행 현황
- `idea_scores`: AI 기반 아이디어 평가 점수
- `premium_users`: 프리미엄 사용자
- `user_behaviors`: 사용자 행동 추적 (조회, 좋아요, 북마크, PRD 생성)
- `dev_news`: 개발 소식 (Reddit에서 수집)
- `posts`: 커뮤니티 게시글
- `comments`: 댓글
- `profiles`: 사용자 프로필
- `friends`: 친구 관계
- `messages`: 쪽지
- `contact_inquiries`: 문의/피드백
- `admins`: 관리자 목록

**참고**: 실행된 SQL 마이그레이션은 `docs/development/DATABASE_MIGRATIONS_SUMMARY.md` 참조

---

## 📊 현재 진행 상황 (2025-12-15 기준)

### 전체 완성도
- **MVP (Epic 0-6)**: **98%** 완료 ✅
- **모바일 최적화**: **100%** 완료 ✅
- **UI 개선**: **95%** 완료 ✅
- **개발 소식 시스템**: **90%** 완료 (개선 작업 진행 중)
- **전체 (Epic 0-8)**: **95%** 완료

### 최근 완료된 작업 (2025-12-05 ~ 2025-12-15)

#### 1. React 보안 취약점 패치 ✅
**완료일**: 2025년 12월 15일

**구현 내용**:
- ✅ React 및 React-DOM 19.2.0 → 19.2.3 업데이트 (최신 보안 패치)
- ✅ esbuild 보안 취약점 해결 (0.27.1로 오버라이드)
- ✅ path-to-regexp 보안 취약점 해결 (8.3.0으로 오버라이드)
- ✅ undici 보안 취약점 해결 (7.16.0으로 오버라이드)
- ✅ package.json에 overrides 추가
- ✅ 모든 보안 취약점 해결 완료 (0 vulnerabilities)
- ✅ 빌드 테스트 성공

**참고**: 
- `npm audit`: 0 vulnerabilities 확인
- 프로덕션 배포 준비 완료

#### 2. 프리미엄 추천 아이디어 깜빡임 문제 해결 ✅
**완료일**: 2025년 12월 7일

**구현 내용**:
- ✅ `HomePage.tsx`에서 깜빡임 문제가 있던 `PremiumRecommendedIdeas` 컴포넌트 제거
- ✅ 프리미엄 추천 아이디어 화면 표시 기능 제거 (깜빡임 문제 해결)

**참고**: 이메일 알림 서비스는 향후 계획으로 이동 (Resend가 유료 서비스이므로, 서비스가 진짜 필요한 사용자가 많이 생기면 추가 예정)

#### 3. 자동 아이디어 수집 Cron Job 구현 ✅
**완료일**: 2025년 12월 15일

**구현 내용**:
- ✅ `api/cron/collect-ideas.ts` 구현 완료
- ✅ Vercel Cron Job 설정 (`vercel.json`에 스케줄 추가)
- ✅ 스케줄: 매일 9시, 18시 UTC (한국시간 18시, 다음날 3시)
- ✅ CRON_SECRET을 통한 보안 인증 구현
- ✅ Reddit OAuth2 인증 로직 재사용
- ✅ 중복 아이디어 필터링 (reddit_id 기준)
- ✅ 이미지 URL 추출 및 저장

**참고**: 
- 수동 수집 API: `api/collect-ideas.ts` (관리자 권한 필요)
- 자동 수집 Cron: `api/cron/collect-ideas.ts` (Vercel Cron Secret으로 보호)

---

## 🚨 현재 문제 및 해결 필요 사항

### 1. Vercel 자동 배포 미작동 ⚠️ (긴급)
**상태**: 진행 중  
**우선순위**: 최우선 (P0)

**문제 설명**:
- GitHub에 push는 성공하지만 Vercel 자동 배포가 트리거되지 않음
- 최근 커밋: `67a1356` (`.gitignore` merge conflict 해결)
- Vercel 대시보드에 최신 커밋으로 배포가 시작되지 않음

**확인 사항**:
- ✅ Git 저장소: `rmswo87/ideaspark` (올바름)
- ✅ Vercel 프로젝트 ID: `prj_4GqulAzDmUyDB4NHNuMC07zPrLfX`
- ✅ Vercel 프로젝트명: `ideaspark-pi`
- ✅ Git 연결 상태: 연결됨 (사용자 확인)
- ✅ Production Branch: `main` (사용자 확인)
- ❌ GitHub Webhook: 확인 필요
- ❌ Vercel 자동 배포: 작동 안 함

**해결 시도**:
1. ✅ GitHub 재연결 (사용자 수행)
2. ✅ 빈 커밋으로 재배포 시도
3. ✅ `vercel.json` 수정으로 재배포 시도
4. ⏳ GitHub Webhook 설정 확인 필요

**다음 단계**:
1. Vercel 대시보드에서 배포 상태 확인
2. GitHub Webhook 설정 확인 (`Settings → Webhooks`)
3. 필요시 수동 재배포
4. Vercel 로그 확인

**참고 문서**: `docs/deployment/GITHUB_WEBHOOK_SETUP.md`

---

## 📋 진행 중인 작업

### 1. Vercel 자동 배포 문제 해결
**상태**: 진행 중  
**우선순위**: 최우선

**작업 내용**:
- [ ] GitHub Webhook 설정 확인
- [ ] Vercel Git 연결 상태 재확인
- [ ] 배포 로그 확인
- [ ] 필요시 수동 재배포

---

## 📝 남은 Task (우선순위별)

### P0 (즉시 처리 필요)

#### 1. Vercel 자동 배포 문제 해결 ⭐⭐⭐
**우선순위**: 최우선  
**예상 시간**: 1-2시간  
**상태**: 진행 중

**작업 내용**:
- [ ] GitHub Webhook 설정 확인 및 수정
- [ ] Vercel Git 연결 재확인
- [ ] 배포 로그 분석
- [ ] 자동 배포 정상화 확인

**참고**: 
- Vercel 프로젝트: `ideaspark-pi` (`prj_4GqulAzDmUyDB4NHNuMC07zPrLfX`)
- GitHub 저장소: `rmswo87/ideaspark`
- Production Branch: `main`

#### 2. Cron Job 배포 확인 ⭐⭐
**우선순위**: 높음  
**예상 시간**: 30분  
**상태**: 대기

**작업 내용**:
- [ ] Vercel 배포 완료 후 Cron Job 활성화 확인
- [ ] `CRON_SECRET` 환경 변수 설정 확인
- [ ] 첫 번째 스케줄 실행 확인 (매일 9시, 18시 UTC)
- [ ] 수집 로그 확인

**참고**: 
- Cron Job 경로: `/api/cron/collect-ideas`
- 스케줄: `0 9,18 * * *` (매일 9시, 18시 UTC)

### P1 (단기 - 1주 내)

#### 3. 개발 소식 자동 수집 검증
**우선순위**: 중간  
**예상 시간**: 1시간  
**상태**: 대기

**작업 내용**:
- [ ] 개발 소식 수집 테스트
- [ ] 데이터베이스 저장 확인
- [ ] UI 표시 확인
- [ ] 카테고리 분류 정확도 확인

#### 4. 프리미엄 추천 아이디어 이메일 알림 (향후 계획)
**우선순위**: 낮음  
**예상 시간**: 3-5일  
**상태**: 보류

**작업 내용**:
- [ ] Resend API 연동 (유료 서비스)
- [ ] 이메일 템플릿 작성
- [ ] 스케줄링 설정

**참고**: 서비스가 진짜 필요한 사용자가 많이 생기면 추가 예정

### P2 (중기 - 2-3주 내)

#### 5. 개발 소식 필터링 및 검색 기능
**우선순위**: 낮음  
**예상 시간**: 2-3일

**작업 내용**:
- [ ] 카테고리별 필터링
- [ ] 서브레딧별 필터링
- [ ] 태그별 필터링
- [ ] 검색 기능 추가
- [ ] 정렬 옵션 (인기순, 최신순)

---

## 🔧 개발 환경 설정

### 필수 환경 변수 (로컬)
`.env.local` 파일에 다음 변수 설정:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 필수 환경 변수 (Vercel)
Vercel 대시보드 → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENROUTER_API_KEY`
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `CRON_SECRET` (Cron Job 보안용)
- `SUPABASE_SERVICE_ROLE_KEY` (관리자 권한 확인용)

### 로컬 개발 서버 실행
```bash
cd "11.25/my_first_project/IdeaSpark"
npm install
npm run dev
```

### 빌드 테스트
```bash
npm run build
```

---

## 📚 주요 문서 위치

- **세션 연속성**: `docs/development/SESSION_CONTINUITY.md` (현재 문서)
- **데이터베이스 마이그레이션**: `docs/development/DATABASE_MIGRATIONS_SUMMARY.md`
- **배포 가이드**: `docs/deployment/VERCEL_DEPLOY.md`
- **GitHub Webhook 설정**: `docs/deployment/GITHUB_WEBHOOK_SETUP.md`
- **API 제공자 설정**: `docs/deployment/API_PROVIDER_SETUP.md`
- **다음 단계**: `docs/development/NEXT_STEPS_AFTER_DEV_NEWS.md`

---

## 🎯 새 채팅 시작 시 확인 사항

1. **프로젝트 경로 확인**
   - 작업 디렉토리가 `11.25/my_first_project/IdeaSpark`인지 확인
   - 최상위 cursor 폴더에서 작업하지 않도록 주의

2. **Git 저장소 확인**
   ```bash
   git rev-parse --show-toplevel
   git remote -v
   ```

3. **현재 브랜치 및 상태 확인**
   ```bash
   git status
   git log --oneline -5
   ```

4. **Vercel 배포 상태 확인**
   - Vercel 대시보드에서 최신 배포 확인
   - 자동 배포가 작동하는지 확인

5. **환경 변수 확인**
   - 로컬: `.env.local` 파일 확인
   - Vercel: 대시보드에서 환경 변수 확인

---

**마지막 업데이트**: 2025년 12월 15일  
**다음 업데이트 예정**: Vercel 배포 문제 해결 후
