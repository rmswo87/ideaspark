// 아이디어 상세 페이지 및 PRD 생성
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PRDViewer } from '@/components/PRDViewer';
import { generatePRD, generateDevelopmentPlan, getPRD, getPRDs } from '@/services/prdService';
import { getIdea } from '@/services/ideaService';
import { supabase } from '@/lib/supabase';
import { trackIdeaView, trackUserBehavior } from '@/services/recommendationService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Idea } from '@/services/ideaService';
import type { PRD } from '@/services/prdService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [prd, setPrd] = useState<PRD | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 아이디어와 사용자 정보 가져오기 (id 변경 시에만)
  useEffect(() => {
    isMountedRef.current = true;
    fetchIdea();
    fetchUser();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [id]);

  // 사용자 정보가 로드된 후 PRD 확인 (user?.id 변경 시에만)
  useEffect(() => {
    if (user?.id && id) {
      checkExistingPRD();
    }
  }, [user?.id, id]);

  // 아이디어 조회 추적 (아이디어와 사용자 정보가 로드된 후)
  useEffect(() => {
    if (!id || !user?.id) return;

    // 조회 추적 시작
    const cleanup = trackIdeaView(id, user.id);

    return () => {
      if (cleanup) cleanup();
    };
  }, [id, user?.id]);

  async function fetchIdea() {
    if (!id) return;
    
    setLoading(true);
    try {
      const ideaData = await getIdea(id);
      setIdea(ideaData);
    } catch (error) {
      console.error('Error fetching idea:', error);
      setIdea(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function checkExistingPRD() {
    if (!id || !user) return;

    try {
      const prds = await getPRDs({ ideaId: id, userId: user.id, limit: 1 });
      if (prds.length > 0) {
        const fullPRD = await getPRD(prds[0].id);
        if (isMountedRef.current) {
          setPrd(fullPRD);
        }
      }
    } catch (error) {
      console.error('Error checking existing PRD:', error);
    }
  }

  async function handleGeneratePRD() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isMountedRef.current) return;

    // 기존 PRD 확인
    try {
      const existingPRDs = await getPRDs({ ideaId: id, userId: user.id, limit: 1 });
      if (existingPRDs.length > 0) {
        const confirmMessage = '이미 이 아이디어에 대한 PRD가 있습니다. 새로 생성하시겠습니까? (기존 PRD는 유지됩니다)';
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing PRD:', error);
    }

    setGenerating(true);
    setError(null);
    
    try {
      const newPRD = await generatePRD(id, user.id);
      
      // PRD 생성 행동 추적
      if (id) {
        trackUserBehavior(user.id, id, 'generate_prd').catch(console.error);
      }
      
      if (!isMountedRef.current) return;
      
      // 상태 업데이트를 즉시 수행 (지연 제거)
      setPrd(newPRD);
      setGenerating(false);
      
      // PRD 생성 후 기존 PRD 확인 함수를 다시 호출하지 않음 (충돌 방지)
    } catch (error) {
      console.error('PRD generation error:', error);
      if (isMountedRef.current) {
        setError('PRD 생성에 실패했습니다.');
        setGenerating(false);
      }
    }
  }

  async function handleGenerateDevelopmentPlan() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!prd) {
      alert('먼저 PRD를 생성해주세요.');
      return;
    }

    if (!isMountedRef.current) return;

    setGeneratingPlan(true);
    setError(null);
    
    try {
      const updatedPRD = await generateDevelopmentPlan(prd.id, user.id);
      
      if (!isMountedRef.current) return;
      
      setPrd(updatedPRD);
      setGeneratingPlan(false);
    } catch (error) {
      console.error('Development plan generation error:', error);
      if (isMountedRef.current) {
        setError('개발 계획서 생성에 실패했습니다.');
        setGeneratingPlan(false);
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">아이디어를 찾을 수 없습니다.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl mb-2">{idea.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>작성자: {idea.author}</span>
              <span>·</span>
              <span>r/{idea.subreddit}</span>
              <span>·</span>
              <span>👍 {idea.upvotes}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{idea.content}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href={idea.url} target="_blank" rel="noopener noreferrer">
                  Reddit에서 보기
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!prd ? (
          <Card>
            <CardHeader>
              <CardTitle>PRD 생성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                이 아이디어에 대한 PRD 문서를 자동으로 생성할 수 있습니다.
              </p>
              <Button
                onClick={handleGeneratePRD}
                disabled={generating}
                size="lg"
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    PRD 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    PRD 자동 생성
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <PRDViewer
              prd={prd}
              onUpdate={(updatedPrd) => {
                setPrd(updatedPrd);
              }}
            />
            
            {!prd.content.includes('개발 일정') && !prd.content.includes('WBS') && (
              <Card>
                <CardHeader>
                  <CardTitle>개발 계획서 생성</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    PRD를 기반으로 상세한 개발 계획서를 생성할 수 있습니다.
                  </p>
                  <Button
                    onClick={handleGenerateDevelopmentPlan}
                    disabled={generatingPlan}
                    size="lg"
                    className="w-full"
                  >
                    {generatingPlan ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        개발 계획서 생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        개발 계획서 자동 생성
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
