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
 */
export async function generatePRD(
  ideaId: string, 
  userId: string
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

  // AI로 PRD 생성
  let prdContent: string;
  try {
    prdContent = await aiClient.generatePRD(idea as Idea);
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

