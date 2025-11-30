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
      className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm"
      onClick={(e) => {
        // 버튼이나 링크 클릭이 아닌 경우에만 상세 페이지로 이동
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onCardClick();
      }}
    >
      <CardHeader className="relative pb-3 space-y-2">
        {recommendationReason && (
          <div className="absolute top-2 left-3 bg-primary/15 text-primary text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full backdrop-blur-sm z-10 max-w-[calc(100%-1rem)] truncate border border-primary/20 shadow-sm">
            {recommendationReason}
          </div>
        )}
        <CardTitle className="line-clamp-2 mt-6 sm:mt-8 text-base sm:text-lg break-words group-hover:text-primary transition-colors duration-300 font-semibold">
          {idea.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap text-muted-foreground/80">
          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 opacity-70" />
          <span className="truncate">{idea.author}</span>
          <span className="opacity-50">·</span>
          <span className="truncate text-primary/70">r/{idea.subreddit}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="mb-3 sm:mb-4 min-h-[100px] sm:min-h-[140px]">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-4 leading-relaxed break-words group-hover:text-foreground/90 transition-colors duration-300">
            {idea.content}
          </p>
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-2 sm:p-2.5 text-[10px] sm:text-xs mt-3 shadow-sm">
            <p className="font-medium text-primary mb-1 sm:mb-1.5 flex items-center gap-1.5">
              <span>💡</span>
              <span>Chrome 자동 번역 사용하기</span>
            </p>
            <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
              Reddit 페이지에서 우측 상단 번역 아이콘을 클릭하거나 우클릭 → "한국어로 번역"을 선택하세요.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5 opacity-70">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">{idea.collected_at ? formatDate(idea.collected_at) : '날짜 없음'}</span>
            </span>
            <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs whitespace-nowrap font-medium border border-primary/20">
              {idea.category}
            </span>
            {idea.upvotes > 0 && (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap bg-secondary/50 px-2 py-1 rounded-full">
                <span>👍</span>
                <span className="font-medium">{idea.upvotes}</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={(e) => e.stopPropagation()}
            className="text-xs sm:text-sm px-3 sm:px-4 min-h-[44px] sm:min-h-0 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
          >
            <a href={idea.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reddit 열기</span>
            </a>
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs sm:text-sm min-h-[44px] sm:min-h-0 bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-300"
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
