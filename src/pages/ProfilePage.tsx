// 프로필 페이지
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, MessageSquare, Heart, Bookmark, Camera, Upload, MoreVertical, UserPlus, Ban, Trash2, UserIcon, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFriends, getFriendRequests, acceptFriendRequest, deleteFriendRequest, getBlockedUsers, unblockUser, sendFriendRequest, getFriendStatus, blockUser } from '@/services/friendService';
import { getPRDs, deletePRD } from '@/services/prdService';
import { PRDViewer } from '@/components/PRDViewer';
import { getConversations, getConversation, sendMessage, markAsRead, deleteMessage, deleteConversation } from '@/services/messageService';
import { getBookmarkedPosts, getLikedPosts, getMyPosts } from '@/services/postService';
import { getMyComments } from '@/services/commentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { uploadAvatar } from '@/services/imageService';
import type { FriendRequest, Friend } from '@/services/friendService';
import type { Conversation, Message } from '@/services/messageService';
import type { Post } from '@/services/postService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/components/ui/toast';

function ProfilePage() {
  const params = useParams<{ userId?: string }>();
  const urlUserId = params?.userId;
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  // URL에 userId가 있으면 해당 사용자의 프로필, 없으면 로그인한 사용자의 프로필
  const targetUserId = urlUserId || user?.id;
  const isOwnProfile = user?.id === targetUserId;
  const [activeTab, setActiveTab] = useState('stats');
  const scrollPositionRef = useRef<{ [key: string]: number }>({});
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    bookmarks: 0,
    prds: 0,
  });
  const [profile, setProfile] = useState<{ is_public: boolean; nickname?: string; bio?: string; avatar_url?: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [postsDialogOpen, setPostsDialogOpen] = useState(false);
  const [postsDialogType, setPostsDialogType] = useState<'my' | 'liked' | 'bookmarked'>('my');
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [prdsDialogOpen, setPrdsDialogOpen] = useState(false);
  const [prdsList, setPrdsList] = useState<any[]>([]);
  const [loadingPrds, setLoadingPrds] = useState(false);
  const [selectedPrd, setSelectedPrd] = useState<any | null>(null);
  const [donationCopied, setDonationCopied] = useState(false);
  const [donationShowQR, setDonationShowQR] = useState(false);
  const [donationQrError, setDonationQrError] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const [previewComments, setPreviewComments] = useState<any[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'blocked'>>({});
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageDialogUserId, setMessageDialogUserId] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

  const donationAccountNumber = '3333258583773';
  const donationBankName = '카카오뱅크';
  const donationAccountHolder = '자취만렙';
  // QR 코드 이미지는 public 폴더에 있으므로 루트 경로로 접근
  // Vite와 Vercel 모두에서 동작하도록 BASE_URL 활용
  const baseUrl = import.meta.env.BASE_URL || '';
  const donationQrUrl = `${baseUrl}QR.png`.replace(/\/\//g, '/').replace(/^\/+/, '/');

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
    // URL에 userId가 있고 로그인하지 않은 경우는 허용 (공개 프로필 조회)
    // URL에 userId가 없고 로그인하지 않은 경우만 로그인 페이지로
    if (!loading && !urlUserId && !user) {
      navigate('/auth');
      return;
    }

    // targetUserId가 있으면 프로필 로드
    if (targetUserId) {
      fetchProfile();
      if (isOwnProfile && user) {
        // 자신의 프로필인 경우에만 통계, 친구, 쪽지 등 로드
        fetchStats();
        fetchFriends();
        fetchFriendRequests();
        fetchConversations();
        fetchBlockedUsers();
        fetchPreviewData();
      } else if (user) {
        // 다른 사람의 프로필인 경우 통계만 로드 (공개 정보)
        fetchOtherUserStats();
      }
    }
  }, [user, loading, navigate, targetUserId, urlUserId, isOwnProfile]);

  // 탭 전환 시 스크롤 위치 저장 및 복원
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current[activeTab] = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // 부드러운 스크롤 함수 (커스텀 속도 조절)
  const smoothScrollTo = (targetPosition: number, duration: number = 500) => {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    
    // 거리가 매우 작으면 즉시 이동
    if (Math.abs(distance) < 10) {
      window.scrollTo(0, targetPosition);
      return;
    }
    
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  // 탭 변경 시 스크롤 위치 복원 (부드러운 애니메이션)
  useEffect(() => {
    // 약간의 지연을 두어 DOM 업데이트 후 스크롤 복원
    const timer = setTimeout(() => {
      const savedPosition = scrollPositionRef.current[activeTab];
      
      if (savedPosition !== undefined && savedPosition > 0) {
        // 저장된 위치가 있으면 그 위치로 부드럽게 이동
        smoothScrollTo(savedPosition, 500);
      } else {
        // 저장된 위치가 없으면 현재 위치에서 최상단으로 부드럽게 이동
        // (친구 탭처럼 스크롤이 없는 경우에도 부드럽게 전환)
        smoothScrollTo(0, 500);
      }
    }, 100); // DOM 업데이트를 위한 약간의 지연

    return () => clearTimeout(timer);
  }, [activeTab]);

  async function fetchPreviewData() {
    if (!user) return;
    
    try {
      // 최근 게시글 3개 미리보기
      const myPosts = await getMyPosts(user.id);
      setPreviewPosts(myPosts.slice(0, 3));

      // 최근 댓글 3개 미리보기
      const myComments = await getMyComments(user.id);
      setPreviewComments(myComments.slice(0, 3));
    } catch (error) {
      console.error('Error fetching preview data:', error);
    }
  }

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

  async function fetchProfile() {
    if (!targetUserId) return;

    try {
      // 자신의 프로필인 경우 모든 필드 조회 가능
      // 다른 사람의 프로필인 경우 공개 프로필만 조회 가능
      let query = supabase
        .from('profiles')
        .select('is_public, nickname, bio, avatar_url')
        .eq('id', targetUserId);

      // 다른 사람의 프로필인 경우 공개 프로필만 조회
      if (!isOwnProfile) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        // 프로필이 없으면 기본값 설정 (기본값은 true)
        setProfile({ is_public: true });
        return;
      }

      // 다른 사람의 프로필이고 공개되지 않은 경우
      if (!isOwnProfile && (!data || !data.is_public)) {
        alert('이 사용자의 프로필은 비공개입니다.');
        navigate('/');
        return;
      }

      // 프로필이 없으면 기본값 설정
        setProfile(data || { is_public: true });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // 에러 발생 시에도 기본값 설정 (기본값은 true)
      setProfile({ is_public: true });
    }
  }

  async function fetchOtherUserStats() {
    if (!targetUserId) return;

    try {
      // 게시글 수
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // 좋아요 받은 수 (내 게시글의 좋아요 수 합계)
      const { data: myPosts } = await supabase
        .from('posts')
        .select('like_count')
        .eq('user_id', targetUserId);

      const totalLikes = myPosts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0;

      setStats({
        posts: postsCount || 0,
        comments: 0, // 다른 사람의 댓글 수는 비공개
        likes: totalLikes,
        bookmarks: 0, // 다른 사람의 북마크 수는 비공개
        prds: 0, // 다른 사람의 PRD 수는 비공개
      });
    } catch (error) {
      console.error('Error fetching other user stats:', error);
    }
  }

  async function updateProfile(updates: { is_public?: boolean; nickname?: string; bio?: string; avatar_url?: string }) {
    if (!user) return;

    try {
      // 프로필이 없으면 기본값으로 is_public = true 설정
      const profileData: any = {
        id: user.id,
        email: user.email,
        is_public: true, // 기본값 true
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !isOwnProfile) return;

    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      addToast({
        title: '파일 형식 오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'warning',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: '파일 크기 오류',
        description: '파일 크기는 5MB를 초과할 수 없습니다.',
        variant: 'warning',
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: publicUrl });
      // 프로필 정보 다시 불러오기
      await fetchProfile();
    } catch (error: any) {
      console.error('프로필 사진 업로드 오류:', error);
      addToast({
        title: '업로드 실패',
        description: '프로필 사진 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'),
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      // 파일 입력 초기화
      if (e.target) {
        e.target.value = '';
      }
    }
  }

  async function fetchFriends() {
    if (!user) return;

    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }

  async function fetchFriendRequests() {
    if (!user) return;

    try {
      const data = await getFriendRequests();
      setFriendRequests(data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }

  async function handleAcceptRequest(requestId: string) {
    try {
      await acceptFriendRequest(requestId);
      await fetchFriendRequests();
      await fetchFriends();
      // 알림 갱신을 위해 window 이벤트 발생 (ProfileNotificationBadge가 감지)
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error: any) {
      addToast({
        title: '친구 요청 수락 실패',
        description: error.message || '친구 요청 수락에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      await deleteFriendRequest(requestId);
      await fetchFriendRequests();
      // 알림 갱신을 위해 window 이벤트 발생 (ProfileNotificationBadge가 감지)
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error: any) {
      addToast({
        title: '친구 요청 거절 실패',
        description: error.message || '친구 요청 거절에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function fetchConversations() {
    if (!user) return;

    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }

  async function fetchMessages(userId: string) {
    if (!user) return;

    try {
      const data = await getConversation(userId);
      setMessages(data.reverse()); // 최신 메시지가 아래에 오도록
      setSelectedConversation(userId);
      
      // 읽지 않은 메시지를 읽음 처리
      const unreadMessages = data.filter(msg => msg.receiver_id === user.id && !msg.is_read);
      for (const msg of unreadMessages) {
        try {
          await markAsRead(msg.id);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
      
      // 알림 갱신을 위해 대화 목록도 새로고침
      await fetchConversations();
      // 알림 갱신을 위해 window 이벤트 발생 (ProfileNotificationBadge가 감지)
      window.dispatchEvent(new CustomEvent('notification-updated'));
      
      // 친구 상태 확인
      const status = await getFriendStatus(userId);
      setFriendStatuses(prev => ({ ...prev, [userId]: status }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }
  
  async function handleAddFriendFromMessage(userId: string) {
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
      console.error('Error sending friend request:', error);
      addToast({
        title: '친구 요청 실패',
        description: error.message || '친구 요청에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }
  
  async function handleBlockUserFromMessage(userId: string) {
    if (!user || !confirm('이 사용자를 차단하시겠습니까?')) return;
    
    try {
      await blockUser(userId);
      setFriendStatuses(prev => ({ ...prev, [userId]: 'blocked' }));
      await fetchBlockedUsers();
      addToast({
        title: '사용자 차단',
        description: '사용자를 차단했습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error blocking user:', error);
      addToast({
        title: '차단 실패',
        description: error.message || '차단에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }
  
  function handleOpenMessageDialogFromMessage(userId: string) {
    setMessageDialogUserId(userId);
    setMessageDialogOpen(true);
  }

  async function handleDeleteConversation(userId: string) {
    if (!user || !confirm('이 대화를 삭제하시겠습니까?')) return;

    try {
      await deleteConversation(userId);
      await fetchConversations();
      if (selectedConversation === userId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      // 알림 갱신
      window.dispatchEvent(new CustomEvent('notification-updated'));
      addToast({
        title: '대화 삭제',
        description: '대화가 삭제되었습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      addToast({
        title: '대화 삭제 실패',
        description: error.message || '대화 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function handleDeleteSelectedConversations() {
    if (!user || selectedConversations.size === 0) return;
    
    if (!confirm(`선택한 ${selectedConversations.size}개의 대화를 삭제하시겠습니까?`)) return;

    try {
      for (const userId of selectedConversations) {
        await deleteConversation(userId);
      }
      setSelectedConversations(new Set());
      setIsSelectMode(false);
      await fetchConversations();
      if (selectedConversation && selectedConversations.has(selectedConversation)) {
        setSelectedConversation(null);
        setMessages([]);
      }
      // 알림 갱신
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error: any) {
      alert(error.message || '대화 삭제에 실패했습니다.');
    }
  }

  async function handleSendMessage(receiverId: string) {
    if (!messageContent.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage(receiverId, messageContent);
      setMessageContent('');
      await fetchMessages(receiverId);
      await fetchConversations();
      // 알림 갱신을 위해 window 이벤트 발생 (ProfileNotificationBadge가 감지)
      window.dispatchEvent(new CustomEvent('notification-updated'));
    } catch (error: any) {
      alert(error.message || '쪽지 전송에 실패했습니다.');
    } finally {
      setSendingMessage(false);
    }
  }

  async function fetchPostsList(type: 'my' | 'liked' | 'bookmarked') {
    if (!user) return;

    setLoadingPosts(true);
    try {
      let posts: Post[] = [];
      switch (type) {
        case 'my':
          posts = await getMyPosts(user.id);
          break;
        case 'liked':
          posts = await getLikedPosts(user.id);
          break;
        case 'bookmarked':
          posts = await getBookmarkedPosts(user.id);
          break;
      }
      setPostsList(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      addToast({
        title: '로딩 실패',
        description: '글 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPosts(false);
    }
  }

  function handleOpenPostsDialog(type: 'my' | 'liked' | 'bookmarked') {
    setPostsDialogType(type);
    setPostsDialogOpen(true);
    fetchPostsList(type);
  }

  async function fetchCommentsList() {
    if (!user) return;

    setLoadingComments(true);
    try {
      const comments = await getMyComments(user.id);
      setCommentsList(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      addToast({
        title: '로딩 실패',
        description: '댓글 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoadingComments(false);
    }
  }

  function handleOpenCommentsDialog() {
    setCommentsDialogOpen(true);
    fetchCommentsList();
  }

  async function fetchBlockedUsers() {
    if (!user) return;

    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  }

  async function handleUnblockUser(userId: string) {
    try {
      await unblockUser(userId);
      await fetchBlockedUsers();
      addToast({
        title: '차단 해제',
        description: '차단을 해제했습니다.',
        variant: 'success',
      });
    } catch (error: any) {
      addToast({
        title: '차단 해제 실패',
        description: error.message || '차단 해제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  }

  async function fetchPrdsList() {
    if (!user) return;

    setLoadingPrds(true);
    try {
      const prds = await getPRDs({ userId: user.id });
      setPrdsList(prds);
    } catch (error) {
      console.error('Error fetching PRDs:', error);
      addToast({
        title: '로딩 실패',
        description: 'PRD 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPrds(false);
    }
  }

  function handleOpenPrdsDialog() {
    setPrdsDialogOpen(true);
    fetchPrdsList();
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

  // URL에 userId가 없고 로그인하지 않은 경우는 이미 useEffect에서 처리됨
  if (!targetUserId) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4 hover:bg-primary/5 transition-colors duration-300"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        홈으로
      </Button>

      <div className="mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 왼쪽: 프로필 기본 정보 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="프로필 사진"
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary/30 shadow-md group-hover:border-primary/50 transition-all duration-300"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:bg-primary/15 transition-colors duration-300">
                      <User className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 hover:scale-110 transition-all duration-300 shadow-md"
                        title="프로필 사진 변경"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {profile?.nickname || (isOwnProfile ? user?.email : '사용자')}
                  </CardTitle>
                  {isOwnProfile && user && (
                    <p className="text-sm text-muted-foreground/80 mb-2">
                      {user.email} · 가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground/80 break-words leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
              {uploadingAvatar && (
                <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-pulse" />
                  프로필 사진 업로드 중...
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isOwnProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_public"
                      checked={profile?.is_public || false}
                      disabled={!user || !profile}
                      onCheckedChange={async (checked: boolean) => {
                        if (!user || !profile) return;
                        try {
                          await updateProfile({ is_public: checked === true });
                          setProfile({ ...profile, is_public: checked === true });
                        } catch (error: any) {
                          console.error('프로필 업데이트 오류:', error);
                          addToast({
                            title: '설정 저장 실패',
                            description: '설정 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'),
                            variant: 'destructive',
                          });
                        }
                      }}
                    />
                    <Label htmlFor="is_public" className="cursor-pointer">
                      아이디 공개 (친구추가 및 쪽지 받기 허용)
                    </Label>
                  </div>
                  <div>
                    <Label htmlFor="nickname" className="mb-2 block">닉네임</Label>
                    <Input
                      id="nickname"
                      placeholder="닉네임을 입력하세요"
                      value={profile?.nickname || ''}
                      onChange={(e) => {
                        const newProfile = { ...profile, nickname: e.target.value };
                        setProfile(newProfile as any);
                      }}
                      onBlur={async () => {
                        if (profile?.nickname !== undefined) {
                          try {
                            await updateProfile({ nickname: profile.nickname });
                          } catch (error) {
                            addToast({
                              title: '닉네임 저장 실패',
                              description: '닉네임 저장에 실패했습니다.',
                              variant: 'destructive',
                            });
                          }
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio" className="mb-2 block">소개</Label>
                    <Textarea
                      id="bio"
                      placeholder="자기소개를 입력하세요"
                      value={profile?.bio || ''}
                      onChange={(e) => {
                        const newProfile = { ...profile, bio: e.target.value };
                        setProfile(newProfile as any);
                      }}
                      onBlur={async () => {
                        if (profile?.bio !== undefined) {
                          try {
                            await updateProfile({ bio: profile.bio });
                          } catch (error) {
                            addToast({
                              title: '소개 저장 실패',
                              description: '소개 저장에 실패했습니다.',
                              variant: 'destructive',
                            });
                          }
                        }
                      }}
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground">{profile.bio}</p>
                  )}
                  {!profile?.bio && (
                    <p className="text-sm text-muted-foreground">소개가 없습니다.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 오른쪽: 도네이션 박스 (같은 사이즈) */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl mb-2 font-sans">개발자를 위한 커피 한 잔 ☕</CardTitle>
                <p className="text-sm text-muted-foreground font-sans">
                  IdeaSpark가 도움이 되셨다면, 작은 후원으로 개발을 응원해 주세요.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium font-sans">은행 및 계좌번호</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base flex-1 font-sans">
                        {donationBankName} {donationAccountNumber}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-sans"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(donationAccountNumber)
                            .then(() => {
                              setDonationCopied(true);
                              setTimeout(() => setDonationCopied(false), 2000);
                            })
                            .catch(() => {
                              addToast({
                                title: '복사 실패',
                                description: '계좌번호 복사에 실패했습니다. 수동으로 복사해주세요.',
                                variant: 'destructive',
                              });
                            });
                        }}
                      >
                        {donationCopied ? '복사됨' : '복사'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium font-sans">예금주</Label>
                    <p className="text-sm text-muted-foreground mt-1 font-sans">{donationAccountHolder}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium font-sans mb-2 block">카카오페이 QR</Label>
                    <a
                      href="https://qr.kakaopay.com/Ej7sjRH31"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline font-sans"
                    >
                      https://qr.kakaopay.com/Ej7sjRH31
                    </a>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full font-sans"
                    onClick={() => setDonationShowQR(true)}
                  >
                    QR 코드 보기
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-sans">
                    피드백과 문의도 언제나 환영입니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        // 현재 탭의 스크롤 위치 저장
        scrollPositionRef.current[activeTab] = window.scrollY;
        
        // 새 탭으로 전환
        setActiveTab(value);
        
        // 탭 전환 시 부드러운 스크롤 효과를 위해 약간의 지연
        // 저장된 위치가 있으면 그 위치로, 없으면 현재 위치에서 최상단으로 부드럽게 이동
        setTimeout(() => {
          const savedPosition = scrollPositionRef.current[value];
          if (savedPosition !== undefined && savedPosition > 0) {
            // 저장된 위치가 있으면 그 위치로 부드럽게 이동
            smoothScrollTo(savedPosition, 500);
          } else {
            // 새 탭이거나 저장된 위치가 없으면 현재 위치에서 최상단으로 부드럽게 이동
            // (친구 탭처럼 스크롤이 없는 경우에도 부드럽게 전환)
            smoothScrollTo(0, 500);
          }
        }, 50);
      }} className="mb-6">
        <TabsList className="bg-muted/50 border-border/50 sticky top-16 z-10 bg-background/95 backdrop-blur-md shadow-sm">
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
            통계
          </TabsTrigger>
          {isOwnProfile && (
            <>
              <TabsTrigger value="friends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                친구 {friendRequests.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    {friendRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
                쪽지 {conversations.filter(c => c.unreadCount > 0).length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                    {conversations.filter(c => c.unreadCount > 0).length}
                  </span>
                )}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              onClick={() => handleOpenPostsDialog('my')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <FileText className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                  작성한 게시글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.posts}</p>
                  <span className="text-sm text-muted-foreground/80">개</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  {previewPosts.length > 0 ? (
                    <div className="space-y-1.5">
                      {previewPosts.map((post) => (
                        <div key={post.id} className="text-xs">
                          <p className="font-medium line-clamp-1">{post.title}</p>
                          <p className="text-muted-foreground text-[10px]">
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ))}
                      {stats.posts > 3 && (
                        <p className="text-[10px] text-muted-foreground pt-1">
                          +{stats.posts - 3}개 더 보기
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stats.posts > 0 ? '커뮤니티에 작성한 게시글을 확인하세요' : '아직 작성한 게시글이 없습니다'}
                    </p>
                  )}
                </div>
                <p className="text-xs text-primary mt-2 font-medium">클릭하여 확인 →</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              onClick={() => handleOpenCommentsDialog()}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <MessageSquare className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                  작성한 댓글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.comments}</p>
                  <span className="text-sm text-muted-foreground/80">개</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  {previewComments.length > 0 ? (
                    <div className="space-y-1.5">
                      {previewComments.map((comment) => (
                        <div key={comment.id} className="text-xs">
                          <p className="font-medium line-clamp-1">
                            {comment.post?.title || '게시글 제목 없음'}
                          </p>
                          <p className="text-muted-foreground text-[10px] line-clamp-1">
                            {comment.content}
                          </p>
                          <p className="text-muted-foreground text-[10px]">
                            {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      ))}
                      {stats.comments > 3 && (
                        <p className="text-[10px] text-muted-foreground pt-1">
                          +{stats.comments - 3}개 더 보기
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stats.comments > 0 ? '다른 사용자들과 나눈 댓글을 확인하세요' : '아직 작성한 댓글이 없습니다'}
                    </p>
                  )}
                </div>
                <p className="text-xs text-primary mt-2 font-medium">클릭하여 확인 →</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              onClick={() => handleOpenPostsDialog('liked')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <Heart className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                  좋아요한 글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.likes}</p>
                  <span className="text-sm text-muted-foreground/80">개</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stats.likes > 0 ? '마음에 들어 좋아요를 누른 글을 확인하세요' : '아직 좋아요한 글이 없습니다'}
                  </p>
                </div>
                <p className="text-xs text-primary mt-2 font-medium">클릭하여 확인 →</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              onClick={() => handleOpenPostsDialog('bookmarked')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <Bookmark className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                  북마크한 글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.bookmarks}</p>
                  <span className="text-sm text-muted-foreground/80">개</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stats.bookmarks > 0 ? '나중에 다시 보고 싶어 저장한 글을 확인하세요' : '아직 북마크한 글이 없습니다'}
                  </p>
                </div>
                <p className="text-xs text-primary mt-2 font-medium">클릭하여 확인 →</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              onClick={handleOpenPrdsDialog}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors duration-300">
                  <FileText className="h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300" />
                  생성한 PRD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.prds}</p>
                  <span className="text-sm text-muted-foreground/80">개</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stats.prds > 0 ? '아이디어로부터 생성한 PRD 문서를 확인하세요' : '아직 생성한 PRD가 없습니다'}
                  </p>
                </div>
                <p className="text-xs text-primary mt-2 font-medium">클릭하여 확인 →</p>
              </CardContent>
            </Card>
          </div>

          <Dialog open={postsDialogOpen} onOpenChange={setPostsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {postsDialogType === 'my' && '작성한 게시글'}
                  {postsDialogType === 'liked' && '좋아요한 글'}
                  {postsDialogType === 'bookmarked' && '북마크한 글'}
                </DialogTitle>
              </DialogHeader>
              {loadingPosts ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : postsList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {postsList.map((post) => (
                    <Card
                      key={post.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        navigate(`/community/${post.id}`);
                        setPostsDialogOpen(false);
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="line-clamp-2 mb-2">{post.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{post.anonymous_id || post.user?.email || '익명'}</span>
                          <span>{formatDate(post.created_at)}</span>
                          <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                            {post.category}
                          </span>
                          {(post as any).liked_at && (
                            <span className="text-xs">좋아요: {formatDate((post as any).liked_at)}</span>
                          )}
                          {(post as any).bookmarked_at && (
                            <span className="text-xs">북마크: {formatDate((post as any).bookmarked_at)}</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground line-clamp-3 mb-4 prose prose-sm dark:prose-invert max-w-none">
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
                                    className="max-w-full h-auto rounded-md my-1"
                                    alt={props.alt || ''}
                                    loading="lazy"
                                  />
                                );
                              },
                              p: ({ node, ...props }) => (
                                <p {...props} className="mb-1 last:mb-0" />
                              ),
                            }}
                          >
                            {post.content}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-4 w-4" />
                            {post.bookmark_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>작성한 댓글</DialogTitle>
              </DialogHeader>
              {loadingComments ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">로딩 중...</p>
                </div>
              ) : commentsList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">댓글이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentsList.map((comment: any) => (
                    <Card
                      key={comment.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              if (comment.post?.id) {
                                navigate(`/community/${comment.post.id}`);
                                setCommentsDialogOpen(false);
                              }
                            }}
                          >
                            <CardTitle className="text-sm mb-2 line-clamp-2">
                              {comment.post?.title || '게시글 제목 없음'}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDate(comment.created_at)}</span>
                            </div>
                          </div>
                          {/* TODO: 댓글 삭제 기능은 추후 전용 관리 페이지에서 제공 예정 */}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            if (comment.post?.id) {
                              navigate(`/community/${comment.post.id}`);
                              setCommentsDialogOpen(false);
                            }
                          }}
                        >
                          <p className="text-sm line-clamp-3">{comment.content}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="friends">
          <div className="space-y-4">
            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>받은 친구 요청 ({friendRequests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                      <span>{request.requester.nickname || request.requester.email}</span>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                          수락
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                          거절
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>친구 목록 ({friends.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-muted-foreground">친구가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend) => {
                      const friendUser = friend.requester_id === user?.id ? friend.addressee : friend.requester;
                      return (
                        <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
                          <span>{friendUser?.nickname || friendUser?.email || '익명'}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (friendUser) {
                                fetchMessages(friendUser.id);
                                // 메시지 탭으로 전환
                                const tabsList = document.querySelector('[role="tablist"]');
                                const messageTab = Array.from(tabsList?.children || []).find(
                                  (tab: any) => tab.textContent?.includes('쪽지')
                                ) as HTMLElement;
                                messageTab?.click();
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            쪽지
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            {blockedUsers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>차단한 사용자 ({blockedUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {blockedUsers.map((blocked) => {
                      const blockedUser = (blocked.requester_id === user?.id ? blocked.addressee : blocked.requester) || null;
                      return (
                        <div key={blocked.id} className="flex items-center justify-between p-2 border rounded">
                          <span>{blockedUser?.nickname || blockedUser?.email || '익명'}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (blockedUser) {
                                handleUnblockUser(blockedUser.id);
                              }
                            }}
                          >
                            차단 해제
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="messages">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>대화 목록</CardTitle>
                  <div className="flex gap-2">
                    {isSelectMode ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (selectedConversations.size === conversations.length) {
                              setSelectedConversations(new Set());
                            } else {
                              setSelectedConversations(new Set(conversations.map(c => c.user.id)));
                            }
                          }}
                        >
                          {selectedConversations.size === conversations.length ? '전체 해제' : '전체 선택'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteSelectedConversations}
                          disabled={selectedConversations.size === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제 ({selectedConversations.size})
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsSelectMode(false);
                            setSelectedConversations(new Set());
                          }}
                        >
                          취소
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsSelectMode(true)}
                      >
                        <CheckSquare className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">대화가 없습니다.</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      className={`p-3 border rounded ${
                        isSelectMode ? '' : 'cursor-pointer hover:bg-accent'
                      } ${
                        selectedConversation === conv.user.id ? 'bg-accent' : ''
                      } ${
                        selectedConversations.has(conv.user.id) ? 'bg-primary/10 border-primary' : ''
                      } transition-colors duration-200`}
                      onClick={() => {
                        if (!isSelectMode) {
                          fetchMessages(conv.user.id);
                        } else {
                          setSelectedConversations(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(conv.user.id)) {
                              newSet.delete(conv.user.id);
                            } else {
                              newSet.add(conv.user.id);
                            }
                            return newSet;
                          });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isSelectMode && (
                            <div className="flex-shrink-0">
                              {selectedConversations.has(conv.user.id) ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                              ) : (
                                <Square className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          <span className="font-medium truncate">
                            {conv.user.nickname || conv.user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conv.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                          {!isSelectMode && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conv.user.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  {selectedConversation
                    ? (() => {
                        const conv = conversations.find(c => c.user.id === selectedConversation);
                        const otherUser = conv?.user;
                        if (!otherUser) return <CardTitle>대화</CardTitle>;
                        
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <CardTitle className="m-0">
                                  {otherUser.nickname || otherUser.email || '대화'}
                                </CardTitle>
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => navigate(`/profile/${otherUser.id}`)}>
                                <UserIcon className="h-4 w-4 mr-2" />
                                프로필 보기
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(() => {
                                const friendStatus = friendStatuses[otherUser.id] || 'none';
                                return (
                                  <>
                                    {friendStatus === 'none' && (
                                      <DropdownMenuItem onClick={() => handleAddFriendFromMessage(otherUser.id)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        친구 추가
                                      </DropdownMenuItem>
                                    )}
                                    {friendStatus === 'pending' && (
                                      <DropdownMenuItem disabled>
                                        요청 대기 중
                                      </DropdownMenuItem>
                                    )}
                                    {friendStatus === 'accepted' && (
                                      <DropdownMenuItem disabled>
                                        친구
                                      </DropdownMenuItem>
                                    )}
                                    {friendStatus !== 'blocked' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleOpenMessageDialogFromMessage(otherUser.id)}>
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          쪽지 보내기
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                              {friendStatuses[otherUser.id] !== 'blocked' && (
                                <DropdownMenuItem 
                                  onClick={() => handleBlockUserFromMessage(otherUser.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  차단하기
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()
                    : <CardTitle>대화를 선택하세요</CardTitle>}
                </div>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="flex flex-col h-[600px]">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                      {messages.map((msg) => {
                        const isOwnMessage = msg.sender_id === user?.id;
                        const otherUser = isOwnMessage ? msg.receiver : msg.sender;
                        return (
                          <div
                            key={msg.id}
                            className={`p-2 rounded flex items-start gap-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                                : 'bg-secondary mr-auto max-w-[80%]'
                            }`}
                          >
                            <div className="flex-1">
                              {!isOwnMessage && otherUser && (
                                <div className="mb-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${otherUser.id}`);
                                    }}
                                    className="text-xs font-semibold hover:underline"
                                  >
                                    {otherUser.nickname || otherUser.email || '익명'}
                                  </button>
                                </div>
                              )}
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleString('ko-KR')}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="opacity-60 hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    if (confirm('이 쪽지를 삭제하시겠습니까?')) {
                                      try {
                                        await deleteMessage(msg.id);
                                        await fetchMessages(selectedConversation);
                                      } catch (error) {
                                        console.error('Error deleting message:', error);
                                        addToast({
                                          title: '쪽지 삭제 실패',
                                          description: '쪽지 삭제에 실패했습니다.',
                                          variant: 'destructive',
                                        });
                                      }
                                    }
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="쪽지를 입력하세요"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(selectedConversation);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleSendMessage(selectedConversation)}
                        disabled={sendingMessage || !messageContent.trim()}
                      >
                        전송
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">
                    왼쪽에서 대화를 선택하세요.
                  </p>
                )}
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

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
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setMessageDialogOpen(false);
                  setMessageContent('');
                }}
              >
                취소
              </Button>
              <Button
                onClick={async () => {
                  if (messageDialogUserId) {
                    await handleSendMessage(messageDialogUserId);
                    setMessageDialogOpen(false);
                    setMessageContent('');
                    if (selectedConversation === messageDialogUserId) {
                      await fetchMessages(messageDialogUserId);
                    }
                  }
                }}
                disabled={sendingMessage || !messageContent.trim()}
              >
                {sendingMessage ? '전송 중...' : '보내기'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={prdsDialogOpen} onOpenChange={setPrdsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>생성한 PRD</DialogTitle>
          </DialogHeader>
          {loadingPrds ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : prdsList.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">PRD가 없습니다.</p>
            </div>
          ) : selectedPrd ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPrd(null);
                    fetchPrdsList();
                  }}
                >
                  ← 목록으로
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('정말 이 PRD를 삭제하시겠습니까?')) {
                      try {
                        await deletePRD(selectedPrd.id);
                        setSelectedPrd(null);
                        await fetchPrdsList();
                        await fetchStats();
                      } catch (error) {
                        addToast({
                          title: 'PRD 삭제 실패',
                          description: 'PRD 삭제에 실패했습니다.',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
              <PRDViewer 
                prd={selectedPrd} 
                onUpdate={async (updatedPrd) => {
                  setSelectedPrd(updatedPrd);
                  await fetchPrdsList();
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {prdsList.map((prd) => (
                <Card
                  key={prd.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedPrd(prd)}
                      >
                        <CardTitle className="line-clamp-2 mb-2">{prd.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDate(prd.created_at)}</span>
                          <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                            {prd.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('정말 이 PRD를 삭제하시겠습니까?')) {
                            try {
                              await deletePRD(prd.id);
                              await fetchPrdsList();
                              await fetchStats();
                            } catch (error) {
                              addToast({
                          title: 'PRD 삭제 실패',
                          description: 'PRD 삭제에 실패했습니다.',
                          variant: 'destructive',
                        });
                            }
                          }
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="cursor-pointer"
                      onClick={() => setSelectedPrd(prd)}
                    >
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {prd.content.substring(0, 200)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 도네이션 QR 다이얼로그 (프로필 내 인라인) */}
      {isOwnProfile && (
        <Dialog open={donationShowQR} onOpenChange={setDonationShowQR}>
          <DialogContent className="sm:max-w-md" showCloseButton={true}>
            <DialogHeader>
              <DialogTitle>QR 코드로 송금</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-56 h-56 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed overflow-hidden relative">
                <img
                  src={donationQrUrl}
                  alt="도네이션 QR 코드"
                  className="w-full h-full object-contain rounded-lg"
                  onError={() => setDonationQrError(true)}
                  onLoad={() => setDonationQrError(false)}
                />
                {donationQrError && (
                  <div className="absolute text-center p-6 text-xs text-muted-foreground">
                    QR 코드 이미지를 불러올 수 없습니다.
                    <br />
                    <code className="text-[10px]">public/QR.png</code> 위치를 확인해주세요.
                  </div>
                )}
              </div>
              <div className="text-center text-xs text-muted-foreground">
                <p className="font-semibold text-sm text-foreground">{donationBankName}</p>
                <p className="font-mono text-[11px]">{donationAccountNumber}</p>
                <p className="mt-1">예금주: {donationAccountHolder}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default ProfilePage;
