-- A/B 테스팅 및 추천 시스템 분석을 위한 테이블 생성
-- Advanced AI Recommendation System - A/B Testing Analytics

-- 1. 추천 전략 실험 테이블
CREATE TABLE IF NOT EXISTS recommendation_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  strategy_a TEXT NOT NULL, -- 대조군 전략
  strategy_b TEXT NOT NULL, -- 실험군 전략
  traffic_split FLOAT DEFAULT 0.5 CHECK (traffic_split > 0 AND traffic_split < 1),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  hypothesis TEXT,
  success_metric TEXT DEFAULT 'ctr' CHECK (success_metric IN ('ctr', 'engagement', 'conversion', 'satisfaction')),
  minimum_sample_size INTEGER DEFAULT 1000,
  confidence_level FLOAT DEFAULT 0.95,
  statistical_power FLOAT DEFAULT 0.8,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 실험 할당 테이블
CREATE TABLE IF NOT EXISTS user_experiment_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')), -- A: 대조군, B: 실험군
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, experiment_id)
);

-- 3. 실험 성과 추적 테이블
CREATE TABLE IF NOT EXISTS experiment_performance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  action_taken TEXT NOT NULL CHECK (action_taken IN ('impression', 'click', 'like', 'bookmark', 'generate_prd', 'share')),
  recommended_idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  position_in_list INTEGER, -- 추천 목록에서의 위치
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 4. 실험 결과 요약 테이블 (자동 계산)
CREATE TABLE IF NOT EXISTS experiment_results_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  total_users INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  ctr FLOAT DEFAULT 0.0, -- Click Through Rate
  conversion_rate FLOAT DEFAULT 0.0,
  avg_engagement_time FLOAT DEFAULT 0.0,
  bounce_rate FLOAT DEFAULT 0.0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(experiment_id, variant)
);

