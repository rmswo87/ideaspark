-- 관리자 계정 생성 SQL
-- 이 파일의 SQL을 Supabase SQL Editor에서 실행하세요

-- 방법 1: 특정 이메일의 사용자를 관리자로 만들기
INSERT INTO admins (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'rmswo87@nate.com'
ON CONFLICT (user_id) DO NOTHING;

-- 방법 2: 사용자 ID를 직접 지정하여 관리자로 만들기
-- (위 쿼리로 사용자 ID를 먼저 확인한 후 사용)
-- INSERT INTO admins (user_id, role) 
-- VALUES ('4d158334-74a2-4877-81ed-49219d50da08', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;

-- 관리자 목록 확인
SELECT 
  a.id,
  a.role,
  a.created_at,
  u.email,
  u.created_at as user_created_at
FROM admins a
JOIN auth.users u ON a.user_id = u.id;

-- 관리자 권한 제거 (필요시)
-- DELETE FROM admins WHERE user_id = '사용자_ID';

