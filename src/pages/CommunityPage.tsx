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
import { Plus, MessageSquare, Heart, Bookmark, User as UserIcon, UserPlus, Ban, MoreVertical, LogOut, Search, X, Tag, Shield, Image as ImageIcon, Loader2 } from 'lucide-react';
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

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    if (user && posts.length > 0) {
      fetchAuthorProfiles();
    }
  }, [user, posts]);

  async function fetchPosts(offset: number, reset = false) {
    if (reset) {
      setLoading(true);
    }

    try {
      const data = await getPosts({
        category: category === 'all' ? undefined : category,
        search: debouncedSearchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortOption,
        limit: POSTS_PER_PAGE,
        offset: offset,
      });

      if (reset) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }

      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching posts:', error);
      if (reset) {
        setPosts([]);
      }
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
    
    try {
      const data = await getPosts({
        category: category === 'all' ? undefined : category,
        search: debouncedSearchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortOption,
        limit: POSTS_PER_PAGE,
        offset: nextPage * POSTS_PER_PAGE,
      });

      setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }

  async function fetchAllTags() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null);

      if (error) throw error;

      const tagsSet = new Set<string>();
      (data || []).forEach((post: any) => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              tagsSet.add(tag.trim());
            }
          });
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
    } catch (error) {
      console.error('Error creating post:', error);
      alert('게시글 작성에 실패했습니다.');
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

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 이미지 파일인 경우
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && user) {
          await handleImageUpload(file);
        }
        return;
      }
    }
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && user) {
      handleImageUpload(file);
    }
  }

  const formatDate = (dateString: string) => {
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

  const getAuthorDisplay = (post: Post) => {
    if (post.anonymous_id) {
      return { name: post.anonymous_id, isClickable: false };
    }
    
    if (user && post.user_id === user.id) {
      return { name: authorProfiles[post.user_id]?.nickname || user.email || '나', isClickable: false };
    }

    const profile = authorProfiles[post.user_id];
    if (profile?.is_public) {
      return { 
        name: profile.nickname || post.user?.email || '익명', 
        isClickable: true,
        avatarUrl: profile.avatar_url
      };
    }

    return { name: post.user?.email || '익명', isClickable: false };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 
                className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate('/')}
              >
                IdeaSpark
              </h1>
              <nav className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-semibold bg-secondary"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  커뮤니티
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      관리자
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    프로필
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/auth');
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 검색 및 필터 섹션 */}
        <div className="mb-6 space-y-4">
          {/* 검색 바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="게시글 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 필터 그룹 */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* 정렬 옵션 */}
            <Select value={sortOption} onValueChange={(value: 'latest' | 'popular' | 'comments') => setSortOption(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="comments">댓글순</SelectItem>
              </SelectContent>
            </Select>

            {/* 카테고리 탭 */}
            <Tabs value={category} onValueChange={setCategory} className="flex-1">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="질문">질문</TabsTrigger>
                <TabsTrigger value="자유">자유</TabsTrigger>
                <TabsTrigger value="아이디어 공유">아이디어 공유</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 글쓰기 버튼 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!user} size="sm">
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
                    <label className="text-sm font-medium mb-2 block">카테고리</label>
                    <Select value={newPost.category} onValueChange={(value) => setNewPost({ ...newPost, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="질문">질문</SelectItem>
                        <SelectItem value="자유">자유</SelectItem>
                        <SelectItem value="아이디어 공유">아이디어 공유</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">제목</label>
                    <Input
                      placeholder="게시글 제목을 입력하세요"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium block">내용</label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageInputChange}
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
                      </div>
                    </div>
                    <Textarea
                      ref={contentTextareaRef}
                      placeholder="게시글 내용을 입력하세요 (Ctrl+V로 이미지 붙여넣기 가능)"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      onPaste={handlePaste}
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 팁: Ctrl+V (또는 Cmd+V)로 클립보드의 이미지를 바로 붙여넣을 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">태그 (쉼표로 구분)</label>
                    <Input
                      placeholder="예: 개발, React, TypeScript"
                      value={newPost.tags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value
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
          </div>

          {/* 선택된 태그 표시 */}
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">선택된 태그:</span>
              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded-md text-xs"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 hover:bg-primary/80 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="h-7 text-xs"
              >
                모두 제거
              </Button>
            </div>
          )}

          {/* 태그 목록 */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="h-4 w-4" />
                태그:
              </span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 게시글 목록 (SNS 스타일) */}
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const author = getAuthorDisplay(post);
              const isOwner = user && post.user_id === user.id;
              const canInteract = !isOwner && author.isClickable && user;

              return (
                <Card 
                  key={post.id} 
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-4">
                    {/* 작성자 정보 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0">
                        {author.avatarUrl ? (
                          <img
                            src={author.avatarUrl}
                            alt={author.name}
                            className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {canInteract ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="font-semibold hover:text-primary transition-colors text-left flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate">{author.name}</span>
                                  <MoreVertical className="h-3 w-3 flex-shrink-0" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => navigate(`/profile/${post.user_id}`)}>
                                  <UserIcon className="h-4 w-4 mr-2" />
                                  프로필 보기
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {friendStatuses[post.user_id] === 'none' && (
                                  <DropdownMenuItem onClick={() => handleAddFriend(post.user_id)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    친구 추가
                                  </DropdownMenuItem>
                                )}
                                {friendStatuses[post.user_id] === 'pending' && (
                                  <DropdownMenuItem disabled>
                                    요청 대기 중
                                  </DropdownMenuItem>
                                )}
                                {friendStatuses[post.user_id] === 'accepted' && (
                                  <DropdownMenuItem disabled>
                                    친구
                                  </DropdownMenuItem>
                                )}
                                {friendStatuses[post.user_id] !== 'blocked' && (
                                  <DropdownMenuItem onClick={() => handleOpenMessageDialog(post.user_id)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    쪽지 보내기
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {friendStatuses[post.user_id] !== 'blocked' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleBlockUser(post.user_id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    차단하기
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="font-semibold">{author.name}</span>
                          )}
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                          <span className="px-2 py-0.5 bg-secondary rounded-md text-xs ml-auto">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 제목 및 내용 */}
                    <div 
                      className="cursor-pointer mb-3"
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="text-sm text-muted-foreground mb-3 prose prose-sm dark:prose-invert max-w-none line-clamp-3">
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
                          {post.content}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!selectedTags.includes(tag)) {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs hover:bg-primary/20 transition-colors"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                      <button
                        onClick={() => navigate(`/community/${post.id}`)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.comment_count}
                      </button>
                      <button
                        onClick={() => navigate(`/community/${post.id}`)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        {post.like_count}
                      </button>
                      <button
                        onClick={() => navigate(`/community/${post.id}`)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <Bookmark className="h-4 w-4" />
                        {post.bookmark_count}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* 무한 스크롤 타겟 */}
            <div ref={observerTarget} className="h-4" />
            
            {/* 로딩 더보기 */}
            {loadingMore && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">더 많은 게시글을 불러오는 중...</p>
              </div>
            )}

            {/* 더 이상 없음 */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">모든 게시글을 불러왔습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
