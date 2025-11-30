# 🗺️ IdeaSpark 개발 로드맵

**작성일**: 2025년 1월 30일  
**현재 상태**: MVP 98% 완료 | 전체 90% 완료  
**목적**: 남은 개발 작업 및 우선순위 정리

---

## 📊 현재 진행 상황

### 완료된 Epic
- ✅ Epic 0: 프로젝트 초기 설정 (100%)
- ✅ Epic 1: Reddit API 연동 (95%)
- ✅ Epic 2: PRD 자동 생성 (95%)
- ✅ Epic 3: 커뮤니티 기능 (98%)
- ✅ Epic 4: 사용자 관리 및 소셜 기능 (100%)
- ✅ Epic 5: 관리자 기능 (90%)
- ✅ Epic 6: 배포 및 최적화 (97%)
- ✅ Epic 8: 모바일 최적화 및 수익화 (100%)

### 진행 중 Epic
- 🔄 Epic 7: 고급 아이디어 기능 (0% - 기획 완료)

---

## 🎯 남은 개발 계획

### [Phase 1] 즉시 구현 (1-2주)

#### 1. 소셜 로그인 완료 ✅
**상태**: 코드 완료, Supabase 설정 필요  
**예상 시간**: 1일 (수동 설정)

**작업 내용**:
- [x] Google OAuth 로그인 버튼 및 로직
- [x] GitHub OAuth 로그인 버튼 및 로직
- [ ] Supabase Google Provider 설정
- [ ] Supabase GitHub Provider 설정
- [ ] 테스트 및 검증

**참고 문서**: `docs/development/OAUTH_FINAL_SETUP.md`

---

#### 2. 아이디어 실행 현황 추적 시스템 ⭐⭐⭐⭐⭐
**우선순위**: 최우선 (고객 니즈 최고)  
**예상 시간**: 5-7일

**기능**:
- "이 아이디어를 구현했어요!" 버튼
- 구현 증명 자료 업로드 (스크린샷, 링크, GitHub)
- 구현 현황 대시보드
- 구현자 배지/인증
- 성공 사례 갤러리
- **구현 사례 공유 기능**: 비슷한 아이디어를 이미 구현한 사례가 있다면 해당 구현 사례를 자동으로 추천 및 공유

**데이터베이스**:
```sql
CREATE TABLE idea_implementations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id),
  user_id UUID REFERENCES auth.users(id),
  implementation_url TEXT,
  screenshot_url TEXT,
  description TEXT,
  status TEXT, -- 'planned', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**구현 파일**:
- `src/services/implementationService.ts` (신규)
- `src/components/ImplementationButton.tsx` (신규)
- `src/pages/ImplementationGallery.tsx` (신규)

---

#### 3. 추천 시스템 고도화 ⭐⭐⭐⭐⭐
**우선순위**: 높음  
**예상 시간**: 3-5일

**개선 사항**:
- 사용자 행동 기반 추천 (좋아요, 북마크, 조회 시간)
- 카테고리별 선호도 학습
- 협업 필터링
- 추천 이유 명시

**구현 파일**:
- `src/services/recommendationService.ts` (수정)
- `src/components/RecommendedIdeas.tsx` (수정)

---

### [Phase 2] 단기 구현 (2-4주)

#### 4. 아이디어 협업 기능 ⭐⭐⭐⭐
**예상 시간**: 5-7일

**기능**:
- "이 아이디어에 참여하기" 버튼
- 협업자 초대 시스템
- 역할 분담 (기획자, 개발자, 디자이너)
- 협업 채팅/댓글
- 협업 진행 상황 추적

**데이터베이스**:
```sql
CREATE TABLE idea_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT, -- 'owner', 'planner', 'developer', 'designer', 'marketer'
  status TEXT, -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 5. 아이디어 버전 관리 ⭐⭐⭐⭐
**예상 시간**: 3-5일

**기능**:
- 아이디어 수정 시 자동 버전 생성
- 버전 히스토리 타임라인
- 버전 비교 기능
- 이전 버전 복원

**데이터베이스**:
```sql
CREATE TABLE idea_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id),
  version_number INTEGER,
  title TEXT,
  description TEXT,
  category TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### 6. 로드맵 공유 기능 ⭐⭐⭐⭐
**예상 시간**: 4-6일

**기능**:
- 로드맵 생성 도구 (Mermaid Gantt 활용)
- 로드맵 공유 (공개/비공개)
- 로드맵 댓글 및 피드백
- 로드맵 진행률 추적

---

### [Phase 3] 중기 구현 (4-8주)

#### 7. 실시간 알림 강화 ⭐⭐⭐
**예상 시간**: 3-5일

**개선 사항**:
- Supabase Realtime 활용
- 알림 카테고리 설정
- 알림 필터링 및 그룹화
- 이메일 알림 옵션

---

#### 8. 투표 및 우선순위 시스템 ⭐⭐⭐
**예상 시간**: 4-6일

**기능**:
- 아이디어별 투표
- 투표 결과 시각화
- 우선순위 설정
- 투표 기반 추천

---

#### 9. AI 아이디어 분석 ⭐⭐⭐
**예상 시간**: 5-7일

**기능**:
- 실행 가능성 분석
- 시장 경쟁력 분석
- 예상 개발 기간 및 비용
- 리스크 분석
- 개선 제안

---

### [Phase 4] 장기 구현 (8주+)

#### 10. 구독 모델 구현
**예상 시간**: 10일

**작업 내용**:
- 토스 페이먼츠 연동 (한국)
- 구독 플랜 관리
- 사용량 제한 로직
- 구독 관리 UI

---

#### 11. 챌린지/이벤트 시스템
**예상 시간**: 5-7일

**기능**:
- 주간/월간 챌린지
- 참여자 랭킹
- 성과 공유
- 이벤트 알림

---

## 📅 타임라인

### Q1 2025 (1-3월)
- ✅ MVP 완성 (98%)
- ✅ 모바일 최적화 (100%)
- ✅ UI 개선 (100%)
- 🔄 소셜 로그인 (80%)
- ⏳ 아이디어 실행 현황 추적
- ⏳ 추천 시스템 고도화

### Q2 2025 (4-6월)
- ⏳ 협업 기능
- ⏳ 버전 관리
- ⏳ 로드맵 공유
- ⏳ 구독 모델

### Q3 2025 (7-9월)
- ⏳ AI 분석
- ⏳ 투표 시스템
- ⏳ 챌린지/이벤트

---

## 🎯 성공 지표 (KPI)

### 사용자 지표
- 월간 활성 사용자 (MAU): 1,000명 (3개월 내)
- 일일 활성 사용자 (DAU): 100명 (3개월 내)
- 사용자 만족도: 4.5/5.0 이상

### 기능 지표
- PRD 생성 성공률: 95% 이상
- 아이디어 실행률: 10% 이상 (구현 현황 추적 기능 후)
- 추천 시스템 정확도: 70% 이상

### 비즈니스 지표
- 구독 전환율: 5% 이상 (구독 모델 출시 후)
- 월간 수익 (MRR): $1,000 (6개월 내)

---

## 📝 참고 문서

- **전문가 피드백**: `docs/development/EXPERT_FEEDBACK.md`
- **남은 작업**: `docs/development/REMAINING_TASKS.md`
- **세션 연속성**: `docs/development/SESSION_CONTINUITY.md`
- **프로젝트 상태**: `docs/development/PROJECT_STATUS_BRIEFING.md`

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

