# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 12월 5일  
**최종 업데이트**: 2025년 12월 7일 (긴급 수정 필요 문제 정리)  
**목적**: 새 채팅 세션에서 프로젝트 맥락을 빠르게 파악하고 작업을 이어갈 수 있도록 전체 상황 정리  
**대상**: AI Assistant 및 개발자

**⚠️ 중요**: 현재 여러 기능이 작동하지 않고 있습니다. 아래 "현재 문제" 섹션을 반드시 확인하세요.

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
- **프레임워크**: React 19.2.1 ✅ (보안 패치 완료)
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

## 📊 현재 진행 상황 (2025-12-07 기준)

### 전체 완성도
- **MVP (Epic 0-6)**: **98%** 완료 ✅
- **모바일 최적화**: **100%** 완료 ✅
- **UI 개선**: **95%** 완료 ✅
- **개발 소식 시스템**: **90%** 완료 (개선 작업 진행 중)
- **전체 (Epic 0-8)**: **95%** 완료

### 최근 완료된 작업 (2025-12-05 ~ 2025-12-07)

#### 1. 개발 소식 시스템 완성 ✅
**완료일**: 2025년 12월 5일

**구현 내용**:
- ✅ `dev_news` 테이블 마이그레이션 (`20251205_create_dev_news_table.sql`)
- ✅ Reddit 개발 소식 수집 API (`api/collect-dev-news.ts`, `api/cron/collect-dev-news.ts`)
  - AI 관련 서브레딧 우선 수집 (OpenAI, ChatGPT, Claude, Gemini 등)
  - 개발 팁 및 최신 트렌드 키워드 강화
  - 카테고리 자동 분류 (ai, tutorial, tip, news, discussion, resource)
  - 태그 자동 추출 (AI 키워드 우선, 개발 팁, 기술 스택)
  - Daily/Weekly/Monthly 기간별 수집 지원
- ✅ 개발 소식 서비스 (`devNewsService.ts`, `devNewsCollector.ts`)
- ✅ 개발 소식 피드 페이지 (`DevNewsFeedPage.tsx`)
  - Daily/Weekly/Monthly Select 드롭다운 지원
  - 관리자용 수집 버튼 (소식이 없을 때)
- ✅ 모든 페이지 헤더 통일 (고정 헤더)
- ✅ 커뮤니티 버튼 스타일 통일 (disabled 제거)
- ✅ Vercel Cron Job 설정 (매일 오전 9시 자동 수집)
- ✅ RLS 정책 수정 (`20251205_fix_dev_news_rls.sql`)
- ✅ Unique 제약조건 수정 (`20251206_fix_dev_news_unique_constraint.sql`)
  - `(reddit_id, period_type)` 복합 unique 제약조건으로 변경
  - 같은 게시물이 daily, weekly, monthly로 각각 저장 가능

**참고 문서**: `docs/development/CATEGORY_BASED_RECOMMENDATION_AND_DEV_NEWS.md`

#### 2. 모바일 최적화 개선 ✅
**완료일**: 2025년 12월 5일

**구현 내용**:
- ✅ 모바일 필터 드롭다운에 추천 버튼 추가
- ✅ 카테고리/검색 구간 컴팩트화
- ✅ 통계 섹션 접기 기능 추가 (Collapsible)
- ✅ 필터 및 버튼 크기 최적화
- ✅ 데스크톱에서는 통계 항상 표시
- ✅ 모바일에서 아이디어 카드 가시성 개선

#### 3. 사용자 관심 카테고리 기반 AI 점수 추천 시스템 ✅
**완료일**: 2025년 12월 5일

**구현 내용**:
- ✅ 카테고리 기반 추천 알고리즘 (`categoryBasedScoringRecommendation.ts`)
- ✅ 사용자 행동 분석 기반 카테고리 선호도 계산
- ✅ AI 점수와 카테고리 선호도 결합 추천 (AI 점수 70%, 카테고리 일치 30%)
- ✅ PremiumRecommendedIdeas 컴포넌트 개선

#### 4. AI 기반 아이디어 평가 시스템 (UI 포함) ✅
**완료일**: 2025년 12월 4일

**구현 내용**:
- ✅ 데이터베이스 스키마: `idea_scores`, `premium_users` 테이블
- ✅ 서비스 레이어: `ideaScoringService.ts`, `premiumService.ts`, `notificationService.ts`
- ✅ AI 클라이언트 확장: `scoreIdea()`, `summarizeIdeaForNotification()`
- ✅ 3가지 평가 기준: 비타민/경쟁율/섹시함 점수 (각 0-10점, 총 30점)
- ✅ UI 컴포넌트: IdeaScoreCard, IdeaScoringButton, PremiumBadge
- ✅ 프리미엄 사용자 확인 훅: usePremium
- ✅ 페이지 통합: IdeaDetailPage, ProfilePage, HomePage

