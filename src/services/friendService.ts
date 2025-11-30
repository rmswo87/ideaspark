// 친구 기능 서비스
import { supabase } from '@/lib/supabase';

export interface Friend {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    email: string;
    nickname?: string;
    is_public: boolean;
  };
  addressee?: {
    id: string;
    email: string;
    nickname?: string;
    is_public: boolean;
  };
}

export interface FriendRequest {
  id: string;
  requester: {
    id: string;
    email: string;
    nickname?: string;
  };
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

/**
 * 친구 요청 보내기
 */
export async function sendFriendRequest(addresseeId: string): Promise<Friend> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 이미 친구 관계가 있는지 확인
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    throw new Error('이미 친구 요청이 있거나 친구 관계입니다.');
  }

  const { data, error } = await supabase
    .from('friends')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'pending',
    })
    .select(`
      *,
      requester:profiles!friends_requester_id_fkey(id, email, nickname, is_public),
      addressee:profiles!friends_addressee_id_fkey(id, email, nickname, is_public)
    `)
    .single();

  if (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }

  return data as unknown as Friend;
}

/**
 * 친구 요청 수락
 */
export async function acceptFriendRequest(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendId)
    .eq('addressee_id', user.id); // 수신자만 수락 가능

  if (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
}

/**
 * 친구 요청 거절/삭제
 */
export async function deleteFriendRequest(friendId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', friendId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`); // 본인이 관련된 요청만 삭제 가능

  if (error) {
    console.error('Error deleting friend request:', error);
    throw error;
  }
}

/**
 * 친구 목록 가져오기
 */
export async function getFriends(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      requester:profiles!friends_requester_id_fkey(id, email, nickname, is_public),
      addressee:profiles!friends_addressee_id_fkey(id, email, nickname, is_public)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching friends:', error);
    throw error;
  }

  return (data || []) as unknown as Friend[];
}

/**
 * 친구 요청 목록 가져오기 (받은 요청)
 */
export async function getFriendRequests(): Promise<FriendRequest[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('friends')
    .select(`
      id,
      status,
      created_at,
      requester:profiles!friends_requester_id_fkey(id, email, nickname)
    `)
    .eq('addressee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friend requests:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    requester: Array.isArray(item.requester) ? item.requester[0] : item.requester,
    status: item.status,
    created_at: item.created_at,
  })) as FriendRequest[];
}

/**
 * 특정 사용자와의 친구 관계 확인
 */
export async function getFriendStatus(userId: string): Promise<'none' | 'pending' | 'accepted' | 'blocked'> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'none';

  const { data, error } = await supabase
    .from('friends')
    .select('status')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (error || !data) return 'none';
  return data.status as 'pending' | 'accepted' | 'blocked';
}

/**
 * 사용자 차단하기
 */
export async function blockUser(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 이미 관계가 있는지 확인
  const { data: existing } = await supabase
    .from('friends')
    .select('*')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
    .maybeSingle();

  if (existing) {
    // 기존 관계를 차단으로 업데이트
    const { error } = await supabase
      .from('friends')
      .update({ 
        status: 'blocked', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  } else {
    // 새로운 차단 관계 생성
    const { error } = await supabase
      .from('friends')
      .insert({
        requester_id: user.id,
        addressee_id: userId,
        status: 'blocked',
      });

    if (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }
}

/**
 * 차단 해제하기
 */
export async function unblockUser(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
    .eq('status', 'blocked');

  if (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
}

/**
 * 차단한 사용자 목록 가져오기
 */
export async function getBlockedUsers(): Promise<Friend[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      requester:profiles!friends_requester_id_fkey(id, email, nickname, is_public),
      addressee:profiles!friends_addressee_id_fkey(id, email, nickname, is_public)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq('status', 'blocked');

  if (error) {
    console.error('Error fetching blocked users:', error);
    throw error;
  }

  return (data || []) as unknown as Friend[];
}
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
