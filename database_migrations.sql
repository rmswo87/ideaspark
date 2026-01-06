-- IdeaSpark 프로젝트 필수 데이터베이스 테이블 생성
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- 1. 아이디어 AI 평가 점수 테이블
CREATE TABLE IF NOT EXISTS idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  vitamin_score DECIMAL(4,2),
  competition_score DECIMAL(4,2),
  sexiness_score DECIMAL(4,2),
  total_score DECIMAL(5,2) GENERATED ALWAYS AS (
    COALESCE(vitamin_score, 0) + COALESCE(competition_score, 0) + COALESCE(sexiness_score, 0)
  ) STORED,
  difficulty_level VARCHAR(10) CHECK (difficulty_level IN ('하', '중', '상')),
  ai_analysis JSONB,
  is_recommended BOOLEAN DEFAULT FALSE,
  recommended_at TIMESTAMPTZ,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(idea_id)
);

-- 2. 사용자 행동 추적 테이블
CREATE TABLE IF NOT EXISTS user_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE, -- Nullable for general actions
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('view', 'like', 'bookmark', 'generate_prd', 'share', 'copy', 'click')),
  duration INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 사용자 선호도 벡터 테이블
CREATE TABLE IF NOT EXISTS user_preference_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  category_weights JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. 아이디어 구현 정보 테이블
CREATE TABLE IF NOT EXISTS idea_implementations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  implementation_type VARCHAR(20) NOT NULL CHECK (implementation_type IN ('prototype', 'mvp', 'full_product')),
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'abandoned')),
  description TEXT,
  tech_stack TEXT[],
  start_date DATE,
  end_date DATE,
  github_repo VARCHAR(255),
  demo_url VARCHAR(255),
  notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 추천 시스템 메트릭 추적 테이블
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_strategy VARCHAR(50) NOT NULL,
  recommended_idea_ids UUID[] NOT NULL,
  interactions JSONB DEFAULT '{"clicked": false, "converted": false}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. A/B 테스트 실험 관리 테이블
CREATE TABLE IF NOT EXISTS recommendation_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  strategy_a VARCHAR(50) NOT NULL,
  strategy_b VARCHAR(50) NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.5,
  hypothesis TEXT,
  success_metric VARCHAR(20) DEFAULT 'ctr',
  minimum_sample_size INTEGER DEFAULT 1000,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  statistical_power DECIMAL(3,2) DEFAULT 0.8,
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 사용자 실험 할당 테이블
CREATE TABLE IF NOT EXISTS user_experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  variant VARCHAR(1) NOT NULL, -- 'A', 'B'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, experiment_id)
);

-- 8. 실험 성과 로그 테이블
CREATE TABLE IF NOT EXISTS experiment_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  variant VARCHAR(1) NOT NULL,
  action_taken VARCHAR(20) NOT NULL,
  recommended_idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  position_in_list INTEGER,
  session_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. 통계적 유의성 검정 결과 테이블
CREATE TABLE IF NOT EXISTS statistical_significance_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,
  control_mean DECIMAL(10,5),
  treatment_mean DECIMAL(10,5),
  control_variance DECIMAL(10,5),
  treatment_variance DECIMAL(10,5),
  control_sample_size INTEGER,
  treatment_sample_size INTEGER,
  t_statistic DECIMAL(10,5),
  p_value DECIMAL(10,5),
  is_significant BOOLEAN,
  confidence_interval_lower DECIMAL(10,5),
  confidence_interval_upper DECIMAL(10,5),
  effect_size DECIMAL(10,5),
  power DECIMAL(10,5),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experiment_id, metric_name)
);

-- 10. 실험 결과 요약 뷰
CREATE OR REPLACE VIEW experiment_results_summary AS
SELECT 
  experiment_id,
  variant,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) FILTER (WHERE action_taken = 'impression') as total_impressions,
  COUNT(*) FILTER (WHERE action_taken = 'click') as total_clicks,
  COUNT(*) FILTER (WHERE action_taken IN ('like', 'bookmark', 'generate_prd')) as total_conversions,
  CASE WHEN COUNT(*) FILTER (WHERE action_taken = 'impression') > 0 
       THEN (COUNT(*) FILTER (WHERE action_taken = 'click'))::DECIMAL / COUNT(*) FILTER (WHERE action_taken = 'impression')
       ELSE 0 END as ctr,
  CASE WHEN COUNT(*) FILTER (WHERE action_taken = 'click') > 0 
       THEN (COUNT(*) FILTER (WHERE action_taken IN ('like', 'bookmark', 'generate_prd')))::DECIMAL / COUNT(*) FILTER (WHERE action_taken = 'click')
       ELSE 0 END as conversion_rate
