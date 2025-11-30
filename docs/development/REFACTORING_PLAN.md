# IdeaSpark 프로젝트 리팩토링 계획서

**작성일**: 2025년 1월 30일  
**목적**: 불필요한 문서, 파일, 경로, 더미 및 테스트 파일 정리  
**원칙**: 작은 단위로 검증하며 진행, 각 단계마다 서비스 동작 확인

---

## 📋 리팩토링 목표

### 1. 문서 정리
- 중복 문서 제거
- 사용하지 않는 문서 제거
- 문서 구조 개선

### 2. 코드 정리
- 테스트 파일 정리
- 더미 데이터 제거
- 사용하지 않는 파일 제거

### 3. 경로 정리
- 불필요한 디렉토리 제거
- 파일 구조 개선

### 4. 의존성 정리
- 사용하지 않는 패키지 제거
- 중복 의존성 제거

---

## 🔍 현재 상태 분석

### 문서 파일 목록
**확인 필요 문서**:
- `ADMIN_GUIDE.md` - 관리자 가이드 (필요)
- `ADMIN_SETUP.sql` - 관리자 설정 SQL (필요)
- `API_PROVIDER_SETUP.md` - API 제공자 설정 (확인 필요)
- `CLONE_MAIN_BRANCH.md` - 브랜치 클론 가이드 (확인 필요)
- `COMMUNITY_IMPROVEMENTS_REPORT.md` - 커뮤니티 개선 리포트 (필요)
- `CONTACT_INQUIRY_SETUP.md` - 문의 설정 가이드 (필요)
- `CURRENT_STATUS_BRIEFING.md` - 현재 상태 브리핑 (필요)
- `DEPLOY_STEPS.md` - 배포 단계 (확인 필요)
- `DEPLOYMENT_GUIDE.md` - 배포 가이드 (필요)
- `DEVELOPMENT_PROGRESS_REPORT.md` - 개발 진행 리포트 (필요)
- `ENV_SETUP.md` - 환경 변수 설정 (필요)
- `FEATURE_SUGGESTIONS.md` - 기능 제안 (확인 필요)
- `FILTER_DEBUGGING_CHECKLIST.md` - 필터 디버깅 체크리스트 (확인 필요)
- `FILTER_DEBUGGING_SYSTEMATIC_CHECKLIST.md` - 필터 디버깅 체계적 체크리스트 (확인 필요)
- `FILTER_FEATURES.md` - 필터 기능 (확인 필요)
- `FILTER_FIX_SYSTEMATIC_APPROACH.md` - 필터 수정 체계적 접근 (확인 필요)
- `FILTER_VERIFICATION_CHECKLIST.md` - 필터 검증 체크리스트 (확인 필요)
- `GITHUB_PAGES_SETUP_INSTRUCTIONS.md` - GitHub Pages 설정 (필요)
- `GITHUB_PAGES_SETUP.md` - GitHub Pages 설정 (중복 가능)
- `GOOGLE_PHOTOS_MIGRATION.md` - Google Photos 마이그레이션 (필요)
- `GOOGLE_TRANSLATE_SETUP.md` - Google Translate 설정 (사용 안 함, 제거 가능)
- `IMGUR_SETUP.md` - Imgur 설정 (필요)
- `LOCAL_DEVELOPMENT.md` - 로컬 개발 (필요)
- `MERMAID_REACT_INTEGRATION_GUIDE.md` - Mermaid React 통합 (확인 필요)
- `MOBILE_AND_MONETIZATION_PLAN.md` - 모바일 및 수익화 계획 (필요)
- `MOBILE_OPTIMIZATION.md` - 모바일 최적화 (확인 필요, 중복 가능)
- `OPENROUTER_SETUP.md` - OpenRouter 설정 (필요)
- `PIXEL_4A_4XL_IMAGE_STORAGE_DESIGN.md` - Pixel 4a/4xl 설계 (필요)
- `PIXEL_4A_UNLIMITED_STORAGE_IMPLEMENTATION.md` - Pixel 4a 무한 저장 구현 (필요, 신규)
- `PROGRESS_BRIEFING.md` - 진행 브리핑 (확인 필요, 중복 가능)
- `PROGRESS_REPORT.md` - 진행 리포트 (확인 필요, 중복 가능)
- `README.md` - 프로젝트 README (필요)
- `REDDIT_TRANSLATION.md` - Reddit 번역 (사용 안 함, 제거 가능)
- `REFACTORING_PLAN.md` - 리팩토링 계획 (필요, 신규)
- `SESSION_CONTINUITY.md` - 세션 연속성 (필요, 신규)
- `SOLUTION.md` - 솔루션 (확인 필요)
- `STORAGE_SETUP_GUIDE.md` - 저장소 설정 가이드 (필요)
- `SUPABASE_EDGE_FUNCTIONS_SETUP.md` - Supabase Edge Functions 설정 (필요)
- `SYNC_VERIFICATION.md` - 동기화 검증 (확인 필요)
- `SYNC_WITH_MAIN.md` - 메인과 동기화 (확인 필요)
- `TRANSLATION_UPDATE.md` - 번역 업데이트 (사용 안 함, 제거 가능)
- `TROUBLESHOOTING.md` - 문제 해결 (필요)
- `UI_IMPROVEMENT_PLAN.md` - UI 개선 계획 (필요, 신규)
- `USER_REQUESTS_CHECKLIST.md` - 사용자 요청 체크리스트 (필요)
- `VERCEL_COMPATIBILITY.md` - Vercel 호환성 (확인 필요)
- `VERCEL_DEPLOY_NOW.md` - Vercel 배포 (확인 필요, 중복 가능)
- `VERCEL_DEPLOY.md` - Vercel 배포 (필요)

