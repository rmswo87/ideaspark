// 아이디어 실행 현황 추적 서비스
import { supabase } from '@/lib/supabase';

export type ImplementationStatus = 'planned' | 'in_progress' | 'completed';

export interface IdeaImplementation {
  id: string;
  idea_id: string;
  user_id: string;
  implementation_url: string | null;
  screenshot_url: string | null;
  description: string | null;
  status: ImplementationStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateImplementationData {
  idea_id: string;
  implementation_url?: string;
  screenshot_url?: string;
  description?: string;
  status?: ImplementationStatus;
}

export interface UpdateImplementationData {
  implementation_url?: string;
  screenshot_url?: string;
  description?: string;
  status?: ImplementationStatus;
}

/**
 * 아이디어 구현 사례 생성
 */
export async function createImplementation(
  data: CreateImplementationData
): Promise<IdeaImplementation> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: implementation, error } = await supabase
    .from('idea_implementations')
    .insert({
      idea_id: data.idea_id,
      user_id: user.id,
      implementation_url: data.implementation_url || null,
      screenshot_url: data.screenshot_url || null,
      description: data.description || null,
      status: data.status || 'planned',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`구현 사례 생성 실패: ${error.message}`);
  }

  return implementation;
}

/**
 * 아이디어 구현 사례 수정
 */
export async function updateImplementation(
  id: string,
  data: UpdateImplementationData
): Promise<IdeaImplementation> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data: implementation, error } = await supabase
    .from('idea_implementations')
    .update({
      implementation_url: data.implementation_url,
      screenshot_url: data.screenshot_url,
      description: data.description,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id) // 본인 것만 수정 가능
    .select()
    .single();

  if (error) {
    throw new Error(`구현 사례 수정 실패: ${error.message}`);
  }

  if (!implementation) {
    throw new Error('구현 사례를 찾을 수 없거나 수정 권한이 없습니다.');
  }

  return implementation;
}

/**
 * 아이디어 구현 사례 삭제
 */
export async function deleteImplementation(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { error } = await supabase
    .from('idea_implementations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // 본인 것만 삭제 가능

  if (error) {
    throw new Error(`구현 사례 삭제 실패: ${error.message}`);
  }
}

/**
 * 특정 아이디어의 구현 사례 조회
 */
export async function getImplementationByIdea(
  ideaId: string
): Promise<IdeaImplementation | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('idea_implementations')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 데이터가 없는 경우
      return null;
    }
    throw new Error(`구현 사례 조회 실패: ${error.message}`);
  }

  return data;
}

/**
 * 특정 아이디어의 모든 구현 사례 조회 (다른 사용자들 포함)
 */
export async function getImplementationsByIdea(
  ideaId: string,
  limit: number = 10
): Promise<IdeaImplementation[]> {
  const { data, error } = await supabase
    .from('idea_implementations')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`구현 사례 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 사용자의 모든 구현 사례 조회
 */
export async function getImplementationsByUser(
  userId?: string,
  status?: ImplementationStatus,
  limit: number = 50
): Promise<IdeaImplementation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;

  if (!targetUserId) {
    return [];
  }

  let query = supabase
    .from('idea_implementations')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`구현 사례 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 완료된 구현 사례 갤러리 조회
 */
export async function getCompletedImplementations(
  limit: number = 20,
  offset: number = 0
): Promise<IdeaImplementation[]> {
  const { data, error } = await supabase
    .from('idea_implementations')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`구현 사례 조회 실패: ${error.message}`);
  }

  return data || [];
}

/**
 * 비슷한 아이디어의 구현 사례 조회
 * 같은 카테고리나 유사한 키워드를 가진 아이디어의 구현 사례를 찾습니다.
 */
export async function getSimilarImplementations(
  ideaId: string,
  limit: number = 5
): Promise<IdeaImplementation[]> {
  // 먼저 현재 아이디어 정보 조회
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('category, title, content')
    .eq('id', ideaId)
    .single();

  if (ideaError || !idea) {
    return [];
  }

  // 같은 카테고리이거나 유사한 키워드를 가진 아이디어 찾기
  const { data: similarIdeas, error: similarError } = await supabase
    .from('ideas')
    .select('id')
    .eq('category', idea.category)
    .neq('id', ideaId)
    .limit(20);

  if (similarError || !similarIdeas || similarIdeas.length === 0) {
    return [];
  }

  const similarIdeaIds = similarIdeas.map(i => i.id);

  // 해당 아이디어들의 완료된 구현 사례 조회
  const { data: implementations, error: implError } = await supabase
    .from('idea_implementations')
    .select('*')
    .in('idea_id', similarIdeaIds)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (implError) {
    return [];
  }

  return implementations || [];
}

/**
 * 사용자의 구현 통계 조회
 */
export async function getImplementationStats(
  userId?: string
): Promise<{
  total: number;
  planned: number;
  in_progress: number;
  completed: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;

  if (!targetUserId) {
    return { total: 0, planned: 0, in_progress: 0, completed: 0 };
  }

  const { data, error } = await supabase
    .from('idea_implementations')
    .select('status')
    .eq('user_id', targetUserId);

  if (error) {
    return { total: 0, planned: 0, in_progress: 0, completed: 0 };
  }

  const stats = {
    total: data.length,
    planned: data.filter(i => i.status === 'planned').length,
    in_progress: data.filter(i => i.status === 'in_progress').length,
    completed: data.filter(i => i.status === 'completed').length,
  };

  return stats;
}

