// 아이디어 관리 컴포넌트
import { useState, useEffect } from 'react';
import { getIdeas } from '@/services/ideaService';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Idea } from '@/services/ideaService';

export function IdeaManagement() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIdeas();
  }, []);

  async function fetchIdeas() {
    setLoading(true);
    try {
      const data = await getIdeas({ limit: 100 });
      setIdeas(data);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ideaId: string) {
    if (!confirm('이 아이디어를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId);

      if (error) throw error;
      fetchIdeas();
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('아이디어 삭제에 실패했습니다.');
    }
  }

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>제목</TableHead>
            <TableHead>서브레딧</TableHead>
            <TableHead>카테고리</TableHead>
            <TableHead>수집일</TableHead>
            <TableHead>작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map(idea => (
            <TableRow key={idea.id}>
              <TableCell className="max-w-md">
                <div className="line-clamp-2">{idea.title}</div>
              </TableCell>
              <TableCell>r/{idea.subreddit}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                  {idea.category}
                </span>
              </TableCell>
              <TableCell>
                {idea.collected_at 
                  ? new Date(idea.collected_at).toLocaleDateString('ko-KR')
                  : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a href={idea.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(idea.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
