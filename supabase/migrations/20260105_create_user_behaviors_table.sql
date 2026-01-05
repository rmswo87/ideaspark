-- 사용자 행동 추적을 위한 테이블 생성
-- Advanced AI Recommendation System - User Behavior Tracking

-- 1. 사용자 행동 패턴 테이블
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'like', 'bookmark', 'generate_prd', 'share', 'copy')),
  duration INTEGER, -- 페이지 머무른 시간 (초)
  session_id TEXT,
  device_info JSONB DEFAULT '{}', -- 디바이스, 브라우저 정보
  metadata JSONB DEFAULT '{}', -- 추가 컨텍스트 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 벡터화 테이블 (ML용)
CREATE TABLE IF NOT EXISTS user_preference_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_weights JSONB DEFAULT '{}', -- 카테고리별 가중치
  tag_preferences JSONB DEFAULT '{}', -- 태그별 선호도
  complexity_preference FLOAT DEFAULT 0.5, -- 복잡도 선호 (0-1)
  novelty_preference FLOAT DEFAULT 0.5, -- 새로움 선호도 (0-1)
  interaction_frequency FLOAT DEFAULT 0.0, -- 상호작용 빈도
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 3. 아이디어 특성 벡터 테이블 (컨텐츠 기반 필터링용)
CREATE TABLE IF NOT EXISTS idea_feature_vectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  category_vector JSONB DEFAULT '{}', -- 카테고리 벡터
  tag_vector JSONB DEFAULT '{}', -- 태그 벡터
  complexity_score FLOAT DEFAULT 0.5, -- 복잡도 점수 (0-1)
  popularity_score FLOAT DEFAULT 0.0, -- 인기도 점수
  novelty_score FLOAT DEFAULT 1.0, -- 새로움 점수
  text_embedding VECTOR(1536), -- OpenAI 임베딩 (1536차원)
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(idea_id)
);

-- 4. 추천 성능 메트릭 테이블
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_strategy TEXT NOT NULL,
  recommended_idea_ids UUID[] DEFAULT '{}',
  interactions JSONB DEFAULT '{}', -- 클릭, 좋아요 등 상호작용
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ctr FLOAT DEFAULT 0.0, -- Click Through Rate
  engagement_duration INTEGER DEFAULT 0, -- 참여 시간
  conversion_rate FLOAT DEFAULT 0.0, -- 전환율
  
  INDEX ON (user_id, recommendation_strategy, timestamp)
);

-- 5. 아이디어 유사성 매트릭스 (협업 필터링용)
CREATE TABLE IF NOT EXISTS idea_similarity_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_a_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  idea_b_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL, -- 유사도 점수 (0-1)
  similarity_type TEXT NOT NULL CHECK (similarity_type IN ('content', 'collaborative', 'hybrid')),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(idea_a_id, idea_b_id, similarity_type)
);

-- 6. 사용자 유사성 매트릭스 (협업 필터링용)
CREATE TABLE IF NOT EXISTS user_similarity_matrix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL,
  similarity_type TEXT NOT NULL DEFAULT 'behavioral',
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_a_id, user_b_id, similarity_type)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_idea_id ON user_behaviors(idea_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_action_type ON user_behaviors(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_created_at ON user_behaviors(created_at);

CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_user_id ON user_preference_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_feature_vectors_idea_id ON idea_feature_vectors(idea_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_user_strategy ON recommendation_metrics(user_id, recommendation_strategy);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preference_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can only access their own behavior data" ON user_behaviors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own preference vectors" ON user_preference_vectors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own recommendation metrics" ON recommendation_metrics
  FOR ALL USING (auth.uid() = user_id);

-- 아이디어 특성 벡터는 모든 사용자가 읽기 가능 (추천 알고리즘용)
CREATE POLICY "Anyone can read idea feature vectors" ON idea_feature_vectors
  FOR SELECT USING (true);

CREATE POLICY "Only system can modify idea feature vectors" ON idea_feature_vectors
  FOR INSERT WITH CHECK (false);

-- 유사성 매트릭스는 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Authenticated users can read similarity matrices" ON idea_similarity_matrix
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read user similarity matrices" ON user_similarity_matrix
  FOR SELECT USING (auth.role() = 'authenticated');

-- 실시간 구독을 위한 발행/구독 설정
CREATE OR REPLACE FUNCTION notify_behavior_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('user_behavior_changed', 
    json_build_object(
      'user_id', NEW.user_id,
      'action_type', NEW.action_type,
      'idea_id', NEW.idea_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_behavior_notification
  AFTER INSERT ON user_behaviors
  FOR EACH ROW EXECUTE FUNCTION notify_behavior_change();

-- 벡터 유사도 검색을 위한 함수
CREATE OR REPLACE FUNCTION find_similar_ideas(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  idea_id UUID,
  similarity_score float
)
LANGUAGE sql
AS $$
  SELECT 
    ifv.idea_id,
    1 - (ifv.text_embedding <=> query_embedding) as similarity_score
  FROM idea_feature_vectors ifv
  WHERE 1 - (ifv.text_embedding <=> query_embedding) > match_threshold
  ORDER BY ifv.text_embedding <=> query_embedding
  LIMIT match_count;
$$;