# IdeaSpark 프로젝트 세션 연속성 문서

**작성일**: 2025년 12월 5일  
**최종 업데이트**: 2025년 12월 15일 (React 보안 패치 완료)  
**목적**: 새 채팅 세션에서 프로젝트 맥락을 빠르게 파악하고 작업을 이어갈 수 있도록 전체 상황 정리  
**대상**: AI Assistant 및 개발자

**✅ 최근 완료 (2025-12-15)**: React 보안 취약점 패치 완료
- React 및 React-DOM 19.2.0 → 19.2.3 업데이트
- esbuild, path-to-regexp, undici 보안 취약점 해결 (overrides 추가)
- 모든 보안 취약점 해결 완료 (0 vulnerabilities)

**⚠️ 중요**: 일부 기능은 확인이 필요합니다. 아래 "현재 문제" 섹션을 확인하세요.

**✅ 최근 완료**: 프리미엄 추천 아이디어 깜빡임 문제는 해결되었고 (HomePage에서 PremiumRecommendedIdeas 컴포넌트 제거), DevNewsFeedPage Select 위치 문제도 해결 완료되었습니다.

**📋 향후 계획**: 프리미엄 추천 아이디어 이메일 알림 서비스는 Resend가 유료 서비스이므로, 서비스가 진짜 필요한 사용자가 많이 생기면 추가 예정입니다.

---

## 📌 프로젝트 개요

### ⚠️ 중요: GitHub 저장소 정보 (절대 변경 금지)

**공식 GitHub 저장소**: `https://github.com/rmswo87/ideaspark`

**약속사항**:
- ✅ **오직 `rmswo87/ideaspark` 저장소에만 푸시합니다**
- ❌ **다른 계정(`bzjay53` 등)이나 다른 저장소(`sparkideas-frontend` 등)에 절대 푸시하지 않습니다**
- ✅ **모든 배포는 `rmswo87/ideaspark` 저장소를 기준으로 합니다**
- ✅ **Vercel 배포는 `rmswo87/ideaspark` 저장소와 연결되어 있습니다**

**로컬 Git 설정 확인**:
```bash
git remote -v
# 출력: origin  https://github.com/rmswo87/ideaspark.git (fetch)
#      origin  https://github.com/rmswo87/ideaspark.git (push)
```

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

## 📊 현재 진행 상황 (2025-12-07 기준)

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