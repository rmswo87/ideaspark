import { supabase } from '@/lib/supabase';
import type { Idea } from '@/services/ideaService';

export type RecommendationStrategy = 
  | 'collaborative' 
  | 'content_based' 
  | 'hybrid' 
  | 'trending' 
  | 'personalized_trending' 
  | 'diversity_maximizing' 
  | 'serendipity';

export interface AdvancedRecommendedIdea extends Idea {
  recommendation_score: number;
  recommendation_reason: string;
  confidence_level: number;
  strategy_used: RecommendationStrategy;
  similar_ideas?: string[];
  user_affinity_score?: number;
}

export interface UserBehavior {
  id: string;
  user_id: string;
  idea_id: string;
  action_type: 'view' | 'like' | 'bookmark' | 'generate_prd' | 'share' | 'copy' | 'click';
  duration?: number;
  session_id?: string;
  device_info?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserPreferenceVector {
  user_id: string;
  category_weights: Record<string, number>;
  tag_preferences: Record<string, number>;
  complexity_preference: number;
  novelty_preference: number;
  interaction_frequency: number;
  last_updated: string;
}

export interface IdeaFeatureVector {
  idea_id: string;
  category_vector: Record<string, number>;
  tag_vector: Record<string, number>;
  complexity_score: number;
  popularity_score: number;
  novelty_score: number;
  text_embedding?: number[];
  last_updated: string;
}

// 고급 추천 시스템 메인 함수
export async function getAdvancedRecommendations(
  userId: string,
  limit: number = 10,
  strategy: RecommendationStrategy = 'hybrid',
  diversityWeight: number = 0.3
): Promise<AdvancedRecommendedIdea[]> {
  try {
    console.log(`🎯 Advanced Recommendation Request: User=${userId}, Strategy=${strategy}, Limit=${limit}`);

    // 1. 사용자 행동 데이터 및 선호도 벡터 가져오기
    const userProfile = await getUserProfile(userId);
    const userBehaviors = await getUserBehaviors(userId, 100); // 최근 100개 행동

    // 2. 전략별 추천 실행
    let recommendations: AdvancedRecommendedIdea[] = [];
    
    switch (strategy) {
      case 'collaborative':
        recommendations = await getCollaborativeRecommendations(userId, userBehaviors, limit);
        break;
      case 'content_based':
        recommendations = await getContentBasedRecommendations(userId, userProfile, limit);
        break;
      case 'hybrid':
        recommendations = await getHybridRecommendations(userId, userProfile, userBehaviors, limit);
        break;
      case 'trending':
        recommendations = await getTrendingRecommendations(limit);
        break;
      case 'personalized_trending':
        recommendations = await getPersonalizedTrendingRecommendations(userId, userProfile, limit);
        break;
      case 'diversity_maximizing':
        recommendations = await getDiversityMaximizingRecommendations(userId, userProfile, limit, diversityWeight);
        break;
      case 'serendipity':
        recommendations = await getSerendipityRecommendations(userId, userProfile, limit);
        break;
      default:
        recommendations = await getHybridRecommendations(userId, userProfile, userBehaviors, limit);
    }

    // 3. 후처리: 중복 제거, 최종 스코어 계산
    const finalRecommendations = await postProcessRecommendations(
      recommendations, 
      userId, 
      strategy,
      diversityWeight
    );

    // 4. 추천 성능 추적
    await trackRecommendationMetrics(userId, strategy, finalRecommendations);

    console.log(`✅ Advanced Recommendations Generated: ${finalRecommendations.length} items`);
    return finalRecommendations.slice(0, limit);

  } catch (error) {
    console.error('❌ Error in getAdvancedRecommendations:', error);
    // 폴백: 기본 추천 시스템
    return await getFallbackRecommendations(userId, limit);
  }
}

// 1. 협업 필터링 추천
async function getCollaborativeRecommendations(
  userId: string,
  userBehaviors: UserBehavior[],
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 유사한 사용자 찾기
    const similarUsers = await findSimilarUsers(userId, userBehaviors);
    
    if (similarUsers.length === 0) {
      return await getContentBasedRecommendations(userId, null, limit);
    }

    // 유사한 사용자들이 좋아한 아이디어 중에서 추천
    const { data: similarUserIdeas, error } = await supabase
      .from('user_behaviors')
      .select(`
        idea_id,
        ideas!inner(
          id, title, content, category, subreddit, 
          created_at, collected_at, url, author
        )
      `)
      .in('user_id', similarUsers.map(u => u.user_id))
      .in('action_type', ['like', 'bookmark', 'generate_prd'])
      .not('idea_id', 'in', `(${userBehaviors.map(b => `'${b.idea_id}'`).join(',')})`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 협업 점수 계산
    const ideaScores = new Map<string, { idea: any; score: number; supporters: string[] }>();
    
    similarUserIdeas?.forEach(item => {
      const ideaId = item.idea_id;
      const idea = item.ideas;
      
      if (ideaScores.has(ideaId)) {
        const existing = ideaScores.get(ideaId)!;
        existing.score += 1;
        existing.supporters.push(userId);
      } else {
        ideaScores.set(ideaId, {
          idea,
          score: 1,
          supporters: [userId]
        });
      }
    });

    // 점수 순으로 정렬하고 추천 아이템 생성
    const recommendations = Array.from(ideaScores.entries())
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, limit * 2) // 추가 후보를 위해 2배 가져오기
      .map(([, { idea, score, supporters }]): AdvancedRecommendedIdea => ({
        ...idea,
        recommendation_score: Math.min(score / similarUsers.length, 1.0),
        recommendation_reason: `${supporters.length}명의 유사한 사용자가 이 아이디어를 좋아했습니다`,
        confidence_level: Math.min(supporters.length / 5, 1.0),
        strategy_used: 'collaborative' as RecommendationStrategy,
        similar_ideas: supporters.slice(0, 3)
      }));

    return recommendations;

  } catch (error) {
    console.error('❌ Error in collaborative filtering:', error);
    return [];
  }
}

