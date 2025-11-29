// 커뮤니티 게시판 페이지 (SNS 스타일)
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPosts, createPost } from '@/services/postService';
import { useAuth } from '@/hooks/useAuth';
import { Plus, MessageSquare, Heart, Bookmark, User as UserIcon, UserPlus, Ban, Search, X, Tag, Loader2, Image as ImageIcon, Shield, LogOut, MoreVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { sendFriendRequest, getFriendStatus, blockUser } from '@/services/friendService';
import { sendMessage } from '@/services/messageService';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';
import { uploadPostImage } from '@/services/imageService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Post } from '@/services/postService';

export function CommunityPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<'latest' | 'popular' | 'comments'>('latest');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '자유', isAnonymous: false, tags: [] as string[] });
  const [tagsInput, setTagsInput] = useState('');
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageTargetUserId, setMessageTargetUserId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, { is_public: boolean; nickname?: string; avatar_url?: string }>>({});
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'blocked'>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 20;
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
    const rest = src.substring(idx + marker.length); // e.g. post-images/...
    const [bucket, ...pathParts] = rest.split('/');
    const path = pathParts.join('/');
    const base = getImageProxyBase();
    return `${base}?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;
  }

  // 검색어 디바운싱 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 필터 변경 시 초기화
  useEffect(() => {
    setPage(0);
    setPosts([]);
    setHasMore(true);
    fetchPosts(0, true);
    fetchAllTags();
  }, [category, debouncedSearchQuery, selectedTags, sortOption]);

  // 무한 스크롤 옵저버
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

  async function fetchPosts(offset: number, reset: boolean = false) {
    try {
      const data = await getPosts({
        category: category === 'all' ? undefined : category,
        offset,
        limit: POSTS_PER_PAGE,
        search: debouncedSearchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortOption,
      });

      if (reset) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }

      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function loadMorePosts() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage * POSTS_PER_PAGE, false);
  }

  async function fetchAllTags() {
    try {
      const { data } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null);

      const tagsSet = new Set<string>();
      data?.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });

      setAllTags(Array.from(tagsSet).sort());
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }

  async function fetchAuthorProfiles() {
    if (!user) return;

    const profiles: Record<string, { is_public: boolean; nickname?: string; avatar_url?: string }> = {};
    const statuses: Record<string, 'none' | 'pending' | 'accepted' | 'blocked'> = {};

    for (const post of posts) {
      if (post.anonymous_id || post.user_id === user.id) continue;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_public, nickname, avatar_url')
          .eq('id', post.user_id)
          .single();

        if (profile) {
          profiles[post.user_id] = profile;
          if (profile.is_public) {
            const status = await getFriendStatus(post.user_id);
            statuses[post.user_id] = status;
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    setAuthorProfiles(profiles);
    setFriendStatuses(statuses);
  }

  async function handleAddFriend(userId: string) {
    if (!user) return;

    try {
      await sendFriendRequest(userId);
      setFriendStatuses(prev => ({ ...prev, [userId]: 'pending' }));
      alert('친구 요청을 보냈습니다.');
    } catch (error: any) {
      alert(error.message || '친구 요청에 실패했습니다.');
    }
  }

  async function handleBlockUser(userId: string) {
    if (!user || !confirm('이 사용자를 차단하시겠습니까?')) return;

    try {
      await blockUser(userId);
      setFriendStatuses(prev => ({ ...prev, [userId]: 'blocked' }));
      alert('사용자를 차단했습니다.');
    } catch (error: any) {
      alert(error.message || '차단에 실패했습니다.');
    }
  }

  function handleOpenMessageDialog(userId: string) {
    setMessageTargetUserId(userId);
    setMessageDialogOpen(true);
  }

  async function handleSendMessage() {
    if (!user || !messageTargetUserId || !messageContent.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage(messageTargetUserId, messageContent);
      setMessageContent('');
      setMessageDialogOpen(false);
      alert('쪽지를 보냈습니다.');
    } catch (error: any) {
      alert(error.message || '쪽지 전송에 실패했습니다.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleCreatePost() {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/auth');
      return;
    }

    if (!newPost.title || !newPost.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      // 태그 입력값 초기화
      setTagsInput('');
      await createPost(user.id, {
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        isAnonymous: newPost.isAnonymous,
        tags: newPost.tags,
      });
      setDialogOpen(false);
      setNewPost({ title: '', content: '', category: '자유', isAnonymous: false, tags: [] });
      // 초기화 후 다시 로드
      setPage(0);
      setPosts([]);
      setHasMore(true);
      await fetchPosts(0, true);
      fetchAllTags();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert('게시글 작성에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  }

  async function handleImageUpload(file: File) {
    if (!user) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadPostImage(file, user.id);
      
      // 현재 커서 위치에 이미지 마크다운 삽입
      const textarea = contentTextareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart || 0;
        const imageMarkdown = '\n![' + file.name + '](' + imageUrl + ')\n';
        const newContent =
          newPost.content.slice(0, cursorPos) +
          imageMarkdown +
          newPost.content.slice(cursorPos);

        setNewPost({ ...newPost, content: newContent });

        // 커서 위치 조정
        setTimeout(() => {
          textarea.focus();
          const newCursorPos = cursorPos + imageMarkdown.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // textarea가 없으면 끝에 추가
        const appended = newPost.content + '\n![' + file.name + '](' + imageUrl + ')\n';
        setNewPost({
          ...newPost,
          content: appended,
        });
      }
    } catch (error: any) {
      console.error('이미지 업로드 오류:', error);
      alert(error.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        return;
      }
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    fetchPosts(0, true);
    fetchAllTags();
  }, []);

  useEffect(() => {
    if (posts.length > 0 && user) {
      fetchAuthorProfiles();
    }
  }, [posts, user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  글쓰기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 게시글 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">제목</label>
                    <Input
                      placeholder="게시글 제목을 입력하세요"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">카테고리</label>
                    <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                      <SelectTrigger>
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
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">내용</label>
                    <div className="space-y-2">
                      <Textarea
                        ref={contentTextareaRef}
                        placeholder="게시글 내용을 입력하세요 (마크다운 지원)"
                        value={newPost.content}
                        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                        onPaste={handlePaste}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          className="hidden"
                          id="post-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImage || !user}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              업로드 중...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-4 w-4 mr-2" />
                              이미지 추가
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          💡 Ctrl+V (또는 Cmd+V)로 클립보드의 이미지를 바로 붙여넣을 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">태그 (쉼표로 구분)</label>
                    <Input
                      placeholder="예: 개발, React, TypeScript"
                      value={tagsInput}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setTagsInput(inputValue);
                        // 쉼표로 구분하여 태그 배열 업데이트
                        const tags = inputValue
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(tag => tag.length > 0);
                        setNewPost({ ...newPost, tags });
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      태그는 쉼표로 구분하여 입력하세요. 예: 개발, React, TypeScript
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={newPost.isAnonymous}
                      onCheckedChange={(checked: boolean) => setNewPost({ ...newPost, isAnonymous: checked === true })}
                    />
                    <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                      익명으로 작성하기
                    </Label>
                  </div>
                  <Button onClick={handleCreatePost} className="w-full">
                    작성하기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 필터 및 검색 */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="게시글 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'comments') => setSortOption(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="comments">댓글순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={category} onValueChange={setCategory}>
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="자유">자유</TabsTrigger>
              <TabsTrigger value="질문">질문</TabsTrigger>
              <TabsTrigger value="정보">정보</TabsTrigger>
              <TabsTrigger value="후기">후기</TabsTrigger>
              <TabsTrigger value="기타">기타</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">태그:</span>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className="text-xs"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  모두 해제
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">게시글이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/community/${post.id}`)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="hover:text-foreground transition-colors flex items-center gap-1">
                            {post.anonymous_id ? (
                              <span>익명 {post.anonymous_id}</span>
                            ) : (
                              <>
                                <span className="truncate">{authorProfiles[post.user_id]?.nickname || post.user?.email || '사용자'}</span>
                                <MoreVertical className="h-3 w-3 flex-shrink-0" />
                              </>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        {!post.anonymous_id && post.user_id !== user?.id && authorProfiles[post.user_id]?.is_public && (
                          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${post.user_id}`);
                            }}>
                              <UserIcon className="h-4 w-4 mr-2" />
                              프로필 보기
                            </DropdownMenuItem>
                            {friendStatuses[post.user_id] === 'none' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleAddFriend(post.user_id);
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                친구 추가
                              </DropdownMenuItem>
                            )}
                            {friendStatuses[post.user_id] === 'accepted' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMessageDialog(post.user_id);
                              }}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                쪽지 보내기
                              </DropdownMenuItem>
                            )}
                            {friendStatuses[post.user_id] !== 'blocked' && (
                              <DropdownMenuSeparator />
                            )}
                            {friendStatuses[post.user_id] !== 'blocked' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockUser(post.user_id);
                                }}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                차단하기
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                      <span>·</span>
                      <span>{formatRelativeTime(post.created_at)}</span>
                      <span>·</span>
                      <span className="px-2 py-0.5 bg-secondary rounded-md text-xs">{post.category}</span>
                    </div>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
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
                          />
                        );
                      },
                      p: ({ node, ...props }) => (
                        <p {...props} className="mb-2 last:mb-0" />
                      ),
                    }}
                  >
                    {post.content.substring(0, 300) + (post.content.length > 300 ? '...' : '')}
                  </ReactMarkdown>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {post.tags.map((tag: string) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!selectedTags.includes(tag)) {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className="text-xs h-6"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.comment_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.like_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-4 w-4" />
                    {post.bookmark_count || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          <div ref={observerTarget} className="h-4" />
          {loadingMore && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          )}
        </div>
      )}

      {/* 쪽지 다이얼로그 */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쪽지 보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="쪽지 내용을 입력하세요"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
            />
            <Button onClick={handleSendMessage} disabled={sendingMessage || !messageContent.trim()} className="w-full">
              {sendingMessage ? '전송 중...' : '전송'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
