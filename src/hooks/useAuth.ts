// 인증 상태 관리 Hook
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // 초기 사용자 확인
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error && import.meta.env.DEV) {
        console.error('Error getting user:', error);
      }
      if (isMounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}


