import React, { useState, useEffect } from 'react';
import { 
  getAnalyticsDashboardData,
  analyzeExperimentResults,
  updateExperimentStatus,
  AnalyticsDashboardData
} from '@/services/recommendationAnalyticsService';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MousePointer, 
  Target, 
  Brain,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Square,
  RefreshCw
} from 'lucide-react';

interface RecommendationDashboardProps {
  className?: string;
}

export const RecommendationDashboard: React.FC<RecommendationDashboardProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'experiments' | 'performance' | 'trends'>('overview');
  // const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading dashboard data...');
      const data = await getAnalyticsDashboardData();
      setDashboardData(data);
      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 실험 상태 변경
  const handleExperimentStatusChange = async (experimentId: string, newStatus: string) => {
    try {
      await updateExperimentStatus(experimentId, newStatus as any);
      await loadDashboardData(); // 데이터 새로고침
    } catch (error) {
      console.error('❌ Error updating experiment status:', error);
    }
  };

  // 실험 분석
  const handleAnalyzeExperiment = async (experimentId: string) => {
    try {
      const analysis = await analyzeExperimentResults(experimentId);
      console.log('📊 Experiment Analysis:', analysis);
      // 분석 결과 표시 로직 (모달 또는 별도 섹션)
    } catch (error) {
      console.error('❌ Error analyzing experiment:', error);
    }
  };

  // 권한 확인 (관리자만 접근 가능)
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">접근 권한 없음</h3>
          <p className="text-gray-500">관리자 권한이 필요한 페이지입니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-gray-600">대시보드 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">오류</span>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">데이터 없음</h3>
        <p className="text-gray-500">표시할 분석 데이터가 없습니다.</p>
      </div>
    );
  }

  const { 
    active_experiments, 
    recommendation_metrics, 
    user_engagement_trends,
    experiment_performances,
    statistical_results
  } = dashboardData;

  // 차트 색상
  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">추천 시스템 대시보드</h1>
            <p className="text-gray-500">AI 추천 성능 및 A/B 테스트 분석</p>
          </div>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[
            { id: 'overview', name: '개요', icon: Activity },
            { id: 'experiments', name: 'A/B 테스트', icon: Target },
            { id: 'performance', name: '성능 분석', icon: TrendingUp },
            { id: 'trends', name: '트렌드', icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 개요 탭 */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">오늘의 추천</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {recommendation_metrics.total_recommendations_today.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">평균 CTR</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(recommendation_metrics.avg_ctr_today * 100).toFixed(1)}%
                  </p>
                </div>
                <MousePointer className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">전환율</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(recommendation_metrics.avg_conversion_rate_today * 100).toFixed(1)}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">활성 실험</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {active_experiments.length}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* 전략별 성능 차트 */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">전략별 성능 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={Object.entries(recommendation_metrics.strategy_performance).map(([strategy, perf]) => ({
                  strategy,
                  ctr: (perf.ctr * 100),
                  conversion_rate: (perf.conversion_rate * 100),
                  impressions: perf.impressions
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}${name.includes('rate') || name === 'ctr' ? '%' : ''}`,
                    name === 'ctr' ? 'CTR' : name === 'conversion_rate' ? '전환율' : '노출수'
                  ]}
                />
                <Legend />
                <Bar dataKey="ctr" fill="#8B5CF6" name="CTR (%)" />
                <Bar dataKey="conversion_rate" fill="#06B6D4" name="전환율 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 사용자 참여 트렌드 */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 참여 트렌드 (최근 7일)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={user_engagement_trends}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total_users" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="활성 사용자"
                />
                <Line 
                  type="monotone" 
                  dataKey="recommendations_per_user" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="사용자당 추천수"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* A/B 테스트 탭 */}
      {selectedTab === 'experiments' && (
        <div className="space-y-6">
          {/* 활성 실험 리스트 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">활성 A/B 테스트</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {active_experiments.length > 0 ? (
                active_experiments.map((experiment) => (
                  <div key={experiment.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {experiment.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            experiment.status === 'active' ? 'bg-green-100 text-green-800' :
                            experiment.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {experiment.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{experiment.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span>대조군: {experiment.strategy_a}</span>
                          <span>실험군: {experiment.strategy_b}</span>
                          <span>트래픽 분할: {Math.round(experiment.traffic_split * 100)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {experiment.status === 'active' && (
                          <button
                            onClick={() => handleExperimentStatusChange(experiment.id, 'paused')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {experiment.status === 'paused' && (
                          <button
                            onClick={() => handleExperimentStatusChange(experiment.id, 'active')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExperimentStatusChange(experiment.id, 'completed')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAnalyzeExperiment(experiment.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 실험 성과 요약 */}
                    {experiment_performances[experiment.id] && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {experiment_performances[experiment.id].map((perf) => (
                          <div key={perf.variant} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                변수 {perf.variant} ({perf.variant === 'A' ? experiment.strategy_a : experiment.strategy_b})
                              </span>
                              {statistical_results[experiment.id]?.find(t => t.metric_name === 'ctr')?.is_significant && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">사용자:</span>
                                <span className="font-medium">{perf.total_users.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">CTR:</span>
                                <span className="font-medium">{(perf.ctr * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">전환율:</span>
                                <span className="font-medium">{(perf.conversion_rate * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  진행 중인 A/B 테스트가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 성능 분석 탭 */}
      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* 전략별 상세 성능 */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">전략별 상세 성능</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(recommendation_metrics.strategy_performance).map(([strategy, perf], index) => ({
                      name: strategy,
                      value: perf.impressions,
                      fill: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {Object.entries(recommendation_metrics.strategy_performance).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                {Object.entries(recommendation_metrics.strategy_performance).map(([strategy, perf], index) => (
                  <div key={strategy} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900">{strategy}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        CTR: {(perf.ctr * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {perf.impressions.toLocaleString()} 노출
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 트렌드 탭 */}
      {selectedTab === 'trends' && (
        <div className="space-y-6">
          {/* 시간별 성능 트렌드 */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시간별 참여도 트렌드</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={user_engagement_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_users"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="활성 사용자"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_session_duration"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  name="평균 세션 시간(분)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="recommendations_per_user"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="사용자당 추천수"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationDashboard;