// 추천 아이디어 컴포넌트 (Epic 7 Task 7.1)
import { useEffect, useState } from 'react';
import { IdeaCard } from './IdeaCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getRecommendedIdeas, type RecommendedIdea } from '@/services/recommendationService';
import { useAuth } from '@/hooks/useAuth';

interface RecommendedIdeasProps {
  onGeneratePRD?: (ideaId: string) => void;
}

export function RecommendedIdeas({ onGeneratePRD }: RecommendedIdeasProps) {
  const { user } = useAuth();
  const [recommendedIdeas, setRecommendedIdeas] = useState<RecommendedIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Early return으로 user가 null이거나 id가 없으면 종료
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    // 여기서는 user가 확실히 존재하고 id도 존재함
    const userId = user.id;

    async function fetchRecommended() {
      setLoading(true);
      try {
        const ideas = await getRecommendedIdeas(userId, 3); // 3개로 제한
        setRecommendedIdeas(ideas);
      } catch (error) {
        console.error('Error fetching recommended ideas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommended();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return null; // 로그인하지 않은 사용자에게는 표시하지 않음
  }

  if (loading) {
    return (
      <Card className="w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="px-3 sm:px-6 pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span className="min-w-0">이런 아이디어는 어때요?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">추천 아이디어를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (recommendedIdeas.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="px-3 sm:px-6 pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg min-w-0">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="min-w-0 break-words">이런 아이디어는 어때요?</span>
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 min-w-0 break-words">
          당신의 관심사와 비슷한 아이디어를 추천해드립니다
        </p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 w-full max-w-full overflow-x-hidden">
          {recommendedIdeas.map((idea) => {
            const ideaId = idea.id; // TypeScript를 위한 명시적 변수 할당
            return (
              <div key={ideaId || 'unknown'} className="w-full min-w-0 max-w-full" style={{ boxSizing: 'border-box' }}>
                <IdeaCard
                  idea={idea}
                  recommendationReason={idea.recommendation_reason}
                  onCardClick={() => {
                    if (ideaId) {
                      onGeneratePRD?.(ideaId);
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

