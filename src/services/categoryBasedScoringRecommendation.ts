// 사용자 관심 카테고리 기반 AI 점수 추천 서비스
import { supabase } from '@/lib/supabase';
import { getIdeaScore, getTopScoredIdeas } from './ideaScoringService';
import { getUserBehaviors, type UserBehavior } from './recommendationService';
import type { Idea } from './ideaService';

export interface CategoryScoredIdea extends Idea {
  category: string;
  total_score: number;
  recommendation_reason: string;
  category_preference_score: number;
}

/**
 * 사용자의 관심 카테고리를 분석하여 해당 카테고리 내에서 AI 점수가 높은 아이디어 추천
 */
export async function getCategoryBasedScoredRecommendations(
  userId: string,
  limit: number = 10
): Promise<CategoryScoredIdea[]> {
  try {
    console.log('🔍 CategoryBased: Starting recommendations for userId:', userId);
    
    // userId 안전성 검사
    if (!userId) {
      console.warn('⚠️ CategoryBased: userId is undefined or null');
      const topScored = await getTopScoredIdeas(limit);
      return topScored.map(item => ({
        ...item.idea,
        category: item.idea.category || 'general',
        total_score: item.total_score,
        recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
        category_preference_score: 0,
      }));
    }
    
    // 1. 사용자의 행동 데이터 조회
    console.log('📊 CategoryBased: Fetching user behaviors...');
    const behaviors = await getUserBehaviors(userId, 100);
    console.log('📊 CategoryBased: User behaviors:', {
      count: behaviors.length,
      behaviors: behaviors.slice(0, 3) // 첫 3개만 로그
    });
    
    if (behaviors.length === 0) {
      // 행동 데이터가 없으면 전체 상위 점수 아이디어 반환
      const topScored = await getTopScoredIdeas(limit);
      return topScored.map(item => ({
        ...item.idea,
        category: item.idea.category || 'general',
        total_score: item.total_score,
        recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
        category_preference_score: 0,
      }));
    }

    // 2. 사용자가 좋아요/북마크/PRD 생성한 아이디어의 카테고리 추출
    const likedIdeaIds = behaviors
      .filter(b => b.action_type === 'like' || b.action_type === 'bookmark' || b.action_type === 'generate_prd')
      .map(b => b.idea_id);

    if (likedIdeaIds.length === 0) {
      // 좋아요한 아이디어가 없으면 전체 상위 점수 아이디어 반환
      const topScored = await getTopScoredIdeas(limit);
      return topScored.map(item => ({
        ...item.idea,
        category: item.idea.category || 'general',
        total_score: item.total_score,
        recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
        category_preference_score: 0,
      }));
    }

    // 3. 좋아요한 아이디어들의 카테고리 추출
    const { data: likedIdeas, error: likedError } = await supabase
      .from('ideas')
      .select('id, category')
      .in('id', likedIdeaIds);

    if (likedError || !likedIdeas || likedIdeas.length === 0) {
      const topScored = await getTopScoredIdeas(limit);
      return topScored.map(item => ({
        ...item.idea,
        category: item.idea.category || 'general',
        total_score: item.total_score,
        recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
        category_preference_score: 0,
      }));
    }

    // 4. 카테고리별 선호도 계산 (행동 가중치 포함)
    const categoryScores: Record<string, number> = {};
    const actionWeights: Record<string, number> = {
      'like': 3,
      'bookmark': 4,
      'generate_prd': 5,
      'view': 1,
    };

    // 행동 데이터와 아이디어 매핑
    const behaviorMap = new Map<string, UserBehavior>();
    behaviors.forEach(b => {
      if (!behaviorMap.has(b.idea_id) || 
          (actionWeights[b.action_type] > (actionWeights[behaviorMap.get(b.idea_id)!.action_type] || 0))) {
        behaviorMap.set(b.idea_id, b);
      }
    });

    likedIdeas.forEach(idea => {
      if (!idea.category) return;
      
      const behavior = behaviorMap.get(idea.id);
      const weight = behavior ? actionWeights[behavior.action_type] || 1 : 1;
      
      if (!categoryScores[idea.category]) {
        categoryScores[idea.category] = 0;
      }
      categoryScores[idea.category] += weight;
    });

    // 5. 선호도가 높은 카테고리 상위 3개 선택
    const topCategories = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    if (topCategories.length === 0) {
      const topScored = await getTopScoredIdeas(limit);
      return topScored.map(item => ({
        ...item.idea,
        category: item.idea.category || 'general',
        total_score: item.total_score,
        recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
        category_preference_score: 0,
      }));
    }

    // 6. 각 카테고리에서 AI 점수가 높은 아이디어 조회
    const allScoredIdeas: Array<{ idea: Idea; score: number; category: string; categoryScore: number }> = [];

    for (const category of topCategories) {
      // 해당 카테고리의 아이디어 중 점수가 있는 것들 조회
      const { data: categoryIdeas, error: categoryError } = await supabase
        .from('ideas')
        .select('*')
        .eq('category', category)
        .limit(50); // 각 카테고리에서 최대 50개 조회

      if (categoryError || !categoryIdeas || categoryIdeas.length === 0) {
        continue;
      }

      // 각 아이디어의 점수 조회
      for (const idea of categoryIdeas) {
        try {
          const score = await getIdeaScore(idea.id);
          if (score) {
            allScoredIdeas.push({
              idea,
              score: score.total_score,
              category,
              categoryScore: categoryScores[category],
            });
          }
        } catch (error) {
          // 점수가 없는 아이디어는 건너뛰기
          continue;
        }
      }
    }

    // 7. 점수 순으로 정렬 (카테고리 선호도 + AI 점수)
    const scoredIdeas: CategoryScoredIdea[] = allScoredIdeas
      .map(item => {
        return {
          ...item.idea,
          category: item.category,
          total_score: item.score,
          category_preference_score: item.categoryScore,
          recommendation_reason: `"${item.category}" 카테고리에서 AI 평가 점수 ${item.score}/30점`,
        };
      })
      .sort((a, b) => {
        // 카테고리 선호도가 높고 AI 점수도 높은 순으로 정렬
        const scoreA = a.category_preference_score * 0.3 + a.total_score * 0.7;
        const scoreB = b.category_preference_score * 0.3 + b.total_score * 0.7;
        return scoreB - scoreA;
      })
      .slice(0, limit);

    // 8. 점수가 있는 아이디어가 부족하면 전체 상위 점수 아이디어로 보완
    if (scoredIdeas.length < limit) {
      const topScored = await getTopScoredIdeas(limit - scoredIdeas.length);
      const additionalIdeas = topScored
        .filter(item => !scoredIdeas.some(si => si.id === item.idea.id))
        .map(item => ({
          ...item.idea,
          category: item.idea.category || 'general',
          total_score: item.total_score,
          recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
          category_preference_score: 0,
        }));
      
      scoredIdeas.push(...additionalIdeas);
    }

    return scoredIdeas;
  } catch (error) {
    console.error('Error getting category-based scored recommendations:', error);
    // 에러 발생 시 전체 상위 점수 아이디어 반환
    const topScored = await getTopScoredIdeas(limit);
    return topScored.map(item => ({
      ...item.idea,
      category: item.idea.category || 'general',
      total_score: item.total_score,
      recommendation_reason: `AI 평가 점수 ${item.total_score}/30점`,
      category_preference_score: 0,
    }));
  }
}

