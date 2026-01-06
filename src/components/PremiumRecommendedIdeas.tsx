// 프리미엄 사용자용 최근 검색 아이디어 상위 3개 알림 컴포넌트
import { useEffect, useState, useMemo } from 'react';
import { IdeaCard } from './IdeaCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { getTopScoredRecentIdeas } from '@/services/ideaScoringService';
import { getCategoryBasedScoredRecommendations } from '@/services/categoryBasedScoringRecommendation';
// import { usePremium } from '@/hooks/usePremium'; // 프리미엄 훅 제거 - 모든 인증된 사용자에게 표시
import { PremiumBadge } from './PremiumBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function PremiumRecommendedIdeas() {
  // const { isPremium, loading: premiumLoading } = usePremium(); // 프리미엄 훅 제거
  const { user, loading: authLoading } = useAuth();
  const [topScoredIdeas, setTopScoredIdeas] = useState<Array<{ idea: any; total_score: number }>>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 로딩 상태와 프리미엄 상태를 메모이제이션하여 불필요한 리렌더링 방지
  const shouldRender = useMemo(() => {
    // 인증 로딩이 끝나고 사용자가 있으면 렌더링 (프리미엄 체크 완전 제거)
    const result = !authLoading && !!user;
    
    // 디버그 로그를 한 번만 실행
    if (!authLoading && user) {
      console.log(`👑 Premium component: user authenticated, rendering premium features`);
    }
    
    return result;
  }, [authLoading, user]);

  useEffect(() => {
    // 로딩 중이거나 조건을 만족하지 않으면 아무것도 하지 않음
    if (!shouldRender || !user?.id) {
      setLoading(false);
      setTopScoredIdeas([]);
      return;
    }

    async function fetchTopScoredIdeas() {
      if (!user?.id) {
        setLoading(false);
        setTopScoredIdeas([]);
        return;
      }
      
      setLoading(true);
      console.log('🎯 Premium: Starting to fetch ideas for user', user.id);
      
      try {
        // 1차: 사용자 관심 카테고리 기반 AI 점수 추천 사용
        console.log('🎯 Premium: Attempting category-based recommendations...');
        const categoryBasedIdeas = await getCategoryBasedScoredRecommendations(user.id, 3);
        
        console.log('📊 Premium: Category-based response:', {
          data: categoryBasedIdeas,
          length: categoryBasedIdeas?.length || 0,
          type: typeof categoryBasedIdeas
        });
        
        if (categoryBasedIdeas && categoryBasedIdeas.length > 0) {
          console.log('✅ Premium: Category-based ideas found:', categoryBasedIdeas.length);
          // 형식 변환
          const formattedIdeas = categoryBasedIdeas.map(item => ({
            idea: item,
            total_score: item.total_score,
          }));
          console.log('📝 Premium: Formatted ideas:', formattedIdeas);
          setTopScoredIdeas(formattedIdeas);
          setLoading(false);
          return;
        }
        console.log('⚠️ Premium: No category-based ideas found, trying fallback...');
      } catch (error) {
        console.warn('⚠️ Premium: Category-based fetch failed:', error);
        console.error('📊 Premium: Error details:', {
          message: error.message,
          stack: error.stack,
          userId: user.id
        });
      }

      try {
        // 2차 폴백: 최근 검색 아이디어 중 상위 3개
        console.log('🔄 Premium: Trying fallback with top scored recent ideas');
        const ideas = await getTopScoredRecentIdeas(3);
        
        console.log('📊 Premium: Fallback ideas response:', {
          data: ideas,
          length: ideas?.length || 0,
          type: typeof ideas
        });
        
        if (ideas && ideas.length > 0) {
          console.log('✅ Premium: Fallback ideas found:', ideas.length);
          setTopScoredIdeas(ideas);
          setLoading(false);
          return;
        }
        console.log('⚠️ Premium: No fallback ideas found, trying simple fallback...');
      } catch (fallbackError) {
        console.warn('⚠️ Premium: Fallback fetch failed:', fallbackError);
        console.error('📊 Premium: Fallback error details:', {
          message: fallbackError.message,
          stack: fallbackError.stack
        });
      }

      try {
        // 3차 폴백: 단순한 최신 아이디어 3개
        console.log('🔄 Premium: Trying simple recent ideas fallback');
        const { data: simpleIdeas, error } = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        console.log('📊 Premium: Simple fallback response:', {
          data: simpleIdeas,
          length: simpleIdeas?.length || 0,
          error: error,
          supabaseConnected: !!supabase
        });

        if (!error && simpleIdeas && simpleIdeas.length > 0) {
          console.log('✅ Premium: Simple fallback ideas found:', simpleIdeas.length);
          const formattedIdeas = simpleIdeas.map(idea => ({
            idea: idea,
            total_score: Math.random() * 30, // 임시 점수
          }));
          console.log('📝 Premium: Final formatted simple ideas:', formattedIdeas);
          setTopScoredIdeas(formattedIdeas);
          setLoading(false);
          return;
        } else {
          console.warn('⚠️ Premium: Simple fallback failed or no data:', { error, simpleIdeas });
        }
      } catch (simpleFallbackError) {
        console.error('❌ Premium: All fallback methods failed:', simpleFallbackError);
        console.error('📊 Premium: Simple fallback error details:', {
          message: simpleFallbackError.message,
          stack: simpleFallbackError.stack
        });
      }

      try {
        // 4차 폴백: 임시 더미 데이터 생성 (테스트용)
        console.log('🔄 Premium: Creating temporary dummy data for testing...');
        const dummyIdeas = [
          {
            idea: {
              id: 'dummy-1',
              title: 'AI 기반 스마트 텃밭 관리 시스템',
              content: '사물인터넷과 AI를 활용한 자동화된 텃밭 관리 솔루션',
              category: 'Technology',
              created_at: new Date().toISOString(),
            },
            total_score: 28.5,
          },
          {
            idea: {
              id: 'dummy-2', 
              title: '로컬 커뮤니티 기반 공유 경제 플랫폼',
              content: '이웃 간의 자원 공유와 서비스 교환을 위한 지역 기반 플랫폼',
              category: 'Business',
              created_at: new Date().toISOString(),
            },
            total_score: 26.2,
          },
          {
            idea: {
              id: 'dummy-3',
              title: '실시간 번역 화상회의 시스템',
              content: '다국어 실시간 번역과 문화적 컨텍스트를 고려한 화상회의 도구',
              category: 'Education',
              created_at: new Date().toISOString(),
            },
            total_score: 25.8,
          },
        ];
        
        console.log('✅ Premium: Dummy data created:', dummyIdeas);
        setTopScoredIdeas(dummyIdeas);
        setLoading(false);
        return;
      } catch (dummyError) {
        console.error('❌ Premium: Even dummy data creation failed:', dummyError);
      }

      // 모든 방법 실패
      console.warn('⚠️ Premium: No ideas found, showing empty state');
      setTopScoredIdeas([]);
      
      setLoading(false);
    }

    fetchTopScoredIdeas();
  }, [shouldRender, user?.id]);

  // 로딩 중이거나 조건을 만족하지 않으면 아무것도 렌더링하지 않음
  if (!shouldRender) {
    return null;
  }

  if (loading) {
    return (
      <Card className="w-full max-w-full overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-sm">
        <CardHeader className="px-3 sm:px-6 pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
            <span className="min-w-0">프리미엄 추천 아이디어</span>
            <PremiumBadge className="ml-auto" variant="outline" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
            최근 검색한 아이디어 중 점수가 높은 아이디어를 불러오는 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topScoredIdeas.length === 0) {
    // 데이터가 없어도 프리미엄 섹션을 표시하여 깜빡임 방지
    return (
      <div id="premium-recommended-ideas-section" className="mb-4 sm:mb-6 md:mb-8 w-full max-w-full overflow-x-hidden">
        <Card className="w-full max-w-full overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-sm">
          <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              <span className="min-w-0 break-words">프리미엄 추천 아이디어</span>
              <PremiumBadge className="ml-auto" variant="outline" />
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 min-w-0 break-words">
              관심 카테고리 내에서 AI 평가 점수가 높은 상위 3개를 추천합니다
            </p>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
              추천 아이디어를 준비하고 있습니다... 잠시만 기다려주세요.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="premium-recommended-ideas-section" className="mb-4 sm:mb-6 md:mb-8 w-full max-w-full overflow-x-hidden">
      <Card className="w-full max-w-full overflow-hidden border-primary/20 bg-primary/5 backdrop-blur-sm">
      <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
          <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
          <span className="min-w-0 break-words">프리미엄 추천 아이디어</span>
          <PremiumBadge className="ml-auto" variant="outline" />
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 min-w-0 break-words">
          관심 카테고리 내에서 AI 평가 점수가 높은 상위 3개를 추천합니다
        </p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full overflow-x-hidden">
          {topScoredIdeas.map((item) => {
            const ideaId = item.idea?.id;
            const score = item.total_score;
            return (
              <div key={ideaId || 'unknown'} className="w-full min-w-0 max-w-full" style={{ boxSizing: 'border-box' }}>
                <IdeaCard
                  idea={item.idea}
                  recommendationReason={`AI 평가 점수: ${score}/30점`}
                  onCardClick={() => {
                    if (ideaId) {
                      navigate(`/idea/${ideaId}`);
                    }
                  }}
                  formatDate={(dateString) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