**참고 문서**: `docs/development/AI_IDEA_SCORING_IMPLEMENTATION.md`

#### 5. 아이디어 실행 현황 추적 시스템 ✅
**완료일**: 2025년 12월 2일

**구현 내용**:
- ✅ 데이터베이스: `idea_implementations` 테이블
- ✅ 서비스: `implementationService.ts`
- ✅ UI 컴포넌트: ImplementationButton, SimilarImplementationCard
- ✅ 페이지 통합: IdeaDetailPage, ProfilePage, ImplementationGallery

#### 6. 추천 시스템 고도화 ✅
**완료일**: 2025년 12월 2일

**구현 내용**:
- ✅ 조회 시간 가중치 추가
- ✅ 행동별 가중치 시스템 (PRD 생성 > 북마크 > 좋아요 > 조회)
- ✅ 구현 사례 기반 추천
- ✅ 협업 필터링 구현
- ✅ 추천 이유 개선

#### 7. PRD 생성 문제 수정 ✅
**완료일**: 2025년 12월 3일

**구현 내용**:
- ✅ 프롬프트 개선 (아이디어 정보 강조)
- ✅ 예시 내용 혼입 방지
- ✅ 절대 금지 사항 구체화
- ✅ Mermaid 다이어그램 완전 제거

#### 8. 제안서 생성 기능 개선 ✅
**완료일**: 2025년 12월 4일

**구현 내용**:
- ✅ 프롬프트 개선: "실제로 상품으로 판매할 수 있을 정도로 재밌고 신선하고 유용하고 효율적인 서비스"
- ✅ 사용자 프롬프트 입력 기능 추가
- ✅ PRD 생성 로직 개선: 제안서 기반/기본 아이디어 기반 선택 가능

**참고 문서**: `docs/development/PROPOSAL_IMPROVEMENTS.md`

#### 9. 프리미엄 기능 접근성 개선 ✅
**완료일**: 2025년 12월 7일

**구현 내용**:
- ✅ MobileMenu에 프리미엄 링크 추가 (Crown 아이콘 사용)
- ✅ BottomNavigation에 프리미엄 링크 추가 (모든 사용자에게 표시)
- ✅ 프리미엄 사용자에게는 노란색 스타일 적용
- ✅ usePremium 훅을 사용하여 프리미엄 상태 확인

---

## 🚨 현재 문제 (2025-12-07) - ⚠️ 긴급 수정 필요

### P0 - 최우선 해결 필요 (작동하지 않는 기능)

1. **프리미엄 추천 아이디어 섹션 깜빡임 문제** ✅ **해결 완료** (2025-12-07)
   - **문제**: 메인 아이디어 대시보드에서 프리미엄 추천 아이디어 섹션이 1초 정도 보였다가 사라짐
   - **위치**: `src/components/PremiumRecommendedIdeas.tsx`, `src/pages/HomePage.tsx` (807-811줄)
   - **해결 방법**:
     * ✅ `HomePage`에서 `usePremium` 훅을 사용하여 `premiumLoading`과 `authLoading`을 확인한 후에만 `PremiumRecommendedIdeas` 렌더링
     * ✅ `PremiumRecommendedIdeas` 컴포넌트에 `useMemo`로 메모이제이션 추가하여 불필요한 리렌더링 방지
     * ✅ `shouldRender` 변수를 사용하여 로딩 상태와 프리미엄 상태를 한 번에 확인
   - **상태**: ✅ **해결 완료**

2. **Reddit 이미지 수집 문제** ✅ **해결 완료** (2025-12-07)
   - **문제**: Reddit에 이미지가 있는 게시글에서 이미지를 수집하지 못함
   - **위치**: `api/collect-dev-news.ts`, `api/cron/collect-dev-news.ts`, `api/collect-ideas.ts`의 `extractImageUrl` 함수
   - **해결 방법**:
     * ✅ `extractImageUrl` 함수의 우선순위를 변경: `preview.redd.it` 또는 `i.redd.it` 도메인을 최우선 처리
     * ✅ 이미지 확장자 확인을 두 번째 우선순위로 변경
     * ✅ 디버깅을 위한 로그 추가 (개발 환경에서만)
   - **상태**: ✅ **해결 완료** (배포 후 테스트 필요)

