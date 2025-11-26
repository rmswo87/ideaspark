// 게시글 상세 페이지
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, toggleLike, toggleBookmark, isLiked, isBookmarked, deletePost } from '@/services/postService';
import { CommentSection } from '@/components/CommentSection';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Bookmark, Trash2, Calendar, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Post } from '@/services/postService';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id, user]);

  async function fetchPost() {
    if (!id) return;

    setLoading(true);
    try {
      const postData = await getPost(id);
      setPost(postData);

      if (user && postData) {
        // 좋아요/북마크 상태 확인
        const [likedStatus, bookmarkedStatus] = await Promise.all([
          isLiked(id, user.id),
          isBookmarked(id, user.id),
        ]);
        setLiked(likedStatus);
        setBookmarked(bookmarkedStatus);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleLike() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      navigate('/auth');
      return;
    }

    try {
      const newLiked = await toggleLike(id, user.id);
      setLiked(newLiked);
      if (post) {
        setPost({
          ...post,
          like_count: newLiked ? post.like_count + 1 : post.like_count - 1,
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  }

  async function handleToggleBookmark() {
    if (!user || !id) {
      alert('로그인이 필요합니다.');
      navigate('/auth');
      return;
    }

    try {
      const newBookmarked = await toggleBookmark(id, user.id);
      setBookmarked(newBookmarked);
      if (post) {
        setPost({
          ...post,
          bookmark_count: newBookmarked ? post.bookmark_count + 1 : post.bookmark_count - 1,
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('북마크 처리에 실패했습니다.');
    }
  }

  async function handleDelete() {
    if (!id || !user) return;

    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await deletePost(id);
      navigate('/community');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">게시글을 찾을 수 없습니다.</p>
            <Button onClick={() => navigate('/community')}>커뮤니티로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user && post.user_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/community')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-2">{post.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.anonymous_id || post.user?.email || '익명'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.created_at)}
                </span>
                <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                  {post.category}
                </span>
              </div>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap mb-6">{post.content}</div>
          <div className="flex items-center gap-4">
            <Button
              variant={liked ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleLike}
              disabled={!user}
            >
              <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
              {post.like_count}
            </Button>
            <Button
              variant={bookmarked ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleBookmark}
              disabled={!user}
            >
              <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
              {post.bookmark_count}
            </Button>
          </div>
        </CardContent>
      </Card>

      <CommentSection postId={post.id} />
    </div>
  );
}

