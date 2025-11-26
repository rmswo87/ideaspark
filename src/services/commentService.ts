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
 * 댓글 생성
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment:', error);
    throw error;
  }

  // 댓글 수 증가
  await supabase.rpc('increment_comment_count', { post_id_param: postId });

  return comment;
}

/**
 * 댓글 목록 가져오기 (계층 구조)
 */
export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:auth.users!comments_user_id_fkey(id, email)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  // 계층 구조로 변환
  return buildCommentTree(data || []);
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
    .select()
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw error;
  }

  return data;
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
            user:auth.users!comments_user_id_fkey(id, email)
          `)
          .eq('id', payload.new.id)
          .single();

        if (newComment) {
          onUpdate(newComment as Comment);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