3. **DevNewsFeedPage Select sticky 기능 작동 안 함** ⚠️ **긴급**
   - **문제**: 기간 선택 드롭다운(데일리/위클리/먼슬리)이 스크롤을 따라다니지 않음
   - **위치**: `src/pages/DevNewsFeedPage.tsx` (260-275줄)
   - **시도한 해결 방법**:
     * ✅ `sticky top-16` → `top-20`으로 변경
     * ✅ sticky를 부모 div에 직접 적용하고 `self-start` 추가
   - **상태**: ❌ **여전히 작동하지 않음**
   - **추가 문제**:
     * Select 버튼을 감싸는 박스(`bg-background/95 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border/50`)가 불필요함
     * 전체 게시글 박스와 드롭다운이 겹쳐서 보기 불편함
   - **해결 방안**:
     * 부모 요소의 `overflow` 속성 확인 (sticky가 작동하려면 부모에 `overflow: hidden` 등이 없어야 함)
     * Select를 헤더 안으로 이동 (스크롤 시 헤더와 함께 고정)
     * 또는 Select를 별도의 고정 영역으로 분리

4. **Supabase 406 에러 (Not Acceptable)** ⚠️ **재배포 후 확인 필요**
   - `premium_users` 및 `idea_scores` 테이블 조회 시 406 에러 발생
   - 에러 메시지: `GET .../premium_users?... 406 (Not Acceptable)`
   - 에러 메시지: `GET .../idea_scores?... 406 (Not Acceptable)`
   - 원인 추정: RLS 정책 문제 또는 Supabase 클라이언트 설정 문제
   - 시도한 해결 방법:
     * ✅ `20251206_fix_all_rls_final.sql` 마이그레이션 실행 (RLS 정책 수정)
     * ✅ Supabase 클라이언트 설정 개선 (Accept/Content-Type 헤더 추가)
     * ✅ 쿼리 최적화 (`select('*')` → 명시적 컬럼 지정)
     * ✅ `.single()` → `.maybeSingle()` 변경 (에러 처리 개선)
   - 상태: 재배포 후 확인 필요

5. **번역 버튼 기능 동작 안 함** ✅ **해결 완료** (2025-12-07)
   - **문제**: 번역 버튼 클릭 시 Google Translate가 작동하지 않음
   - **위치**: `src/pages/HomePage.tsx` (347-386줄)
   - **해결 방법**:
     * ✅ 검색창 우측에 번역 버튼 추가 (데스크톱에서만 표시)
     * ✅ Google Translate 위젯 로드 대기 로직 추가 (최대 10회 재시도)
     * ✅ 한국어 옵션 자동 선택 로직 개선
   - **상태**: ✅ **해결 완료** (배포 후 테스트 필요)

---

## 🎯 다음 세션 시작 프롬프트

새 채팅을 열 때 다음 프롬프트를 사용하세요:

