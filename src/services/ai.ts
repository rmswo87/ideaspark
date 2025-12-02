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
   * 여러 번에 나누어서 생성하여 완전한 문서를 만듭니다.
   * @param onProgress 진행률 콜백 (0-100)
   */
  async generatePRD(idea: Idea, onProgress?: (progress: number) => void): Promise<string> {
    // PRD를 10개 부분으로 나누어서 더 상세하고 완전하게 생성
    const parts: string[] = [];
    const totalParts = 10;
    
    // 초기 진행률
    if (onProgress) onProgress(0);
    
    for (let partNum = 1; partNum <= totalParts; partNum++) {
      const prompt = this.buildPRDPrompt(idea, partNum, parts);
      
      let partContent: string;
      if (this.config.provider === 'openrouter') {
        partContent = await this.callOpenRouter(prompt);
      } else if (this.config.provider === 'openai') {
        partContent = await this.callOpenAI(prompt);
      } else {
        partContent = await this.callClaude(prompt);
      }
      
      parts.push(partContent);
      
      // 각 부분 완료 시 진행률 업데이트 (부드럽게 증가하도록 작은 단위로)
      // 각 부분은 약 80/totalParts%씩, 합치기는 20%
      // 부드러운 진행을 위해 여러 단계로 나눠서 업데이트
      if (onProgress) {
        const steps = 10; // 각 부분을 10단계로 나눔
        for (let step = 1; step <= steps; step++) {
          const stepProgress = Math.floor(((partNum - 1) / totalParts) * 80 + (step / steps) * (80 / totalParts));
          setTimeout(() => {
            if (onProgress) onProgress(stepProgress);
          }, step * 50); // 50ms 간격으로 업데이트
        }
      }
      
      // 마지막 부분이 아니면 잠시 대기 (API rate limit 방지)
      if (partNum < totalParts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // 모든 부분을 합쳐서 하나의 문서로 만들기
    if (onProgress) onProgress(90);
    const fullDocument = this.mergePRDParts(parts);
    if (onProgress) onProgress(100);
    return fullDocument;
  }

  /**
   * 아이디어와 PRD를 기반으로 개발 계획서 생성
   * 여러 번에 나누어서 생성하여 완전한 문서를 만듭니다.
   * @param onProgress 진행률 콜백 (0-100)
   */
  async generateDevelopmentPlan(idea: Idea, prdContent?: string, onProgress?: (progress: number) => void): Promise<string> {
    // 개발 계획서를 12개 부분으로 나누어서 더 상세하고 완전하게 생성
    const parts: string[] = [];
    const totalParts = 12;
    
    // 초기 진행률
    if (onProgress) onProgress(0);
    
    for (let partNum = 1; partNum <= totalParts; partNum++) {
      const prompt = this.buildDevelopmentPlanPrompt(idea, prdContent, partNum, parts);
      
      let partContent: string;
      if (this.config.provider === 'openrouter') {
        partContent = await this.callOpenRouter(prompt);
      } else if (this.config.provider === 'openai') {
        partContent = await this.callOpenAI(prompt);
      } else {
        partContent = await this.callClaude(prompt);
      }
      
      parts.push(partContent);
      
      // 각 부분 완료 시 진행률 업데이트 (부드럽게 증가하도록 작은 단위로)
      // 각 부분은 약 88/totalParts%씩, 합치기는 12%
      // 부드러운 진행을 위해 여러 단계로 나눠서 업데이트
      if (onProgress) {
        const steps = 10; // 각 부분을 10단계로 나눔
        for (let step = 1; step <= steps; step++) {
          const stepProgress = Math.floor(((partNum - 1) / totalParts) * 88 + (step / steps) * (88 / totalParts));
          setTimeout(() => {
            if (onProgress) onProgress(stepProgress);
          }, step * 50); // 50ms 간격으로 업데이트
        }
      }
      
      // 마지막 부분이 아니면 잠시 대기 (API rate limit 방지)
      if (partNum < totalParts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // 모든 부분을 합쳐서 하나의 문서로 만들기
    if (onProgress) onProgress(95);
    const fullDocument = this.mergeDevelopmentPlanParts(parts);
    if (onProgress) onProgress(100);
    return fullDocument;
  }

  /**
   * 개발 계획서 부분들을 합치기
   */
  private mergeDevelopmentPlanParts(parts: string[]): string {
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    
    // 첫 번째 부분의 헤더와 개요 유지
    let merged = parts[0];
    
    // Task 번호 추출 및 재정렬을 위한 맵
    const taskMap = new Map<string, { major: number; minor: number; content: string }>();
    
    // 모든 부분에서 Task 추출
    parts.forEach((part) => {
      const taskRegex = /## 🎯 \[P\d+\] Task (\d+)\.(\d+):([^\n]+)\n([\s\S]*?)(?=## 🎯|## 📊|## 🗄️|## 📅|## ⚠️|## ✅|$)/g;
      let match;
      while ((match = taskRegex.exec(part)) !== null) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        const taskKey = `${major}.${minor}`;
        const taskContent = match[0];
        
        // 중복된 Task가 있으면 첫 번째 것만 유지
        if (!taskMap.has(taskKey)) {
          taskMap.set(taskKey, { major, minor, content: taskContent });
        }
      }
    });
    
    // 나머지 부분들을 순차적으로 추가
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      // 중복되는 헤더나 메타 정보 제거
      let cleanedPart = part
        // Epic 헤더 제거
        .replace(/^#\s*Epic\s+\d+:.*$/m, '')
        // Planning Expert 인용구 제거
        .replace(/^>.*Planning Expert.*$/m, '')
        // 메타 정보 제거
        .replace(/^\*\*기간\*\*:.*$/m, '')
        .replace(/^\*\*목표\*\*:.*$/m, '')
        .replace(/^\*\*전문가\*\*:.*$/m, '')
        .replace(/^\*\*복잡도\*\*:.*$/m, '')
        // Planning Expert 가이드라인 섹션 완전 제거
        .replace(/#\s*Planning Expert v6\.1 작성 가이드라인[\s\S]*?(?=##|# Epic|$)/g, '')
        .replace(/##\s*Planning Expert v6\.1 작성 가이드라인[\s\S]*?(?=##|# Epic|$)/g, '')
        .replace(/###\s*Part \d+ 전체 내용[\s\S]*?(?=##|# Epic|$)/g, '')
        // 빈 구분선 제거
        .replace(/^---\s*$/m, '')
        // 부분 작성 가이드 제거
        .replace(/\*\*⚠️ 부분 작성 가이드.*?\n\n/gs, '')
        // 이전 부분 참고 내용 제거
        .replace(/\*\*⚠️ CRITICAL: 이전 부분 전체 내용.*?⚠️ 중요 지시사항:.*?\n\n/gs, '')
        .replace(/\*\*⚠️ 중요 지시사항:.*?\n\n/gs, '')
        .trim();
      
      // 첫 번째 부분에 이미 있는 섹션 제거
      if (i === 1) {
        // Part 2에서는 Epic 개요 섹션 제거
        cleanedPart = cleanedPart
          .replace(/^## 📋 Epic 1 개요.*?(?=## 🎯|## 📊|## 🗄️|## 📅|## ⚠️|## ✅)/s, '')
          .trim();
      }
      
      // 중복된 섹션 제거 (모든 부분에서)
      // Epic 개요 섹션 중복 제거
      cleanedPart = cleanedPart
        .replace(/^## 📋 Epic \d+ 개요.*?(?=## 🎯|## 📊|## 🗄️|## 📅|## ⚠️|## ✅)/s, '')
        .trim();
      
      // 시스템 아키텍처 섹션 중복 제거 (다양한 패턴)
      cleanedPart = cleanedPart
        .replace(/^## 📊 시스템 아키텍처.*?(?=## 🗄️|## 📅|## 🎯|## ⚠️|## ✅)/s, '')
        .replace(/^##\s*시스템\s*아키텍처.*?(?=## 🗄️|## 📅|## 🎯|## ⚠️|## ✅)/s, '')
        .replace(/^###\s*시스템\s*구조\s*다이어그램.*?(?=##|###|$)/s, '')
        .replace(/^###\s*시스템\s*아키텍처.*?(?=##|###|$)/s, '')
        .trim();
      
      // 데이터베이스 설계 섹션 중복 제거
      cleanedPart = cleanedPart
        .replace(/^## 🗄️ 데이터베이스 설계.*?(?=## 📅|## 🎯|## ⚠️|## ✅)/s, '')
        .replace(/^##\s*데이터베이스\s*설계.*?(?=## 📅|## 🎯|## ⚠️|## ✅)/s, '')
        .trim();
      
      // 프로젝트 구조 다이어그램 섹션 중복 제거
      cleanedPart = cleanedPart
        .replace(/^##\s*프로젝트\s*구조.*?(?=##|###|$)/s, '')
        .replace(/^###\s*프로젝트\s*구조\s*다이어그램.*?(?=##|###|$)/s, '')
        .replace(/^<h3[^>]*>프로젝트\s*구조\s*다이어그램<\/h3>.*?(?=<h|##|###|$)/s, '')
        .replace(/^<h4[^>]*>프로젝트\s*구조\s*다이어그램<\/h4>.*?(?=<h|##|###|$)/s, '')
        .trim();
      
      // 중복된 Task 제거 (이미 merged에 있는 Task 번호는 제거)
      const existingTaskNumbers = new Set<string>();
      const existingTaskRegex = /## 🎯 \[P\d+\] Task (\d+)\.(\d+):/g;
      let existingMatch;
      while ((existingMatch = existingTaskRegex.exec(merged)) !== null) {
        existingTaskNumbers.add(`${existingMatch[1]}.${existingMatch[2]}`);
      }
      
      // cleanedPart에서 중복된 Task 제거
      cleanedPart = cleanedPart.replace(/## 🎯 \[P\d+\] Task (\d+)\.(\d+):[\s\S]*?(?=## 🎯|## 📊|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, (match, major, minor) => {
        const taskKey = `${major}.${minor}`;
        if (existingTaskNumbers.has(taskKey)) {
          return ''; // 중복된 Task 제거
        }
        existingTaskNumbers.add(taskKey);
        return match;
      });
      
      // 자연스럽게 연결
      if (cleanedPart) {
        merged += '\n\n' + cleanedPart;
      }
    }
    
    // 중복 제거 및 정리
    merged = merged
      .replace(/\n{4,}/g, '\n\n\n') // 연속된 줄바꿈 정리
      .replace(/^---\s*$/gm, '---') // 구분선 정리
      .replace(/\*\*⚠️ 중요:.*?\n\n/gs, '') // 부분 작성 가이드 완전 제거
      .replace(/\*\*⚠️ CRITICAL:.*?\n\n/gs, '') // CRITICAL 메시지 제거
      // Planning Expert 가이드라인 완전 제거
      .replace(/#\s*Planning Expert v6\.1 작성 가이드라인[\s\S]*?(?=##|# Epic|$)/g, '')
      .replace(/##\s*Planning Expert v6\.1 작성 가이드라인[\s\S]*?(?=##|# Epic|$)/g, '')
      .replace(/###\s*Part \d+ 전체 내용[\s\S]*?(?=##|# Epic|$)/g, '')
      // 중복된 Mermaid 다이어그램 제거 (같은 내용의 다이어그램이 여러 번 나타나면 첫 번째 것만 유지)
      .replace(/(```mermaid[\s\S]*?```)([\s\S]*?)\1/g, '$1$2')
      // 중복된 시스템 아키텍처 섹션 제거
      .replace(/(## 📊\s*시스템\s*아키텍처[\s\S]*?)(?=## 📊\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(##\s*시스템\s*아키텍처[\s\S]*?)(?=##\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      // 중복된 데이터베이스 설계 섹션 제거
      .replace(/(## 🗄️\s*데이터베이스\s*설계[\s\S]*?)(?=## 🗄️\s*데이터베이스\s*설계|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(##\s*데이터베이스\s*설계[\s\S]*?)(?=##\s*데이터베이스\s*설계|## 📅|## ⚠️|## ✅|$)/g, '$1')
      // 중복된 프로젝트 구조 섹션 제거
      .replace(/(##\s*프로젝트\s*구조[\s\S]*?)(?=##\s*프로젝트\s*구조|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(###\s*프로젝트\s*구조\s*다이어그램[\s\S]*?)(?=###\s*프로젝트\s*구조\s*다이어그램|##|###|$)/g, '$1')
      .trim();
    
    // 문서가 중간에 끊겼는지 확인 (마지막 줄이 "## 🎯 [P1] Task"로 끝나면 불완전)
    const lastLines = merged.split('\n').slice(-5).join('\n');
    if (lastLines.match(/^## 🎯 \[P\d+\] Task \d+\.\d+:$/m)) {
      // 불완전한 Task 제거
      merged = merged.replace(/\n## 🎯 \[P\d+\] Task \d+\.\d+:.*$/s, '');
    }
    
    return merged;
  }

  /**
   * 아이디어를 기반으로 개선된 제안서 생성
   */
  async generateProposal(idea: Idea): Promise<string> {
    try {
      const prompt = this.buildProposalPrompt(idea);

      let result: string;
      if (this.config.provider === 'openrouter') {
        result = await this.callOpenRouter(prompt);
      } else if (this.config.provider === 'openai') {
        result = await this.callOpenAI(prompt);
      } else {
        result = await this.callClaude(prompt);
      }

      // 결과가 비어있거나 너무 짧으면 에러
      if (!result || result.trim().length < 100) {
        throw new Error('제안서 생성 결과가 비어있거나 너무 짧습니다. API 응답을 확인해주세요.');
      }

      return result;
    } catch (error) {
      // 더 명확한 에러 메시지 제공
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error(`AI API 키가 설정되지 않았습니다. 환경 변수를 확인해주세요. (${this.config.provider})`);
        }
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error(`AI API 인증에 실패했습니다. API 키를 확인해주세요. (${this.config.provider})`);
        }
        if (error.message.includes('429')) {
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error(`제안서 생성 실패: ${error.message}`);
      }
      throw new Error('제안서 생성 중 알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * 제안서 기반 PRD 생성
   * 여러 번에 나누어서 생성하여 완전한 문서를 만듭니다.
   * @param onProgress 진행률 콜백 (0-100)
   */
  async generatePRDFromProposal(idea: Idea, proposalContent: string, onProgress?: (progress: number) => void): Promise<string> {
    // PRD를 10개 부분으로 나누어서 더 상세하게 생성
    const parts: string[] = [];
    const totalParts = 10;
    
    // 초기 진행률
    if (onProgress) onProgress(0);
    
    for (let partNum = 1; partNum <= totalParts; partNum++) {
      const prompt = this.buildPRDFromProposalPrompt(idea, proposalContent, partNum, parts);
      
      let partContent: string;
      if (this.config.provider === 'openrouter') {
        partContent = await this.callOpenRouter(prompt);
      } else if (this.config.provider === 'openai') {
        partContent = await this.callOpenAI(prompt);
      } else {
        partContent = await this.callClaude(prompt);
      }
      
      parts.push(partContent);
      
      // 각 부분 완료 시 진행률 업데이트 (각 부분은 약 20%씩, 마지막 합치기는 20%)
      const partProgress = Math.floor((partNum / totalParts) * 80);
      if (onProgress) onProgress(partProgress);
      
      // 마지막 부분이 아니면 잠시 대기 (API rate limit 방지)
      if (partNum < totalParts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // 모든 부분을 합쳐서 하나의 문서로 만들기
    if (onProgress) onProgress(90);
    const fullDocument = this.mergePRDParts(parts);
    if (onProgress) onProgress(100);
    return fullDocument;
  }


  /**
   * PRD 부분들을 합치기
   */
  private mergePRDParts(parts: string[]): string {
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    
    // 첫 번째 부분의 헤더 유지
    let merged = parts[0];
    
    // 나머지 부분들을 순차적으로 추가
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      
      // 중복되는 헤더나 메타 정보 제거
      let cleanedPart = part
        // PRD 제목 제거
        .replace(/^#\s*PRD.*$/m, '')
        // 섹션 번호 중복 제거 (이미 작성된 섹션 제목 제거)
        .replace(/^###\s*1\.\s*프로젝트\s*개요.*$/m, '')
        .replace(/^###\s*2\.\s*사용자\s*스토리.*$/m, '')
        .replace(/^###\s*3\.\s*기능\s*명세.*$/m, '')
        .replace(/^###\s*4\.\s*화면\s*설계.*$/m, '')
        .replace(/^###\s*5\.\s*기술\s*요구사항.*$/m, '')
        .replace(/^###\s*6\.\s*프로젝트\s*구조.*$/m, '')
        .replace(/^###\s*6\.\s*성공\s*지표.*$/m, '')
        // 중복된 시스템 아키텍처 섹션 제거 (다양한 패턴)
        .replace(/^## 📊\s*시스템\s*아키텍처.*?(?=##|###|$)/gs, '')
        .replace(/^##\s*시스템\s*아키텍처.*?(?=##|###|$)/gs, '')
        .replace(/^###\s*시스템\s*구조\s*다이어그램.*?(?=##|###|$)/gs, '')
        .replace(/^###\s*시스템\s*아키텍처.*?(?=##|###|$)/gs, '')
        .replace(/^## 📦\s*시스템\s*아키텍처.*?(?=##|###|$)/gs, '')
        .replace(/^## 📋\s*시스템\s*아키텍처.*?(?=##|###|$)/gs, '')
        // 중복된 데이터베이스 설계 섹션 제거 (다양한 패턴)
        .replace(/^## 🗄️\s*데이터베이스\s*설계.*?(?=##|###|$)/gs, '')
        .replace(/^##\s*데이터베이스\s*설계.*?(?=##|###|$)/gs, '')
        .replace(/^###\s*ERD.*?(?=##|###|$)/gs, '')
        .replace(/^###\s*데이터베이스\s*설계.*?(?=##|###|$)/gs, '')
        // 중복된 프로젝트 구조 섹션 제거
        .replace(/^##\s*프로젝트\s*구조.*?(?=##|###|$)/gs, '')
        .replace(/^###\s*프로젝트\s*구조\s*다이어그램.*?(?=##|###|$)/gs, '')
        .replace(/^<h3[^>]*>프로젝트\s*구조\s*다이어그램<\/h3>.*?(?=<h|##|###|$)/gs, '')
        .replace(/^<h4[^>]*>프로젝트\s*구조\s*다이어그램<\/h4>.*?(?=<h|##|###|$)/gs, '')
        // 빈 구분선 제거
        .replace(/^---\s*$/m, '')
        // 부분 작성 가이드 제거
        .replace(/\*\*⚠️ 부분 작성 가이드.*?\n\n/gs, '')
        // 이전 부분 참고 내용 제거
        .replace(/\*\*⚠️ CRITICAL: 이전 부분 전체 내용.*?⚠️ 중요 지시사항:.*?\n\n/gs, '')
        .trim();
      
      // 첫 번째 부분에 이미 있는 섹션 제거
      if (i === 1) {
        cleanedPart = cleanedPart
          .replace(/^###\s*1\.\s*프로젝트\s*개요.*?(?=###\s*2\.|##|$)/s, '')
          .trim();
      }
      
      // 중복된 다이어그램 제거 (같은 내용의 Mermaid 다이어그램이 여러 번 나타나면 첫 번째 것만 유지)
      if (i > 1) {
        // 이미 merged에 있는 Mermaid 다이어그램과 동일한 내용이면 제거
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        const existingDiagrams: string[] = [];
        let match;
        while ((match = mermaidRegex.exec(merged)) !== null) {
          existingDiagrams.push(match[1].trim());
        }
        
        cleanedPart = cleanedPart.replace(/```mermaid\n([\s\S]*?)```/g, (fullMatch, content) => {
          const trimmedContent = content.trim();
          if (existingDiagrams.includes(trimmedContent)) {
            return ''; // 중복된 다이어그램 제거
          }
          existingDiagrams.push(trimmedContent);
          return fullMatch;
        });
      }
      
      // 자연스럽게 연결
      if (cleanedPart) {
        merged += '\n\n' + cleanedPart;
      }
    }
    
      // 중복 제거 및 정리
    merged = merged
      .replace(/\n{4,}/g, '\n\n\n') // 연속된 줄바꿈 정리
      .replace(/^---\s*$/gm, '---') // 구분선 정리
      .replace(/\*\*⚠️ 중요:.*?\n\n/gs, '') // 부분 작성 가이드 완전 제거
      .replace(/\*\*⚠️ CRITICAL:.*?\n\n/gs, '') // CRITICAL 메시지 제거
      // 불필요한 메타 정보 제거 (최종 확인 사항 등)
      .replace(/\*\*⚠️ 최종 확인 사항.*?✅.*?확인.*?\n\n/gs, '')
      .replace(/⚠️ 최종 확인 사항.*?✅.*?확인.*?\n\n/gs, '')
      .replace(/<p[^>]*>⚠️ 최종 확인 사항.*?<\/p>/gs, '')
      .replace(/\*\*⚠️ CRITICAL: 문서 완성도 확인.*?✅.*?확인.*?\n\n/gs, '')
      .replace(/⚠️ CRITICAL: 문서 완성도 확인.*?✅.*?확인.*?\n\n/gs, '')
      // 제안서 내용 완전 제거 (다양한 패턴)
      .replace(/#\s*\[.*?\]\s*-\s*제안서[\s\S]*?(?=##|#|$)/g, '')
      .replace(/#\s*.*?\s*-\s*제안서[\s\S]*?(?=##|#|$)/g, '')
      .replace(/##\s*1\.\s*개요[\s\S]*?##\s*2\.\s*문제\s*정의[\s\S]*?##\s*3\.\s*제안\s*솔루션[\s\S]*?##\s*4\.\s*사용자\s*시나리오[\s\S]*?##\s*5\.\s*실행\s*계획[\s\S]*?##\s*6\.\s*예상\s*성과/g, '')
      .replace(/##\s*원본\s*아이디어[\s\S]*?##\s*개선\s*목표[\s\S]*?##\s*핵심\s*가치/g, '')
      // 제안서 관련 섹션 제거
      .replace(/##\s*제안서\s*작성\s*목표.*?(?=##|###|$)/gs, '')
      .replace(/##\s*제안서\s*작성\s*형식.*?(?=##|###|$)/gs, '')
      // 불완전한 문장 제거 (예: "기능의 성공률"로 끝나는 경우)
      .replace(/- 사용자 기억을 학습하고, 기억을 유지하는 기능의 성공률\s*$/gm, '')
      .replace(/- 사용자 기억을 학습하고, 기억을 유지하는 기능의 성공률\n*$/gm, '')
      // 중복된 Mermaid 다이어그램 제거 (더 강력한 패턴)
      .replace(/(```mermaid[\s\S]*?```)([\s\S]*?)\1/g, '$1$2')
      // 중복된 시스템 아키텍처 섹션 제거
      .replace(/(## 📊\s*시스템\s*아키텍처[\s\S]*?)(?=## 📊\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(##\s*시스템\s*아키텍처[\s\S]*?)(?=##\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(## 📦\s*시스템\s*아키텍처[\s\S]*?)(?=## 📦\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(## 📋\s*시스템\s*아키텍처[\s\S]*?)(?=## 📋\s*시스템\s*아키텍처|## 🗄️|## 📅|## ⚠️|## ✅|$)/g, '$1')
      // 중복된 데이터베이스 설계 섹션 제거
      .replace(/(## 🗄️\s*데이터베이스\s*설계[\s\S]*?)(?=## 🗄️\s*데이터베이스\s*설계|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(##\s*데이터베이스\s*설계[\s\S]*?)(?=##\s*데이터베이스\s*설계|## 📅|## ⚠️|## ✅|$)/g, '$1')
      // 중복된 프로젝트 구조 섹션 제거
      .replace(/(##\s*프로젝트\s*구조[\s\S]*?)(?=##\s*프로젝트\s*구조|## 📅|## ⚠️|## ✅|$)/g, '$1')
      .replace(/(###\s*프로젝트\s*구조\s*다이어그램[\s\S]*?)(?=###\s*프로젝트\s*구조\s*다이어그램|##|###|$)/g, '$1')
      .replace(/(<h3[^>]*>프로젝트\s*구조\s*다이어그램<\/h3>[\s\S]*?)(?=<h3[^>]*>프로젝트\s*구조\s*다이어그램<\/h3>|<h|##|###|$)/g, '$1')
      .replace(/(<h4[^>]*>프로젝트\s*구조\s*다이어그램<\/h4>[\s\S]*?)(?=<h4[^>]*>프로젝트\s*구조\s*다이어그램<\/h4>|<h|##|###|$)/g, '$1')
      // 제안서 내용 완전 제거 (더 강력한 패턴)
      .replace(/#\s*\[.*?\]\s*-\s*제안서[\s\S]*?(?=##|#|$)/g, '')
      .replace(/#\s*.*?\s*-\s*제안서[\s\S]*?(?=##|#|$)/g, '')
      .replace(/##\s*1\.\s*개요[\s\S]*?##\s*2\.\s*문제\s*정의[\s\S]*?##\s*3\.\s*제안\s*솔루션[\s\S]*?##\s*4\.\s*사용자\s*시나리오[\s\S]*?##\s*5\.\s*실행\s*계획[\s\S]*?##\s*6\.\s*예상\s*성과/g, '')
      .replace(/##\s*원본\s*아이디어[\s\S]*?##\s*개선\s*목표[\s\S]*?##\s*핵심\s*가치/g, '')
      // 불완전한 문장 제거 (예: "기능의 성공률"로 끝나는 경우)
      .replace(/- 사용자 기억을 학습하고, 기억을 유지하는 기능의 성공률\s*$/gm, '')
      .replace(/- 사용자 기억을 학습하고, 기억을 유지하는 기능의 성공률\n*$/gm, '')
      // 문서가 불완전하게 끝나는 경우 체크
      .replace(/\n- 사용자 기억을 학습하고, 기억을 유지하는 기능의 성공률\s*$/s, '')
      .trim();
    
    // 문서가 불완전하게 끝나는지 확인 (마지막 줄이 불완전한 문장으로 끝나면 제거)
    const lastLines = merged.split('\n').slice(-3).join('\n');
    if (lastLines.match(/기능의 성공률\s*$/) || lastLines.match(/성공률\s*$/)) {
      // 불완전한 마지막 줄 제거
      merged = merged.replace(/\n- .*?성공률\s*$/s, '');
    }
    
    return merged;
  }

  /**
   * PRD 프롬프트 생성 (prd_ref.md 기반 상세 양식)
   * @param partNumber 부분 번호 (1, 2, 3 등) - 여러 번에 나누어서 생성할 때 사용
   * @param previousParts 이전에 생성된 부분들
   */
  private buildPRDPrompt(idea: Idea, partNumber?: number, previousParts?: string[]): string {
    const isMultiPart = partNumber !== undefined && partNumber > 1;
    const totalParts = 10;
    
    // 이전 부분의 전체 내용 (중복 체크용)
    const previousContent = previousParts && previousParts.length > 0 
      ? `\n\n**⚠️ CRITICAL: 이전 부분 전체 내용 (중복 방지 필수):**\n${previousParts.map((p, i) => `\n### Part ${i + 1} 전체 내용\n${p.substring(0, 5000)}${p.length > 5000 ? '\n\n...(이전 부분이 길어 일부만 표시했습니다. 전체 내용을 참고하여 중복되지 않도록 작성하세요.)' : ''}`).join('\n\n---\n\n')}\n\n**⚠️ 중요 지시사항:**\n- 위 이전 부분의 내용과 **절대 중복되지 않도록** 작성하세요.\n- 이전 부분에 이미 작성된 섹션은 다시 작성하지 마세요.\n- 이전 부분에 이미 작성된 다이어그램은 다시 작성하지 마세요.\n- 이전 부분과 자연스럽게 연결되도록 작성하되, 내용은 완전히 새로운 것이어야 합니다.\n`
      : '';
    
    const partInfo = isMultiPart ? `\n\n**⚠️ 중요: 이것은 PRD의 ${partNumber}번째 부분입니다 (전체 ${totalParts}개 부분).**${previousContent}` : '';
    
    // 각 부분별로 작성할 섹션 정의 (7개 부분으로 세분화)
    const sectionGuide = partNumber === 1 
      ? `- **Part 1 작성 내용**: 프로젝트 개요 섹션만 상세히 작성하세요.\n- 프로젝트명, 한 줄 설명, 프로젝트 목적, 핵심 가치 제안, 타겟 사용자, 해결하려는 문제를 모두 포함하세요.`
      : partNumber === 2
      ? `- **Part 2 작성 내용**: 사용자 스토리 섹션만 상세히 작성하세요.\n- 주요 사용자 페르소나, 사용자 여정, 핵심 기능 요구사항을 모두 포함하세요.\n- 프로젝트 개요 섹션은 작성하지 마세요 (Part 1에 이미 있음).`
      : partNumber === 3
      ? `- **Part 3 작성 내용**: 기능 명세 섹션만 상세히 작성하세요.\n- MVP 기능 목록, 우선순위별 기능 분류, 기술적 제약사항을 모두 포함하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 4
      ? `- **Part 4 작성 내용**: 화면 설계 섹션만 상세히 작성하세요.\n- 최소 2개 이상의 화면을 구체적으로 설계하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 5
      ? `- **Part 5 작성 내용**: 기술 요구사항 섹션만 상세히 작성하세요.\n- 기술 스택 제안, 인프라 요구사항, 보안 고려사항을 모두 포함하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 6
      ? `- **Part 6 작성 내용**: 프로젝트 구조 섹션만 상세히 작성하세요.\n- **⚠️ CRITICAL: 프로젝트 구조 다이어그램을 반드시 포함하세요. 다이어그램이 비어있으면 안 됩니다.**\n- **⚠️ CRITICAL: 다이어그램은 반드시 \`\`\`mermaid 형식을 사용하세요. 일반 코드 블록(\`\`\`)을 사용하지 마세요.**\n- 아이디어와 PRD를 분석하여 실제 시스템 아키텍처를 간결한 Mermaid 다이어그램으로 작성하세요.\n- 다이어그램 노드 텍스트는 최대 10자 이하로 작성하세요 (잘림 방지).\n- 다이어그램 노드는 최대 8개 이하로 작성하세요 (화면 크기 초과 방지).\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.\n- **⚠️ CRITICAL: 이전 부분에 이미 작성된 다이어그램과 동일한 내용의 다이어그램을 작성하지 마세요.**`
      : partNumber === 7
      ? `- **Part 7 작성 내용**: 성공 지표 섹션만 상세히 작성하세요.\n- **⚠️ CRITICAL: 문서를 완전히 마무리하세요. 중간에 끊기지 않도록 마지막까지 작성하세요.**\n- KPI 정의와 측정 방법을 모두 포함하세요.\n- **⚠️ CRITICAL: 문서 마지막은 반드시 완전한 문장으로 끝나야 합니다.**\n- 문서 마지막에 다음 중 하나로 자연스럽게 마무리하세요:\n  1. "## 완료 조건" 섹션 추가\n  2. "## 다음 단계" 섹션 추가\n  3. "## 참고 자료" 섹션 추가\n- **절대 불완전한 문장(예: "* 사용", "* 측정" 등)으로 끝나면 안 됩니다.**\n- 마지막 문장 예시: "이 PRD 문서는 위 내용을 기반으로 개발을 진행할 수 있도록 작성되었습니다."\n- 마지막 문장 예시: "위 KPI를 기준으로 프로젝트의 성공 여부를 측정할 수 있습니다."`
      : '';
    
    return `다음 Reddit 게시글을 기반으로 상세하고 구체적인 PRD(Product Requirements Document) 문서를 한국어로 작성해주세요.

**⚠️ CRITICAL: 문서를 완전히 마무리하세요. 중간에 끊기지 않도록 마지막까지 작성하세요. 불완전한 문장으로 끝나면 안 됩니다.**

${partInfo}
${sectionGuide ? `\n**⚠️ 부분 작성 가이드 (Part ${partNumber}/${totalParts}):**\n${sectionGuide}\n- 이전 부분과 자연스럽게 연결되도록 작성하세요.\n- 중복되는 헤더나 개요 섹션은 작성하지 마세요.\n- 각 부분마다 최소 200-300줄 이상 작성하세요.\n- **⚠️ CRITICAL: 문서를 완전히 마무리하세요. 불완전한 문장으로 끝나면 안 됩니다.**\n` : ''}
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

## ⚠️ 중요 지시사항

**절대 금지 사항:**
- ❌ "[프로젝트 이름을 명확하게 제시]" 같은 플레이스홀더나 예시 템플릿을 그대로 사용하지 마세요
- ❌ "[기능명 1]", "[설명]", "[예상 시간]" 같은 대괄호 안의 예시 텍스트를 그대로 남기지 마세요
- ❌ 일반적인 설명이나 추상적인 내용만 작성하지 마세요

**필수 사항:**
- ✅ 위에 제공된 아이디어 제목과 내용을 **반드시 분석**하여 실제 내용을 작성하세요
- ✅ 아이디어에서 언급된 **구체적인 문제점, 기능, 사용자**를 기반으로 작성하세요
- ✅ 모든 섹션에 **실제 아이디어에서 추출한 구체적인 내용**을 포함하세요
- ✅ 예시가 아닌 **실제 프로젝트 기획서**를 작성하세요

## PRD 작성 요구사항

**⚠️ 절대적으로 준수해야 할 규칙:**
1. **반드시 아래 구조를 정확히 따라 작성하세요.** 섹션 순서, 제목, 형식을 절대 변경하지 마세요.
2. **모든 섹션을 박스 단위로 작성하세요.** 각 섹션은 명확한 제목과 내용으로 구분되어야 합니다.
3. **플레이스홀더([...])를 절대 사용하지 마세요.** 모든 내용은 아이디어에서 추출한 실제 내용이어야 합니다.
4. **아이디어마다 형식이 달라지면 안 됩니다.** 모든 아이디어에 대해 동일한 구조와 형식을 사용하세요.

다음 구조를 **정확히** 따라 마크다운 형식으로 작성해주세요. **위에 제공된 아이디어 정보를 반드시 분석하여 실제 내용을 작성**하세요.

### 1. 프로젝트 개요

#### 프로젝트명
아이디어 제목과 내용을 분석하여 실제 프로젝트 이름을 제시하세요. (예: "TaskFlow", "BudgetBuddy", "StudySync" 등 구체적인 이름)

#### 한 줄 설명
아이디어에서 제시된 문제와 해결책을 기반으로 프로젝트의 핵심 가치를 한 문장으로 설명하세요.

#### 프로젝트 목적
아이디어 내용을 분석하여 다음 세 가지를 반드시 포함하세요:
- 아이디어에서 언급된 구체적인 문제점을 명확히 제시
- 이 문제를 해결하기 위한 프로젝트의 핵심 목표를 명확히 제시
- 프로젝트의 비전과 방향성을 구체적으로 설명

#### 핵심 가치 제안
아이디어에서 제시된 해결책을 기반으로 사용자에게 제공하는 핵심 가치를 구체적으로 나열하세요. 최소 3개 이상의 구체적인 가치를 제시하세요.

#### 타겟 사용자
아이디어 내용을 분석하여 누가 이 문제를 겪고 있는지 구체적으로 제시하세요. 최소 2개 이상의 사용자 그룹을 명시하세요.

#### 해결하려는 문제
아이디어에서 제시된 문제점을 구체적으로 나열하세요. 최소 2개 이상의 구체적인 문제점을 제시하세요.

### 2. 사용자 스토리

#### 주요 사용자 페르소나
아이디어 내용을 분석하여 실제 사용자 페르소나를 작성하세요. 최소 2명의 사용자 페르소나를 다음 형식으로 작성하세요:

**사용자 유형 1: [아이디어에서 언급된 구체적인 사용자 유형]**
- 역할: [아이디어에서 언급된 구체적인 역할]
- 목표: [아이디어에서 언급된 구체적인 목표]
- 불편함: [아이디어에서 언급된 구체적인 불편함]

**사용자 유형 2: [아이디어에서 언급된 구체적인 사용자 유형]**
- 역할: [아이디어에서 언급된 구체적인 역할]
- 목표: [아이디어에서 언급된 구체적인 목표]
- 불편함: [아이디어에서 언급된 구체적인 불편함]

#### 사용자 여정
아이디어에서 제시된 문제 해결 과정을 기반으로 사용자 여정을 다음 4단계로 작성하세요:
1. **인지 단계**: 아이디어에서 언급된 문제 인지 과정을 구체적으로 설명
2. **탐색 단계**: 아이디어에서 언급된 해결책 탐색 과정을 구체적으로 설명
3. **사용 단계**: 아이디어에서 언급된 서비스 사용 과정을 구체적으로 설명
4. **평가 단계**: 아이디어에서 언급된 평가 및 피드백 과정을 구체적으로 설명

#### 핵심 기능 요구사항
아이디어에서 제시된 기능이나 해결책을 기반으로 구체적인 기능을 나열하세요. 각 기능에 대해 상세 설명과 사용 시나리오를 포함하세요. 최소 3개 이상의 기능을 제시하세요.

### 3. 기능 명세

#### MVP 기능 목록
아이디어에서 제시된 기능을 분석하여 구체적인 기능 목록을 작성하세요. 각 기능은 다음 형식을 정확히 따라 작성하세요:

1. **기능명: [아이디어에서 언급된 구체적인 기능명]**
   - 설명: 아이디어에서 언급된 이 기능의 상세 설명과 작동 방식을 구체적으로 작성
   - 우선순위: P0 (필수)
   - 예상 개발 시간: 실제 개발 가능한 예상 시간을 구체적으로 제시 (예: 2주, 3일 등)

2. **기능명: [아이디어에서 언급된 구체적인 기능명]**
   - 설명: 아이디어에서 언급된 이 기능의 상세 설명과 작동 방식을 구체적으로 작성
   - 우선순위: P0 (필수)
   - 예상 개발 시간: 실제 개발 가능한 예상 시간을 구체적으로 제시

3. **기능명: [아이디어에서 언급된 구체적인 기능명]**
   - 설명: 아이디어에서 언급된 이 기능의 상세 설명과 작동 방식을 구체적으로 작성
   - 우선순위: P1 (중요)
   - 예상 개발 시간: 실제 개발 가능한 예상 시간을 구체적으로 제시

#### 우선순위별 기능 분류
아이디어 내용을 분석하여 우선순위별로 기능을 분류하세요. 다음 형식을 정확히 따라 작성하세요:

**P0 (필수 기능 - MVP)**
- 아이디어에서 언급된 필수 기능들의 구체적인 목록을 작성

**P1 (중요 기능 - Phase 2)**
- 아이디어에서 언급된 중요 기능들의 구체적인 목록을 작성

**P2 (선택 기능 - Phase 3)**
- 아이디어에서 언급된 선택 기능들의 구체적인 목록을 작성

#### 기술적 제약사항
아이디어의 특성과 무료 플랜 사용을 고려하여 제약사항을 작성하세요. 다음을 반드시 포함하세요:
- 무료 플랜 사용: 모든 인프라 및 서비스는 무료 플랜 범위 내에서만 구축
- 아이디어 특성에 맞는 구체적인 제약사항을 최소 2개 이상 제시

### 4. 화면 설계

아이디어에서 제시된 기능을 기반으로 실제 화면을 설계하세요. 최소 2개 이상의 화면을 다음 형식으로 작성하세요:

#### 화면 1: [아이디어에서 언급된 주요 화면명]
**목적**: 아이디어에서 언급된 이 화면의 구체적인 목적과 역할을 명확히 제시

**화면 구성**:
- 상단: 아이디어 기능에 맞는 상단 영역 구성 요소를 구체적으로 제시
- 중간: 아이디어 기능에 맞는 중간 영역 구성 요소를 구체적으로 제시
- 하단: 아이디어 기능에 맞는 하단 영역 구성 요소를 구체적으로 제시

**주요 기능**:
- 아이디어에서 언급된 구체적인 기능 1을 명시
- 아이디어에서 언급된 구체적인 기능 2를 명시

#### 화면 2: [아이디어에서 언급된 두 번째 화면명]
위와 동일한 형식으로 아이디어 내용을 분석하여 구체적으로 작성하세요.

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
- 아이디어에 필요한 외부 API 목록을 구체적으로 제시하세요. 없으면 "없음"으로 명시하세요.

#### 인프라 요구사항
- 아이디어 특성에 맞는 인프라 요구사항을 최소 2개 이상 구체적으로 제시하세요.

#### 보안 고려사항
- 아이디어 특성에 맞는 보안 고려사항을 최소 2개 이상 구체적으로 제시하세요.

### 6. 프로젝트 구조

#### 프로젝트 구조 다이어그램
아이디어에서 제시된 기능을 기반으로 실제 프로젝트 구조를 Mermaid 다이어그램으로 작성하세요.

**⚠️ CRITICAL: Mermaid 다이어그램 형식 규칙 (절대 준수):**
1. **반드시 다음 형식을 정확히 따라야 합니다:**
   \`\`\`mermaid
   graph TB
       A[노드1] --> B[노드2]
   \`\`\`
2. **절대 일반 코드 블록(\`\`\`)을 사용하지 마세요. 반드시 \`\`\`mermaid를 사용하세요.**
3. **다이어그램 크기 제한 (화면 잘림 방지):**
   - 노드 개수: 최대 8개
   - 노드 텍스트: 최대 10자 (한글 기준)
   - 레벨(깊이): 최대 3단계
   - 이 제한을 초과하면 다이어그램을 여러 개로 나누어 작성하세요.
4. **다이어그램 내용:**
   - 다이어그램의 모든 노드(박스)는 아이디어에서 언급된 실제 기능명을 사용해야 합니다.
   - 예시 텍스트("프로젝트 시작", "Phase 1: MVP" 등)를 그대로 사용하지 마세요.
   - 아이디어의 실제 기능명을 사용하세요.

**예시 (올바른 형식):**
\`\`\`mermaid
graph TB
    A[사용자 인증] --> B[대시보드]
    B --> C[데이터 분석]
\`\`\`

**예시 (잘못된 형식 - 사용 금지):**
\`\`\`
graph TB
    A[프로젝트 시작] --> B[Phase 1]
\`\`\`

### 6. 성공 지표

#### KPI 정의
아이디어에서 제시된 문제 해결 효과를 측정할 수 있는 구체적인 KPI를 작성하세요. 최소 3개 이상의 KPI를 목표값과 함께 제시하세요.

#### 측정 방법
각 KPI를 측정하는 구체적인 방법을 제시하세요.

---

**⚠️ CRITICAL: 문서 완성도 확인**
- ✅ 모든 플레이스홀더([...])를 실제 내용으로 대체했는지 확인
- ✅ 아이디어 제목과 내용을 분석하여 구체적인 내용을 작성했는지 확인
- ✅ 예시 템플릿이 아닌 실제 프로젝트 기획서를 작성했는지 확인
- ✅ 각 섹션을 매우 상세하고 구체적으로 작성했는지 확인
- ✅ 실제 개발자가 바로 착수할 수 있을 정도로 구체적인 내용을 포함했는지 확인
- ✅ Mermaid 다이어그램에 실제 기능명을 사용했는지 확인 (예시 텍스트 사용 금지)
- ✅ 마크다운 형식을 정확히 지켰는지 확인
- ✅ 모든 아이디어에 대해 동일한 구조와 형식을 사용했는지 확인
- ✅ 각 섹션이 박스 단위로 명확히 구분되어 있는지 확인
- ✅ **문서를 완전히 마무리했는지 확인 (불완전한 문장으로 끝나면 안 됨)**
- ✅ **Mermaid 다이어그램이 \`\`\`mermaid 형식으로 작성되었는지 확인 (일반 코드 블록 사용 금지)**
- ✅ **이전 부분에 이미 작성된 섹션이나 다이어그램과 중복되지 않았는지 확인**
- ✅ **제안서 내용을 그대로 출력하지 않았는지 확인 (제안서는 참고만 함)**
- ✅ **문서 마지막 문장이 완전한 문장인지 확인 (예: "* 사용", "* 측정" 같은 불완전한 문장 금지)**`;
  }

  /**
   * 제안서 기반 PRD 프롬프트 생성
   * @param partNumber 부분 번호 (1, 2, 3 등) - 여러 번에 나누어서 생성할 때 사용
   * @param previousParts 이전에 생성된 부분들
   */
  private buildPRDFromProposalPrompt(idea: Idea, proposalContent: string, partNumber?: number, previousParts?: string[]): string {
    const isMultiPart = partNumber !== undefined && partNumber > 1;
    const totalParts = 10;
    
    // 이전 부분의 섹션 목록 추출 (중복 체크용)
    const extractSections = (content: string): string[] => {
      const sectionRegex = /^###?\s+(.+)$/gm;
      const sections: string[] = [];
      let match;
      while ((match = sectionRegex.exec(content)) !== null) {
        sections.push(match[1].trim());
      }
      return sections;
    };
    
    const previousContent = previousParts && previousParts.length > 0 
      ? `\n\n**⚠️ CRITICAL: 이전 부분 작성된 섹션 목록 (중복 방지 필수):**\n${previousParts.map((p, i) => {
          const sections = extractSections(p);
          const mermaidDiagrams = (p.match(/```mermaid[\s\S]*?```/g) || []).length;
          return `\n### Part ${i + 1} 작성된 내용\n**작성된 섹션:**\n${sections.length > 0 ? sections.map(s => `- ✅ ${s}`).join('\n') : '- (섹션 없음)'}\n**작성된 Mermaid 다이어그램:** ${mermaidDiagrams}개\n${p.substring(0, 2000)}${p.length > 2000 ? '\n\n...(이전 부분이 길어 일부만 표시했습니다.)' : ''}`;
        }).join('\n\n---\n\n')}\n\n**⚠️ 중요 지시사항:**\n- 위 이전 부분에 **이미 작성된 섹션은 절대 다시 작성하지 마세요.**\n- 위 이전 부분에 **이미 작성된 다이어그램과 동일한 내용의 다이어그램을 작성하지 마세요.**\n- 이전 부분과 자연스럽게 연결되도록 작성하되, 내용은 완전히 새로운 것이어야 합니다.\n- **중복된 섹션이나 다이어그램이 발견되면 해당 부분을 건너뛰고 다음 섹션으로 진행하세요.**\n`
      : '';
    
    const partInfo = isMultiPart ? `\n\n**⚠️ 중요: 이것은 PRD의 ${partNumber}번째 부분입니다 (전체 ${totalParts}개 부분).**${previousContent}` : '';
    
    // 각 부분별로 작성할 섹션 정의 (10개 부분)
    const sectionGuide = partNumber === 1 
      ? `- **Part 1 작성 내용**: 프로젝트 개요 섹션만 상세히 작성하세요.`
      : partNumber === 2
      ? `- **Part 2 작성 내용**: 사용자 스토리 섹션만 상세히 작성하세요.\n- 프로젝트 개요 섹션은 작성하지 마세요 (Part 1에 이미 있음).`
      : partNumber === 3
      ? `- **Part 3 작성 내용**: 기능 명세 섹션만 상세히 작성하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 4
      ? `- **Part 4 작성 내용**: 화면 설계 섹션만 상세히 작성하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 5
      ? `- **Part 5 작성 내용**: 기술 요구사항 섹션만 상세히 작성하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 6
      ? `- **Part 6 작성 내용**: 시스템 아키텍처 섹션만 상세히 작성하세요.\n- **⚠️ CRITICAL: 시스템 아키텍처 다이어그램을 반드시 포함하세요. 다이어그램이 비어있으면 안 됩니다.**\n- **⚠️ CRITICAL: 다이어그램은 반드시 \`\`\`mermaid 형식을 사용하세요. 일반 코드 블록(\`\`\`)을 사용하지 마세요.**\n- 아이디어와 PRD를 분석하여 실제 시스템 아키텍처를 간결한 Mermaid 다이어그램으로 작성하세요.\n- 다이어그램 노드 텍스트는 최대 10자 이하로 작성하세요 (잘림 방지).\n- 다이어그램 노드는 최대 8개 이하로 작성하세요 (화면 크기 초과 방지).\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.\n- **⚠️ CRITICAL: 이전 부분에 이미 작성된 다이어그램과 동일한 내용의 다이어그램을 작성하지 마세요.**`
      : partNumber === 7
      ? `- **Part 7 작성 내용**: 데이터베이스 설계 섹션만 상세히 작성하세요.\n- **⚠️ CRITICAL: ERD 다이어그램과 주요 테이블 구조를 반드시 포함하세요. 빈 섹션이면 안 됩니다.**\n- **⚠️ CRITICAL: 다이어그램은 반드시 \`\`\`mermaid 형식을 사용하세요. 일반 코드 블록(\`\`\`)을 사용하지 마세요.**\n- 아이디어와 PRD를 분석하여 실제 데이터베이스 구조를 작성하세요.\n- ERD 다이어그램 노드 텍스트는 최대 10자 이하로 작성하세요 (잘림 방지).\n- 다이어그램 노드는 최대 8개 이하로 작성하세요 (화면 크기 초과 방지).\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.\n- **⚠️ CRITICAL: 이전 부분에 이미 작성된 다이어그램과 동일한 내용의 다이어그램을 작성하지 마세요.**`
      : partNumber === 8
      ? `- **Part 8 작성 내용**: 프로젝트 구조 섹션만 상세히 작성하세요.\n- **⚠️ CRITICAL: 프로젝트 구조 다이어그램을 반드시 포함하세요. 다이어그램이 비어있으면 안 됩니다.**\n- **⚠️ CRITICAL: 다이어그램은 반드시 \`\`\`mermaid 형식을 사용하세요. 일반 코드 블록(\`\`\`)을 사용하지 마세요.**\n- 다이어그램 노드 텍스트는 최대 10자 이하로 작성하세요 (잘림 방지).\n- 다이어그램 노드는 최대 8개 이하로 작성하세요 (화면 크기 초과 방지).\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.\n- **⚠️ CRITICAL: 이전 부분에 이미 작성된 다이어그램과 동일한 내용의 다이어그램을 작성하지 마세요.**`
      : partNumber === 9
      ? `- **Part 9 작성 내용**: 성공 지표 섹션만 상세히 작성하세요.\n- KPI 정의와 측정 방법을 모두 포함하세요.\n- 이전 부분에 이미 작성된 섹션은 작성하지 마세요.`
      : partNumber === 10
      ? `- **Part 10 작성 내용**: 문서 마무리 섹션을 작성하세요.\n- **⚠️ CRITICAL: 문서를 완전히 마무리하세요. 중간에 끊기지 않도록 마지막까지 작성하세요.**\n- **⚠️ CRITICAL: 문서 마지막은 반드시 완전한 문장으로 끝나야 합니다.**\n- 문서 마지막에 다음 중 하나로 자연스럽게 마무리하세요:\n  1. "## 완료 조건" 섹션 추가\n  2. "## 다음 단계" 섹션 추가\n  3. "## 참고 자료" 섹션 추가\n- **절대 불완전한 문장(예: "* 사용", "* 측정" 등)으로 끝나면 안 됩니다.**\n- 마지막 문장 예시: "이 PRD 문서는 위 내용을 기반으로 개발을 진행할 수 있도록 작성되었습니다."\n- 마지막 문장 예시: "위 KPI를 기준으로 프로젝트의 성공 여부를 측정할 수 있습니다."`
      : '';
    
    return `다음 원본 아이디어와 개선된 제안서를 기반으로 상세하고 구체적인 PRD(Product Requirements Document) 문서를 한국어로 작성해주세요.

**⚠️ CRITICAL: 제안서 내용을 그대로 출력하지 마세요. 제안서는 참고 자료일 뿐이며, PRD 문서에 포함되면 안 됩니다.**

${partInfo}
${sectionGuide ? `\n**⚠️ 부분 작성 가이드 (Part ${partNumber}/${totalParts}):**\n${sectionGuide}\n- 이전 부분과 자연스럽게 연결되도록 작성하세요.\n- 중복되는 헤더나 개요 섹션은 작성하지 마세요.\n- 각 부분마다 최소 200-300줄 이상 작성하세요.\n- **⚠️ CRITICAL: 제안서 내용을 그대로 출력하지 마세요. 제안서는 참고만 하고 PRD 형식으로 작성하세요.**\n` : ''}
## 원본 아이디어 정보
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}
- **작성자**: ${idea.author}
- **업보트**: ${idea.upvotes}

## 개선된 제안서 (참고용 - 출력 금지)
**⚠️ 중요**: 아래 제안서는 **참고 자료**입니다. 제안서 내용을 그대로 출력하지 마세요. 제안서의 핵심 내용을 분석하여 PRD 형식으로만 작성하세요.

${proposalContent.substring(0, 8000)}${proposalContent.length > 8000 ? '\n\n(제안서 내용이 길어 일부만 표시했습니다. 전체 내용을 참고하여 작성하세요.)' : ''}

## PRD 작성 요구사항

제안서에서 제시된 개선 사항과 구체화된 내용을 반영하여 PRD를 작성해주세요.

**⚠️ 절대적으로 준수해야 할 규칙:**
1. **제안서의 개선 내용을 반드시 반영**하세요. 원본 아이디어보다 제안서의 내용을 우선시하세요.
2. **제안서에서 제시된 핵심 기능, 타겟 사용자, 차별화 포인트를 기반**으로 PRD를 작성하세요.
3. **제안서의 실행 계획을 참고**하여 개발 단계를 구체화하세요.
4. **모든 섹션을 박스 단위로 작성**하세요.
5. **플레이스홀더([...])를 절대 사용하지 마세요.** 모든 내용은 제안서에서 추출한 실제 내용이어야 합니다.
6. **⚠️ CRITICAL: 제안서 내용을 그대로 출력하지 마세요.** 제안서는 참고 자료일 뿐이며, PRD 문서에 제안서 섹션이나 제안서 내용이 포함되면 안 됩니다.
7. **⚠️ CRITICAL: 문서를 완전히 마무리하세요.** 중간에 끊기지 않도록 마지막까지 작성하세요. 불완전한 문장으로 끝나면 안 됩니다.

${this.buildPRDPrompt(idea, partNumber, previousParts).split('## PRD 작성 요구사항')[1]}`;
  }

  /**
   * 제안서 생성 프롬프트 작성
   * 기존 아이디어를 분석하여 개선된 제안서 작성
   */
  private buildProposalPrompt(idea: Idea): string {
    return `당신은 전문적인 제품 기획자입니다. 다음 Reddit 아이디어를 분석하여 개선된 제안서를 작성해주세요.

## 원본 아이디어 정보
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}
- **작성자**: ${idea.author}
- **업보트**: ${idea.upvotes}

## 제안서 작성 목표

기존 아이디어가 단순하거나 추상적이거나, 기존에 비슷한 프로그램이 있을 수 있습니다. 
이를 분석하고 개선하여 더 구체적이고 실행 가능한 제안서로 발전시켜주세요.

### 1. 아이디어 분석 및 개선
- **문제 정의 명확화**: 원본 아이디어의 핵심 문제를 더 구체적으로 정의
- **타겟 사용자 구체화**: 누가 이 문제를 겪는지, 얼마나 많은 사람들이 영향을 받는지
- **경쟁 분석**: 유사한 솔루션이 있는지, 기존 솔루션의 한계점은 무엇인지
- **차별화 포인트**: 기존 솔루션 대비 이 아이디어의 고유한 가치와 차별점

### 2. 아이디어 구체화
- **핵심 기능 명확화**: MVP에서 반드시 필요한 기능만 선별
- **사용자 시나리오**: 실제 사용자가 어떻게 사용할지 구체적인 시나리오 제시
- **기술적 실현 가능성**: 현재 기술로 구현 가능한지, 필요한 기술 스택은 무엇인지
- **비즈니스 모델**: 수익화 방안 (선택사항)

### 3. 실행 계획
- **개발 단계**: MVP → Phase 2 → Phase 3 순서로 단계적 확장 계획
- **예상 기간**: 각 단계별 예상 개발 기간
- **필요 리소스**: 개발자 수, 예산, 인프라 등

## 제안서 작성 형식

다음 구조를 따라 마크다운 형식으로 작성해주세요:

\`\`\`markdown
# [개선된 프로젝트명] - 제안서

## 1. 개요
- **원본 아이디어**: [원본 제목]
- **개선 목표**: [이 제안서가 해결하려는 문제]
- **핵심 가치**: [이 제안서의 핵심 가치 제안]

## 2. 문제 정의
- **문제 상황**: [구체적인 문제 상황 설명]
- **영향받는 사용자**: [타겟 사용자 그룹과 규모]
- **현재 솔루션의 한계**: [기존 솔루션이 있다면 그 한계점]

## 3. 제안 솔루션
- **핵심 기능**: [MVP에서 반드시 필요한 핵심 기능 3-5개]
- **차별화 포인트**: [기존 솔루션 대비 차별점]
- **기술 스택**: [권장 기술 스택과 이유]

## 4. 사용자 시나리오
- **시나리오 1**: [구체적인 사용자 시나리오]
- **시나리오 2**: [추가 시나리오]

## 5. 실행 계획
- **Phase 1 (MVP)**: [4주 이내, 핵심 기능만]
- **Phase 2**: [추가 기능 확장]
- **Phase 3**: [장기 비전]

## 6. 예상 성과
- **사용자 가치**: [사용자가 얻을 수 있는 가치]
- **비즈니스 가치**: [비즈니스 관점에서의 가치, 선택사항]
\`\`\`

## ⚠️ 중요 지시사항

**절대 금지 사항:**
- ❌ 플레이스홀더나 예시 템플릿을 그대로 사용하지 마세요
- ❌ 일반적인 설명이나 추상적인 내용만 작성하지 마세요
- ❌ 원본 아이디어를 단순히 복사하지 마세요

**필수 사항:**
- ✅ 원본 아이디어를 **반드시 분석**하여 실제 개선 내용을 작성하세요
- ✅ 구체적이고 실행 가능한 제안을 작성하세요
- ✅ 경쟁 분석과 차별화 포인트를 명확히 제시하세요
- ✅ 실제 구현 가능한 기술 스택을 제안하세요
- ✅ 모든 내용은 원본 아이디어에서 발전시킨 구체적인 내용이어야 합니다

제안서를 작성해주세요.`;
  }

  /**
   * 개발 계획서 생성 프롬프트 작성 (Planning Expert v6.1 기준)
   * @param partNumber 부분 번호 (1, 2, 3 등) - 여러 번에 나누어서 생성할 때 사용
   * @param previousParts 이전에 생성된 부분들
   */
  private buildDevelopmentPlanPrompt(idea: Idea, prdContent?: string, partNumber?: number, previousParts?: string[]): string {
    const isMultiPart = partNumber !== undefined && partNumber > 1;
    const totalParts = 12;
    
    // 이전 부분에서 생성된 Task 번호 추출
    let lastTaskNumber = 0;
    let taskNumbers: number[] = [];
    if (previousParts && previousParts.length > 0) {
      previousParts.forEach(part => {
        const taskMatches = part.match(/## 🎯 \[P\d+\] Task (\d+)\.(\d+):/g);
        if (taskMatches) {
          taskMatches.forEach(match => {
            const numbers = match.match(/Task (\d+)\.(\d+):/);
            if (numbers) {
              const major = parseInt(numbers[1]);
              const minor = parseInt(numbers[2]);
              taskNumbers.push(major * 100 + minor);
            }
          });
        }
      });
      if (taskNumbers.length > 0) {
        lastTaskNumber = Math.max(...taskNumbers);
      }
    }
    
    // 다음 Task 번호 계산
    const nextTaskMajor = Math.floor(lastTaskNumber / 100);
    const nextTaskMinor = (lastTaskNumber % 100) + 1;
    const nextTaskNumber = `${nextTaskMajor}.${nextTaskMinor}`;
    
    // 이전 부분의 전체 내용 (중복 체크용)
    const previousContent = previousParts && previousParts.length > 0 
      ? `\n\n**⚠️ CRITICAL: 이전 부분 전체 내용 (중복 방지 필수):**\n${previousParts.map((p, i) => `\n### Part ${i + 1} 전체 내용\n${p.substring(0, 5000)}${p.length > 5000 ? '\n\n...(이전 부분이 길어 일부만 표시했습니다. 전체 내용을 참고하여 중복되지 않도록 작성하세요.)' : ''}`).join('\n\n---\n\n')}\n\n**⚠️ 중요 지시사항:**\n- 위 이전 부분의 내용과 **절대 중복되지 않도록** 작성하세요.\n- 이전 부분에 이미 작성된 Task 번호는 사용하지 마세요. 다음 Task 번호는 **Task ${nextTaskNumber}**부터 시작하세요.\n- 이전 부분에 이미 작성된 섹션(예: Epic 개요, 시스템 아키텍처, 데이터베이스 설계 등)은 다시 작성하지 마세요.\n- 이전 부분에 이미 작성된 다이어그램은 다시 작성하지 마세요.\n- 이전 부분과 자연스럽게 연결되도록 작성하되, 내용은 완전히 새로운 것이어야 합니다.\n`
      : '';
    
    const partInfo = isMultiPart ? `\n\n**⚠️ 중요: 이것은 개발 계획서의 ${partNumber}번째 부분입니다 (전체 ${totalParts}개 부분).**${previousContent}` : '';
    return `당신은 Planning Expert v6.1입니다. 다음 아이디어와 PRD를 기반으로 **실제 개발자가 바로 착수할 수 있는 수준의 상세한 EPIC 문서**를 한국어로 작성해주세요.

**⚠️ CRITICAL: 이 문서는 실제 개발에 사용될 것입니다. 플레이스홀더나 추상적인 설명이 아닌, 구체적이고 실행 가능한 내용만 작성하세요.**

**⚠️ 절대 금지 사항 (반드시 준수):**
- ❌ Planning Expert v6.1 가이드라인 템플릿을 그대로 출력하지 마세요.
- ❌ "원본 아이디어:", "개선 목표:", "핵심 가치:" 같은 템플릿 형식을 그대로 사용하지 마세요.
- ❌ 아이디어와 PRD를 분석하지 않고 일반적인 내용만 작성하지 마세요.
- ❌ "[실제 프로젝트 경로]", "[실제 모듈명]", "[실제 Expert 이름]" 같은 플레이스홀더를 절대 사용하지 마세요.
- ❌ "[아이디어와 PRD에서 추출한...]" 같은 설명 텍스트를 그대로 남기지 마세요.
- ❌ 예시 코드나 템플릿 구조를 그대로 복사하지 마세요.
- ❌ 모든 내용은 반드시 아래 제공된 아이디어와 PRD를 분석하여 실제 내용만 작성하세요.

**⚠️ 필수 사항 (반드시 준수):**
- ✅ 아이디어 제목과 내용을 반드시 분석하여 실제 프로젝트명, 기능명, 기술 스택을 추출하세요.
- ✅ PRD 문서의 모든 섹션을 분석하여 실제 기능, 화면, 데이터베이스 구조를 파악하세요.
- ✅ 모든 플레이스홀더([...])를 실제 내용으로 대체하세요.
- ✅ 모든 Task와 SubTask는 아이디어와 PRD에서 추출한 실제 기능명을 사용하세요.
- ✅ 모든 코드 예시는 아이디어와 PRD에 맞는 실제 구현 코드를 작성하세요.
- ✅ 전문가 이름은 실제 이름을 사용하되, 사용자가 해당 전문가 Agent를 생성해야 한다는 안내를 포함하세요.

${partInfo}
## 아이디어 정보 (반드시 이 내용을 분석하여 작성하세요)
- **제목**: ${idea.title}
- **내용**: ${idea.content}
- **서브레딧**: r/${idea.subreddit}

${prdContent ? `## PRD 내용 (반드시 이 내용을 분석하여 작성하세요)\n${prdContent.substring(0, 10000)}${prdContent.length > 10000 ? '\n\n(PRD 내용이 길어 일부만 표시했습니다. 전체 내용을 참고하여 작성하세요.)' : ''}\n\n` : ''}## Planning Expert v6.1 작성 가이드라인

당신은 Planning Expert로서 다음 원칙을 **엄격히** 준수해야 합니다:

### 핵심 원칙 (절대 준수)
1. **TCREI 방법론**: 모든 Task는 Task, Context, Role, Expected Output, Iteration 5단계로 **구체적으로** 정의 (T, C, R만 작성하고 E, I를 생략하면 안 됩니다)
2. **8 Expert System**: DevOps, Database, API, UI, Security, QA, Analytics, AI 전문가 핸드오프 체계 - **실제 전문가 이름과 역할을 명시**
3. **우선순위 분류**: 모든 Task에 [P0/P1/P2/P3] 표시 필수
4. **Mock-Free 원칙**: MVP 10% 이하, Full Product 1% 이하 Mock 허용
5. **분량 제한**: Full 모드 1,000-1,500줄 (상세한 내용 포함)
6. **실제 코드 포함**: 각 SubTask마다 핵심 코드 예시 20-50줄 포함 (실제 구현 가능한 수준)
7. **구체적 수치**: 모든 목표, 완료 조건, 성능 기준에 정량적 수치 포함
8. **마크다운 스타일 일관성**: 제목 크기와 진하기를 일관되게 유지하세요
   - 1단계 제목: 해시 기호 하나 (문서 제목만)
   - 2단계 제목: 해시 기호 두 개 (주요 섹션)
   - 3단계 제목: 해시 기호 세 개 (하위 섹션)
   - 4단계 제목: 해시 기호 네 개 (세부 항목)
   - 강조: 볼드 마크다운 (볼드)는 섹션 제목과 중요 내용에만 사용
   - 일반 텍스트는 볼드 없이 작성
9. **Task 번호 연속성**: 여러 부분으로 나눠서 작성할 때, 이전 부분의 Task 번호를 확인하고 연속된 번호를 사용하세요 (예: Part 1에서 Task 1.1, 1.2를 작성했다면, Part 2에서는 Task 1.3부터 시작)
10. **문서 완성도**: 문서가 중간에 끊기지 않도록 마지막까지 완전히 작성하세요. 마지막 부분에서는 "다음 단계", "완료 조건" 등으로 문서를 자연스럽게 마무리하세요.

### 모드 선택
이 프로젝트는 **Full 모드**로 작성하세요 (확장 가능한 설계, 운영 환경 고려, 완전한 제품).

## EPIC 문서 작성 요구사항

**⚠️ 절대적으로 준수해야 할 규칙:**
1. **반드시 아래 구조를 정확히 따라 작성하세요.** 섹션 순서, 제목, 형식을 절대 변경하지 마세요.
2. **모든 섹션을 박스 단위로 작성하세요.** 각 섹션은 명확한 제목과 내용으로 구분되어야 합니다.
3. **플레이스홀더([...], "구체적으로 명시", "실제 사용할 기술" 등)를 절대 사용하지 마세요.** 모든 내용은 아이디어와 PRD에서 추출한 실제 내용이어야 합니다.
4. **아이디어마다 형식이 달라지면 안 됩니다.** 모든 아이디어에 대해 동일한 구조와 형식을 사용하세요.
5. **각 Task는 최소 3-5개 SubTask로 세분화하세요.** 각 SubTask는 2-4시간 단위로 작성하세요.
6. **각 SubTask마다 실제 코드 예시를 포함하세요.** 파일명, 클래스명, 함수명을 구체적으로 명시하세요.
7. **전문가 이름은 실제 Expert 이름을 사용하세요.** "Expert 이름", "주도 Expert" 같은 플레이스홀더 금지.

다음 구조를 **정확히** 따라 마크다운 형식으로 작성해주세요. **Full 모드 (1,000-1,500줄)**로 상세하게 작성하세요.

${isMultiPart ? `\n**⚠️ 부분 작성 가이드 (Part ${partNumber}/${totalParts}):**\n${partNumber === 1 ? '- **Part 1 작성 내용**: Epic 개요, Task 1.1, Task 1.2를 상세히 작성하세요.\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함\n- 전문가 핸드오프 체계를 텍스트 형식으로 작성 (Mermaid 금지)\n- **Task 번호는 1.1, 1.2부터 시작하세요**' : partNumber === 2 ? `- **Part 2 작성 내용**: Task ${nextTaskNumber}, Task ${nextTaskNumber.split('.')[0]}.${parseInt(nextTaskNumber.split('.')[1]) + 1}를 상세히 작성하세요.\n- Epic 개요 섹션은 작성하지 마세요 (Part 1에 이미 있음).\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 3 ? `- **Part 3 작성 내용**: Task ${nextTaskNumber}, 시스템 아키텍처를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함\n- 시스템 아키텍처 다이어그램은 이전 부분에 없을 때만 작성하세요` : partNumber === 4 ? `- **Part 4 작성 내용**: 데이터베이스 설계, Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 데이터베이스 스키마는 실제 SQL 코드 포함 (100줄 이상)\n- 각 테이블의 CREATE TABLE 문 포함\n- 데이터베이스 설계 섹션은 이전 부분에 없을 때만 작성하세요` : partNumber === 5 ? `- **Part 5 작성 내용**: Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 6 ? `- **Part 6 작성 내용**: Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 7 ? `- **Part 7 작성 내용**: 개발 일정 (WBS 텍스트 형식), 리스크 관리를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- WBS는 텍스트 형식으로만 작성 (Mermaid Gantt 차트 금지)\n- 각 리스크마다 구체적인 검증 방법과 Plan B 포함\n- 개발 일정 섹션은 이전 부분에 없을 때만 작성하세요` : partNumber === 8 ? `- **Part 8 작성 내용**: Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 9 ? `- **Part 9 작성 내용**: Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 10 ? `- **Part 10 작성 내용**: Task ${nextTaskNumber}를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 Task마다 최소 3-5개 SubTask 포함\n- 각 SubTask마다 실제 코드 예시 20-50줄 포함` : partNumber === 11 ? `- **Part 11 작성 내용**: 개발 일정 (WBS 텍스트 형식), 리스크 관리를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- WBS는 텍스트 형식으로만 작성 (Mermaid Gantt 차트 금지)\n- 각 리스크마다 구체적인 검증 방법과 Plan B 포함\n- 개발 일정 섹션은 이전 부분에 없을 때만 작성하세요` : partNumber === 12 ? `- **Part 12 작성 내용**: 완료 조건, 성능 메트릭, 다음 단계를 상세히 작성하세요.\n- **Task 번호는 ${nextTaskNumber}부터 시작하세요** (이전 부분의 Task 번호를 확인하고 연속된 번호 사용)\n- 각 전문가별 구체적인 완료 조건과 수치 포함\n- 성능 메트릭은 정량적 수치로 명시\n- **⚠️ CRITICAL: 문서를 완전히 마무리하세요. 중간에 끊기지 않도록 마지막까지 작성하세요.**\n- 문서 마지막에 "## 다음 단계" 또는 "## 완료 조건" 섹션으로 자연스럽게 마무리하세요.` : ''}\n- 이전 부분과 자연스럽게 연결되도록 작성하세요.\n- 중복되는 헤더나 개요 섹션은 작성하지 마세요.\n- 각 부분마다 최소 200-300줄 이상 작성하세요.\n- **⚠️ TCREI 정의는 반드시 5단계 모두 완전히 작성하세요 (T, C, R, E, I).**\n- **⚠️ CRITICAL: Task 번호는 반드시 연속적으로 작성하세요. 이전 부분의 마지막 Task 번호 다음 번호부터 시작하세요.**\n- **⚠️ CRITICAL: 반드시 아이디어와 PRD를 분석하여 실제 개발 내용만 작성하세요. 템플릿이나 가이드라인을 그대로 출력하지 마세요.**\n` : ''}
### EPIC 문서 구조

\`\`\`markdown
# Epic 1: [프로젝트명] v1.0

> **"Planning Expert → [주도 Expert] → [협력 Experts] 자동 핸드오프 체계"**

**기간**: Day 1-[N] ([N]일)
**목표**: 한 문장으로 명확한 목표를 실제 수치와 함께 제시
**전문가**: Planning Expert → [주도 Expert] + [협력1] + [협력2] + [협력3] + QA Expert
**복잡도**: [Small/Medium/Large] 프로젝트 ([N]개 Task, [M]개 SubTask)

---

## 📋 Epic 1 개요

### **핵심 목표 (TCREI 방법론)**
\`\`\`yaml
T - Task: 구체적인 작업 정의를 측정 가능한 결과와 함께 제시
C - Context: 프로젝트 배경, 실제 수치, 제약사항, 목표 수치를 구체적으로 제시
R - Role: 주도 Expert의 핵심 역할과 협력 Expert들의 역할을 구체적으로 명시
E - Expected Output: Mock-free 99% 구체적 결과물, 성능 목표, 품질 기준을 수치와 함께 제시
I - Iteration: 실시간 모니터링 → 자동 에러 수정 → 성능 최적화 과정을 구체적으로 설명
\`\`\`

### **완료 조건 (Quality Gates)**
\`\`\`yaml
✅ Expert 1: 구체적 완료 조건을 수치와 함께 제시
✅ Expert 2: 구체적 완료 조건을 수치와 함께 제시
✅ QA Expert: Mock-free 99% 검증, API 에러율 < 1%, 가동률 > 99%
\`\`\`

### **전문가 핸드오프 체계**
아이디어와 PRD를 분석하여 실제 필요한 전문가들을 명시하고, **텍스트 형식으로만** 작성하세요 (Mermaid 다이어그램 사용 금지):

**핸드오프 순서:**
1. **Planning Expert** (요구사항 분석)
   - 역할: 아이디어와 PRD 분석, 전체 계획 수립
   - 전달 사항: [아이디어와 PRD에서 추출한 구체적인 요구사항]
   - 다음 단계: [주도 Expert]에게 핸드오프

2. **[주도 Expert 이름]** (핵심 시스템)
   - 역할: [아이디어와 PRD에서 추출한 핵심 역할]
   - 전달 사항: [구체적인 전달 내용]
   - 다음 단계: [협력 Expert1]에게 핸드오프

3. **[협력 Expert1 이름]** (데이터 계층)
   - 역할: [아이디어와 PRD에서 추출한 역할]
   - 전달 사항: [구체적인 전달 내용]
   - 다음 단계: [협력 Expert2]에게 핸드오프

4. **[협력 Expert2 이름]** (UI 계층)
   - 역할: [아이디어와 PRD에서 추출한 역할]
   - 전달 사항: [구체적인 전달 내용]
   - 다음 단계: QA Expert에게 핸드오프

5. **QA Expert** (Mock-free 검증)
   - 역할: 실제 구현 검증, Mock 데이터 최소화
   - 전달 사항: 테스트 결과 및 검증 완료 보고
   - 다음 단계: Analytics Expert에게 핸드오프

6. **Analytics Expert** (성능 모니터링)
   - 역할: 성능 지표 추적, 시스템 안정성 모니터링
   - 전달 사항: 모니터링 대시보드 및 성능 리포트

**⚠️ 중요**: 
- 모든 전문가 이름과 역할은 아이디어와 PRD에서 실제로 필요한 것을 반영해야 합니다.
- "주도 Expert", "협력 Expert1" 같은 플레이스홀더를 절대 사용하지 마세요.
- 각 전문가의 역할과 전달 사항을 구체적으로 명시하세요.
- **⚠️ 전문가 Agent 안내**: 이 개발 계획서에 명시된 전문가(예: API Expert, Database Expert 등)는 실제로 존재하는 Agent가 아닐 수 있습니다. 사용자는 각 전문가 Agent를 생성하고 해당 Agent에게 업무를 지시해야 합니다. 각 Task의 담당 전문가 섹션에 "이 전문가 Agent를 생성하고 업무를 지시하세요"라는 안내를 포함하세요.

---

## 🎯 [P0] Task 1.1: [아이디어와 PRD에서 추출한 실제 핵심 기능명] (Day 1-2)

### **담당**: [실제 Expert 이름, 예: API Expert (Marcus)] (주도) + [실제 Expert 이름, 예: Database Expert (Sarah)] (협력)
### **목표**: [아이디어와 PRD에서 추출한 구체적인 목표를 측정 가능한 수치와 함께 제시, 예: "14일 안에 10명의 Opinions을 수집하여 최초의 이메일 뉴스레터를 공개"]

#### **TCREI 정의**
**⚠️ CRITICAL: TCREI 정의는 반드시 5단계 모두 완전히 작성해야 합니다. T, C, R만 작성하고 E, I를 생략하면 안 됩니다.**

\`\`\`yaml
T - Task: [아이디어와 PRD에서 추출한 구체적인 작업 정의 - 측정 가능한 결과]
C - Context: [프로젝트 배경, 실제 수치, 제약사항, 목표 수치를 구체적으로 제시]
R - Role: [실제 Expert 이름] (핵심 역할) + [실제 Expert 이름] (협력 역할)
E - Expected Output: Mock-free 99% [구체적 결과물], [성능 목표 예: "API 응답시간 < 2초"], [품질 기준 예: "테스트 커버리지 > 80%"]
I - Iteration: [실시간 모니터링 방법] → [자동 에러 수정 방법] → [성능 최적화 방법]
\`\`\`

**⚠️ 검증: 위 TCREI 정의에 T, C, R, E, I 5단계가 모두 포함되어 있는지 확인하세요.**

#### **SubTask 1.1.1: [아이디어와 PRD에서 추출한 실제 작업명] (2시간)**

**⚠️ CRITICAL: 이 SubTask는 반드시 아이디어와 PRD를 분석하여 실제 작업명, 프로젝트 구조, 코드를 작성해야 합니다. 플레이스홀더나 예시 텍스트를 절대 사용하지 마세요.**

**담당 전문가**: [실제 Expert 이름, 예: API Expert (Marcus)]
**⚠️ 전문가 Agent 안내**: 이 전문가 Agent를 생성하고 업무를 지시하세요. 사용자는 이 웹사이트에서 해당 전문가 Agent를 생성해야 합니다.

**프로젝트 구조:**
아이디어와 PRD를 분석하여 실제 프로젝트 구조를 작성하세요. 예시 구조를 그대로 사용하지 마세요. 실제 프로젝트명, 모듈명, 디렉토리 구조를 구체적으로 명시하세요.

**구현 코드:**
아이디어와 PRD를 분석하여 실제 구현 코드를 작성하세요. 파일명, 클래스명, 함수명을 구체적으로 명시하세요. 예시 코드를 그대로 사용하지 마세요. 실제 아이디어의 기능을 구현하는 코드를 작성하세요.

#### **SubTask 1.1.2: 기술 스택 선정 (1시간)**

**⚠️ CRITICAL: 아이디어와 PRD를 분석하여 실제 기술 스택을 작성하세요. 플레이스홀더를 절대 사용하지 마세요.**

아이디어와 PRD를 분석하여 다음을 구체적으로 작성하세요:
- Backend: 실제 사용할 백엔드 기술 (예: "Supabase + Vercel Functions")
- Database: 실제 사용할 데이터베이스 (예: "Supabase PostgreSQL")
- Cache: 실제 사용할 캐시 시스템 (필요한 경우)
- Security: 실제 사용할 보안 기술 (예: "Supabase Auth")
- Testing: 실제 사용할 테스트 도구 (예: "Vitest + React Testing Library")

---

## 🎯 [P1] Task 1.2: [아이디어와 PRD에서 추출한 실제 중요 기능명] (Day 3-4)

### **담당**: [실제 Expert 이름] (주도) + [실제 Expert 이름] (협력)
### **목표**: [아이디어와 PRD에서 추출한 구체적인 목표를 측정 가능한 수치와 함께 제시]

#### **TCREI 정의**
\`\`\`yaml
T - Task: [아이디어와 PRD에서 추출한 구체적인 작업 정의]
C - Context: [프로젝트 배경, 실제 수치, 제약사항]
R - Role: [실제 Expert 이름] (주도) + [실제 Expert 이름] (협력)
E - Expected Output: [구체적 결과물과 성능 목표]
I - Iteration: [개선 프로세스]
\`\`\`

#### **SubTask 1.2.1: [아이디어와 PRD에서 추출한 실제 작업명] (2시간)**
**⚠️ CRITICAL: 아이디어와 PRD를 분석하여 실제 작업명, 프로젝트 구조, 코드를 작성하세요. 플레이스홀더를 절대 사용하지 마세요.**
- 담당 전문가: [실제 Expert 이름]
- ⚠️ 전문가 Agent 안내: 이 전문가 Agent를 생성하고 업무를 지시하세요.
- 프로젝트 구조: 아이디어와 PRD를 분석하여 실제 프로젝트 구조를 작성하세요.
- 구현 코드: 아이디어와 PRD를 분석하여 실제 구현 코드를 작성하세요 (20-50줄).

#### **SubTask 1.2.2: [아이디어와 PRD에서 추출한 실제 작업명] (3시간)**
**⚠️ CRITICAL: 아이디어와 PRD를 분석하여 실제 작업명, 프로젝트 구조, 코드를 작성하세요. 플레이스홀더를 절대 사용하지 마세요.**
- 담당 전문가: [실제 Expert 이름]
- ⚠️ 전문가 Agent 안내: 이 전문가 Agent를 생성하고 업무를 지시하세요.
- 프로젝트 구조: 아이디어와 PRD를 분석하여 실제 프로젝트 구조를 작성하세요.
- 구현 코드: 아이디어와 PRD를 분석하여 실제 구현 코드를 작성하세요 (20-50줄).

#### **SubTask 1.2.3: [아이디어와 PRD에서 추출한 실제 작업명] (2시간)**
**⚠️ CRITICAL: 아이디어와 PRD를 분석하여 실제 작업명, 프로젝트 구조, 코드를 작성하세요. 플레이스홀더를 절대 사용하지 마세요.**
- 담당 전문가: [실제 Expert 이름]
- ⚠️ 전문가 Agent 안내: 이 전문가 Agent를 생성하고 업무를 지시하세요.
- 프로젝트 구조: 아이디어와 PRD를 분석하여 실제 프로젝트 구조를 작성하세요.
- 구현 코드: 아이디어와 PRD를 분석하여 실제 구현 코드를 작성하세요 (20-50줄).

---

## 🎯 [P2] Task 1.3: [아이디어와 PRD에서 추출한 실제 개선 기능명] (Day 5-6)

### **담당**: [실제 Expert 이름] (주도) + [실제 Expert 이름] (협력)
### **목표**: [아이디어와 PRD에서 추출한 구체적인 목표]

**참고**: 이 Task는 Phase 2로 미룰 수 있으나, MVP에서 포함할 경우의 계획을 작성하세요.

#### **SubTask 1.3.1: [아이디어와 PRD에서 추출한 실제 작업명] (2시간)**
**⚠️ CRITICAL: 아이디어와 PRD를 분석하여 실제 작업명, 프로젝트 구조, 코드를 작성하세요. 플레이스홀더를 절대 사용하지 마세요.**
- 담당 전문가: [실제 Expert 이름]
- ⚠️ 전문가 Agent 안내: 이 전문가 Agent를 생성하고 업무를 지시하세요.
- 프로젝트 구조: 아이디어와 PRD를 분석하여 실제 프로젝트 구조를 작성하세요.
- 구현 코드: 아이디어와 PRD를 분석하여 실제 구현 코드를 작성하세요 (20-50줄).

---

## 📊 시스템 아키텍처

### **시스템 구조 다이어그램**
아이디어와 PRD를 분석하여 실제 시스템 아키텍처를 간결한 Mermaid 다이어그램으로 작성하세요:

\`\`\`mermaid
graph TB
    A[클라이언트] --> B[API Gateway]
    B --> C[인증 서비스]
    B --> D[비즈니스 로직]
    D --> E[데이터베이스]
    D --> F[캐시 레이어]
\`\`\`

**⚠️ 중요**: 위 예시 다이어그램을 그대로 사용하지 마세요. 아이디어와 PRD를 분석하여 실제 시스템 아키텍처를 반영한 다이어그램을 작성하세요.

**⚠️ CRITICAL: 다이어그램 작성 규칙 (절대 준수):**
- **노드 텍스트 길이 제한**: 각 노드의 텍스트는 **최대 15자 이하**로 작성하세요. 긴 텍스트는 잘립니다.
- **노드 텍스트 예시**: "클라이언트", "API", "DB" (좋음) / "프리랜서로 전향하기 위한 자격증 및 교육 제공" (나쁨 - 너무 김)
- **⚠️ Mermaid 문법 준수**: 반드시 유효한 Mermaid 문법을 사용하세요. 문법 오류가 있으면 렌더링이 실패합니다.
- **⚠️ 다이어그램 완성도**: 다이어그램이 중간에 끊기지 않도록 완전히 작성하세요. 불완전한 다이어그램은 렌더링 오류를 발생시킵니다.
- 다이어그램은 간결하게 작성하여 화면에 잘 맞도록 하세요.
- 모든 노드(박스)는 아이디어와 PRD에서 실제로 필요한 시스템 컴포넌트를 반영해야 합니다.
- 다이어그램이 너무 크거나 복잡하지 않도록 주의하세요. 최대 8-10개 노드 이하로 작성하세요.
- **⚠️ 실제 내용만 사용**: 예시 다이어그램을 그대로 복사하지 마세요. 아이디어와 PRD를 분석하여 실제 시스템 구조를 반영하세요.

### **기술 스택 상세**
**프론트엔드**
- 프레임워크: React 18+
- 빌드 도구: Vite
- 언어: TypeScript
- UI 라이브러리: Shadcn/UI, Tailwind CSS

**백엔드**
- 서버리스: Vercel Functions
- 데이터베이스: Supabase (PostgreSQL)
- 인증: Supabase Auth
- 실시간: Supabase Realtime

---

## 🗄️ 데이터베이스 설계

**⚠️ CRITICAL: 데이터베이스 설계 섹션은 반드시 완전히 작성해야 합니다. 비어있으면 안 됩니다.**

### **ERD (Entity Relationship Diagram)**
아이디어와 PRD를 분석하여 실제 필요한 엔티티와 관계를 간결한 Mermaid ERD로 작성하세요:

\`\`\`mermaid
erDiagram
    [아이디어와 PRD에서 추출한 실제 엔티티 1] ||--o{ [실제 엔티티 2] : [실제 관계명]
    [실제 엔티티 2] ||--o{ [실제 엔티티 3] : [실제 관계명]
\`\`\`

**⚠️ 중요**: 위 예시 ERD를 그대로 사용하지 마세요. 아이디어와 PRD를 분석하여 실제 데이터베이스 구조를 반영한 ERD를 작성하세요. 엔티티 이름은 최대 10자 이하로 작성하세요.

**⚠️ CRITICAL: ERD 작성 규칙 (절대 준수):**
- **엔티티 이름 길이 제한**: 각 엔티티 이름은 **최대 10자 이하**로 작성하세요. 긴 이름은 잘립니다.
- **엔티티 이름 예시**: "USERS", "IDEAS", "PRDS" (좋음) / "프리랜서자격증교육" (나쁨 - 너무 김)
- **⚠️ ERD 다이어그램을 반드시 포함하세요. 비어있으면 안 됩니다.**
- **⚠️ Mermaid ERD 문법 준수**: 반드시 유효한 Mermaid ERD 문법을 사용하세요. 문법 오류가 있으면 렌더링이 실패합니다.
- **⚠️ 다이어그램 완성도**: 다이어그램이 중간에 끊기지 않도록 완전히 작성하세요. 불완전한 다이어그램은 렌더링 오류를 발생시킵니다.
- 아이디어와 PRD를 분석하여 실제로 필요한 엔티티만 포함하세요. 예시 엔티티를 그대로 사용하지 마세요.
- ERD는 간결하게 작성하여 화면에 잘 맞도록 하세요. 핵심 엔티티만 포함하세요.
- 모든 엔티티와 관계는 아이디어와 PRD에서 실제로 필요한 것만 반영해야 합니다.
- 다이어그램이 너무 크거나 복잡하지 않도록 주의하세요. 최대 5-7개 엔티티 이하로 작성하세요.
- **⚠️ 실제 내용만 사용**: 예시 ERD를 그대로 복사하지 마세요. 아이디어와 PRD를 분석하여 실제 데이터베이스 구조를 반영하세요.

### **주요 테이블 구조**
핵심 테이블만 2-3개를 선택하여 구체적인 구조를 제시하세요. 아이디어와 PRD를 분석하여 실제로 필요한 테이블만 작성하세요. 상세 스키마는 database/schema.sql 참조로 명시하세요.

**⚠️ CRITICAL: 주요 테이블 구조를 반드시 포함하세요. 비어있으면 안 됩니다.**

---

## 📅 개발 일정 (WBS - Work Breakdown Structure)

**⚠️ CRITICAL: 개발 일정 작성 규칙 (절대 준수):**
1. **아이디어와 PRD를 반드시 분석**하여 실제 프로젝트에 맞는 개발 일정을 작성하세요.
2. **위에 작성된 Task들을 기반으로** 일정을 작성하세요. Task 목록에 없는 내용을 임의로 추가하지 마세요.
3. **플레이스홀더([...], "[아이디어와 PRD에서 추출한...]")를 절대 사용하지 마세요.** 모든 내용은 실제 Task 이름, 전문가 이름, 구체적인 시간과 완료 조건이어야 합니다.
4. **추상적이거나 일반적인 내용을 작성하지 마세요.** 예를 들어, "Task 1", "Task 2" 같은 이름 대신 실제 Task 이름을 사용하세요.
5. **텍스트 형식으로만 작성하세요** (Mermaid Gantt 차트 사용 금지).

아이디어와 PRD를 분석하여 실제 개발 일정을 **텍스트 형식으로만** 작성하세요:

### **Phase 1: MVP (Week 1-2)**

**Week 1:**
- **Day 1-2**: [P0] [위에 작성된 실제 Task 이름을 그대로 사용하세요. 예: "Task 1.1: 사용자 인증 시스템 구축"]
  - 담당: [위에 작성된 실제 전문가 이름을 그대로 사용하세요. 예: "API Expert (Marcus)"]
  - 예상 시간: [위에 작성된 실제 예상 시간을 그대로 사용하세요. 예: "8시간"]
  - 완료 조건: [위에 작성된 실제 완료 조건을 그대로 사용하세요]
  
- **Day 3-4**: [P0] [위에 작성된 실제 Task 이름을 그대로 사용하세요]
  - 담당: [위에 작성된 실제 전문가 이름을 그대로 사용하세요]
  - 예상 시간: [위에 작성된 실제 예상 시간을 그대로 사용하세요]
  - 완료 조건: [위에 작성된 실제 완료 조건을 그대로 사용하세요]
  - 의존성: [실제 의존성이 있다면 명시하세요. 예: "Task 1.1 완료 후 시작"]

- **Day 5**: [P1] [위에 작성된 실제 Task 이름을 그대로 사용하세요]
  - 담당: [위에 작성된 실제 전문가 이름을 그대로 사용하세요]
  - 예상 시간: [위에 작성된 실제 예상 시간을 그대로 사용하세요]
  - 완료 조건: [위에 작성된 실제 완료 조건을 그대로 사용하세요]
  - 의존성: [실제 의존성이 있다면 명시하세요]

**Week 2:**
- **Day 6-7**: [P1] [위에 작성된 실제 Task 이름을 그대로 사용하세요]
  - 담당: [위에 작성된 실제 전문가 이름을 그대로 사용하세요]
  - 예상 시간: [위에 작성된 실제 예상 시간을 그대로 사용하세요]
  - 완료 조건: [위에 작성된 실제 완료 조건을 그대로 사용하세요]
  
- **Day 8-9**: [P1] [위에 작성된 실제 Task 이름을 그대로 사용하세요]
  - 담당: [위에 작성된 실제 전문가 이름을 그대로 사용하세요]
  - 예상 시간: [위에 작성된 실제 예상 시간을 그대로 사용하세요]
  - 완료 조건: [위에 작성된 실제 완료 조건을 그대로 사용하세요]

- **Day 10**: 통합 테스트 및 버그 수정
  - 담당: QA Expert
  - 완료 조건: 모든 P0, P1 Task 통합 테스트 통과

### **Phase 2: 확장 (Week 3-4)**

**Week 3:**
- **Day 11-13**: [P2] [위에 작성된 실제 Task 이름을 그대로 사용하세요]
  - 담당: [전문가 이름]
  - 예상 시간: [N]시간
  - 완료 조건: [구체적인 완료 조건]

**Week 4:**
- **Day 14**: 최종 검증 및 배포 준비
  - 담당: DevOps Expert + QA Expert
  - 완료 조건: 프로덕션 배포 준비 완료

**⚠️ 중요**: 
- 모든 작업명은 아이디어와 PRD에서 언급된 실제 기능명을 사용해야 합니다.
- "Task 1.1", "아이디어 기능 1" 같은 예시 텍스트를 절대 사용하지 마세요.
- 각 작업의 담당 전문가, 예상 시간, 완료 조건을 구체적으로 명시하세요.
- 작업 간 의존성을 명확히 표시하세요.

---

## ⚠️ 리스크 관리

### **3대 핵심 위험**
Risk #1: 가장 큰 기술적 위험을 구체적으로 명시
  - 문제 정의: 구체적으로 설명
  - 검증 방법: 구체적인 검증 방법 제시
  - 성공 기준: 정량적 수치와 함께 제시
  - 실패 시 Plan B: 구체적인 대안 제시

Risk #2: 두 번째 위험을 구체적으로 명시
  - 문제 정의: 구체적으로 설명
  - 검증 방법: 구체적인 검증 방법 제시
  - 성공 기준: 정량적 수치와 함께 제시
  - 실패 시 Plan B: 구체적인 대안 제시

Risk #3: 세 번째 위험을 구체적으로 명시
  - 문제 정의: 구체적으로 설명
  - 검증 방법: 구체적인 검증 방법 제시
  - 성공 기준: 정량적 수치와 함께 제시
  - 실패 시 Plan B: 구체적인 대안 제시

---

## ✅ 완료 조건

\`\`\`yaml
✅ [실제 Expert 이름, 예: API Expert (Marcus)]: [아이디어와 PRD에서 추출한 구체적 완료 조건 + 수치, 예: "Opinions 수집 API 구현 완료, 응답 시간 < 2초, 성공률 > 99%"]
✅ [실제 Expert 이름, 예: Database Expert (Sarah)]: [아이디어와 PRD에서 추출한 구체적 완료 조건 + 수치, 예: "데이터베이스 스키마 구축 완료, 쿼리 응답 시간 < 500ms"]
✅ [실제 Expert 이름, 예: UI Expert (Elena)]: [아이디어와 PRD에서 추출한 구체적 완료 조건 + 수치, 예: "뉴스레터 작성 UI 구현 완료, 사용자 만족도 > 4.5/5"]
✅ QA Expert (Nina): Mock-free 99% 검증, API 에러율 < 1%, 가동률 > 99%
✅ Analytics Expert (Ryan): 24시간 연속 운영 안정성 확인, 성능 메트릭 대시보드 구축 완료
\`\`\`

---

**⚠️ 중요 규칙**:
1. 모든 Task에 [P0/P1/P2/P3] 우선순위 표시 필수
2. TCREI 방법론으로 각 Task 정의
3. 8 Expert System 핸드오프 체계 명시
4. Mock-Free 원칙 준수 (MVP 10% 이하, Full 1% 이하)
5. 분량 제한 엄수 (MVP 400-600줄, Full 700-1,000줄)
6. 중복 방지: 동일 내용 2회 이상 금지, Cross-Reference 활용
7. 코드 예시는 핵심만 (파일당 20-30줄)
8. Mermaid 다이어그램: 시스템 구조, ERD만 사용 (전문가 핸드오프, WBS는 텍스트만)
9. **플레이스홀더([...])를 절대 사용하지 마세요.** 모든 내용은 아이디어와 PRD에서 추출한 실제 내용이어야 합니다.
10. **모든 섹션을 박스 단위로 작성하세요.** 각 섹션은 명확한 제목과 내용으로 구분되어야 합니다.
11. **아이디어마다 형식이 달라지면 안 됩니다.** 모든 아이디어에 대해 동일한 구조와 형식을 사용하세요.
\`\`\`

---

**⚠️ 최종 확인 사항 (반드시 체크하세요)**: 
- ✅ 모든 플레이스홀더([...], "구체적으로 명시", "실제 사용할 기술" 등)를 실제 내용으로 대체했는지 확인
- ✅ 아이디어와 PRD를 분석하여 구체적인 내용을 작성했는지 확인
- ✅ 예시 템플릿이 아닌 실제 프로젝트 기획서를 작성했는지 확인
- ✅ 각 섹션을 매우 상세하고 구체적으로 작성했는지 확인 (최소 1,000줄 이상)
- ✅ 실제 개발자가 바로 착수할 수 있을 정도로 구체적인 내용을 포함했는지 확인
- ✅ 각 Task마다 최소 3-5개 SubTask를 포함했는지 확인
- ✅ 각 SubTask마다 실제 코드 예시 20-50줄을 포함했는지 확인
- ✅ 전문가 이름을 실제 Expert 이름으로 작성했는지 확인 (플레이스홀더 금지)
- ✅ 모든 목표, 완료 조건, 성능 기준에 정량적 수치를 포함했는지 확인
- ✅ 전문가 핸드오프 체계를 텍스트 형식으로만 작성했는지 확인 (Mermaid 다이어그램 금지)
- ✅ WBS 개발 일정을 텍스트 형식으로만 작성했는지 확인 (Mermaid Gantt 차트 금지)
- ✅ Mermaid 다이어그램(시스템 구조, ERD)에 실제 기능명을 사용했는지 확인 (예시 텍스트 사용 금지)
- ✅ 마크다운 형식을 정확히 지켰는지 확인
- ✅ 모든 아이디어에 대해 동일한 구조와 형식을 사용했는지 확인
- ✅ 각 섹션이 박스 단위로 명확히 구분되어 있는지 확인
- ✅ 문서 마지막에 추가 설명이나 메타 정보를 포함하지 않았는지 확인`;
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
        throw new Error('Invalid response from OpenAI API: missing choices or message');
      }

      const content = data.choices[0].message.content;
      if (!content || content.trim().length === 0) {
        throw new Error('OpenAI API returned empty content');
      }

      return content;
    } catch (error) {
      // 프로덕션 환경이 아닐 때만 에러 로그 출력
      if (import.meta.env.DEV) {
        console.error('OpenAI API call error:', error);
      }
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
      // 프로덕션 환경이 아닐 때만 에러 로그 출력
      if (import.meta.env.DEV) {
        console.error('Claude API call error:', error);
      }
      throw error;
    }
  }

  /**
   * OpenRouter API 호출 (무료 모델 사용)
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    const apiKey = this.config.apiKey;
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env.local file. Get your API key from https://openrouter.ai/keys');
    }

    // 무료 모델 선택
    // meta-llama/llama-3.1-8b-instruct: 안정적인 무료 모델 (권장, 제한이 비교적 관대함)
    // mistralai/mistral-7b-instruct: 무료 모델
    // google/gemini-flash-1.5: Gemini Flash 모델 (무료 모델, 정확한 제한은 OpenRouter 사이트에서 확인)
    // google/gemini-2.0-flash-exp: 실험적 모델 (사용 불가)
    // 참고: 무료 모델의 정확한 제한 사항은 https://openrouter.ai/models 에서 확인 가능
    const model = this.config.model || 'meta-llama/llama-3.1-8b-instruct';
    
    // API 키 확인 (에러가 있을 때만 로그 출력)
    if (import.meta.env.DEV && (!apiKey || apiKey.trim() === '')) {
      console.error('❌ OpenRouter API key is empty! Check VITE_OPENROUTER_API_KEY in .env.local file');
    }

    try {
      // 개발 환경에서 요청 정보 로깅 제거 (성공 시에는 로그 없음)
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin || 'http://localhost:5173', // OpenRouter 요구사항
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
        
        // 개발 환경에서 상세 에러 정보 출력
        if (import.meta.env.DEV) {
          console.error('❌ OpenRouter API Error:');
          console.error('  Status:', response.status);
          console.error('  Message:', errorMessage);
          console.error('  Full error data:', errorData);
          console.error('  API Key used:', apiKey ? `${apiKey.substring(0, 15)}...` : 'MISSING');
          console.error('  Model:', model);
        }
        
        // 401 에러인 경우 더 자세한 정보 제공
        if (response.status === 401) {
          const detailedError = `OpenRouter API 인증 실패 (401): ${errorMessage}\n` +
            `모델: ${model}\n` +
            `API 키: ${apiKey ? `${apiKey.substring(0, 10)}... (${apiKey.length}자)` : 'NOT FOUND'}\n` +
            `해결 방법:\n` +
            `1. .env.local 파일에 VITE_OPENROUTER_API_KEY가 올바르게 설정되어 있는지 확인\n` +
            `2. 개발 서버를 재시작했는지 확인 (npm run dev)\n` +
            `3. OpenRouter 대시보드에서 API 키가 활성화되어 있는지 확인`;
          throw new Error(detailedError);
        }
        
        throw new Error(`OpenRouter API error: ${response.status} ${errorMessage}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenRouter API: missing choices or message');
      }

      const content = data.choices[0].message.content;
      if (!content || content.trim().length === 0) {
        throw new Error('OpenRouter API returned empty content');
      }

      return content;
    } catch (error) {
      // 에러 발생 시에만 상세 로그 출력
      if (import.meta.env.DEV) {
        console.error('❌ OpenRouter API call failed:', error);
      }
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

// 개발 환경에서 환경 변수 로드 확인 (에러가 있을 때만 출력)
if (import.meta.env.DEV && !apiKey) {
  console.error('⚠️  WARNING: OpenRouter API key is missing! Check your .env.local file.');
}

export const aiClient = new AIClient({
  provider,
  apiKey,
  model: import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct', // OpenRouter 무료 모델
});
