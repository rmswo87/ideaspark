// 프로필 페이지
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, MessageSquare, Heart, Bookmark, Camera, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFriends, getFriendRequests, acceptFriendRequest, deleteFriendRequest, getBlockedUsers, unblockUser } from '@/services/friendService';
import { getPRDs } from '@/services/prdService';
import { PRDViewer } from '@/components/PRDViewer';
import { getConversations, getConversation, sendMessage } from '@/services/messageService';
import { getBookmarkedPosts, getLikedPosts, getMyPosts } from '@/services/postService';
import { getMyComments, deleteComment } from '@/services/commentService';
import { deletePRD } from '@/services/prdService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { uploadAvatar } from '@/services/imageService';
import type { FriendRequest, Friend } from '@/services/friendService';
import type { Conversation, Message } from '@/services/messageService';
import type { Post } from '@/services/postService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ProfilePage() {
  const { userId: urlUserId } = useParams<{ userId?: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  // URL에 userId가 있으면 해당 사용자의 프로필, 없으면 로그인한 사용자의 프로필
  const targetUserId = urlUserId || user?.id;
  const isOwnProfile = user?.id === targetUserId;
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
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

  const donationAccountNumber = '3333258583773';
  const donationBankName = '카카오뱅크';
  const donationAccountHolder = '자취만렙';
  const donationQrUrl = '/qr-code-donation.png';

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
      } else if (user) {
        // 다른 사람의 프로필인 경우 통계만 로드 (공개 정보)
        fetchOtherUserStats();
      }
    }
  }, [user, loading, navigate, targetUserId, urlUserId, isOwnProfile]);

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
        // 프로필이 없으면 기본값 설정
        setProfile({ is_public: false });
        return;
      }

      // 다른 사람의 프로필이고 공개되지 않은 경우
      if (!isOwnProfile && (!data || !data.is_public)) {
        alert('이 사용자의 프로필은 비공개입니다.');
        navigate('/');
        return;
      }

      // 프로필이 없으면 기본값 설정
      setProfile(data || { is_public: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // 에러 발생 시에도 기본값 설정
      setProfile({ is_public: false });
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
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
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
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: publicUrl });
      alert('프로필 사진이 업로드되었습니다.');
    } catch (error: any) {
      console.error('프로필 사진 업로드 오류:', error);
      alert('프로필 사진 업로드에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
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
    } catch (error: any) {
      alert(error.message || '친구 요청 수락에 실패했습니다.');
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      await deleteFriendRequest(requestId);
      await fetchFriendRequests();
    } catch (error: any) {
      alert(error.message || '친구 요청 거절에 실패했습니다.');
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
    } catch (error) {
      console.error('Error fetching messages:', error);
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
      alert('글 목록을 불러오는데 실패했습니다.');
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
      alert('댓글 목록을 불러오는데 실패했습니다.');
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
      alert('차단을 해제했습니다.');
    } catch (error: any) {
      alert(error.message || '차단 해제에 실패했습니다.');
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
      alert('PRD 목록을 불러오는데 실패했습니다.');
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
            <div className="grid gap-4 md:grid-cols-2 items-start">
              {/* 왼쪽: 프로필 기본 정보 */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="프로필 사진"
                      className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                        title="프로필 사진 변경"
                      >
                        <Camera className="h-3 w-3" />
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
                <div>
                  <CardTitle>{profile?.nickname || (isOwnProfile ? user?.email : '사용자')}</CardTitle>
                  {isOwnProfile && user && (
                    <p className="text-sm text-muted-foreground">
                      {user.email} · 가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-[260px] break-words">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* 오른쪽: 도네이션 안내 (요약 + 복사/QR) */}
              {isOwnProfile && (
                <div className="border rounded-lg p-3 bg-muted/40 text-xs space-y-2">
                  <p className="font-semibold text-sm">개발자를 위한 커피 한 잔 ☕</p>
                  <p className="text-muted-foreground">
                    IdeaSpark가 도움이 되셨다면, 작은 후원으로 개발을 응원해 주세요.
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] truncate">
                        {donationBankName} {donationAccountNumber}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        예금주: {donationAccountHolder}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2 py-1"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(donationAccountNumber)
                          .then(() => {
                            setDonationCopied(true);
                            setTimeout(() => setDonationCopied(false), 2000);
                          })
                          .catch(() => {
                            alert('계좌번호 복사에 실패했습니다. 수동으로 복사해주세요.');
                          });
                      }}
                    >
                      {donationCopied ? '복사됨' : '복사'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2 py-1"
                      onClick={() => setDonationShowQR(true)}
                    >
                      QR
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    피드백과 문의도 언제나 환영입니다.
                  </p>
                </div>
              )}
            </div>
            {uploadingAvatar && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
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
                        // 성공 시 프로필 상태 업데이트
                        setProfile({ ...profile, is_public: checked === true });
                      } catch (error: any) {
                        console.error('프로필 업데이트 오류:', error);
                        alert('설정 저장에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
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
                          alert('닉네임 저장에 실패했습니다.');
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
                          alert('소개 저장에 실패했습니다.');
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
      </div>

      <Tabs defaultValue="stats" className="mb-6">
        <TabsList>
          <TabsTrigger value="stats">통계</TabsTrigger>
          {isOwnProfile && (
            <>
              <TabsTrigger value="friends">
                친구 {friendRequests.length > 0 && `(${friendRequests.length})`}
              </TabsTrigger>
              <TabsTrigger value="messages">
                쪽지 {conversations.filter(c => c.unreadCount > 0).length > 0 && `(${conversations.filter(c => c.unreadCount > 0).length})`}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenPostsDialog('my')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  작성한 게시글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.posts}</p>
                <p className="text-sm text-muted-foreground mt-1">클릭하여 확인</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenCommentsDialog()}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  작성한 댓글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.comments}</p>
                <p className="text-sm text-muted-foreground mt-1">클릭하여 확인</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenPostsDialog('liked')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  좋아요한 글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.likes}</p>
                <p className="text-sm text-muted-foreground mt-1">클릭하여 확인</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleOpenPostsDialog('bookmarked')}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  북마크한 글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.bookmarks}</p>
                <p className="text-sm text-muted-foreground mt-1">클릭하여 확인</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleOpenPrdsDialog}
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  생성한 PRD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.prds}</p>
                <p className="text-sm text-muted-foreground mt-1">클릭하여 확인</p>
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
                      const blockedUser = blocked.requester_id === user?.id ? blocked.addressee : blocked.requester;
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
                <CardTitle>대화 목록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-sm">대화가 없습니다.</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-accent ${
                        selectedConversation === conv.user.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => fetchMessages(conv.user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {conv.user.nickname || conv.user.email}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
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
                <CardTitle>
                  {selectedConversation
                    ? conversations.find(c => c.user.id === selectedConversation)?.user.nickname ||
                      conversations.find(c => c.user.id === selectedConversation)?.user.email ||
                      '대화'
                    : '대화를 선택하세요'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="flex flex-col h-[600px]">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2 rounded ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                              : 'bg-secondary mr-auto max-w-[80%]'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      ))}
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
                        alert('PRD가 삭제되었습니다.');
                      } catch (error) {
                        alert('PRD 삭제에 실패했습니다.');
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
                              alert('PRD가 삭제되었습니다.');
                            } catch (error) {
                              alert('PRD 삭제에 실패했습니다.');
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR 코드로 송금</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-56 h-56 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                {donationQrError ? (
                  <div className="text-center p-6 text-xs text-muted-foreground">
                    QR 코드 이미지를 불러올 수 없습니다.
                    <br />
                    <code className="text-[10px]">public/qr-code-donation.png</code> 위치를 확인해주세요.
                  </div>
                ) : (
                  <img
                    src={donationQrUrl}
                    alt="도네이션 QR 코드"
                    className="w-full h-full object-contain rounded-lg"
                    onError={() => setDonationQrError(true)}
                  />
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
