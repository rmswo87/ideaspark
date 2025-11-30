-- 비즈니스 문의 테이블 생성
-- 사용자 문의사항을 저장하고 관리자가 확인할 수 있도록 함

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, replied, closed
  admin_notes TEXT, -- 관리자 메모
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);

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

-- RLS 정책 설정
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 문의 생성 가능
CREATE POLICY "Anyone can create contact inquiries" ON contact_inquiries
  FOR INSERT WITH CHECK (true);

-- 관리자만 문의 조회 가능 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Admins can view all contact inquiries" ON contact_inquiries
  FOR SELECT USING (is_admin_user(auth.uid()));

-- 관리자만 문의 수정 가능 (함수 사용으로 무한 재귀 방지)
CREATE POLICY "Admins can update contact inquiries" ON contact_inquiries
  FOR UPDATE USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_contact_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_inquiries_updated_at
  BEFORE UPDATE ON contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_inquiries_updated_at();
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
