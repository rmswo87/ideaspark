# 📱 IdeaSpark 모바일 최적화 및 수익화 계획서

**작성일**: 2025년 1월 29일  
**현재 상태**: MVP 완료 (96%), 모바일 최적화 미완료  
**목표**: 모바일 최적화 완료 + 수익화 전략 수립 + 소셜 로그인 구현

---

## 📊 현재 상태 분석

### 완료된 기능 (PROGRESS_BRIEFING.md 기준)
- ✅ Epic 0-6: MVP 기능 대부분 완료 (96%)
- ✅ 데스크톱 UI/UX 완성
- ✅ 기본 인증 시스템 (Supabase Auth)
- ⚠️ 모바일 반응형 디자인 미완료
- ⚠️ 결제 시스템 미구현
- ⚠️ 소셜 로그인 미구현

### 모바일 최적화 필요 영역
1. **레이아웃 문제**
   - 카드 그리드가 모바일에서 3열 → 1열로 변경 필요
   - 네비게이션 바 모바일 최적화 필요
   - 버튼 크기 및 터치 영역 확대 필요

2. **텍스트 및 폰트**
   - 제목 크기 조정
   - 본문 텍스트 가독성 개선
   - 추천 배지 모바일에서 크기 조정

3. **인터랙션**
   - 터치 제스처 지원
   - 스와이프 네비게이션
   - 모바일 메뉴 (햄버거 메뉴)

4. **성능**
   - 이미지 최적화 (WebP, lazy loading)
   - 코드 스플리팅
   - 모바일 네트워크 최적화

---

## 🎯 Phase 1: 모바일 최적화 (Week 9-10)

### Task 1.1: 반응형 레이아웃 개선 (Week 9, Day 1-2)

#### 1.1.1 카드 그리드 반응형 처리
**현재 상태**: `md:grid-cols-2 lg:grid-cols-3` 사용 중  
**개선 사항**:
- 모바일: 1열 (`grid-cols-1`)
- 태블릿: 2열 (`md:grid-cols-2`)
- 데스크톱: 3열 (`lg:grid-cols-3`)

**파일**: `src/components/RecommendedIdeas.tsx`, `src/App.tsx`

