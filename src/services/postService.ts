// 게시판 API 서비스
import { supabase } from '@/lib/supabase';

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  anonymous_id?: string;
  tags?: string[];
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
  isAnonymous?: boolean;
  anonymousId?: string;
  tags?: string[];
}

/**
 * 익명 ID 생성 (예: "익명1234")
 */
function generateAnonymousId(): string {
  const randomNum = Math.floor(Math.random() * 10000);
  return `익명${randomNum.toString().padStart(4, '0')}`;
}

/**
 * 게시글 생성
 */
export async function createPost(
  userId: string,
  data: CreatePostData
): Promise<Post> {
  const anonymousId = data.isAnonymous ? (data.anonymousId || generateAnonymousId()) : null;

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      title: data.title,
      content: data.content,
      category: data.category,
      anonymous_id: anonymousId,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
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
  search?: string;
  tags?: string[];
  sort?: 'latest' | 'popular' | 'comments';
}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:profiles(id, email)
    `);

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  // 태그 필터링
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  // 정렬 옵션
  if (filters?.sort === 'popular') {
    query = query.order('like_count', { ascending: false });
  } else if (filters?.sort === 'comments') {
    query = query.order('comment_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
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

  let result = (data || []) as unknown as Post[];

  // 클라이언트 사이드 검색 (제목, 내용에서 검색)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

/**
 * 게시글 조회
 */
export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles(id, email)
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
    tags?: string[];
    isAnonymous?: boolean;
  }
): Promise<Post> {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  // tags가 undefined가 아닌 경우에만 포함 (빈 배열은 null로 저장)
  if (updates.tags !== undefined) {
    updateData.tags = updates.tags.length > 0 ? updates.tags : null;
  }

  // 익명 여부 처리
  if (updates.isAnonymous !== undefined) {
    if (updates.isAnonymous) {
      // 익명으로 변경: anonymous_id 생성 (기존 것이 없으면 새로 생성)
      const { data: existingPost } = await supabase
        .from('posts')
        .select('anonymous_id')
        .eq('id', postId)
        .single();
      
      updateData.anonymous_id = existingPost?.anonymous_id || generateAnonymousId();
    } else {
      // 익명 해제: anonymous_id를 null로 설정
      updateData.anonymous_id = null;
    }
    // isAnonymous는 데이터베이스에 저장하지 않으므로 제거
    delete updateData.isAnonymous;
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
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

/**
 * 북마크한 게시글 목록 가져오기
 */
export async function getBookmarkedPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      created_at,
      post:posts(
        *,
        user:profiles(id, email)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookmarked posts:', error);
    throw error;
  }

  return (data || [])
    .filter((item: any) => item.post)
    .map((item: any) => ({
      ...item.post,
      bookmarked_at: item.created_at,
    })) as Post[];
}

/**
 * 좋아요한 게시글 목록 가져오기
 */
export async function getLikedPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      created_at,
      post:posts(
        *,
        user:profiles(id, email)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching liked posts:', error);
    throw error;
  }

  return (data || [])
    .filter((item: any) => item.post)
    .map((item: any) => ({
      ...item.post,
      liked_at: item.created_at,
    })) as Post[];
}

/**
 * 내가 작성한 게시글 목록 가져오기
 */
export async function getMyPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles(id, email)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my posts:', error);
    throw error;
  }

  return (data || []) as unknown as Post[];
<<<<<<< HEAD
}


=======
}
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
