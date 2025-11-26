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
   * PRD 프롬프트 생성
   */
  private buildPRDPrompt(idea: Idea): string {
    return `다음 Reddit 게시글을 분석하여 PRD 문서를 작성해주세요.

## 원본 게시글
제목: ${idea.title}
내용: ${idea.content}
서브레딧: r/${idea.subreddit}
작성자: ${idea.author}
업보트: ${idea.upvotes}

## 요구사항
다음 형식으로 PRD 문서를 작성해주세요:

1. 프로젝트 개요
   - 프로젝트명: [자동 생성]
   - 한 줄 설명: [핵심 가치 제안]
   - 타겟 사용자: [분석 기반]
   - 해결하려는 문제: [게시글에서 추출]

2. 사용자 스토리
   - 최소 3개 이상의 사용자 스토리 작성
   - 각 스토리는 "**[사용자]**로서, 나는 **[목표]**를 위해 **[행동]**하고 싶다." 형식

3. 화면 설계
   - 최소 2개 화면 설계
   - 각 화면의 목적과 구성 요소 명시
   - 화면 구성: 상단, 중간, 하단으로 구분

4. 기술 요구사항
   - 웹앱: React, Vite
   - 언어: TypeScript
   - 서버 및 DB: Supabase
   - 디자인: Shadcn/UI, Tailwind CSS

간결하고 실용적인 PRD를 작성해주세요. 마크다운 형식으로 작성해주세요.`;
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
    // google/gemini-flash-1.5: 빠르고 무료
    // meta-llama/llama-3.1-8b-instruct: 무료
    // mistralai/mistral-7b-instruct: 무료
    const model = this.config.model || 'google/gemini-flash-1.5';

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
  model: import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-flash-1.5', // OpenRouter 무료 모델
});