// 2. 컨텐츠 기반 필터링 추천
async function getContentBasedRecommendations(
  userId: string,
  userProfile: UserPreferenceVector | null,
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 사용자의 과거 행동에서 선호하는 카테고리/태그 분석
    const userPreferences = userProfile || await calculateUserPreferences(userId);
    
    if (!userPreferences) {
      return await getTrendingRecommendations(limit);
    }

    // 사용자 선호도와 매칭되는 아이디어 찾기
    const { data: candidateIdeas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('is_public', true)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500); // 충분한 후보군 확보

    if (error) throw error;

    const recommendations: AdvancedRecommendedIdea[] = [];

    candidateIdeas?.forEach(idea => {
      let contentScore = 0;
      let matchingFactors: string[] = [];

      // 카테고리 매칭
      if (userPreferences.category_weights[idea.category]) {
        const categoryScore = userPreferences.category_weights[idea.category];
        contentScore += categoryScore * 0.4;
        matchingFactors.push(`${idea.category} 카테고리`);
      }

      // 서브레딧(태그 역할) 매칭
      let tagScore = 0;
      if (idea.subreddit && userPreferences.tag_preferences[idea.subreddit]) {
        tagScore = userPreferences.tag_preferences[idea.subreddit];
        matchingFactors.push(`r/${idea.subreddit}`);
      }
      contentScore += tagScore * 0.4;

      // 복잡도 매칭 (메타데이터에서 복잡도 정보가 있다면)
      const ideaComplexity = idea.metadata?.complexity || 0.5;
      const complexityDiff = Math.abs(ideaComplexity - userPreferences.complexity_preference);
      const complexityScore = 1 - complexityDiff;
      contentScore += complexityScore * 0.2;

      if (contentScore > 0.3) { // 임계값 이상인 경우만 추천
        recommendations.push({
          ...idea,
          recommendation_score: Math.min(contentScore, 1.0),
          recommendation_reason: `당신의 관심사와 매칭: ${matchingFactors.slice(0, 3).join(', ')}`,
          confidence_level: Math.min(contentScore * 1.2, 1.0),
          strategy_used: 'content_based',
          user_affinity_score: contentScore
        });
      }
    });

    return recommendations
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Error in content-based filtering:', error);
    return [];
  }
}

