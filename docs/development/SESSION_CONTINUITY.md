# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 12월 4일  
**최종 업데이트**: 2025년 12월 4일  
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
4. **활발한 커뮤니티**: SNS 스타일 피드로 아이디어 공유 및 협업

### 타겟 사용자
- **주 타겟**: 개발자, 기획자, 창업가 (2030 세대)
- **부 타겟**: 프로젝트 매니저, 프리랜서 개발자

---

## 🏗️ 기술 스택 및 아키텍처

### 프론트엔드
- **프레임워크**: React 19.2.0
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

### 데이터베이스 (Supabase PostgreSQL)
**주요 테이블**:
- `ideas`: Reddit에서 수집한 아이디어
- `prds`: 생성된 PRD 문서
- `development_plans`: 생성된 개발 계획서
- `proposals`: 생성된 제안서
- `idea_implementations`: 아이디어 실행 현황
- `idea_scores`: AI 기반 아이디어 평가 점수
- `premium_users`: 프리미엄 사용자
- `posts`: 커뮤니티 게시글
- `comments`: 댓글
- `profiles`: 사용자 프로필
- `friends`: 친구 관계
- `messages`: 쪽지
- `contact_inquiries`: 문의/피드백
- `admins`: 관리자 목록

**참고**: 실행된 SQL 마이그레이션은 `docs/development/DATABASE_MIGRATIONS_SUMMARY.md` 참조

---

## 📊 현재 진행 상황 (2025-12-04 기준)

### 전체 완성도
- **MVP (Epic 0-6)**: **98%** 완료 ✅
- **모바일 최적화**: **100%** 완료 ✅
- **UI 개선**: **90%** 완료 ✅
- **전체 (Epic 0-8)**: **92%** 완료

### 최근 완료된 작업 (2025-12-04)

#### 1. UI 대폭 개선 ✅
- **tweakcn caffeine 테마 적용**: 분홍색 제거, 깔끔한 색감
- **레이아웃 최적화**: 
  - 서브레딧 정보를 카테고리 하단 별도 줄로 이동
  - 아이디어 카드 크기 축소 (420px → 186px)
  - 전체 그리드 박스에 입체감 추가 (그림자, 회색 계열 배경)
  - 여백 최적화
- **Google Fonts 추가**: Poppins, Roboto Mono

#### 2. 제안서 생성 기능 개선 ✅
- 프롬프트 개선: "실제로 상품으로 판매할 수 있을 정도로 재밌고 신선하고 유용하고 효율적인 서비스"
- 사용자 프롬프트 입력 기능 추가
- 기존 제안서 기반 개선 기능 구현
- PRD 생성 시 제안서 선택 로직 개선

#### 3. AI 기반 아이디어 평가 시스템 (백엔드) ✅
- 데이터베이스 스키마: `idea_scores`, `premium_users` 테이블
- 서비스 레이어: `ideaScoringService.ts`, `premiumService.ts`, `notificationService.ts`
- AI 클라이언트 확장: `scoreIdea()`, `summarizeIdeaForNotification()`
- 3가지 평가 기준: 비타민/경쟁율/섹시함 점수 (각 0-10점, 총 30점)
- 최근 검색 아이디어 중 상위 3개 추천 및 알림 기능

#### 4. 아이디어 실행 현황 추적 시스템 ✅
- 데이터베이스: `idea_implementations` 테이블
- 서비스: `implementationService.ts`
- UI 컴포넌트: ImplementationButton, SimilarImplementationCard
- 페이지 통합: IdeaDetailPage, ProfilePage, ImplementationGallery

---

## 📋 미비된 작업 및 다음 단계

### P0 (즉시 처리 필요)

#### 1. AI 기반 아이디어 평가 시스템 UI 구현 ⭐⭐⭐
**상태**: 백엔드 완료, UI 미구현  
**예상 시간**: 3-5일  
**우선순위**: 최우선

**작업 내용**:
- [ ] 아이디어 평가 버튼 UI (프리미엄 사용자만 표시)
- [ ] 점수 표시 컴포넌트 (비타민/경쟁율/섹시함 점수 시각화)
- [ ] 알림 표시 컴포넌트 (최근 검색 아이디어 중 상위 3개)
- [ ] 프리미엄 사용자 가입/후원 UI

