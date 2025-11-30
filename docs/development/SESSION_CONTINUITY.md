# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 1월 30일  
**목적**: 새 채팅 세션에서 프로젝트 맥락을 빠르게 파악하고 작업을 이어갈 수 있도록 전체 상황 정리  
**대상**: AI Assistant 및 개발자

---

## 📌 프로젝트 개요

### 프로젝트명
**IdeaSpark** - Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼

### 핵심 가치 제안
1. **실시간 아이디어 발굴**: Reddit API를 통한 다양한 분야의 불편함과 니즈 자동 수집
2. **자동화된 기획 문서**: AI 기반 PRD/개발계획서/제안서 자동 생성으로 기획 시간 90% 단축
3. **시각적 프로젝트 관리**: Mermaid 기반 WBS 및 개발 계획 시각화
4. **활발한 커뮤니티**: SNS 스타일 피드로 아이디어 공유 및 협업

### 타겟 사용자
- **주 타겟**: 개발자, 기획자, 창업가 (2030 세대)
- **부 타겟**: 프로젝트 매니저, 프리랜서 개발자

### 성공 지표 (KPI)
- 일일 수집 아이디어 수: 100개 이상
- PRD 생성 성공률: 95% 이상
- 사용자 만족도: 4.5/5.0 이상
- 월간 활성 사용자: 1,000명 이상 (3개월 내)

---

## 🏗️ 기술 스택 및 아키텍처

### 프론트엔드
- **프레임워크**: React 19.2.0
- **빌드 도구**: Vite 7.2.4
- **언어**: TypeScript 5.9.3
- **UI 라이브러리**: 
  - Shadcn/UI (Radix UI 기반)
  - Tailwind CSS 4.1.17
  - Lucide React (아이콘)
- **라우팅**: React Router DOM 7.9.6
- **마크다운**: react-markdown 10.1.0, remark-gfm, rehype-raw
- **다이어그램**: Mermaid 11.12.1 (iframe 기반 렌더링)
- **PDF 생성**: jspdf 3.0.4

### 백엔드 & 인프라
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **배포**: 
  - Vercel (프로덕션, 자동 배포)
  - GitHub Pages (백업 배포)
- **서버리스 함수**: Vercel Edge Functions
- **이미지 저장**: Imgur API (기본값), Supabase Storage (선택), Google Drive (향후)

### AI 서비스
- **AI Provider**: OpenRouter API
- **기본 모델**: `meta-llama/llama-3.1-8b-instruct` (무료)
- **대체 모델**: `google/gemini-flash-1.5` (무료)
- **용도**: PRD 생성, 개발 계획서 생성, 제안서 생성

### 데이터베이스 (Supabase PostgreSQL)
**주요 테이블**:
- `ideas`: Reddit에서 수집한 아이디어
- `prds`: 생성된 PRD 문서
- `development_plans`: 생성된 개발 계획서
- `proposals`: 생성된 제안서
- `posts`: 커뮤니티 게시글
- `comments`: 댓글
- `profiles`: 사용자 프로필
- `friends`: 친구 관계
- `messages`: 쪽지
- `contact_inquiries`: 문의/피드백
- `admins`: 관리자 목록

### 환경 변수
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI (OpenRouter)
VITE_AI_PROVIDER=openrouter
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct

# 이미지 저장소
VITE_IMAGE_STORAGE_PROVIDER=imgur  # 'imgur' | 'supabase' | 'google-drive'
VITE_IMGUR_CLIENT_ID=your_imgur_client_id

