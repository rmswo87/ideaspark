-- idea_scores 테이블 SELECT 정책 확인 및 수정
-- 406 에러 해결을 위해 SELECT 정책을 명시적으로 재생성

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Idea scores are viewable by everyone" ON idea_scores;

-- 새로운 SELECT 정책 생성 (명시적으로 모든 사용자에게 허용)
CREATE POLICY "Idea scores are viewable by everyone" ON idea_scores
  FOR SELECT USING (true);

-- 정책 확인 쿼리 (실행 후 확인용)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'idea_scores';