**파일**:
- `src/pages/IdeaDetailPage.tsx`: 평가 버튼 추가
- `src/components/IdeaScoreCard.tsx` (신규): 점수 표시 컴포넌트
- `src/components/PremiumBadge.tsx` (신규): 프리미엄 배지
- `src/pages/ProfilePage.tsx`: 프리미엄 가입 UI

**참고 문서**: `docs/development/AI_IDEA_SCORING_IMPLEMENTATION.md`

#### 2. 소셜 로그인 완료
**상태**: 코드 완료, Supabase 설정 필요  
**예상 시간**: 1일 (수동 설정)  
**우선순위**: 높음

**남은 작업**:
- [ ] Supabase Dashboard에서 Google OAuth Provider 설정
- [ ] Supabase Dashboard에서 GitHub OAuth Provider 설정
- [ ] 리다이렉트 URL 설정
- [ ] 테스트 및 검증

**참고 문서**: `docs/development/OAUTH_SETUP_GUIDE.md`

### P1 (단기 - 1-2주 내)

#### 3. 개발 계획 문서 진행 상황 추적 기능
**예상 시간**: 3일

**작업 내용**:
- [ ] 개발 계획서 내용 파싱하여 Task 목록 추출
- [ ] 각 Task의 완료 상태 체크박스 기능
- [ ] 진행률 자동 계산 및 표시
- [ ] 완료된 Task와 남은 Task 구분 표시

#### 4. Edge Function 구현 (선택사항)
**예상 시간**: 2일

**작업 내용**:
- [ ] 매일 자동으로 최고 점수 아이디어 선정
- [ ] 프리미엄 사용자에게 자동 알림 전송

### P2 (중기 - 3-4주 내)

#### 5. 구독 모델 구현
**예상 시간**: 10일

**작업 내용**:
- [ ] Stripe 연동
- [ ] 구독 플랜 관리 (Free/Pro/Business)
- [ ] 사용량 제한 로직
- [ ] 구독 관리 UI

---

## 🗂️ 프로젝트 정리 작업 안내

### 1. SQL 마이그레이션 파일 정리

**현재 상태**: 
- 모든 SQL 마이그레이션은 이미 Supabase 데이터베이스에 적용됨
- 마이그레이션 파일은 버전 관리 및 롤백 목적으로 보관

**정리 작업**:
- ✅ 실행된 SQL 요약 문서 작성 완료: `docs/development/DATABASE_MIGRATIONS_SUMMARY.md`
- ⚠️ **중요**: 마이그레이션 파일은 삭제하지 말고 보관 (새 환경 구축 시 필요)

**위치**: `supabase/migrations/`

### 2. 문서 정리

**현재 상태**: 
- 문서가 여러 위치에 분산되어 있음
- 중복 문서 존재

**정리 작업**:
- [ ] 루트 디렉토리의 중복 문서를 `docs/archive/`로 이동
- [ ] 최신 문서만 `docs/development/`에 유지
- [ ] README.md 업데이트 (최신 상태 반영)

**정리 대상**:
- 루트 디렉토리: `CURRENT_STATUS_BRIEFING.md`, `PROGRESS_BRIEFING.md`, `PROGRESS_REPORT.md` 등
- `docs/development/`: 중복되거나 오래된 문서

### 3. 더미 데이터 정리

**현재 상태**: 
- `prd_example.md`, `plan_example.md` 등 예시 파일 존재

**정리 작업**:
- [ ] 예시 파일을 `docs/examples/`로 이동
- [ ] 또는 `.gitignore`에 추가하여 제외

**위치**: 프로젝트 루트

### 4. 불필요한 파일 정리

**정리 대상**:
- [ ] `dist/` 폴더 (빌드 결과물, `.gitignore`에 포함되어야 함)
- [ ] `node_modules/` (`.gitignore`에 포함되어야 함)
- [ ] 임시 파일 및 백업 파일

---

## 📁 주요 파일 구조

```
IdeaSpark/
├── src/
│   ├── App.tsx                    # 메인 앱, 라우팅, 헤더, 홈페이지
│   ├── pages/
│   │   ├── IdeaDetailPage.tsx     # 아이디어 상세, PRD/제안서 생성
│   │   ├── CommunityPage.tsx      # 커뮤니티 피드
│   │   ├── PostDetailPage.tsx     # 게시글 상세
│   │   ├── ProfilePage.tsx        # 프로필 페이지
│   │   ├── ContactPage.tsx        # 문의/피드백
│   │   ├── AuthPage.tsx           # 로그인/회원가입
│   │   └── AdminDashboard.tsx     # 관리자 대시보드
│   ├── components/
│   │   ├── IdeaCard.tsx           # 아이디어 카드
│   │   ├── RecommendedIdeas.tsx  # 추천 아이디어
│   │   ├── PRDViewer.tsx         # PRD 뷰어
│   │   ├── ImplementationButton.tsx # 구현 버튼
│   │   └── ui/                    # Shadcn/UI 컴포넌트
│   ├── services/
│   │   ├── ai.ts                  # AI 클라이언트 (OpenRouter)
│   │   ├── ideaService.ts        # 아이디어 관리
│   │   ├── prdService.ts         # PRD 생성
│   │   ├── proposalService.ts   # 제안서 생성
│   │   ├── ideaScoringService.ts # 아이디어 평가
│   │   ├── premiumService.ts    # 프리미엄 사용자
│   │   ├── implementationService.ts # 구현 현황
│   │   └── ...
│   └── hooks/
│       ├── useAuth.ts            # 인증 Hook
│       └── useAdmin.ts          # 관리자 Hook
├── supabase/
│   ├── migrations/               # 데이터베이스 마이그레이션 (보관)
│   └── functions/                # Supabase Edge Functions
├── docs/
│   ├── development/              # 개발 문서
│   │   ├── SESSION_CONTINUITY.md # 이 문서
│   │   ├── DATABASE_MIGRATIONS_SUMMARY.md # SQL 요약
│   │   ├── AI_IDEA_SCORING_IMPLEMENTATION.md
│   │   ├── PROPOSAL_IMPROVEMENTS.md
│   │   └── ...
│   ├── archive/                  # 아카이브 문서
│   └── setup/                    # 설정 가이드
└── api/                          # Vercel Serverless Functions
```

---

## 🎯 다음 세션 시작 프롬프트

새 채팅을 열 때 다음 프롬프트를 사용하세요:

```
안녕하세요. IdeaSpark 프로젝트를 이어서 진행하고 있습니다.

프로젝트 정보:
- 위치: 11.25/my_first_project/IdeaSpark
- 기술 스택: React, TypeScript, Vite, Supabase, OpenRouter API
- 배포: Vercel (https://ideaspark-pi.vercel.app)

최근 완료된 작업:
1. UI 대폭 개선 (tweakcn caffeine 테마 적용, 레이아웃 최적화)
2. 제안서 생성 기능 개선 (사용자 프롬프트 입력 기능 추가)
3. AI 기반 아이디어 평가 시스템 (백엔드 완료)
4. 아이디어 실행 현황 추적 시스템

현재 상태:
- MVP: 98% 완료
- 모바일 최적화: 100% 완료
- UI 개선: 90% 완료

다음 우선 작업:
1. AI 기반 아이디어 평가 시스템 UI 구현 (백엔드 완료, UI 미구현)
2. 소셜 로그인 완료 (코드 완료, Supabase 설정 필요)

참고 문서:
- docs/development/SESSION_CONTINUITY.md - 전체 프로젝트 상황
- docs/development/DATABASE_MIGRATIONS_SUMMARY.md - 실행된 SQL 요약
- docs/development/AI_IDEA_SCORING_IMPLEMENTATION.md - 아이디어 평가 시스템
- docs/development/PROPOSAL_IMPROVEMENTS.md - 제안서 개선 완료

다음 작업을 진행하겠습니다: [작업 내용]
```

---

## 📚 참고 문서

### 핵심 문서
- `docs/development/SESSION_CONTINUITY.md` - 이 문서 (전체 프로젝트 상황)
- `docs/development/DATABASE_MIGRATIONS_SUMMARY.md` - 실행된 SQL 마이그레이션 요약
- `docs/development/CURRENT_STATUS.md` - 현재 상태 상세
- `docs/development/AI_IDEA_SCORING_IMPLEMENTATION.md` - AI 아이디어 평가 시스템
- `docs/development/PROPOSAL_IMPROVEMENTS.md` - 제안서 개선 완료

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

### 4. 확장 가능한 구조
- 모듈화된 컴포넌트
- 재사용 가능한 서비스
- 환경 변수 기반 설정

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 4일
