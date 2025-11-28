import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Sparkles, RefreshCw } from "lucide-react"
import { IdeaCard } from '@/components/IdeaCard'
import { getIdeas, getIdeaStats, getSubreddits } from '@/services/ideaService'
import { collectIdeas } from '@/services/collector'
import { supabase } from '@/lib/supabase'
import type { Idea } from '@/services/ideaService'
import { IdeaDetailPage } from '@/pages/IdeaDetailPage'
import { AuthPage } from '@/pages/AuthPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { CommunityPage } from '@/pages/CommunityPage'
import { PostDetailPage } from '@/pages/PostDetailPage'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { LogOut, User as UserIcon, MessageSquare, Shield } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function HomePage() {
  const { user } = useAuth()
  const { isAdmin } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subredditFilter, setSubredditFilter] = useState('all')
  const [sortOption, setSortOption] = useState<'latest' | 'popular' | 'subreddit' | 'comments'>('latest')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [stats, setStats] = useState({ 
    total: 0, 
    byCategory: {} as Record<string, number>,
    bySubreddit: {} as Record<string, number>
  })
  const [subreddits, setSubreddits] = useState<string[]>([])
  const navigate = useNavigate()

  // 검색어 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    try {
      // 댓글순일 때는 더 많은 데이터를 가져와서 정렬 (limit 없이)
      const limit = sortOption === 'comments' ? undefined : 50
      const data = await getIdeas({
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        subreddit: subredditFilter === 'all' ? undefined : subredditFilter,
        sort: sortOption,
        limit: limit,
        search: debouncedSearchQuery || undefined,
      })
      setIdeas(data)
    } catch (error) {
      console.error('Error fetching ideas:', error)
      // 에러 발생 시 빈 배열로 설정
      setIdeas([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, subredditFilter, sortOption, debouncedSearchQuery])

  // 아이디어 목록 가져오기
  useEffect(() => {
    let isMounted = true;
    
    async function fetchIdeasSafe() {
      if (!isMounted) return;
      await fetchIdeas();
    }
    
    fetchIdeasSafe();
    fetchStats();
    fetchSubreddits();
    
    return () => {
      isMounted = false;
    };
  }, [fetchIdeas])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">IdeaSpark</h1>
              </div>
              <nav className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/community')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  커뮤니티
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      관리자
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    프로필
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      window.location.reload()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">아이디어 대시보드</h2>
          </div>

          {/* Stats */}
          {stats.total > 0 && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              <span className="font-medium">총 {stats.total}개 아이디어</span>
              {Object.entries(stats.byCategory).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="font-medium">카테고리:</span>
                  {Object.entries(stats.byCategory).map(([cat, count]) => (
                    <span key={cat} className="px-2 py-0.5 bg-secondary rounded text-xs">
                      {cat} ({count})
                    </span>
                  ))}
                </div>
              )}
              {Object.entries(stats.bySubreddit || {}).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="font-medium">서브레딧:</span>
                  {Object.entries(stats.bySubreddit || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([sub, count]) => (
                      <span key={sub} className="px-2 py-0.5 bg-secondary rounded text-xs">
                        r/{sub} ({count})
                      </span>
                    ))}
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
                  className="pl-10"
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

            {/* 필터 그룹 */}
            <div className="flex flex-wrap gap-4">
              {/* 카테고리 필터 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
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
                <SelectTrigger className="w-[180px]">
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
              <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit' | 'comments') => setSortOption(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">추천순</SelectItem>
                  <SelectItem value="comments">댓글순</SelectItem>
                  <SelectItem value="subreddit">서브레딧순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onCardClick={() => navigate(`/idea/${idea.id}`)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  // GitHub Pages 배포 시 basename 설정
  const basename = import.meta.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark' : undefined;
  
  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/idea/:id" element={<IdeaDetailPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<PostDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