### 테스트 파일
- `src/utils/testSupabase.ts` - Supabase 테스트 (확인 필요)

### 더미/임시 파일
- 확인 필요

---

## 📅 리팩토링 단계별 계획

### Phase 1: 문서 정리 (작은 단위로 진행)

#### Step 1.1: 중복 문서 확인 및 병합
**작업 내용**:
1. `GITHUB_PAGES_SETUP.md`와 `GITHUB_PAGES_SETUP_INSTRUCTIONS.md` 비교
2. `MOBILE_OPTIMIZATION.md`와 `MOBILE_AND_MONETIZATION_PLAN.md` 비교
3. `PROGRESS_BRIEFING.md`와 `PROGRESS_REPORT.md`, `DEVELOPMENT_PROGRESS_REPORT.md` 비교
4. `VERCEL_DEPLOY.md`와 `VERCEL_DEPLOY_NOW.md` 비교

**검증 방법**:
- 각 문서 내용 비교
- 중복 내용 병합
- 하나의 문서로 통합
- 통합 후 다른 문서에서 참조하는지 확인 (`grep` 사용)

**예상 시간**: 30분

#### Step 1.2: 사용하지 않는 문서 제거
**대상 문서**:
- `GOOGLE_TRANSLATE_SETUP.md` (번역 기능 제거됨)
- `REDDIT_TRANSLATION.md` (번역 기능 제거됨)
- `TRANSLATION_UPDATE.md` (번역 기능 제거됨)

**검증 방법**:
1. 문서 내용 확인
2. 코드에서 참조하는지 확인 (`grep -r "GOOGLE_TRANSLATE\|REDDIT_TRANSLATION\|TRANSLATION_UPDATE" src/`)
3. 다른 문서에서 참조하는지 확인 (`grep -r "GOOGLE_TRANSLATE\|REDDIT_TRANSLATION\|TRANSLATION_UPDATE" *.md`)
4. 참조가 없으면 제거

**예상 시간**: 15분

#### Step 1.3: 필터 관련 디버깅 문서 정리
**대상 문서**:
- `FILTER_DEBUGGING_CHECKLIST.md`
- `FILTER_DEBUGGING_SYSTEMATIC_CHECKLIST.md`
- `FILTER_FEATURES.md`
- `FILTER_FIX_SYSTEMATIC_APPROACH.md`
- `FILTER_VERIFICATION_CHECKLIST.md`

**작업 내용**:
1. 필터 기능이 정상 작동하는지 확인
2. 디버깅 문서가 여전히 필요한지 확인
3. 필요 없으면 `docs/archive/` 폴더로 이동 (삭제 대신 보관)

**검증 방법**:
- 필터 기능 테스트 (메인 페이지에서 필터 작동 확인)
- 필터 관련 이슈가 있는지 확인
- 이슈가 없으면 보관 처리

**예상 시간**: 20분

#### Step 1.4: 동기화 관련 문서 정리
**대상 문서**:
- `SYNC_VERIFICATION.md`
- `SYNC_WITH_MAIN.md`
- `CLONE_MAIN_BRANCH.md`

**작업 내용**:
1. 문서 내용 확인
2. 현재 브랜치 구조 확인
3. 필요 없으면 보관 처리

**검증 방법**:
- Git 브랜치 확인 (`git branch`)
- 문서 내용이 현재 상황과 일치하는지 확인

**예상 시간**: 15분

#### Step 1.5: 문서 구조 개선
**작업 내용**:
1. `docs/` 폴더 생성
2. 문서 분류:
   - `docs/setup/` - 설정 가이드
   - `docs/deployment/` - 배포 가이드
   - `docs/development/` - 개발 문서
   - `docs/archive/` - 보관 문서