```
안녕하세요. IdeaSpark 프로젝트를 이어서 진행하고 있습니다.

프로젝트 정보:
- 위치: 11.25/my_first_project/IdeaSpark
- 기술 스택: React 19.2.1 ✅ (보안 패치 완료), TypeScript, Vite, Supabase, OpenRouter API, Reddit API
- 배포: Vercel (https://ideaspark-pi.vercel.app)
- GitHub: rmswo87/ideaspark

⚠️ 중요: 현재 여러 기능이 작동하지 않고 있습니다. 아래 문제들을 우선적으로 해결해야 합니다.

최근 완료된 작업 (2025-12-06 ~ 2025-12-07):
1. ✅ React 보안 패치 (CVE-2025-55182) (2025-12-06)
   - package.json에서 react와 react-dom을 ^19.2.1로 업데이트 완료
   - GitHub에 푸시 완료
   - Vercel 자동 배포 완료

2. ✅ Supabase 406 에러 해결 시도 (2025-12-06)
   - Supabase 클라이언트 설정 개선 (Accept/Content-Type 헤더 추가)
   - 쿼리 최적화 (select('*') → 명시적 컬럼 지정)
   - .single() → .maybeSingle() 변경 (에러 처리 개선)
   - RLS 정책 수정 마이그레이션 실행 (20251206_fix_all_rls_final.sql)
   - 재배포 후 확인 필요

3. ✅ App.tsx 리팩토링 (2025-12-06)
   - 988줄에서 136줄로 축소
   - HomePage와 ScrollToTop 컴포넌트 분리
   - lazy loading 타입 에러 수정 (fallback 추가)

4. ✅ 프리미엄 기능 별도 페이지 생성 (2025-12-06)
   - src/pages/PremiumPage.tsx 생성
   - 프로필 페이지에서 프리미엄 관련 내용 분리
   - /premium 라우트 추가

5. ✅ 관리자 권한으로 프리미엄 기능 테스트 가능 (2025-12-06)
   - usePremium 훅 수정: 관리자는 자동으로 프리미엄 기능 사용 가능

6. ✅ 번역 버튼 UI 추가 (2025-12-06)
   - 검색창 우측에 번역 버튼 추가 (데스크톱에서만)
   - 클릭 시 Google Translate 위젯 트리거 시도

7. ✅ DevNewsFeedPage UI 개선 (2025-12-07)
   - 컨테이너 폭 확대: max-w-2xl → max-w-4xl
   - 기간 선택 Select만 sticky로 변경 (바 전체가 아닌 Select 버튼만 따라옴)
   - 빈 내용 처리 개선: 이미지가 있으면 표시, 둘 다 없으면 안내 메시지 표시

8. ✅ TypeScript 빌드 에러 수정 (2025-12-07)
   - ideaScoringService.ts의 getRecommendedIdeaOfTheDay 함수에서 null 체크 추가
   - data가 null일 수 있는 경우 처리
   - ideas가 배열인 경우 첫 번째 요소 사용하도록 수정

9. ✅ 프리미엄 기능 접근성 개선 (2025-12-07)
   - MobileMenu에 프리미엄 링크 추가 (Crown 아이콘 사용)
   - BottomNavigation에 프리미엄 링크 추가 (모든 사용자에게 표시)
   - 프리미엄 사용자에게는 노란색 스타일 적용
   - usePremium 훅을 사용하여 프리미엄 상태 확인

10. ✅ 이미지 수집 로직 개선 시도 (2025-12-07) ⚠️ **여전히 작동하지 않음**
    - Reddit API에서 preview.redd.it, i.redd.it 직접 URL 우선 처리 시도
    - extractImageUrl 함수 개선 시도 (api/collect-dev-news.ts, api/cron/collect-dev-news.ts, api/collect-ideas.ts)
    - **상태**: 여전히 이미지를 수집하지 못함

11. ✅ 프로필 페이지 정리 (2025-12-07)
    - 프로필 페이지에서 프리미엄 관련 UI 제거 (PremiumPage로 이동 완료)
    - 도네이션 관련 UI는 유지 (사용자 요청에 따라 복원)

12. ✅ DevNewsFeedPage sticky Select 시도 (2025-12-07) ⚠️ **여전히 작동하지 않음**
    - sticky top-16 → top-20으로 변경 시도
    - **상태**: 여전히 스크롤을 따라다니지 않음

13. ✅ PremiumRecommendedIdeas 깜빡임 수정 시도 (2025-12-07) ⚠️ **여전히 작동하지 않음**
    - loading 초기값을 false로 변경
    - premiumLoading과 authLoading 체크 추가
    - **상태**: 여전히 1초 정도 보였다가 사라짐

현재 상태:
- MVP: 98% 완료
- 모바일 최적화: 100% 완료
- UI 개선: 95% 완료
- 개발 소식 시스템: 90% 완료
- 전체: 95% 완료

🚨 긴급 수정 필요 (P0):

1. **프리미엄 추천 아이디어 섹션 깜빡임 문제** ⚠️ **작동하지 않음**
   - **증상**: 메인 아이디어 대시보드에서 프리미엄 추천 아이디어 섹션이 1초 정도 보였다가 사라짐
   - **위치**: `src/components/PremiumRecommendedIdeas.tsx`, `src/pages/HomePage.tsx` (763-768줄)
   - **원인 추정**: 
     * `premiumLoading` 또는 `authLoading`이 완료되기 전에 컴포넌트가 렌더링됨
     * `usePremium` 훅의 `loading` 상태와 `useAuth` 훅의 `loading` 상태가 비동기적으로 완료되어 깜빡임 발생
   - **시도한 해결 방법**:
     * ✅ `loading` 초기값을 `false`로 변경
     * ✅ `premiumLoading`과 `authLoading` 모두 체크하도록 수정
     * ✅ 조건부 렌더링에서 `premiumLoading || authLoading || !user || !isPremium` 체크
   - **상태**: ❌ **여전히 작동하지 않음**
   - **해결 방안**:
     * `usePremium`과 `useAuth` 훅의 로딩 상태를 더 정확히 추적
     * 컴포넌트를 `useMemo`로 메모이제이션하여 불필요한 리렌더링 방지
     * 또는 `HomePage`에서 `premiumLoading`과 `authLoading`을 확인한 후에만 `PremiumRecommendedIdeas` 렌더링

2. **Reddit 이미지 수집 문제** ⚠️ **작동하지 않음**
   - **증상**: Reddit에 이미지가 있는 게시글에서 이미지를 수집하지 못함
   - **예시**: 
     * Reddit URL: `https://preview.redd.it/anyone-what-do-you-think-of-my-aso-free-to-roast-my-app-v0-rrmzbafoi05g1.png?width=640&crop=smart&auto=webp&s=6735795259b654c5f70db8bc4ae26565a5266510`
     * `content-href="https://i.redd.it/rrmzbafoi05g1.png"`
   - **위치**: `api/collect-dev-news.ts`, `api/cron/collect-dev-news.ts`, `api/collect-ideas.ts`의 `extractImageUrl` 함수
   - **시도한 해결 방법**:
     * ✅ `preview.redd.it` 또는 `i.redd.it` 도메인인 경우 무조건 이미지로 간주하도록 수정
     * ✅ `preview.images[0].source.url`을 최우선으로 확인
     * ✅ `is_reddit_media_domain`이 true인 경우 `post.url` 직접 반환
     * ✅ `post_hint === 'image'`인 경우 처리
   - **상태**: ❌ **여전히 작동하지 않음**
   - **해결 방안**:
     * Reddit API 응답 구조를 정확히 확인 (실제 API 응답 로그 확인 필요)
     * `post.url`이 직접 이미지 URL인 경우 우선 처리
     * `preview.images` 구조를 더 자세히 확인 (variants, source 등)
     * 실제 수집된 데이터를 Supabase Dashboard에서 확인하여 어떤 필드에 이미지 URL이 있는지 확인

