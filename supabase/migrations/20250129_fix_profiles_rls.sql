-- profiles 테이블 RLS 정책 수정
-- 사용자가 자신의 프로필을 업데이트할 수 있도록 허용

-- 기존 정책이 있다면 삭제 (선택사항 - 에러가 나면 무시)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- RLS 활성화 (이미 활성화되어 있어도 안전)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필을 조회할 수 있음
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 공개 프로필은 모든 사용자가 조회할 수 있음
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (is_public = true);

-- 사용자는 자신의 프로필을 생성할 수 있음
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 사용자는 자신의 프로필을 업데이트할 수 있음 (is_public 포함)
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
