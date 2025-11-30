// 커뮤니티 게시판 페이지 (SNS 스타일)
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { ProfileNotificationBadge } from '@/components/ProfileNotificationBadge';
import { MobileMenu } from '@/components/MobileMenu';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PostCardSkeleton } from '@/components/PostCardSkeleton';
import { useToast } from '@/components/ui/toast';

function CommunityPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, debouncedSearchQuery, selectedTags.join(','), sortOption]);

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

  // Pull-to-Refresh 핸들러
  async function handleRefresh() {
    setPage(0);
    setPosts([]);
    setHasMore(true);
    await fetchPosts(0, true);
    await fetchAllTags();
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
      addToast({
        title: '친구 요청 전송',
        description: '친구 요청을 보냈습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      addToast({
        title: '친구 요청 실패',
        description: error.message || '친구 요청에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleBlockUser(userId: string) {
    if (!user || !confirm('이 사용자를 차단하시겠습니까?')) return;

    try {
      await blockUser(userId);
      setFriendStatuses(prev => ({ ...prev, [userId]: 'blocked' }));
      addToast({
        title: '사용자 차단',
        description: '사용자를 차단했습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      addToast({
        title: '차단 실패',
        description: error.message || '차단에 실패했습니다.',
        variant: 'destructive',
      });
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
      addToast({
        title: '쪽지 전송',
        description: '쪽지를 보냈습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      addToast({
        title: '쪽지 전송 실패',
        description: error.message || '쪽지 전송에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleCreatePost() {
    if (!user) {
      addToast({
        title: '로그인 필요',
        description: '로그인이 필요합니다.',
        variant: 'warning',
      });
      navigate('/auth');
      return;
    }

    if (!newPost.title || !newPost.content) {
      addToast({
        title: '입력 오류',
        description: '제목과 내용을 입력해주세요.',
        variant: 'warning',
      });
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
      addToast({
        title: '이미지 업로드 실패',
        description: error.message || '이미지 업로드에 실패했습니다.',
        variant: 'destructive',
      });
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
    // anonymous_id가 있으면 익명 게시글 (사용자가 익명 체크박스를 선택한 경우)
    if (post.anonymous_id) {
      return { name: post.anonymous_id, isClickable: false };
    }
    
    // 자신의 게시글: 닉네임 우선, 없으면 '나'
    if (user && post.user_id === user.id) {
      return { 
        name: authorProfiles[post.user_id]?.nickname || '나', 
        isClickable: false 
      };
    }

    // 다른 사용자의 게시글
    const profile = authorProfiles[post.user_id];
    
    // 프로필 정보가 아직 로드되지 않은 경우 - 일단 클릭 가능하게 설정 (나중에 프로필 로드되면 업데이트됨)
    if (!profile) {
      return { name: '로딩 중...', isClickable: true };
    }

    // 공개 프로필: 닉네임 표시 (이메일 노출 방지)
    if (profile.is_public) {
      return { 
        name: profile.nickname || '익명', 
        isClickable: true,
        avatarUrl: profile.avatar_url
      };
    }

    // 비공개 프로필이지만 anonymous_id가 없는 경우
    // 사용자가 익명 체크박스를 선택하지 않았으므로 닉네임이 있으면 표시
    // 닉네임이 없으면 '익명'으로 표시 (프로필이 비공개이므로)
    // 비공개 프로필도 클릭 가능하게 설정 (프로필 보기는 가능하지만 친구추가/쪽지는 제한)
    return { 
      name: profile.nickname || '익명', 
      isClickable: true,
      avatarUrl: profile.avatar_url
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-0 sm:py-1.5">
          <div className="flex flex-row items-center justify-between gap-1 sm:gap-0 h-10 sm:h-auto">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* 모바일 햄버거 메뉴 */}
              <div className="md:hidden">
                <MobileMenu />
              </div>
              <h1 
                className="text-sm sm:text-2xl font-bold cursor-pointer hover:text-primary transition-colors select-none touch-manipulation leading-none"
                onClick={() => {
                  if (location.pathname === '/') {
                    window.location.reload();
                  } else {
                    navigate('/');
                  }
                }}
              >
                IdeaSpark
              </h1>
              <nav className="hidden md:flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname === '/' 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  아이디어
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/community') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                  disabled
                >
                  커뮤니티
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contact')}
                  className={`text-xs sm:text-sm transition-all duration-300 ${
                    location.pathname.includes('/contact') 
                      ? 'font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15' 
                      : 'hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  문의 / 피드백
                </Button>
              </nav>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                    >
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">관리자</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="relative text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary/5 hover:text-primary transition-all duration-300 border-border/50"
                  >
                    <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">프로필</span>
                    <ProfileNotificationBadge />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/auth');
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 border-border/50"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-border/50 hover:border-primary/50"
                >
                  <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Input
              placeholder="게시글 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-10 !pr-4"
            />
          </div>