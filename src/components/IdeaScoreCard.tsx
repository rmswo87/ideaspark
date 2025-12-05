// 아이디어 점수 표시 컴포넌트
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Target, Zap } from 'lucide-react';
import type { IdeaScore } from '@/services/ideaScoringService';

interface IdeaScoreCardProps {
  score: IdeaScore;
  showDetails?: boolean;
}

export function IdeaScoreCard({ score, showDetails = true }: IdeaScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-blue-600 dark:text-blue-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getDifficultyColor = (level: string | null) => {
    if (level === '하') return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (level === '중') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    if (level === '상') return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
  };

  const getTotalScoreColor = (total: number) => {
    if (total >= 24) return 'text-green-600 dark:text-green-400';
    if (total >= 18) return 'text-blue-600 dark:text-blue-400';
    if (total >= 12) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI 평가 점수
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총점 */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-semibold">총점</span>
          </div>
          <span className={`text-2xl font-bold ${getTotalScoreColor(score.total_score)}`}>
            {score.total_score} / 30
          </span>
        </div>

        {/* 세부 점수 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 비타민 점수 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">비타민/약</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(score.vitamin_score || 0)}`}>
              {score.vitamin_score ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">필요성</div>
          </div>

          {/* 경쟁율 점수 */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">경쟁율</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(score.competition_score || 0)}`}>
              {score.competition_score ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">차별화</div>
          </div>

          {/* 섹시함 점수 */}
          <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-medium text-pink-900 dark:text-pink-100">섹시함</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(score.sexiness_score || 0)}`}>
              {score.sexiness_score ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">매력도</div>
          </div>
        </div>

        {/* 난이도 */}
        {score.difficulty_level && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">업무 난이도:</span>
            <Badge className={getDifficultyColor(score.difficulty_level)}>
              {score.difficulty_level}
            </Badge>
          </div>
        )}

        {/* AI 분석 상세 */}
        {showDetails && score.ai_analysis && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm font-medium mb-2">AI 분석 요약</div>
            {score.ai_analysis.summary && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {score.ai_analysis.summary}
              </p>
            )}
            {!score.ai_analysis.summary && (
              <div className="space-y-2 text-xs text-muted-foreground">
                {score.ai_analysis.vitamin_reason && (
                  <div>
                    <span className="font-medium text-blue-600 dark:text-blue-400">비타민:</span>{' '}
                    {score.ai_analysis.vitamin_reason}
                  </div>
                )}
                {score.ai_analysis.competition_reason && (
                  <div>
                    <span className="font-medium text-purple-600 dark:text-purple-400">경쟁율:</span>{' '}
                    {score.ai_analysis.competition_reason}
                  </div>
                )}
                {score.ai_analysis.sexiness_reason && (
                  <div>
                    <span className="font-medium text-pink-600 dark:text-pink-400">섹시함:</span>{' '}
                    {score.ai_analysis.sexiness_reason}
                  </div>
                )}
                {score.ai_analysis.difficulty_reason && (
                  <div>
                    <span className="font-medium">난이도:</span> {score.ai_analysis.difficulty_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 추천 여부 */}
        {score.is_recommended && score.recommended_at && (
          <div className="mt-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">추천 아이디어</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {new Date(score.recommended_at).toLocaleDateString('ko-KR')}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

