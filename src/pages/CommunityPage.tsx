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
        const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
        const newContent = 
          newPost.content.slice(0, cursorPos) + 
          imageMarkdown + 
          newPost.content.slice(cursorPos);
        
      ...