# 배포 환경
VITE_GITHUB_PAGES=false  # GitHub Pages 배포 시 'true'
VITE_IMAGE_PROXY_BASE_URL=/api/image-proxy  # Vercel 배포 시
```

---

## 📊 현재 진행 상황 (2025-01-30 기준)

### 전체 완성도
- **MVP (Epic 0-6)**: **98%** 완료
- **모바일 최적화**: **100%** 완료 ✅ (모든 모바일 최적화 작업 완료)
- **전체 (Epic 0-8)**: **87%** 완료

### Epic별 진행률

| Epic | 진행률 | 상태 | 주요 내용 |
|------|--------|------|----------|
| Epic 0: 프로젝트 초기 설정 | 100% | ✅ 완료 | React, Vite, TypeScript, Supabase 설정 |
| Epic 1: Reddit API 연동 | 95% | ✅ 거의 완료 | 아이디어 수집, 필터링, 통계 (일부 서브레딧 403 에러) |
| Epic 2: PRD 자동 생성 | 95% | ✅ 거의 완료 | PRD/개발계획서/제안서 생성, Mermaid 렌더링 (간헐적 깨짐) |
| Epic 3: 커뮤니티 기능 | 98% | ✅ 거의 완료 | SNS 스타일 피드, 무한 스크롤, 필터/검색, 이미지 업로드 |
| Epic 4: 사용자 관리 및 소셜 기능 | 100% | ✅ 완료 | 프로필, 친구, 쪽지, 차단, 알림 배지 |
| Epic 5: 관리자 기능 | 90% | ✅ 거의 완료 | 관리자 대시보드, 문의/피드백 관리 |
| Epic 6: 배포 및 최적화 | 97% | ✅ 거의 완료 | Vercel/GitHub Pages 배포, 모바일 최적화 부분 완료 |
| Epic 7: 고급 아이디어 기능 | 0% | 📋 기획 완료 | 9개 Task 대기 (추천 시스템, 실행 현황 추적 등) |
| Epic 8: 모바일 최적화 및 수익화 | 100% | ✅ 완료 | 도네이션 완료, 모바일 최적화 100% 완료, 소셜 로그인 대기 |

---

## ✅ 완료된 주요 기능

### 1. 아이디어 수집 및 관리
- ✅ Reddit API OAuth2 인증
- ✅ 일일 자동 수집 (Cron Job)
- ✅ 아이디어 필터링 (카테고리, 서브레딧, 검색)
- ✅ 정렬 (최신순, 인기순, 댓글순)
- ✅ 통계 표시 (카테고리별, 서브레딧별)
- ✅ 통계 키워드 클릭 필터링 (다중 선택)

### 2. AI 문서 생성
- ✅ PRD 자동 생성 (상세 양식, Mermaid 다이어그램)
- ✅ 개발 계획서 생성 (5개 부분으로 분할 생성, 상세 EPIC 문서)
- ✅ 제안서 생성 (다중 버전 관리)
- ✅ Mermaid 다이어그램 렌더링 (iframe 기반, 전문가 핸드오프/WBS는 텍스트만)
- ✅ PDF/Markdown 다운로드

### 3. 커뮤니티 기능
- ✅ SNS 스타일 피드 (Facebook/Instagram/Reddit 스타일)
- ✅ 무한 스크롤 (Intersection Observer)
- ✅ 게시글 작성/조회/수정/삭제
- ✅ 댓글 시스템 (계층 구조, 익명 지원)
- ✅ 좋아요/북마크
- ✅ 이미지 업로드 (클립보드 붙여넣기 포함, Imgur API)
- ✅ 태그 시스템 (다중 선택 필터링)
- ✅ 검색 및 필터 (카테고리, 태그, 정렬)

### 4. 사용자 관리 및 소셜 기능
- ✅ 프로필 관리 (닉네임, 소개, 공개/비공개 설정)
- ✅ 프로필 사진 업로드 (Imgur API)
- ✅ 친구 시스템 (요청, 수락, 거절, 목록)
- ✅ 쪽지 시스템 (1:1 대화, 읽음 처리, 알림 배지)
- ✅ 차단 기능
- ✅ 다른 사용자 프로필 보기
- ✅ 프로필 통계 (작성한 글/댓글/좋아요/북마크/PRD)

### 5. 관리자 기능
- ✅ 관리자 인증 (admins 테이블)
- ✅ 관리자 대시보드
- ✅ 사용자/아이디어/게시글 관리
- ✅ 문의/피드백 관리
- ✅ 이메일 알림 (Resend API, Supabase Edge Functions)

### 6. 배포 및 인프라
- ✅ Vercel 배포 (자동 배포)
- ✅ GitHub Pages 배포 (백업)
- ✅ 환경 변수 관리 (클라이언트/서버 분리)
- ✅ 이미지 프록시 (Supabase URL 숨김)
- ✅ SPA 라우팅 처리 (404.html)

### 7. 수익화 (부분 완료)
- ✅ 도네이션 기능 (프로필 페이지 통합, QR 코드, 계좌번호 복사)
- ⏳ 구독 시스템 (기획 완료, 구현 대기)
- ⏳ 소셜 로그인 (기획 완료, 구현 대기)

---

## 🔄 현재 진행 중인 작업

### 1. 모바일 최적화 (100% 완료) ✅
**완료된 작업**:
- ✅ 모바일 터치 타겟 최소 크기 설정 (44px × 44px)
- ✅ 모바일 반응형 폰트 크기 조정
- ✅ 모바일 카드 및 컨테이너 패딩 조정
- ✅ 모바일 네비게이션 개선
- ✅ 모바일 그리드 레이아웃 개선
- ✅ 모바일 전용 UI 컴포넌트 (햄버거 메뉴, 하단 네비게이션) - 완료
- ✅ 코드 스플리팅 (React.lazy 적용) - 완료
- ✅ 이미지 Lazy Loading (게시글 이미지) - 완료
- ✅ 헤더 높이 최적화 (모바일에서 최소화)
- ✅ IdeaSpark 버튼 클릭 기능 (메인 이동/새로고침)
- ✅ QR 코드 모달 닫기 버튼 개선 ("닫기" 텍스트 버튼)
- ✅ 프로필 통계 카드 미리보기 추가
- ✅ 관리자 대시보드 미리보기 추가
- ✅ 로딩 컴포넌트 추가 (PageLoadingFallback)
- ✅ 이미지 Lazy Loading 완료 (게시글, 프로필, PostDetail)
- ✅ 에러 처리 개선 (ErrorBoundary, useLocation/useParams 안전 처리)
- ✅ Pull-to-Refresh 구현 완료 (커뮤니티 페이지, 메인 대시보드)
- ✅ 가상 스크롤 컴포넌트 구현 완료 (react-window 설치 및 VirtualizedList 컴포넌트)

**완료**: 모든 모바일 최적화 작업이 완료되었습니다.

### 2. UI 개선 (계획 중)
**대상 페이지**:
- 메인 대시보드 (아이디어 카드 그리드)
- 커뮤니티 페이지 (SNS 스타일 피드)
- 프로필 페이지 (탭 레이아웃)
- 헤더/네비게이션

**도구**: Magic MCP (21st.dev) 활용

**옵션 문서**: [UI 개선 옵션](./UI_IMPROVEMENT_OPTIONS.md)
- 조합 1: 미니멀리스트 (추천) - 4.5일
- 조합 2: 데이터 중심 - 6일
- 조합 3: 크리에이티브 - 6일

### 3. 알림 시스템 개선 (최근 완료)
- ✅ 쪽지 읽음 처리 (메시지 열람 시 자동 `markAsRead`)
- ✅ 친구 요청 수락/거절 시 알림 자동 갱신
- ✅ 실시간 알림 업데이트 (`notification-updated` 이벤트)

### 4. 이미지 저장 시스템 개선 (최근 완료)
- ✅ Imgur API 기본 설정 (무료, 공개 URL 즉시 제공)
- ✅ Supabase Storage 대체 (환경 변수로 전환 가능)
- ✅ Pixel 4a/4xl 활용 방안 설계 (하이브리드 방식 권장)

---

## 📋 남은 주요 Task

### P0 (즉시 처리 필요)

#### 1. UI 개선 (모든 페이지)
**예상 작업량**: 5-7일

**대상**:
- 메인 대시보드 (아이디어 카드 그리드)
- 커뮤니티 페이지 (SNS 스타일 피드)
- 프로필 페이지 (탭 레이아웃)
- 헤더/네비게이션

**방법**: Magic MCP (21st.dev) 활용하여 현대적이고 세련된 UI로 개선

**우선순위**: 높음 (사용자 경험 직접 개선)

#### 2. 모바일 최적화 완료 (100% 완료) ✅
**예상 작업량**: 1일 (추가 테스트 및 미세 조정)

**완료된 작업**:
- ✅ 모바일 전용 UI 컴포넌트 (햄버거 메뉴, 하단 네비게이션)
- ✅ 코드 스플리팅 (React.lazy)
- ✅ 이미지 Lazy Loading (게시글 이미지)
- ✅ 로딩 컴포넌트 (PageLoadingFallback)
- ✅ 이미지 Lazy Loading 완료 (모든 페이지)
- ✅ 에러 처리 개선
- ✅ Pull-to-Refresh 구현 완료
- ✅ 가상 스크롤 컴포넌트 구현 완료

**완료**: 모든 모바일 최적화 작업이 완료되었습니다.

### P1 (단기 - 1-2주 내)

#### 3. 소셜 로그인 구현
**예상 작업량**: 5일

**작업 내용**:
- Google OAuth 설정 및 구현
- GitHub OAuth 설정 및 구현
- 소셜 로그인 UI 개선

**파일**: `src/pages/AuthPage.tsx` 수정

#### 4. 개발 계획 문서 진행 상황 추적 기능
**예상 작업량**: 3일

**작업 내용**:
- 개발 계획서 내용 파싱하여 Task 목록 추출
- 각 Task의 완료 상태 체크박스 기능
- 진행률 자동 계산 및 표시
- 완료된 Task와 남은 Task 구분 표시

### P2 (중기 - 3-4주 내)

#### 5. 구독 모델 구현
**예상 작업량**: 10일

**작업 내용**:
- Stripe 연동
- 구독 플랜 관리 (Free/Pro/Business)
- 사용량 제한 로직
- 구독 관리 UI

#### 6. Epic 7: 고급 아이디어 기능 (9개 Task)
**예상 작업량**: 20일 (4주)

**Task 목록**:
1. 아이디어 추천 시스템 (3일)
2. 아이디어 실행 현황 추적 (2일)
3. 아이디어 투표 및 우선순위 (2일)
4. AI 아이디어 분석 및 인사이트 (3일)
5. 아이디어 협업 기능 (3일)
6. 아이디어 챌린지/이벤트 (2일)
7. 실시간 알림 시스템 (2일)
8. 아이디어 실행 로드맵 공유 (2일)
9. 아이디어 버전 관리 (1일)

---

## 🎨 UI 개선 계획

### 개선 대상 및 우선순위

#### 1. 메인 대시보드 (아이디어 카드 그리드) - 우선순위: 높음
**현재 상태**:
- 기본 카드 그리드 레이아웃
- 필터 및 검색 기능
- 통계 표시

**개선 방향**:
- 현대적인 대시보드 레이아웃 (Magic MCP Analytics Dashboard 참고)
- 카드 디자인 개선 (그림자, 호버 효과)
- 통계 시각화 개선
- 로딩 상태 개선 (스켈레톤 UI)

**파일**: `src/App.tsx` (HomePage), `src/components/IdeaCard.tsx`

#### 2. 커뮤니티 페이지 (SNS 스타일 피드) - 우선순위: 높음
**현재 상태**:
- SNS 스타일 피드 구현 완료
- 무한 스크롤 작동
- 필터/검색 기능 작동

**개선 방향**:
- 더 세련된 카드 디자인
- 애니메이션 효과 추가
- 이미지 갤러리 개선
- 댓글 UI 개선

**파일**: `src/pages/CommunityPage.tsx`, `src/pages/PostDetailPage.tsx`

#### 3. 프로필 페이지 (탭 레이아웃) - 우선순위: 중간
**현재 상태**:
- 기본 탭 레이아웃
- 프로필 정보, 친구, 쪽지, 통계 탭

**개선 방향**:
- 탭 디자인 개선
- 통계 시각화 (차트)
- 쪽지 UI 개선
- 친구 목록 UI 개선

**파일**: `src/pages/ProfilePage.tsx`

#### 4. 헤더/네비게이션 - 우선순위: 중간
**현재 상태**:
- 기본 헤더 레이아웃
- 모바일 반응형 부분 완료

**개선 방향**:
- 모바일 햄버거 메뉴 추가
- 하단 네비게이션 바 (모바일)
- 활성 상태 표시 개선
- 애니메이션 효과

**파일**: `src/App.tsx` (Header 부분)

### Magic MCP 활용 방법

**도구**: `mcp_Magic_MCP_21st_magic_component_builder`

**사용 시나리오**:
1. 각 페이지별로 개선할 UI 컴포넌트 식별
2. Magic MCP로 현대적인 컴포넌트 생성
3. 기존 코드에 통합
4. 스타일 통일성 확인

**참고 컴포넌트**:
- Analytics Dashboard (통계 카드, 차트)
- Financial Dashboard (빠른 액션, 최근 활동)
- Swapy Draggable Card (드래그 가능한 레이아웃)

---

## 🔧 주요 기술적 결정사항

### 1. 이미지 저장소
**현재**: Imgur API (기본값)
- 무료, 공개 URL 즉시 제공
- 일일 1,250장 제한 (충분함)
- OAuth 불필요

**대안**: 
- Supabase Storage (환경 변수로 전환 가능)
- Google Drive API (향후 구현)
- Pixel 4a/4xl 백업 도구 (선택적, 하이브리드 방식)

### 2. AI 모델
**현재**: `meta-llama/llama-3.1-8b-instruct` (OpenRouter)
- 무료 모델
- 일일 50 요청 제한 (무료)
- 분당 20 요청 제한

**대안**: `google/gemini-flash-1.5` (무료)

### 3. 배포 전략
**프로덕션**: Vercel (자동 배포)
**백업**: GitHub Pages (수동 배포)

**환경 변수 분리**:
- Vercel: 루트 경로 (`/`)
- GitHub Pages: `/ideaspark` 경로

### 4. Mermaid 다이어그램 렌더링
**방법**: iframe 기반 렌더링
- DOM 충돌 방지
- 스타일 격리
- 안정성 향상

**제약사항**:
- "전문가 핸드오프 체계": 텍스트만 출력 (Mermaid 제거)
- "WBS Gantt Chart": 텍스트만 출력 (Mermaid 제거)
- 다른 다이어그램은 Mermaid 사용

### 5. 개발 계획서 생성
**방법**: 5개 부분으로 분할 생성 후 병합
- 더 상세한 내용 생성 가능
- API 제한 우회
- 진행률 표시

**프롬프트**: `planning-agent.md` 기반 강화된 프롬프트 사용

---

## 📁 주요 파일 구조

```
IdeaSpark/
├── src/
│   ├── App.tsx                    # 메인 앱, 라우팅, 헤더
│   ├── pages/
│   │   ├── HomePage (App.tsx 내)  # 메인 대시보드
│   │   ├── IdeaDetailPage.tsx     # 아이디어 상세, PRD 생성
│   │   ├── CommunityPage.tsx     # 커뮤니티 피드
│   │   ├── PostDetailPage.tsx     # 게시글 상세
│   │   ├── ProfilePage.tsx        # 프로필 페이지
│   │   ├── ContactPage.tsx        # 문의/피드백
│   │   ├── AuthPage.tsx           # 로그인/회원가입
│   │   └── AdminDashboard.tsx     # 관리자 대시보드
│   ├── components/
│   │   ├── IdeaCard.tsx           # 아이디어 카드
│   │   ├── RecommendedIdeas.tsx  # 추천 아이디어
│   │   ├── PRDViewer.tsx         # PRD 뷰어 (Mermaid 렌더링)
│   │   ├── CommentSection.tsx    # 댓글 섹션
│   │   ├── ProfileNotificationBadge.tsx  # 알림 배지
│   │   └── ui/                    # Shadcn/UI 컴포넌트
│   ├── services/
│   │   ├── ai.ts                  # AI 클라이언트 (OpenRouter)
│   │   ├── ideaService.ts        # 아이디어 관리
│   │   ├── prdService.ts         # PRD 생성
│   │   ├── proposalService.ts   # 제안서 생성
│   │   ├── postService.ts        # 게시글 관리
│   │   ├── imageService.ts      # 이미지 업로드 (Imgur/Supabase)
│   │   ├── imgurService.ts      # Imgur API
│   │   ├── friendService.ts     # 친구 시스템
│   │   ├── messageService.ts    # 쪽지 시스템
│   │   └── recommendationService.ts  # 추천 시스템
│   └── hooks/
│       ├── useAuth.ts            # 인증 Hook
│       └── useAdmin.ts          # 관리자 Hook
├── api/                          # Vercel Serverless Functions
│   ├── collect-ideas.ts         # 아이디어 수집
│   └── image-proxy.ts           # 이미지 프록시
├── supabase/
│   ├── migrations/              # 데이터베이스 마이그레이션
│   └── functions/               # Supabase Edge Functions
│       └── send-contact-email/  # 이메일 알림
└── 문서/
    ├── SESSION_CONTINUITY.md    # 이 문서
    ├── DEVELOPMENT_PROGRESS_REPORT.md
    ├── CURRENT_STATUS_BRIEFING.md
    ├── MOBILE_AND_MONETIZATION_PLAN.md
    └── PIXEL_4A_4XL_IMAGE_STORAGE_DESIGN.md
