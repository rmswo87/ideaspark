// 개발 소식 피드 페이지 (릴스/인스타그램 스타일)
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Tag, 
  ChevronUp, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { getDailyDevNews, getWeeklyDevNews, getMonthlyDevNews, type DevNews } from '@/services/devNewsService';

export function DevNewsFeedPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [news, setNews] = useState<DevNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  useEffect(() => {
    fetchNews();
  }, [activeTab]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      let data: DevNews[] = [];
      switch (activeTab) {
        case 'daily':
          data = await getDailyDevNews(50);
          break;
        case 'weekly':
          data = await getWeeklyDevNews(50);
          break;
        case 'monthly':
          data = await getMonthlyDevNews(50);
          break;
      }
      setNews(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching dev news:', error);
    } finally {
      setLoading(false);
    }
  };

  // 터치 스와이프 처리
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50; // 스와이프 최소 거리

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < news.length - 1) {
        // 위로 스와이프 (다음 항목)
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // 아래로 스와이프 (이전 항목)
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < news.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, news.length]);

  // 현재 항목으로 스크롤
  useEffect(() => {
    if (containerRef.current && news.length > 0) {
      const currentElement = containerRef.current.children[currentIndex] as HTMLElement;
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIndex, news.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold flex-1">개발 소식</h1>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'weekly' | 'monthly')} className="w-full">
          <TabsList className="w-full rounded-none border-b-0 h-12">
            <TabsTrigger value="daily" className="flex-1 text-sm">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 text-sm">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 text-sm">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* 피드 컨테이너 */}
      <div
        ref={containerRef}
        className="container mx-auto px-4 py-6 max-w-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">오늘의 개발 소식이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, index) => (
              <Card
                key={item.id}
                className={`transition-all duration-300 ${
                  index === currentIndex 
                    ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                    : 'opacity-70 scale-100'
                }`}
                style={{
                  minHeight: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl line-clamp-3 mb-2">
                        {item.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium">r/{item.subreddit}</span>
                        <span>·</span>
                        <span>{item.author || '익명'}</span>
                        <span>·</span>
                        <span>{formatDate(item.collected_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                      <TrendingUp className="h-4 w-4" />
                      {item.upvotes}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {item.content && (
                    <div className="flex-1 mb-4">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6">
                        {item.content}
                      </p>
                    </div>
                  )}
                  
                  {/* 태그 */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.slice(0, 5).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 카테고리 */}
                  {item.category && (
                    <div className="mb-4">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="mt-auto pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reddit에서 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 네비게이션 힌트 */}
        {news.length > 0 && (
          <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
            {currentIndex > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={() => setCurrentIndex(prev => prev - 1)}
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            )}
            {currentIndex < news.length - 1 && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            )}
            <div className="text-center text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
              {currentIndex + 1} / {news.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

