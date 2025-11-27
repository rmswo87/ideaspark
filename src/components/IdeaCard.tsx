// 아이디어 카드 컴포넌트
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ExternalLink } from 'lucide-react';
import type { Idea } from '@/services/ideaService';

interface IdeaCardProps {
  idea: Idea;
  onCardClick: () => void;
  formatDate: (dateString: string) => string;
}

export function IdeaCard({ idea, onCardClick, formatDate }: IdeaCardProps) {

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={(e) => {
        // 버튼이나 링크 클릭이 아닌 경우에만 상세 페이지로 이동
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        onCardClick();
      }}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">
          {idea.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{idea.author}</span>
          <span>·</span>
          <span>r/{idea.subreddit}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 min-h-[140px]">
          <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
            {idea.content}
          </p>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2 text-xs mt-2">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              💡 Chrome 자동 번역 사용하기
            </p>
            <p className="text-blue-800 dark:text-blue-200 text-xs">
              Reddit 페이지에서 우측 상단 번역 아이콘을 클릭하거나 우클릭 → "한국어로 번역"을 선택하세요.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {idea.collected_at ? formatDate(idea.collected_at) : '날짜 없음'}
            </span>
            <span className="px-2 py-1 bg-secondary rounded-md text-xs">
              {idea.category}
            </span>
            {idea.upvotes > 0 && (
              <span className="text-xs">👍 {idea.upvotes}</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={idea.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Reddit 열기
            </a>
          </Button>
          <Button
            size="sm"
            className="flex-1"
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
