# IdeaSpark

> Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼

**현재 상태**: MVP 98% 완료 | 전체 87% 완료  
**최종 업데이트**: 2025년 12월 16일

---

## ⚠️ 중요: Git 작업 경로 및 GitHub 저장소 정보 (절대 변경 금지)

### 프로젝트 경로
**절대 경로**: `E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark`  
**상대 경로**: `11.25/my_first_project/IdeaSpark`

### Git 작업 규칙 (절대 준수 필수)
1. **반드시 프로젝트 폴더에서만 Git 작업 수행**
   ```bash
   cd "11.25/my_first_project/IdeaSpark"
   # 또는
   cd "E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark"
   ```

2. **최상위 cursor 폴더에서 Git 작업 금지**
   - ❌ `E:\study\Business\Develope\cursor`에서 git push 하면 안 됨
   - ✅ `11.25/my_first_project/IdeaSpark`에서만 git push 해야 함

3. **Git 저장소 확인 방법**
   ```bash
   git rev-parse --show-toplevel
   # 출력: E:/study/Business/Develope/cursor/11.25/my_first_project/IdeaSpark
   ```

### GitHub 저장소 정보
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

---

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [빠른 시작](#-빠른-시작)
- [프로젝트 구조](#-프로젝트-구조)
- [모듈별 진행 상황](#-모듈별-진행-상황)
- [리팩토링 완료 내역](#-리팩토링-완료-내역)
- [남은 작업](#-남은-작업)
- [문서 구조](#-문서-구조)
- [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 개요

### 핵심 가치 제안
1. **실시간 아이디어 발굴**: Reddit API를 통한 다양한 분야의 불편함과 니즈 자동 수집
2. **자동화된 기획 문서**: AI 기반 PRD/개발계획서/제안서 자동 생성으로 기획 시간 90% 단축
3. **시각적 프로젝트 관리**: Mermaid 기반 WBS 및 개발 계획 시각화
4. **활발한 커뮤니티**: SNS 스타일 피드로 아이디어 공유 및 협업

### 기술 스택
- **Frontend**: React 19.2.3 + Vite + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Vercel (Edge Functions)
- **AI**: OpenRouter (무료 모델)
- **API**: Reddit API (OAuth2)

---

## 🚀 빠른 시작

### 환경 변수 설정

`.env.local` 파일 생성:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_OPENROUTER_MODEL=google/gemini-flash-1.5
VITE_AI_PROVIDER=openrouter
VITE_IMGUR_CLIENT_ID=your_imgur_client_id
```

### 로컬 개발

```bash
# Vercel 개발 서버 (권장)
vercel dev

# 또는 일반 개발 서버
npm run dev
```

### 배포

```bash
# Vercel 프로덕션 배포
vercel --prod
```

자세한 설정은 [환경 변수 설정 가이드](./docs/setup/ENV_SETUP.md)를 참고하세요.

---

## 📁 프로젝트 구조

```
IdeaSpark/
├── README.md                    # 이 파일 (프로젝트 관리 문서)
├── docs/                        # 문서 폴더
│   ├── setup/                  # 설정 가이드 (7개)
│   ├── deployment/             # 배포 가이드 (5개)
│   ├── development/            # 개발 문서 (15개)
│   └── archive/                # 보관 문서 (12개)
├── src/                        # 소스 코드
│   ├── pages/                  # 페이지 컴포넌트
│   ├── components/             # 재사용 컴포넌트
│   ├── services/               # 비즈니스 로직
│   ├── hooks/                  # React Hooks
│   └── lib/                    # 유틸리티
├── api/                        # Vercel Edge Functions
│   ├── collect-ideas.ts        # 아이디어 수집
│   ├── collect-ideas-local.ts  # 로컬 개발용
│   ├── cron/collect-ideas.ts   # Cron Job
│   └── image-proxy.ts          # 이미지 프록시
├── supabase/
│   ├── functions/              # Supabase Edge Functions
│   │   ├── collect-ideas/
│   │   └── send-contact-email/
│   └── migrations/             # 데이터베이스 마이그레이션 (7개)
└── public/                     # 정적 파일
```

---

## 📊 모듈별 진행 상황

### Epic 0: 프로젝트 초기 설정
**진행률**: 100% ✅ 완료

- ✅ React + Vite + TypeScript 설정
- ✅ Tailwind CSS + Shadcn/UI 설정
- ✅ Supabase 연동
- ✅ 환경 변수 관리
- ✅ Vercel/GitHub Pages 배포 설정

### Epic 1: Reddit API 연동
**진행률**: 95% ✅ 거의 완료

**완료된 기능**:
- ✅ Reddit API OAuth2 인증
- ✅ 일일 자동 수집 (Cron Job, 오전 9시, 오후 6시)
- ✅ 아이디어 필터링 (카테고리, 서브레딧, 검색)
- ✅ 정렬 (최신순, 인기순, 댓글순)
- ✅ 통계 표시 및 키워드 클릭 필터링

**남은 작업**:
- ⏳ 일부 서브레딧 403 에러 처리 개선

### Epic 2: PRD 자동 생성
**진행률**: 95% ✅ 거의 완료

**완료된 기능**:
- ✅ PRD 자동 생성 (상세 양식, Mermaid 다이어그램)
- ✅ 개발 계획서 생성 (5개 부분 분할 생성)
- ✅ 제안서 생성 (다중 버전 관리)
- ✅ Mermaid 다이어그램 렌더링 (iframe 기반)
- ✅ PDF/Markdown 다운로드

**남은 작업**:
- ⏳ Mermaid 다이어그램 간헐적 깨짐 현상 해결

### Epic 3: 커뮤니티 기능
**진행률**: 98% ✅ 거의 완료

**완료된 기능**:
- ✅ SNS 스타일 피드
- ✅ 무한 스크롤
- ✅ 게시글 작성/조회/수정/삭제
- ✅ 댓글 시스템 (계층 구조, 익명 지원)
- ✅ 좋아요/북마크
- ✅ 이미지 업로드 (Imgur API)
- ✅ 태그 시스템 및 검색/필터

**남은 작업**:
- ⏳ 모바일 최적화 완료

### Epic 4: 사용자 관리 및 소셜 기능
**진행률**: 100% ✅ 완료

- ✅ 프로필 관리 (닉네임, 소개, 공개/비공개)
- ✅ 프로필 사진 업로드
- ✅ 친구 시스템 (요청, 수락, 거절)
- ✅ 쪽지 시스템 (1:1 대화, 읽음 처리)
- ✅ 차단 기능
- ✅ 알림 배지

### Epic 5: 관리자 기능
**진행률**: 90% ✅ 거의 완료

- ✅ 관리자 인증
- ✅ 관리자 대시보드
- ✅ 사용자/아이디어/게시글 관리
- ✅ 문의/피드백 관리
- ✅ 이메일 알림 (Resend API)

### Epic 6: 배포 및 최적화
**진행률**: 97% ✅ 거의 완료

**완료된 작업**:
- ✅ Vercel 배포 (자동 배포)
- ✅ GitHub Pages 배포 (백업)
- ✅ 환경 변수 관리
- ✅ 이미지 프록시
- ✅ SPA 라우팅 처리
- ✅ 모바일 터치 최적화 (부분 완료)

**남은 작업**:
- ⏳ 모바일 최적화 완료 (추가 테스트 및 미세 조정)

### Epic 7: 고급 아이디어 기능
**진행률**: 0% 📋 기획 완료

**대기 중인 Task** (9개):
1. 아이디어 추천 시스템
2. 아이디어 실행 현황 추적
3. 아이디어 투표 및 우선순위
4. AI 아이디어 분석 및 인사이트
5. 아이디어 협업 기능
6. 아이디어 챌린지/이벤트
7. 실시간 알림 시스템
8. 아이디어 실행 로드맵 공유
9. 데이터 분석 대시보드

### Epic 8: 모바일 최적화 및 수익화
**진행률**: 25% 🔄 진행 중

**완료된 작업**:
- ✅ 도네이션 기능 (프로필 페이지 통합)

**진행 중**:
- 🔄 모바일 최적화 (25% 완료)

**대기 중**:
- ⏳ 소셜 로그인 (Google/GitHub)
- ⏳ 구독 시스템 (Stripe 연동)

---

## 🔄 리팩토링 완료 내역 (2025-01-30)

### Phase 1: 문서 정리 ✅
- 중복 문서 병합: 4개 문서 통합
- 사용하지 않는 문서 제거: 3개
- 필터 관련 디버깅 문서 보관: 4개
- 동기화 관련 문서 보관: 3개
- 문서 구조 개선: `docs/` 폴더로 분류

### Phase 2: 코드 정리 ✅
- 테스트 파일 제거: `testSupabase.ts`
- 번역 관련 파일 제거: `translate-reddit.ts`, `translate-text.ts`
- Supabase Function 제거: `translate-text`
- 로컬 개발용 파일 개선: `collect-ideas-local.ts` 주석 추가

### Phase 3-4: 경로 및 의존성 정리 ✅
- `.gitignore` 확인 완료
- 모든 패키지 사용 중 확인 완료

### 최종 결과
- **루트 문서**: 40개 → 1개 (README.md만 유지)
- **문서 구조화**: `docs/setup/`, `docs/deployment/`, `docs/development/`, `docs/archive/`
- **코드 정리**: 불필요한 파일 제거 완료

---

## 📋 남은 작업

### [P0] 즉시 처리 필요

#### 1. 모바일 최적화 완료
**예상 작업량**: 1일

**남은 작업**:
- 추가 테스트 및 미세 조정
- 모바일 성능 최적화
- 모바일 전용 UI 컴포넌트 (햄버거 메뉴, 하단 네비게이션)

**참고**: [모바일 및 수익화 계획](./docs/development/MOBILE_AND_MONETIZATION_PLAN.md)

#### 2. UI 개선 (모든 페이지)
**예상 작업량**: 5-7일

**대상 페이지**:
- 메인 대시보드 (아이디어 카드 그리드)
- 커뮤니티 페이지 (SNS 스타일 피드)
- 프로필 페이지 (탭 레이아웃)
- 헤더/네비게이션

**방법**: Magic MCP (21st.dev) 활용

**참고**: [UI 개선 계획](./docs/development/UI_IMPROVEMENT_PLAN.md)

#### 3. Mermaid 렌더링 안정성 개선
**예상 작업량**: 1-2일

- 간헐적 깨짐 현상 해결
- WBS Gantt 차트 스타일 통일성 개선

### [P1] 단기 (1-2주 내)

#### 4. 소셜 로그인 구현
**예상 작업량**: 5일

- Google OAuth 설정 및 구현
- GitHub OAuth 설정 및 구현
- 소셜 로그인 UI 개선

**참고**: [모바일 및 수익화 계획](./docs/development/MOBILE_AND_MONETIZATION_PLAN.md)

#### 5. 개발 계획 문서 진행 상황 추적
**예상 작업량**: 3일

- 개발 계획서 내용 파싱하여 Task 목록 추출
- 각 Task의 완료 상태 체크박스 기능
- 진행률 자동 계산 및 표시

### [P2] 중기 (3-4주 내)

#### 6. 구독 모델 구현
**예상 작업량**: 10일

- Stripe 연동
- 구독 플랜 관리 (Free/Pro/Business)
- 사용량 제한 로직
- 구독 관리 UI

#### 7. Epic 7: 고급 아이디어 기능
**예상 작업량**: 20일 (4주)

9개 Task 순차 구현

---

## 📚 문서 구조

### 설정 가이드 (`docs/setup/`)
- [환경 변수 설정](./docs/setup/ENV_SETUP.md)
- [OpenRouter API 설정](./docs/setup/OPENROUTER_SETUP.md)
- [Imgur 설정](./docs/setup/IMGUR_SETUP.md)
- [저장소 설정 가이드](./docs/setup/STORAGE_SETUP_GUIDE.md)
- [문의 설정](./docs/setup/CONTACT_INQUIRY_SETUP.md)
- [관리자 가이드](./docs/setup/ADMIN_GUIDE.md)
- [문제 해결 가이드](./docs/setup/TROUBLESHOOTING.md)

### 배포 가이드 (`docs/deployment/`)
- [Vercel 배포 가이드](./docs/deployment/VERCEL_DEPLOY.md)
- [GitHub Pages 배포](./docs/deployment/GITHUB_PAGES_SETUP.md)
- [Supabase Edge Functions](./docs/deployment/SUPABASE_EDGE_FUNCTIONS_SETUP.md)
- [API Provider 설정](./docs/deployment/API_PROVIDER_SETUP.md)
- [Vercel 호환성](./docs/deployment/VERCEL_COMPATIBILITY.md)

### 개발 문서 (`docs/development/`)
- [개발 진행 리포트](./docs/development/DEVELOPMENT_PROGRESS_REPORT.md) - **최신 진행 상황**
- [세션 연속성 문서](./docs/development/SESSION_CONTINUITY.md) - **프로젝트 전체 맥락**
- [로컬 개발 가이드](./docs/development/LOCAL_DEVELOPMENT.md)
- [모바일 및 수익화 계획](./docs/development/MOBILE_AND_MONETIZATION_PLAN.md)
- [UI 개선 계획](./docs/development/UI_IMPROVEMENT_PLAN.md)
- [리팩토링 계획](./docs/development/REFACTORING_PLAN.md)
- [기능 제안](./docs/development/FEATURE_SUGGESTIONS.md)
- [사용자 요청 체크리스트](./docs/development/USER_REQUESTS_CHECKLIST.md)
- 기타 개발 관련 문서 (15개)

### 보관 문서 (`docs/archive/`)
- 오래된 문서 및 디버깅 문서 (12개)

---

## 🛠️ 개발 가이드

### 프로젝트 관리 원칙

1. **작은 단위 커밋**: 각 기능 완료 후 즉시 커밋
2. **명확한 커밋 메시지**: `feat:`, `fix:`, `refactor:` 등 컨벤션 사용
3. **검증 후 진행**: 각 단계마다 빌드/런타임 테스트 필수
4. **문서 업데이트**: 중요한 변경사항은 관련 문서 업데이트

### Git 워크플로우

```bash
# 기능 개발
git checkout -b feature/feature-name
# 작업 후
git add .
git commit -m "feat: 기능 설명"
git push origin feature/feature-name

# 리팩토링
git checkout -b refactoring/refactor-name
# 작업 후
git add .
git commit -m "refactor: 리팩토링 설명"
```

### 빌드 및 테스트

```bash
# 빌드 테스트
npm run build

# 개발 서버
npm run dev
# 또는
vercel dev

# 린트 체크
npm run lint
```

### 환경 변수 관리

- 로컬: `.env.local` 파일 사용
- Vercel: 대시보드에서 환경 변수 설정
- GitHub Pages: GitHub Secrets 사용

---

## 📊 진행 상황 체크리스트

### MVP 완료도: 98%

- [x] Epic 0: 프로젝트 초기 설정 (100%)
- [x] Epic 1: Reddit API 연동 (95%)
- [x] Epic 2: PRD 자동 생성 (95%)
- [x] Epic 3: 커뮤니티 기능 (98%)
- [x] Epic 4: 사용자 관리 및 소셜 기능 (100%)
- [x] Epic 5: 관리자 기능 (90%)
- [x] Epic 6: 배포 및 최적화 (97%)

### 전체 완료도: 87%

- [ ] Epic 7: 고급 아이디어 기능 (0% - 기획 완료)
- [ ] Epic 8: 모바일 최적화 및 수익화 (25%)

---

## 🔍 주요 파일 위치

### 핵심 컴포넌트
- 메인 앱: `src/App.tsx`
- 아이디어 상세: `src/pages/IdeaDetailPage.tsx`
- 커뮤니티: `src/pages/CommunityPage.tsx`
- 프로필: `src/pages/ProfilePage.tsx`

### 서비스
- AI 서비스: `src/services/ai.ts`
- 아이디어 서비스: `src/services/ideaService.ts`
- PRD 서비스: `src/services/prdService.ts`
- 이미지 서비스: `src/services/imageService.ts`

### API
- 아이디어 수집: `api/collect-ideas.ts`
- Cron Job: `api/cron/collect-ideas.ts`
- 이미지 프록시: `api/image-proxy.ts`

---

## 📝 최근 업데이트

### 2025-12-16: 문서 업데이트 및 Git 작업 경로 규칙 명확화
- ✅ GitHub 저장소 정보 문서에 명시
- ✅ 다른 계정/저장소에 푸시하지 않겠다는 약속 기록
- ✅ 세션 연속성 문서 업데이트 (최신 커밋 정보 반영)
- ✅ 새 채팅 시작 프롬프트 업데이트
- ✅ Git 작업 경로 규칙 문서화 완료

### 2025-12-15: React 보안 패치 완료
- ✅ React 및 React-DOM 19.2.3 업데이트
- ✅ 모든 보안 취약점 해결 완료 (0 vulnerabilities)

### 2025-01-30: 리팩토링 완료
- ✅ 문서 구조 대폭 개선 (40개 → 1개 루트 문서)
- ✅ 코드 정리 완료 (불필요한 파일 제거)
- ✅ 번역 기능 관련 파일 완전 제거
- ✅ Supabase Functions 정리

### 2025-01-30: 기능 개선
- ✅ 커뮤니티 UI 개선
- ✅ 모바일 최적화 부분 완료
- ✅ 도네이션 기능 완료

---

## 🎯 다음 세션 시작 가이드

### 새 채팅 시작 시
**새 채팅을 시작할 때는 다음 프롬프트를 사용하세요:**
- [새 채팅 시작 프롬프트](./docs/development/NEW_CHAT_PROMPT.md) 참고

### 작업 시작 전 확인사항

1. **프로젝트 상태 확인**
   ```bash
   git status
   git log --oneline -5
   ```

2. **개발 서버 실행**
   ```bash
   vercel dev
   ```

3. **우선 작업 확인**
   - [세션 연속성 문서](./docs/development/SESSION_CONTINUITY.md) 참고 (필수)
   - [개발 진행 리포트](./docs/development/DEVELOPMENT_PROGRESS_REPORT.md) 참고

4. **문서 참고**
   - 설정: `docs/setup/`
   - 배포: `docs/deployment/`
   - 개발: `docs/development/`

---

## 📞 연락처 및 리소스

- **관리자 이메일**: bzjay53@gmail.com
- **배포 URL**: Vercel 대시보드에서 확인
- **GitHub**: https://github.com/rmswo87/ideaspark

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 16일  
**다음 작업**: 모바일 최적화 완료, UI 개선
