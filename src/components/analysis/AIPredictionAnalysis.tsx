import React, { useState, useEffect, useMemo, Component } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceDot,
  BarChart,
  Bar,
  Cell,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Target,
  Activity,
  Factory,
  Cog,
  Package,
  Zap,
  Lightbulb,
  Shield,
  Search,
  Clock,
  ChevronRight,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Gauge,
} from 'lucide-react';
import {
  type AIPredictionFilters,
  type ForecastDays,
  type PredictionTarget,
  type RiskLevel,
  getDefaultAIPredictionFilters,
  loadProcessQualityData,
  loadPhysicalTestRecords,
  filterRecordsByConditions,
  filterPhysicalRecordsByConditions,
  generateAIPredictionResult,
} from '../../utils/aiPredictionUtils';

const PREDICTION_TARGETS: { key: PredictionTarget; label: string }[] = [
  { key: 'comprehensive', label: '综合质量' },
  { key: 'box', label: '箱装外观' },
  { key: 'carton', label: '条装外观' },
  { key: 'pack', label: '盒装外观' },
  { key: 'cigarette', label: '烟支外观' },
  { key: 'machine', label: '机台维度' },
  { key: 'brand', label: '牌号维度' },
  { key: 'productionPoint', label: '合作生产点' },
  { key: 'physical', label: '烟支物测' },
];

const FORECAST_OPTIONS: { key: ForecastDays; label: string }[] = [
  { key: 7, label: '未来7天' },
  { key: 14, label: '未来14天' },
  { key: 30, label: '未来30天' },
];

const PRODUCTION_POINTS = ['阿联酋环球烟草', '印尼科伦印象'];
const BRANDS = [
  '摩登（中东-EU）',
  '摩登（普通红吉布提）',
  '摩登（普通红国际）',
  '摩登（普通银国际）',
  '摩登（细支）',
  '摩登（细支金）',
  '摩登（超细支）',
  '摩登（超细金）',
  '摩登（超细银）',
  '摩登（超细黑）',
  '摩登（97超细白）',
];
const MACHINES = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];
const SHIFT_GROUPS = ['早班', '夜班'];
const SHIFTS = ['1', '2'];

const TECH_COLORS = {
  primary: '#3b82f6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  chartPalette: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#ec4899'],
  cardBg: 'rgba(15, 23, 42, 0.6)',
  gridLine: 'rgba(71, 85, 105, 0.2)',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  '低': '#10b981',
  '中': '#f59e0b',
  '较高': '#f97316',
  '高': '#f43f5e',
};

