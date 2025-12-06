-- 모든 RLS 정책 무한 재귀 문제 최종 수정
-- is_admin_user 함수를 사용하여 RLS 무한 재귀 방지
-- 이 파일 하나로 모든 문제 해결

-- ============================================
-- 1. 관리자 확인 함수 생성/업데이트
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = user_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE admins.user_id = user_uuid
  );
END;
$$;

-- ============================================
-- 2. premium_users 테이블 RLS 정책 수정
-- ============================================
-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view their own premium status" ON premium_users;
DROP POLICY IF EXISTS "Only admins can manage premium users" ON premium_users;

-- SELECT 정책: 본인만 조회 가능
CREATE POLICY "Users can view their own premium status" ON premium_users
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 정책: 관리자만 가능
CREATE POLICY "Only admins can manage premium users" ON premium_users
  FOR ALL USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- ============================================
-- 3. idea_scores 테이블 RLS 정책 수정
-- ============================================
-- 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Idea scores are viewable by everyone" ON idea_scores;
DROP POLICY IF EXISTS "Only admins can insert idea scores" ON idea_scores;
DROP POLICY IF EXISTS "Only admins can update idea scores" ON idea_scores;

-- SELECT 정책: 모든 사용자 조회 가능
CREATE POLICY "Idea scores are viewable by everyone" ON idea_scores
  FOR SELECT USING (true);

-- INSERT 정책: 관리자만 가능
CREATE POLICY "Only admins can insert idea scores" ON idea_scores
  FOR INSERT WITH CHECK (is_admin_user(auth.uid()));

-- UPDATE 정책: 관리자만 가능
CREATE POLICY "Only admins can update idea scores" ON idea_scores
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- ============================================
-- 정책 확인 쿼리 (실행 후 확인용)
-- ============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('premium_users', 'idea_scores')
-- ORDER BY tablename, policyname;
