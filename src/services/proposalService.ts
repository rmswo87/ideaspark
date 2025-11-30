// 제안서 생성 및 관리 서비스
import { supabase } from '@/lib/supabase';
import { aiClient } from './ai';
import type { Idea } from './ideaService';

export interface Proposal {
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
 * 아이디어를 기반으로 제안서 생성
 * 기존 아이디어를 분석하여 개선된 제안서 작성
 */
export async function generateProposal(
  ideaId: string,
  userId: string
): Promise<Proposal> {
  // 아이디어 조회
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (ideaError || !idea) {
    throw new Error('Idea not found');
  }

  // AI로 제안서 생성
  let proposalContent: string;
  try {
    proposalContent = await aiClient.generateProposal(idea as Idea);
  } catch (error) {
    console.error('Proposal generation error:', error);
    throw new Error(`제안서 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // 제안서 저장
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      idea_id: ideaId,
      user_id: userId,
      title: `${idea.title} - 개선 제안서`,
      content: proposalContent,
      status: 'draft',
    })
    .select()
    .single();

  if (proposalError) {
    console.error('Proposal save error:', proposalError);
    throw proposalError;
  }

  return proposal;
}

/**
 * 제안서 조회
 */
export async function getProposal(proposalId: string): Promise<Proposal> {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 제안서 목록 조회
 */
export async function getProposals(params: {
  ideaId?: string;
  userId?: string;
  limit?: number;
}): Promise<Proposal[]> {
  let query = supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (params.ideaId) {
    query = query.eq('idea_id', params.ideaId);
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 제안서 삭제
 */
export async function deleteProposal(proposalId: string): Promise<void> {
  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', proposalId);

  if (error) {
    throw error;
  }
}

