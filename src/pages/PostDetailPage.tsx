// 게시글 상세 페이지
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, toggleLike, toggleBookmark, isLiked, isBookmarked, deletePost, updatePost } from '@/services/postService';
import { CommentSection } from '@/components/CommentSection';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Bookmark, Trash2, Calendar, User, UserPlus, MessageSquare, Edit2, Save, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { sendFriendRequest, getFriendStatus } from '@/services/friendService';
import { sendMessage } from '@/services/messageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import type { Post } from '@/services/postService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<{ is_public: boolean; nickname?: string } | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'blocked'>('none');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

  function getImageProxyBase() {
    return (
      import.meta.env.VITE_IMAGE_PROXY_BASE_URL ||
      (typeof window !== 'undefined' ? `${window.location.origin}/api/image-proxy` : '/api/image-proxy')
    );
  }

  function rewriteStorageUrl(src?: string) {
    if (!src || !SUPABASE_URL || !src.startsWith(SUPABASE_URL)) return src;
    const marker = '/storage/v1/object/public/';
    const idx = src.indexOf(marker);
    if (idx === -1) return src;
    const rest = src.substring(idx + marker.length);
    const [bucket, ...pathParts] = rest.split('/');
    const path = pathParts.join('/');
    const base = getImageProxyBase();
    return `${base}?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;
  }

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
      if (postData) {
        setEditTitle(postData.title);
        setEditContent(postData.content);
        setEditCategory(postData.category);
        setEditTagsInput(postData.tags?.join(', ') || '');
        setEditIsAnonymous(!!postData.anonymous_id);
      }

      if (user && postData) {
        // 좋아요/북마크 상태 확인
        const [likedStatus, bookmarkedStatus] = await Promise.all([
          isLiked(id, user.id),
          isBookmarked(id, user.id),
        ]);
        setLiked(likedStatus);
        setBookmarked(bookmarkedStatus);

        // 작성자 프로필 정보 가져오기 (공개 여부 확인)
        // 자신의 게시글이 아닌 경우와 자신의 게시글인 경우 모두 프로필 로드
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_public, nickname')
          .eq('id', postData.user_id)
          .single();
        
        if (profile) {
          setAuthorProfile(profile);
          // 다른 사용자의 게시글인 경우에만 친구 상태 확인
          if (postData.user_id !== user.id && profile.is_public) {
            const status = await getFriendStatus(postData.user_id);
            setFriendStatus(status);
          }
        }
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

  async function handleStartEdit() {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditTagsInput(post.tags?.join(', ') || '');
    setIsEditing(true);
  }

  async function handleCancelEdit() {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditTagsInput(post.tags?.join(', ') || '');
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    if (!user || !post || !id) return;

    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setSavingEdit(true);
    try {
      // 태그 배열로 변환
      const tags = editTagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const updated = await updatePost(id, {
        title: editTitle.trim(),
        content: editContent,
        category: editCategory,
        tags: tags.length > 0 ? tags : undefined,
        isAnonymous: editIsAnonymous,
      });
      setPost(updated);
      setIsEditing(false);
      alert('게시글이 수정되었습니다.');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSavingEdit(false);
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
  const canAddFriend = user && !isOwner && authorProfile?.is_public && friendStatus === 'none';
  const canSendMessage = user && !isOwner && authorProfile?.is_public;

  async function handleAddFriend() {
    if (!user || !post) return;
    
    try {
      await sendFriendRequest(post.user_id);
      setFriendStatus('pending');
      alert('친구 요청을 보냈습니다.');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      alert(error.message || '친구 요청에 실패했습니다.');
    }
  }

  async function handleSendMessage() {
    if (!user || !post || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage(post.user_id, messageContent);
      setMessageContent('');
      setMessageDialogOpen(false);
      alert('쪽지를 보냈습니다.');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || '쪽지 전송에 실패했습니다.');
    } finally {
      setSendingMessage(false);
    }
  }

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
              {isEditing ? (
                <Textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mb-2 text-lg font-semibold"
                  rows={1}
                />
              ) : (
                <CardTitle className="mb-2">{post.title}</CardTitle>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {(() => {
                    // anonymous_id가 있으면 익명 게시글
                    if (post.anonymous_id) {
                      return post.anonymous_id;
                    }
                    
                    // 자신의 게시글: 닉네임 우선, 없으면 '나'
                    if (isOwner) {
                      return authorProfile?.nickname || '나';
                    }

                    // 다른 사용자의 게시글
                    if (!authorProfile) {
                      return '로딩 중...';
                    }

                    // 공개 프로필: 닉네임 표시
                    if (authorProfile.is_public) {
                      return authorProfile.nickname || '익명';
                    }

                    // 비공개 프로필이지만 anonymous_id가 없는 경우: 닉네임이 있으면 표시
                    return authorProfile.nickname || '익명';
                  })()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.created_at)}
                </span>
                {isEditing ? (
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="w-[120px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="자유">자유</SelectItem>
                      <SelectItem value="질문">질문</SelectItem>
                      <SelectItem value="정보">정보</SelectItem>
                      <SelectItem value="후기">후기</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                    {post.category}
                  </span>
                )}
                {!isEditing && post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                )}
                {!isOwner && authorProfile?.is_public && (
                  <div className="flex items-center gap-2 ml-auto">
                    {canAddFriend && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddFriend}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        친구추가
                      </Button>
                    )}
                    {friendStatus === 'pending' && (
                      <span className="text-xs text-muted-foreground">요청 대기 중</span>
                    )}
                    {friendStatus === 'accepted' && (
                      <span className="text-xs text-muted-foreground">친구</span>
                    )}
                    {canSendMessage && (
                      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            쪽지
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>쪽지 보내기</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea
                              placeholder="쪽지 내용을 입력하세요"
                              value={messageContent}
                              onChange={(e) => setMessageContent(e.target.value)}
                              rows={6}
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={sendingMessage || !messageContent.trim()}
                              className="w-full"
                            >
                              {sendingMessage ? '전송 중...' : '보내기'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {savingEdit ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={savingEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      취소
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            {isEditing && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">태그 (쉼표로 구분)</label>
                  <Input
                    placeholder="예: 개발, React, TypeScript"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    태그는 쉼표로 구분하여 입력하세요.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-anonymous"
                    checked={editIsAnonymous}
                    onCheckedChange={(checked: boolean) => setEditIsAnonymous(checked === true)}
                  />
                  <Label htmlFor="edit-anonymous" className="text-sm font-normal cursor-pointer">
                    익명으로 작성하기
                  </Label>
                </div>
              </>
            )}
            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => {
                      const src = (props as any).src as string | undefined;
                      const rewritten = rewriteStorageUrl(src);
                      return (
                        <img
                          {...props}
                          src={rewritten}
                          className="max-w-full h-auto rounded-md my-2"
                          alt={props.alt || ''}
                          loading="lazy"
                        />
                      );
                    },
                    p: ({ node, ...props }) => (
                      <p {...props} className="mb-2 last:mb-0" />
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
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

<<<<<<< HEAD
export default PostDetailPage;


=======
export default PostDetailPage;
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