**검증 방법**:
- 문서 이동 후 링크 확인
- README.md에서 문서 경로 업데이트

**예상 시간**: 30분

---

### Phase 2: 코드 정리 (매우 조심스럽게 진행)

#### Step 2.1: 테스트 파일 확인
**대상 파일**:
- `src/utils/testSupabase.ts`

**작업 내용**:
1. 파일 내용 확인
2. 코드에서 사용하는지 확인 (`grep -r "testSupabase" src/`)
3. 사용하지 않으면 제거

**검증 방법**:
- 파일 제거 전 빌드 테스트 (`npm run build`)
- 런타임 테스트 (`npm run dev`)

**예상 시간**: 10분

#### Step 2.2: 사용하지 않는 서비스 파일 확인
**대상 파일**:
- `src/services/googleDriveService.ts` (현재 사용 안 함, 향후 사용 가능)
- `src/services/translationService.ts` (제거됨, 확인 필요)

**작업 내용**:
1. 각 파일이 코드에서 사용되는지 확인
2. 사용하지 않으면 주석 처리 또는 제거
3. 향후 사용 가능한 파일은 `src/services/_archive/` 폴더로 이동

**검증 방법**:
- 파일 제거/이동 후 빌드 테스트
- 런타임 테스트
- 각 페이지에서 기능 테스트

**예상 시간**: 20분

#### Step 2.3: API 파일 정리
**대상 파일**:
- `api/collect-ideas-local.ts` (로컬 개발용, 확인 필요)
- `api/translate-reddit.ts` (번역 기능 제거됨, 제거 가능)
- `api/translate-text.ts` (번역 기능 제거됨, 제거 가능)

**작업 내용**:
1. 각 파일이 사용되는지 확인
2. 번역 관련 파일 제거
3. 로컬 개발용 파일은 주석 추가

**검증 방법**:
- 파일 제거 후 Vercel 배포 테스트
- 로컬 개발 환경 테스트

**예상 시간**: 15분

---

### Phase 3: 경로 및 디렉토리 정리

#### Step 3.1: 불필요한 디렉토리 확인
**대상**:
- `dist/` (빌드 결과물, .gitignore에 포함되어야 함)
- 임시 폴더 확인

**작업 내용**:
1. `.gitignore` 확인
2. 불필요한 디렉토리 제거

**검증 방법**:
- Git 상태 확인 (`git status`)
- 빌드 테스트

**예상 시간**: 10분

---

### Phase 4: 의존성 정리

#### Step 4.1: 사용하지 않는 패키지 확인
**작업 내용**:
1. `package.json` 확인
2. 각 패키지가 코드에서 사용되는지 확인
3. 사용하지 않는 패키지 제거

**검증 방법**:
- 패키지 제거 후 빌드 테스트
- 런타임 테스트
- 각 기능 테스트

**예상 시간**: 30분

---

## 🔒 안전장치

### 각 단계마다 필수 검증

#### 1. Git 커밋
- 각 Phase 시작 전 커밋
- 각 Step 완료 후 커밋

#### 2. 빌드 테스트
```bash
npm run build
```

#### 3. 런타임 테스트
```bash
npm run dev
```

#### 4. 기능 테스트 체크리스트
- [ ] 메인 페이지 로드
- [ ] 아이디어 필터링 작동
- [ ] 커뮤니티 페이지 로드
- [ ] 게시글 작성/조회
- [ ] 프로필 페이지 로드
- [ ] PRD 생성 작동
- [ ] 이미지 업로드 작동

#### 5. 배포 테스트 (선택)
- Vercel 배포 테스트
- GitHub Pages 배포 테스트

---

## 📝 리팩토링 체크리스트

### Phase 1: 문서 정리
- [ ] Step 1.1: 중복 문서 확인 및 병합
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 기능 테스트
- [ ] Step 1.2: 사용하지 않는 문서 제거
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 기능 테스트
- [ ] Step 1.3: 필터 관련 디버깅 문서 정리
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 필터 기능 테스트
- [ ] Step 1.4: 동기화 관련 문서 정리
  - [ ] Git 커밋
  - [ ] 빌드 테스트
- [ ] Step 1.5: 문서 구조 개선
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 문서 링크 확인

### Phase 2: 코드 정리
- [ ] Step 2.1: 테스트 파일 확인
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 런타임 테스트
- [ ] Step 2.2: 사용하지 않는 서비스 파일 확인
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 런타임 테스트
  - [ ] 각 페이지 기능 테스트
- [ ] Step 2.3: API 파일 정리
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] Vercel 배포 테스트 (선택)

### Phase 3: 경로 및 디렉토리 정리
- [ ] Step 3.1: 불필요한 디렉토리 확인
  - [ ] Git 커밋
  - [ ] 빌드 테스트

