-- dev_news 테이블에 image_url 컬럼 추가
ALTER TABLE dev_news 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 생성 (이미지가 있는 게시물 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_dev_news_image_url ON dev_news(image_url) WHERE image_url IS NOT NULL;
