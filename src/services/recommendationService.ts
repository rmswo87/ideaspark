// 아이디어 추천 서비스 (Epic 7 Task 7.1)
import { supabase } from '@/lib/supabase';
import type { Idea } from './ideaService';
import { getImplementationsByUser, type IdeaImplementation } from './implementationService';

export interface UserBehavior {
  id?: string;
  user_id: string;
  idea_id: string;
  action_type: 'view' | 'like' | 'bookmark' | 'generate_prd';
  duration?: number; // 조회 시간 (초)
  created_at?: string;
}

export interface RecommendedIdea extends Idea {
  recommendation_reason?: string; // 추천 이유
  similarity_score?: number; // 유사도 점수
}

/**
 * 사용자 행동 데이터 기록
 */
export async function trackUserBehavior(
  userId: string,
  ideaId: string,
  actionType: UserBehavior['action_type'],
  duration?: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_behaviors')
      .insert({
        user_id: userId,
        idea_id: ideaId,
        action_type: actionType,
        duration: duration,
      });

    if (error) {
      console.error('Error tracking user behavior:', error);
      // 에러가 발생해도 앱이 중단되지 않도록 조용히 처리
    }
  } catch (error) {
    console.error('Error tracking user behavior:', error);
  }
}

/**
 * 사용자 행동 데이터 조회
 */
export async function getUserBehaviors(
  userId: string,
  limit: number = 100
): Promise<UserBehavior[]> {
  try {
    const { data, error } = await supabase
      .from('user_behaviors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user behaviors:', error);
    return [];
  }
}

/**
 * 사용자 맞춤형 아이디어 추천
 * 간단한 협업 필터링 및 키워드 기반 추천 알고리즘
 */
