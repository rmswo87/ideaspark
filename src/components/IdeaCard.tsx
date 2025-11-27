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
  const [translatedUrl, setTranslatedUrl] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  /**
   * Reddit 번역 페이지 URL 생성
   */
  function getTranslatedUrl(originalUrl: string): string {
    try {
      const url = new URL(originalUrl);
      url.searchParams.set('lang', 'ko');
      return url.toString();
    } catch (error) {
      console.error('Invalid URL:', originalUrl);
      return originalUrl;
    }
  }

  // 컴포넌트 마운트 시 번역된 내용 가져오기
  useEffect(() => {
    async function fetchTranslation() {
      setLoadingTranslation(true);
      try {
        const result = await getTranslatedContent(idea.url);
        setTranslatedTitle(result.title);
        setTranslatedContent(result.content);
        setTranslatedUrl(result.translatedUrl);
      } catch (error) {
        console.error('Failed to fetch translation:', error);
        // 실패 시 번역 URL만 설정
        const url = getTranslatedUrl(idea.url);
        setTranslatedUrl(url);
      } finally {
        setLoadingTranslation(false);
      }
    }

    fetchTranslation();
  }, [idea.url]);

  /**
   * 번역 토글
   */
  function toggleTranslation() {
    setShowTranslation(!showTranslation);
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
              disabled={loadingTranslation}
            >
              {loadingTranslation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : showTranslation ? (
                '원문 보기'
              ) : (
                '번역 보기'
              )}
            </Button>
          </div>
          
          {showTranslation ? (
            <div className="space-y-2">
              {loadingTranslation ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">번역 중...</span>
                </div>
              ) : translatedContent ? (
                <>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                    {translatedContent}
                  </p>
                  {translatedUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={translatedUrl} target="_blank" rel="noopener noreferrer">
                        번역 페이지 전체 보기 →
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                    번역된 내용을 불러올 수 없습니다. 번역 페이지를 직접 확인해주세요.
                  </p>
                  {translatedUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={translatedUrl} target="_blank" rel="noopener noreferrer">
                        번역 페이지 열기 →
                      </a>
                    </Button>
                  )}
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
            {showTranslation ? '원문 보기' : '번역 보기'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={idea.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              원문 보기
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
            PRD 생성
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
