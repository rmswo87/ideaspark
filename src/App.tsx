import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw } from "lucide-react"
import { IdeaCard } from '@/components/IdeaCard'
import { RecommendedIdeas } from '@/components/RecommendedIdeas'
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
import { LogOut, User as UserIcon, Shield } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BusinessFooter } from '@/components/BusinessFooter'

function HomePage() {
  const { user } = useAuth()
  const { isAdmin } = useAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subredditFilter, setSubredditFilter] = useState('all')
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
  const navigate = useNavigate()

  // 검색어 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 아이디어 목록 로드
  const loadIdeas = useCallback(async () => {
    setLoading(true)
    try {
      const fetchedIdeas = await getIdeas({
        search: debouncedSearchQuery || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        subreddit: subredditFilter !== 'all' ? subredditFilter : undefined,
        sort: sortOption
      })
      setIdeas(fetchedIdeas)
    } catch (error) {
      console.error('Error loading ideas:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, categoryFilter, subredditFilter, sortOption])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  // 통계 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getIdeaStats()
        setStats(statsData)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
    loadStats()
  }, [])

  // 서브레딧 목록 로드
  useEffect(() => {
    const loadSubreddits = async () => {
      try {
        const subredditList = await getSubreddits()
        setSubreddits(subredditList)
      } catch (error) {
        console.error('Error loading subreddits:', error)
      }
    }
    loadSubreddits()
  }, [])

  const handleCollectIdeas = async () => {
    setCollecting(true)
    try {
      await collectIdeas()
      await loadIdeas()
    } catch (error) {
      console.error('Error collecting ideas:', error)
      alert('아이디어 수집 중 오류가 발생했습니다.')
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
              <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>IdeaSpark</h1>
              <nav className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className={location.pathname === '/' || location.pathname === '/ideaspark' || location.pathname === '/ideaspark/' ? 'bg-secondary' : ''}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className={location.pathname.includes('/community') ? 'bg-secondary' : ''}
                >
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
                      navigate('/auth')
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 검색 및 필터 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="아이디어 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* 카테고리 필터 */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.keys(stats.byCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category} ({stats.byCategory[category]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 서브레딧 필터 */}
              <Select value={subredditFilter} onValueChange={setSubredditFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="서브레딧" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {subreddits.map((subreddit) => (
                    <SelectItem key={subreddit} value={subreddit}>
                      r/{subreddit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 정렬 옵션 */}
              <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'subreddit') => setSortOption(value)}>
                <SelectTrigger className="w-[140px]">
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

        {/* 추천 아이디어 섹션 (로그인한 사용자에게만 표시) */}
        {user && (
          <div className="mb-8">
            <RecommendedIdeas onGeneratePRD={(ideaId) => navigate(`/idea/${ideaId}`)} />
          </div>
        )}

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
      <BusinessFooter />
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
