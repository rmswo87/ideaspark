-- idea_scores 테이블 RLS 정책 수정 (무한 재귀 방지)
-- is_admin_user 함수를 사용하여 RLS 무한 재귀 방지

-- 관리자 확인 함수가 없으면 생성 (무한 재귀 방지)
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

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Only admins can insert idea scores" ON idea_scores;
DROP POLICY IF EXISTS "Only admins can update idea scores" ON idea_scores;

-- 새로운 정책 생성 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Only admins can insert idea scores" ON idea_scores
  FOR INSERT WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Only admins can update idea scores" ON idea_scores
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));