export async function getRecommendedIdeas(
  userId: string,
  limit: number = 10
): Promise<RecommendedIdea[]> {
  try {
    // 1. 사용자의 행동 데이터 조회
    const behaviors = await getUserBehaviors(userId, 50);
    
    if (behaviors.length === 0) {
      // 행동 데이터가 없으면 인기 아이디어 반환
      return await getPopularIdeas(limit);
    }

    // 2. 사용자가 좋아요/북마크/PRD 생성한 아이디어의 카테고리/키워드 추출
    const likedIdeaIds = behaviors
      .filter(b => b.action_type === 'like' || b.action_type === 'bookmark' || b.action_type === 'generate_prd')
      .map(b => b.idea_id);

    if (likedIdeaIds.length === 0) {
      return await getPopularIdeas(limit);
    }

    // 3. 좋아요한 아이디어들의 카테고리 및 키워드 추출
    const { data: likedIdeas, error: likedError } = await supabase
      .from('ideas')
      .select('id, category, title, content, subreddit')
      .in('id', likedIdeaIds);

    if (likedError || !likedIdeas || likedIdeas.length === 0) {
      return await getPopularIdeas(limit);
    }

    // 카테고리별 선호도 계산 (조회 시간 가중치 포함)
    const categoryScores: Record<string, number> = {};
    const keywordScores: Record<string, number> = {};
    const subredditScores: Record<string, number> = {};

    // 행동별 가중치
    const actionWeights: Record<string, number> = {
      'like': 3,
      'bookmark': 4,
      'generate_prd': 5,
      'view': 1,
    };

    // 조회 시간 기반 가중치 (30초 이상 조회 시 추가 점수)
    const getDurationWeight = (duration?: number): number => {
      if (!duration) return 1;
      if (duration >= 120) return 2.5; // 2분 이상
      if (duration >= 60) return 2.0; // 1분 이상
      if (duration >= 30) return 1.5; // 30초 이상
      return 1;
    };

    // 행동 데이터와 아이디어 매핑
    const behaviorMap = new Map<string, UserBehavior>();
    behaviors.forEach(b => {
      if (!behaviorMap.has(b.idea_id) || (b.duration && b.duration > (behaviorMap.get(b.idea_id)?.duration || 0))) {
        behaviorMap.set(b.idea_id, b);
      }
    });

    likedIdeas.forEach(idea => {
      const behavior = behaviorMap.get(idea.id);
      const actionWeight = actionWeights[behavior?.action_type || 'view'] || 1;
      const durationWeight = getDurationWeight(behavior?.duration);
      const totalWeight = actionWeight * durationWeight;

      // 카테고리 점수 (가중치 적용)
      if (idea.category) {
        categoryScores[idea.category] = (categoryScores[idea.category] || 0) + (2 * totalWeight);
      }

      // 서브레딧 점수 (가중치 적용)
      if (idea.subreddit) {
        subredditScores[idea.subreddit] = (subredditScores[idea.subreddit] || 0) + (1 * totalWeight);
      }

      // 키워드 추출 (간단한 단어 분리, 가중치 적용)
      const text = `${idea.title} ${idea.content}`.toLowerCase();
      const words = text.split(/\s+/).filter(w => w.length > 3);
      words.forEach(word => {
        keywordScores[word] = (keywordScores[word] || 0) + (1 * totalWeight);
      });
    });

    // 4. 유사한 카테고리/키워드를 가진 아이디어 찾기
    const { data: allIdeas, error: ideasError } = await supabase
      .from('ideas')
      .select('*')
      .order('collected_at', { ascending: false })
      .limit(100); // 후보 아이디어 100개

    if (ideasError || !allIdeas) {
      return await getPopularIdeas(limit);
    }

    // 좋아요한 아이디어 제외 (클라이언트 사이드 필터링)
    const filteredIdeas = likedIdeaIds.length > 0
      ? allIdeas.filter(idea => !likedIdeaIds.includes(idea.id))
      : allIdeas;

    // 5. 구현 사례 기반 추천 (사용자가 구현한 아이디어와 유사한 아이디어)
    let implementationBasedIdeas: string[] = [];
    try {
      const userImplementations = await getImplementationsByUser(userId);
      if (userImplementations.length > 0) {
        const implementedIdeaIds = userImplementations
          .filter((impl: IdeaImplementation) => impl.status === 'completed' || impl.status === 'in_progress')
          .map((impl: IdeaImplementation) => impl.idea_id);
        
        if (implementedIdeaIds.length > 0) {
          const { data: implementedIdeas } = await supabase
            .from('ideas')
            .select('category, subreddit')
            .in('id', implementedIdeaIds);
          
          if (implementedIdeas) {
            const implCategories = new Set(implementedIdeas.map(i => i.category).filter(Boolean));
            const implSubreddits = new Set(implementedIdeas.map(i => i.subreddit).filter(Boolean));
            
            // 구현한 아이디어와 같은 카테고리/서브레딧을 가진 아이디어 찾기
            implementationBasedIdeas = filteredIdeas
              .filter(idea => 
                (idea.category && implCategories.has(idea.category)) ||
                (idea.subreddit && implSubreddits.has(idea.subreddit))
              )
              .map(idea => idea.id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching implementations for recommendation:', error);
    }

    // 6. 협업 필터링: 비슷한 사용자 찾기
    let similarUsersIdeas: string[] = [];
    try {
      // 사용자가 좋아요/북마크한 아이디어를 좋아한 다른 사용자들 찾기
      const { data: similarBehaviors } = await supabase
        .from('user_behaviors')
        .select('user_id, idea_id')
        .in('idea_id', likedIdeaIds)
        .neq('user_id', userId)
        .in('action_type', ['like', 'bookmark']);
      
      if (similarBehaviors && similarBehaviors.length > 0) {
        // 비슷한 사용자들의 ID 수집
        const similarUserIds = new Set(similarBehaviors.map(b => b.user_id));
        
        // 비슷한 사용자들이 좋아요/북마크한 아이디어 찾기
        const { data: similarUsersLiked } = await supabase
          .from('user_behaviors')
          .select('idea_id')
          .in('user_id', Array.from(similarUserIds))
          .in('action_type', ['like', 'bookmark'])
          .not('idea_id', 'in', `(${likedIdeaIds.map(id => `'${id}'`).join(',')})`);
        
        if (similarUsersLiked) {
          similarUsersIdeas = Array.from(new Set(similarUsersLiked.map(b => b.idea_id)));
        }
      }
    } catch (error) {
      console.error('Error finding similar users:', error);
    }

    // 7. 각 아이디어에 대한 유사도 점수 계산
    const scoredIdeas: RecommendedIdea[] = filteredIdeas.map(idea => {
      let score = 0;
      const reasons: string[] = [];

      // 카테고리 매칭
      if (idea.category && categoryScores[idea.category]) {
        score += categoryScores[idea.category] * 3;
        reasons.push(`"${idea.category}" 카테고리의 아이디어를 좋아하셨네요!`);
      }

      // 서브레딧 매칭
      if (idea.subreddit && subredditScores[idea.subreddit]) {
        score += subredditScores[idea.subreddit] * 2;
        if (!reasons.length) {
          reasons.push(`r/${idea.subreddit}의 아이디어를 관심있게 보셨네요!`);
        }
      }

      // 키워드 매칭
      const ideaText = `${idea.title} ${idea.content}`.toLowerCase();
      const ideaWords = ideaText.split(/\s+/).filter(w => w.length > 3);
      let matchedKeywords = 0;
      ideaWords.forEach(word => {
        if (keywordScores[word]) {
          score += keywordScores[word];
          matchedKeywords++;
        }
      });
      if (matchedKeywords > 0 && !reasons.length) {
        reasons.push('비슷한 키워드의 아이디어를 좋아하셨네요!');
      }

      // 구현 사례 기반 추천 점수 추가 (최우선)
      if (implementationBasedIdeas.includes(idea.id)) {
        score += 20;
        if (idea.category) {
          reasons.unshift(`구현하신 "${idea.category}" 카테고리의 아이디어와 유사합니다!`);
        } else {
          reasons.unshift('구현하신 아이디어와 비슷한 카테고리입니다!');
        }
      }

      // 협업 필터링 점수 추가
      if (similarUsersIdeas.includes(idea.id)) {
        score += 12;
        if (!reasons.length || !reasons[0].includes('구현')) {
          reasons.push('비슷한 관심사를 가진 사용자들이 좋아한 아이디어입니다!');
        }
      }

      // 인기도 점수 추가 (upvotes 기준)
      score += Math.log10((idea.upvotes || 0) + 1) * 0.5;

      // 추천 이유 우선순위: 구현 기반 > 협업 필터링 > 카테고리 > 서브레딧 > 키워드 > 인기
      const finalReason = reasons.length > 0 
        ? reasons[0] 
        : '인기 아이디어입니다!';

      return {
        ...idea,
        recommendation_reason: finalReason,
        similarity_score: score,
      };
    });

    // 8. 점수 순으로 정렬하고 상위 N개 반환
    return scoredIdeas
      .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommended ideas:', error);
    // 에러 발생 시 인기 아이디어 반환
    return await getPopularIdeas(limit);
  }
}

/**
 * 인기 아이디어 조회 (추천할 데이터가 없을 때 사용)
 */
async function getPopularIdeas(limit: number = 10): Promise<RecommendedIdea[]> {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('upvotes', { ascending: false })
      .order('collected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(idea => ({
      ...idea,
      recommendation_reason: '인기 아이디어입니다!',
      similarity_score: idea.upvotes || 0,
    }));
  } catch (error) {
    console.error('Error fetching popular ideas:', error);
    return [];
  }
}

/**
 * 아이디어 조회 시간 추적 (아이디어 상세 페이지에서 사용)
 */
export function trackIdeaView(ideaId: string, userId: string | null) {
  if (!userId) return;

  const startTime = Date.now();

  // 페이지를 떠날 때 조회 시간 기록
  const handleBeforeUnload = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    if (duration > 5) { // 최소 5초 이상 조회한 경우만 기록
      trackUserBehavior(userId, ideaId, 'view', duration).catch(console.error);
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // 컴포넌트 언마운트 시에도 기록
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    const duration = Math.floor((Date.now() - startTime) / 1000);
    if (duration > 5) {
      trackUserBehavior(userId, ideaId, 'view', duration).catch(console.error);
    }
  };
}

