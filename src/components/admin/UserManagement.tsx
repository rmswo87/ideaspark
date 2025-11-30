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
      // 모든 사용자 가져오기
      const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setUsers([]);
        return;
      }

      // 관리자 정보 가져오기
      const { data: admins } = await supabase
        .from('admins')
        .select('user_id');

      const adminIds = new Set(admins?.map(a => a.user_id) || []);

      const usersWithAdmin = (authUsers || []).map(user => ({
        id: user.id,
        email: user.email || '이메일 없음',
        created_at: user.created_at,
        isAdmin: adminIds.has(user.id),
      }));

      setUsers(usersWithAdmin);
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

  return (
    <div>
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
              <TableCell>{user.email}</TableCell>
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
  );
}