const RISK_BG_COLORS: Record<RiskLevel, string> = {
  '低': 'rgba(16, 185, 129, 0.15)',
  '中': 'rgba(245, 158, 11, 0.15)',
  '较高': 'rgba(249, 115, 22, 0.15)',
  '高': 'rgba(244, 63, 94, 0.15)',
};

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = display;
    const end = value;
    const duration = 600;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setDisplay(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}</span>;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI预测页面渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">AI预测页面加载失败</h2>
            <p className="text-sm text-slate-300 mb-4">
              {this.state.error?.message || '组件渲染出现未知错误，请检查控制台日志。'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm hover:bg-rose-500/30 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AIPredictionAnalysisContent() {
  const [filters, setFilters] = useState<AIPredictionFilters>(getDefaultAIPredictionFilters);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [allPhysicalRecords, setAllPhysicalRecords] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [processRows, physicalRows] = await Promise.all([
        loadProcessQualityData(),
        loadPhysicalTestRecords(),
      ]);
      setAllRecords(processRows);
      setAllPhysicalRecords(physicalRows);
    };
    load();
    window.addEventListener('quality-data-updated', load);
    return () => window.removeEventListener('quality-data-updated', load);
  }, []);

  const filteredRecords = useMemo(() => {
    return filterRecordsByConditions(allRecords as any[], filters);
  }, [allRecords, filters]);

  const filteredPhysicalRecords = useMemo(() => {
    return filterPhysicalRecordsByConditions(allPhysicalRecords as any[], filters);
  }, [allPhysicalRecords, filters]);

  const result = useMemo(
    () => generateAIPredictionResult(filteredRecords as any[], filteredPhysicalRecords as any[], filters),
    [filteredRecords, filteredPhysicalRecords, filters]
  );

  const hasData = filteredRecords.length > 0 || filteredPhysicalRecords.length > 0;

  const metricCard = (
    label: string,
    value: string | number,
    unit = '',
    color: string,
    icon: React.ReactNode,
    sub?: string,
    numeric = true
  ) => (
    <div
      className="relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: TECH_COLORS.cardBg, borderColor: `${color}30`, boxShadow: `0 0 20px ${color}10` }}
    >
      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-10" style={{ background: color }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-400">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">
              {numeric ? <AnimatedNumber value={Number(value)} decimals={typeof value === 'number' && value % 1 !== 0 ? 2 : 0} /> : value}
            </span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {sub && <p className="mt-2 text-xs text-slate-500 font-mono">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
      </div>
    </div>
  );

  const renderTrendBadge = (trend: string, color?: string) => {
    const c = color || (trend === '改善' || trend === '上升' ? '#10b981' : trend === '恶化' || trend === '下降' ? '#f43f5e' : '#64748b');
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium" style={{ background: `${c}20`, color: c }}>
        {trend === '改善' || trend === '上升' ? <TrendingUp className="w-3 h-3" /> :
         trend === '恶化' || trend === '下降' ? <TrendingDown className="w-3 h-3" /> :
         <Minus className="w-3 h-3" />}
        {trend}
      </span>
    );
  };

  const renderRiskBadge = (level: RiskLevel) => (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ background: RISK_BG_COLORS[level], color: RISK_COLORS[level] }}
    >
      {level}风险
    </span>
  );

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">AI质量趋势预测</h1>
        <p className="text-body text-muted-foreground mt-1">智质应用 / AI质量趋势预测</p>
      </div>

      {/* 顶部筛选 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/25 backdrop-blur-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <BrainCircuit className="w-4 h-4 text-violet-400" />
          </div>
          <h2 className="text-base font-bold text-white">预测条件</h2>
          <span className="text-xs text-slate-500 font-mono ml-auto">AI PREDICTION FILTERS</span>
        </div>

        <div className="grid grid-cols-8 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">预测对象</label>
            <select
              value={filters.predictionTarget}
              onChange={(e) => setFilters(prev => ({ ...prev, predictionTarget: e.target.value as PredictionTarget }))}
              className="input-field"
            >
              {PREDICTION_TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">预测周期</label>
            <select
              value={filters.forecastDays}
              onChange={(e) => setFilters(prev => ({ ...prev, forecastDays: Number(e.target.value) as ForecastDays }))}
              className="input-field"
            >
              {FORECAST_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
            <select
              value={filters.productionPoint}
              onChange={(e) => setFilters(prev => ({ ...prev, productionPoint: e.target.value }))}
              className="form-select"
            >
              <option value="">全部</option>
              {PRODUCTION_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">牌号</label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
              className="form-select"
            >
              <option value="">全部</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">机台</label>
            <select
              value={filters.machine}
              onChange={(e) => setFilters(prev => ({ ...prev, machine: e.target.value }))}
              className="form-select"
            >
              <option value="">全部</option>
              {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班别</label>
            <select
              value={filters.shiftGroup}
              onChange={(e) => setFilters(prev => ({ ...prev, shiftGroup: e.target.value }))}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班次</label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters(prev => ({ ...prev, shift: e.target.value }))}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 flex items-end">
            <button
              onClick={() => setFilters(getDefaultAIPredictionFilters())}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-600/30 text-slate-300 bg-slate-800/40 hover:bg-slate-700/40 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-800/20 backdrop-blur-sm p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/[0.02] rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-bold text-slate-400 mb-2">暂无足够历史数据</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              AI预测需要基于系统真实历史数据，当前筛选条件下暂无数据，请调整条件或先在过程质量管控中录入数据
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* AI预测总览 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Gauge className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-bold text-white">AI预测总览</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">PREDICTION OVERVIEW</span>
            </div>
            <div className="grid grid-cols-6 gap-6">
              {metricCard('当前综合质量状态', result.overview.currentStatus, '',
                result.overview.currentStatus === '优秀' ? TECH_COLORS.emerald :
                result.overview.currentStatus === '良好' ? TECH_COLORS.cyan :
                result.overview.currentStatus === '稳定' ? TECH_COLORS.primary :
                result.overview.currentStatus === '关注' ? TECH_COLORS.amber : TECH_COLORS.rose,
                <Activity className="w-5 h-5" />, 'CURRENT STATUS', false)}
              {metricCard('未来质量趋势', result.overview.futureTrend, '',
                result.overview.futureTrend === '改善' ? TECH_COLORS.emerald :
                result.overview.futureTrend === '恶化' ? TECH_COLORS.rose : TECH_COLORS.amber,
                result.overview.futureTrend === '改善' ? <TrendingUp className="w-5 h-5" /> :
                result.overview.futureTrend === '恶化' ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />,
                'FUTURE TREND', false)}
              {metricCard('未来风险等级', result.overview.riskLevel, '',
                RISK_COLORS[result.overview.riskLevel],
                <Shield className="w-5 h-5" />, 'RISK LEVEL', false)}
              {metricCard('预测重点问题', result.overview.topProblem, '', TECH_COLORS.rose, <AlertTriangle className="w-5 h-5" />, 'TOP PROBLEM', false)}
              {metricCard('重点关注机台', result.overview.focusMachine, '', TECH_COLORS.amber, <Cog className="w-5 h-5" />, 'FOCUS MACHINE', false)}
              {metricCard('预测风险数量', result.overview.predictedRiskCount, '项', TECH_COLORS.rose, <Zap className="w-5 h-5" />, 'RISK ITEMS')}
            </div>
            {(result.overview.dataWarning || result.overview.confidenceLevel !== '高') && (
              <div className="mt-5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">预测可信度：{result.overview.confidence}%（{result.overview.confidenceLevel}）</p>
                  {result.overview.dataWarning && <p className="text-xs text-amber-400/80 mt-1">{result.overview.dataWarning}</p>}
                </div>
              </div>
            )}
          </section>

          {/* 综合质量趋势预测 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">AI综合质量趋势预测</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">COMPREHENSIVE TREND FORECAST</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={result.comprehensiveTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="actualQualityArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastQualityArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actualDefectArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastDefectArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="#33415540" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8 }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                  {(() => {
                    const currentLabel = result.comprehensiveTrend.find(p => !p.isActual)?.label;
                    return currentLabel ? (
                      <ReferenceLine yAxisId="left" x={currentLabel} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '当前时点', position: 'top', fill: '#f59e0b', fontSize: 12 }} />
                    ) : null;
                  })()}
                  <Area yAxisId="left" type="monotone" dataKey="qualityRate" name="优质率(%)" stroke="#10b981" strokeWidth={2} fill="url(#actualQualityArea)" connectNulls />
                  <Area yAxisId="right" type="monotone" dataKey="defectRate" name="缺陷率(%)" stroke="#f43f5e" strokeWidth={2} fill="url(#actualDefectArea)" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs text-slate-500 font-mono">实线区间：历史实际数据；虚线区间：AI未来预测数据；中间竖线：当前时点</p>
          </section>

          {/* 优质率/缺陷率/缺陷数预测 */}
          <section className="grid grid-cols-3 gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">优质率预测</h3>
                {renderRiskBadge(result.qualityRatePrediction.riskLevel)}
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-bold text-white"><AnimatedNumber value={result.qualityRatePrediction.predictedRate} decimals={1} />%</span>
                <span className="text-sm text-slate-400 mb-1">预测{filters.forecastDays}天后</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400"><span>当前优质率</span><span className="text-white">{result.qualityRatePrediction.currentRate}%</span></div>
                <div className="flex justify-between text-slate-400">
                  <span>预测变化</span>
                  <span className={result.qualityRatePrediction.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {result.qualityRatePrediction.change >= 0 ? '+' : ''}{result.qualityRatePrediction.change} 个百分点
                  </span>
                </div>
              </div>
              {result.qualityRatePrediction.warning && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {result.qualityRatePrediction.warning}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">缺陷率预测</h3>
                {renderRiskBadge(result.defectRatePrediction.riskLevel)}
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-bold text-white"><AnimatedNumber value={result.defectRatePrediction.predictedRate} decimals={2} />%</span>
                <span className="text-sm text-slate-400 mb-1">预测{filters.forecastDays}天后</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400"><span>当前缺陷率</span><span className="text-white">{result.defectRatePrediction.currentRate}%</span></div>
                <div className="flex justify-between text-slate-400">
                  <span>趋势判断</span>
                  <span className="text-white">{renderTrendBadge(result.defectRatePrediction.trend)}</span>
                </div>
              </div>
              {result.defectRatePrediction.warning && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {result.defectRatePrediction.warning}
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">缺陷数预测</h3>
                {renderRiskBadge(result.defectRatePrediction.riskLevel)}
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-bold text-white"><AnimatedNumber value={result.overview.predictedRiskCount} /></span>
                <span className="text-sm text-slate-400 mb-1">项预测风险</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-400"><span>历史总缺陷</span><span className="text-white">{result.alerts.filter(a => a.object.includes('缺陷')).length}</span></div>
                <div className="flex justify-between text-slate-400"><span>高风险预警</span><span className="text-rose-400">{result.alerts.filter(a => a.level === '高').length} 项</span></div>
              </div>
            </div>
          </section>

          {/* 未来缺陷风险TOP10 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">未来缺陷风险 TOP10</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">FUTURE DEFECT RISK TOP10</span>
            </div>
            {result.futureDefectRisks.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={result.futureDefectRisks.slice().reverse()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 4" stroke="#33415540" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 8 }}
                      itemStyle={{ color: '#e2e8f0' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value: number, _name: string, props: any) => {
                        const item = props.payload;
                        return [[`风险分：${item.growthRate}%`, item.forecastTrend], item.name];
                      }}
                    />
                    <Bar dataKey="growthRate" name="风险增长率(%)" radius={[0, 4, 4, 0]}>
                      {result.futureDefectRisks.slice().reverse().map((item, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[item.riskLevel]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500">暂无缺陷风险预测数据</div>
            )}
          </section>

          {/* 机台风险排名 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Factory className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">AI重点机台预测</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">MACHINE RISK RANKING</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 text-slate-400">
                    <th className="pb-3 font-medium text-left">排名</th>
                    <th className="pb-3 font-medium text-left">机台</th>
                    <th className="pb-3 font-medium text-left">样本数</th>
                    <th className="pb-3 font-medium text-left">缺陷数</th>
                    <th className="pb-3 font-medium text-left">缺陷率</th>
                    <th className="pb-3 font-medium text-left">优质率</th>
                    <th className="pb-3 font-medium text-left">趋势</th>
                    <th className="pb-3 font-medium text-left">主要风险</th>
                    <th className="pb-3 font-medium text-left">风险等级</th>
                    <th className="pb-3 font-medium text-left">风险评分</th>
                  </tr>
                </thead>
                <tbody>
                  {result.machineRisks.map(item => (
                    <tr key={item.machine} className="border-b border-slate-700/20 hover:bg-slate-700/20">
                      <td className="py-3 text-slate-300 font-mono">{item.rank}</td>
                      <td className="py-3 text-white font-medium">{item.machine}</td>
                      <td className="py-3 text-slate-300">{item.sampleCount}</td>
                      <td className="py-3 text-slate-300">{item.defectCount}</td>
                      <td className="py-3 text-slate-300">{item.defectRate}%</td>
                      <td className="py-3 text-slate-300">{item.qualityRate}%</td>
                      <td className="py-3">
                        <span className={item.recentDefectTrend === '↑' ? 'text-rose-400' : item.recentDefectTrend === '↓' ? 'text-emerald-400' : 'text-slate-400'}>
                          {item.recentDefectTrend === '↑' ? '↑上升' : item.recentDefectTrend === '↓' ? '↓下降' : '→稳定'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{item.mainRisk}</td>
                      <td className="py-3">{renderRiskBadge(item.riskLevel)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${item.riskScore}%`, background: RISK_COLORS[item.riskLevel] }} />
                          </div>
                          <span className="text-slate-300 font-mono">{item.riskScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 牌号质量风险 + 合作生产点风险 */}
          <div className="grid grid-cols-2 gap-6">
            <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Package className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-white">AI牌号质量预测</h2>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {result.brandRisks.length > 0 ? result.brandRisks.slice(0, 6).map(item => (
                  <div key={item.brand} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.brand}</span>
                      {renderRiskBadge(item.riskLevel)}
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{item.reason}</p>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>样本 {item.sampleCount}</span>
                      <span>缺陷 {item.defectCount}</span>
                      <span>缺陷率 {item.defectRate}%</span>
                      <span>优质率 {item.qualityRate}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-slate-500 py-8">暂无牌号风险数据</div>
                )}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Factory className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-white">合作生产点风险预测</h2>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {result.productionPointRisks.length > 0 ? result.productionPointRisks.map(item => (
                  <div key={item.name} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{item.name}</span>
                      {renderRiskBadge(item.riskLevel)}
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{item.reason}</p>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>样本 {item.sampleCount}</span>
                      <span>缺陷 {item.defectCount}</span>
                      <span>缺陷率 {item.defectRate}%</span>
                      <span>优质率 {item.qualityRate}%</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-slate-500 py-8">暂无生产点风险数据</div>
                )}
              </div>
            </section>
          </div>

          {/* 烟支物测趋势预测 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">烟支物测趋势预测</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">PHYSICAL INDICATOR FORECAST</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {result.physicalPredictions.map((indicator, idx) => (
                <div key={indicator.indicatorId} className="rounded-xl border border-slate-700/30 bg-slate-800/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{indicator.name}</h3>
                      <p className="text-xs text-slate-500">单位：{indicator.unit} · {renderRiskBadge(indicator.riskLevel)}</p>
                    </div>
                    {indicator.warning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={indicator.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 4" stroke="#33415540" vertical={false} />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                          contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 8 }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <defs>
                          <linearGradient id={`physicalArea-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <ReferenceLine y={indicator.center} stroke="#06b6d4" strokeDasharray="3 3" label={{ value: '中心值', position: 'right', fill: '#06b6d4', fontSize: 10 }} />
                        <ReferenceLine y={indicator.upper} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '上限', position: 'right', fill: '#f43f5e', fontSize: 10 }} />
                        <ReferenceLine y={indicator.lower} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '下限', position: 'right', fill: '#f43f5e', fontSize: 10 }} />
                        <Area type="monotone" dataKey="value" name="检测值" stroke="#3b82f6" strokeWidth={2} fill={`url(#physicalArea-${idx})`} dot={false} connectNulls />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {indicator.warning && (
                    <p className="mt-2 text-xs text-amber-400">{indicator.warning}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* AI异常组合识别 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
                <Search className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h2 className="text-lg font-bold text-white">AI异常组合识别</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">ABNORMAL COMBINATION DETECTION</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {result.abnormalCombinations.length > 0 ? result.abnormalCombinations.map((item, index) => (
                <div key={index} className="p-4 rounded-xl border" style={{ background: RISK_BG_COLORS[item.riskLevel], borderColor: `${RISK_COLORS[item.riskLevel]}30` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{item.combination}</span>
                    {renderRiskBadge(item.riskLevel)}
                  </div>
                  <p className="text-xs text-slate-300 mb-1">{item.description}</p>
                  <p className="text-xs text-slate-400">{item.reason}</p>
                </div>
              )) : (
                <div className="col-span-2 text-center text-slate-500 py-8">当前未发现显著异常组合风险</div>
              )}
            </div>
          </section>

          {/* AI质量风险预警中心 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">AI质量风险预警</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">RISK ALERT CENTER</span>
            </div>
            <div className="space-y-3">
              {result.alerts.length > 0 ? result.alerts.map(alert => (
                <div key={alert.id} className="p-4 rounded-xl border" style={{ background: RISK_BG_COLORS[alert.level], borderColor: `${RISK_COLORS[alert.level]}30` }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {renderRiskBadge(alert.level)}
                      <span className="text-white font-medium">{alert.object}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{alert.forecastTime}</span>
                  </div>
                  <p className="text-sm text-slate-200 mb-1">{alert.reason}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> {alert.measure}
                  </p>
                </div>
              )) : (
                <div className="text-center text-slate-500 py-8">当前暂无明显质量风险预警</div>
              )}
            </div>
          </section>

          {/* AI风险原因分析 + 提前干预建议 */}
          <div className="grid grid-cols-2 gap-6">
            <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-white">AI风险原因分析</h2>
              </div>
              <div className="space-y-3">
                {result.reasons.map((reason, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                    <p className="text-sm text-slate-300">{reason}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">AI提前干预建议</h2>
              </div>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                    <p className="text-sm text-slate-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export function AIPredictionAnalysis() {
  return (
    <ErrorBoundary>
      <AIPredictionAnalysisContent />
    </ErrorBoundary>
  );
}