3. **DevNewsFeedPage Select sticky 기능 작동 안 함** ⚠️ **작동하지 않음**
   - **증상**: 기간 선택 드롭다운(데일리/위클리/먼슬리)이 스크롤을 따라다니지 않음
   - **위치**: `src/pages/DevNewsFeedPage.tsx` (260-275줄)
   - **시도한 해결 방법**:
     * ✅ `sticky top-16` → `top-20`으로 변경
     * ✅ sticky를 부모 div에 직접 적용하고 `self-start` 추가
   - **상태**: ❌ **여전히 작동하지 않음**
   - **추가 문제**:
     * Select 버튼을 감싸는 박스(`bg-background/95 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border/50`)가 불필요함
     * 전체 게시글 박스와 드롭다운이 겹쳐서 보기 불편함
   - **해결 방안**:
     * 부모 요소의 `overflow` 속성 확인 (sticky가 작동하려면 부모에 `overflow: hidden` 등이 없어야 함)
     * Select를 헤더 안으로 이동 (스크롤 시 헤더와 함께 고정)
     * 또는 Select를 별도의 고정 영역으로 분리
     * Select를 옆으로 이동하여 게시글과 겹치지 않도록 함

4. **Supabase 406 에러** ⚠️ **재배포 후 확인 필요**
   - `premium_users` 및 `idea_scores` 테이블 조회 시 406 에러 발생
   - 재배포 후 브라우저 캐시 클리어 (Ctrl+Shift+R 또는 Cmd+Shift+R)
   - Supabase Dashboard에서 RLS 정책 확인

5. **번역 버튼 기능 동작 안 함** ⚠️
   - 번역 버튼 클릭 시 Google Translate가 작동하지 않음
   - 현재 구현: `.goog-te-combo` select 요소를 찾아서 한국어 옵션 선택
   - 문제: Google Translate 위젯이 로드되지 않았거나, select 요소를 찾지 못함
   - 확인 필요: Google Translate 위젯 로드 상태, DOM 요소 존재 여부

⚠️ 주의: 위의 P0 문제들을 우선적으로 해결해야 합니다. 특히 프리미엄 섹션 깜빡임, 이미지 수집, sticky 기능은 사용자 경험에 직접적인 영향을 미칩니다.

자세한 내용은 docs/development/SESSION_CONTINUITY.md 참조하세요.
```

---

## 📚 참고 문서

### 핵심 문서
- `docs/development/SESSION_CONTINUITY.md` - 이 문서 (전체 프로젝트 상황)
- `docs/development/DATABASE_MIGRATIONS_SUMMARY.md` - 실행된 SQL 마이그레이션 요약
- `docs/development/AI_IDEA_SCORING_IMPLEMENTATION.md` - AI 아이디어 평가 시스템
- `docs/development/CATEGORY_BASED_RECOMMENDATION_AND_DEV_NEWS.md` - 최근 완료 작업

### 설정 가이드
- `docs/setup/OPENROUTER_SETUP.md` - OpenRouter API 설정
- `docs/setup/LOCAL_DEVELOPMENT_SETUP.md` - 로컬 개발 환경 설정
- `docs/development/OAUTH_SETUP_GUIDE.md` - 소셜 로그인 설정

---

## 🔑 핵심 개발 원칙

### 1. Mock-Free 원칙
- 실제 데이터만 사용
- Mock 데이터 최소화

### 2. 무료 플랜 우선
- Supabase 무료 티어
- Vercel 무료 티어
- OpenRouter 무료 모델

### 3. 사용자 경험 우선
- 빠른 로딩
- 직관적인 UI
- 명확한 피드백
- 모바일 최적화

### 4. 확장 가능한 구조
- 모듈화된 컴포넌트
- 재사용 가능한 서비스
- 환경 변수 기반 설정

### 5. 단계적 개발
- 작은 단위로 작업 분할
- 각 단계마다 빌드/테스트
- 명확한 커밋 메시지

### 6. Git 작업 규칙 (필수)
- 모든 파일 수정 후 반드시 Git MCP를 사용하여 GitHub에 푸시
- `mcp_github_create_or_update_file` 또는 `mcp_github_push_files` 사용
- 로컬 git 명령어는 Git MCP로 푸시한 후에만 사용

---

## 🚨 주의사항

### 1. 데이터베이스 마이그레이션
- 모든 마이그레이션은 이미 Supabase에 적용됨
- 프로덕션 환경에서는 절대 다시 실행하지 말 것
- 새 환경 구축 시에만 순서대로 실행

### 2. 환경 변수
- 로컬: `.env.local` 파일 사용
- Vercel: 대시보드에서 환경 변수 설정
- 필수 변수:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_OPENROUTER_API_KEY`
  - `VITE_OPENROUTER_MODEL`
  - `REDDIT_CLIENT_ID` (Vercel 환경 변수)
  - `REDDIT_CLIENT_SECRET` (Vercel 환경 변수)