```tsx
// 수정 예시
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

#### 1.1.2 네비게이션 바 모바일 최적화
**현재 상태**: 데스크톱 중심 네비게이션  
**개선 사항**:
- 모바일: 햄버거 메뉴 추가
- 하단 네비게이션 바 (모바일 전용)
- 데스크톱: 기존 상단 네비게이션 유지

**파일**: `src/App.tsx`, 새 파일: `src/components/MobileNavigation.tsx`

#### 1.1.3 버튼 및 터치 영역 확대
**현재 상태**: 버튼 크기가 모바일에서 작을 수 있음  
**개선 사항**:
- 최소 터치 영역: 44px × 44px
- 버튼 간격 확대 (모바일)
- 아이콘 크기 조정

**파일**: 모든 Button 컴포넌트 사용 페이지

### Task 1.2: 텍스트 및 타이포그래피 최적화 (Week 9, Day 3)

#### 1.2.1 반응형 폰트 크기
**개선 사항**:
- 모바일: 기본 폰트 14px
- 태블릿: 기본 폰트 15px
- 데스크톱: 기본 폰트 16px

**파일**: `src/index.css`, `tailwind.config.ts`

```css
/* 모바일 최적화 */
@media (max-width: 640px) {
  :root {
    font-size: 14px;
  }
  
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
}
```

#### 1.2.2 추천 배지 모바일 최적화
**현재 상태**: `top-1 left-2` 위치, 모바일에서 제목과 겹칠 수 있음  
**개선 사항**:
- 모바일: 배지 크기 축소 (`text-xs` → `text-[10px]`)
- 배지 위치 조정 (모바일 전용 스타일)
- 긴 텍스트 말줄임 처리

**파일**: `src/components/IdeaCard.tsx`

### Task 1.3: 모바일 전용 UI 컴포넌트 (Week 9, Day 4-5)

#### 1.3.1 햄버거 메뉴 구현
**기능**:
- 모바일에서 네비게이션 메뉴 토글
- 슬라이드 애니메이션
- 오버레이 배경

**파일**: 새 파일 `src/components/MobileMenu.tsx`

#### 1.3.2 하단 네비게이션 바
**기능**:
- 모바일 전용 하단 고정 네비게이션
- 주요 페이지 바로가기 (홈, 커뮤니티, 프로필)
- 활성 페이지 표시

**파일**: 새 파일 `src/components/BottomNavigation.tsx`

#### 1.3.3 모바일 카드 레이아웃 개선
**개선 사항**:
- 카드 패딩 조정 (모바일: `p-4` → `p-3`)
- 이미지/아이콘 크기 조정
- 버튼 스택 레이아웃 (모바일)

**파일**: `src/components/IdeaCard.tsx`

### Task 1.4: 성능 최적화 (Week 10, Day 1-2)

#### 1.4.1 이미지 최적화
**개선 사항**:
- WebP 포맷 지원
- Lazy loading 구현
- 반응형 이미지 (srcset)

**파일**: 프로필 이미지, 아이콘 등

#### 1.4.2 코드 스플리팅
**개선 사항**:
- React.lazy() 사용
- 라우트별 코드 분할
- 동적 import

**파일**: `src/App.tsx`

```tsx
const IdeaDetailPage = React.lazy(() => import('@/pages/IdeaDetailPage'));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage'));
```

#### 1.4.3 네트워크 최적화
**개선 사항**:
- API 호출 최소화
- 데이터 캐싱
- 오프라인 지원 (향후)

### Task 1.5: 모바일 테스트 및 버그 수정 (Week 10, Day 3-5)

#### 1.5.1 반응형 테스트
- 다양한 디바이스 크기 테스트 (320px ~ 768px)
- iOS Safari, Chrome Mobile 테스트
- 터치 인터랙션 테스트

#### 1.5.2 버그 수정
- 발견된 모바일 버그 수정
- 성능 이슈 해결
- 접근성 개선

---

## 💰 Phase 2: 수익화 전략 및 결제 시스템 (Week 11-12)

### 수익화 모델

#### 모델 1: 프리미엄 구독 (추천)
**플랜 구조**:
- **무료 플랜 (Free)**
  - 일일 PRD 생성 3개 제한
  - 기본 추천 기능
  - 커뮤니티 읽기 전용

- **프로 플랜 (Pro) - 월 $9.99**
  - 무제한 PRD 생성
  - 고급 AI 분석 기능
  - 커뮤니티 글 작성/댓글
  - 우선 지원

- **비즈니스 플랜 (Business) - 월 $29.99**
  - 프로 플랜 모든 기능
  - 팀 협업 기능
  - API 접근
  - 맞춤형 AI 모델

#### 모델 2: 일회성 결제
- PRD 생성 크레딧 구매 ($0.99 = 10 크레딧)
- 개발 계획서 생성 ($4.99 = 1개)

#### 모델 3: 광고 (향후)
- 무료 플랜 사용자에게만 표시
- 네이티브 광고 형식

### Task 2.1: 결제 시스템 설계 (Week 11, Day 1-2)

#### 2.1.1 결제 제공업체 선택
**옵션**:
1. **Stripe** (추천)
   - 국제적으로 널리 사용
   - 한국 카드 지원
   - 구독 관리 용이
   - 무료 티어: 첫 $1M 거래 수수료 2.9% + $0.30

2. **토스페이먼츠**
   - 한국 시장 특화
   - 낮은 수수료
   - 한국어 지원 우수

**선택**: Stripe (국제 확장성 고려)

#### 2.1.2 데이터베이스 스키마 설계
**새 테이블**:
- `subscriptions` (구독 정보)
- `payments` (결제 내역)
- `credits` (크레딧 잔액)

**마이그레이션 파일**: `supabase/migrations/20250129_create_payment_tables.sql`

```sql
-- 구독 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL, -- 'free', 'pro', 'business'
  stripe_subscription_id TEXT,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 내역 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount INTEGER NOT NULL, -- 센트 단위
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'succeeded', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 크레딧 테이블
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 크레딧 수량
  source VARCHAR(20) NOT NULL, -- 'purchase', 'subscription', 'bonus'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Task 2.2: Stripe 연동 (Week 11, Day 3-5)

#### 2.2.1 Stripe 계정 설정
- Stripe 계정 생성
- API 키 발급 (테스트/프로덕션)
- Webhook 엔드포인트 설정

#### 2.2.2 서버 사이드 구현
**파일**: `supabase/functions/stripe-webhook/index.ts`

**기능**:
- 구독 생성/갱신/취소 처리
- 결제 성공/실패 처리
- Webhook 검증

#### 2.2.3 클라이언트 사이드 구현
**파일**: `src/services/paymentService.ts`

**기능**:
- 구독 플랜 조회
- Checkout 세션 생성
- 구독 상태 확인

**라이브러리**: `@stripe/stripe-js`

```bash
npm install @stripe/stripe-js
```

### Task 2.3: 구독 관리 UI (Week 12, Day 1-3)