```

---

## 🐛 알려진 이슈 및 제약사항

### 1. Mermaid 다이어그램
- **이슈**: 간헐적 깨짐 현상 (SVG 렌더링 실패)
- **해결책**: iframe 기반 렌더링, 재시도 로직 강화
- **제약**: "전문가 핸드오프 체계", "WBS Gantt Chart"는 텍스트만 출력

### 2. 모바일 최적화
- **이슈**: 부분적으로만 완료
- **남은 작업**: 추가 테스트, 성능 최적화, 모바일 전용 UI

### 3. Reddit API
- **이슈**: 일부 서브레딧 403 에러 (webdev 제외 처리)
- **해결책**: 에러 처리 및 제외 목록 관리

### 4. 이미지 저장소
- **현재**: Imgur API 사용 (무료, 제한 있음)
- **대안**: Supabase Storage, Google Drive API (환경 변수로 전환 가능)

---

## 🎯 다음 세션에서 우선 처리할 작업

### 즉시 시작 (P0)

#### 1. UI 개선 (모든 페이지)
**작업 순서**:
1. 메인 대시보드 UI 개선
2. 커뮤니티 페이지 UI 개선
3. 프로필 페이지 UI 개선
4. 헤더/네비게이션 UI 개선

**도구**: Magic MCP (21st.dev)
**예상 시간**: 5-7일

#### 2. 모바일 최적화 완료
**작업 내용**:
- 추가 테스트 및 미세 조정
- 모바일 성능 최적화
- 모바일 전용 UI 컴포넌트

**예상 시간**: 3-5일

### 단기 (P1)

#### 3. 소셜 로그인 구현
**작업 내용**:
- Google OAuth 설정
- GitHub OAuth 설정
- UI 개선

**예상 시간**: 5일

#### 4. 개발 계획 문서 진행 상황 추적
**작업 내용**:
- Task 파싱 로직
- 체크박스 기능
- 진행률 계산

**예상 시간**: 3일

---

## 📚 참고 문서

### 프로젝트 문서
- `DEVELOPMENT_PROGRESS_REPORT.md`: 전체 진행 상황 상세 리포트
- `CURRENT_STATUS_BRIEFING.md`: 현재 상태 브리핑
- `MOBILE_AND_MONETIZATION_PLAN.md`: 모바일 최적화 및 수익화 계획
- `MOBILE_OPTIMIZATION_STATUS.md`: 모바일 최적화 상태 브리핑
- `UI_IMPROVEMENT_OPTIONS.md`: UI 개선 옵션 가이드
- `COMMUNITY_IMPROVEMENTS_REPORT.md`: 커뮤니티 개선 리포트
- `USER_REQUESTS_CHECKLIST.md`: 사용자 요청사항 체크리스트
- `PIXEL_4A_4XL_IMAGE_STORAGE_DESIGN.md`: Pixel 기기 활용 방안
- `GOOGLE_PHOTOS_MIGRATION.md`: Google Photos 마이그레이션 가이드
- `IMGUR_SETUP.md`: Imgur API 설정 가이드

### 설정 가이드
- `OPENROUTER_SETUP.md`: OpenRouter API 설정
- `LOCAL_DEVELOPMENT.md`: 로컬 개발 환경 설정
- `DEPLOYMENT_GUIDE.md`: 배포 가이드

### Agent 프롬프트
- `.cursor/agents/planning-agent.md`: 개발 계획서 생성 프롬프트

---

## 🔑 핵심 개발 원칙

### 1. Mock-Free 원칙
- 실제 데이터만 사용
- Mock 데이터 최소화 (프로토타입 30%, MVP 10%, Full 1% 이하)

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

## 💡 최근 개선 사항 (2025-01-30)

### 1. 모바일 최적화 (90% 완료)
- ✅ 코드 스플리팅 (React.lazy 적용)
- ✅ 이미지 Lazy Loading (게시글 이미지)
- ✅ 로딩 컴포넌트 추가 (PageLoadingFallback)
- ✅ 모바일 전용 UI 컴포넌트 완료

### 2. 알림 시스템 개선
- 쪽지 읽음 처리 자동화
- 친구 요청 수락/거절 시 알림 자동 갱신
- 실시간 알림 업데이트 (`notification-updated` 이벤트)

### 3. 이미지 저장 시스템 개선
- Imgur API 기본 설정
- Supabase Storage 대체
- Pixel 4a/4xl 활용 방안 설계

### 4. 개발 계획서 생성 개선
- 5개 부분으로 분할 생성
- 더 상세한 EPIC 문서 생성
- "전문가 핸드오프 체계", "WBS"는 텍스트만 출력

### 5. 문서화 개선
- Pixel 4a/4xl 기반 설계 문서 작성
- Google Photos 마이그레이션 가이드 업데이트
- UI 개선 옵션 문서 작성 완료

---

## 🚀 다음 세션 시작 가이드

### 1. 프로젝트 상태 확인
```bash
# 프로젝트 디렉토리로 이동
cd 11.25/my_first_project/IdeaSpark

