// 아이디어 상세 페이지 및 PRD 생성
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PRDViewer } from '@/components/PRDViewer';
import { generatePRD, generateDevelopmentPlan, getPRD, getPRDs } from '@/services/prdService';
import { generateProposal, getProposals, type Proposal } from '@/services/proposalService';
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
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
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

  // 아이디어 조회 추적 (아이디어와 사용자 정보가 로드된 후)
  useEffect(() => {
    if (!id || !user?.id) return;

    // 조회 추적 시작
    const cleanup = trackIdeaView(id, user.id);

    return () => {
      if (cleanup) cleanup();
    };
  }, [id, user?.id]);

  // 사용자 정보가 로드된 후 PRD 및 제안서 확인 (user?.id 변경 시에만)
  useEffect(() => {
    if (user?.id && id) {
      checkExistingPRD();
      checkExistingProposal();
    }
  }, [user?.id, id]);

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

  async function checkExistingProposal() {
    if (!id || !user) return;

    try {
      const proposals = await getProposals({ ideaId: id, userId: user.id, limit: 1 });
      if (proposals.length > 0 && isMountedRef.current) {
        setProposal(proposals[0]);
      }
    } catch (error) {
      console.error('Error checking existing proposal:', error);
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
      // 제안서가 있으면 제안서 내용을 기반으로 PRD 생성
      const proposalContent = proposal?.content;
      const newPRD = await generatePRD(id, user.id, proposalContent);
      
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
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`PRD 생성에 실패했습니다: ${errorMessage}`);
      setGenerating(false);
      alert(`PRD 생성에 실패했습니다: ${errorMessage}`);
    }
  }

  async function handleGenerateDevelopmentPlan() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isMountedRef.current) return;

    // 기존 개발 계획서 확인
    try {
      const existingPlans = await getPRDs({ ideaId: id, userId: user.id, limit: 10 });
      const hasPlan = existingPlans.some(p => p.title.includes('개발 계획서'));
      if (hasPlan) {
        const confirmMessage = '이미 이 아이디어에 대한 개발 계획서가 있습니다. 새로 생성하시겠습니까? (기존 계획서는 유지됩니다)';
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing plan:', error);
    }

    setGeneratingPlan(true);
    setError(null);
    
    try {
      // 제안서가 있으면 제안서 내용을 우선 사용, 없으면 PRD 내용 사용
      const contentToUse = proposal?.content || prd?.content;
      const newPlan = await generateDevelopmentPlan(id, user.id, contentToUse);
      
      if (!isMountedRef.current) return;
      
      // 상태 업데이트를 즉시 수행 (지연 제거)
      setPrd(newPlan);
      setGeneratingPlan(false);
    } catch (error) {
      console.error('Development plan generation error:', error);
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`개발 계획서 생성에 실패했습니다: ${errorMessage}`);
      setGeneratingPlan(false);
      alert(`개발 계획서 생성에 실패했습니다: ${errorMessage}`);
    }
  }

  async function handleGenerateProposal() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isMountedRef.current) return;

    // 기존 제안서 확인
    try {
      const existingProposals = await getProposals({ ideaId: id, userId: user.id, limit: 1 });
      if (existingProposals.length > 0) {
        const confirmMessage = '이미 이 아이디어에 대한 제안서가 있습니다. 새로 생성하시겠습니까? (기존 제안서는 유지됩니다)';
        if (!confirm(confirmMessage)) {
          return;
        }
      }
    } catch (error) {
      console.error('Error checking existing proposal:', error);
    }

    setGeneratingProposal(true);
    setError(null);
    
    try {
      const newProposal = await generateProposal(id, user.id);
      
      if (!isMountedRef.current) return;
      
      setProposal(newProposal);
      setGeneratingProposal(false);
      alert('제안서가 생성되었습니다! 제안서를 기반으로 PRD나 개발 계획서를 작성할 수 있습니다.');
    } catch (error) {
      console.error('Proposal generation error:', error);
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`제안서 생성에 실패했습니다: ${errorMessage}`);
      setGeneratingProposal(false);
      alert(`제안서 생성에 실패했습니다: ${errorMessage}`);
    }
  }


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">아이디어를 찾을 수 없습니다.</p>
            <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>{idea.title}</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>r/{idea.subreddit}</span>
              <span>작성자: {idea.author}</span>
              {idea.upvotes > 0 && <span>👍 {idea.upvotes}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{idea.content}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={idea.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Reddit 원문 페이지 열기
                </a>
              </Button>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Chrome 자동 번역 사용하기
                </p>
                <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside text-xs">
                  <li>Reddit 페이지에서 우측 상단 번역 아이콘 클릭</li>
                  <li>또는 우클릭 → "한국어로 번역" 선택</li>
                  <li>Chrome의 자동 번역 기능이 가장 정확하고 빠릅니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!prd && !proposal ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-6">
              이 아이디어를 개선하여 제안서를 작성하거나, 바로 PRD/개발 계획서를 생성해보세요.
            </p>
            <div className="flex flex-col gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-2">
                <p className="text-sm font-medium text-primary mb-2">💡 제안서 작성 (권장)</p>
                <p className="text-xs text-muted-foreground mb-4">
                  아이디어가 단순하거나 추상적일 때, 제안서를 먼저 작성하여 아이디어를 구체화하고 개선할 수 있습니다.
                </p>
                <Button
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal || generating || generatingPlan || !user}
                  size="lg"
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  {generatingProposal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      제안서 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      제안서 작성하기
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGeneratePRD}
                  disabled={generating || generatingPlan || generatingProposal || !user}
                  size="lg"
                  variant="outline"
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
                <Button
                  onClick={handleGenerateDevelopmentPlan}
                  disabled={generating || generatingPlan || generatingProposal || !user}
                  size="lg"
                  variant="outline"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      개발 계획서 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      개발 계획서 작성
                    </>
                  )}
                </Button>
              </div>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                문서 생성을 위해 로그인이 필요합니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : proposal && !prd ? (
        <Card>
          <CardHeader>
            <CardTitle>제안서</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none mb-6">
              <div className="whitespace-pre-wrap text-sm">{proposal.content}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGeneratePRD}
                disabled={generating || generatingPlan || !user}
                size="lg"
                variant="default"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    PRD 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    제안서 기반 PRD 생성
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateDevelopmentPlan}
                disabled={generating || generatingPlan || !user}
                size="lg"
                variant="outline"
              >
                {generatingPlan ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    개발 계획서 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    제안서 기반 개발 계획서 작성
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : prd ? (
        <>
          {error && (
            <Card className="mb-4 border-destructive">
              <CardContent className="py-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
          <ErrorBoundary>
            <PRDViewer prd={prd} />
          </ErrorBoundary>
          {!prd.title.includes('개발 계획서') && !prd.title.includes('개발 계획') && (
            <Card className="mt-4">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  {prd.title.includes('PRD') 
                    ? 'PRD를 기반으로 개발 계획서를 생성할 수 있습니다.'
                    : '이 문서를 기반으로 개발 계획서를 생성할 수 있습니다.'}
                </p>
                <Button
                  onClick={handleGenerateDevelopmentPlan}
                  disabled={generatingPlan || !user}
                  variant="outline"
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      개발 계획서 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      개발 계획서 작성
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
