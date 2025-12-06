-- dev_news 테이블 RLS 정책 수정
-- INSERT는 모든 사용자에게 허용 (API/cron job에서 데이터 저장 가능하도록)
-- UPDATE/DELETE는 관리자만 허용 (무한 재귀 방지를 위해 is_admin_user 함수 사용)

-- 관리자 확인 함수가 없으면 생성 (무한 재귀 방지)
-- SECURITY DEFINER를 사용하여 RLS를 우회하고 admins 테이블을 직접 조회
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
DROP POLICY IF EXISTS "Only admins can manage dev news" ON dev_news;
DROP POLICY IF EXISTS "Only admins can update dev news" ON dev_news;
DROP POLICY IF EXISTS "Only admins can delete dev news" ON dev_news;
DROP POLICY IF EXISTS "Anyone can insert dev news" ON dev_news;

-- INSERT 정책: 모든 사용자가 개발 소식 생성 가능 (API/cron job용)
CREATE POLICY "Anyone can insert dev news" ON dev_news
  FOR INSERT WITH CHECK (true);

-- UPDATE 정책: 관리자만 수정 가능 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Only admins can update dev news" ON dev_news
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- DELETE 정책: 관리자만 삭제 가능 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Only admins can delete dev news" ON dev_news
  FOR DELETE USING (is_admin_user(auth.uid()));

