-- contact_inquiries 테이블의 RLS 정책 무한 재귀 문제 수정
-- 기존 정책을 삭제하고 SECURITY DEFINER 함수를 사용하는 새로운 정책으로 교체

-- 관리자 확인 함수 (무한 재귀 방지)
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
DROP POLICY IF EXISTS "Admins can view all contact inquiries" ON contact_inquiries;
DROP POLICY IF EXISTS "Admins can update contact inquiries" ON contact_inquiries;

-- 새로운 정책 생성 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Admins can view all contact inquiries" ON contact_inquiries
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update contact inquiries" ON contact_inquiries
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));