// 3. 하이브리드 추천 (협업 + 컨텐츠 기반)
async function getHybridRecommendations(
  userId: string,
  userProfile: UserPreferenceVector | null,
  userBehaviors: UserBehavior[],
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 협업 필터링과 컨텐츠 기반 필터링을 병렬로 실행
    const [collaborativeRecs, contentBasedRecs] = await Promise.all([
      getCollaborativeRecommendations(userId, userBehaviors, limit * 2),
      getContentBasedRecommendations(userId, userProfile, limit * 2)
    ]);

    // 두 결과를 결합하여 하이브리드 스코어 계산
    const hybridScores = new Map<string, AdvancedRecommendedIdea>();

    // 협업 필터링 결과 (가중치 0.6)
    collaborativeRecs.forEach(rec => {
      hybridScores.set(rec.id, {
        ...rec,
        recommendation_score: rec.recommendation_score * 0.6,
        recommendation_reason: `하이브리드: ${rec.recommendation_reason}`,
        strategy_used: 'hybrid'
      });
    });

    // 컨텐츠 기반 결과와 결합 (가중치 0.4)
    contentBasedRecs.forEach(rec => {
      if (hybridScores.has(rec.id)) {
        const existing = hybridScores.get(rec.id)!;
        existing.recommendation_score += rec.recommendation_score * 0.4;
        existing.confidence_level = Math.min(
          (existing.confidence_level + rec.confidence_level) / 2 * 1.2, 
          1.0
        );
        existing.recommendation_reason += ` + ${rec.recommendation_reason}`;
      } else {
        hybridScores.set(rec.id, {
          ...rec,
          recommendation_score: rec.recommendation_score * 0.4,
          recommendation_reason: `하이브리드: ${rec.recommendation_reason}`,
          strategy_used: 'hybrid'
        });
      }
    });

    return Array.from(hybridScores.values())
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Error in hybrid recommendations:', error);
    return await getContentBasedRecommendations(userId, userProfile, limit);
  }
}

// 4. 트렌딩 추천
async function getTrendingRecommendations(limit: number): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 최근 7일간의 인기 아이디어 (좋아요, 북마크, PRD 생성 기준)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trendingData, error } = await supabase
      .from('user_behaviors')
      .select(`
        idea_id,
        action_type,
        created_at,
        ideas!inner(
          id, title, content, category, subreddit,
          created_at, collected_at, url, author
        )
      `)
      .eq('ideas.is_public', true)
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('action_type', ['like', 'bookmark', 'generate_prd'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 트렌딩 스코어 계산
    const trendingScores = new Map<string, { 
      idea: any; 
      likes: number; 
      bookmarks: number; 
      prds: number; 
      totalScore: number; 
    }>();

    trendingData?.forEach(item => {
      const ideaId = item.idea_id;
      const idea = item.ideas;
      
      if (!trendingScores.has(ideaId)) {
        trendingScores.set(ideaId, {
          idea,
          likes: 0,
          bookmarks: 0,
          prds: 0,
          totalScore: 0
        });
      }

      const trend = trendingScores.get(ideaId)!;
      
      switch (item.action_type) {
        case 'like':
          trend.likes += 1;
          trend.totalScore += 1;
          break;
        case 'bookmark':
          trend.bookmarks += 1;
          trend.totalScore += 2; // 북마크는 더 높은 가중치
          break;
        case 'generate_prd':
          trend.prds += 1;
          trend.totalScore += 3; // PRD 생성은 가장 높은 가중치
          break;
      }
    });

    return Array.from(trendingScores.entries())
      .sort(([, a], [, b]) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map(([, trend]): AdvancedRecommendedIdea => ({
        ...trend.idea,
        recommendation_score: Math.min(trend.totalScore / 10, 1.0),
        recommendation_reason: `최근 7일 인기: 좋아요 ${trend.likes}개, 북마크 ${trend.bookmarks}개, PRD ${trend.prds}개`,
        confidence_level: Math.min(trend.totalScore / 15, 1.0),
        strategy_used: 'trending'
      }));

  } catch (error) {
    console.error('❌ Error in trending recommendations:', error);
    return [];
  }
}

// 5. 개인화된 트렌딩 추천
async function getPersonalizedTrendingRecommendations(
  _userId: string,
  userProfile: UserPreferenceVector | null,
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    const trendingRecs = await getTrendingRecommendations(limit * 3);
    
    if (!userProfile) {
      return trendingRecs.slice(0, limit);
    }

    // 트렌딩 아이템에 개인화 스코어 적용
    const personalizedTrending = trendingRecs.map(rec => {
      let personalScore = rec.recommendation_score;

      // 카테고리 선호도 적용
      if (userProfile.category_weights[rec.category]) {
        personalScore *= (1 + userProfile.category_weights[rec.category] * 0.5);
      }

      // 서브레딧 선호도 적용 (태그 역할)
      if (rec.subreddit && userProfile.tag_preferences[rec.subreddit]) {
        const tagBonus = userProfile.tag_preferences[rec.subreddit] * 0.1;
        personalScore *= (1 + tagBonus);
      }

      return {
        ...rec,
        recommendation_score: Math.min(personalScore, 1.0),
        recommendation_reason: `개인화된 트렌딩: ${rec.recommendation_reason}`,
        strategy_used: 'personalized_trending' as RecommendationStrategy
      };
    });

    return personalizedTrending
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Error in personalized trending:', error);
    return await getTrendingRecommendations(limit);
  }
}

