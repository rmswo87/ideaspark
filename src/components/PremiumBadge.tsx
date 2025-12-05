// 프리미엄 배지 컴포넌트
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  className?: string;
  variant?: 'default' | 'outline';
}

export function PremiumBadge({ className, variant = 'default' }: PremiumBadgeProps) {
  return (
    <Badge 
      variant={variant}
      className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ${className || ''}`}
    >
      <Crown className="h-3 w-3 mr-1" />
      프리미엄
    </Badge>
  );
}

