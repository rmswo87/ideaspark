// 아이디어 카드 컴포넌트 (번역 기능 포함)
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ExternalLink, Languages, Loader2 } from 'lucide-react';
import type { Idea } from '@/services/ideaService';
import { getTranslatedContent } from '@/services/translationService';

interface IdeaCardProps {
  idea: Idea;
  onCardClick: () => void;
  formatDate: (dateString: string) => string;
}

export function IdeaCard({ idea, onCardClick, formatDate }: IdeaCardProps) {
  const [showTranslation, setShowTranslation] = useState(true); // 기본적으로 번역 모드
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(true); // 초기 로딩 상태

  // 컴포넌트 마운트 시 번역된 내용 가져오기 (한 번만 시도)
  useEffect(() => {
    let isMounted = true;
    
    async function fetchTranslation() {
      // 컴포넌트가 이미 언마운트되었으면 번역 시도하지 않음
      if (!isMounted) return;
      
      setIsTranslating(true);
      
      try {
        // 제목과 내용을 번역
        const result = await getTranslatedContent(idea.url, idea.title, idea.content);
        
        // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
        if (!isMounted) return;
        
        // 번역 결과 설정
        // 번역이 성공한 경우 번역된 텍스트 사용, 실패한 경우 null로 설정하여 원문 표시
        if (result.success) {
          // 번역 성공: 번역된 텍스트 사용
          setTranslatedTitle(result.title);
          setTranslatedContent(result.content);
        } else {
          // 번역 실패: null로 설정하여 UI에서 원문 표시
          setTranslatedTitle(null);
          setTranslatedContent(null);
        }
      } catch (error) {
        // 컴포넌트가 언마운트되었으면 에러 처리하지 않음
        if (!isMounted) return;
        
        // 개발 환경에서만 에러 로그 출력
        if (import.meta.env.DEV) {
          console.debug('Translation unavailable for this idea');
        }
        // 실패 시 원본 사용
        setTranslatedTitle(null);
        setTranslatedContent(null);
      } finally {
        // 컴포넌트가 마운트되어 있을 때만 상태 업데이트
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    }

    fetchTranslation();
    
    return () => {
      isMounted = false;
    };
  }, [idea.id]); // idea.id만 의존성으로 사용하여 같은 아이디어에 대해 재시도 방지

  /**
   * 번역 토글
   */
  function toggleTranslation() {
    setShowTranslation(!showTranslation);
  }

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
          {showTranslation && translatedTitle ? translatedTitle : idea.title}
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">
              {showTranslation ? (
                <span className="text-primary">번역된 내용</span>
              ) : (
                <span className="text-muted-foreground">원문</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleTranslation();
              }}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : showTranslation ? (
                '원문'
              ) : (
                '번역'
              )}
            </Button>
          </div>
          
          {showTranslation ? (
            <div className="space-y-2">
              {isTranslating ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">번역 중...</span>
                </div>
              ) : translatedContent ? (
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                  {translatedContent}
                </p>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
              {idea.content}
            </p>
          )}
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
            onClick={(e) => {
              e.stopPropagation();
              toggleTranslation();
            }}
          >
            <Languages className="h-4 w-4 mr-2" />
            {showTranslation ? '원문' : '번역'}
          </Button>
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
