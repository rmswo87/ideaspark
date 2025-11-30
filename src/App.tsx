import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Sparkles, Loader2 } from "lucide-react"
import { IdeaCard } from '@/components/IdeaCard'
import { RecommendedIdeas } from '@/components/RecommendedIdeas'
import { IdeaCardSkeleton } from '@/components/IdeaCardSkeleton'
import { getIdeas, getIdeaStats, getSubreddits } from '@/services/ideaService'
import { collectIdeas } from '@/services/collector'
import type { Idea } from '@/services/ideaService'
import { AuthPage } from '@/pages/AuthPage'
import { ContactPage } from '@/pages/ContactPage'
import { TermsPage } from '@/pages/TermsPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { LogOut, User as UserIcon, Shield } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Footer } from '@/components/Footer'
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge'
import { MobileMenu } from '@/components/MobileMenu'
import { BottomNavigation } from '@/components/BottomNavigation'
import { PullToRefresh } from '@/components/PullToRefresh'

// 코드 스플리팅: 큰 페이지들을 lazy loading
const IdeaDetailPage = lazy(() => import('@/pages/IdeaDetailPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// 로딩 컴포넌트
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

function HomePage() {
  const { user } = useAuth()
  const { isAdmin } = useAdmin()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subredditFilter, setSubredditFilter] = useState<string>('all')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set()) // 통계에서 클릭한 카테고리들
  const [selectedSubreddits, setSelectedSubreddits] = useState<Set<string>>(new Set()) // 통계에서 클릭한 서브레딧들
  const [sortOption, setSortOption] = useState<'latest' | 'popular' | 'subreddit'>('latest')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [stats, setStats] = useState({ 
    total: 0, 
    byCategory: {} as Record<string, number>,
    bySubreddit: {} as Record<string, number>
  })
  const [subreddits, setSubreddits] = useState<string[]>([])
  const [showRecommended, setShowRecommended] = useState(false) // 추천 아이디어 섹션 토글
  const navigate = useNavigate()

  // 검색어 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])


  const fetchIdeas = useCallback(async () => {
    // 필터 값 정규화 (빈 문자열, undefined 처리)
    // 통계에서 선택한 카테고리/서브레딧이 있으면 우선 적용
    let normalizedCategory: string | undefined = undefined;
    if (selectedCategories.size > 0) {
      // 통계에서 선택한 카테고리들이 있으면 첫 번째 것만 사용 (Supabase는 단일 값만 지원)
      normalizedCategory = Array.from(selectedCategories)[0];
    } else if (categoryFilter && categoryFilter !== 'all') {
      normalizedCategory = categoryFilter.trim();
    }
    
    let normalizedSubreddit: string | undefined = undefined;
    if (selectedSubreddits.size > 0) {
      // 통계에서 선택한 서브레딧들이 있으면 첫 번째 것만 사용
      normalizedSubreddit = Array.from(selectedSubreddits)[0];
    } else if (subredditFilter && subredditFilter !== 'all') {
      normalizedSubreddit = subredditFilter.trim();
    }
    
    const normalizedSearch = debouncedSearchQuery && debouncedSearchQuery.trim() !== '' ? debouncedSearchQuery.trim() : undefined;
    
    const filters = {
      category: normalizedCategory,
      subreddit: normalizedSubreddit,
      sort: sortOption,
      limit: 50,
      search: normalizedSearch,
    };
    
    setLoading(true);
    
    try {
      // 실제 API 호출
      const data = await getIdeas(filters);
      
      // React 18의 자동 배치가 효율적으로 처리함
      setIdeas(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching ideas:', error);
      }
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, subredditFilter, sortOption, debouncedSearchQuery, selectedCategories, selectedSubreddits]);

  // 아이디어 목록 가져오기 - 필터 변경 시 즉시 반영
  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas])

  // Pull-to-Refresh 핸들러
  async function handleRefresh() {
    await fetchIdeas();
    await fetchStats();
    await fetchSubreddits();
  }

  // 통계와 서브레딧 목록은 초기 로드 시에만 가져오기
  useEffect(() => {
    fetchStats();
    fetchSubreddits();
  }, [])

  async function fetchSubreddits() {
    try {
      const data = await getSubreddits()
      setSubreddits(data)
    } catch (error) {
      console.error('Error fetching subreddits:', error)
    }
  }

  async function fetchStats() {
    try {
      const statsData = await getIdeaStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function handleCollectIdeas() {
    setCollecting(true)
    try {
      const result = await collectIdeas()
      if (result.success) {
        alert(`${result.count}개의 아이디어를 수집했습니다!`)
        fetchIdeas()
        fetchStats()
      } else {
        const errorMsg = result.error || '알 수 없는 오류'
        console.error('[HomePage] Collection failed:', errorMsg)
        alert(`수집 실패: ${errorMsg}`)
      }
    } catch (error) {
      console.error('[HomePage] Collection exception:', error)
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      alert(`수집 실패: ${errorMsg}`)
    } finally {
      setCollecting(false)
    }
  }


  // formatDate를 useCallback으로 메모이제이션하여 IdeaCard 리렌더링 방지
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 모바일 최적화 */}
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
      </header>

      {/* Main Content - 모바일 최적화 */}
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 pb-20 md:pb-8 overflow-x-hidden max-w-full">
        <div className="mb-4 sm:mb-5 space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              아이디어 대시보드
            </h2>
          </div>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm mb-3 sm:mb-4 p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">총 {stats.total}개 아이디어</span>
              </div>
              {Object.entries(stats.byCategory).length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <span className="font-medium whitespace-nowrap text-foreground/80">카테고리:</span>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(stats.byCategory).map(([cat, count]) => {
                      const isSelected = selectedCategories.has(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategories(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(cat)) {
                                newSet.delete(cat);
                              } else {
                                newSet.add(cat);
                              }
                              return newSet;
                            });
                            // 드롭다운 필터 초기화
                            setCategoryFilter('all');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 cursor-pointer min-h-[32px] sm:min-h-0 font-medium ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                              : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105 border border-border/50'
                          }`}
                        >
                          {cat} <span className="opacity-70">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {Object.entries(stats.bySubreddit || {}).length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <span className="font-medium whitespace-nowrap text-foreground/80">서브레딧:</span>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(stats.bySubreddit || {})
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([sub, count]) => {
                        const isSelected = selectedSubreddits.has(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              setSelectedSubreddits(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(sub)) {
                                  newSet.delete(sub);
                                } else {
                                  newSet.add(sub);
                                }
                                return newSet;
                              });
                              // 드롭다운 필터 초기화
                              setSubredditFilter('all');
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all duration-300 cursor-pointer min-h-[32px] sm:min-h-0 font-medium ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground shadow-sm scale-105' 
                                : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105 border border-border/50'
                            }`}
                          >
                            r/{sub} <span className="opacity-70">({count})</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search and Filter */}
          <div className="space-y-3">
            {/* 검색 및 기본 필터 */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <Input
                  placeholder="아이디어 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 min-h-[44px] text-base sm:text-sm border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                />
              </div>
              <Button 
                onClick={handleCollectIdeas} 
                disabled={collecting}
                variant="outline"
                className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 min-h-[44px]"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                {collecting ? '수집 중...' : '아이디어 수집'}
              </Button>
            </div>

            {/* 필터 그룹 - 모바일 최적화 */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-3">
              {/* 카테고리 필터 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] touch-manipulation border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                  <SelectItem value="all" className="focus:bg-primary/10">전체 카테고리</SelectItem>
                  <SelectItem value="development" className="focus:bg-primary/10">개발</SelectItem>
                  <SelectItem value="design" className="focus:bg-primary/10">디자인</SelectItem>
                  <SelectItem value="business" className="focus:bg-primary/10">비즈니스</SelectItem>
                  <SelectItem value="education" className="focus:bg-primary/10">교육</SelectItem>
                  <SelectItem value="product" className="focus:bg-primary/10">제품</SelectItem>
                  <SelectItem value="general" className="focus:bg-primary/10">일반</SelectItem>
                </SelectContent>
              </Select>

              {/* 서브레딧 필터 */}
              <Select value={subredditFilter} onValueChange={setSubredditFilter}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] touch-manipulation border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                  <SelectValue placeholder="서브레딧" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                  <SelectItem value="all" className="focus:bg-primary/10">전체 서브레딧</SelectItem>
                  {subreddits.map((subreddit) => (
                    <SelectItem key={subreddit} value={subreddit} className="focus:bg-primary/10">
                      r/{subreddit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 정렬 옵션 */}
              <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit') => setSortOption(value)}>
                <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] touch-manipulation border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                  <SelectItem value="latest" className="focus:bg-primary/10">최신순</SelectItem>
                  <SelectItem value="popular" className="focus:bg-primary/10">추천순</SelectItem>
                  <SelectItem value="subreddit" className="focus:bg-primary/10">서브레딧순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 필터링된 결과 헤더 */}
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 bg-muted/20 rounded-lg border border-border/30">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                <span>필터링 중...</span>
              </span>
            ) : (
              <span>검색 결과: <span className="text-primary">{ideas.length}개</span></span>
            )}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Button
                onClick={() => {
                  setShowRecommended(!showRecommended);
                  if (!showRecommended) {
                    setTimeout(() => {
                      const recommendedSection = document.getElementById('recommended-ideas-section');
                      if (recommendedSection) {
                        recommendedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                }}
                variant="outline"
                size="sm"
                className="text-xs border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {showRecommended ? '추천 숨기기' : '당신의 알고리즘'}
              </Button>
            )}
            {(categoryFilter !== 'all' || subredditFilter !== 'all' || sortOption !== 'latest' || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setSubredditFilter('all');
                  setSortOption('latest');
                  setSearchQuery('');
                  setSelectedCategories(new Set());
                  setSelectedSubreddits(new Set());
                }}
                className="text-xs hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>

        {/* 추천 아이디어 섹션 (토글 가능, 로그인한 사용자에게만 표시) */}
        {user && showRecommended && (
          <div id="recommended-ideas-section" className="mb-4 sm:mb-6 md:mb-8 w-full max-w-full overflow-x-hidden">
            <RecommendedIdeas onGeneratePRD={(ideaId) => navigate(`/idea/${ideaId}`)} />
          </div>
        )}

        {/* Ideas Grid */}
        {loading ? (
          <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500 w-full max-w-full overflow-x-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="w-full min-w-0 max-w-full"
                style={{ boxSizing: 'border-box' }}
              >
                <IdeaCardSkeleton />
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
              <Sparkles className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground mb-6 text-base">아이디어가 없습니다. 수집 버튼을 클릭하여 Reddit에서 아이디어를 수집해보세요.</p>
            <Button 
              onClick={handleCollectIdeas} 
              disabled={collecting} 
              size="lg"
              className="shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
              {collecting ? '수집 중...' : '아이디어 수집하기'}
            </Button>
          </div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
            <div 
              id="filtered-ideas-grid"
              className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500 w-full max-w-full overflow-x-hidden" 
              style={{ 
                opacity: loading ? 0.5 : 1,
                boxSizing: 'border-box'
              }}
            >
              {ideas.map((idea, index) => (
                <div
                  key={idea.id}
                  className="animate-in fade-in slide-in-from-bottom-4 w-full min-w-0 max-w-full"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both',
                    boxSizing: 'border-box'
                  }}
                >
                  <IdeaCard
                    idea={idea}
                    onCardClick={() => navigate(`/idea/${idea.id}`)}
                    formatDate={formatDate}
                  />
                </div>
              ))}
            </div>
          </PullToRefresh>
        )}
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* 하단 네비게이션 (모바일 전용) */}
      <BottomNavigation />
    </div>
  )
}

