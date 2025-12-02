// 비슷한 아이디어의 구현 사례 카드 컴포넌트
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { IdeaImplementation } from '@/services/implementationService';
import { getIdea } from '@/services/ideaService';
import { useState, useEffect } from 'react';
import type { Idea } from '@/services/ideaService';

interface SimilarImplementationCardProps {
  implementation: IdeaImplementation;
}

export function SimilarImplementationCard({ implementation }: SimilarImplementationCardProps) {
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdea() {
      try {
        const ideaData = await getIdea(implementation.idea_id);
        setIdea(ideaData);
      } catch (error) {
        console.error('아이디어 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchIdea();
  }, [implementation.idea_id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!idea) {
    return null;
  }

  const statusLabels = {
    planned: '계획 중',
    in_progress: '진행 중',
    completed: '완료',
  };

  const statusColors = {
    planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base mb-2 line-clamp-2">{idea.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[implementation.status]}`}>
                {statusLabels[implementation.status]}
              </span>
              {implementation.status === 'completed' && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  완료됨
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 스크린샷 */}
        {implementation.screenshot_url && (
          <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-muted">
            <img
              src={implementation.screenshot_url}
              alt="구현 스크린샷"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* 설명 */}
        {implementation.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {implementation.description}
          </p>
        )}

        {/* 링크 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {implementation.implementation_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 sm:flex-none"
            >
              <a
                href={implementation.implementation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                {implementation.implementation_url.includes('github.com') ? (
                  <>
                    <Github className="h-4 w-4" />
                    GitHub
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    구현 보기
                  </>
                )}
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/ideas/${implementation.idea_id}`)}
            className="flex-1 sm:flex-none"
          >
            원본 아이디어 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

