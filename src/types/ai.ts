// AI API 관련 타입 정의

export interface AIConfig {
  provider: 'openai' | 'claude' | 'openrouter';
  apiKey: string;
  model?: string; // OpenRouter에서 사용할 모델명
}

export interface PRDGenerationRequest {
  ideaId: string;
  userId: string;
}

export interface PRDGenerationResponse {
  success: boolean;
  prdId?: string;
  content?: string;
  error?: string;
}

