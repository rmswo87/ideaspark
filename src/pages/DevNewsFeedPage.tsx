// 개발 소식 피드 페이지 (통합 피드)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Calendar, 
  TrendingUp, 
  Tag,
  Loader2,
  Newspaper,
  User as UserIcon,
  LogOut,
  Shield,
  MessageSquare
} from 'lucide-react';
import { getDevNews, getAllDevNews, type DevNews } from '@/services/devNewsService';
import { collectDevNews } from '@/services/devNewsCollector';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge';
import { MobileMenu } from '@/components/MobileMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DevNewsFeedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [news, setNews] = useState<DevNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [collecting, setCollecting] = useState(false);

  // 기간별 소식 가져오기
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let data: DevNews[] = [];
        
        if (periodType === 'all') {
          // 통합 피드: 모든 기간의 소식 가져오기
          data = await getAllDevNews();
        } else {
          // 특정 기간의 소식만 가져오기
          data = await getDevNews(periodType);
        }
        
        // 최신순 정렬 (created_at 기준)
        data.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        
        setNews(data);
        
        // 관리자이고 소식이 없으면 자동으로 수집 시작
        if (isAdmin && data.length === 0 && !collecting) {
          handleCollectNews();
        }
      } catch (error) {
        console.error('Error fetching dev news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [periodType, isAdmin]);

  // 수집 버튼 클릭
  const handleCollectNews = async () => {
    if (collecting) return;
    
    setCollecting(true);
    try {
      await collectDevNews();
      // 수집 완료 후 다시 가져오기
      const data = periodType === 'all' 
        ? await getAllDevNews()
        : await getDevNews(periodType);
      
      data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      setNews(data);
    } catch (error) {
      console.error('Error collecting dev news:', error);
    } finally {
      setCollecting(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {/* 좌측: 로고 및 제목 */}
          <div className="flex items-center gap-3 sm:gap-4">
            <MobileMenu />
            <div className="flex items-center gap-2 sm:gap-3">
              <Newspaper className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                개발 소식
              </h1>
            </div>
          </div>

          {/* 우측: 사용자 메뉴 */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/admin')}
                    className="hidden sm:flex hover:bg-primary/5 hover:text-primary transition-all duration-300"
                    aria-label="관리자"
                  >
                    <Shield className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="relative hover:bg-primary/5 hover:text-primary transition-all duration-300"
                  aria-label="프로필"
                >
                  <UserIcon className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1">
                    <ProfileNotificationBadge />
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hidden sm:flex hover:bg-primary/5 hover:text-primary transition-all duration-300"
                  aria-label="로그아웃"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 피드 컨테이너 - 통합 피드 */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 기간 선택 - Select만 sticky로 */}
        <div className="mb-4 flex justify-end">
          <div className="sticky top-[40px] sm:top-[56px] z-40">
            <Select value={periodType} onValueChange={(value: 'all' | 'daily' | 'weekly' | 'monthly') => setPeriodType(value)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="daily">데일리</SelectItem>
                <SelectItem value="weekly">위클리</SelectItem>
                <SelectItem value="monthly">먼슬리</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">개발 소식이 없습니다.</p>
            {isAdmin && (
              <Button onClick={handleCollectNews} disabled={collecting}>
                {collecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    수집 중...
                  </>
                ) : (
                  '소식 수집하기'
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {news.map((item) => (
              <Card
                key={item.id}
                className="transition-all duration-300 hover:shadow-md cursor-pointer"
                onClick={() => {
                  if (item.reddit_url) {
                    window.open(item.reddit_url, '_blank');
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 flex-1">
                      {item.title}
                    </CardTitle>
                    {item.reddit_url && (
                      <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hover:text-primary flex-shrink-0 mt-1" />
                    )}
                  </div>
                  
                  {/* 메타 정보 */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{new Date(item.created_at || '').toLocaleDateString('ko-KR')}</span>
                    </div>
                    {item.num_comments !== undefined && item.num_comments !== null && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{item.num_comments}개 댓글</span>
                      </div>
                    )}
                    {item.subreddit && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>r/{item.subreddit}</span>
                      </div>
                    )}
                  </div>

                  {/* 카테고리 및 태그 */}
                  {(item.category || (item.tags && item.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {item.category && (
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      )}
                      {item.tags && item.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* 이미지 표시 */}
                  {item.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-auto max-h-96 object-contain bg-muted"
                        loading="lazy"
                        onError={(e) => {
                          // 이미지 로드 실패 시 숨김
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* 내용 표시 - 이미지가 있으면 내용도 함께 표시, 둘 다 없으면 안내 메시지 */}
                  {item.content ? (
                    <div className="flex-1 mb-4">
                      <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                  ) : !item.image_url && (
                    <div className="flex-1 mb-4">
                      <p className="text-sm text-muted-foreground italic">
                        내용이 없습니다. Reddit에서 원문을 확인해주세요.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}