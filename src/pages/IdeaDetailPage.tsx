// 아이디어 상세 페이지 및 PRD 생성
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PRDViewer } from '@/components/PRDViewer';
import { generatePRD, getPRD, getPRDs } from '@/services/prdService';
import { generateProposal, getProposals, type Proposal } from '@/services/proposalService';
import { getIdea, fetchRedditPostContent, updateIdeaContent } from '@/services/ideaService';
import { supabase } from '@/lib/supabase';
import { trackIdeaView, trackUserBehavior } from '@/services/recommendationService';
import { ImplementationButton } from '@/components/ImplementationButton';
import { SimilarImplementationCard } from '@/components/SimilarImplementationCard';
import { getSimilarImplementations } from '@/services/implementationService';
import type { IdeaImplementation } from '@/services/implementationService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Idea } from '@/services/ideaService';
import type { PRD } from '@/services/prdService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [prd, setPrd] = useState<PRD | null>(null);
  const [prds, setPrds] = useState<PRD[]>([]);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [prdProgress, setPrdProgress] = useState(0);
  const progressAnimationRef = useRef<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarImplementations, setSimilarImplementations] = useState<IdeaImplementation[]>([]);
  const isMountedRef = useRef(true);

  // 아이디어와 사용자 정보 가져오기 (id 변경 시에만)
  useEffect(() => {
    isMountedRef.current = true;
    fetchIdea();
    fetchUser();
    
    return () => {
      isMountedRef.current = false;
      // 애니메이션 정리
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current);
        progressAnimationRef.current = null;
      }
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
      checkExistingProposals();
    }
  }, [user?.id, id]);

  // 비슷한 구현 사례 조회
  useEffect(() => {
    if (!id) return;

    async function fetchSimilarImplementations() {
      try {
        const similar = await getSimilarImplementations(id!, 5);
        if (isMountedRef.current) {
          setSimilarImplementations(similar);
        }
      } catch (error) {
        console.error('비슷한 구현 사례 조회 실패:', error);
      }
    }

    fetchSimilarImplementations();
  }, [id]);

  async function fetchIdea() {
    if (!id) return;
    
    setLoading(true);
    try {
      const ideaData = await getIdea(id);
      if (ideaData) {
        setIdea(ideaData);
        
        // 내용이 비어있고 Reddit URL이 있는 경우, Reddit에서 직접 가져오기 시도
        if ((!ideaData.content || ideaData.content.trim() === '') && ideaData.url) {
          console.log('Content is empty, fetching from Reddit URL:', ideaData.url);
          try {
            const fetchedContent = await fetchRedditPostContent(ideaData.url);
            if (fetchedContent && fetchedContent.trim() !== '') {
              // 데이터베이스 업데이트
              const updatedIdea = await updateIdeaContent(id, fetchedContent);
              if (updatedIdea && isMountedRef.current) {
                setIdea(updatedIdea);
                console.log('Successfully fetched and updated content from Reddit');
              }
            } else {
              console.warn('Failed to fetch content from Reddit URL');
            }
          } catch (fetchError) {
            console.error('Error fetching content from Reddit:', fetchError);
            // 에러가 발생해도 기존 아이디어는 표시
          }
        }
      } else {
        setIdea(null);
      }
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
      const allPRDs = await getPRDs({ ideaId: id, userId: user.id, limit: 100 });
      if (isMountedRef.current) {
        setPrds(allPRDs);
        if (allPRDs.length > 0) {
          const fullPRD = await getPRD(allPRDs[0].id);
          if (isMountedRef.current) {
            setPrd(fullPRD);
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing PRD:', error);
    }
  }

  async function checkExistingProposals() {
    if (!id || !user) return;

    try {
      const allProposals = await getProposals({ ideaId: id, userId: user.id });
      if (isMountedRef.current) {
        setProposals(allProposals);
        if (allProposals.length > 0) {
          setProposal(allProposals[0]);
          setSelectedProposalId(allProposals[0].id);
        }
      }
    } catch (error) {
      console.error('Error checking existing proposals:', error);
    }
  }

  // 부드러운 진행률 애니메이션을 위한 ref
  const prdProgressRef = useRef(0);
  
  // 부드러운 진행률 애니메이션 함수
  const animateProgress = (targetProgress: number, setProgress: (value: number) => void, progressRef: React.MutableRefObject<number>) => {
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
    }
    
    const animate = () => {
      const currentProgress = progressRef.current;
      
      if (currentProgress < targetProgress) {
        // 부드럽게 증가 (최대 1.5%씩, 더 부드럽게)
        const increment = Math.min(1.5, targetProgress - currentProgress);
        const newProgress = Math.min(100, currentProgress + increment);
        progressRef.current = newProgress;
        setProgress(newProgress);
        
        progressAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // 목표에 도달했으면 정확히 설정
        progressRef.current = targetProgress;
        setProgress(targetProgress);
        progressAnimationRef.current = null;
      }
    };
    
    progressAnimationRef.current = requestAnimationFrame(animate);
  };

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
    setPrdProgress(0);
    prdProgressRef.current = 0;
    setError(null);
    
    try {
      // 선택된 제안서가 있으면 제안서 내용을 기반으로 PRD 생성
      const selectedProposal = proposals.find(p => p.id === selectedProposalId);
      const proposalContent = selectedProposal?.content;
      
      // 진행률 콜백
      const progressCallback = (progress: number) => {
        if (isMountedRef.current) {
          animateProgress(progress, setPrdProgress, prdProgressRef);
        }
      };
      
      const newPRD = await generatePRD(id, user.id, proposalContent, progressCallback);
      
      // PRD 생성 행동 추적
      if (id) {
        trackUserBehavior(user.id, id, 'generate_prd').catch(console.error);
      }
      
      if (!isMountedRef.current) return;
      
      // PRD 목록 업데이트
      const updatedPRDs = await getPRDs({ ideaId: id, userId: user.id, limit: 100 });
      if (isMountedRef.current) {
        setPrds(updatedPRDs);
        setPrd(newPRD);
      }
      setGenerating(false);
      setPrdProgress(0);
    } catch (error) {
      console.error('PRD generation error:', error);
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`PRD 생성에 실패했습니다: ${errorMessage}`);
      setGenerating(false);
      setPrdProgress(0);
      alert(`PRD 생성에 실패했습니다: ${errorMessage}`);
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
      
      // 제안서 목록 업데이트
      const updatedProposals = await getProposals({ ideaId: id, userId: user.id });
      if (isMountedRef.current) {
        setProposals(updatedProposals);
        setProposal(newProposal);
        setSelectedProposalId(newProposal.id);
      }
      setGeneratingProposal(false);
    } catch (error) {
      console.error('Proposal generation error:', error);
      if (!isMountedRef.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`제안서 생성에 실패했습니다: ${errorMessage}`);
      setGeneratingProposal(false);
      alert(`제안서 생성에 실패했습니다: ${errorMessage}`);
    }
  }

  async function handleDeleteProposal(proposalId: string) {
    if (!confirm('이 제안서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { deleteProposal } = await import('@/services/proposalService');
      await deleteProposal(proposalId);
      
      const updatedProposals = proposals.filter(p => p.id !== proposalId);
      setProposals(updatedProposals);
      
      if (updatedProposals.length > 0) {
        setProposal(updatedProposals[0]);
        setSelectedProposalId(updatedProposals[0].id);
      } else {
        setProposal(null);
        setSelectedProposalId(null);
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      alert('제안서 삭제에 실패했습니다.');
    }
  }

  async function handleSelectPRD(prdId: string) {
    try {
      const fullPRD = await getPRD(prdId);
      if (isMountedRef.current) {
        setPrd(fullPRD);
      }
    } catch (error) {
      console.error('Error loading PRD:', error);
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

  if (!idea) {
    return (
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">
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
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 relative">
      {/* 로딩 오버레이 - 전체 화면 */}
      {(generating || generatingProposal) && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-card border-2 rounded-lg p-8 shadow-2xl text-center max-w-md mx-4">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-6 text-primary" />
            <h3 className="text-xl font-bold mb-3">
              {generating && 'PRD 생성 중...'}
              {generatingProposal && '제안서 생성 중...'}
            </h3>
            <p className="text-base text-muted-foreground mb-4">
              문서를 생성하고 있습니다. 잠시만 기다려주세요.
            </p>
            {/* 진행률 표시 */}
            {generating && (
              <div className="mt-4 w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">진행률</span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round(prdProgress)}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ 
                      width: `${prdProgress}%`,
                      transition: 'width 0.3s ease-out'
                    }}
                  >
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                  <span>PRD 문서 생성 중... ({Math.round(prdProgress)}%)</span>
                </div>
              </div>
            )}
            {generatingProposal && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                <span>처리 중...</span>
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <a 
                    href={idea.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Reddit 원문 페이지 열기
                  </a>
                </Button>
                {user && (
                  <ImplementationButton 
                    ideaId={id!} 
                    onUpdate={() => {
                      // 구현 사례 업데이트 시 비슷한 구현 사례 다시 조회
                      if (id) {
                        getSimilarImplementations(id, 5)
                          .then(setSimilarImplementations)
                          .catch(console.error);
                      }
                    }}
                  />
                )}
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  💡 Chrome 자동 번역 사용하기
                </p>
                <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside text-xs">
                  <li>보시는 페이지에서 우측 상단 번역 아이콘 클릭</li>
                  <li>또는 마우스 우클릭 → "한국어로 번역" 선택</li>
                  <li>Chrome의 자동 번역 기능이 가장 정확하고 빠릅니다</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 비슷한 구현 사례 섹션 */}
      {similarImplementations.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                비슷한 아이디어의 구현 사례
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                이 아이디어와 비슷한 카테고리의 다른 아이디어들이 이미 구현되었습니다. 참고해보세요!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarImplementations.map((impl) => (
                  <SimilarImplementationCard key={impl.id} implementation={impl} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 제안서 섹션 */}
      {proposals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>제안서</CardTitle>
              {proposals.length > 1 && (
                <Select
                  value={selectedProposalId || proposals[0].id}
                  onValueChange={(value) => {
                    const selected = proposals.find(p => p.id === value);
                    if (selected) {
                      setProposal(selected);
                      setSelectedProposalId(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {proposals.map((p, index) => (
                      <SelectItem key={p.id} value={p.id}>
                        제안서 {index + 1}안 ({new Date(p.created_at).toLocaleDateString('ko-KR')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {proposals.length === 1 && (
              <p className="text-sm text-muted-foreground mt-2">제안서 1안</p>
            )}
          </CardHeader>
          <CardContent>
            {proposal && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {proposals.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProposal(proposal.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none mb-6">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-2xl font-semibold mt-8 mb-4 text-foreground" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-xl font-semibold mt-7 mb-3 text-foreground" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-semibold mt-6 mb-3 text-foreground" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-4 leading-7 text-foreground" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="mb-4 ml-6 list-disc space-y-1" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="mb-4 ml-6 list-decimal space-y-1" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="leading-7 text-foreground" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-foreground" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-foreground" {...props} />
                      ),
                      code: ({ node, inline, className, children, ...props }: any) => {
                        if (inline) {
                          return (
                            <code
                              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="my-4">
                            <code
                              className="block bg-muted p-4 rounded text-sm font-mono overflow-x-auto border border-border"
                              {...props}
                            >
                              {children}
                            </code>
                          </div>
                        );
                      },
                      a: ({ node, ...props }) => (
                        <a
                          className="text-primary underline underline-offset-2 hover:text-primary/80"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {proposal.content}
                  </ReactMarkdown>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {/* 버튼 순서 고정: 제안서 작성 -> PRD 생성 */}
                  <Button
                    onClick={handleGenerateProposal}
                    disabled={generatingProposal || generating || !user}
                    size="lg"
                    variant="outline"
                  >
                    {generatingProposal ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        제안서 생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        제안서 추가 작성
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGeneratePRD}
                    disabled={generating || !user}
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* PRD 섹션 */}
      {prd ? (
        <>
          {error && (
            <Card className="mb-4 border-destructive">
              <CardContent className="py-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}
          {prds.length > 1 && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">문서 선택:</span>
                  <Select
                    value={prd.id}
                    onValueChange={handleSelectPRD}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prds.map((p, index) => {
                        const isPRD = p.title.includes('PRD');
                        const isProposalBased = p.title.includes('제안서');
                        let label = '';
                        if (isPRD) {
                          label = isProposalBased ? `PRD (제안서 기반) ${index + 1}` : `PRD ${index + 1}`;
                        } else {
                          label = `${p.title} ${index + 1}`;
                        }
                        return (
                          <SelectItem key={p.id} value={p.id}>
                            {label} ({new Date(p.created_at).toLocaleDateString('ko-KR')})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          {proposals.length > 0 && (
            <Card className="mb-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">제안서 선택:</span>
                  <Select
                    value={selectedProposalId || proposals[0].id}
                    onValueChange={(value) => {
                      const selected = proposals.find(p => p.id === value);
                      if (selected) {
                        setProposal(selected);
                        setSelectedProposalId(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {proposals.map((p, index) => (
                        <SelectItem key={p.id} value={p.id}>
                          제안서 {index + 1}안 ({new Date(p.created_at).toLocaleDateString('ko-KR')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          <ErrorBoundary>
            <PRDViewer prd={prd} />
          </ErrorBoundary>
          {/* PRD가 있을 때 추가 생성 버튼들 - 순서 고정: 제안서 작성 -> PRD 생성 */}
          <Card className="mt-4">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal || generating || !user}
                  variant="outline"
                  size="lg"
                >
                  {generatingProposal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      제안서 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      제안서 작성
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGeneratePRD}
                  disabled={generating || !user}
                  variant="outline"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      PRD 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      PRD 추가 생성
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* 초기 상태: 제안서나 PRD가 없을 때 */}
      {!prd && proposals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-6">
              이 아이디어를 개선하여 제안서를 작성하거나, 바로 PRD를 생성해보세요.
            </p>
            <div className="flex flex-col gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-2">
                <p className="text-sm font-medium text-primary mb-2">💡 제안서 작성 (권장)</p>
                <p className="text-xs text-muted-foreground mb-4">
                  아이디어가 단순하거나 추상적일 때, 제안서를 먼저 작성하여 아이디어를 구체화하고 개선할 수 있습니다.
                </p>
                <Button
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal || generating || !user}
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
                  disabled={generating || generatingProposal || !user}
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
              </div>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                문서 생성을 위해 로그인이 필요합니다.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IdeaDetailPage;