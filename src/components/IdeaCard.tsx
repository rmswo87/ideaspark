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
      className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm min-w-0 box-border h-full flex flex-col"
      style={{ boxSizing: 'border-box', minHeight: '186px' }}
      onClick={(e) => {
        // 버튼이나 링크 클릭이 아닌 경우에만 상세 페이지로 이동
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onCardClick();
      }}
    >
      <CardHeader className="relative pb-2 space-y-1.5 min-w-0 overflow-hidden pt-3 sm:pt-4">
        {recommendationReason && (
          <div className="absolute top-1.5 left-2 sm:top-2 bg-primary/15 text-primary text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-sm z-10 max-w-[calc(100%-1rem)] truncate border border-primary/20 shadow-sm">
            {recommendationReason}
          </div>
        )}
        <CardTitle className="line-clamp-2 mt-6 sm:mt-8 text-sm sm:text-base break-words group-hover:text-primary transition-colors duration-300 font-semibold min-w-0 overflow-hidden">
          {idea.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm flex-wrap text-muted-foreground/80 min-w-0 overflow-hidden">
          <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 opacity-70" />
          <span className="truncate min-w-0">{idea.author}</span>
          <span className="opacity-50 flex-shrink-0">·</span>
          <span className="truncate text-primary/70 min-w-0">r/{idea.subreddit}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3 min-w-0 overflow-hidden">
        {/* 이미지 표시 */}
        {idea.image_url && (
          <div className="mb-2 sm:mb-3 rounded-lg overflow-hidden">
            <img 
              src={idea.image_url} 
              alt={idea.title}
              className="w-full h-auto max-h-48 sm:max-h-64 object-contain bg-muted"
              loading="lazy"
              onError={(e) => {
                // 이미지 로드 실패 시 숨김
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="mb-2 sm:mb-3 h-[60px] sm:h-[70px] min-w-0 overflow-hidden">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-5 leading-relaxed break-words group-hover:text-foreground/90 transition-colors duration-300 min-w-0 overflow-hidden">
            {idea.content || '내용 없음'}
          </p>
        </div>
        
        <div className="flex items-center justify-between mb-2 sm:mb-3 flex-wrap gap-1.5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap min-w-0 overflow-hidden">
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
        
        <div className="flex gap-2 sm:gap-2.5 min-w-0 overflow-hidden">
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

