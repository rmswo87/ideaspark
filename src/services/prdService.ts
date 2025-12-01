// PRD 생성 및 관리 서비스
import { supabase } from '@/lib/supabase';
import { aiClient } from './ai';
import type { Idea } from './ideaService';

export interface PRD {
  id: string;
  idea_id: string;
  user_id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

/**
 * 아이디어를 기반으로 PRD 생성
 * @param proposalContent 제안서 내용이 있으면 이를 기반으로 PRD 생성
 */
export async function generatePRD(
  ideaId: string, 
  userId: string,
  proposalContent?: string,
  onProgress?: (progress: number) => void
): Promise<PRD> {
  // 아이디어 조회
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (ideaError || !idea) {
    throw new Error('Idea not found');
  }

  // AI로 PRD 생성 (제안서 내용이 있으면 포함)
  let prdContent: string;
  try {
    if (proposalContent) {
      // 제안서 기반 PRD 생성
      prdContent = await aiClient.generatePRDFromProposal(idea as Idea, proposalContent, onProgress);
    } else {
      // 일반 PRD 생성
      prdContent = await aiClient.generatePRD(idea as Idea, onProgress);
    }
  } catch (error) {
    console.error('PRD generation error:', error);
    throw new Error(`PRD 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // PRD 저장
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .insert({
      idea_id: ideaId,
      user_id: userId,
      title: `${idea.title} - PRD`,
      content: prdContent,
      status: 'draft',
    })
    .select()
    .single();

  if (prdError) {
    console.error('PRD save error:', prdError);
    throw prdError;
  }

  return prd;
}

/**
 * PRD 목록 가져오기
 */
export async function getPRDs(filters?: {
  userId?: string;
  ideaId?: string;
  status?: string;
  limit?: number;
}): Promise<PRD[]> {
  let query = supabase
    .from('prds')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.ideaId) {
    query = query.eq('idea_id', filters.ideaId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching PRDs:', error);
    throw error;
  }

  return data || [];
}

/**
 * PRD 조회
 */
export async function getPRD(prdId: string): Promise<PRD | null> {
  const { data, error } = await supabase
    .from('prds')
    .select('*')
    .eq('id', prdId)
    .single();

  if (error) {
    console.error('Error fetching PRD:', error);
    return null;
  }

  return data;
}

/**
 * PRD 업데이트
 */
export async function updatePRD(
  prdId: string,
  updates: {
    title?: string;
    content?: string;
    status?: 'draft' | 'published' | 'archived';
  }
): Promise<PRD> {
  const { data, error } = await supabase
    .from('prds')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prdId)
    .select()
    .single();

  if (error) {
    console.error('Error updating PRD:', error);
    throw error;
  }

  return data;
}

/**
 * PRD 삭제
 */
export async function deletePRD(prdId: string): Promise<void> {
  const { error } = await supabase
    .from('prds')
    .delete()
    .eq('id', prdId);

  if (error) {
    console.error('Error deleting PRD:', error);
    throw error;
  }
}

/**
 * 개발 계획서 생성
 */
export async function generateDevelopmentPlan(
  ideaId: string,
  userId: string,
  prdContent?: string,
  onProgress?: (progress: number) => void
): Promise<PRD> {
  // 아이디어 조회
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (ideaError || !idea) {
    throw new Error('Idea not found');
  }

  // AI로 개발 계획서 생성
  let planContent: string;
  try {
    planContent = await aiClient.generateDevelopmentPlan(idea as Idea, prdContent, onProgress);
    
    // 마지막 문구 제거 (Planning Expert v6.1 관련 메타 정보)
    const metaInfoPattern = /---\s*\n\s*이 문서는 Planning Expert v6\.1.*$/s;
    planContent = planContent.replace(metaInfoPattern, '').trim();
    
    // 추가로 마지막에 있는 설명 문구 제거
    const trailingPattern = /\n\s*---\s*\n\s*이 문서는.*$/s;
    planContent = planContent.replace(trailingPattern, '').trim();
  } catch (error) {
    // 프로덕션 환경이 아닐 때만 에러 로그 출력
    if (import.meta.env.DEV) {
      console.error('Development plan generation error:', error);
    }
    throw new Error(`개발 계획서 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 개발 계획서 저장
  const { data: plan, error: planError } = await supabase
    .from('prds')
    .insert({
      idea_id: ideaId,
      user_id: userId,
      title: `${idea.title} - 개발 계획서`,
      content: planContent,
      status: 'draft',
    })
    .select()
    .single();

  if (planError) {
    console.error('Development plan save error:', planError);
    throw planError;
  }

  return plan;
}
