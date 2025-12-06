# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 12월 5일  
**최종 업데이트**: 2025년 12월 7일 (프리미엄 기능 접근성 개선, DevNewsFeedPage UI 개선, TypeScript 빌드 에러 수정)  
**목적**: 새 채팅 세션에서 프로젝트 맥락을 빠르게 파악하고 작업을 이어갈 수 있도록 전체 상황 정리  
**대상**: AI Assistant 및 개발자

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

## 🚨 현재 문제 (2025-12-07)

1. **Supabase 406 에러 (Not Acceptable)** ⚠️ **긴급 - 재배포 후 확인 필요**
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
   - 다음 단계:
     * 재배포 후 브라우저 캐시 클리어 (Ctrl+Shift+R)
     * Supabase Dashboard에서 RLS 정책 확인
     * 여전히 문제가 있으면 Supabase 로그 확인

2. **프리미엄 기능 접근 방법** ✅ **완료**
   - 프리미엄 기능은 존재함 (`/premium` 라우트, `PremiumPage.tsx`)
   - MobileMenu와 BottomNavigation에 프리미엄 링크 추가 완료
   - 접근 방법: MobileMenu, BottomNavigation, 직접 URL 입력 (`/premium`), ProfilePage에서 접근 가능

3. **이미지 데이터 수집 문제** ⚠️
   - Reddit API에서 이미지 URL 추출 로직은 구현되어 있음 (`extractImageUrl` 함수)
   - 실제로 이미지가 있는 게시글에서 이미지가 표시되지 않음
   - 확인 필요: 실제 수집된 데이터에서 `image_url` 필드 확인 (Supabase Dashboard)

4. **번역 버튼 기능 동작 안 함** ⚠️
   - 번역 버튼 클릭 시 Google Translate가 작동하지 않음
   - 현재 구현: `.goog-te-combo` select 요소를 찾아서 한국어 옵션 선택
   - 문제: Google Translate 위젯이 로드되지 않았거나, select 요소를 찾지 못함
   - 확인 필요: Google Translate 위젯 로드 상태, DOM 요소 존재 여부

5. **스크롤 기능 개선 필요** (P1)
   - 스크롤 내릴 시 자동으로 스크롤 따라 움직이기 기능 필요
   - 예: 헤더 고정, 스크롤 위치에 따른 UI 변화 등

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

최근 완료된 작업 (2025-12-07):
1. ✅ 프리미엄 기능 접근성 개선
   - MobileMenu에 프리미엄 링크 추가 (Crown 아이콘 사용)
   - BottomNavigation에 프리미엄 링크 추가 (모든 사용자에게 표시)
   - 프리미엄 사용자에게는 노란색 스타일 적용
2. ✅ DevNewsFeedPage UI 개선
   - 컨테이너 폭 확대: max-w-2xl → max-w-4xl
   - 기간 선택 Select만 sticky로 변경
   - 빈 내용 처리 개선
3. ✅ TypeScript 빌드 에러 수정
   - ideaScoringService.ts의 getRecommendedIdeaOfTheDay 함수에서 null 체크 추가

현재 상태:
- MVP: 98% 완료
- 모바일 최적화: 100% 완료
- UI 개선: 95% 완료
- 개발 소식 시스템: 90% 완료
- 전체: 95% 완료

🚨 현재 문제:
1. Supabase 406 에러 (재배포 후 확인 필요)
2. 프리미엄 기능 접근 방법 ✅ 완료

자세한 내용은 docs/development/SESSION_CONTINUITY.md 참조하세요.
```

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 7일 (프리미엄 기능 접근성 개선, DevNewsFeedPage UI 개선, TypeScript 빌드 에러 수정)