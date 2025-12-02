# 🤖 AI 기반 아이디어 평가 및 자동 추천 시스템

**작성일**: 2025년 12월 2일  
**상태**: 기획 완료, 구현 대기  
**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

---

## 📋 개요

사용자가 제안한 혁신적인 아이디어 평가 시스템으로, AI를 활용하여 아이디어의 가치를 정량적으로 평가하고 매일 최적의 아이디어를 자동으로 추천합니다.

### 핵심 가치 제안
1. **정량적 평가**: 비타민/약, 경쟁율, 섹시함 점수로 아이디어의 가치를 명확히 측정
2. **AI 기반 수요 분석**: 인터넷에서 실제 사람들의 질문, 갈증, 수요를 분석하여 신선한 아이디어 발굴
3. **자동 추천**: 매일 하나씩 최고 점수의 아이디어를 자동으로 추천
4. **실행 가능성 평가**: 업무 난이도 평가로 실제 구현 가능성까지 고려

---

## 🎯 평가 기준 (총 30점)

### 1. 비타민/약 점수 (10점 만점)
**의미**: 사용자에게 실제로 필요한가? (필요성)

**평가 기준**:
- **10점**: 일상생활에서 반드시 필요한 핵심 기능
- **7-9점**: 자주 사용하는 유용한 기능
- **4-6점**: 가끔 유용한 기능
- **1-3점**: 특정 상황에서만 유용
- **0점**: 거의 불필요

**AI 분석 요소**:
- Reddit/인터넷에서의 질문 빈도
- "I wish", "I need", "I want" 같은 표현 빈도
- 문제의 심각성 및 빈도

### 2. 경쟁율 점수 (10점 만점)
**의미**: 시장에 경쟁자가 적은가? (차별화 가능성)

**평가 기준**:
- **10점**: 거의 경쟁자 없음, 블루오션
- **7-9점**: 경쟁자 있지만 차별화 가능
- **4-6점**: 경쟁이 있지만 개선 여지 있음
- **1-3점**: 경쟁이 치열함
- **0점**: 이미 포화된 시장

**AI 분석 요소**:
- 유사 서비스/제품 검색 결과
- 시장 포화도 분석
- 차별화 포인트 존재 여부

### 3. 섹시함 점수 (10점 만점)
**의미**: 사람들이 관심을 가질 만한가? (매력도)

**평가 기준**:
- **10점**: 매우 혁신적이고 주목할 만함
- **7-9점**: 흥미롭고 관심을 끌 만함
- **4-6점**: 평범하지만 유용함
- **1-3점**: 실용적이지만 재미없음
- **0점**: 지루하고 관심 없음

**AI 분석 요소**:
- "wow", "amazing", "cool" 같은 긍정적 반응 빈도
- 소셜 미디어 공유 가능성
- 혁신성 및 독창성

### 4. 업무 난이도 (별도 평가)
**의미**: 실제 구현이 얼마나 어려운가?

**평가 기준**:
- **하**: 1-2주 내 구현 가능 (프로토타입)
- **중**: 1-2개월 내 구현 가능 (MVP)
- **상**: 3개월 이상 필요 (전문 팀 필요)

**AI 분석 요소**:
- 기술 스택 복잡도
- 필요한 리소스 (인력, 시간, 비용)
- 기존 기술 활용 가능성

---

## 🤖 AI 기반 수요 분석 시스템

### "아이디어 Searching Bot" 개념

**목적**: 실제 사람들이 인터넷에서 올라오는 질문, 답답함, 갈증을 느끼는 요소를 AI를 통해 분석하여 신선한 아이디어 발굴

### 분석 소스
1. **Reddit** (이미 수집 중)
   - r/SomebodyMakeThis
   - r/Lightbulb
   - r/CrazyIdeas
   - r/AppIdeas
   - r/Startup_Ideas

2. **추가 소스** (향후 확장)
   - Twitter/X (트렌드 분석)
   - Hacker News (기술 커뮤니티)
   - Product Hunt (제품 아이디어)
   - Quora (질문 분석)

### AI 분석 프로세스
1. **질문 수집**: "I wish", "I need", "Why isn't there" 같은 패턴 감지
2. **수요 강도 분석**: 질문 빈도, 댓글 수, 공감 수 분석
3. **공급 부족 분석**: 기존 솔루션 검색 및 부족한 점 파악
4. **아이디어 구체화**: AI가 의도와 목적을 분명하게 작성하여 기획안 생성

### 매일 추천 프로세스
1. **새로운 아이디어 수집** (Reddit API)
2. **AI 평가 실행** (비타민/약, 경쟁율, 섹시함 점수 계산)
3. **업무 난이도 평가**
4. **총점 계산 및 정렬**
5. **최고 점수 아이디어 선정**
6. **매일 하나씩 추천** (홈페이지, 이메일, 푸시 알림)