function App() {
  // Vercel과 GitHub Pages 배포 환경 구분
  // Vercel: 루트 경로 (/) - 프로덕션 환경
  // GitHub Pages: /ideaspark/ - 테스트/이중화 환경
  // 두 환경 모두 동일한 코드베이스 사용, 환경 변수로 구분
  const basename = import.meta.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark' : undefined;
  
  // OAuth 콜백 처리
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      // OAuth 콜백 확인 (hash 또는 query string에 access_token 또는 code가 있는 경우)
      const hasAuthCallback = hashParams.has('access_token') || 
                              hashParams.has('code') || 
                              searchParams.has('code') ||
                              searchParams.has('access_token');
      
      if (hasAuthCallback) {
        try {
          // Supabase가 자동으로 세션을 처리하도록 대기
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            // 세션이 있으면 홈으로 리디렉션 (Supabase Site URL 설정이 제대로 작동하지 않는 경우 대비)
            if (window.location.href.includes('supabase.co')) {
              window.location.href = import.meta.env.PROD 
                ? 'https://ideaspark-pi.vercel.app/'
                : `${window.location.origin}/`;
            }
          }
        } catch (error) {
          console.error('Auth callback error:', error);
        }
      }
    };
    
    handleAuthCallback();
  }, []);
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/idea/:id" element={<IdeaDetailPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/:id" element={<PostDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        
        {/* 하단 네비게이션 (모바일 전용) - 모든 페이지에서 보임 */}
        <BottomNavigation />
        
        {/* 전역 스크롤 버튼 - 모든 페이지에서 보임 (모바일에서는 하단 네비게이션 위에) */}
        <div className="fixed right-3 sm:right-4 bottom-20 md:bottom-4 flex flex-col gap-2 z-50">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background border-2 min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 touch-manipulation"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="맨 위로"
            title="맨 위로"
          >
            <span className="text-lg md:text-base">↑</span>
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background border-2 min-h-[48px] min-w-[48px] md:min-h-0 md:min-w-0 touch-manipulation"
            onClick={() =>
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth',
              })
            }
            aria-label="맨 아래로"
            title="맨 아래로"
          >
            <span className="text-lg md:text-base">↓</span>
          </Button>
        </div>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
