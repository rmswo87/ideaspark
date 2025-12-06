-- dev_news 테이블의 unique 제약조건 수정
-- reddit_id만 unique가 아니라 (reddit_id, period_type) 조합이 unique가 되도록 변경
-- 같은 게시물이 daily, weekly, monthly로 각각 저장될 수 있도록 함

-- 기존 unique 제약조건 제거
ALTER TABLE dev_news DROP CONSTRAINT IF EXISTS dev_news_reddit_id_key;

-- 복합 unique 제약조건 추가 (reddit_id + period_type)
ALTER TABLE dev_news ADD CONSTRAINT dev_news_reddit_id_period_type_unique 
  UNIQUE (reddit_id, period_type);

-- 복합 인덱스도 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_dev_news_reddit_id_period_type 
  ON dev_news(reddit_id, period_type);