---

## 📊 데이터베이스 스키마

### 아이디어 평가 점수 테이블
```sql
CREATE TABLE idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  
  -- 평가 점수 (각 10점 만점)
  vitamin_score INTEGER CHECK (vitamin_score >= 0 AND vitamin_score <= 10),
  competition_score INTEGER CHECK (competition_score >= 0 AND competition_score <= 10),
  sexiness_score INTEGER CHECK (sexiness_score >= 0 AND sexiness_score <= 10),
  total_score INTEGER GENERATED ALWAYS AS (vitamin_score + competition_score + sexiness_score) STORED,
  
  -- 업무 난이도
  difficulty_level TEXT CHECK (difficulty_level IN ('하', '중', '상')),
  
  -- AI 분석 결과
  ai_analysis JSONB, -- 상세 분석 결과 (JSON 형식)
  demand_analysis JSONB, -- 수요 분석 결과
  competition_analysis JSONB, -- 경쟁 분석 결과
  
  -- 추천 관련
  is_recommended BOOLEAN DEFAULT false,
  recommended_at TIMESTAMPTZ,
  recommendation_reason TEXT,
  
  -- 메타데이터
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(idea_id) -- 한 아이디어당 하나의 평가만
);

-- 인덱스
CREATE INDEX idx_idea_scores_total_score ON idea_scores(total_score DESC);
CREATE INDEX idx_idea_scores_recommended ON idea_scores(is_recommended, recommended_at DESC);
CREATE INDEX idx_idea_scores_difficulty ON idea_scores(difficulty_level);
CREATE INDEX idx_idea_scores_analyzed_at ON idea_scores(analyzed_at DESC);
```

### AI 분석 결과 JSON 구조
```json
{
  "vitamin_analysis": {
    "score": 8,
    "reason": "일상생활에서 자주 필요한 기능으로, Reddit에서 50회 이상 언급됨",
    "demand_frequency": 50,
    "severity": "high"
  },
  "competition_analysis": {
    "score": 7,
    "reason": "유사 서비스 3개 발견, 하지만 차별화 포인트 있음",
    "competitor_count": 3,
    "differentiation_points": ["더 나은 UX", "더 빠른 속도"]
  },
  "sexiness_analysis": {
    "score": 9,
    "reason": "혁신적이고 주목할 만한 아이디어, 소셜 미디어 공유 가능성 높음",
    "innovation_level": "high",
    "social_share_potential": "high"
  },
  "difficulty_analysis": {
    "level": "중",
    "estimated_time": "4-6주",
    "required_skills": ["React", "Node.js", "Database"],
    "complexity": "medium"
  }
}
```

---

## 🛠️ 구현 계획

### Phase 1: 기본 평가 시스템 (1주)

#### Task 1.1: 데이터베이스 마이그레이션
- [ ] `idea_scores` 테이블 생성
- [ ] 인덱스 생성
- [ ] RLS 정책 설정

#### Task 1.2: AI 평가 서비스 구현
**파일**: `src/services/ideaScoringService.ts`

**주요 함수**:
```typescript
interface IdeaScore {
  vitamin_score: number; // 0-10
  competition_score: number; // 0-10
  sexiness_score: number; // 0-10
  total_score: number; // 0-30
  difficulty_level: '하' | '중' | '상';
  ai_analysis: {
    vitamin_analysis: {...},
    competition_analysis: {...},
    sexiness_analysis: {...},
    difficulty_analysis: {...}
  };
}

// 아이디어 평가 실행
async function scoreIdea(ideaId: string): Promise<IdeaScore>

// 여러 아이디어 일괄 평가
async function scoreIdeas(ideaIds: string[]): Promise<IdeaScore[]>

// 평가 결과 저장
async function saveIdeaScore(ideaId: string, score: IdeaScore): Promise<void>

// 평가 결과 조회
async function getIdeaScore(ideaId: string): Promise<IdeaScore | null>

// 추천 아이디어 조회
async function getRecommendedIdea(): Promise<Idea | null>
```

#### Task 1.3: AI 프롬프트 설계
**파일**: `src/services/ai.ts` (확장)

