-- 프리미엄 사용자 관리 테이블
-- 후원을 한 사용자에게 프리미엄 기능 제공

CREATE TABLE IF NOT EXISTS premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 후원 정보
  sponsor_amount DECIMAL(10, 2), -- 후원 금액
  sponsor_date TIMESTAMPTZ DEFAULT NOW(), -- 후원 일자
  
  -- 프리미엄 상태
  is_active BOOLEAN DEFAULT true, -- 프리미엄 활성화 여부
  expires_at TIMESTAMPTZ, -- 만료일 (null이면 영구)
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 사용자당 하나의 프리미엄 레코드만 존재
  UNIQUE(user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_premium_users_user_id ON premium_users(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_users_is_active ON premium_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_premium_users_expires_at ON premium_users(expires_at);

-- RLS 정책 설정
ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;

-- 본인만 자신의 프리미엄 상태 조회 가능
CREATE POLICY "Users can view their own premium status" ON premium_users
  FOR SELECT USING (auth.uid() = user_id);

-- 관리자만 프리미엄 사용자 생성/수정 가능
CREATE POLICY "Only admins can manage premium users" ON premium_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_premium_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER premium_users_updated_at
  BEFORE UPDATE ON premium_users
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_users_updated_at();

