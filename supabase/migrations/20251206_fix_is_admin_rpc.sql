-- is_admin RPC 함수 생성 (무한 재귀 방지)
-- SECURITY DEFINER를 사용하여 RLS를 우회하고 admins 테이블을 직접 조회

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS is_admin(UUID);

-- is_admin RPC 함수 생성 (SECURITY DEFINER로 RLS 우회)
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

-- is_admin_user 함수도 확인 (다른 곳에서 사용할 수 있음)
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