#### 2.3.1 구독 플랜 선택 페이지
**파일**: 새 파일 `src/pages/SubscriptionPage.tsx`

**기능**:
- 플랜 비교 테이블
- 플랜 선택 및 결제 버튼
- 현재 구독 상태 표시

#### 2.3.2 결제 내역 페이지
**파일**: 새 파일 `src/pages/PaymentHistoryPage.tsx`

**기능**:
- 결제 내역 목록
- 영수증 다운로드
- 구독 취소 기능

#### 2.3.3 사용량 대시보드
**파일**: 프로필 페이지에 통합

**기능**:
- 일일 PRD 생성 횟수 표시
- 크레딧 잔액 표시
- 구독 만료일 표시

### Task 2.4: 사용량 제한 구현 (Week 12, Day 4-5)

#### 2.4.1 PRD 생성 제한 로직
**파일**: `src/services/prdService.ts` 수정

**로직**:
- 무료 플랜: 일일 3개 제한
- 프로/비즈니스: 무제한
- 크레딧 기반: 크레딧 차감

#### 2.4.2 사용량 추적
**새 테이블**: `usage_logs`

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL, -- 'prd_generation', 'dev_plan_generation'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Phase 3: 소셜 로그인 구현 (Week 13)

### Task 3.1: Google 로그인 (Week 13, Day 1-2)

#### 3.1.1 Google OAuth 설정
- Google Cloud Console에서 OAuth 클라이언트 ID 생성
- 리다이렉트 URI 설정
- Supabase에 Google Provider 추가

#### 3.1.2 Supabase Auth 설정
**Supabase Dashboard**:
- Authentication → Providers → Google 활성화
- Client ID, Client Secret 입력

#### 3.1.3 클라이언트 구현
**파일**: `src/pages/AuthPage.tsx` 수정

**기능**:
- Google 로그인 버튼 추가
- 로그인 후 리다이렉트 처리

```tsx
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
};
```

### Task 3.2: 기타 소셜 로그인 (Week 13, Day 3-4)

#### 3.2.1 GitHub 로그인
- GitHub OAuth App 생성
- Supabase에 GitHub Provider 추가
- 로그인 버튼 추가

#### 3.2.2 Apple 로그인 (선택)
- Apple Developer 계정 필요
- Supabase에 Apple Provider 추가

### Task 3.3: 소셜 로그인 UI 개선 (Week 13, Day 5)

#### 3.3.1 로그인 페이지 리디자인
**개선 사항**:
- 소셜 로그인 버튼 스타일 통일
- 아이콘 추가 (Google, GitHub)
- 로딩 상태 표시

---

## 📅 전체 일정 요약

| Phase | 기간 | 주요 작업 | 완료율 |
|-------|------|----------|--------|
| Phase 1: 모바일 최적화 | Week 9-10 (2주) | 반응형 레이아웃, 모바일 UI, 성능 최적화 | 0% |
| Phase 2: 수익화 전략 | Week 11-12 (2주) | Stripe 연동, 구독 시스템, 사용량 제한 | 0% |
| Phase 3: 소셜 로그인 | Week 13 (1주) | Google/GitHub 로그인, UI 개선 | 0% |

**총 예상 기간**: 5주 (Week 9-13)

---

## 🎯 우선순위

### [P0] 즉시 시작
1. **모바일 최적화 Phase 1.1-1.2** (반응형 레이아웃, 텍스트 최적화)
   - 사용자 경험 개선에 직접적 영향
   - 구현 난이도 낮음
   - 즉시 체감 가능

### [P1] 단기 (1-2주 내)
2. **모바일 최적화 Phase 1.3-1.5** (모바일 UI, 성능 최적화)
3. **소셜 로그인 Phase 3** (Google/GitHub)
   - 사용자 가입 장벽 낮춤
   - 구현 난이도 낮음

### [P2] 중기 (3-4주 내)
4. **수익화 전략 Phase 2** (Stripe 연동, 구독 시스템)
   - 수익화에 필수적
   - 구현 난이도 높음
   - 신중한 설계 필요

---

## 🔧 기술 스택 추가

### 새로운 라이브러리
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0"
  }
}
```

### Supabase Functions
- `stripe-webhook`: Stripe webhook 처리
- `create-checkout-session`: 결제 세션 생성
- `manage-subscription`: 구독 관리

---

## 📝 다음 단계

1. **즉시 시작**: 모바일 최적화 Task 1.1 (반응형 레이아웃)
2. **병렬 진행**: 소셜 로그인 설정 (Google OAuth 클라이언트 ID 발급)
3. **준비 작업**: Stripe 계정 생성 및 테스트 환경 설정

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 29일