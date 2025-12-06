-- dev_news 테이블에 num_comments 컬럼 추가
ALTER TABLE dev_news 
ADD COLUMN IF NOT EXISTS num_comments INTEGER DEFAULT 0;

-- 인덱스 생성 (댓글 수 기준 정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_dev_news_num_comments ON dev_news(num_comments DESC);

-- 기존 데이터의 num_comments를 0으로 초기화 (이미 기본값이 0이므로 불필요하지만 명시적으로 설정)
UPDATE dev_news SET num_comments = 0 WHERE num_comments IS NULL;
