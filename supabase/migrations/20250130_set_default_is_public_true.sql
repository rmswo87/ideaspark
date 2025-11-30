-- profiles 테이블의 is_public 컬럼 기본값을 true로 설정
-- 회원가입 시 기본적으로 아이디 공개 상태로 설정

-- 기존 NULL 값들을 true로 업데이트 (선택사항)
UPDATE profiles SET is_public = true WHERE is_public IS NULL;

-- 기본값 설정
ALTER TABLE profiles 
  ALTER COLUMN is_public SET DEFAULT true;

-- NOT NULL 제약조건 추가 (선택사항 - 이미 있으면 에러 발생하지만 무시 가능)
-- ALTER TABLE profiles ALTER COLUMN is_public SET NOT NULL;

