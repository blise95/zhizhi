import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  BrainCircuit,
  Activity,
  Factory,
  Cog,
  Package,
  Zap,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  Shield,
} from 'lucide-react';
import {
  type PeriodType,
  type ComprehensiveFilters,
  type PeriodRange,
  getDefaultComprehensiveFilters,
  getPeriodRange,
  getPreviousPeriodRange,
  getAvailablePeriodOptions,
  loadProcessQualityData,
  loadPhysicalTestRecords,
  filterRecordsByConditions,
  filterPhysicalRecordsByConditions,
  calculateCoreMetrics,
  calculateComprehensiveTrend,
  calculateFieldComparison,
  calculateProductionPointComparison,
  calculateMachineComparison,
  calculateGlobalTopDefects,
  calculateContribution,
  calculatePeriodComparison,
  calculatePhysicalIndicatorAnalysis,
  generateAIComprehensiveAnalysis,
} from '../../utils/comprehensiveAnalysisUtils';
import {
  formatStandardRange,
  getBrandStandards,
  resolveBrandName,
  sameBrand,
  STANDARD_INDICATORS,
} from '../../services/cigarettePhysicalStandardService';

// 筛选选项
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
  '摩登（超细白）',
  '摩登（97超细白）',
];
const MACHINES = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];
const SHIFT_GROUPS = ['早班', '夜班'];
const SHIFTS = ['1', '2'];

const PERIOD_OPTIONS: { key: PeriodType; label: string }[] = [
  { key: 'month', label: '月度' },
  { key: 'quarter', label: '季度' },
  { key: 'halfYear', label: '半年度' },
  { key: 'year', label: '年度' },
];

// 科技感配色
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