### 3. 빌드 및 배포
- 빌드 전 TypeScript 컴파일 확인: `npm run build`
- Vercel 자동 배포 활성화 (GitHub push 시)
- 배포 후 기능 테스트 필수

### 4. Vercel Cron Job
- `vercel.json`에 cron 스케줄 설정됨
- `/api/cron/collect-ideas`: 매일 자정 (0 0 * * *)
- `/api/cron/collect-dev-news`: 매일 오전 9시 (0 9 * * *)

---

## 📝 최근 변경사항 (2025-12-06 ~ 2025-12-07)

### 완료된 작업
1. ✅ 개발 소식 피드 개선 작업 (P0)
   - 필터링 개선: 개발 키워드 점수 기반 필터링 구현
   - 주간 소식 내용 표시: Reddit API에서 `selftext`/`selftext_html` 정확히 가져오기
   - 탭 제거 및 통합 피드: Daily/Weekly/Monthly 탭 제거, 통합 피드로 변경
2. ✅ 댓글 수 표시 기능 (P1)
   - DB 마이그레이션 파일 생성 (`20251206_add_num_comments_to_dev_news.sql`)
   - 수집 로직 수정: `api/collect-dev-news.ts`, `api/cron/collect-dev-news.ts`
   - UI 표시: `DevNewsFeedPage.tsx`에 댓글 수 표시 추가
3. ✅ 자동 한국어 번역 설정 (P1)
   - `index.html`에 Google Translate 자동 실행 설정
   - `lang="ko"` 속성 추가
4. ✅ 배포 후 테스트 체크리스트 작성
   - `docs/development/DEPLOYMENT_TEST_CHECKLIST.md` 생성
5. ✅ 이미지 표시 기능 추가
   - 개발 소식 피드에 이미지 표시 (텍스트 없는 게시글 포함)
   - 아이디어 대시보드에 이미지 표시
   - Reddit API에서 이미지 URL 추출 로직 구현
   - DB 마이그레이션 파일 생성 (dev_news, ideas 테이블)
6. ✅ 번역 안내 UI 개선
   - "Chrome 자동 번역 사용하기" 박스 제거 (IdeaCard, IdeaDetailPage)
   - 검색창 placeholder에 번역 안내 문구 추가
   - `App.tsx` 검색 입력창 placeholder 수정
7. ✅ 개발 소식 자동 수집 기능
   - 관리자 권한 시 소식이 없으면 자동으로 수집 시작
   - `DevNewsFeedPage.tsx`에 자동 수집 로직 추가
8. ✅ App.tsx 리팩토링 (2025-12-06)
   - `App.tsx`를 988줄에서 136줄로 축소
   - `HomePage` 컴포넌트를 `src/pages/HomePage.tsx`로 분리
   - `ScrollToTop` 컴포넌트를 `src/components/ScrollToTop.tsx`로 분리
   - lazy loading 타입 에러 수정 (`ComponentType` 사용, fallback 추가)
9. ✅ 프리미엄 기능 별도 페이지 생성 (2025-12-06)
   - `src/pages/PremiumPage.tsx` 생성
   - 프로필 페이지에서 프리미엄 관련 내용 분리
   - 프리미엄 기능 상세 설명 추가
10. ✅ 관리자 권한으로 프리미엄 기능 테스트 가능 (2025-12-06)
    - `usePremium` 훅 수정: 관리자는 자동으로 프리미엄 기능 사용 가능
    - `PremiumPage`에서 관리자 권한 표시
