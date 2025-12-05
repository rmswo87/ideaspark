-- 개발 소식 및 정보 공유 테이블
-- 레딧에서 수집한 개발 관련 소식, 정보, 노하우 등을 저장

CREATE TABLE IF NOT EXISTS dev_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 레딧 정보
  reddit_id TEXT UNIQUE NOT NULL, -- Reddit 게시글 ID
  title TEXT NOT NULL,
  content TEXT,
  subreddit TEXT NOT NULL, -- 서브레딧 이름 (예: webdev, programming, etc.)
  author TEXT,
  upvotes INTEGER DEFAULT 0,
  url TEXT NOT NULL,
  
  -- 분류
  category TEXT, -- 'news', 'tutorial', 'tip', 'discussion', 'resource' 등
  tags TEXT[], -- 태그 배열
  
  -- 기간 분류
  period_type TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  period_date DATE NOT NULL, -- 해당 기간의 시작일 (daily: 오늘, weekly: 주 시작일, monthly: 월 시작일)
  
  -- 메타데이터
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 인덱스
  CONSTRAINT dev_news_period_check CHECK (period_type IN ('daily', 'weekly', 'monthly'))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_dev_news_subreddit ON dev_news(subreddit);
CREATE INDEX IF NOT EXISTS idx_dev_news_period_type ON dev_news(period_type);
CREATE INDEX IF NOT EXISTS idx_dev_news_period_date ON dev_news(period_date);
CREATE INDEX IF NOT EXISTS idx_dev_news_category ON dev_news(category);
CREATE INDEX IF NOT EXISTS idx_dev_news_collected_at ON dev_news(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_news_upvotes ON dev_news(upvotes DESC);

-- 복합 인덱스 (기간별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_dev_news_period_lookup ON dev_news(period_type, period_date DESC);

-- RLS 정책 설정
ALTER TABLE dev_news ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능
CREATE POLICY "Anyone can view dev news" ON dev_news
  FOR SELECT USING (true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Only admins can manage dev news" ON dev_news
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_dev_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dev_news_updated_at
  BEFORE UPDATE ON dev_news
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_news_updated_at();

