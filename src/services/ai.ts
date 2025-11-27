// AI API 클라이언트 구현
import type { AIConfig } from '@/types/ai';
import type { Idea } from '@/services/ideaService';

class AIClient {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * 아이디어를 기반으로 PRD 생성
   */
  async generatePRD(idea: Idea): Promise<string> {
    const prompt = this.buildPRDPrompt(idea);

    if (this.config.provider === 'openrouter') {
      return this.callOpenRouter(prompt);
    } else if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt);
    } else {
      return this.callClaude(prompt);
    }
  }

  /**
   * 아이디어와 PRD를 기반으로 개발 계획서 생성
   */
  async generateDevelopmentPlan(idea: Idea, prdContent?: string): Promise<string> {
    const prompt = this.buildDevelopmentPlanPrompt(idea, prdContent);

    if (this.config.provider === 'openrouter') {
      return this.callOpenRouter(prompt);
    } else if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt);
    } else {
      return this.callClaude(prompt);
    }
  }


  /**
   * PRD 프롬프트 생성 (prd_ref.md 기반 상세 양식)
   */
  private buildPRDPrompt(idea: Idea): string {
    return `다음 Reddit 게시글을 기반으로 상세하고 구체적인 PRD(Product Requirements Document) 문서를 한국어로 작성해주세요.

## 아이디어 정보
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}
- **작성자**: ${idea.author}
- **업보트**: ${idea.upvotes}

## 아이디어 개선 및 구축 가이드라인

PRD를 작성할 때 다음 사항을 고려하여 아이디어를 다듬고 구체화해주세요:

### 1. 아이디어 검증 및 개선
- **문제 정의 명확화**: 원본 아이디어에서 제시된 문제를 더 구체적이고 측정 가능하게 정의
- **타겟 사용자 구체화**: 누가 이 문제를 겪고 있는지, 얼마나 많은 사람들이 영향을 받는지 명확히 제시
- **경쟁 분석**: 유사한 솔루션이 있는지, 기존 솔루션의 한계점은 무엇인지 분석
- **차별화 포인트**: 기존 솔루션 대비 이 아이디어의 고유한 가치와 차별점 명확히 제시

### 2. 효율적인 구축 방법
- **MVP 우선순위**: 최소 기능 제품(MVP)을 빠르게 출시할 수 있도록 핵심 기능만 선별
- **단계적 확장**: MVP → Phase 2 → Phase 3 순서로 기능을 확장하는 로드맵 제시
- **기술 스택 선택**: 무료/저비용으로 시작할 수 있는 기술 스택과 인프라 제안
- **개발 효율성**: 재사용 가능한 컴포넌트, 오픈소스 라이브러리 활용 방안 제시
- **비용 최적화**: 초기 비용을 최소화하면서도 확장 가능한 아키텍처 설계

### 3. 실용성 강화
- **사용자 중심 설계**: 사용자가 실제로 필요로 하는 기능에 집중
- **간단한 UX**: 복잡한 기능보다 직관적이고 사용하기 쉬운 인터페이스 우선
- **빠른 피드백 루프**: 사용자 피드백을 빠르게 수집하고 반영할 수 있는 방법 제시
- **측정 가능한 성공 지표**: 제품의 성공을 측정할 수 있는 KPI 정의

### 4. 위험 관리
- **기술적 위험**: 예상되는 기술적 도전과제와 해결 방안
- **시장 위험**: 시장 진입 시 예상되는 장벽과 대응 전략
- **리소스 제약**: 제한된 리소스 내에서 최대 효과를 낼 수 있는 방법

## PRD 작성 요구사항
다음 구조를 정확히 따라 마크다운 형식으로 작성해주세요. 각 섹션을 매우 상세하고 구체적으로 작성하여 실제 개발에 바로 착수할 수 있도록 해주세요. 위의 아이디어 개선 가이드라인을 반영하여 원본 아이디어를 더욱 구체화하고 실현 가능하게 다듬어주세요.

### 1. 프로젝트 개요

#### 프로젝트명
[프로젝트 이름을 명확하게 제시]

#### 한 줄 설명
[프로젝트의 핵심 가치를 한 문장으로 설명]

#### 프로젝트 목적
- [프로젝트가 해결하려는 문제점을 구체적으로 설명]
- [프로젝트의 핵심 목표를 명확히 제시]
- [프로젝트의 비전과 방향성]

#### 핵심 가치 제안
- [사용자에게 제공하는 핵심 가치 1]
- [사용자에게 제공하는 핵심 가치 2]
- [사용자에게 제공하는 핵심 가치 3]

#### 타겟 사용자
- [주요 타겟 사용자 그룹 1과 그들의 특성]
- [주요 타겟 사용자 그룹 2와 그들의 특성]
- [주요 타겟 사용자 그룹 3과 그들의 특성]

#### 해결하려는 문제
- [문제점 1: 구체적인 불편함과 니즈]
- [문제점 2: 구체적인 불편함과 니즈]
- [문제점 3: 구체적인 불편함과 니즈]

### 2. 사용자 스토리

#### 주요 사용자 페르소나
**[페르소나 1 이름]**
- 역할: [사용자의 역할]
- 목표: [사용자가 달성하고자 하는 목표]
- 불편함: [현재 겪고 있는 구체적인 불편함]

**[페르소나 2 이름]**
- 역할: [사용자의 역할]
- 목표: [사용자가 달성하고자 하는 목표]
- 불편함: [현재 겪고 있는 구체적인 불편함]

#### 사용자 여정
1. **인지 단계**: [사용자가 문제를 인지하는 과정]
2. **탐색 단계**: [해결책을 찾는 과정]
3. **사용 단계**: [서비스를 사용하는 과정]
4. **평가 단계**: [서비스에 대한 평가 및 피드백]

#### 핵심 기능 요구사항
- [필수 기능 1: 구체적인 설명과 사용 시나리오]
- [필수 기능 2: 구체적인 설명과 사용 시나리오]
- [필수 기능 3: 구체적인 설명과 사용 시나리오]

### 3. 기능 명세

#### MVP 기능 목록
1. **[기능명 1]**
   - 설명: [기능의 상세 설명]
   - 우선순위: P0 (필수)
   - 예상 개발 시간: [예상 시간]

2. **[기능명 2]**
   - 설명: [기능의 상세 설명]
   - 우선순위: P0 (필수)
   - 예상 개발 시간: [예상 시간]

3. **[기능명 3]**
   - 설명: [기능의 상세 설명]
   - 우선순위: P1 (중요)
   - 예상 개발 시간: [예상 시간]

#### 우선순위별 기능 분류
**P0 (필수 기능 - MVP)**
- [기능 목록]

**P1 (중요 기능 - Phase 2)**
- [기능 목록]

**P2 (선택 기능 - Phase 3)**
- [기능 목록]

#### 기술적 제약사항
- [제약사항 1: 예를 들어, 무료 플랜 사용, 성능 요구사항 등]
- [제약사항 2]
- [제약사항 3]

### 4. 화면 설계

#### [화면 1: 화면명]
**목적**: [화면의 목적과 역할]

**화면 구성**:
- 상단: [상단 영역 구성 요소]
- 중간: [중간 영역 구성 요소]
- 하단: [하단 영역 구성 요소]

**주요 기능**:
- [기능 1]
- [기능 2]

#### [화면 2: 화면명]
[위와 동일한 형식으로 작성]

### 5. 기술 요구사항

#### 기술 스택 제안
**프론트엔드**
- 프레임워크: React, Vite
- 언어: TypeScript
- UI 라이브러리: Shadcn/UI, Tailwind CSS
- 상태 관리: React Context API 또는 Zustand

**백엔드**
- 서버: Supabase, Vercel Functions
- 데이터베이스: PostgreSQL (Supabase)
- 인증: Supabase Auth

**외부 API**
- [사용할 외부 API 목록]

#### 인프라 요구사항
- [인프라 요구사항 1]
- [인프라 요구사항 2]

#### 보안 고려사항
- [보안 고려사항 1]
- [보안 고려사항 2]

### 6. 프로젝트 구조 및 WBS

#### 프로젝트 구조 다이어그램
다음 Mermaid 다이어그램을 포함해주세요:

\`\`\`mermaid
graph TB
    A[프로젝트 시작] --> B[Phase 1: MVP]
    B --> C[Phase 2: 확장]
    C --> D[Phase 3: 최적화]
    
    B --> B1[기능 1]
    B --> B2[기능 2]
    B --> B3[기능 3]
    
    C --> C1[기능 4]
    C --> C2[기능 5]
\`\`\`

#### WBS (Work Breakdown Structure)
다음 Mermaid 형식의 WBS를 포함해주세요:

\`\`\`mermaid
gantt
    title 프로젝트 일정
    dateFormat YYYY-MM-DD
    section Phase 1: MVP
    기능 1 개발           :a1, 2024-01-01, 7d
    기능 2 개발           :a2, after a1, 5d
    기능 3 개발           :a3, after a2, 7d
    테스트 및 배포        :a4, after a3, 3d
\`\`\`

### 7. 성공 지표

#### KPI 정의
- [KPI 1: 측정 지표와 목표값]
- [KPI 2: 측정 지표와 목표값]
- [KPI 3: 측정 지표와 목표값]

#### 측정 방법
- [측정 방법 1]
- [측정 방법 2]

---

**중요**: 
- 각 섹션을 매우 상세하고 구체적으로 작성해주세요.
- 실제 개발자가 바로 착수할 수 있을 정도로 구체적인 내용을 포함해주세요.
- Mermaid 다이어그램은 반드시 포함해주세요.
- 마크다운 형식을 정확히 지켜주세요.
- 위의 아이디어 개선 가이드라인을 반영하여 원본 아이디어를 더욱 구체화하고 실현 가능하게 다듬어주세요.`;
  }

  /**
   * 개발 계획서 생성 프롬프트 작성
   */
  private buildDevelopmentPlanPrompt(idea: Idea, prdContent?: string): string {
    return `다음 아이디어와 PRD를 기반으로 상세한 개발 계획서를 한국어로 작성해주세요.

## 아이디어 정보
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}

${prdContent ? `## PRD 내용\n${prdContent}\n\n` : ''}## 개발 계획서 작성 요구사항
다음 구조를 정확히 따라 마크다운 형식으로 작성해주세요. 개발 전문가 수준의 상세하고 실용적인 계획서를 작성해주세요.

### 1. 개발 개요

#### 프로젝트 정보
- 프로젝트명: [프로젝트 이름]
- 개발 기간: [예상 기간]
- 개발 인원: [예상 인원]
- 기술 스택: [사용할 기술 스택]

#### 개발 목표
- [개발 목표 1]
- [개발 목표 2]
- [개발 목표 3]

### 2. 기술 아키텍처

#### 시스템 아키텍처
다음 Mermaid 다이어그램으로 시스템 구조를 표현해주세요:

\`\`\`mermaid
graph TB
    A[클라이언트] --> B[API Gateway]
    B --> C[인증 서비스]
    B --> D[비즈니스 로직]
    D --> E[데이터베이스]
\`\`\`

#### 기술 스택 상세
**프론트엔드**
- 프레임워크: React 18+
- 빌드 도구: Vite
- 언어: TypeScript
- UI 라이브러리: Shadcn/UI, Tailwind CSS
- 상태 관리: [상태 관리 라이브러리]
- 라우팅: React Router DOM

**백엔드**
- 서버리스: Vercel Functions
- 데이터베이스: Supabase (PostgreSQL)
- 인증: Supabase Auth
- 실시간: Supabase Realtime

**개발 도구**
- 버전 관리: Git
- 배포: Vercel
- 코드 품질: ESLint, Prettier

### 3. 데이터베이스 설계

#### ERD (Entity Relationship Diagram)
다음 Mermaid 형식으로 ERD를 작성해주세요:

\`\`\`mermaid
erDiagram
    USERS ||--o{ IDEAS : creates
    USERS ||--o{ PRDS : generates
    IDEAS ||--o| PRDS : has
    USERS ||--o{ POSTS : writes
    POSTS ||--o{ COMMENTS : has
\`\`\`

#### 주요 테이블 구조
**users 테이블**
- id: UUID (Primary Key)
- email: String (Unique)
- created_at: Timestamp

**ideas 테이블**
- id: UUID (Primary Key)
- title: String
- content: Text
- subreddit: String
- url: String
- created_at: Timestamp

[필요한 다른 테이블들도 상세히 작성]

### 4. 개발 단계별 계획

#### Phase 1: MVP 개발 (Week 1-2)

**Week 1: 기반 구축**
- Day 1-2: 프로젝트 초기 설정
  - [ ] React + Vite 프로젝트 생성
  - [ ] TypeScript 설정
  - [ ] Tailwind CSS 설정
  - [ ] Shadcn/UI 초기화
  - [ ] Supabase 연동
- Day 3-4: 인증 시스템
  - [ ] Supabase Auth 설정
  - [ ] 로그인/회원가입 UI
  - [ ] 인증 상태 관리
- Day 5-7: 아이디어 수집 기능
  - [ ] Reddit API 연동
  - [ ] 아이디어 수집 로직
  - [ ] 아이디어 목록 UI

**Week 2: 핵심 기능**
- Day 8-10: PRD 생성 기능
  - [ ] AI API 연동
  - [ ] PRD 생성 로직
  - [ ] PRD 뷰어 UI
- Day 11-12: 커뮤니티 기능
  - [ ] 게시글 작성/조회
  - [ ] 댓글 시스템
  - [ ] 좋아요/북마크
- Day 13-14: 배포 및 테스트
  - [ ] Vercel 배포
  - [ ] 통합 테스트
  - [ ] 버그 수정

#### Phase 2: 기능 확장 (Week 3-4)
[상세한 계획 작성]

### 5. 개발 일정 (Gantt Chart)

다음 Mermaid Gantt 차트로 일정을 시각화해주세요:

\`\`\`mermaid
gantt
    title 개발 일정
    dateFormat YYYY-MM-DD
    section Phase 1: MVP
    프로젝트 초기 설정    :a1, 2024-01-01, 2d
    인증 시스템          :a2, after a1, 2d
    아이디어 수집        :a3, after a2, 3d
    PRD 생성 기능        :a4, after a3, 3d
    커뮤니티 기능        :a5, after a4, 2d
    배포 및 테스트       :a6, after a5, 2d
    section Phase 2: 확장
    고급 기능 개발       :b1, after a6, 7d
    최적화              :b2, after b1, 3d
\`\`\`

### 6. 리스크 관리

#### 주요 리스크 및 대응 방안
1. **리스크 1**: [리스크 설명]
   - 대응 방안: [대응 방법]
   - 완화 전략: [완화 방법]

2. **리스크 2**: [리스크 설명]
   - 대응 방안: [대응 방법]
   - 완화 전략: [완화 방법]

### 7. 테스트 계획

#### 테스트 전략
- 단위 테스트: [테스트 범위]
- 통합 테스트: [테스트 범위]
- E2E 테스트: [테스트 범위]

#### 테스트 체크리스트
- [ ] 인증 플로우 테스트
- [ ] 아이디어 수집 기능 테스트
- [ ] PRD 생성 기능 테스트
- [ ] 커뮤니티 기능 테스트
- [ ] 성능 테스트

### 8. 배포 계획

#### 배포 환경
- 개발 환경: [환경 설정]
- 스테이징 환경: [환경 설정]
- 프로덕션 환경: [환경 설정]

#### 배포 체크리스트
- [ ] 환경 변수 설정
- [ ] 데이터베이스 마이그레이션
- [ ] CDN 설정
- [ ] 모니터링 설정

---

**중요**: 
- 개발 전문가 수준의 상세하고 실용적인 계획서를 작성해주세요.
- 각 단계별로 구체적인 작업 항목과 예상 시간을 포함해주세요.
- Mermaid 다이어그램을 적극 활용하여 시각화해주세요.
- 실제 개발에 바로 활용할 수 있도록 구체적으로 작성해주세요.`;
  }

  /**
   * OpenAI API 호출
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // 무료 티어 최적화
          messages: [
            { 
              role: 'system', 
              content: 'You are a product manager who writes clear and practical PRD documents in Korean. Always respond in markdown format.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000, // 비용 최적화
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call error:', error);
      throw error;
    }
  }

  /**
   * Claude API 호출
   */
  private async callClaude(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    
    if (!apiKey) {
      throw new Error('Claude API key is not configured');
    }

    try {
      // Anthropic Claude API 호출
      // 참고: 실제 API 엔드포인트와 형식은 Anthropic 문서 확인 필요
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // 무료 티어 모델
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Claude API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response from Claude API');
      }

      return data.content[0].text;
    } catch (error) {
      console.error('Claude API call error:', error);
      throw error;
    }
  }

  /**
   * OpenRouter API 호출 (무료 모델 사용)
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    // 무료 모델 선택 (하루 할당량 제공)
    // meta-llama/llama-3.1-8b-instruct: 안정적인 무료 모델 (권장)
    // mistralai/mistral-7b-instruct: 무료 모델
    // google/gemini-flash-1.5-8b: 구버전 (사용 가능 여부 확인 필요)
    // google/gemini-2.0-flash-exp: 실험적 모델 (사용 불가)
    const model = this.config.model || 'meta-llama/llama-3.1-8b-instruct';

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin, // OpenRouter 요구사항
          'X-Title': 'IdeaSpark', // OpenRouter 요구사항
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a product manager who writes clear and practical PRD documents in Korean. Always respond in markdown format.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000, // 비용 최적화
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenRouter API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter API call error:', error);
      throw error;
    }
  }
}

// AI 클라이언트 인스턴스 생성
// OpenRouter를 기본값으로 사용 (무료 모델)
const provider = (import.meta.env.VITE_AI_PROVIDER || 'openrouter') as 'openai' | 'claude' | 'openrouter';
const apiKey = provider === 'openrouter'
  ? (import.meta.env.VITE_OPENROUTER_API_KEY || '')
  : provider === 'openai'
  ? (import.meta.env.VITE_OPENAI_API_KEY || '')
  : (import.meta.env.VITE_CLAUDE_API_KEY || '');

export const aiClient = new AIClient({
  provider,
  apiKey,
  model: import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct', // OpenRouter 무료 모델
});
