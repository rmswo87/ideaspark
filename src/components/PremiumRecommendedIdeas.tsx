// 프리미엄 사용자용 최근 검색 아이디어 상위 3개 알림 컴포넌트
import { useEffect, useState } from 'react';
import { IdeaCard } from './IdeaCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Crown } from 'lucide-react';
import { getTopScoredRecentIdeas } from '@/services/ideaScoringService';
import { getCategoryBasedScoredRecommendations } from '@/services/categoryBasedScoringRecommendation';
import { usePremium } from '@/hooks/usePremium';
import { PremiumBadge } from './PremiumBadge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function PremiumRecommendedIdeas() {
  const { isPremium, loading: premiumLoading } = usePremium();
  const { user, loading: authLoading } = useAuth();
  const [topScoredIdeas, setTopScoredIdeas] = useState<Array<{ idea: any; total_score: number }>>([]);
  const [loading, setLoading] = useState(false); // 초기값을 false로 설정
  const navigate = useNavigate();

  useEffect(() => {
    // premiumLoading이나 authLoading이 true이거나 user가 없으면 아무것도 하지 않음
    if (premiumLoading || authLoading || !user) {
      setLoading(false);
      setTopScoredIdeas([]);
      return;
    }
    
    if (!isPremium) {
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
      try {
        // 사용자 관심 카테고리 기반 AI 점수 추천 사용
        const categoryBasedIdeas = await getCategoryBasedScoredRecommendations(user.id, 3);
        
        // 형식 변환
        const formattedIdeas = categoryBasedIdeas.map(item => ({
          idea: item,
          total_score: item.total_score,
        }));
        
        setTopScoredIdeas(formattedIdeas);
      } catch (error) {
        console.error('Error fetching category-based scored ideas:', error);
        // 폴백: 최근 검색 아이디어 중 상위 3개
        try {
          const ideas = await getTopScoredRecentIdeas(3);
          setTopScoredIdeas(ideas);
        } catch (fallbackError) {
          console.error('Error fetching fallback ideas:', fallbackError);
          setTopScoredIdeas([]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTopScoredIdeas();
  }, [isPremium, premiumLoading, user, authLoading]);

  // premiumLoading이나 authLoading이 true이거나 user가 없거나 프리미엄 사용자가 아니면 표시하지 않음
  if (premiumLoading || authLoading || !user || !isPremium) {
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
    return null;
  }

  return (
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
  );
}