### Phase 4: 의존성 정리
- [ ] Step 4.1: 사용하지 않는 패키지 확인
  - [ ] Git 커밋
  - [ ] 빌드 테스트
  - [ ] 런타임 테스트
  - [ ] 각 기능 테스트

---

## 🚨 주의사항

### 절대 하지 말아야 할 것
1. **한 번에 많은 파일 제거 금지**
   - 작은 단위로 나누어 진행
   - 각 단계마다 검증

2. **검증 없이 진행 금지**
   - 각 Step 완료 후 반드시 빌드/런타임 테스트
   - 기능 테스트 필수

3. **Git 커밋 없이 진행 금지**
   - 각 Phase 시작 전 커밋
   - 문제 발생 시 롤백 가능하도록

4. **의존성 제거 시 주의**
   - 다른 패키지의 의존성인지 확인
   - 제거 전 반드시 사용 여부 확인

---

## 📊 예상 시간

- **Phase 1**: 1시간 30분
- **Phase 2**: 45분
- **Phase 3**: 10분
- **Phase 4**: 30분

**총 예상 시간**: 약 3시간

---

## 🎯 성공 기준

### 완료 조건
1. ✅ 중복 문서 제거 또는 병합
2. ✅ 사용하지 않는 파일 제거
3. ✅ 문서 구조 개선
4. ✅ 코드 정리 완료
5. ✅ 모든 기능 정상 작동
6. ✅ 빌드 성공
7. ✅ 배포 성공 (선택)

---

## 📝 리팩토링 후 상태

### 예상 결과
- 문서 수: 약 30개 → 약 25개
- 테스트 파일: 정리 완료
- 코드 파일: 정리 완료
- 의존성: 최적화 완료

### 개선 효과
- 프로젝트 구조 명확화
- 유지보수성 향상
- 빌드 시간 단축 (의존성 감소)
- 문서 찾기 용이

---

## 🔐 Git 저장 방법

### 현재 상태
프로젝트에 Git 저장소가 없는 것으로 확인되었습니다.

### Git 저장소 초기화 및 커밋

#### 방법 1: 새 Git 저장소 초기화 (권장)
```bash
cd 11.25/my_first_project/IdeaSpark
git init
git add .
git commit -m "feat: 프로젝트 현재 상태 보존 - 리팩토링 전 백업

- 세션 연속성 문서 추가 (SESSION_CONTINUITY.md)
- UI 개선 계획서 추가 (UI_IMPROVEMENT_PLAN.md)
- Pixel 4a 무한 저장 구현 가이드 추가 (PIXEL_4A_UNLIMITED_STORAGE_IMPLEMENTATION.md)
- 리팩토링 계획서 추가 (REFACTORING_PLAN.md)
- 개발 진행 리포트 업데이트"
```

#### 방법 2: 기존 저장소에 커밋 (이미 Git 저장소가 있는 경우)
```bash
cd 11.25/my_first_project/IdeaSpark
git add .
git commit -m "feat: 프로젝트 현재 상태 보존 - 리팩토링 전 백업

- 세션 연속성 문서 추가 (SESSION_CONTINUITY.md)
- UI 개선 계획서 추가 (UI_IMPROVEMENT_PLAN.md)
- Pixel 4a 무한 저장 구현 가이드 추가 (PIXEL_4A_UNLIMITED_STORAGE_IMPLEMENTATION.md)
- 리팩토링 계획서 추가 (REFACTORING_PLAN.md)
- 개발 진행 리포트 업데이트"
```

#### 방법 3: 원격 저장소 연결 (GitHub 등)
```bash
# 원격 저장소 추가 (예: GitHub)
git remote add origin https://github.com/rmswo87/ideaspark.git

# 브랜치 생성 및 푸시
git branch -M main
git push -u origin main
```

### Git 저장 전 확인사항
1. `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
2. `node_modules/` 폴더가 `.gitignore`에 포함되어 있는지 확인
3. `dist/` 폴더가 `.gitignore`에 포함되어 있는지 확인
4. 민감한 정보(API 키 등)가 커밋되지 않았는지 확인

---

## 📝 리팩토링 전 체크리스트

### Git 저장 전
- [ ] `.gitignore` 확인 및 업데이트
- [ ] 민감한 정보 제거 확인
- [ ] Git 저장소 초기화 또는 커밋

### 리팩토링 시작 전
- [ ] Git 저장 완료 확인
- [ ] 현재 빌드 상태 확인 (`npm run build`)
- [ ] 현재 런타임 상태 확인 (`npm run dev`)
- [ ] 주요 기능 테스트 (아이디어 조회, 커뮤니티, 프로필)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일  
**다음 작업**: Git 저장 후 리팩토링 시작

