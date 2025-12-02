// 구현 사례 갤러리 페이지
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket } from 'lucide-react';
import { getCompletedImplementations, type IdeaImplementation } from '@/services/implementationService';
import { getIdea } from '@/services/ideaService';
import type { Idea } from '@/services/ideaService';
import { SimilarImplementationCard } from '@/components/SimilarImplementationCard';

export function ImplementationGallery() {
  const [implementations, setImplementations] = useState<(IdeaImplementation & { idea?: Idea })[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  useEffect(() => {
    fetchImplementations();
  }, []);

  async function fetchImplementations(reset: boolean = false) {
    if (reset) {
      setOffset(0);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await getCompletedImplementations(limit, reset ? 0 : offset);
      
      // 각 구현 사례에 아이디어 정보 추가
      const implementationsWithIdeas = await Promise.all(
        data.map(async (impl) => {
          try {
            const idea = await getIdea(impl.idea_id);
            return { ...impl, idea: idea || undefined };
          } catch (error) {
            console.error('아이디어 조회 실패:', error);
            return { ...impl, idea: undefined };
          }
        })
      );

      if (reset) {
        setImplementations(implementationsWithIdeas);
      } else {
        setImplementations(prev => [...prev, ...implementationsWithIdeas]);
      }

      setHasMore(data.length === limit);
      setOffset(reset ? limit : offset + limit);
    } catch (error) {
      console.error('구현 사례 조회 실패:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    if (!loadingMore && hasMore) {
      fetchImplementations(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">구현 사례 갤러리</h1>
        </div>
        <p className="text-muted-foreground">
          실제로 구현된 아이디어들을 확인해보세요. 영감을 얻고 참고할 수 있습니다.
        </p>
      </div>

      {implementations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">아직 완료된 구현 사례가 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              아이디어를 구현하셨다면 구현 사례를 공유해주세요!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {implementations.map((impl) => (
              <div key={impl.id}>
                {impl.idea ? (
                  <SimilarImplementationCard implementation={impl} />
                ) : (
                  <Card>
                    <CardContent className="py-4">
                      <p className="text-sm text-muted-foreground">아이디어 정보를 불러올 수 없습니다.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  '더 보기'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

