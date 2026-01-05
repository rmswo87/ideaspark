import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  getAdvancedRecommendations, 
  trackUserBehavior,
  RecommendationStrategy,
  AdvancedRecommendedIdea
} from '@/services/advancedRecommendationService';
import { 
  assignUserToExperiment,
  logExperimentPerformance
} from '@/services/recommendationAnalyticsService';
import { IdeaCard } from './IdeaCard';
import { Loader2, Brain, TrendingUp, Shuffle, Eye, RefreshCw } from 'lucide-react';

interface AdvancedRecommendedIdeasProps {
  limit?: number;
  experimentId?: string;
  showStrategySelector?: boolean;
  showExplanations?: boolean;
  className?: string;
}

export const AdvancedRecommendedIdeas: React.FC<AdvancedRecommendedIdeasProps> = ({
  limit = 10,
  experimentId,
  showStrategySelector = false,
  showExplanations = true,
  className = ''
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AdvancedRecommendedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<RecommendationStrategy>('hybrid');
  const [diversityWeight, setDiversityWeight] = useState(0.3);
  const [experimentVariant, setExperimentVariant] = useState<'A' | 'B'>('A');
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // A/B 테스트 실험 변수 할당
  useEffect(() => {
    if (user?.id && experimentId) {
      assignUserToExperiment(user.id, experimentId)
        .then(variant => {
          setExperimentVariant(variant);
          console.log(`🧪 User assigned to experiment variant: ${variant}`);
        })
        .catch(console.error);
    }
  }, [user?.id, experimentId]);

  // 추천 시스템 전략 선택 (A/B 테스트 기반)
  const getEffectiveStrategy = useCallback((): RecommendationStrategy => {
    if (experimentId && experimentVariant === 'B') {
      // 실험군: 새로운 전략 사용
      return 'serendipity';
    }
    return strategy; // 대조군: 기본 전략
  }, [strategy, experimentId, experimentVariant]);

  // 추천 아이디어 로드
  const loadRecommendations = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const effectiveStrategy = getEffectiveStrategy();
      console.log(`🎯 Loading recommendations with strategy: ${effectiveStrategy}`);

      const recs = await getAdvancedRecommendations(
        user.id,
        limit,
        effectiveStrategy,
        diversityWeight
      );

      setRecommendations(recs);

      // A/B 테스트 노출 로깅
      if (experimentId) {
        for (const [index, rec] of recs.entries()) {
          await logExperimentPerformance(
            experimentId,
            user.id,
            experimentVariant,
            'impression',
            rec.id,
            index,
            sessionId,
            { strategy: effectiveStrategy, confidence: rec.confidence_level }
          );
        }
      }

      // 사용자 행동 추적
      await trackUserBehavior(
        user.id,
        'recommendation_view',
        'view',
        undefined,
        { 
          strategy: effectiveStrategy,
          count: recs.length,
          session_id: sessionId,
          experiment_variant: experimentVariant
        }
      );

    } catch (err) {
      console.error('❌ Error loading recommendations:', err);
      setError('추천 아이디어를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, limit, getEffectiveStrategy, diversityWeight, experimentId, experimentVariant, sessionId]);

  // 컴포넌트 마운트 시 추천 로드
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // 아이디어 클릭 처리
  const handleIdeaClick = async (idea: AdvancedRecommendedIdea, index: number) => {
    if (!user?.id) return;

    try {
      // A/B 테스트 클릭 로깅
      if (experimentId) {
        await logExperimentPerformance(
          experimentId,
          user.id,
          experimentVariant,
          'click',
          idea.id,
          index,
          sessionId,
          { 
            recommendation_score: idea.recommendation_score,
            strategy_used: idea.strategy_used 
          }
        );
      }

      // 사용자 행동 추적
      await trackUserBehavior(
        user.id,
        idea.id,
        'click',
        undefined,
        {
          recommendation_score: idea.recommendation_score,
          recommendation_reason: idea.recommendation_reason,
          position: index,
          session_id: sessionId
        }
      );

    } catch (error) {
      console.error('❌ Error tracking click:', error);
    }
  };

  // 아이디어 좋아요 처리
  const handleIdeaLike = async (idea: AdvancedRecommendedIdea, index: number) => {
    if (!user?.id) return;

    try {
      // A/B 테스트 전환 로깅
      if (experimentId) {
        await logExperimentPerformance(
          experimentId,
          user.id,
          experimentVariant,
          'like',
          idea.id,
          index,
          sessionId,
          { conversion_type: 'like' }
        );
      }

      // 사용자 행동 추적
      await trackUserBehavior(
        user.id,
        idea.id,
        'like',
        undefined,
        { 
          recommendation_context: true,
          session_id: sessionId
        }
      );

    } catch (error) {
      console.error('❌ Error tracking like:', error);
    }
  };

  // 전략별 아이콘 및 색상
  const getStrategyIcon = (strategy: RecommendationStrategy) => {
    switch (strategy) {
      case 'collaborative': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'content_based': return <Brain className="w-4 h-4 text-purple-500" />;
      case 'hybrid': return <Shuffle className="w-4 h-4 text-green-500" />;
      case 'trending': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'serendipity': return <Eye className="w-4 h-4 text-pink-500" />;
      default: return <Brain className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStrategyName = (strategy: RecommendationStrategy): string => {
    const names = {
      collaborative: '협업 필터링',
      content_based: '콘텐츠 기반',
      hybrid: '하이브리드',
      trending: '트렌딩',
      personalized_trending: '개인화 트렌딩',
      diversity_maximizing: '다양성 최대화',
      serendipity: '세렌디피티'
    };
    return names[strategy] || strategy;
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500">
        로그인 후 개인화된 추천을 받아보세요.
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 및 컨트롤 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            AI 맞춤 추천
            {experimentId && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                실험 {experimentVariant}
              </span>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* 전략 선택기 */}
          {showStrategySelector && !experimentId && (
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as RecommendationStrategy)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="hybrid">하이브리드</option>
              <option value="collaborative">협업 필터링</option>
              <option value="content_based">콘텐츠 기반</option>
              <option value="trending">트렌딩</option>
              <option value="personalized_trending">개인화 트렌딩</option>
              <option value="diversity_maximizing">다양성 최대화</option>
              <option value="serendipity">세렌디피티</option>
            </select>
          )}

          {/* 다양성 조절기 */}
          {strategy === 'diversity_maximizing' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">다양성:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={diversityWeight}
                onChange={(e) => setDiversityWeight(parseFloat(e.target.value))}
                className="w-16 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-500">{Math.round(diversityWeight * 100)}%</span>
            </div>
          )}

          {/* 새로고침 버튼 */}
          <button
            onClick={loadRecommendations}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>AI가 맞춤 추천을 준비하고 있습니다...</span>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <span className="font-medium">오류</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* 추천 아이디어 리스트 */}
      {!isLoading && !error && recommendations.length > 0 && (
        <div className="space-y-4">
          {/* 전체 전략 설명 */}
          {showExplanations && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                {getStrategyIcon(getEffectiveStrategy())}
                <span className="font-medium text-gray-900">
                  {getStrategyName(getEffectiveStrategy())} 추천
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {getEffectiveStrategy() === 'hybrid' && '콘텐츠 기반 필터링과 협업 필터링을 결합하여 개인화된 추천을 제공합니다.'}
                {getEffectiveStrategy() === 'collaborative' && '비슷한 취향의 사용자들이 좋아한 아이디어를 추천합니다.'}
                {getEffectiveStrategy() === 'content_based' && '당신의 과거 관심사와 유사한 특성의 아이디어를 추천합니다.'}
                {getEffectiveStrategy() === 'trending' && '최근 인기가 높아지고 있는 아이디어들을 추천합니다.'}
                {getEffectiveStrategy() === 'serendipity' && '평소 관심 없던 새로운 영역의 흥미로운 아이디어를 추천합니다.'}
              </p>
            </div>
          )}

          {/* 아이디어 카드 그리드 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((idea, index) => (
              <div key={idea.id} className="relative group">
                {/* 추천 스코어 배지 */}
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 text-xs shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    idea.recommendation_score > 0.8 ? 'bg-green-500' :
                    idea.recommendation_score > 0.6 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-gray-700 font-medium">
                    {Math.round(idea.recommendation_score * 100)}%
                  </span>
                </div>

                {/* 아이디어 카드 */}
                <div 
                  onClick={() => handleIdeaClick(idea, index)}
                  className="cursor-pointer transition-transform group-hover:scale-105"
                >
                  <IdeaCard 
                    idea={idea}
                    onLike={() => handleIdeaLike(idea, index)}
                    showAuthor={true}
                    showStats={true}
                  />
                </div>

                {/* 추천 이유 설명 */}
                {showExplanations && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      {getStrategyIcon(idea.strategy_used)}
                      <span className="text-xs font-medium text-gray-700">
                        추천 이유
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-gray-500">신뢰도:</span>
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${idea.confidence_level * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {idea.recommendation_reason}
                    </p>
                    
                    {/* 유사 아이디어 링크 */}
                    {idea.similar_ideas && idea.similar_ideas.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          관련 아이디어: {idea.similar_ideas.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 더보기 버튼 */}
          {recommendations.length >= limit && (
            <div className="text-center pt-4">
              <button
                onClick={loadRecommendations}
                className="px-6 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                더 많은 추천 보기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 추천 없음 */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            추천할 아이디어가 없습니다
          </h3>
          <p className="text-gray-500 mb-4">
            더 많은 아이디어와 상호작용하시면 더 나은 추천을 받을 수 있습니다.
          </p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && recommendations.length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">디버그 정보</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>전략: {getEffectiveStrategy()}</div>
            <div>추천 수: {recommendations.length}</div>
            <div>평균 스코어: {(recommendations.reduce((sum, r) => sum + r.recommendation_score, 0) / recommendations.length).toFixed(3)}</div>
            <div>평균 신뢰도: {(recommendations.reduce((sum, r) => sum + r.confidence_level, 0) / recommendations.length).toFixed(3)}</div>
            {experimentId && <div>실험 ID: {experimentId} (변수 {experimentVariant})</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRecommendedIdeas;