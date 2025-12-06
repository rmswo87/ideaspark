// AI 기반 아이디어 평가 서비스
import { supabase } from '@/lib/supabase';
import { aiClient } from './ai';
import type { Idea } from './ideaService';

export interface IdeaScore {
  id: string;
  idea_id: string;
  vitamin_score: number | null;
  competition_score: number | null;
  sexiness_score: number | null;
  total_score: number;
  difficulty_level: '하' | '중' | '상' | null;
  ai_analysis: any;
  is_recommended: boolean;
  recommended_at: string | null;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScoringResult {
  vitamin_score: number;
  competition_score: number;
  sexiness_score: number;
  total_score: number;
  difficulty_level: '하' | '중' | '상';
  ai_analysis: {
    vitamin_reason: string;
    competition_reason: string;
    sexiness_reason: string;
    difficulty_reason: string;
    summary: string;
  };
}

/**
 * 아이디어 평가 실행 (AI 기반)
 * 프리미엄 사용자만 사용 가능
 */
export async function scoreIdea(ideaId: string): Promise<IdeaScore> {
  // 아이디어 조회
  const { data: idea, error: ideaError } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single();

  if (ideaError || !idea) {
    throw new Error('Idea not found');
  }

  // AI로 아이디어 평가
  const scoringResult = await aiClient.scoreIdea(idea as Idea);

  // 점수 저장 (서버에서만 실행되므로 RLS 정책 우회 필요)
  // 실제로는 Edge Function이나 서버 API를 통해 실행해야 함
  const { data: score, error: scoreError } = await supabase
    .from('idea_scores')
    .upsert({
      idea_id: ideaId,
      vitamin_score: scoringResult.vitamin_score,
      competition_score: scoringResult.competition_score,
      sexiness_score: scoringResult.sexiness_score,
      difficulty_level: scoringResult.difficulty_level,
      ai_analysis: scoringResult.ai_analysis,
      analyzed_at: new Date().toISOString(),
    }, {
      onConflict: 'idea_id',
    })
    .select()
    .single();

  if (scoreError) {
    console.error('Score save error:', scoreError);
    throw new Error(`점수 저장 실패: ${scoreError.message}`);
  }

  return score;
}

/**
 * 여러 아이디어 일괄 평가
 */
export async function scoreIdeas(ideaIds: string[]): Promise<IdeaScore[]> {
  const scores: IdeaScore[] = [];

  for (const ideaId of ideaIds) {
    try {
      const score = await scoreIdea(ideaId);
      scores.push(score);
      // API rate limit 방지를 위한 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error scoring idea ${ideaId}:`, error);
    }
  }

  return scores;
}

/**
 * 아이디어 점수 조회
 */
export async function getIdeaScore(ideaId: string): Promise<IdeaScore | null> {
  const { data, error } = await supabase
    .from('idea_scores')
    .select('id, idea_id, vitamin_score, competition_score, sexiness_score, total_score, difficulty_level, ai_analysis, is_recommended, recommended_at, analyzed_at, created_at, updated_at')
    .eq('idea_id', ideaId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      // 점수가 없는 경우
      return null;
    }
    console.error('Error fetching idea score:', error);
    throw error;
  }

  return data;
}

/**
 * 점수가 높은 아이디어 조회 (상위 N개)
 */
export async function getTopScoredIdeas(limit: number = 10): Promise<Array<IdeaScore & { idea: Idea }>> {
  const { data: scores, error: scoresError } = await supabase
    .from('idea_scores')
    .select('id, idea_id, vitamin_score, competition_score, sexiness_score, total_score, difficulty_level, ai_analysis, is_recommended, recommended_at, analyzed_at, created_at, updated_at')
    .order('total_score', { ascending: false })
    .limit(limit);

  if (scoresError) {
    throw scoresError;
  }

  if (!scores || scores.length === 0) {
    return [];
  }

  // 아이디어 정보 조회
  const ideaIds = scores.map(s => s.idea_id);
  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .in('id', ideaIds);

  if (ideasError) {
    throw ideasError;
  }

  // 점수와 아이디어 결합
  const result = scores.map(score => {
    const idea = ideas?.find(i => i.id === score.idea_id);
    return {
      ...score,
      idea: idea as Idea,
    };
  }).filter(item => item.idea); // 아이디어가 없는 경우 제외

  return result as Array<IdeaScore & { idea: Idea }>;
}

/**
 * 최근 검색된 아이디어 중 점수가 높은 상위 3개 조회
 * (최근 7일 이내에 조회된 아이디어 중)
 */
export async function getTopScoredRecentIdeas(limit: number = 3): Promise<Array<IdeaScore & { idea: Idea }>> {
  // 최근 7일 이내 조회된 아이디어 ID 조회 (user_behaviors 테이블 사용)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentViews, error: viewsError } = await supabase
    .from('user_behaviors')
    .select('idea_id')
    .eq('action_type', 'view')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (viewsError) {
    console.error('Error fetching recent views:', viewsError);
    // 최근 조회 데이터가 없으면 전체 상위 아이디어 반환
    return getTopScoredIdeas(limit);
  }

  if (!recentViews || recentViews.length === 0) {
    // 최근 조회가 없으면 전체 상위 아이디어 반환
    return getTopScoredIdeas(limit);
  }

  // 중복 제거
  const uniqueIdeaIds = [...new Set(recentViews.map(v => v.idea_id))];

  // 해당 아이디어들의 점수 조회
  const { data: scores, error: scoresError } = await supabase
    .from('idea_scores')
    .select('id, idea_id, vitamin_score, competition_score, sexiness_score, total_score, difficulty_level, ai_analysis, is_recommended, recommended_at, analyzed_at, created_at, updated_at')
    .in('idea_id', uniqueIdeaIds)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (scoresError) {
    throw scoresError;
  }

  if (!scores || scores.length === 0) {
    return [];
  }

  // 아이디어 정보 조회
  const ideaIds = scores.map(s => s.idea_id);
  const { data: ideas, error: ideasError } = await supabase
    .from('ideas')
    .select('*')
    .in('id', ideaIds);

  if (ideasError) {
    throw ideasError;
  }

  // 점수와 아이디어 결합
  const result = scores.map(score => {
    const idea = ideas?.find(i => i.id === score.idea_id);
    return {
      ...score,
      idea: idea as Idea,
    };
  }).filter(item => item.idea); // 아이디어가 없는 경우 제외

  return result as Array<IdeaScore & { idea: Idea }>;
}

/**
 * 오늘의 추천 아이디어 조회
 */
export async function getRecommendedIdeaOfTheDay(): Promise<(IdeaScore & { idea: Idea }) | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('idea_scores')
    .select('id, idea_id, vitamin_score, competition_score, sexiness_score, total_score, difficulty_level, ai_analysis, is_recommended, recommended_at, analyzed_at, created_at, updated_at, ideas(*)')
    .eq('is_recommended', true)
    .gte('recommended_at', today.toISOString())
    .order('recommended_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      // 오늘 추천된 아이디어가 없는 경우
      return null;
    }
    console.error('Error fetching recommended idea:', error);
    return null;
  }

  return {
    ...data,
    idea: data.ideas as Idea,
  } as IdeaScore & { idea: Idea };
}

