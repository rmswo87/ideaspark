// 아이디어 평가 버튼 컴포넌트
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { scoreIdea, getIdeaScore, type IdeaScore } from '@/services/ideaScoringService';
import { usePremium } from '@/hooks/usePremium';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IdeaScoreCard } from './IdeaScoreCard';
import { PremiumBadge } from './PremiumBadge';

interface IdeaScoringButtonProps {
  ideaId: string;
  onScoreUpdated?: (score: IdeaScore) => void;
}

export function IdeaScoringButton({ ideaId, onScoreUpdated }: IdeaScoringButtonProps) {
  const { isPremium, loading: premiumLoading } = usePremium();
  const { addToast } = useToast();
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<IdeaScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 점수 조회
  const fetchScore = async () => {
    if (!ideaId) return;
    
    setLoadingScore(true);
    try {
      const existingScore = await getIdeaScore(ideaId);
      setScore(existingScore);
    } catch (error) {
      console.error('점수 조회 실패:', error);
    } finally {
      setLoadingScore(false);
    }
  };

  // 다이얼로그 열릴 때 점수 조회
  const handleDialogOpen = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      fetchScore();
    }
  };

  // 아이디어 평가 실행
  const handleScore = async () => {
    if (!isPremium) {
      addToast({
        title: '프리미엄 기능',
        description: '아이디어 평가 기능은 프리미엄 사용자만 사용할 수 있습니다.',
        variant: 'default',
      });
      return;
    }

    setScoring(true);
    try {
      const result = await scoreIdea(ideaId);
      setScore(result);
      if (onScoreUpdated) {
        onScoreUpdated(result);
      }
      addToast({
        title: '평가 완료',
        description: '아이디어 평가가 완료되었습니다.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('평가 실패:', error);
      addToast({
        title: '평가 실패',
        description: error.message || '아이디어 평가 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setScoring(false);
    }
  };

  // 프리미엄 로딩 중이면 아무것도 표시하지 않음
  if (premiumLoading) {
    return null;
  }

  // 프리미엄 사용자가 아니면 버튼 표시하지 않음
  if (!isPremium) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={scoring}
        >
          {scoring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              평가 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI 평가
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            아이디어 AI 평가
            <PremiumBadge className="ml-auto" variant="outline" />
          </DialogTitle>
          <DialogDescription>
            AI가 아이디어의 비타민/경쟁율/섹시함 점수를 평가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 기존 점수 표시 */}
          {loadingScore ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : score ? (
            <IdeaScoreCard score={score} showDetails={true} />
          ) : (
            <div className="p-4 text-center text-muted-foreground border rounded-lg">
              아직 평가되지 않은 아이디어입니다.
            </div>
          )}

          {/* 평가 버튼 */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleScore}
              disabled={scoring}
              className="flex items-center gap-2"
            >
              {scoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  평가 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {score ? '재평가하기' : '평가하기'}
                </>
              )}
            </Button>
          </div>

          {/* 프리미엄 안내 */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-primary mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-primary mb-1">프리미엄 기능</div>
                <div className="text-muted-foreground">
                  아이디어 평가 기능은 프리미엄 사용자만 사용할 수 있습니다.
                  프로필 페이지에서 후원하여 프리미엄 기능을 활성화하세요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

