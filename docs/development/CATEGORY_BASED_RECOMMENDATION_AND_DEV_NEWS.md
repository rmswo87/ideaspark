# 사용자 관심 카테고리 기반 추천 및 개발 소식 기능 구현 완료

**작성일**: 2025년 12월 5일  
**상태**: 구현 완료

---

## ✅ 구현 완료 사항

### 1. 사용자 관심 카테고리 기반 AI 점수 추천 시스템 ✅

#### 개선 내용
- 기존 추천 시스템에 AI 점수와 카테고리 선호도를 결합한 새로운 추천 알고리즘 추가
- 사용자가 좋아요/북마크/PRD 생성한 아이디어의 카테고리를 분석하여 선호도 계산
- 선호도가 높은 카테고리 내에서 AI 평가 점수가 높은 아이디어 우선 추천

#### 구현 파일
- `src/services/categoryBasedScoringRecommendation.ts` (신규)
  - `getCategoryBasedScoredRecommendations()`: 카테고리 기반 AI 점수 추천 함수
  - 카테고리 선호도 점수와 AI 점수를 결합하여 최종 추천 점수 계산

#### 알고리즘
1. 사용자 행동 데이터 분석 (좋아요/북마크/PRD 생성)
2. 카테고리별 선호도 계산 (행동 가중치 적용)
3. 상위 3개 카테고리 선택
4. 각 카테고리에서 AI 점수가 있는 아이디어 조회
5. 카테고리 선호도(30%) + AI 점수(70%)로 결합 점수 계산
6. 결합 점수 순으로 정렬하여 추천

#### 통합
- `src/components/PremiumRecommendedIdeas.tsx` 수정
  - 기존 `getTopScoredRecentIdeas` 대신 `getCategoryBasedScoredRecommendations` 사용
  - 사용자 관심 카테고리 내에서 AI 점수가 높은 아이디어 추천

---

### 2. 레딧 개발 소식 수집 및 표시 시스템 ✅

#### 데이터베이스
- **파일**: `supabase/migrations/20251205_create_dev_news_table.sql`
- **테이블**: `dev_news`
- **주요 필드**:
  - `reddit_id`: Reddit 게시글 ID (고유)
  - `title`, `content`: 제목 및 내용
  - `subreddit`: 서브레딧 이름
  - `category`: 분류 (news, tutorial, tip, discussion, resource, general)
  - `tags`: 태그 배열
  - `period_type`: 기간 분류 (daily, weekly, monthly)
  - `period_date`: 해당 기간의 시작일

#### 수집 대상 서브레딧
- `webdev`, `programming`, `learnprogramming`
- `MachineLearning`, `artificial` (AI 관련)
- `javascript`, `reactjs`, `node`, `Python`, `golang`, `rust`, `cpp`
- `cscareerquestions`, `ExperiencedDevs`
- `devops`, `aws`, `kubernetes`, `docker`
- `linux`, `git`

#### 서비스 레이어
- `src/services/devNewsService.ts` (신규)
  - `getDevNews()`: 개발 소식 조회 (필터링 지원)
  - `getDailyDevNews()`: 오늘의 개발 소식
  - `getWeeklyDevNews()`: 주간 개발 소식
  - `getMonthlyDevNews()`: 월간 개발 소식
  - `getHotKeywords()`: 핫한 키워드 추출
  - `getPopularBySubreddit()`: 서브레딧별 인기 소식

- `src/services/devNewsCollector.ts` (신규)
  - `collectDevNews()`: 개발 소식 수집 메인 함수
  - `saveDevNews()`: 수집한 소식을 데이터베이스에 저장

#### API
- `api/collect-dev-news.ts` (신규)
  - Vercel Edge Function
  - Reddit API를 통해 개발 관련 서브레딧에서 소식 수집
  - 카테고리 자동 분류 (tutorial, tip, news, discussion, resource)
  - 태그 자동 추출 (기술 스택 키워드)

