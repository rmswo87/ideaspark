// 아이디어 카드 컴포넌트
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ExternalLink } from 'lucide-react';
import type { Idea } from '@/services/ideaService';

interface IdeaCardProps {
  idea: Idea;
  onCardClick: () => void;
  formatDate: (dateString: string) => string;
  recommendationReason?: string;
}

export function IdeaCard({ idea, onCardClick, formatDate, recommendationReason }: IdeaCardProps) {

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer w-full max-w-full overflow-hidden"
      onClick={(e) => {
        // 버튼이나 링크 클릭이 아닌 경우에만 상세 페이지로 이동
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onCardClick();
      }}
    >
      <CardHeader className="relative pb-3">
        {recommendationReason && (
          <div className="absolute top-1 left-2 bg-primary/10 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md backdrop-blur-sm z-10 max-w-[calc(100%-1rem)] truncate">
            {recommendationReason}
          </div>
        )}
        <CardTitle className="line-clamp-2 mt-6 sm:mt-8 text-base sm:text-lg break-words">
          {idea.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap">
          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">{idea.author}</span>
          <span>·</span>
          <span className="truncate">r/{idea.subreddit}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="mb-3 sm:mb-4 min-h-[100px] sm:min-h-[140px]">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 leading-relaxed break-words">
            {idea.content}
          </p>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-1.5 sm:p-2 text-[10px] sm:text-xs mt-2">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-0.5 sm:mb-1">
              💡 Chrome 자동 번역 사용하기
            </p>
            <p className="text-blue-800 dark:text-blue-200 text-[10px] sm:text-xs">
              Reddit 페이지에서 우측 상단 번역 아이콘을 클릭하거나 우클릭 → "한국어로 번역"을 선택하세요.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">{idea.collected_at ? formatDate(idea.collected_at) : '날짜 없음'}</span>
            </span>
            <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-secondary rounded-md text-[10px] sm:text-xs whitespace-nowrap">
              {idea.category}
            </span>
            {idea.upvotes > 0 && (
              <span className="text-[10px] sm:text-xs whitespace-nowrap">👍 {idea.upvotes}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={(e) => e.stopPropagation()}
            className="text-xs sm:text-sm px-2 sm:px-3 min-h-[44px] sm:min-h-0"
          >
            <a href={idea.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reddit 열기</span>
            </a>
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs sm:text-sm min-h-[44px] sm:min-h-0"
            onClick={(e) => {
              e.stopPropagation();
              onCardClick();
            }}
          >
            상세 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
