-- 모든 RLS 정책 무한 재귀 문제 일괄 수정
-- is_admin_user 함수를 사용하여 RLS 무한 재귀 방지

-- 관리자 확인 함수 생성/업데이트 (무한 재귀 방지)
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

-- is_admin RPC 함수도 생성/업데이트
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
-- premium_users 테이블 RLS 정책 수정
-- ============================================
DROP POLICY IF EXISTS "Only admins can manage premium users" ON premium_users;

CREATE POLICY "Only admins can manage premium users" ON premium_users
  FOR ALL USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- ============================================
-- idea_scores 테이블 RLS 정책 수정
-- ============================================
DROP POLICY IF EXISTS "Only admins can insert idea scores" ON idea_scores;
DROP POLICY IF EXISTS "Only admins can update idea scores" ON idea_scores;

CREATE POLICY "Only admins can insert idea scores" ON idea_scores
  FOR INSERT WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Only admins can update idea scores" ON idea_scores
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- SELECT 정책은 이미 "Idea scores are viewable by everyone"로 되어 있으므로 유지
-- 필요시 확인:
-- SELECT * FROM pg_policies WHERE tablename = 'idea_scores';
