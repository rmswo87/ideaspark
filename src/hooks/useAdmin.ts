// 관리자 인증 Hook
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // is_admin_user 함수를 사용하여 직접 admins 테이블 조회 (RLS 무한 재귀 방지)
        const { data, error } = await supabase
          .rpc('is_admin_user', { user_uuid: user.id });

        if (error) {
          // RPC 함수가 없으면 직접 조회 시도
          if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
            // 직접 admins 테이블 조회 (RLS 정책이 올바르게 설정되어 있다면 작동)
            const { data: adminData, error: adminError } = await supabase
              .from('admins')
              .select('id')
              .eq('user_id', user.id)
              .limit(1)
              .maybeSingle();
            
            if (adminError) {
              console.error('Admin check error:', adminError);
              setIsAdmin(false);
            } else {
              setIsAdmin(!!adminData);
            }
          } else {
            console.error('Admin check error:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(data || false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}


