// 쪽지 기능 서비스
import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    email: string;
    nickname?: string;
  };
  receiver?: {
    id: string;
    email: string;
    nickname?: string;
  };
}

export interface Conversation {
  user: {
    id: string;
    email: string;
    nickname?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * 쪽지 보내기
 */
export async function sendMessage(receiverId: string, content: string): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  if (!content.trim()) {
    throw new Error('쪽지 내용을 입력해주세요.');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, nickname),
      receiver:profiles!messages_receiver_id_fkey(id, email, nickname)
    `)
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data as unknown as Message;
}

/**
 * 받은 쪽지 목록 가져오기
 */
export async function getReceivedMessages(limit = 50): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, nickname)
    `)
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching received messages:', error);
    throw error;
  }

  return (data || []) as unknown as Message[];
}

/**
 * 보낸 쪽지 목록 가져오기
 */
export async function getSentMessages(limit = 50): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      receiver:profiles!messages_receiver_id_fkey(id, email, nickname)
    `)
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching sent messages:', error);
    throw error;
  }

  return (data || []) as unknown as Message[];
}

/**
 * 특정 사용자와의 대화 목록 가져오기
 */
export async function getConversation(userId: string, limit = 50): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, nickname),
      receiver:profiles!messages_receiver_id_fkey(id, email, nickname)
    `)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }

  return (data || []) as unknown as Message[];
}

/**
 * 대화 목록 가져오기 (최근 대화 순)
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 받은 쪽지와 보낸 쪽지를 모두 가져와서 대화 상대방 추출
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, nickname),
      receiver:profiles!messages_receiver_id_fkey(id, email, nickname)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  // 대화 상대방별로 그룹화
  const conversationsMap = new Map<string, Conversation>();

  (messages || []).forEach((msg: any) => {
    const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
    if (!otherUser) return;

    const userId = otherUser.id;
    if (!conversationsMap.has(userId)) {
      conversationsMap.set(userId, {
        user: otherUser,
        unreadCount: 0,
      });
    }

    const conversation = conversationsMap.get(userId)!;
    if (!conversation.lastMessage || new Date(msg.created_at) > new Date(conversation.lastMessage.created_at)) {
      conversation.lastMessage = msg as Message;
    }
    if (msg.receiver_id === user.id && !msg.is_read) {
      conversation.unreadCount++;
    }
  });

  return Array.from(conversationsMap.values()).sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
  });
}

/**
 * 쪽지 읽음 표시
 */
export async function markAsRead(messageId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('receiver_id', user.id); // 수신자만 읽음 표시 가능

  if (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

/**
 * 읽지 않은 쪽지 개수 가져오기
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * 쪽지 삭제
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 자신이 보낸 쪽지 또는 받은 쪽지만 삭제 가능
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/**
 * 특정 사용자와의 대화 전체 삭제
 */
export async function deleteConversation(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  // 자신이 보낸 쪽지 또는 받은 쪽지만 삭제 가능
  const { error } = await supabase
    .from('messages')
    .delete()
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