// 6. 다양성 최대화 추천 (MMR - Maximal Marginal Relevance)
async function getDiversityMaximizingRecommendations(
  userId: string,
  userProfile: UserPreferenceVector | null,
  limit: number,
  diversityWeight: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 초기 후보군 생성 (하이브리드 방식으로)
    const userBehaviors = await getUserBehaviors(userId, 50);
    const candidateRecs = await getHybridRecommendations(
      userId, 
      userProfile, 
      userBehaviors, 
      limit * 5 // 더 많은 후보군
    );

    if (candidateRecs.length <= limit) {
      return candidateRecs;
    }

    // MMR 알고리즘 적용
    const selectedRecs: AdvancedRecommendedIdea[] = [];
    const remainingRecs = [...candidateRecs];

    // 첫 번째 아이템: 가장 높은 점수
    selectedRecs.push(remainingRecs.shift()!);

    while (selectedRecs.length < limit && remainingRecs.length > 0) {
      let bestIndex = 0;
      let bestMMRScore = -1;

      remainingRecs.forEach((candidate, index) => {
        // 관련성 점수 (relevance)
        const relevanceScore = candidate.recommendation_score;

        // 다양성 점수 (diversity): 이미 선택된 아이템들과의 차이점
        let diversityScore = 0;
        selectedRecs.forEach(selected => {
          diversityScore += calculateDiversity(candidate, selected);
        });
        diversityScore /= selectedRecs.length;

        // MMR 점수 = λ * 관련성 + (1-λ) * 다양성
        const mmrScore = diversityWeight * relevanceScore + (1 - diversityWeight) * diversityScore;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestIndex = index;
        }
      });

      const selectedItem = remainingRecs.splice(bestIndex, 1)[0];
      selectedItem.recommendation_reason += ' (다양성 고려)';
      selectedItem.strategy_used = 'diversity_maximizing';
      selectedRecs.push(selectedItem);
    }

    return selectedRecs;

  } catch (error) {
    console.error('❌ Error in diversity maximizing:', error);
    return await getHybridRecommendations(userId, userProfile, [], limit);
  }
}

// 7. 세렌디피티 추천 (우연한 발견)
async function getSerendipityRecommendations(
  userId: string,
  _userProfile: UserPreferenceVector | null,
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    // 사용자가 평소에 관심 없던 카테고리/태그에서 고품질 아이디어 찾기
    const userBehaviors = await getUserBehaviors(userId, 100);
    const interactedCategories = new Set(
      userBehaviors.map(b => b.metadata?.category).filter(Boolean)
    );
    const interactedSubreddits = new Set(
      userBehaviors.map(b => b.metadata?.subreddit).filter(Boolean)
    );

    // 평소 관심 없던 카테고리에서 높은 품질의 아이디어 찾기
    const { data: serendipityIdeas, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('is_public', true)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const serendipityRecs: AdvancedRecommendedIdea[] = [];

    serendipityIdeas?.forEach(idea => {
      // 새로운 카테고리인지 확인
      const isNewCategory = !interactedCategories.has(idea.category);
      
      // 새로운 서브레딧인지 확인
      const isNewSubreddit = idea.subreddit && !interactedSubreddits.has(idea.subreddit) ? 1 : 0;
      
      // 세렌디피티 스코어 계산
      let serendipityScore = 0;
      
      if (isNewCategory) {
        serendipityScore += 0.6;
      }
      
      serendipityScore += isNewSubreddit * 0.4;

      // 아이디어 품질 지표 (좋아요, 북마크 수 등)로 필터링
      const qualityScore = calculateIdeaQuality(idea);
      
      if (serendipityScore > 0.3 && qualityScore > 0.5) {
        serendipityRecs.push({
          ...idea,
          recommendation_score: serendipityScore * qualityScore,
          recommendation_reason: `새로운 발견: ${isNewCategory ? `새로운 카테고리 ${idea.category}` : ''} ${newTagsCount > 0 ? `새로운 태그 ${newTagsCount}개` : ''}`,
          confidence_level: qualityScore,
          strategy_used: 'serendipity'
        });
      }
    });

    return serendipityRecs
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ Error in serendipity recommendations:', error);
    return [];
  }
}

