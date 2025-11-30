// 관리자 대시보드 개요
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, FileText, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AdminOverviewProps {
  onTabChange?: (tab: string) => void;
}

export function AdminOverview({ onTabChange }: AdminOverviewProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalIdeas: 0,
    totalPosts: 0,
    totalComments: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // profiles 테이블에서 사용자 수 조회
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const totalUsers = usersCount || 0;

      // 아이디어 수
      const { count: ideasCount } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true });

      // 게시글 수
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // 댓글 수
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers,
        totalIdeas: ideasCount || 0,
        totalPosts: postsCount || 0,
        totalComments: commentsCount || 0,
      });

      // 최근 게시글 5개 가져오기
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, created_at, user_id, category')
        .order('created_at', { ascending: false })
        .limit(5);

      if (posts) {
        // profiles 테이블에서 사용자 정보 가져오기
        const postsWithUsers = await Promise.all(
          posts.map(async (post) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, nickname')
                .eq('id', post.user_id)
                .single();
              return {
                ...post,
                userEmail: profile?.email || profile?.nickname || '익명',
              };
            } catch {
              return {
                ...post,
                userEmail: '익명',
              };
            }
          })
        );
        setRecentPosts(postsWithUsers);
      }

      // 최근 아이디어 5개 가져오기
      const { data: ideas } = await supabase
        .from('ideas')
        .select('id, title, subreddit, upvotes, collected_at')
        .order('collected_at', { ascending: false })
        .limit(5);

      if (ideas) {
        setRecentIdeas(ideas);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              총 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-2">등록된 전체 사용자 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              총 아이디어
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalIdeas}</p>
            <p className="text-xs text-muted-foreground mt-2">수집된 전체 아이디어 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              총 게시글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalPosts}</p>
            <p className="text-xs text-muted-foreground mt-2">커뮤니티에 작성된 게시글 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              총 댓글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalComments}</p>
            <p className="text-xs text-muted-foreground mt-2">작성된 전체 댓글 수</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시스템 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">활성 사용자</span>
                <span className="font-medium">{stats.totalUsers > 0 ? '정상 운영 중' : '대기 중'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">아이디어 수집</span>
                <span className="font-medium">{stats.totalIdeas > 0 ? `${stats.totalIdeas}개 수집됨` : '수집 대기 중'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">커뮤니티 활동</span>
                <span className="font-medium">{stats.totalPosts > 0 ? '활발함' : '조용함'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">최근 게시글</CardTitle>
              <button
                onClick={() => {
                  if (onTabChange) {
                    onTabChange('posts');
                  }
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                모두 보기 <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPosts.length > 0 ? (
              <div className="space-y-2">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/community/${post.id}`)}
                  >
                    <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.userEmail} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">최근 게시글이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">최근 아이디어</CardTitle>
              <button
                onClick={() => {
                  if (onTabChange) {
                    onTabChange('ideas');
                  }
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                모두 보기 <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {recentIdeas.length > 0 ? (
              <div className="space-y-2">
                {recentIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/idea/${idea.id}`)}
                  >
                    <p className="text-sm font-medium line-clamp-1">{idea.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      r/{idea.subreddit} · 👍 {idea.upvotes || 0} · {new Date(idea.collected_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">최근 아이디어가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
