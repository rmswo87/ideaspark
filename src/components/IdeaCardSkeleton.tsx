import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function IdeaCardSkeleton() {
  return (
    <Card className="w-full max-w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="relative pb-3 space-y-2 min-w-0 overflow-hidden">
        {/* 추천 배지 스켈레톤 */}
        <Skeleton className="absolute top-1 left-3 h-5 w-32 rounded-full" />
        
        {/* 제목 스켈레톤 */}
        <div className="mt-8 space-y-2">
          <Skeleton className="h-5 w-full rounded" />
          <Skeleton className="h-5 w-3/4 rounded" />
        </div>
        
        {/* 작성자 정보 스켈레톤 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-1 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 min-w-0 overflow-hidden">
        {/* 내용 스켈레톤 */}
        <div className="mb-3 sm:mb-4 min-h-[100px] sm:min-h-[140px] space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-4/6 rounded" />
          
          {/* 번역 안내 박스 스켈레톤 */}
          <div className="mt-3 space-y-2 p-2 sm:p-2.5 rounded-lg border border-border/20">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
        
        {/* 메타데이터 스켈레톤 */}
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        
        {/* 버튼 스켈레톤 */}
        <div className="flex gap-2 sm:gap-2.5">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

