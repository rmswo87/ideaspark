import { supabase } from '@/lib/supabase';
import { RecommendationStrategy } from './advancedRecommendationService';

export interface RecommendationExperiment {
  id: string;
  name: string;
  description?: string;
  strategy_a: RecommendationStrategy; // 대조군
  strategy_b: RecommendationStrategy; // 실험군
  traffic_split: number; // 트래픽 분할 비율 (0.5 = 50:50)
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  hypothesis: string;
  success_metric: 'ctr' | 'engagement' | 'conversion' | 'satisfaction';
  minimum_sample_size: number;
  confidence_level: number;
  statistical_power: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentPerformance {
  experiment_id: string;
  variant: 'A' | 'B';
  total_users: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  ctr: number; // Click Through Rate
  conversion_rate: number;
  avg_engagement_time: number;
  bounce_rate: number;
  calculated_at: string;
}

export interface StatisticalTest {
  experiment_id: string;
  metric_name: string;
  control_mean: number;
  treatment_mean: number;
  control_variance: number;
  treatment_variance: number;
  control_sample_size: number;
  treatment_sample_size: number;
  t_statistic: number;
  p_value: number;
  is_significant: boolean;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  effect_size: number; // Cohen's d
  power: number;
  calculated_at: string;
}

export interface AnalyticsDashboardData {
  active_experiments: RecommendationExperiment[];
  experiment_performances: Record<string, ExperimentPerformance[]>;
  statistical_results: Record<string, StatisticalTest[]>;
  recommendation_metrics: {
    total_recommendations_today: number;
    avg_ctr_today: number;
    avg_conversion_rate_today: number;
    strategy_performance: Record<RecommendationStrategy, {
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      conversion_rate: number;
    }>;
  };
  user_engagement_trends: {
    date: string;
    total_users: number;
    avg_session_duration: number;
    recommendations_per_user: number;
  }[];
}

// A/B 테스트 실험 생성
export async function createRecommendationExperiment(
  name: string,
  strategyA: RecommendationStrategy,
  strategyB: RecommendationStrategy,
  trafficSplit: number = 0.5,
  duration: number = 7, // 기본 7일
  hypothesis: string,
  successMetric: 'ctr' | 'engagement' | 'conversion' | 'satisfaction' = 'ctr'
): Promise<string> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const { data, error } = await supabase
      .from('recommendation_experiments')
      .insert({
        name,
        strategy_a: strategyA,
        strategy_b: strategyB,
        traffic_split: trafficSplit,
        end_date: endDate.toISOString(),
        status: 'active',
        hypothesis,
        success_metric: successMetric,
        minimum_sample_size: 1000,
        confidence_level: 0.95,
        statistical_power: 0.8
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log(`✅ A/B Test Created: ${name} (${strategyA} vs ${strategyB})`);
    return data.id;

  } catch (error) {
    console.error('❌ Error creating A/B test experiment:', error);
    throw error;
  }
}

// 사용자를 실험에 할당
export async function assignUserToExperiment(
  userId: string,
  experimentId: string
): Promise<'A' | 'B'> {
  try {
    // 기존 할당 확인
    const { data: existingAssignment } = await supabase
      .from('user_experiment_assignments')
      .select('variant')
      .eq('user_id', userId)
      .eq('experiment_id', experimentId)
      .single();

    if (existingAssignment) {
      return existingAssignment.variant as 'A' | 'B';
    }

    // 실험 정보 가져오기
    const { data: experiment, error: expError } = await supabase
      .from('recommendation_experiments')
      .select('traffic_split, status')
      .eq('id', experimentId)
      .single();

    if (expError || !experiment || experiment.status !== 'active') {
      return 'A'; // 기본값: 대조군
    }

    // 트래픽 분할에 따라 변수 할당
    const random = Math.random();
    const variant: 'A' | 'B' = random < experiment.traffic_split ? 'A' : 'B';

    // 할당 저장
    await supabase
      .from('user_experiment_assignments')
      .insert({
        user_id: userId,
        experiment_id: experimentId,
        variant
      });

    return variant;

  } catch (error) {
    console.error('❌ Error assigning user to experiment:', error);
    return 'A'; // 에러 시 대조군
  }
}

// 실험 성과 로깅
export async function logExperimentPerformance(
  experimentId: string,
  userId: string,
  variant: 'A' | 'B',
  actionTaken: 'impression' | 'click' | 'like' | 'bookmark' | 'generate_prd' | 'share',
  recommendedIdeaId: string,
  positionInList?: number,
  sessionId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('experiment_performance_logs')
      .insert({
        experiment_id: experimentId,
        user_id: userId,
        variant,
        action_taken: actionTaken,
        recommended_idea_id: recommendedIdeaId,
        position_in_list: positionInList,
        session_id: sessionId,
        metadata
      });

    console.log(`📊 Experiment Performance Logged: ${experimentId} - ${variant} - ${actionTaken}`);

  } catch (error) {
    console.error('❌ Error logging experiment performance:', error);
  }
}