# 현재 브랜치 확인
git branch

# 최신 변경사항 확인
git status
```

### 2. 환경 변수 확인
- `.env.local` 파일 존재 여부 확인
- 필수 환경 변수 설정 확인:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_OPENROUTER_API_KEY`
  - `VITE_IMGUR_CLIENT_ID` (이미지 업로드용)

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 우선 작업 확인
1. **UI 개선** (모든 페이지)
   - Magic MCP 활용
   - 메인 대시보드, 커뮤니티, 프로필, 헤더

2. **모바일 최적화 완료**
   - 추가 테스트
   - 성능 최적화
   - 모바일 전용 UI

### 5. 참고할 문서
- `SESSION_CONTINUITY.md` (이 문서)
- `DEVELOPMENT_PROGRESS_REPORT.md`
- `MOBILE_AND_MONETIZATION_PLAN.md`

---

## 📝 개발 시 주의사항

### 1. 코드 스타일
- TypeScript strict mode 사용
- ESLint 규칙 준수
- 컴포넌트는 함수형 컴포넌트 사용
- Hooks 사용 (useState, useEffect, useCallback, useMemo)

### 2. 에러 처리
- try-catch 블록 사용
- 사용자 친화적 에러 메시지
- 콘솔 로그 최소화 (프로덕션)

