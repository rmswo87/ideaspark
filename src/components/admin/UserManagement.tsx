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
      // profiles 테이블에서 모든 사용자 가져오기
      // profiles.id는 auth.users.id와 동일합니다
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // admins 테이블에서 관리자 목록 가져오기
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('user_id');

      if (adminsError) {
        console.error('Error fetching admins:', adminsError);
        // admins 조회 실패해도 계속 진행
      }

      const adminIds = new Set(adminsData?.map(a => a.user_id) || []);

      // 사용자 목록 포맷팅
      const usersList: User[] = profilesData.map(profile => ({
        id: profile.id,
        email: profile.email || '이메일 없음',
        created_at: profile.created_at || new Date().toISOString(),
        isAdmin: adminIds.has(profile.id),
      }));

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


