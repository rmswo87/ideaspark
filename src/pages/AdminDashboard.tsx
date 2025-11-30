// 관리자 대시보드 페이지
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { IdeaManagement } from '@/components/admin/IdeaManagement';
import { PostManagement } from '@/components/admin/PostManagement';
import { ContactManagement } from '@/components/admin/ContactManagement';

function AdminDashboard() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
            <p className="text-muted-foreground mb-4">
              관리자 권한이 필요합니다.
            </p>
            <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
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
        <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
        <p className="text-muted-foreground">시스템 관리 및 모니터링</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto sm:h-9 p-0.5 sm:p-[3px] w-full sm:w-fit flex-wrap sm:flex-nowrap gap-0.5 sm:gap-0 overflow-x-auto">
          <TabsTrigger 
            value="overview" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 flex-1 sm:flex-none whitespace-nowrap"
          >
            개요
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 flex-1 sm:flex-none whitespace-nowrap"
          >
            사용자 관리
          </TabsTrigger>
          <TabsTrigger 
            value="ideas" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 flex-1 sm:flex-none whitespace-nowrap"
          >
            아이디어 관리
          </TabsTrigger>
          <TabsTrigger 
            value="posts" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 flex-1 sm:flex-none whitespace-nowrap"
          >
            게시글 관리
          </TabsTrigger>
          <TabsTrigger 
            value="contacts" 
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-1 min-h-[36px] sm:min-h-0 flex-1 sm:flex-none whitespace-nowrap"
          >
            문의 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview onTabChange={setActiveTab} />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>사용자 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ideas">
          <Card>
            <CardHeader>
              <CardTitle>아이디어 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <IdeaManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>게시글 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <PostManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>문의 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;