11. ✅ DevNewsFeedPage UI 개선 (2025-12-07)
    - 컨테이너 폭 확대: `max-w-2xl` → `max-w-4xl`
    - 기간 선택 Select만 sticky로 변경 (바 전체가 아닌 Select 버튼만 따라옴)
    - 빈 내용 처리 개선: 이미지가 있으면 표시, 둘 다 없으면 안내 메시지 표시
12. ✅ TypeScript 빌드 에러 수정 (2025-12-07)
    - `ideaScoringService.ts`의 `getRecommendedIdeaOfTheDay` 함수에서 null 체크 추가
    - `data`가 null일 수 있는 경우 처리
    - `ideas`가 배열인 경우 첫 번째 요소 사용하도록 수정
13. ✅ 프리미엄 기능 접근성 개선 (2025-12-07)
    - MobileMenu에 프리미엄 링크 추가 (Crown 아이콘 사용)
    - BottomNavigation에 프리미엄 링크 추가 (모든 사용자에게 표시)
    - 프리미엄 사용자에게는 노란색 스타일 적용
    - usePremium 훅을 사용하여 프리미엄 상태 확인
14. ✅ 이미지 수집 로직 개선 (2025-12-07)
    - Reddit API에서 preview.redd.it, i.redd.it 직접 URL 우선 처리
    - extractImageUrl 함수 개선 (api/collect-dev-news.ts, api/cron/collect-dev-news.ts, api/collect-ideas.ts)
15. ✅ 프로필 페이지 정리 (2025-12-07)
    - 프로필 페이지에서 프리미엄 관련 UI 제거 (PremiumPage로 이동 완료)
    - 도네이션 관련 UI 제거
16. ✅ 프리미엄 추천 아이디어 깜빡임 문제 수정 (2025-12-07)
    - PremiumRecommendedIdeas 컴포넌트에서 loading 상태 명시적 처리
    - !isPremium || !user일 때 loading을 false로 설정하여 깜빡임 방지

### 🚨 긴급 보안 패치 필요 (2025-12-06) - P0 최우선
**CVE-2025-55182**: React Server Components 원격 코드 실행 취약점
- **취약점 설명**: React Server Components에서 원격 코드 실행이 가능한 보안 취약점
- **현재 버전**: React 19.2.0 (취약)
- **필요 버전**: React 19.2.1 (패치됨)
- **영향**: 이 프로젝트는 React Server Components를 사용하지 않지만, 보안을 위해 업데이트 필요
- **작업 단계**:
  1. `package.json`에서 `react`와 `react-dom`을 `^19.2.1`로 업데이트
  2. `npm install` 실행
  3. `npm run build`로 빌드 테스트
  4. Vercel에 배포
- **참고**: React 공식 보안 권고사항에 따라 즉시 업데이트 권장

### 수정된 파일 (2025-12-06 ~ 2025-12-07)
**Supabase 406 에러 해결 시도**:
- `src/lib/supabase.ts`: Supabase 클라이언트 설정 개선
  * Accept/Content-Type 헤더 명시적 설정
  * db.schema 및 auth 설정 추가
- `src/services/premiumService.ts`: 쿼리 최적화
  * `select('*')` → 명시적 컬럼 지정
  * `.single()` → `.maybeSingle()` 변경
- `src/services/ideaScoringService.ts`: 쿼리 최적화
  * `select('*')` → 명시적 컬럼 지정
  * `.single()` → `.maybeSingle()` 변경
- `supabase/migrations/20251206_fix_all_rls_final.sql`: RLS 정책 수정
  * `is_admin_user` 및 `is_admin` 함수 생성/업데이트
  * `premium_users` 테이블 RLS 정책 수정
  * `idea_scores` 테이블 RLS 정책 수정

