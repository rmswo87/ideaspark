-- 제안서(Proposal) 테이블 생성
-- 기존 아이디어를 분석하여 개선된 제안서를 저장

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown 형식
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_proposals_idea_id ON proposals(idea_id);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- RLS 정책 설정
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 제안서 조회 가능
CREATE POLICY "Proposals are viewable by everyone" ON proposals
  FOR SELECT USING (true);

-- 본인만 제안서 생성 가능
CREATE POLICY "Users can create their own proposals" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인만 제안서 수정 가능
CREATE POLICY "Users can update their own proposals" ON proposals
  FOR UPDATE USING (auth.uid() = user_id);

-- 본인만 제안서 삭제 가능
CREATE POLICY "Users can delete their own proposals" ON proposals
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();
