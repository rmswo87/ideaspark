// 아이디어 상세 페이지 및 PRD 생성
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PRDViewer } from '@/components/PRDViewer';
import { generatePRD, generateDevelopmentPlan, getPRD, getPRDs } from '@/services/prdService';
import { getIdea } from '@/services/ideaService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Idea } from '@/services/ideaService';
import type { PRD } from '@/services/prdService';

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [prd, setPrd] = useState<PRD | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdea();
    fetchUser();
    checkExistingPRD();
  }, [id]);

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
        setPrd(fullPRD);
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

    setGenerating(true);
    try {
      const newPRD = await generatePRD(id, user.id);
      setPrd(newPRD);
      alert('PRD가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('PRD generation error:', error);
      alert(`PRD 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateDevelopmentPlan() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      return;
    }

    setGeneratingPlan(true);
    try {
      // PRD가 있으면 PRD 내용을 포함하여 개발 계획서 생성
      const prdContent = prd?.content;
      const newPlan = await generateDevelopmentPlan(id, user.id, prdContent);
      setPrd(newPlan);
      alert('개발 계획서가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('Development plan generation error:', error);
      alert(`개발 계획서 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingPlan(false);
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

      {!prd ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-6">
              이 아이디어에 대한 PRD 또는 개발 계획서를 생성해보세요.
            </p>
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
                    PRD 자동 생성
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
                    개발 계획서 작성
                  </>
                )}
              </Button>
            </div>
            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                문서 생성을 위해 로그인이 필요합니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <PRDViewer prd={prd} />
          {prd.title.includes('PRD') && (
            <Card className="mt-4">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  PRD를 기반으로 개발 계획서를 생성할 수 있습니다.
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
      )}
    </div>
  );
}