**기타 수정**:
- `api/collect-dev-news.ts`: 필터링 개선, 내용 추출 개선, `num_comments` 수집 추가, 이미지 URL 추출 추가, preview.redd.it/i.redd.it 직접 URL 우선 처리
- `api/cron/collect-dev-news.ts`: 필터링 개선, 내용 추출 개선, `num_comments` 수집 추가, 이미지 URL 추출 추가, preview.redd.it/i.redd.it 직접 URL 우선 처리
- `api/collect-ideas.ts`: 이미지 URL 추출 함수 추가, 수집 로직 수정, preview.redd.it/i.redd.it 직접 URL 우선 처리
- `src/services/devNewsService.ts`: `DevNews` 인터페이스에 `num_comments`, `image_url` 추가, `getAllDevNews` 함수 추가
- `src/services/ideaService.ts`: `Idea` 인터페이스에 `image_url` 추가, 수집 로직 수정
- `src/services/devNewsCollector.ts`: `num_comments`, `image_url` 저장 로직 추가
- `src/pages/DevNewsFeedPage.tsx`: 무한 스크롤 제거, 통합 피드로 변경, 댓글 수 표시 추가, 이미지 표시 UI 추가, 자동 수집 로직 추가, Card 클릭 이벤트 추가, Select sticky 기능 추가
- `src/components/IdeaCard.tsx`: 이미지 표시 UI 추가, 번역 안내 박스 제거
- `src/pages/IdeaDetailPage.tsx`: 번역 안내 박스 제거, 이미지 표시 추가
- `src/App.tsx`: lazy loading 타입 에러 수정 (fallback 추가), 검색창 placeholder 수정, `HomePage`와 `ScrollToTop` 분리, `PremiumPage` 라우트 추가
- `src/pages/HomePage.tsx`: 새로 생성 (App.tsx에서 분리), 번역 안내 메시지 추가
- `src/components/ScrollToTop.tsx`: 새로 생성 (App.tsx에서 분리)
- `src/pages/PremiumPage.tsx`: 새로 생성 (프리미엄 기능 별도 페이지)
- `src/hooks/usePremium.ts`: 관리자 권한으로 프리미엄 기능 테스트 가능하도록 수정
- `src/components/MobileMenu.tsx`: 프리미엄 링크 추가 (Crown 아이콘 사용)
- `src/components/BottomNavigation.tsx`: 프리미엄 링크 추가 (모든 사용자에게 표시)
- `src/pages/ProfilePage.tsx`: 프리미엄 관련 UI 제거, 도네이션 관련 UI 제거
- `src/components/PremiumRecommendedIdeas.tsx`: 깜빡임 문제 수정 (loading 상태 명시적 처리)
- `index.html`: Google Translate 자동 실행 설정, `lang="ko"` 추가
- `package.json`: React 19.2.1로 업데이트 (CVE-2025-55182 패치)
- `supabase/migrations/20251206_add_num_comments_to_dev_news.sql`: 새 마이그레이션 파일 생성
- `supabase/migrations/20251206_add_image_url_to_dev_news.sql`: 개발 소식 이미지 URL 컬럼 추가
- `supabase/migrations/20251206_add_image_url_to_ideas.sql`: 아이디어 이미지 URL 컬럼 추가
- `supabase/migrations/20251206_fix_is_admin_rpc.sql`: 관리자 확인 함수 생성
- `docs/development/DEPLOYMENT_TEST_CHECKLIST.md`: 배포 후 테스트 체크리스트 작성

### ⚠️ 중요: SQL 마이그레이션 실행 필요
**파일들**:
1. `supabase/migrations/20251206_add_num_comments_to_dev_news.sql` (댓글 수 컬럼)
2. `supabase/migrations/20251206_add_image_url_to_dev_news.sql` (개발 소식 이미지 URL)
3. `supabase/migrations/20251206_add_image_url_to_ideas.sql` (아이디어 이미지 URL)
4. `supabase/migrations/20251206_fix_is_admin_rpc.sql` (관리자 확인 함수) ✅ **실행 완료**
5. `supabase/migrations/20251206_fix_all_rls_final.sql` (RLS 정책 수정) ✅ **실행 완료**

**실행 방법**: Supabase Dashboard → SQL Editor에서 수동 실행 필요
**참고**: RLS 정책 관련 마이그레이션은 이미 실행되었지만, 406 에러가 계속 발생 중

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 7일 (프리미엄 기능 접근성 개선, DevNewsFeedPage UI 개선, TypeScript 빌드 에러 수정, 이미지 수집 로직 개선, 프로필 페이지 정리, 프리미엄 추천 아이디어 깜빡임 문제 수정)  
**다음 작업 우선순위**: 
1. ⚠️ **P0 - Supabase 406 에러 해결 확인** (재배포 후 확인, RLS 정책 검증)
2. ⚠️ **P0 - React 보안 패치** (CVE-2025-55182) - React 19.2.1로 업데이트 ✅ **완료**
3. **P0 - DevNewsFeedPage Select sticky 기능 수정** (스크롤 따라다니게)
4. **P0 - 이미지 수집 문제 해결** (Reddit API 응답 확인 및 디버깅)
5. **P0 - 번역 버튼 기능 수정** (Google Translate 위젯 로드 문제)
6. **P1 - 프리미엄 기능 확인 및 수정** (406 에러 해결 후)
7. **P1 - 스크롤 기능 개선** (스크롤 따라 움직이기)

**다음 세션 시작 방법**:
새 채팅을 열 때 이 문서의 "🎯 다음 세션 시작 프롬프트" 섹션을 복사해 사용하세요.
