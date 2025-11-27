// 커뮤니티 게시판 페이지
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getPosts, createPost } from '@/services/postService';
import { useAuth } from '@/hooks/useAuth';
import { Plus, MessageSquare, Heart, Bookmark, Calendar, User, Sparkles } from 'lucide-react';
import type { Post } from '@/services/postService';

export function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '자유', isAnonymous: false });

  useEffect(() => {
    fetchPosts();
  }, [category]);

  async function fetchPosts() {
    setLoading(true);
    try {
      const data = await getPosts({
        category: category === 'all' ? undefined : category,
        limit: 20,
      });
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
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
      });
      setDialogOpen(false);
      setNewPost({ title: '', content: '', category: '자유', isAnonymous: false });
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('게시글 작성에 실패했습니다.');
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-lg font-bold">IdeaSpark</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
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
                className="font-semibold"
              >
                커뮤니티
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!user}>
                <Plus className="h-4 w-4 mr-2" />
                글쓰기
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                  <label className="text-sm font-medium mb-2 block">내용</label>
                  <Textarea
                    placeholder="게시글 내용을 입력하세요"
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={10}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={newPost.isAnonymous}
                    onCheckedChange={(checked) => setNewPost({ ...newPost, isAnonymous: checked === true })}
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

        <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="질문">질문</TabsTrigger>
          <TabsTrigger value="자유">자유</TabsTrigger>
          <TabsTrigger value="아이디어 공유">아이디어 공유</TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">게시글이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <Card 
                  key={post.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/community/${post.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 mb-2">{post.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {post.anonymous_id || post.user?.email || '익명'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.created_at)}
                          </span>
                          <span className="px-2 py-1 bg-secondary rounded-md text-xs">
                            {post.category}
                          </span>
                        </div>
                      </div>
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
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