**프롬프트 예시**:
```
다음 아이디어를 평가해주세요:

제목: {idea.title}
내용: {idea.content}

다음 3가지 기준으로 각각 0-10점을 매겨주세요:

1. 비타민/약 점수 (필요성): 사용자에게 실제로 필요한가?
   - Reddit/인터넷에서의 질문 빈도 분석
   - 문제의 심각성 및 빈도
   - 일상생활에서의 필요성

2. 경쟁율 점수 (차별화 가능성): 시장에 경쟁자가 적은가?
   - 유사 서비스/제품 검색
   - 시장 포화도
   - 차별화 포인트 존재 여부

3. 섹시함 점수 (매력도): 사람들이 관심을 가질 만한가?
   - 혁신성 및 독창성
   - 소셜 미디어 공유 가능성
   - "wow" 요소

또한 업무 난이도도 평가해주세요 (하/중/상).

JSON 형식으로 응답해주세요:
{
  "vitamin_score": 8,
  "competition_score": 7,
  "sexiness_score": 9,
  "difficulty_level": "중",
  "vitamin_analysis": {
    "reason": "...",
    "demand_frequency": 50,
    "severity": "high"
  },
  ...
}
```

### Phase 2: 수요 분석 시스템 (1주)

#### Task 2.1: Reddit 수집 확장
- [ ] 추가 서브레딧 수집
- [ ] 질문 패턴 감지 로직
- [ ] 수요 강도 분석

#### Task 2.2: AI 수요 분석 서비스
**파일**: `src/services/demandAnalysisService.ts`

**주요 함수**:
```typescript
// 질문 패턴 감지
async function detectQuestionPatterns(text: string): Promise<string[]>

// 수요 강도 분석
async function analyzeDemandStrength(ideaId: string): Promise<number>

// 공급 부족 분석
async function analyzeSupplyGap(ideaId: string): Promise<{
  existing_solutions: string[],
  gaps: string[],
  opportunity: string
}>
```

### Phase 3: 자동 추천 시스템 (3일)

#### Task 3.1: 매일 추천 로직
**파일**: `api/cron/recommend-idea.ts` (Vercel Cron Job)

**프로세스**:
1. 최근 7일간 수집된 아이디어 중 평가되지 않은 것들 조회
2. 각 아이디어에 대해 AI 평가 실행
3. 총점 기준으로 정렬
4. 최고 점수 아이디어를 `is_recommended = true`로 설정
5. 이전 추천 아이디어는 `is_recommended = false`로 변경

#### Task 3.2: 추천 아이디어 UI
**파일**: `src/components/RecommendedIdeaOfTheDay.tsx`

**기능**:
- 홈페이지 상단에 "오늘의 추천 아이디어" 배너
- 점수 표시 (비타민/약, 경쟁율, 섹시함)
- 추천 이유 표시
- 업무 난이도 표시

### Phase 4: 프리미엄 기능 (선택사항)

#### 프리미엄 vs 무료 결정

**옵션 1: 무료로 제공**
- ✅ 사용자 유입 증가
- ✅ 플랫폼 가치 증대
- ❌ AI API 비용 증가

**옵션 2: 프리미엄으로 제공**
- ✅ 수익 모델 확보
- ✅ AI API 비용 회수
- ❌ 사용자 진입 장벽

**추천**: **단계적 접근**
1. **MVP 단계**: 무료로 제공하여 사용자 확보
2. **성장 단계**: 기본 추천은 무료, 상세 분석은 프리미엄
3. **성숙 단계**: 프리미엄 플랜 도입

**프리미엄 기능 제안**:
- ✅ 기본 추천: 무료 (매일 1개)
- 💎 상세 분석: 프리미엄 (모든 아이디어 상세 분석)
- 💎 맞춤 추천: 프리미엄 (사용자 관심사 기반)
- 💎 수요 분석 리포트: 프리미엄 (주간 리포트)

---

## 📈 기대 효과

### 사용자 측면
1. **시간 절약**: 매일 최고의 아이디어만 확인
2. **의사결정 지원**: 정량적 점수로 아이디어 가치 판단
3. **실행 가능성 파악**: 업무 난이도로 구현 계획 수립

### 플랫폼 측면
1. **차별화**: 다른 플랫폼과의 명확한 차별점
2. **사용자 참여 증가**: 매일 추천으로 재방문 유도
3. **수익 모델**: 프리미엄 기능으로 수익화 가능

---

## 🎯 성공 지표 (KPI)

1. **추천 아이디어 클릭률**: 30% 이상
2. **추천 아이디어 PRD 생성률**: 20% 이상
3. **평가 정확도**: 사용자 피드백 기반 80% 이상
4. **일일 활성 사용자 증가**: 50% 이상

---

## 📝 참고 사항

### AI API 비용 고려
- 평가당 약 0.01-0.05 USD 예상
- 일일 100개 아이디어 평가 시: $1-5/일
- 캐싱 전략 필요 (동일 아이디어 재평가 방지)

### 성능 최적화
- 배치 처리: 여러 아이디어를 한 번에 평가
- 비동기 처리: 평가는 백그라운드에서 실행
- 캐싱: 평가 결과는 캐시하여 재사용

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 2일  
**다음 단계**: 개발 계획서에 통합 및 구현 시작