// 실험 결과 분석 및 통계적 유의성 검정
export async function analyzeExperimentResults(
  experimentId: string
): Promise<{
  performance: ExperimentPerformance[];
  statistical_tests: StatisticalTest[];
  recommendation: string;
  confidence: number;
}> {
  try {
    // 실험 성과 데이터 가져오기
    const { data: performanceData, error: perfError } = await supabase
      .from('experiment_results_summary')
      .select('*')
      .eq('experiment_id', experimentId);

    if (perfError) throw perfError;

    if (!performanceData || performanceData.length < 2) {
      return {
        performance: [],
        statistical_tests: [],
        recommendation: '충분한 데이터가 없습니다',
        confidence: 0
      };
    }

    const variantA = performanceData.find(p => p.variant === 'A');
    const variantB = performanceData.find(p => p.variant === 'B');

    if (!variantA || !variantB) {
      return {
        performance: performanceData,
        statistical_tests: [],
        recommendation: '대조군과 실험군 데이터가 불완전합니다',
        confidence: 0
      };
    }

    // 통계적 유의성 검정 수행
    const statisticalTests: StatisticalTest[] = [];

    // CTR 검정
    const ctrTest = await performTTest(
      variantA.ctr, variantB.ctr,
      variantA.total_users, variantB.total_users,
      calculateVariance(variantA.ctr, variantA.total_users),
      calculateVariance(variantB.ctr, variantB.total_users)
    );
    
    statisticalTests.push({
      experiment_id: experimentId,
      metric_name: 'ctr',
      control_mean: variantA.ctr,
      treatment_mean: variantB.ctr,
      control_variance: calculateVariance(variantA.ctr, variantA.total_users),
      treatment_variance: calculateVariance(variantB.ctr, variantB.total_users),
      control_sample_size: variantA.total_users,
      treatment_sample_size: variantB.total_users,
      ...ctrTest,
      calculated_at: new Date().toISOString()
    });

    // Conversion Rate 검정
    const conversionTest = await performTTest(
      variantA.conversion_rate, variantB.conversion_rate,
      variantA.total_users, variantB.total_users,
      calculateVariance(variantA.conversion_rate, variantA.total_users),
      calculateVariance(variantB.conversion_rate, variantB.total_users)
    );

    statisticalTests.push({
      experiment_id: experimentId,
      metric_name: 'conversion_rate',
      control_mean: variantA.conversion_rate,
      treatment_mean: variantB.conversion_rate,
      control_variance: calculateVariance(variantA.conversion_rate, variantA.total_users),
      treatment_variance: calculateVariance(variantB.conversion_rate, variantB.total_users),
      control_sample_size: variantA.total_users,
      treatment_sample_size: variantB.total_users,
      ...conversionTest,
      calculated_at: new Date().toISOString()
    });

    // 결과 저장
    for (const test of statisticalTests) {
      await supabase
        .from('statistical_significance_tests')
        .upsert(test);
    }

    // 추천 생성
    const recommendation = generateRecommendation(statisticalTests, variantA, variantB);
    const confidence = calculateOverallConfidence(statisticalTests);

    return {
      performance: performanceData,
      statistical_tests: statisticalTests,
      recommendation,
      confidence
    };

  } catch (error) {
    console.error('❌ Error analyzing experiment results:', error);
    throw error;
  }
}

