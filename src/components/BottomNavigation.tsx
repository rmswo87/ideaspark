import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, User, Newspaper } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.includes(path)
  }

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: '아이디어',
    },
    {
      path: '/news',
      icon: Newspaper,
      label: '소식',
    },
    {
      path: '/community',
      icon: Users,
      label: '커뮤니티',
    },
    {
      path: user ? '/profile' : '/auth',
      icon: User,
      label: user ? '프로필' : '로그인',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
            >
              <Icon className={cn('h-5 w-5', active && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