// 보조 함수들

async function getUserProfile(userId: string): Promise<UserPreferenceVector | null> {
  try {
    const { data, error } = await supabase
      .from('user_preference_vectors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

async function getUserBehaviors(userId: string, limit: number): Promise<UserBehavior[]> {
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
    console.error('❌ Error fetching user behaviors:', error);
    return [];
  }
}

async function findSimilarUsers(
  userId: string, 
  userBehaviors: UserBehavior[]
): Promise<{ user_id: string; similarity: number }[]> {
  try {
    if (userBehaviors.length === 0) return [];

    const userIdeaIds = userBehaviors.map(b => b.idea_id);
    
    // 같은 아이디어에 관심을 보인 다른 사용자들 찾기
    const { data, error } = await supabase
      .from('user_behaviors')
      .select('user_id, idea_id, action_type')
      .in('idea_id', userIdeaIds)
      .neq('user_id', userId)
      .in('action_type', ['like', 'bookmark', 'generate_prd']);

    if (error) throw error;

    // 자카드 유사도 계산
    const userSimilarities = new Map<string, number>();
    
    data?.forEach(behavior => {
      const otherUserId = behavior.user_id;
      if (!userSimilarities.has(otherUserId)) {
        userSimilarities.set(otherUserId, 0);
      }
      userSimilarities.set(otherUserId, userSimilarities.get(otherUserId)! + 1);
    });

    // 유사도 정규화 및 정렬
    return Array.from(userSimilarities.entries())
      .map(([user_id, commonInterests]) => ({
        user_id,
        similarity: commonInterests / userBehaviors.length
      }))
      .filter(u => u.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

  } catch (error) {
    console.error('❌ Error finding similar users:', error);
    return [];
  }
}

async function calculateUserPreferences(userId: string): Promise<UserPreferenceVector | null> {
  try {
    const userBehaviors = await getUserBehaviors(userId, 100);
    
    if (userBehaviors.length === 0) return null;

    const categoryWeights: Record<string, number> = {};
    const tagPreferences: Record<string, number> = {};
    let totalInteractions = 0;

    // 행동 데이터에서 선호도 추출
    userBehaviors.forEach(behavior => {
      const weight = getActionWeight(behavior.action_type);
      totalInteractions += weight;

      // 카테고리 선호도
      const category = behavior.metadata?.category;
      if (category) {
        categoryWeights[category] = (categoryWeights[category] || 0) + weight;
      }

      // 서브레딧 선호도 (태그 역할)
      const subreddit = behavior.metadata?.subreddit;
      if (subreddit) {
        tagPreferences[subreddit] = (tagPreferences[subreddit] || 0) + weight;
      }
    });

    // 정규화
    Object.keys(categoryWeights).forEach(category => {
      categoryWeights[category] /= totalInteractions;
    });

    Object.keys(tagPreferences).forEach(tag => {
      tagPreferences[tag] /= totalInteractions;
    });

    const preferences: UserPreferenceVector = {
      user_id: userId,
      category_weights: categoryWeights,
      tag_preferences: tagPreferences,
      complexity_preference: 0.5, // 기본값
      novelty_preference: 0.5, // 기본값
      interaction_frequency: userBehaviors.length,
      last_updated: new Date().toISOString()
    };

    // 데이터베이스에 저장
    await supabase
      .from('user_preference_vectors')
      .upsert(preferences);

    return preferences;

  } catch (error) {
    console.error('❌ Error calculating user preferences:', error);
    return null;
  }
}

function getActionWeight(actionType: string): number {
  switch (actionType) {
    case 'view': return 1;
    case 'like': return 3;
    case 'bookmark': return 4;
    case 'generate_prd': return 5;
    case 'share': return 4;
    case 'copy': return 3;
    default: return 1;
  }
}

function calculateDiversity(idea1: AdvancedRecommendedIdea, idea2: AdvancedRecommendedIdea): number {
  let diversity = 0;

  // 카테고리 다양성
  if (idea1.category !== idea2.category) {
    diversity += 0.4;
  }

  // 서브레딧 다양성
  const subreddit1 = idea1.subreddit;
  const subreddit2 = idea2.subreddit;
  
  if (subreddit1 && subreddit2) {
    const subredditDiversity = subreddit1 !== subreddit2 ? 1 : 0;
    diversity += subredditDiversity * 0.3;
  }

  // 생성 시간 다양성
  const time1 = new Date(idea1.created_at || Date.now()).getTime();
  const time2 = new Date(idea2.created_at || Date.now()).getTime();
  const timeDiff = Math.abs(time1 - time2);
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  const timeDiversity = Math.min(daysDiff / 30, 1); // 최대 30일
  diversity += timeDiversity * 0.3;

  return diversity;
}

function calculateIdeaQuality(idea: any): number {
  let quality = 0.5; // 기본 품질

  // 메타데이터에서 품질 지표 추출
  const metadata = idea.metadata || {};
  
  if (metadata.likes_count) {
    quality += Math.min(metadata.likes_count / 50, 0.3);
  }
  
  if (metadata.bookmarks_count) {
    quality += Math.min(metadata.bookmarks_count / 20, 0.2);
  }

  // 설명의 길이와 품질
  if (idea.description && idea.description.length > 100) {
    quality += 0.1;
  }

  return Math.min(quality, 1.0);
}

async function postProcessRecommendations(
  recommendations: AdvancedRecommendedIdea[],
  _userId: string,
  _strategy: RecommendationStrategy,
  _diversityWeight: number
): Promise<AdvancedRecommendedIdea[]> {
  // 중복 제거
  const uniqueRecs = new Map<string, AdvancedRecommendedIdea>();
  
  recommendations.forEach(rec => {
    if (!uniqueRecs.has(rec.id) || uniqueRecs.get(rec.id)!.recommendation_score < rec.recommendation_score) {
      uniqueRecs.set(rec.id, rec);
    }
  });

  // 사용자가 이미 상호작용한 아이디어 제외
  const userBehaviors = await getUserBehaviors(userId, 1000);
  const interactedIdeaIds = new Set(userBehaviors.map(b => b.idea_id));

  const filteredRecs = Array.from(uniqueRecs.values())
    .filter(rec => !interactedIdeaIds.has(rec.id));

  return filteredRecs;
}

async function trackRecommendationMetrics(
  userId: string,
  strategy: RecommendationStrategy,
  recommendations: AdvancedRecommendedIdea[]
): Promise<void> {
  try {
    await supabase
      .from('recommendation_metrics')
      .insert({
        user_id: userId,
        recommendation_strategy: strategy,
        recommended_idea_ids: recommendations.map(r => r.id),
        timestamp: new Date().toISOString()
      });
  } catch (error) {
    console.error('❌ Error tracking recommendation metrics:', error);
  }
}

async function getFallbackRecommendations(
  userId: string,
  limit: number
): Promise<AdvancedRecommendedIdea[]> {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('is_public', true)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(idea => ({
      ...idea,
      recommendation_score: 0.5,
      recommendation_reason: '기본 추천',
      confidence_level: 0.3,
      strategy_used: 'trending' as RecommendationStrategy
    }));
  } catch (error) {
    console.error('❌ Error in fallback recommendations:', error);
    return [];
  }
}

// 사용자 행동 추적 함수
export async function trackUserBehavior(
  userId: string,
  ideaId: string,
  actionType: UserBehavior['action_type'],
  duration?: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('user_behaviors')
      .insert({
        user_id: userId,
        idea_id: ideaId,
        action_type: actionType,
        duration,
        session_id: generateSessionId(),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });

    // 사용자 선호도 벡터 업데이트 (비동기)
    updateUserPreferenceVector(userId).catch(console.error);
    
  } catch (error) {
    console.error('❌ Error tracking user behavior:', error);
  }
}

async function updateUserPreferenceVector(userId: string): Promise<void> {
  // 사용자 선호도 벡터 재계산 및 업데이트
  const updatedPreferences = await calculateUserPreferences(userId);
  if (updatedPreferences) {
    console.log(`✅ Updated user preferences for user ${userId}`);
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// trackUserBehavior is already exported above