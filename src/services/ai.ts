// AI API 클라이언트 (OpenAI, Claude, OpenRouter 지원)
import type { Idea } from './ideaService';

export interface AIConfig {
  provider: 'openai' | 'claude' | 'openrouter';
  apiKey: string;
  model?: string;
}

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
   * PRD 생성 프롬프트 작성
   */
  private buildPRDPrompt(idea: Idea): string {
    return `다음 Reddit 게시글을 기반으로 상세한 PRD(Product Requirements Document) 문서를 한국어로 작성해주세요.

## 아이디어 정보
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}
- **작성자**: ${idea.author}
- **업보트**: ${idea.upvotes}

## PRD 작성 요구사항
다음 섹션을 포함하여 마크다운 형식으로 작성해주세요:

1. **프로젝트 개요**
   - 프로젝트 목적
   - 핵심 가치 제안
   - 타겟 사용자

2. **사용자 스토리**
   - 주요 사용자 페르소나
   - 사용자 여정
   - 핵심 기능 요구사항

3. **기능 명세**
   - MVP 기능 목록
   - 우선순위별 기능 분류
   - 기술적 제약사항

4. **화면 설계**
   - 주요 화면 구조
   - 사용자 인터페이스 요구사항
   - UX 고려사항

5. **기술 요구사항**
   - 기술 스택 제안
   - 인프라 요구사항
   - 보안 고려사항

6. **성공 지표**
   - KPI 정의
   - 측정 방법

각 섹션을 상세하고 실용적으로 작성해주세요.`;
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
          model: 'gpt-3.5-turbo',
          messages: [
            { 
              role: 'system', 
              content: 'You are a product manager who writes clear and practical PRD documents in Korean. Always respond in markdown format.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2000,
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // 무료 티어 최적화
          max_tokens: 2000,
          messages: [
            { 
              role: 'user', 
              content: `You are a product manager who writes clear and practical PRD documents in Korean. Always respond in markdown format.\n\n${prompt}` 
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
      console.log('[AIClient] Calling OpenRouter with model:', model);
      
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
        const errorMessage = errorData.error?.message || response.statusText;
        console.error('[AIClient] OpenRouter API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          model: model,
        });
        throw new Error(`OpenRouter API error: ${response.status} ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AIClient] Invalid OpenRouter response:', data);
        throw new Error('Invalid response from OpenRouter API');
      }

      console.log('[AIClient] OpenRouter API call successful');
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIClient] OpenRouter API call error:', error);
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