// 통합 분석 대시보드 데이터 생성
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  try {
    console.log('📊 Generating Analytics Dashboard Data...');

    // 1. 활성 실험 목록
    const { data: activeExperiments, error: expError } = await supabase
      .from('recommendation_experiments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (expError) throw expError;

    // 2. 실험별 성과 데이터
    const experimentPerformances: Record<string, ExperimentPerformance[]> = {};
    for (const exp of activeExperiments || []) {
      const { data: performance } = await supabase
        .from('experiment_results_summary')
        .select('*')
        .eq('experiment_id', exp.id);
      
      if (performance) {
        experimentPerformances[exp.id] = performance;
      }
    }

    // 3. 통계적 검정 결과
    const statisticalResults: Record<string, StatisticalTest[]> = {};
    for (const exp of activeExperiments || []) {
      const { data: tests } = await supabase
        .from('statistical_significance_tests')
        .select('*')
        .eq('experiment_id', exp.id);
      
      if (tests) {
        statisticalResults[exp.id] = tests;
      }
    }

    // 4. 오늘의 추천 메트릭
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMetrics, error: metricsError } = await supabase
      .from('recommendation_metrics')
      .select('*')
      .gte('timestamp', `${today}T00:00:00.000Z`)
      .lt('timestamp', `${today}T23:59:59.999Z`);

    if (metricsError) throw metricsError;

    // 전략별 성과 계산
    const strategyPerformance: Record<RecommendationStrategy, any> = {} as any;
    const strategyMap: Record<RecommendationStrategy, {
      impressions: number;
      clicks: number;
      conversions: number;
    }> = {} as any;

    todayMetrics?.forEach(metric => {
      const strategy = metric.recommendation_strategy as RecommendationStrategy;
      if (!strategyMap[strategy]) {
        strategyMap[strategy] = { impressions: 0, clicks: 0, conversions: 0 };
      }

      strategyMap[strategy].impressions += 1;
      if (metric.interactions?.clicked) {
        strategyMap[strategy].clicks += 1;
      }
      if (metric.interactions?.converted) {
        strategyMap[strategy].conversions += 1;
      }
    });

    // CTR과 Conversion Rate 계산
    Object.keys(strategyMap).forEach(strategy => {
      const stats = strategyMap[strategy as RecommendationStrategy];
      strategyPerformance[strategy as RecommendationStrategy] = {
        ...stats,
        ctr: stats.impressions > 0 ? stats.clicks / stats.impressions : 0,
        conversion_rate: stats.clicks > 0 ? stats.conversions / stats.clicks : 0
      };
    });

    // 5. 사용자 참여 트렌드 (최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: engagementData, error: engagementError } = await supabase
      .from('user_behaviors')
      .select('created_at, user_id, duration')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (engagementError) throw engagementError;

    // 일별 참여 트렌드 계산
    const dailyEngagement = new Map<string, {
      users: Set<string>;
      totalDuration: number;
      recommendations: number;
    }>();

    engagementData?.forEach(behavior => {
      const date = behavior.created_at.split('T')[0];
      if (!dailyEngagement.has(date)) {
        dailyEngagement.set(date, {
          users: new Set(),
          totalDuration: 0,
          recommendations: 0
        });
      }

      const day = dailyEngagement.get(date)!;
      day.users.add(behavior.user_id);
      day.totalDuration += behavior.duration || 0;
      day.recommendations += 1;
    });

    const userEngagementTrends = Array.from(dailyEngagement.entries())
      .map(([date, stats]) => ({
        date,
        total_users: stats.users.size,
        avg_session_duration: stats.totalDuration / stats.users.size,
        recommendations_per_user: stats.recommendations / stats.users.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recommendationMetrics = {
      total_recommendations_today: todayMetrics?.length || 0,
      avg_ctr_today: calculateAverageCTR(todayMetrics || []),
      avg_conversion_rate_today: calculateAverageConversionRate(todayMetrics || []),
      strategy_performance: strategyPerformance
    };

    const dashboardData: AnalyticsDashboardData = {
      active_experiments: activeExperiments || [],
      experiment_performances: experimentPerformances,
      statistical_results: statisticalResults,
      recommendation_metrics: recommendationMetrics,
      user_engagement_trends: userEngagementTrends
    };

    console.log('✅ Analytics Dashboard Data Generated');
    return dashboardData;

  } catch (error) {
    console.error('❌ Error generating analytics dashboard data:', error);
    throw error;
  }
}

// 실험 상태 업데이트
export async function updateExperimentStatus(
  experimentId: string,
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
): Promise<void> {
  try {
    await supabase
      .from('recommendation_experiments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', experimentId);

    console.log(`✅ Experiment ${experimentId} status updated to ${status}`);
  } catch (error) {
    console.error('❌ Error updating experiment status:', error);
    throw error;
  }
}

// 실험 결과 보고서 생성
export async function generateExperimentReport(
  experimentId: string
): Promise<{
  experiment_info: RecommendationExperiment;
  summary: string;
  key_findings: string[];
  statistical_significance: boolean;
  recommendation: string;
  next_steps: string[];
}> {
  try {
    // 실험 정보 가져오기
    const { data: experiment, error: expError } = await supabase
      .from('recommendation_experiments')
      .select('*')
      .eq('id', experimentId)
      .single();

    if (expError) throw expError;

    // 분석 결과 가져오기
    const analysis = await analyzeExperimentResults(experimentId);

    // 보고서 생성
    const variantA = analysis.performance.find(p => p.variant === 'A');
    const variantB = analysis.performance.find(p => p.variant === 'B');

    const ctrTest = analysis.statistical_tests.find(t => t.metric_name === 'ctr');
    const conversionTest = analysis.statistical_tests.find(t => t.metric_name === 'conversion_rate');

    const summary = generateExperimentSummary(experiment, variantA, variantB, analysis.statistical_tests);
    const keyFindings = generateKeyFindings(variantA, variantB, analysis.statistical_tests);
    const statisticalSignificance = analysis.statistical_tests.some(t => t.is_significant);
    const nextSteps = generateNextSteps(experiment, analysis.statistical_tests, statisticalSignificance);

    return {
      experiment_info: experiment,
      summary,
      key_findings: keyFindings,
      statistical_significance,
      recommendation: analysis.recommendation,
      next_steps: nextSteps
    };

  } catch (error) {
    console.error('❌ Error generating experiment report:', error);
    throw error;
  }
}

// 보조 함수들
async function performTTest(
  meanA: number, 
  meanB: number,
  nA: number,
  nB: number,
  varA: number,
  varB: number
): Promise<{
  t_statistic: number;
  p_value: number;
  is_significant: boolean;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  effect_size: number;
  power: number;
}> {
  // Welch's t-test 구현
  const pooledSE = Math.sqrt((varA / nA) + (varB / nB));
  const tStatistic = (meanB - meanA) / pooledSE;
  
  // 자유도 계산 (Welch-Satterthwaite equation)
  const df = Math.pow((varA/nA) + (varB/nB), 2) / 
             (Math.pow(varA/nA, 2)/(nA-1) + Math.pow(varB/nB, 2)/(nB-1));

  // 간단한 p-value 계산 (정확한 계산을 위해서는 별도 라이브러리 필요)
  const pValue = calculatePValue(Math.abs(tStatistic), df);
  
  // Cohen's d (효과 크기)
  const pooledSD = Math.sqrt(((nA-1)*varA + (nB-1)*varB) / (nA+nB-2));
  const cohensD = (meanB - meanA) / pooledSD;

  // 신뢰구간 계산
  const tCritical = 1.96; // 95% 신뢰수준 근사치
  const marginOfError = tCritical * pooledSE;
  const meanDiff = meanB - meanA;

  return {
    t_statistic: tStatistic,
    p_value: pValue,
    is_significant: pValue < 0.05,
    confidence_interval_lower: meanDiff - marginOfError,
    confidence_interval_upper: meanDiff + marginOfError,
    effect_size: cohensD,
    power: calculatePower(cohensD, nA, nB) // 간단한 파워 계산
  };
}

function calculateVariance(mean: number, n: number): number {
  // 이항분포의 분산: p(1-p)
  return mean * (1 - mean);
}

function calculatePValue(tStat: number, df: number): number {
  // 간단한 p-value 근사계산
  if (Math.abs(tStat) > 2.58) return 0.01;
  if (Math.abs(tStat) > 1.96) return 0.05;
  if (Math.abs(tStat) > 1.65) return 0.1;
  return 0.2;
}

function calculatePower(effectSize: number, n1: number, n2: number): number {
  // 간단한 통계적 검정력 계산
  const harmonicMean = 2 / (1/n1 + 1/n2);
  const ncp = Math.abs(effectSize) * Math.sqrt(harmonicMean / 2);
  
  if (ncp > 2.8) return 0.8;
  if (ncp > 2.2) return 0.6;
  if (ncp > 1.6) return 0.4;
  return 0.2;
}

function generateRecommendation(
  tests: StatisticalTest[],
  variantA: ExperimentPerformance,
  variantB: ExperimentPerformance
): string {
  const significantTests = tests.filter(t => t.is_significant);
  
  if (significantTests.length === 0) {
    return '통계적으로 유의한 차이가 발견되지 않았습니다. 더 많은 데이터 수집이 필요합니다.';
  }

  const ctrTest = tests.find(t => t.metric_name === 'ctr');
  const conversionTest = tests.find(t => t.metric_name === 'conversion_rate');

  let recommendation = '';
  
  if (ctrTest?.is_significant) {
    const winner = ctrTest.treatment_mean > ctrTest.control_mean ? 'B' : 'A';
    const improvement = Math.abs((ctrTest.treatment_mean - ctrTest.control_mean) / ctrTest.control_mean * 100);
    recommendation += `CTR이 ${winner} 변수에서 ${improvement.toFixed(1)}% 더 높습니다. `;
  }

  if (conversionTest?.is_significant) {
    const winner = conversionTest.treatment_mean > conversionTest.control_mean ? 'B' : 'A';
    const improvement = Math.abs((conversionTest.treatment_mean - conversionTest.control_mean) / conversionTest.control_mean * 100);
    recommendation += `전환율이 ${winner} 변수에서 ${improvement.toFixed(1)}% 더 높습니다. `;
  }

  return recommendation + '승리한 전략을 프로덕션에 적용하는 것을 권장합니다.';
}

function calculateOverallConfidence(tests: StatisticalTest[]): number {
  if (tests.length === 0) return 0;
  
  const avgPValue = tests.reduce((sum, test) => sum + test.p_value, 0) / tests.length;
  return Math.max(0, 1 - avgPValue);
}

function calculateAverageCTR(metrics: any[]): number {
  if (metrics.length === 0) return 0;
  
  let totalClicks = 0;
  let totalImpressions = 0;
  
  metrics.forEach(metric => {
    totalImpressions += 1;
    if (metric.interactions?.clicked) {
      totalClicks += 1;
    }
  });
  
  return totalImpressions > 0 ? totalClicks / totalImpressions : 0;
}

function calculateAverageConversionRate(metrics: any[]): number {
  if (metrics.length === 0) return 0;
  
  let totalClicks = 0;
  let totalConversions = 0;
  
  metrics.forEach(metric => {
    if (metric.interactions?.clicked) {
      totalClicks += 1;
    }
    if (metric.interactions?.converted) {
      totalConversions += 1;
    }
  });
  
  return totalClicks > 0 ? totalConversions / totalClicks : 0;
}

function generateExperimentSummary(
  experiment: RecommendationExperiment,
  variantA?: ExperimentPerformance,
  variantB?: ExperimentPerformance,
  tests?: StatisticalTest[]
): string {
  const duration = experiment.end_date 
    ? Math.ceil((new Date(experiment.end_date).getTime() - new Date(experiment.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 'ongoing';

  return `${experiment.name} 실험이 ${duration}일간 진행되어 ${experiment.strategy_a} (대조군)와 ${experiment.strategy_b} (실험군)을 비교했습니다. ` +
         `총 ${(variantA?.total_users || 0) + (variantB?.total_users || 0)}명의 사용자가 참여했습니다.`;
}

function generateKeyFindings(
  variantA?: ExperimentPerformance,
  variantB?: ExperimentPerformance,
  tests?: StatisticalTest[]
): string[] {
  const findings: string[] = [];
  
  if (variantA && variantB) {
    findings.push(`대조군 CTR: ${(variantA.ctr * 100).toFixed(2)}%, 실험군 CTR: ${(variantB.ctr * 100).toFixed(2)}%`);
    findings.push(`대조군 전환율: ${(variantA.conversion_rate * 100).toFixed(2)}%, 실험군 전환율: ${(variantB.conversion_rate * 100).toFixed(2)}%`);
  }

  tests?.forEach(test => {
    if (test.is_significant) {
      findings.push(`${test.metric_name}에서 통계적으로 유의한 차이 발견 (p=${test.p_value.toFixed(3)})`);
    }
  });

  return findings;
}

function generateNextSteps(
  experiment: RecommendationExperiment,
  tests: StatisticalTest[],
  isSignificant: boolean
): string[] {
  const steps: string[] = [];
  
  if (isSignificant) {
    steps.push('승리한 전략을 100% 트래픽에 적용');
    steps.push('결과를 팀과 공유하고 학습 내용 문서화');
    steps.push('다음 개선 영역을 위한 새로운 실험 설계');
  } else {
    steps.push('더 큰 표본 크기로 실험 연장 고려');
    steps.push('실험 설계 재검토 (효과 크기, 측정 지표 등)');
    steps.push('대안적인 전략 탐색');
  }
  
  steps.push('실험 결과를 지식베이스에 저장');
  
  return steps;
}

export {
  createRecommendationExperiment,
  assignUserToExperiment,
  logExperimentPerformance,
  analyzeExperimentResults,
  getAnalyticsDashboardData,
  updateExperimentStatus,
  generateExperimentReport
};