// Supabase 연결 테스트 유틸리티
import { supabase } from '@/lib/supabase';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    // 간단한 쿼리로 연결 테스트
    const { error } = await supabase
      .from('ideas')
      .select('count')
      .limit(1);

    if (error) {
      return {
        success: false,
        message: 'Supabase 연결 실패',
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Supabase 연결 성공!',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Supabase 연결 오류',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

