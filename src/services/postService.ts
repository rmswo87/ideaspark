// 게시판 API 서비스
import { supabase } from '@/lib/supabase';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  anonymous_id?: string;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface CreatePostData {
  title: string;
  content: string;
  category: string;
  anonymousId?: string;
}

/**
 * 게시글 생성
 */
export async function createPost(
  userId: string,
  data: CreatePostData
): Promise<Post> {
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      title: data.title,
      content: data.content,
      category: data.category,
      anonymous_id: data.anonymousId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating post:', error);
    throw error;
  }

  return post;
}

/**
 * 게시글 목록 가져오기
 */
export async function getPosts(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:auth.users!posts_user_id_fkey(id, email)
    `)
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  return (data || []) as unknown as Post[];
}

/**
 * 게시글 조회
 */
export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:auth.users!posts_user_id_fkey(id, email)
    `)
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }

  return data as unknown as Post | null;
}

/**
 * 게시글 업데이트
 */
export async function updatePost(
  postId: string,
  updates: {
    title?: string;
    content?: string;
    category?: string;
  }
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    console.error('Error updating post:', error);
    throw error;
  }

  return data;
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

/**
 * 좋아요 토글
 */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  // 기존 좋아요 확인
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting like:', deleteError);
      throw deleteError;
    }

    // 카운트 감소
    await supabase.rpc('decrement_like_count', { post_id_param: postId });
    return false; // 좋아요 취소됨
  } else {
    // 좋아요 추가
    const { error: insertError } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      console.error('Error inserting like:', insertError);
      throw insertError;
    }

    // 카운트 증가
    await supabase.rpc('increment_like_count', { post_id_param: postId });
    return true; // 좋아요 추가됨
  }
}

/**
 * 좋아요 상태 확인
 */
export async function isLiked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking like:', error);
    return false;
  }

  return !!data;
}

/**
 * 북마크 토글
 */
export async function toggleBookmark(postId: string, userId: string): Promise<boolean> {
  // 기존 북마크 확인
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // 북마크 취소
    const { error: deleteError } = await supabase
      .from('bookmarks')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting bookmark:', deleteError);
      throw deleteError;
    }

    // 카운트 감소
    await supabase.rpc('decrement_bookmark_count', { post_id_param: postId });
    return false; // 북마크 취소됨
  } else {
    // 북마크 추가
    const { error: insertError } = await supabase
      .from('bookmarks')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      console.error('Error inserting bookmark:', insertError);
      throw insertError;
    }

    // 카운트 증가
    await supabase.rpc('increment_bookmark_count', { post_id_param: postId });
    return true; // 북마크 추가됨
  }
}

/**
 * 북마크 상태 확인
 */
export async function isBookmarked(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }

  return !!data;
}


