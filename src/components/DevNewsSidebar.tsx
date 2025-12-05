// 개발 소식 사이드바 컴포넌트
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, Tag } from 'lucide-react';
import { getDailyDevNews, getHotKeywords, type DevNews } from '@/services/devNewsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DevNewsSidebarProps {
  position?: 'left' | 'right';
  className?: string;
}

export function DevNewsSidebar({ className = '' }: DevNewsSidebarProps) {
  const [dailyNews, setDailyNews] = useState<DevNews[]>([]);
  const [hotKeywords, setHotKeywords] = useState<Array<{ tag: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'keywords'>('news');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [news, keywords] = await Promise.all([
          getDailyDevNews(10),
          getHotKeywords(10),
        ]);
        setDailyNews(news);
        setHotKeywords(keywords);
      } catch (error) {
        console.error('Error fetching dev news:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">개발 소식</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">로딩 중...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            개발 소식
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'news' | 'keywords')}>
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="news" className="flex-1 text-xs">
                Daily
              </TabsTrigger>
              <TabsTrigger value="keywords" className="flex-1 text-xs">
                Hot Keywords
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="news" className="mt-0 p-3 space-y-2 max-h-[600px] overflow-y-auto">
              {dailyNews.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  오늘의 개발 소식이 없습니다.
                </div>
              ) : (
                dailyNews.map((news) => (
                  <a
                    key={news.id}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border"
                  >
                    <div className="flex items-start gap-2">
                      <ExternalLink className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium line-clamp-2 mb-1">
                          {news.title}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            r/{news.subreddit}
                          </Badge>
                          {news.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {news.category}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {news.upvotes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="keywords" className="mt-0 p-3 space-y-2">
              {hotKeywords.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  핫한 키워드가 없습니다.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hotKeywords.map((keyword) => (
                    <Badge
                      key={keyword.tag}
                      variant="outline"
                      className="text-xs px-2 py-1 cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {keyword.tag}
                      <span className="ml-1 text-muted-foreground">({keyword.count})</span>
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