const FIELD_COLORS: Record<string, string> = {
  箱装: '#3b82f6',
  条装: '#06b6d4',
  盒装: '#8b5cf6',
  烟支: '#f43f5e',
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

export function ComprehensiveQualityAnalysis() {
  const [filters, setFilters] = useState<ComprehensiveFilters>(getDefaultComprehensiveFilters);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [allPhysicalRecords, setAllPhysicalRecords] = useState<any[]>([]);
  const [physicalBrand, setPhysicalBrand] = useState('');

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

  const periodRange: PeriodRange = useMemo(() => {
    const subValue =
      filters.periodType === 'month'
        ? filters.month
        : filters.periodType === 'quarter'
        ? filters.quarter
        : filters.periodType === 'halfYear'
        ? filters.half
        : undefined;
    return getPeriodRange(filters.periodType, filters.year, subValue);
  }, [filters.periodType, filters.year, filters.month, filters.quarter, filters.half]);

  const previousRange: PeriodRange = useMemo(() => getPreviousPeriodRange(periodRange), [periodRange]);

  const filteredRecords = useMemo(() => {
    const dateFiltered = allRecords.filter(
      r => r.inspectionDate >= periodRange.from && r.inspectionDate <= periodRange.to
    );
    return filterRecordsByConditions(dateFiltered, filters);
  }, [allRecords, periodRange, filters]);

  const previousRecords = useMemo(() => {
    const dateFiltered = allRecords.filter(
      r => r.inspectionDate >= previousRange.from && r.inspectionDate <= previousRange.to
    );
    return filterRecordsByConditions(dateFiltered, filters);
  }, [allRecords, previousRange, filters]);

  useEffect(() => {
    if (filters.brand) {
      setPhysicalBrand(filters.brand);
    }
  }, [filters.brand]);

  const physicalBrandsInPeriod = useMemo(() => {
    const names = new Set<string>();
    allPhysicalRecords.forEach((r: { date?: string; brand?: string }) => {
      if (r.date && r.date >= periodRange.from && r.date <= periodRange.to && r.brand) {
        names.add(resolveBrandName(r.brand) || r.brand);
      }
    });
    return names;
  }, [allPhysicalRecords, periodRange]);

  const effectivePhysicalBrand = physicalBrand || filters.brand || '';

  const physicalRecordsForBrand = useMemo(() => {
    const dateFiltered = allPhysicalRecords.filter(
      (r: { date?: string }) => r.date && r.date >= periodRange.from && r.date <= periodRange.to
    );
    const otherFiltered = filterPhysicalRecordsByConditions(dateFiltered, {
      productionPoint: filters.productionPoint,
      brand: '',
      machine: filters.machine,
      shiftGroup: filters.shiftGroup,
      shift: filters.shift,
    });
    if (!effectivePhysicalBrand) return [];
    return otherFiltered.filter(r => sameBrand(r.brand, effectivePhysicalBrand));
  }, [allPhysicalRecords, periodRange, filters.productionPoint, filters.machine, filters.shiftGroup, filters.shift, effectivePhysicalBrand]);

  const physicalDailyRows = useMemo(() => {
    return [...physicalRecordsForBrand]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((r) => ({
        id: String(r.id),
        date: r.date,
        machine: r.machine || '-',
        length: r.length?.x ?? '-',
        circumference: r.circumference?.x ?? '-',
        drawResistance: r.drawResistance?.x ?? '-',
        weight: r.weight?.x ?? '-',
        ventilation: r.ventilation?.x ?? '-',
      }));
  }, [physicalRecordsForBrand]);

  const physicalBrandStd = effectivePhysicalBrand ? getBrandStandards(effectivePhysicalBrand) : null;

  const metrics = useMemo(() => calculateCoreMetrics(filteredRecords as any[]), [filteredRecords]);
  const trend = useMemo(() => calculateComprehensiveTrend(filteredRecords as any[], periodRange), [filteredRecords, periodRange]);
  const fieldComparison = useMemo(() => calculateFieldComparison(filteredRecords as any[]), [filteredRecords]);
  const productionPointData = useMemo(() => calculateProductionPointComparison(filteredRecords as any[]), [filteredRecords]);
  const machineData = useMemo(() => calculateMachineComparison(filteredRecords as any[]), [filteredRecords]);
  const top10 = useMemo(() => calculateGlobalTopDefects(filteredRecords as any[], 10), [filteredRecords]);
  const contribution = useMemo(() => calculateContribution(filteredRecords as any[]), [filteredRecords]);
  const periodComparison = useMemo(
    () => calculatePeriodComparison(filteredRecords as any[], previousRecords as any[]),
    [filteredRecords, previousRecords]
  );
  const physicalAnalysis = useMemo(
    () => calculatePhysicalIndicatorAnalysis(physicalRecordsForBrand as any[], periodRange, effectivePhysicalBrand),
    [physicalRecordsForBrand, periodRange, effectivePhysicalBrand]
  );
  const aiAnalysis = useMemo(
    () =>
      generateAIComprehensiveAnalysis(
        metrics,
        trend,
        fieldComparison,
        productionPointData,
        machineData,
        top10,
        contribution,
        periodComparison,
        physicalAnalysis
      ),
    [metrics, trend, fieldComparison, productionPointData, machineData, top10, contribution, periodComparison, physicalAnalysis]
  );

  const hasProcessData = filteredRecords.length > 0;
  const hasPhysicalInPeriod = physicalBrandsInPeriod.size > 0;
  const hasData = hasProcessData || hasPhysicalInPeriod;

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

  const renderTrendIcon = (trend: 'up' | 'down' | 'stable', metric: string) => {
    const isPositive =
      (metric === 'qualityRate' && trend === 'up') ||
      (metric === 'defectRate' && trend === 'down') ||
      (metric === 'totalSamples' && trend === 'up') ||
      (metric === 'totalDefects' && trend === 'down');
    const color = isPositive ? '#10b981' : trend === 'stable' ? '#64748b' : '#f43f5e';
    if (trend === 'up') return <ArrowUp className="w-4 h-4" style={{ color }} />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4" style={{ color }} />;
    return <Minus className="w-4 h-4" style={{ color }} />;
  };

  const getSubValue = () => {
    switch (filters.periodType) {
      case 'month':
        return filters.month;
      case 'quarter':
        return filters.quarter;
      case 'halfYear':
        return filters.half;
      default:
        return undefined;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">综合质量汇总分析</h1>
        <p className="text-body text-muted-foreground mt-1">质量分析中心 / 综合质量汇总分析</p>
      </div>

      {/* 周期切换 + 筛选条件 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/25 backdrop-blur-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent"></div>

        {/* 周期切换 */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-slate-700/30 border border-slate-600/20">
            <Calendar className="w-4 h-4 text-slate-300" />
          </div>
          <h2 className="text-base font-bold text-white">统计周期</h2>
          <span className="text-xs text-slate-500 font-mono ml-auto">PERIOD</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilters(prev => ({ ...prev, periodType: opt.key }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                filters.periodType === opt.key
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-slate-800/40 text-slate-300 border-slate-600/30 hover:bg-blue-500/10 hover:text-blue-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-400">当前：</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/30 text-sm text-white font-mono">
              {periodRange.label}
            </span>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-slate-700/30 border border-slate-600/20">
            <Filter className="w-4 h-4 text-slate-300" />
          </div>
          <h2 className="text-base font-bold text-white">筛选条件</h2>
          <span className="text-xs text-slate-500 font-mono ml-auto">FILTERS</span>
        </div>

        <div className="grid grid-cols-8 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {filters.periodType === 'year' ? '年份' : filters.periodType === 'month' ? '月份' : filters.periodType === 'quarter' ? '季度' : '半年度'}
            </label>
            <select
              value={getSubValue()}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (filters.periodType === 'month') setFilters(prev => ({ ...prev, month: value }));
                else if (filters.periodType === 'quarter') setFilters(prev => ({ ...prev, quarter: value }));
                else if (filters.periodType === 'halfYear') setFilters(prev => ({ ...prev, half: value as 1 | 2 }));
              }}
              className="input-field"
            >
              {getAvailablePeriodOptions(filters.periodType, filters.year).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {filters.periodType !== 'year' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">年份</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: Number(e.target.value) }))}
                className="input-field"
              >
                {getAvailablePeriodOptions('year', filters.year).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
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
              onClick={() => {
                setFilters(getDefaultComprehensiveFilters());
                setPhysicalBrand('');
              }}
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/[0.02] rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
              <BarChart3 className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-bold text-slate-400 mb-2">暂无数据</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              当前统计周期与筛选条件下暂无质量数据，请调整条件或先在过程质量管控中录入数据
            </p>
          </div>
        </div>
      ) : (
        <>
          {hasProcessData && (
          <>
          {/* 核心指标 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">核心质量指标</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">KEY METRICS</span>
            </div>
            <div className="grid grid-cols-6 gap-6">
              {metricCard('抽检样本数', metrics.totalSamples, '', TECH_COLORS.primary, <Package className="w-5 h-5" />, 'SAMPLES')}
              {metricCard('总缺陷数', metrics.totalDefects, '', metrics.totalDefects > 0 ? TECH_COLORS.rose : TECH_COLORS.emerald, <AlertTriangle className="w-5 h-5" />, 'DEFECTS')}
              {metricCard('优质率', metrics.qualityRate, '%', metrics.qualityRate >= 95 ? TECH_COLORS.emerald : metrics.qualityRate >= 85 ? TECH_COLORS.amber : TECH_COLORS.rose, <CheckCircle2 className="w-5 h-5" />, 'EXCELLENT RATE')}
              {metricCard('缺陷率', metrics.defectRate, '%', metrics.defectRate > 5 ? TECH_COLORS.rose : TECH_COLORS.cyan, <Target className="w-5 h-5" />, 'DEFECT RATE')}
              {metricCard('异常次数', metrics.abnormalCount, '', metrics.abnormalCount > 0 ? TECH_COLORS.rose : TECH_COLORS.emerald, <Shield className="w-5 h-5" />, 'ABNORMAL')}
              {metricCard('质量健康指数', metrics.healthIndex, '', metrics.healthIndex >= 85 ? TECH_COLORS.emerald : metrics.healthIndex >= 70 ? TECH_COLORS.amber : TECH_COLORS.rose, <Activity className="w-5 h-5" />, 'HEALTH INDEX')}
            </div>
          </section>

          {/* 综合质量趋势 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">综合质量趋势</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">QUALITY TREND</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="qualityTrendArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="defectTrendArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
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
                  <Area yAxisId="left" type="monotone" dataKey="qualityRate" name="优质率(%)" stroke="#10b981" strokeWidth={2} fill="url(#qualityTrendArea)" />
                  <Area yAxisId="right" type="monotone" dataKey="defectRate" name="缺陷率(%)" stroke="#f43f5e" strokeWidth={2} fill="url(#defectTrendArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 四大质量领域综合对比 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white">四大质量领域综合对比</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">FIELD COMPARISON</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fieldComparison} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415540" vertical={false} />
                  <XAxis dataKey="fieldLabel" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 8 }}
                    itemStyle={{ color: '#e2e8f0' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="defectCount" name="缺陷数量" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar yAxisId="right" dataKey="qualityRate" name="优质率(%)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {fieldComparison.map(item => (
                <div key={item.field} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: FIELD_COLORS[item.field] }} />
                    <span className="text-sm font-medium text-slate-300">{item.fieldLabel}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-500">样本：{item.sampleCount}</span>
                    <span className="text-slate-500">缺陷：{item.defectCount}</span>
                    <span className="text-slate-500">缺陷率：{item.defectRate}%</span>
                    <span className="text-slate-500">优质率：{item.qualityRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 合作生产点 + 机台对比 */}
          <section className="grid grid-cols-2 gap-6">
            {/* 合作生产点 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Factory className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-white">合作生产点质量对比</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">PRODUCTION POINT</span>
              </div>
              <div className="space-y-3">
                {productionPointData.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.qualityRate >= 90 ? 'bg-emerald-500/15 text-emerald-400' :
                        item.qualityRate >= 80 ? 'bg-blue-500/15 text-blue-400' :
                        'bg-rose-500/15 text-rose-400'
                      }`}>
                        优质率 {item.qualityRate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                      <span>样本：{item.sampleCount}</span>
                      <span>缺陷：{item.defectCount}</span>
                      <span>缺陷率：{item.defectRate}%</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(item.qualityRate, 100)}%`,
                          background: item.qualityRate >= 90 ? '#10b981' : item.qualityRate >= 80 ? '#3b82f6' : '#f43f5e',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {productionPointData.length === 0 && (
                  <div className="text-center py-8 text-slate-500">暂无合作生产点数据</div>
                )}
              </div>
            </div>

            {/* 机台 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Cog className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-white">机台综合质量对比</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">MACHINE</span>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="machineQualityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#33415540" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 8 }}
                      itemStyle={{ color: '#e2e8f0' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value: number, name: string, props: any) => {
                        if (name === '优质率') return [`${value}%`, name];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="qualityRate" name="优质率" fill="url(#machineQualityGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {machineData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg hover:bg-slate-700/20">
                    <span className="text-slate-300 font-mono">{item.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400">样本 {item.sampleCount}</span>
                      <span className="text-slate-400">缺陷 {item.defectCount}</span>
                      <span className="text-slate-400">缺陷率 {item.defectRate}%</span>
                      <span className={`font-medium ${item.qualityRate >= 90 ? 'text-emerald-400' : item.qualityRate >= 80 ? 'text-blue-400' : 'text-rose-400'}`}>
                        优质率 {item.qualityRate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 全局TOP10 + 贡献分析 */}
          <section className="grid grid-cols-2 gap-6">
            {/* 全局TOP10 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <Target className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-lg font-bold text-white">全局缺陷 TOP10</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">TOP 10 DEFECTS</span>
              </div>
              {top10.length > 0 ? (
                <div className="h-80 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={top10.slice().reverse()} layout="vertical" margin={{ top: 10, right: 60, left: 100, bottom: 10 }}>
                      <defs>
                        <linearGradient id="top10Gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#fb7185" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#33415540" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                        tickFormatter={(value, index) => `${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 8 }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number, _name: string, props: any) => [
                          `${value} 次（${props.payload.percentage}%）`,
                          `${props.payload.field} · ${props.payload.location}`,
                        ]}
                      />
                      <Bar dataKey="count" name="缺陷数量" fill="url(#top10Gradient)" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">暂无缺陷数据</div>
              )}
            </div>

            {/* 质量问题贡献分析 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <PieChartIcon className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-white">质量问题贡献分析</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">CONTRIBUTION</span>
              </div>
              {contribution.length > 0 ? (
                <div className="h-80 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {contribution.map((item, i) => (
                          <Cell key={i} fill={item.color} />
                        ))}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize={18} fontWeight={700}>
                        {contribution.reduce((s, c) => s + c.value, 0)}
                      </text>
                      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize={10}>
                        TOTAL
                      </text>
                      <Tooltip
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 8 }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number, _name: string, props: any) => [`${value} 次（${props.payload.percentage}%）`, props.payload.name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-2 left-0 right-0 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                    {contribution.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-slate-500 font-mono">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-500">暂无贡献数据</div>
              )}
            </div>
          </section>

          {/* 周期对比分析 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">周期对比分析</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">{periodRange.label} vs {previousRange.label}</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {periodComparison.map((item, i) => {
                const isPositive =
                  (item.metric === 'qualityRate' && item.trend === 'up') ||
                  (item.metric === 'defectRate' && item.trend === 'down') ||
                  (item.metric === 'totalSamples' && item.trend === 'up') ||
                  (item.metric === 'totalDefects' && item.trend === 'down');
                const color = isPositive ? '#10b981' : item.trend === 'stable' ? '#64748b' : '#f43f5e';
                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/20">
                    <p className="text-xs text-slate-400 mb-2">{item.label}</p>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-white">{item.current}</span>
                      <span className="text-xs text-slate-500">{item.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1" style={{ color }}>
                        {renderTrendIcon(item.trend, item.metric)}
                        <span>{item.change > 0 ? '+' : ''}{item.change}{item.unit}</span>
                      </div>
                      <span className="text-slate-500">({item.changePct > 0 ? '+' : ''}{item.changePct}%)</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                      上期：{item.previous}{item.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          </>
          )}

          {/* 烟支物测指标分析：必须按牌号看，各牌号标准不同 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white">烟支物测指标分析</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">PHYSICAL TEST · BY BRAND</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              各牌号物测标准不同，请先选择牌号。图表只展示该牌号在统计周期内实际录入过的检测值，空白日期不补标准值。
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {BRANDS.map((brand) => {
                const selected = effectivePhysicalBrand === brand;
                const hasRecords = physicalBrandsInPeriod.has(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setPhysicalBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                        : hasRecords
                        ? 'bg-slate-800/60 text-slate-200 border-slate-600/40 hover:border-cyan-500/40'
                        : 'bg-slate-900/40 text-slate-500 border-slate-700/30 hover:border-slate-500/40'
                    }`}
                  >
                    {brand}
                    {hasRecords ? <span className="ml-1 text-[10px] text-cyan-400/80">有数据</span> : null}
                  </button>
                );
              })}
            </div>
            {effectivePhysicalBrand ? (
              <>
                <div className="mb-5 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs text-slate-300">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>当前牌号：<span className="text-cyan-300 font-medium">{effectivePhysicalBrand}</span></span>
                    <span>本期录入 {physicalDailyRows.length} 条</span>
                    {physicalBrandStd && STANDARD_INDICATORS.map((ind) => (
                      <span key={ind.key} className="text-slate-400">
                        {ind.name} {formatStandardRange(physicalBrandStd.indicators[ind.key] || null)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {physicalAnalysis.map(indicator => {
                    const hasIndicatorData = indicator.data.some(d => d.x != null);
                    const lowers = indicator.data.map(d => d.lower).filter((v) => typeof v === 'number');
                    const uppers = indicator.data.map(d => d.upper).filter((v) => typeof v === 'number');
                    const actuals = indicator.data.map(d => d.x).filter((v): v is number => v != null);
                    const yMin = Math.min(...lowers, ...actuals);
                    const yMax = Math.max(...uppers, ...actuals);
                    const pad = Number.isFinite(yMin) && Number.isFinite(yMax) ? Math.max((yMax - yMin) * 0.08, 0.01) : 0;
                    return (
                      <div key={indicator.indicatorId} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/20">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-white">{indicator.name}</h3>
                          <span className="text-xs text-slate-500 font-mono">{indicator.unit}</span>
                        </div>
                        <div className="h-56">
                          {hasIndicatorData ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={indicator.data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#33415540" />
                                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis
                                  stroke="#64748b"
                                  fontSize={11}
                                  tickLine={false}
                                  axisLine={false}
                                  domain={Number.isFinite(yMin) && Number.isFinite(yMax) ? [yMin - pad, yMax + pad] : ['auto', 'auto']}
                                />
                                <Tooltip
                                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                                  contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 8 }}
                                  itemStyle={{ color: '#e2e8f0' }}
                                  labelStyle={{ color: '#94a3b8' }}
                                  formatter={(value: number | null, name: string) => [
                                    value == null ? '未录入' : value,
                                    name,
                                  ]}
                                />
                                <Legend wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                                <ReferenceLine y={indicator.data[0]?.center} stroke="#10b981" strokeDasharray="5 5" label={{ value: '中心值', fill: '#10b981', fontSize: 10 }} />
                                <ReferenceLine y={indicator.data[0]?.upper} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '上限', fill: '#f59e0b', fontSize: 10 }} />
                                <ReferenceLine y={indicator.data[0]?.lower} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '下限', fill: '#f59e0b', fontSize: 10 }} />
                                <Line type="monotone" dataKey="x" name="实际检测值" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              该牌号本期暂无{indicator.name}录入数据
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {physicalDailyRows.length > 0 && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700/40 text-slate-400">
                          <th className="px-3 py-2 text-left font-medium">日期</th>
                          <th className="px-3 py-2 text-left font-medium">机台</th>
                          <th className="px-3 py-2 text-left font-medium">长度 X</th>
                          <th className="px-3 py-2 text-left font-medium">圆周 X</th>
                          <th className="px-3 py-2 text-left font-medium">吸阻 X</th>
                          <th className="px-3 py-2 text-left font-medium">重量 X</th>
                          <th className="px-3 py-2 text-left font-medium">通风度 X</th>
                        </tr>
                      </thead>
                      <tbody>
                        {physicalDailyRows.map((row) => (
                          <tr key={row.id} className="border-b border-slate-800/60 text-slate-200">
                            <td className="px-3 py-2">{row.date}</td>
                            <td className="px-3 py-2">{row.machine}</td>
                            <td className="px-3 py-2">{row.length}</td>
                            <td className="px-3 py-2">{row.circumference}</td>
                            <td className="px-3 py-2">{row.drawResistance}</td>
                            <td className="px-3 py-2">{row.weight}</td>
                            <td className="px-3 py-2">{row.ventilation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                请选择牌号后查看该牌号已录入的物测结果
              </div>
            )}
          </section>

          {hasProcessData && (
          <>
          {/* AI综合质量评价 */}
          <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-blue-900/20 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl"></div>
            <div className="relative flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
                <span className="absolute inset-0 rounded-lg bg-blue-400/20 animate-ping opacity-20"></span>
              </div>
              <h2 className="text-lg font-bold text-white">AI 综合质量评价</h2>
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 font-mono tracking-wider">
                {aiAnalysis.overallLevel}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-6">
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-blue-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">整体评价</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{aiAnalysis.overallEvaluation}</p>
              </div>
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-rose-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">主要问题</h3>
                </div>
                <ul className="space-y-1.5">
                  {aiAnalysis.mainProblems.slice(0, 3).map((text, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-rose-400 shrink-0"></span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">趋势判断</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{aiAnalysis.trendJudgment}</p>
              </div>
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-emerald-500/15">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">改进建议</h3>
                </div>
                <ul className="space-y-1.5">
                  {aiAnalysis.suggestions.slice(0, 3).map((text, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {aiAnalysis.risks.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/[0.05] border border-rose-500/15">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  风险识别
                </h3>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.risks.map((risk, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      {risk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
          </>
          )}
        </>
      )}
    </div>
  );
}

export default ComprehensiveQualityAnalysis;
