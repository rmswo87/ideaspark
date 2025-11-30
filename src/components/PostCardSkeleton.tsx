import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PostCardSkeleton() {
  return (
    <Card className="w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm group">
      <CardContent className="p-4 sm:p-6">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        
        {/* 제목 스켈레톤 */}
        <div className="mb-3 space-y-2">
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-3/4 rounded" />
        </div>
        
        {/* 내용 스켈레톤 */}
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
        
        {/* 이미지 스켈레톤 */}
        <Skeleton className="h-48 w-full rounded-lg mb-4" />
        
        {/* 태그 및 메타데이터 스켈레톤 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        
        {/* 액션 버튼 스켈레톤 */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

