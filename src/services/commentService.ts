// 댓글 시스템 서비스
import { supabase } from '@/lib/supabase';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  anonymous_id?: string;
  like_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
  };
  replies?: Comment[];
}

/**
 * 익명 ID 생성 (예: "익명1234")
 */
function generateAnonymousId(): string {
  const randomNum = Math.floor(Math.random() * 10000);
  return `익명${randomNum.toString().padStart(4, '0')}`;
}

/**
 * 댓글 생성
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string,
  isAnonymous?: boolean
): Promise<Comment> {
  const anonymousId = isAnonymous ? generateAnonymousId() : null;

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId || null,
      anonymous_id: anonymousId,
    })
    .select(`
      *,
      user:profiles(id, email)
    `)
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      postId,
      userId,
      contentLength: content.length,
    });
    throw error;
  }

  // 댓글 수 증가 (실패해도 댓글은 저장됨)
  try {
    await supabase.rpc('increment_comment_count', { post_id_param: postId });
  } catch (rpcError) {
    console.warn('Failed to increment comment count:', rpcError);
    // RPC 실패는 무시하고 댓글은 반환
  }

  return comment as unknown as Comment;
}

/**
 * 댓글 목록 가져오기 (계층 구조)
 */
export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles(id, email)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  // 계층 구조로 변환
  return buildCommentTree((data || []) as unknown as Comment[]);
}

/**
 * 댓글을 계층 구조로 변환
 */
function buildCommentTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment & { replies: Comment[] }>();
  const roots: Comment[] = [];

  // 모든 댓글을 맵에 추가
  comments.forEach(comment => {
    map.set(comment.id, { ...comment, replies: [] });
  });

  // 부모-자식 관계 설정
  comments.forEach(comment => {
    const commentWithReplies = map.get(comment.id)!;
    
    if (comment.parent_id) {
      const parent = map.get(comment.parent_id);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      roots.push(commentWithReplies);
    }
  });

  return roots;
}

/**
 * 댓글 업데이트
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select(`
      *,
      user:profiles(id, email)
    `)
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return data as unknown as Comment;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<void> {
  // 댓글의 post_id 가져오기
  const { data: comment } = await supabase
    .from('comments')
    .select('post_id')
    .eq('id', commentId)
    .single();

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }

  // 댓글 수 감소
  if (comment) {
    await supabase.rpc('decrement_comment_count', { post_id_param: comment.post_id });
  }
}

/**
 * 댓글에 실시간 구독
 */
export function subscribeToComments(
  postId: string,
  onUpdate: (comment: Comment) => void
): () => void {
  const channel = supabase
    .channel(`comments:${postId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      },
      async (payload) => {
        // 새 댓글 정보 가져오기
        const { data: newComment } = await supabase
          .from('comments')
          .select(`
            *,
            user:profiles(id, email)
          `)
          .eq('id', payload.new.id)
          .single();

        if (newComment) {
          onUpdate(newComment as unknown as Comment);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 내가 작성한 댓글 목록 가져오기
 */
export async function getMyComments(userId: string): Promise<(Comment & { post: { id: string; title: string } })[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      post:posts(id, title)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my comments:', error);
    throw error;
  }

  return (data || []) as unknown as (Comment & { post: { id: string; title: string } })[];
}


