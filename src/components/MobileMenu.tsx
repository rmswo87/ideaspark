import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Menu, X, Home, Users, MessageSquare, Shield, User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { supabase } from '@/lib/supabase'
import { ProfileNotificationBadge } from './ProfileNotificationBadge'

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isAdmin } = useAdmin()

  const handleNavigate = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
    setOpen(false)
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.includes(path)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-primary/5 hover:text-primary transition-all duration-300"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[300px] max-w-[280px] h-[calc(100vh-4rem)] max-h-[600px] p-0 bg-background/95 backdrop-blur-md border-border/50">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              IdeaSpark
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="메뉴 닫기"
              className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <Button
              variant={isActive('/') ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' 
                  : 'hover:bg-primary/5 hover:text-primary'
              }`}
              onClick={() => handleNavigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              아이디어
            </Button>

            <Button
              variant={isActive('/community') ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all duration-300 ${
                isActive('/community') 
                  ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' 
                  : 'hover:bg-primary/5 hover:text-primary'
              }`}
              onClick={() => handleNavigate('/community')}
            >
              <Users className="mr-2 h-4 w-4" />
              커뮤니티
            </Button>

            <Button
              variant={isActive('/contact') ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all duration-300 ${
                isActive('/contact') 
                  ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' 
                  : 'hover:bg-primary/5 hover:text-primary'
              }`}
              onClick={() => handleNavigate('/contact')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              문의 / 피드백
            </Button>

            {user && (
              <>
                {isAdmin && (
                  <Button
                    variant={isActive('/admin') ? 'secondary' : 'ghost'}
                    className={`w-full justify-start transition-all duration-300 ${
                      isActive('/admin') 
                        ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' 
                        : 'hover:bg-primary/5 hover:text-primary'
                    }`}
                    onClick={() => handleNavigate('/admin')}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    관리자
                  </Button>
                )}

                <Button
                  variant={isActive('/profile') ? 'secondary' : 'ghost'}
                  className={`w-full justify-start relative transition-all duration-300 ${
                    isActive('/profile') 
                      ? 'bg-primary/10 text-primary border border-primary/20 font-semibold' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                  onClick={() => handleNavigate('/profile')}
                >
                  <User className="mr-2 h-4 w-4" />
                  프로필
                  <div className="absolute right-2">
                    <ProfileNotificationBadge />
                  </div>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </>
            )}

            {!user && (
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-border/50 hover:border-primary/50"
                onClick={() => handleNavigate('/auth')}
              >
                <User className="mr-2 h-4 w-4" />
                로그인
              </Button>
            )}
          </nav>

          {/* 푸터 */}
          <div className="p-4 border-t border-border/50 text-xs text-muted-foreground/80 bg-muted/30">
            <p>© 2025 IdeaSpark</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}