-- 5. 통계적 유의성 분석 테이블
CREATE TABLE IF NOT EXISTS statistical_significance_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES recommendation_experiments(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  control_mean FLOAT NOT NULL,
  treatment_mean FLOAT NOT NULL,
  control_variance FLOAT NOT NULL,
  treatment_variance FLOAT NOT NULL,
  control_sample_size INTEGER NOT NULL,
  treatment_sample_size INTEGER NOT NULL,
  t_statistic FLOAT,
  p_value FLOAT,
  is_significant BOOLEAN DEFAULT false,
  confidence_interval_lower FLOAT,
  confidence_interval_upper FLOAT,
  effect_size FLOAT, -- Cohen's d
  power FLOAT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(experiment_id, metric_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_recommendation_experiments_status ON recommendation_experiments(status);
CREATE INDEX IF NOT EXISTS idx_recommendation_experiments_dates ON recommendation_experiments(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_user_experiment_assignments_user_id ON user_experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiment_assignments_experiment_id ON user_experiment_assignments(experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_performance_logs_experiment_variant ON experiment_performance_logs(experiment_id, variant);
CREATE INDEX IF NOT EXISTS idx_experiment_performance_logs_timestamp ON experiment_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_experiment_performance_logs_action ON experiment_performance_logs(action_taken);

-- RLS 정책 설정
ALTER TABLE recommendation_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_performance_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 실험을 생성/수정할 수 있음
CREATE POLICY "Only admins can manage experiments" ON recommendation_experiments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자는 자신의 실험 할당만 볼 수 있음
CREATE POLICY "Users can only see their own experiment assignments" ON user_experiment_assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own performance logs" ON experiment_performance_logs
  FOR ALL USING (auth.uid() = user_id);

-- 실험 성과 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_experiment_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- 실험 성과 요약 업데이트
  INSERT INTO experiment_results_summary (
    experiment_id, 
    variant, 
    total_users,
    total_impressions,
    total_clicks,
    total_conversions,
    ctr,
    conversion_rate
  )
  SELECT 
    epl.experiment_id,
    epl.variant,
    COUNT(DISTINCT epl.user_id) as total_users,
    SUM(CASE WHEN epl.action_taken = 'impression' THEN 1 ELSE 0 END) as total_impressions,
    SUM(CASE WHEN epl.action_taken = 'click' THEN 1 ELSE 0 END) as total_clicks,
    SUM(CASE WHEN epl.action_taken IN ('like', 'bookmark', 'generate_prd') THEN 1 ELSE 0 END) as total_conversions,
    CASE 
      WHEN SUM(CASE WHEN epl.action_taken = 'impression' THEN 1 ELSE 0 END) > 0 
      THEN SUM(CASE WHEN epl.action_taken = 'click' THEN 1 ELSE 0 END)::float / 
           SUM(CASE WHEN epl.action_taken = 'impression' THEN 1 ELSE 0 END)::float
      ELSE 0
    END as ctr,
    CASE 
      WHEN SUM(CASE WHEN epl.action_taken = 'click' THEN 1 ELSE 0 END) > 0 
      THEN SUM(CASE WHEN epl.action_taken IN ('like', 'bookmark', 'generate_prd') THEN 1 ELSE 0 END)::float / 
           SUM(CASE WHEN epl.action_taken = 'click' THEN 1 ELSE 0 END)::float
      ELSE 0
    END as conversion_rate
  FROM experiment_performance_logs epl
  WHERE epl.experiment_id = NEW.experiment_id AND epl.variant = NEW.variant
  GROUP BY epl.experiment_id, epl.variant
  ON CONFLICT (experiment_id, variant) 
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    total_impressions = EXCLUDED.total_impressions,
    total_clicks = EXCLUDED.total_clicks,
    total_conversions = EXCLUDED.total_conversions,
    ctr = EXCLUDED.ctr,
    conversion_rate = EXCLUDED.conversion_rate,
    calculated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_experiment_performance
  AFTER INSERT ON experiment_performance_logs
  FOR EACH ROW EXECUTE FUNCTION calculate_experiment_performance();

-- 통계적 유의성 검정 함수
CREATE OR REPLACE FUNCTION perform_significance_test(
  experiment_uuid UUID,
  metric TEXT DEFAULT 'ctr'
)
RETURNS TABLE (
  t_stat FLOAT,
  p_val FLOAT,
  is_sig BOOLEAN,
  effect_size FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  control_mean FLOAT;
  treatment_mean FLOAT;
  control_var FLOAT;
  treatment_var FLOAT;
  control_n INTEGER;
  treatment_n INTEGER;
  pooled_se FLOAT;
  t_statistic FLOAT;
  df INTEGER;
  p_value FLOAT;
  cohens_d FLOAT;
  is_significant BOOLEAN;
BEGIN
  -- 대조군(A)와 실험군(B) 데이터 가져오기
  SELECT 
    AVG(CASE WHEN variant = 'A' THEN 
      CASE metric 
        WHEN 'ctr' THEN ctr 
        WHEN 'conversion_rate' THEN conversion_rate 
        ELSE 0 
      END
    END),
    AVG(CASE WHEN variant = 'B' THEN 
      CASE metric 
        WHEN 'ctr' THEN ctr 
        WHEN 'conversion_rate' THEN conversion_rate 
        ELSE 0 
      END
    END),
    VAR_POP(CASE WHEN variant = 'A' THEN 
      CASE metric 
        WHEN 'ctr' THEN ctr 
        WHEN 'conversion_rate' THEN conversion_rate 
        ELSE 0 
      END
    END),
    VAR_POP(CASE WHEN variant = 'B' THEN 
      CASE metric 
        WHEN 'ctr' THEN ctr 
        WHEN 'conversion_rate' THEN conversion_rate 
        ELSE 0 
      END
    END),
    SUM(CASE WHEN variant = 'A' THEN total_users ELSE 0 END),
    SUM(CASE WHEN variant = 'B' THEN total_users ELSE 0 END)
  INTO control_mean, treatment_mean, control_var, treatment_var, control_n, treatment_n
  FROM experiment_results_summary 
  WHERE experiment_id = experiment_uuid;
  
  -- t-검정 수행
  IF control_n > 0 AND treatment_n > 0 THEN
    pooled_se := SQRT((control_var/control_n) + (treatment_var/treatment_n));
    t_statistic := (treatment_mean - control_mean) / pooled_se;
    df := control_n + treatment_n - 2;
    
    -- 간단한 p-value 계산 (정확한 계산은 별도 함수 필요)
    p_value := CASE 
      WHEN ABS(t_statistic) > 2.58 THEN 0.01  -- 99% 신뢰도
      WHEN ABS(t_statistic) > 1.96 THEN 0.05  -- 95% 신뢰도
      WHEN ABS(t_statistic) > 1.65 THEN 0.1   -- 90% 신뢰도
      ELSE 0.2
    END;
    
    is_significant := p_value < 0.05;
    
    -- Cohen's d 계산
    cohens_d := (treatment_mean - control_mean) / SQRT((control_var + treatment_var) / 2);
    
    -- 결과 저장
    INSERT INTO statistical_significance_tests (
      experiment_id, metric_name, 
      control_mean, treatment_mean,
      control_variance, treatment_variance,
      control_sample_size, treatment_sample_size,
      t_statistic, p_value, is_significant, effect_size
    ) VALUES (
      experiment_uuid, metric,
      control_mean, treatment_mean,
      control_var, treatment_var,
      control_n, treatment_n,
      t_statistic, p_value, is_significant, cohens_d
    ) ON CONFLICT (experiment_id, metric_name) 
    DO UPDATE SET
      control_mean = EXCLUDED.control_mean,
      treatment_mean = EXCLUDED.treatment_mean,
      control_variance = EXCLUDED.control_variance,
      treatment_variance = EXCLUDED.treatment_variance,
      control_sample_size = EXCLUDED.control_sample_size,
      treatment_sample_size = EXCLUDED.treatment_sample_size,
      t_statistic = EXCLUDED.t_statistic,
      p_value = EXCLUDED.p_value,
      is_significant = EXCLUDED.is_significant,
      effect_size = EXCLUDED.effect_size,
      calculated_at = NOW();
  END IF;
  
  RETURN QUERY SELECT t_statistic, p_value, is_significant, cohens_d;
END;
$$;