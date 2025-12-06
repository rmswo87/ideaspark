-- ideas 테이블에 image_url 컬럼 추가
ALTER TABLE ideas 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 생성 (이미지가 있는 아이디어 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_ideas_image_url ON ideas(image_url) WHERE image_url IS NOT NULL;