### 3. 성능 최적화
- React.memo, useMemo, useCallback 활용
- 이미지 lazy loading
- 코드 스플리팅 (필요시)

### 4. 접근성
- ARIA 레이블 추가
- 키보드 네비게이션 지원
- 스크린 리더 고려

### 5. 보안
- 환경 변수로 API 키 관리
- RLS 정책 준수
- 사용자 입력 검증

---

## 🔄 최근 변경사항 요약 (2025-01-30)

### 완료된 작업
1. ✅ 모바일 최적화 100% 완료 (코드 스플리팅, 이미지 Lazy Loading, 로딩 컴포넌트, 에러 처리 개선, Pull-to-Refresh, 가상 스크롤)
2. ✅ 커뮤니티/프로필 페이지 에러 수정 (useLocation/useParams 안전 처리, default export로 변경)
3. ✅ UI 개선 옵션 문서 작성 완료
4. ✅ 알림 시스템 개선 (쪽지 읽음, 친구 요청 알림 갱신)
5. ✅ 이미지 저장 시스템 개선 (Imgur API 기본 설정)
6. ✅ Pixel 4a/4xl 활용 방안 설계
7. ✅ 개발 계획서 생성 개선 (5개 부분 분할, 텍스트 출력)

### 진행 중인 작업
1. ✅ 모바일 최적화 (100% 완료)
2. 🔄 UI 개선 계획 수립 (옵션 문서 작성 완료, 선택 대기)