FROM experiment_performance_logs
GROUP BY experiment_id, variant;

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 적용 (이미 존재할 경우 무시)
DROP TRIGGER IF EXISTS idea_scores_updated_at ON idea_scores;
CREATE TRIGGER idea_scores_updated_at
  BEFORE UPDATE ON idea_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_preference_vectors_updated_at ON user_preference_vectors;
CREATE TRIGGER user_preference_vectors_updated_at
  BEFORE UPDATE ON user_preference_vectors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS idea_implementations_updated_at ON idea_implementations;
CREATE TRIGGER idea_implementations_updated_at
  BEFORE UPDATE ON idea_implementations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_idea_scores_total_score ON idea_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_idea_scores_recommended ON idea_scores(is_recommended, recommended_at) WHERE is_recommended = true;

CREATE INDEX IF NOT EXISTS idx_user_behaviors_user_id ON user_behaviors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_idea_id ON user_behaviors(idea_id);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_action_type ON user_behaviors(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behaviors_created_at ON user_behaviors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preference_vectors_user_id ON user_preference_vectors(user_id);

CREATE INDEX IF NOT EXISTS idx_idea_implementations_user_id ON idea_implementations(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_implementations_idea_id ON idea_implementations(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_implementations_status ON idea_implementations(status);

-- RLS (Row Level Security) 정책 설정

-- idea_scores RLS
ALTER TABLE idea_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idea_scores_read_policy" ON idea_scores
  FOR SELECT USING (true);

CREATE POLICY "idea_scores_insert_policy" ON idea_scores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "idea_scores_update_policy" ON idea_scores
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- user_behaviors RLS
ALTER TABLE user_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_behaviors_read_policy" ON user_behaviors
  FOR SELECT USING (true);

CREATE POLICY "user_behaviors_insert_policy" ON user_behaviors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_behaviors_user_policy" ON user_behaviors
  FOR ALL USING (auth.uid() = user_id);

-- user_preference_vectors RLS
ALTER TABLE user_preference_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_preference_vectors_policy" ON user_preference_vectors
  FOR ALL USING (auth.uid() = user_id);

-- idea_implementations RLS
ALTER TABLE idea_implementations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "idea_implementations_read_policy" ON idea_implementations
  FOR SELECT USING (true);

CREATE POLICY "idea_implementations_user_policy" ON idea_implementations
  FOR ALL USING (auth.uid() = user_id);

-- recommendation_metrics RLS
ALTER TABLE recommendation_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendation_metrics_user_policy" ON recommendation_metrics
  FOR ALL USING (auth.uid() = user_id);

-- recommendation_experiments RLS (Select for all, update/insert for logged in)
ALTER TABLE recommendation_experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendation_experiments_read_policy" ON recommendation_experiments
  FOR SELECT USING (true);
CREATE POLICY "recommendation_experiments_admin_policy" ON recommendation_experiments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- user_experiment_assignments RLS
ALTER TABLE user_experiment_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_experiment_assignments_user_policy" ON user_experiment_assignments
  FOR ALL USING (auth.uid() = user_id);

-- experiment_performance_logs RLS
ALTER TABLE experiment_performance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiment_performance_logs_user_policy" ON experiment_performance_logs
  FOR ALL USING (auth.uid() = user_id);

-- statistical_significance_tests RLS (Read for all)
ALTER TABLE statistical_significance_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statistical_significance_tests_read_policy" ON statistical_significance_tests
  FOR SELECT USING (true);

-- 샘플 데이터 삽입 (테스트용)
-- 이 부분은 테이블이 생성된 후에 실행

-- ideas 테이블에 테스트 데이터가 있다면 점수 추가 (total_score는 자동 계산됨)
INSERT INTO idea_scores (idea_id, vitamin_score, competition_score, sexiness_score, difficulty_level, ai_analysis)
SELECT 
  id,
  ROUND((RANDOM() * 10)::NUMERIC, 2),
  ROUND((RANDOM() * 10)::NUMERIC, 2), 
  ROUND((RANDOM() * 10)::NUMERIC, 2),
  CASE 
    WHEN RANDOM() < 0.33 THEN '하'
    WHEN RANDOM() < 0.66 THEN '중'
    ELSE '상'
  END,
  jsonb_build_object(
    'vitamin_reason', '높은 생존 필요도로 인한 높은 비타민 점수',
    'competition_reason', '경쟁사 분석 결과',
    'sexiness_reason', '시장 매력도 분석',
    'difficulty_reason', '구현 난이도 평가',
    'summary', 'AI 종합 분석 결과'
  )
FROM ideas 
WHERE id NOT IN (SELECT idea_id FROM idea_scores)
LIMIT 10
ON CONFLICT (idea_id) DO NOTHING;

-- 완료 메시지
SELECT 'Database migration completed successfully!' AS message;