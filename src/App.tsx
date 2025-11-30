import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, Sparkles, Loader2 } from "lucide-react"
import { IdeaCard } from '@/components/IdeaCard'
import { RecommendedIdeas } from '@/components/RecommendedIdeas'
import { getIdeas, getIdeaStats, getSubreddits } from '@/services/ideaService'
import { collectIdeas } from '@/services/collector'
import { supabase } from '@/lib/supabase'
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
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-2 sm:px-4 py-0 sm:py-1.5">
          <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 h-10 sm:h-auto">
            <div className="flex items-center gap-1.5 sm:gap-4 w-full sm:w-auto">
              {/* 모바일 햄버거 메뉴 */}
              <div className="md:hidden">
                <MobileMenu />
              </div>
              <h1 
                className="text-sm sm:text-2xl font-bold cursor-pointer select-none touch-manipulation leading-none" 
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
                  className={`text-xs sm:text-sm ${location.pathname === '/' ? 'font-semibold bg-secondary text-foreground' : ''}`}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className={`text-xs sm:text-sm ${location.pathname.includes('/community') ? 'font-semibold bg-secondary !text-foreground hover:!text-foreground' : ''}`}
                >
                  커뮤니티
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className="text-xs sm:text-sm"
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
                      className="text-xs sm:text-sm h-7 sm:h-9 px-1.5 sm:px-3"
                    >
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">관리자</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="text-xs sm:text-sm relative h-7 sm:h-9 px-1.5 sm:px-3"
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
                    className="text-xs sm:text-sm h-7 sm:h-9 px-1.5 sm:px-3"
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
                  className="text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 md:pb-8">
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">아이디어 대시보드</h2>
          </div>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              <span className="font-medium">총 {stats.total}개 아이디어</span>
              {Object.entries(stats.byCategory).length > 0 && (
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  <span className="font-medium whitespace-nowrap">카테고리:</span>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
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
                          className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer hover:opacity-80 min-h-[32px] sm:min-h-0 ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground font-semibold' 
                              : 'bg-secondary'
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
                <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                  <span className="font-medium whitespace-nowrap">서브레딧:</span>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
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
                            className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer hover:opacity-80 min-h-[32px] sm:min-h-0 ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground font-semibold' 
                                : 'bg-secondary'
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

          {/* Search and Filter */}
          <div className="space-y-4">
            {/* 검색 및 기본 필터 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="아이디어 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 min-h-[44px] text-base sm:text-sm"
                />
              </div>
              <Button 
                onClick={handleCollectIdeas} 
                disabled={collecting}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                {collecting ? '수집 중...' : '아이디어 수집'}
              </Button>
            </div>

            {/* 필터 그룹 - 모바일 최적화 */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              {/* 카테고리 필터 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  <SelectItem value="development">개발</SelectItem>
                  <SelectItem value="design">디자인</SelectItem>
                  <SelectItem value="business">비즈니스</SelectItem>
                  <SelectItem value="education">교육</SelectItem>
                  <SelectItem value="product">제품</SelectItem>
                  <SelectItem value="general">일반</SelectItem>
                </SelectContent>
              </Select>

              {/* 서브레딧 필터 */}
              <Select value={subredditFilter} onValueChange={setSubredditFilter}>
                <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="서브레딧" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 서브레딧</SelectItem>
                  {subreddits.map((subreddit) => (
                    <SelectItem key={subreddit} value={subreddit}>
                      r/{subreddit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 정렬 옵션 */}
              <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit') => setSortOption(value)}>
                <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] touch-manipulation">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">추천순</SelectItem>
                  <SelectItem value="subreddit">서브레딧순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 필터링된 결과 헤더 */}
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold">
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                필터링 중...
              </span>
            ) : (
              `검색 결과: ${ideas.length}개`
            )}
          </h3>
          <div className="flex items-center gap-2">
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
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {showRecommended ? '추천 숨기기' : '당신의 알고리즘'}
              </Button>
            )}
            {(categoryFilter !== 'all' || subredditFilter !== 'all' || sortOption !== 'latest') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategoryFilter('all');
                  setSubredditFilter('all');
                  setSortOption('latest');
                  setSearchQuery('');
                }}
                className="text-xs"
              >
                필터 초기화
              </Button>
            )}
          </div>
        </div>

        {/* 추천 아이디어 섹션 (토글 가능, 로그인한 사용자에게만 표시) */}
        {user && showRecommended && (
          <div id="recommended-ideas-section" className="mb-8">
            <RecommendedIdeas onGeneratePRD={(ideaId) => navigate(`/idea/${ideaId}`)} />
          </div>
        )}

        {/* Ideas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">필터링된 아이디어를 불러오는 중...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">아이디어가 없습니다. 수집 버튼을 클릭하여 Reddit에서 아이디어를 수집해보세요.</p>
            <Button onClick={handleCollectIdeas} disabled={collecting} size="lg">
              <RefreshCw className={`h-4 w-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
              {collecting ? '수집 중...' : '아이디어 수집하기'}
            </Button>
          </div>
        ) : (
          <>
            <div 
              id="filtered-ideas-grid"
              className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 w-full" 
              style={{ 
                opacity: loading ? 0.5 : 1
              }}
            >
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onCardClick={() => navigate(`/idea/${idea.id}`)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </>
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
  
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

export default App
