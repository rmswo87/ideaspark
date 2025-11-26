// 아이디어 상세 페이지 및 PRD 생성
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PRDViewer } from '@/components/PRDViewer';
import { generatePRD, getPRD, getPRDs } from '@/services/prdService';
import { getIdeas } from '@/services/ideaService';
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
      const ideas = await getIdeas({ limit: 1000 });
      const foundIdea = ideas.find(i => i.id === id);
      setIdea(foundIdea || null);
    } catch (error) {
      console.error('Error fetching idea:', error);
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
            <p className="text-muted-foreground whitespace-pre-wrap">{idea.content}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={idea.url} target="_blank" rel="noopener noreferrer">
                  원문 보기
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {!prd ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-6">
              이 아이디어에 대한 PRD를 생성해보세요.
            </p>
            <Button
              onClick={handleGeneratePRD}
              disabled={generating || !user}
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
                  PRD 자동 생성
                </>
              )}
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                PRD 생성을 위해 로그인이 필요합니다.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <PRDViewer prd={prd} />
      )}
    </div>
  );
}
