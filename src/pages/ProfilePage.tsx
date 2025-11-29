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
import { getMyComments } from '@/services/commentService';
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
  // GitHub Pages 배포 시 basename을 고려한 경로
  const basename = import.meta.env.VITE_GITHUB_PAGES === 'true' ? '/ideaspark' : '';
  const donationQrUrl = `${basename}/qr-code-donation.png`;

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

    if (targetUserId) {
      fetchProfile();
      if (isOwnProfile) {
        fetchStats();
        fetchFriends();
        fetchFriendRequests();
        fetchConversations();
        fetchBlockedUsers();
      } else {
        fetchOtherUserStats();
      }
    }
  }, [targetUserId, isOwnProfile, loading, user, urlUserId]);

  async function fetchProfile() {
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_public, nickname, bio, avatar_url')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // 다른 사용자의 프로필인 경우 비공개일 수 있음
        if (!isOwnProfile) {
          alert('프로필을 조회할 수 없습니다. 비공개 프로필이거나 존재하지 않는 사용자입니다.');
          navigate('/');
          return;
        }
        // 자신의 프로필인 경우 기본값 설정
        setProfile({ is_public: false });
        return;
      }

      if (data) {
        // 다른 사용자의 프로필인 경우 공개 여부 확인
        if (!isOwnProfile && !data.is_public) {
          alert('비공개 프로필입니다.');
          navigate('/');
          return;
        }
        setProfile(data);
      } else {
        // 프로필이 없는 경우 기본값 설정
        setProfile({ is_public: false });
      }
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
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }

  async function fetchFriendRequests() {
    if (!user) return;

    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  }

  async function fetchBlockedUsers() {
    if (!user) return;

    try {
      const blocked = await getBlockedUsers();
      setBlockedUsers(blocked);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
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

      // 북마크 받은 수 (내 게시글의 북마크 수 합계)
      const { data: myBookmarkedPosts } = await supabase
        .from('posts')
        .select('bookmark_count')
        .eq('user_id', user.id);

      const totalBookmarks = myBookmarkedPosts?.reduce((sum, post) => sum + (post.bookmark_count || 0), 0) || 0;

      // PRD 수
      const prds = await getPRDs();
      const prdsCount = prds.filter(prd => prd.user_id === user.id).length;

      setStats({
        posts: postsCount || 0,
        comments: commentsCount || 0,
        likes: totalLikes,
        bookmarks: totalBookmarks,
        prds: prdsCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function handleAcceptFriendRequest(requestId: string) {
    if (!user) return;

    try {
      await acceptFriendRequest(requestId);
      await fetchFriendRequests();
      await fetchFriends();
      alert('친구 요청을 수락했습니다.');
    } catch (error: any) {
      alert(error.message || '친구 요청 수락에 실패했습니다.');
    }
  }

  async function handleDeleteFriendRequest(requestId: string) {
    if (!user) return;

    try {
      await deleteFriendRequest(requestId);
      await fetchFriendRequests();
      alert('친구 요청을 거절했습니다.');
    } catch (error: any) {
      alert(error.message || '친구 요청 거절에 실패했습니다.');
    }
  }

  async function handleUnblockUser(userId: string) {
    if (!user) return;

    try {
      await unblockUser(userId);
      await fetchBlockedUsers();
      alert('차단을 해제했습니다.');
    } catch (error: any) {
      alert(error.message || '차단 해제에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>

        <div className="mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 왼쪽: 프로필 기본 정보 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="프로필 사진"
                        className="h-20 w-20 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                    )}
                    {isOwnProfile && (
                      <>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
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
                    <CardTitle className="text-xl mb-2">
                      {profile?.nickname || (isOwnProfile ? user?.email : '사용자')}
                    </CardTitle>
                    {isOwnProfile && user && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {user.email} · 가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                    {profile?.bio && (
                      <p className="text-sm text-muted-foreground break-words">
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

            {/* 오른쪽: 도네이션 박스 (같은 사이즈) */}
            {isOwnProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl mb-2">개발자를 위한 커피 한 잔 ☕</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    IdeaSpark가 도움이 되셨다면, 작은 후원으로 개발을 응원해 주세요.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">은행 및 계좌번호</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-base flex-1">
                          {donationBankName} {donationAccountNumber}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
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
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">예금주</Label>
                      <p className="text-sm text-muted-foreground mt-1">{donationAccountHolder}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setDonationShowQR(true)}
                    >
                      QR 코드 보기
                    </Button>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      피드백과 문의도 언제나 환영입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 통계 및 기능 탭 (자신의 프로필일 때만) */}
        {isOwnProfile && (
          <Tabs defaultValue="stats" className="mb-6">
            <TabsList>
              <TabsTrigger value="stats">통계</TabsTrigger>
              <TabsTrigger value="friends">친구</TabsTrigger>
              <TabsTrigger value="messages">쪽지</TabsTrigger>
              <TabsTrigger value="prds">PRD</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>활동 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleOpenPostsDialog('my')}>
                      <div className="text-2xl font-bold mb-1">{stats.posts}</div>
                      <div className="text-sm text-muted-foreground">게시글</div>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors" onClick={handleOpenCommentsDialog}>
                      <div className="text-2xl font-bold mb-1">{stats.comments}</div>
                      <div className="text-sm text-muted-foreground">댓글</div>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleOpenPostsDialog('liked')}>
                      <div className="text-2xl font-bold mb-1">{stats.likes}</div>
                      <div className="text-sm text-muted-foreground">좋아요</div>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors" onClick={() => handleOpenPostsDialog('bookmarked')}>
                      <div className="text-2xl font-bold mb-1">{stats.bookmarks}</div>
                      <div className="text-sm text-muted-foreground">북마크</div>
                    </div>
                    <div className="text-center p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors" onClick={handleOpenPrdsDialog}>
                      <div className="text-2xl font-bold mb-1">{stats.prds}</div>
                      <div className="text-sm text-muted-foreground">PRD</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle>친구 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  {friends.length === 0 ? (
                    <p className="text-muted-foreground">친구가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{friend.nickname || friend.email}</div>
                              <div className="text-sm text-muted-foreground">{friend.email}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/profile/${friend.id}`)}
                          >
                            프로필 보기
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>친구 요청</CardTitle>
                </CardHeader>
                <CardContent>
                  {friendRequests.length === 0 ? (
                    <p className="text-muted-foreground">받은 친구 요청이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {friendRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{request.sender_nickname || request.sender_email}</div>
                              <div className="text-sm text-muted-foreground">{request.sender_email}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcceptFriendRequest(request.id)}
                            >
                              수락
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteFriendRequest(request.id)}
                            >
                              거절
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>차단한 사용자</CardTitle>
                </CardHeader>
                <CardContent>
                  {blockedUsers.length === 0 ? (
                    <p className="text-muted-foreground">차단한 사용자가 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {blockedUsers.map((blocked) => (
                        <div key={blocked.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{blocked.nickname || blocked.email}</div>
                              <div className="text-sm text-muted-foreground">{blocked.email}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockUser(blocked.id)}
                          >
                            차단 해제
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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
                    ? (() => {
                        const conv = conversations.find(c => c.user.id === selectedConversation);
                        return conv?.user.nickname || conv?.user.email || '대화';
                      })()
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
                    대화를 선택하세요
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            <TabsContent value="prds">
              <Card>
                <CardHeader>
                  <CardTitle>내 PRD</CardTitle>
                </CardHeader>
                <CardContent>
                  {prdsList.length === 0 ? (
                    <p className="text-muted-foreground">생성한 PRD가 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      {prdsList.map((prd) => (
                        <div key={prd.id} className="p-4 bg-secondary rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{prd.title}</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePRD(prd.id)}
                            >
                              삭제
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {prd.status} · {new Date(prd.created_at).toLocaleDateString('ko-KR')}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPrd(prd)}
                          >
                            보기
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 게시글 목록 다이얼로그 */}
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
            <p className="text-muted-foreground">로딩 중...</p>
          ) : postsList.length === 0 ? (
            <p className="text-muted-foreground">게시글이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {postsList.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{post.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
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
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPostsDialogOpen(false);
                          navigate(`/community/${post.id}`);
                        }}
                      >
                        자세히 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 댓글 목록 다이얼로그 */}
      <Dialog open={commentsDialogOpen} onOpenChange={setCommentsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>작성한 댓글</DialogTitle>
          </DialogHeader>
          {loadingComments ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : commentsList.length === 0 ? (
            <p className="text-muted-foreground">댓글이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {commentsList.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader>
                    <p className="text-sm text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p>{comment.content}</p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCommentsDialogOpen(false);
                          navigate(`/community/${comment.post_id}`);
                        }}
                      >
                        게시글 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PRD 상세 다이얼로그 */}
      {selectedPrd && (
        <Dialog open={!!selectedPrd} onOpenChange={() => setSelectedPrd(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <PRDViewer prd={selectedPrd} />
          </DialogContent>
        </Dialog>
      )}

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