-- premium_users 테이블 SELECT 정책 확인 및 수정
-- 406 에러 해결을 위해 SELECT 정책을 명시적으로 재생성

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view their own premium status" ON premium_users;

-- 새로운 SELECT 정책 생성 (본인만 조회 가능)
CREATE POLICY "Users can view their own premium status" ON premium_users
  FOR SELECT USING (auth.uid() = user_id);

-- 정책 확인 쿼리 (실행 후 확인용)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'premium_users';
