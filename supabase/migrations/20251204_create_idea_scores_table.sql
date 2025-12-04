-- AI 기반 아이디어 평가 시스템
-- 아이디어의 비타민/경쟁율/섹시함 점수 및 AI 분석 결과 저장

CREATE TABLE IF NOT EXISTS idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  
  -- 3가지 평가 점수 (각 0-10점, 총 30점)
  vitamin_score INTEGER CHECK (vitamin_score >= 0 AND vitamin_score <= 10),
  competition_score INTEGER CHECK (competition_score >= 0 AND competition_score <= 10),
  sexiness_score INTEGER CHECK (sexiness_score >= 0 AND sexiness_score <= 10),
  
  -- 총점 (자동 계산)
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(vitamin_score, 0) + 
    COALESCE(competition_score, 0) + 
    COALESCE(sexiness_score, 0)
  ) STORED,
  
  -- 업무 난이도 평가
  difficulty_level TEXT CHECK (difficulty_level IN ('하', '중', '상')),
  
  -- AI 분석 결과 (JSON 형식)
  ai_analysis JSONB,
  
  -- 추천 관련
  is_recommended BOOLEAN DEFAULT false,
  recommended_at TIMESTAMPTZ,
  
  -- 메타데이터
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 한 아이디어당 하나의 점수만 존재
  UNIQUE(idea_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_idea_scores_idea_id ON idea_scores(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_scores_total_score ON idea_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_idea_scores_is_recommended ON idea_scores(is_recommended) WHERE is_recommended = true;
CREATE INDEX IF NOT EXISTS idx_idea_scores_analyzed_at ON idea_scores(analyzed_at DESC);

-- RLS 정책 설정
ALTER TABLE idea_scores ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 점수 조회 가능
CREATE POLICY "Idea scores are viewable by everyone" ON idea_scores
  FOR SELECT USING (true);

-- 관리자만 점수 생성/수정 가능 (AI 평가는 서버에서만 실행)
CREATE POLICY "Only admins can insert idea scores" ON idea_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update idea scores" ON idea_scores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_idea_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER idea_scores_updated_at
  BEFORE UPDATE ON idea_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_scores_updated_at();
