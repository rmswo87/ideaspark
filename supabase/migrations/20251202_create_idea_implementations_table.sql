-- 아이디어 실행 현황 추적 시스템
-- 사용자가 아이디어를 실제로 구현했을 때의 정보를 저장

CREATE TABLE IF NOT EXISTS idea_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 구현 정보
  implementation_url TEXT, -- GitHub, 데모 사이트 등
  screenshot_url TEXT, -- Imgur에 업로드된 스크린샷 URL
  description TEXT, -- 구현 설명
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 사용자는 한 아이디어당 하나의 구현만 등록 가능
  UNIQUE(idea_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_idea_implementations_idea_id ON idea_implementations(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_implementations_user_id ON idea_implementations(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_implementations_status ON idea_implementations(status);
CREATE INDEX IF NOT EXISTS idx_idea_implementations_created_at ON idea_implementations(created_at DESC);

-- RLS 정책 설정
ALTER TABLE idea_implementations ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 구현 사례 조회 가능
CREATE POLICY "Implementations are viewable by everyone" ON idea_implementations
  FOR SELECT USING (true);

-- 본인만 구현 사례 생성 가능
CREATE POLICY "Users can create their own implementations" ON idea_implementations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 구현 사례 수정 가능
CREATE POLICY "Users can update their own implementations" ON idea_implementations
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 구현 사례 삭제 가능
CREATE POLICY "Users can delete their own implementations" ON idea_implementations
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_idea_implementations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER idea_implementations_updated_at
  BEFORE UPDATE ON idea_implementations
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_implementations_updated_at();