#### UI 컴포넌트
- `src/components/DevNewsSidebar.tsx` (신규)
  - 좌우측 사이드바 컴포넌트
  - Daily News 탭: 오늘의 개발 소식 목록
  - Hot Keywords 탭: 핫한 키워드 태그 표시
  - 각 소식 클릭 시 Reddit 원문으로 이동

#### 통합
- `src/App.tsx` 수정
  - 홈페이지 메인 콘텐츠 영역을 flex 레이아웃으로 변경
  - 좌측 사이드바: lg 이상 화면에서 표시
  - 우측 사이드바: xl 이상 화면에서 표시
  - 모바일에서는 사이드바 숨김

---

## 📊 기능 상세

### 카테고리 기반 추천 알고리즘

```
최종 추천 점수 = 카테고리 선호도 점수 × 0.3 + AI 점수 × 0.7

카테고리 선호도 점수:
- 사용자가 좋아요/북마크/PRD 생성한 아이디어의 카테고리 분석
- 행동별 가중치: generate_prd(5), bookmark(4), like(3), view(1)
- 상위 3개 카테고리 선택

AI 점수:
- 비타민/경쟁율/섹시함 점수 합계 (0-30점)
- 해당 카테고리 내에서 AI 점수가 있는 아이디어만 추천
```

### 개발 소식 분류

- **news**: 뉴스, 공지사항, 릴리즈
- **tutorial**: 튜토리얼, 가이드, 학습 자료
- **tip**: 팁, 트릭, 노하우
- **discussion**: 토론, 의견, 생각
- **resource**: 리소스, 도구, 라이브러리
- **general**: 기타

### 태그 추출

자동으로 기술 스택 키워드를 태그로 추출:
- 프레임워크: react, vue, angular, svelte
- 언어: javascript, typescript, python, java, go, rust, cpp
- 인프라: aws, azure, gcp, docker, kubernetes
- AI/ML: ai, ml, machine learning, deep learning
- 데이터베이스: database, sql, mongodb, postgresql

---

## 🚀 사용 방법

### 개발 소식 수집

```typescript
import { collectDevNews } from '@/services/devNewsCollector';

const result = await collectDevNews();
if (result.success) {
  console.log(`${result.count}개의 개발 소식을 수집했습니다.`);
}
```

### 개발 소식 조회

```typescript
import { getDailyDevNews, getHotKeywords } from '@/services/devNewsService';

// 오늘의 개발 소식
const dailyNews = await getDailyDevNews(10);

// 핫한 키워드
const keywords = await getHotKeywords(10);
```

### 카테고리 기반 추천

```typescript
import { getCategoryBasedScoredRecommendations } from '@/services/categoryBasedScoringRecommendation';

const recommendations = await getCategoryBasedScoredRecommendations(userId, 10);
```

---

## 📋 다음 단계

### 1. 데이터베이스 마이그레이션 실행
- Supabase Dashboard에서 `20251205_create_dev_news_table.sql` 실행
- 또는 Supabase CLI로 마이그레이션 적용

### 2. 개발 소식 수집 스케줄링
- Vercel Cron Job 또는 Supabase Edge Function 스케줄러 설정
- 매일 자동으로 개발 소식 수집 (예: 오전 9시)

### 3. 테스트
- 카테고리 기반 추천 시스템 테스트
- 개발 소식 수집 및 표시 테스트
- 사이드바 반응형 레이아웃 테스트

### 4. 성능 최적화 (선택)
- 개발 소식 캐싱
- 키워드 추출 알고리즘 개선
- 태그 자동 분류 AI 모델 적용

---

## ⚠️ 주의사항

1. **데이터베이스 마이그레이션**: `dev_news` 테이블 생성 후 사용 가능
2. **Reddit API 제한**: API rate limit에 주의하여 수집 주기 조정 필요
3. **카테고리 분류**: 현재는 키워드 기반 분류, 향후 AI 기반 분류로 개선 가능
4. **태그 추출**: 현재는 간단한 키워드 매칭, 향후 NLP 기반 태그 추출로 개선 가능

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 12월 5일

