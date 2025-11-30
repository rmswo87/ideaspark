// 사용자 관리 컴포넌트
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  isAdmin: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      // posts 테이블에서 user 정보 가져오기 (게시글 관리와 동일한 방식)
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          user_id,
          created_at,
          user:profiles(id, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!posts || posts.length === 0) {
        // posts가 없으면 auth.admin.listUsers() 시도
        try {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          if (users && users.length > 0) {
            const { data: admins } = await supabase
              .from('admins')
              .select('user_id');
            const adminIds = new Set(admins?.map(a => a.user_id) || []);

            const usersList = users.map(user => ({
              id: user.id,
              email: user.email || '이메일 없음',
              created_at: user.created_at,
              isAdmin: adminIds.has(user.id),
            }));

            setUsers(usersList);
            return;
          }
        } catch (authError) {
          console.warn('auth.admin.listUsers() failed:', authError);
        }
        setUsers([]);
        return;
      }

      // 고유한 user_id 추출
      const uniqueUsers = new Map<string, { id: string; email: string; created_at: string }>();
      
      posts.forEach((post: any) => {
        if (post.user_id && !uniqueUsers.has(post.user_id)) {
          uniqueUsers.set(post.user_id, {
            id: post.user_id,
            email: post.user?.email || '이메일 없음',
            created_at: post.created_at || new Date().toISOString(),
          });
        }
      });

      // auth.admin.listUsers()로 추가 사용자 정보 가져오기 시도
      try {
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
        if (authUsers) {
          authUsers.forEach((authUser) => {
            if (!uniqueUsers.has(authUser.id)) {
              uniqueUsers.set(authUser.id, {
                id: authUser.id,
                email: authUser.email || '이메일 없음',
                created_at: authUser.created_at,
              });
            } else {
              // 이메일이 없는 경우 업데이트
              const existing = uniqueUsers.get(authUser.id);
              if (existing && (!existing.email || existing.email === '이메일 없음')) {
                uniqueUsers.set(authUser.id, {
                  ...existing,
                  email: authUser.email || '이메일 없음',
                });
              }
            }
          });
        }
      } catch (authError) {
        console.warn('auth.admin.listUsers() failed, using posts data only:', authError);
      }

      // 관리자 정보 가져오기
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id');

      const adminIds = new Set(admins?.map(a => a.user_id) || []);

      const usersList = Array.from(uniqueUsers.values()).map(user => ({
        ...user,
        isAdmin: adminIds.has(user.id),
      }));

      // 가입일 순으로 정렬
      usersList.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdmin(userId: string) {
    setUpdating(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (user.isAdmin) {
        // 관리자 해제
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // 관리자 지정
        const { error } = await supabase
          .from('admins')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
      }

      await fetchUsers();
    } catch (error) {
      console.error('Error toggling admin:', error);
      alert('관리자 권한 변경에 실패했습니다.');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">등록된 사용자가 없습니다.</p>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          새로고침
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        총 {users.length}명의 사용자가 등록되어 있습니다.
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이메일</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('ko-KR')}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-md text-xs ${
                    user.isAdmin ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {user.isAdmin ? '관리자' : '사용자'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={user.isAdmin ? 'destructive' : 'default'}
                    onClick={() => toggleAdmin(user.id)}
                    disabled={updating === user.id}
                  >
                    {updating === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      user.isAdmin ? '관리자 해제' : '관리자 지정'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


