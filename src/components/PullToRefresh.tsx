// Pull-to-Refresh 컴포넌트
import { useState, useEffect, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  disabled?: boolean;
  threshold?: number; // 픽셀 단위로 당겨야 하는 거리
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // 스크롤이 맨 위에 있을 때만 작동
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // 아래로 당기는 경우만 처리
      if (distance > 0 && window.scrollY <= 0) {
        e.preventDefault();
        const pullDistance = Math.min(distance * 0.5, threshold * 2); // 저항 효과
        setPullDistance(pullDistance);
        setIsPulling(pullDistance > threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (isPulling && pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      // 애니메이션으로 원래 위치로 복귀
      setPullDistance(0);
      setIsPulling(false);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, disabled, threshold, isPulling, pullDistance]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull-to-Refresh 인디케이터 */}
      {(isPulling || isRefreshing) && (
        <div 
          className="flex items-center justify-center py-4"
          style={{
            opacity: pullProgress,
            transform: `scale(${pullProgress})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                  transition: 'transform 0.1s',
                }}
              />
              <span className="text-xs text-muted-foreground">새로고침</span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

