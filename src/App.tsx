import { useEffect, lazy, Suspense, type ComponentType } from 'react'
import { supabase } from '@/lib/supabase'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/toast'
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AuthPage } from '@/pages/AuthPage'
import { ContactPage } from '@/pages/ContactPage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import { DevNewsFeedPage } from '@/pages/DevNewsFeedPage'
import { HomePage } from '@/pages/HomePage'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BottomNavigation } from '@/components/BottomNavigation'
import { ScrollToTop } from '@/components/ScrollToTop'

// 코드 스플리팅: 큰 페이지들을 lazy loading
const IdeaDetailPage = lazy(() => import('@/pages/IdeaDetailPage').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))
const CommunityPage = lazy(() => import('@/pages/CommunityPage').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))
const ImplementationGallery = lazy(() => import('@/pages/ImplementationGallery').then((module: any) => ({ default: (module.ImplementationGallery || module.default || module) as ComponentType<any> })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module: any) => ({ default: (module.default || module) as ComponentType<any> })))

// 로딩 컴포넌트
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

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
          <ScrollToTop />
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
            <Route path="/implementations" element={<ImplementationGallery />} />
            <Route path="/news" element={<DevNewsFeedPage />} />
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
