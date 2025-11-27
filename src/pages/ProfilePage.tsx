// 프로필 페이지
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, MessageSquare, Heart, Bookmark } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFriends, getFriendRequests, acceptFriendRequest, deleteFriendRequest } from '@/services/friendService';
import { getConversations, getConversation, sendMessage } from '@/services/messageService';
import { getBookmarkedPosts, getLikedPosts, getMyPosts } from '@/services/postService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { FriendRequest, Friend } from '@/services/friendService';
import type { Conversation, Message } from '@/services/messageService';
import type { Post } from '@/services/postService';

export function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    bookmarks: 0,
    prds: 0,
  });
  const [profile, setProfile] = useState<{ is_public: boolean; nickname?: string; bio?: string } | null>(null);
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchStats();
      fetchProfile();
      fetchFriends();
      fetchFriendRequests();
      fetchConversations();
    }
  }, [user, loading, navigate]);

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
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_public, nickname, bio')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data || { is_public: false });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function updateProfile(updates: { is_public?: boolean; nickname?: string; bio?: string }) {
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

  if (!user) {
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle>{profile?.nickname || user.email}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {user.email} · 가입일: {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </p>
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={profile?.is_public || false}
                  onCheckedChange={async (checked: boolean) => {
                    try {
                      await updateProfile({ is_public: checked === true });
                    } catch (error) {
                      alert('설정 저장에 실패했습니다.');
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
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats" className="mb-6">
        <TabsList>
          <TabsTrigger value="stats">통계</TabsTrigger>
          <TabsTrigger value="friends">
            친구 {friendRequests.length > 0 && `(${friendRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="messages">
            쪽지 {conversations.filter(c => c.unreadCount > 0).length > 0 && `(${conversations.filter(c => c.unreadCount > 0).length})`}
          </TabsTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  작성한 댓글
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.comments}</p>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  생성한 PRD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.prds}</p>
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
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {post.content}
                        </p>
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
        </TabsContent>

        <TabsContent value="friends">
          <div className="space-y-4">
            {friendRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>받은 친구 요청</CardTitle>
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
          </div>
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
      </Tabs>
    </div>
  );
}
