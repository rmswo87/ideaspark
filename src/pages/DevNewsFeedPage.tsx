// 개발 소식 피드 페이지 (릴스/인스타그램 스타일)
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Tag, 
  ChevronUp, 
  ChevronDown,
  Loader2,
  Newspaper,
  User as UserIcon,
  LogOut,
  Shield
} from 'lucide-react';
import { getDailyDevNews, getWeeklyDevNews, getMonthlyDevNews, type DevNews } from '@/services/devNewsService';
import { collectDevNews } from '@/services/devNewsCollector';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge';
import { MobileMenu } from '@/components/MobileMenu';
import { useToast } from '@/components/ui/toast';
import { RefreshCw } from 'lucide-react';

export function DevNewsFeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [news, setNews] = useState<DevNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
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

  const handleCollectNews = async () => {
    if (!isAdmin) {
      addToast({
        title: '권한 없음',
        description: '개발 소식 수집은 관리자만 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    setCollecting(true);
    try {
      const result = await collectDevNews();
      if (result.success) {
        addToast({
          title: '수집 완료',
          description: `${result.count}개의 개발 소식을 수집했습니다.`,
          variant: 'success',
        });
        // 수집 후 새로고침
        await fetchNews();
      } else {
        addToast({
          title: '수집 실패',
          description: result.error || '개발 소식 수집에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error collecting dev news:', error);
      addToast({
        title: '수집 실패',
        description: error instanceof Error ? error.message : '개발 소식 수집에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setCollecting(false);
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
      {/* Header - App.tsx와 동일한 구조 */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-0 sm:py-1.5">
          <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 h-10 sm:h-auto">
            <div className="flex items-center gap-1.5 sm:gap-4 w-full sm:w-auto">
              {/* 모바일 햄버거 메뉴 */}
              <div className="md:hidden">
                <MobileMenu />
              </div>
              <h1 
                className="text-sm sm:text-2xl font-bold cursor-pointer select-none touch-manipulation leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent hover:from-primary hover:to-primary/70 transition-all duration-300" 
                onClick={() => {
                  if (location.pathname === '/') {
                    window.location.reload();
                  } else {
                    navigate('/');
                  }
                }}
              >
                IdeaSpark
              </h1>
              <nav className="hidden md:flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname === '/' 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/news')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/news') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  <Newspaper className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">개발 소식</span>
                  <span className="sm:hidden">소식</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/community') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  커뮤니티
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/contact') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  문의 / 피드백
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-2 w-auto sm:w-auto justify-end">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-xs sm:text-sm h-7 sm:h-9 px-1.5 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                    >
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">관리자</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-xs sm:text-sm relative h-7 sm:h-9 px-1.5 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                  >
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">프로필</span>
                    <ProfileNotificationBadge />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      navigate('/auth')
                    }}
                    className="text-xs sm:text-sm h-7 sm:h-9 px-1.5 sm:px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 border-border/50"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-border/50 hover:border-primary/50"
                >
                  <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* 탭 네비게이션 */}
        <div className="border-t border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'weekly' | 'monthly')} className="w-full">
            <TabsList className="w-full rounded-none border-b-0 h-12 bg-transparent">
              <TabsTrigger value="daily" className="flex-1 text-sm">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="flex-1 text-sm">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="flex-1 text-sm">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
            <p className="text-muted-foreground mb-4">
              {activeTab === 'daily' ? '오늘의' : activeTab === 'weekly' ? '이번 주의' : '이번 달의'} 개발 소식이 없습니다.
            </p>
            {isAdmin && (
              <Button
                onClick={handleCollectNews}
                disabled={collecting}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                {collecting ? '수집 중...' : '개발 소식 수집하기'}
              </Button>
            )}
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

