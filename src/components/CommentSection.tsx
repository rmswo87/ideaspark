// 댓글 섹션 컴포넌트
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getComments, createComment, deleteComment } from '@/services/commentService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Trash2, Reply } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Comment } from '@/services/commentService';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplyAnonymous, setIsReplyAnonymous] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  async function fetchComments() {
    setLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment() {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      await createComment(postId, user.id, newComment, undefined, isAnonymous);
      setNewComment('');
      setIsAnonymous(false);
      fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('댓글 작성에 실패했습니다.');
    }
  }

  async function handleSubmitReply(parentId: string) {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!replyContent.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    try {
      await createComment(postId, user.id, replyContent, parentId, isReplyAnonymous);
      setReplyContent('');
      setIsReplyAnonymous(false);
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('답글 작성에 실패했습니다.');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isOwner = user && comment.user_id === user.id;

    return (
      <div key={comment.id} className={depth > 0 ? 'ml-8 mt-4 border-l-2 pl-4' : ''}>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {comment.anonymous_id || comment.user?.email || '익명'}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(comment.created_at)}
                  </span>
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm mb-3">{comment.content}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="h-4 w-4 mr-2" />
                답글
              </Button>
            </div>
            {replyingTo === comment.id && (
              <div className="mt-4 space-y-2">
                <Textarea
                  placeholder="답글을 입력하세요..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`reply-anonymous-${comment.id}`}
                    checked={isReplyAnonymous}
                    onCheckedChange={(checked: boolean) => setIsReplyAnonymous(checked === true)}
                  />
                  <Label htmlFor={`reply-anonymous-${comment.id}`} className="cursor-pointer text-sm">
                    익명으로 작성하기
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSubmitReply(comment.id)}>
                    작성
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                      setIsReplyAnonymous(false);
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 {comments.length}
        </h3>

        {user ? (
          <div className="space-y-2 mb-6">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comment-anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked: boolean) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="comment-anonymous" className="cursor-pointer text-sm">
                익명으로 작성하기
              </Label>
            </div>
            <Button onClick={handleSubmitComment}>댓글 작성</Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">댓글이 없습니다.</p>
        </div>
      ) : (
        <div>
          {comments.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  );
}


