// 프리미엄 사용자 관리 서비스
import { supabase } from '@/lib/supabase';

export interface PremiumUser {
  id: string;
  user_id: string;
  sponsor_amount: number | null;
  sponsor_date: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 사용자가 프리미엄 사용자인지 확인
 * (후원을 한 사용자)
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('premium_users')
      .select('is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // 프리미엄 사용자가 아닌 경우
        return false;
      }
      console.error('Error checking premium status:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    // 만료일 확인
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      if (expiresAt < now) {
        // 만료된 경우
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking premium user:', error);
    return false;
  }
}

/**
 * 프리미엄 사용자 정보 조회
 */
export async function getPremiumUser(userId: string): Promise<PremiumUser | null> {
  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('premium_users')
      .select('id, user_id, sponsor_amount, sponsor_date, is_active, expires_at, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching premium user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching premium user:', error);
    return null;
  }
}

