// 홈 페이지 - 아이디어 목록 및 필터링
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, RefreshCw, Sparkles, ChevronDown, ChevronUp, Filter, Newspaper, Languages } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IdeaCard } from '@/components/IdeaCard'
import { RecommendedIdeas } from '@/components/RecommendedIdeas'
import { PremiumRecommendedIdeas } from '@/components/PremiumRecommendedIdeas'
import { IdeaCardSkeleton } from '@/components/IdeaCardSkeleton'
import { getIdeas, getIdeaStats, getSubreddits } from '@/services/ideaService'
import { collectIdeas } from '@/services/collector'
import type { Idea } from '@/services/ideaService'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { usePremium } from '@/hooks/usePremium'
import { LogOut, User as UserIcon, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Footer } from '@/components/Footer'
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge'
import { MobileMenu } from '@/components/MobileMenu'
import { BottomNavigation } from '@/components/BottomNavigation'
import { PullToRefresh } from '@/components/PullToRefresh'

export function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdmin()
  const { isPremium, loading: premiumLoading } = usePremium()
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
  const [showStats, setShowStats] = useState(false) // 모바일에서 통계 섹션 토글 (데스크톱에서는 항상 열림)
  const [showMobileFilters, setShowMobileFilters] = useState(false) // 모바일 필터 드롭다운
  const navigate = useNavigate()

  // 데스크톱에서는 통계가 항상 열려있도록
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowStats(true);
      }
    };
    handleResize(); // 초기 설정
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [])

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

  // 데스크톱에서는 통계가 항상 열려있도록
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowStats(true);
      }
    };
    handleResize(); // 초기 설정
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      </header>

      {/* Main Content - 모바일 최적화 */}
      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-6 pb-20 md:pb-8 overflow-x-hidden max-w-6xl">
        {/* 메인 콘텐츠 */}
        <div className="w-full max-w-full">
          <div className="mb-1 sm:mb-2 space-y-1.5 sm:space-y-3">
          {/* Search and Filter - 모바일 최적화 컴팩트 디자인 */}
          <div className="space-y-1.5 sm:space-y-2.5">
            {/* 검색 및 수집 버튼 - 모바일에서 더 컴팩트 */}
            <div className="flex gap-1.5 sm:gap-2.5 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70" />
                <Input
                  placeholder="아이디어 검색... (Chrome 자동 번역 사용 가능)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 h-9 sm:min-h-[40px] text-xs sm:text-sm border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                />
              </div>
              {/* 번역 버튼 - 데스크톱에서만 표시 */}
              <Button
                onClick={() => {
                  // Google Translate 위젯이 로드될 때까지 대기
                  const tryTriggerTranslate = (attempts = 0) => {
                    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                    if (select) {
                      // 한국어 옵션 찾기
                      const koOption = Array.from(select.options).find((opt: HTMLOptionElement) => 
                        opt.value.includes('ko') || opt.text.includes('한국어') || opt.text.includes('Korean')
                      );
                      if (koOption) {
                        select.value = koOption.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                      } else {
                        // 한국어 옵션이 없으면 직접 'ko' 값 설정 시도
                        try {
                          select.value = 'ko';
                          select.dispatchEvent(new Event('change', { bubbles: true }));
                        } catch (e) {
                          console.error('Failed to trigger translation:', e);
                        }
                      }
                    } else if (attempts < 10) {
                      // 위젯이 아직 로드되지 않았으면 재시도
                      setTimeout(() => tryTriggerTranslate(attempts + 1), 200);
                    } else {
                      console.warn('Google Translate widget not found after 10 attempts');
                    }
                  };
                  tryTriggerTranslate();
                }}
                variant="outline"
                size="sm"
                className="hidden md:flex border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-9 sm:min-h-[40px] px-2 sm:px-3 text-xs sm:text-sm"
                title="Chrome 자동 번역 사용하기"
              >
                <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">번역</span>
              </Button>
              <Button 
                onClick={handleCollectIdeas} 
                disabled={collecting}
                variant="outline"
                size="sm"
                className="border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-9 sm:min-h-[40px] px-2 sm:px-3 text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${collecting ? 'animate-spin' : ''} sm:mr-2`} />
                <span className="hidden sm:inline">{collecting ? '수집 중...' : '아이디어 수집'}</span>
              </Button>
            </div>

            {/* 통합된 필터 및 통계 섹션 - 모바일에서 드롭다운으로 통합 */}
            <div className="flex flex-col gap-1.5 sm:gap-2.5">
              {/* 모바일: 필터 드롭다운 버튼 */}
              <div className="sm:hidden">
                <DropdownMenu open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full h-9 text-xs justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        <span>필터 및 통계</span>
                        {(categoryFilter !== 'all' || subredditFilter !== 'all' || sortOption !== 'latest' || searchQuery || selectedCategories.size > 0 || selectedSubreddits.size > 0) && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full">
                            {[categoryFilter !== 'all' ? 1 : 0, subredditFilter !== 'all' ? 1 : 0, sortOption !== 'latest' ? 1 : 0, searchQuery ? 1 : 0, selectedCategories.size, selectedSubreddits.size].reduce((a, b) => a + b, 0)}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto">
                    <div className="p-2 space-y-3">
                      {/* 필터 그룹 */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">필터</div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="카테고리" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">전체 카테고리</SelectItem>
                            <SelectItem value="development" className="text-xs">개발</SelectItem>
                            <SelectItem value="design" className="text-xs">디자인</SelectItem>
                            <SelectItem value="business" className="text-xs">비즈니스</SelectItem>
                            <SelectItem value="education" className="text-xs">교육</SelectItem>
                            <SelectItem value="product" className="text-xs">제품</SelectItem>
                            <SelectItem value="general" className="text-xs">일반</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={subredditFilter} onValueChange={setSubredditFilter}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="서브레딧" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs">전체 서브레딧</SelectItem>
                            {subreddits.map((subreddit) => (
                              <SelectItem key={subreddit} value={subreddit} className="text-xs">
                                r/{subreddit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit') => setSortOption(value)}>
                          <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="정렬" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="latest" className="text-xs">최신순</SelectItem>
                            <SelectItem value="popular" className="text-xs">추천순</SelectItem>
                            <SelectItem value="subreddit" className="text-xs">서브레딧순</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="text-xs text-muted-foreground pt-1">
                          결과: <span className="text-primary font-semibold">{ideas.length}개</span>
                        </div>
                      </div>
                      {/* 통계 */}
                      {stats.total > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="text-xs font-semibold text-muted-foreground">통계</div>
                          <div className="text-xs text-foreground font-semibold">총 {stats.total}개</div>
                          {Object.entries(stats.byCategory).length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-muted-foreground">카테고리:</div>
                              <div className="flex flex-wrap gap-1">
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
                                        setCategoryFilter('all');
                                      }}
                                      className={`px-2 py-1 rounded-full text-[10px] transition-all ${
                                        isSelected 
                                          ? 'bg-primary text-primary-foreground' 
                                          : 'bg-secondary/80 text-secondary-foreground'
                                      }`}
                                    >
                                      {cat} ({count})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {Object.entries(stats.bySubreddit || {}).length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-muted-foreground">서브레딧:</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(stats.bySubreddit || {})
                                  .sort(([, a], [, b]) => (b as number) - (a as number))
                                  .slice(0, 4)
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
                                          setSubredditFilter('all');
                                        }}
                                        className={`px-2 py-1 rounded-full text-[10px] transition-all ${
                                          isSelected 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-secondary/80 text-secondary-foreground'
                                        }`}
                                      >
                                        r/{sub} ({count})
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-2 pt-2 border-t">
                        {user && (
                          <Button
                            onClick={() => {
                              setShowRecommended(!showRecommended);
                              setShowMobileFilters(false);
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
                            className="h-8 text-xs w-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                          >
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            {showRecommended ? '추천 숨기기' : '추천 보기'}
                          </Button>
                        )}
                        <div className="flex gap-2">
                          {(categoryFilter !== 'all' || subredditFilter !== 'all' || sortOption !== 'latest' || searchQuery || selectedCategories.size > 0 || selectedSubreddits.size > 0) && (
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
                              className="h-8 text-xs flex-1"
                            >
                              초기화
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMobileFilters(false)}
                            className="h-8 text-xs flex-1"
                          >
                            닫기
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 데스크톱: 기존 필터 UI */}
              <div className="hidden sm:flex flex-col gap-1.5 sm:gap-2.5 p-1.5 sm:p-2.5 md:p-3 bg-muted/20 rounded-lg border border-border/30">
                {/* 필터 그룹 - 모바일에서 더 컴팩트 */}
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 flex-wrap">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[120px] md:w-[140px] h-8 sm:h-[36px] text-xs border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                    <SelectItem value="all" className="focus:bg-primary/10 text-xs">전체 카테고리</SelectItem>
                    <SelectItem value="development" className="focus:bg-primary/10 text-xs">개발</SelectItem>
                    <SelectItem value="design" className="focus:bg-primary/10 text-xs">디자인</SelectItem>
                    <SelectItem value="business" className="focus:bg-primary/10 text-xs">비즈니스</SelectItem>
                    <SelectItem value="education" className="focus:bg-primary/10 text-xs">교육</SelectItem>
                    <SelectItem value="product" className="focus:bg-primary/10 text-xs">제품</SelectItem>
                    <SelectItem value="general" className="focus:bg-primary/10 text-xs">일반</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={subredditFilter} onValueChange={setSubredditFilter}>
                  <SelectTrigger className="w-full sm:w-[130px] md:w-[160px] h-8 sm:h-[36px] text-xs border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                    <SelectValue placeholder="서브레딧" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                    <SelectItem value="all" className="focus:bg-primary/10 text-xs">전체 서브레딧</SelectItem>
                    {subreddits.map((subreddit) => (
                      <SelectItem key={subreddit} value={subreddit} className="focus:bg-primary/10 text-xs">
                        r/{subreddit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit') => setSortOption(value)}>
                  <SelectTrigger className="w-full sm:w-[100px] md:w-[120px] h-8 sm:h-[36px] text-xs border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
                    <SelectItem value="latest" className="focus:bg-primary/10 text-xs">최신순</SelectItem>
                    <SelectItem value="popular" className="focus:bg-primary/10 text-xs">추천순</SelectItem>
                    <SelectItem value="subreddit" className="focus:bg-primary/10 text-xs">서브레딧순</SelectItem>
                  </SelectContent>
                </Select>

                {/* 검색 결과 및 액션 버튼 - 모바일에서 더 컴팩트 */}
                <div className="flex items-center gap-1 sm:gap-2 flex-1 sm:justify-end flex-wrap">
                  <span className="text-[10px] sm:text-xs md:text-sm font-medium text-foreground whitespace-nowrap">
                    {loading ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-spin text-primary" />
                        <span className="hidden sm:inline">필터링 중...</span>
                      </span>
                    ) : (
                      <span>결과: <span className="text-primary font-semibold">{ideas.length}개</span></span>
                    )}
                  </span>
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
                      className="h-7 sm:h-[36px] text-[10px] sm:text-xs px-1.5 sm:px-3 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                    >
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 sm:mr-1.5" />
                      <span className="hidden sm:inline">{showRecommended ? '추천 숨기기' : '추천'}</span>
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
                      className="h-7 sm:h-[36px] text-[10px] sm:text-xs px-1.5 sm:px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                    >
                      초기화
                    </Button>
                  )}
                </div>
              </div>

              {/* 통계 정보 - 모바일에서 접을 수 있게, 데스크톱에서는 항상 표시 */}
              {stats.total > 0 && (
                <Collapsible open={showStats} onOpenChange={setShowStats}>
                  {/* 모바일에서만 접기 버튼 표시 */}
                  <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-border/30">
                    <span className="font-semibold text-foreground text-xs sm:text-sm">총 {stats.total}개</span>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 sm:hidden text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span>카테고리/서브레딧</span>
                        {showStats ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="data-[state=closed]:hidden sm:!block">
                    <div className="flex flex-col gap-1.5 sm:gap-2.5 pt-1.5 sm:pt-2">
                      {/* 첫 번째 줄: 총 개수 및 카테고리 */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                        {Object.entries(stats.byCategory).length > 0 && (
                          <>
                            <span className="font-medium hidden sm:inline">카테고리:</span>
                            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
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
                                      setCategoryFilter('all');
                                    }}
                                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all duration-300 cursor-pointer font-medium ${
                                      isSelected 
                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                        : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50'
                                    }`}
                                  >
                                    {cat} ({count})
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      {/* 두 번째 줄: 서브레딧 (별도 줄) */}
                      {Object.entries(stats.bySubreddit || {}).length > 0 && (
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                          <span className="font-medium hidden sm:inline">서브레딧:</span>
                          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                            {Object.entries(stats.bySubreddit || {})
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .slice(0, 4)
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
                                      setSubredditFilter('all');
                                    }}
                                    className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs transition-all duration-300 cursor-pointer font-medium ${
                                      isSelected 
                                        ? 'bg-primary text-primary-foreground shadow-sm' 
                                        : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary border border-border/50'
                                    }`}
                                  >
                                    r/{sub} ({count})
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </div>

        {/* 프리미엄 추천 아이디어 섹션 (프리미엄 사용자에게만 표시) */}
        {/* 로딩이 완료되고 프리미엄 사용자인 경우에만 렌더링하여 깜빡임 방지 */}
        {!authLoading && !premiumLoading && user && isPremium && (
          <div id="premium-recommended-ideas-section" className="mb-4 sm:mb-6 md:mb-8 w-full max-w-full overflow-x-hidden">
            <PremiumRecommendedIdeas />
          </div>
        )}

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
              className="mt-4 sm:mt-6 p-3 sm:p-5 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/40 rounded-xl border-2 border-border/60 shadow-2xl backdrop-blur-sm"
              style={{ 
                opacity: loading ? 0.5 : 1,
                boxSizing: 'border-box',
                boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-500 w-full max-w-full">
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
            </div>
          </PullToRefresh>
        )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
      
      {/* 하단 네비게이션 (모바일 전용) */}
      <BottomNavigation />
    </div>
  )
}