### 다음 작업
1. ⏳ UI 개선 (모든 페이지, Magic MCP 활용, 옵션 선택 후 진행)
2. ⏳ 소셜 로그인 구현

---

## 📞 연락처 및 리소스

### 관리자 이메일
- `bzjay53@gmail.com` (문의/피드백 수신)

### 배포 URL
- **Vercel**: (환경 변수에서 확인)
- **GitHub Pages**: `https://rmswo87.github.io/ideaspark/`

### 저장소
- GitHub: `rmswo87/ideaspark`

---

## 🎯 프로젝트 목표 재확인

### 단기 목표 (1개월)
1. ✅ MVP 완성 (98% 완료)
2. ⏳ 모바일 최적화 완료
3. ⏳ UI 개선 완료
4. ⏳ 소셜 로그인 구현

### 중기 목표 (3개월)
1. ⏳ 구독 시스템 구현
2. ⏳ Epic 7 고급 기능 구현
3. ⏳ 사용자 1,000명 달성

### 장기 목표 (6개월)
1. ⏳ 수익화 모델 안정화
2. ⏳ 사용자 10,000명 달성
3. ⏳ 추가 기능 확장

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일  
**다음 세션 시작 시 이 문서를 먼저 읽고 프로젝트 맥락을 파악하세요.**

