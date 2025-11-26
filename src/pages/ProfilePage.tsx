// 프로필 페이지
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, MessageSquare, Heart, Bookmark } from 'lucide-react';

export function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    bookmarks: 0,
    prds: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchStats();
    }
  }, [user, loading, navigate]);

  async function fetchStats() {
    if (!user) return;

    try {
      // 게시글 수
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 댓글 수
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 좋아요 받은 수 (내 게시글의 좋아요 수 합계)
      const { data: myPosts } = await supabase
        .from('posts')
        .select('like_count')
        .eq('user_id', user.id);

      const totalLikes = myPosts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0;

      // 북마크 수
      const { count: bookmarksCount } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // PRD 수
      const { count: prdsCount } = await supabase
        .from('prds')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        posts: postsCount || 0,
        comments: commentsCount || 0,
        likes: totalLikes,
        bookmarks: bookmarksCount || 0,
        prds: prdsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        홈으로
      </Button>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>{user.email}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              작성한 게시글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.posts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              작성한 댓글
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.comments}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5" />
              받은 좋아요
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.likes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              북마크
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.bookmarks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              생성한 PRD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.prds}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

