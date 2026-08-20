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
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  Search,
  List,
  Eye,
  X,
  Activity,
  Zap,
  Lightbulb,
} from 'lucide-react';
import type { FilterConditions } from '../../utils/analysisUtils';
import {
  DefectType,
  DEFECT_TYPE_LABELS,
  formatLocalDate,
  loadProcessQualityData,
  filterByConditions,
  calculateAnalysisOverview,
  calculateMachineAnalysisData,
  calculateDefectStructure,
  calculateTopDefects,
  calculateDefectTrend,
  generateAIQualityAnalysis,
} from '../../utils/analysisUtils';
import { SCORE_CATEGORY_LABELS } from '../../lib/qualityEngine';

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

// 科技感配色
const TECH_COLORS = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  chartPalette: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'],
  cardBg: 'rgba(15, 23, 42, 0.6)',
  gridLine: 'rgba(71, 85, 105, 0.2)',
};

interface QualityAnalysisBaseProps {
  defectType: DefectType;
}

function getTodayRange(): { from: string; to: string } {
  const today = formatLocalDate(new Date());
  return { from: today, to: today };
}

function getLastNDays(n: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - n + 1);
  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: formatLocalDate(firstDay),
    to: formatLocalDate(now),
  };
}

export function QualityAnalysisBase({ defectType }: QualityAnalysisBaseProps) {
  const typeLabel = DEFECT_TYPE_LABELS[defectType];

  const [filters, setFilters] = useState<FilterConditions>(() => {
    const range = getTodayRange();
    return {
      dateFrom: range.from,
      dateTo: range.to,
      productionPoint: '',
      brand: '',
      machine: '',
      shiftGroup: '',
      shift: '',
    };
  });

  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [showDetailQuery, setShowDetailQuery] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      setAllRecords(await loadProcessQualityData());
    };
    load();
    window.addEventListener('quality-data-updated', load);
    return () => window.removeEventListener('quality-data-updated', load);
  }, []);

  const filteredRecords = useMemo(() => {
    return filterByConditions(allRecords as any[], filters);
  }, [allRecords, filters]);

  const overview = useMemo(() => calculateAnalysisOverview(filteredRecords as any[], defectType), [filteredRecords, defectType]);
  const machineData = useMemo(() => calculateMachineAnalysisData(filteredRecords as any[], defectType), [filteredRecords, defectType]);
  const structure = useMemo(() => calculateDefectStructure(filteredRecords as any[], defectType), [filteredRecords, defectType]);
  const top5 = useMemo(() => calculateTopDefects(filteredRecords as any[], defectType, 5), [filteredRecords, defectType]);
  const trend = useMemo(() => calculateDefectTrend(filteredRecords as any[], defectType), [filteredRecords, defectType]);
  const aiAnalysis = useMemo(
    () => generateAIQualityAnalysis(overview, machineData, structure, top5, trend, defectType, filters),
    [overview, machineData, structure, top5, trend, defectType, filters]
  );

  const setRange = (range: { from: string; to: string }) => {
    setFilters(prev => ({ ...prev, dateFrom: range.from, dateTo: range.to }));
  };

  const hasData = filteredRecords.length > 0;

  const metricCard = (label: string, value: string | number, unit = '', color: string, icon: React.ReactNode, sub?: string) => (
    <div
      className="relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: TECH_COLORS.cardBg, borderColor: `${color}30`, boxShadow: `0 0 20px ${color}10` }}
    >
      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-10" style={{ background: color }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-400">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{value}</span>
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

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">{typeLabel}质量分析</h1>
        <p className="text-body text-muted-foreground mt-1">质量分析中心 / {typeLabel}质量分析</p>
      </div>

      {/* 筛选条件 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/25 backdrop-blur-sm p-5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent"></div>
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-slate-700/30 border border-slate-600/20">
            <Filter className="w-4 h-4 text-slate-300" />
          </div>
          <h2 className="text-base font-bold text-white">筛选条件</h2>
          <span className="text-xs text-slate-500 font-mono ml-auto">FILTERS</span>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">开始日期</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">结束日期</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
            <select value={filters.productionPoint} onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })} className="form-select">
              <option value="">全部</option>
              {PRODUCTION_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">牌号</label>
            <select value={filters.brand} onChange={(e) => setFilters({ ...filters, brand: e.target.value })} className="form-select">
              <option value="">全部</option>
              {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">机台</label>
            <select value={filters.machine} onChange={(e) => setFilters({ ...filters, machine: e.target.value })} className="form-select">
              <option value="">全部</option>
              {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班别</label>
            <select value={filters.shiftGroup} onChange={(e) => setFilters({ ...filters, shiftGroup: e.target.value })} className="form-select">
              <option value="">全部</option>
              {SHIFT_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班次</label>
            <select value={filters.shift} onChange={(e) => setFilters({ ...filters, shift: e.target.value })} className="form-select">
              <option value="">全部</option>
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setRange(getTodayRange())} className="filter-quick-btn">今日</button>
          <button onClick={() => setRange(getLastNDays(7))} className="filter-quick-btn">近7天</button>
          <button onClick={() => setRange(getLastNDays(30))} className="filter-quick-btn">近30天</button>
          <button onClick={() => setRange(getCurrentMonthRange())} className="filter-quick-btn active">本月</button>
        </div>
      </div>

      {!hasData ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-800/20 backdrop-blur-sm p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/[0.02] rounded-full blur-3xl"></div>
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
              <FileText className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-bold text-slate-400 mb-2">暂无数据</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              当前筛选条件下暂无{typeLabel}缺陷数据，请调整筛选条件或先在过程质量管控中录入数据
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* 核心指标 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">核心指标</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">KEY METRICS</span>
            </div>
            <div className="grid grid-cols-4 gap-6">
              {metricCard('抽检样本数', overview.totalSamples, '', TECH_COLORS.primary, <Package className="w-5 h-5" />, 'SAMPLES')}
              {metricCard('总缺陷数', overview.totalDefects, '', overview.totalDefects > 0 ? TECH_COLORS.rose : TECH_COLORS.emerald, <AlertTriangle className="w-5 h-5" />, 'DEFECTS')}
              {metricCard('优质率', overview.qualityRate, '%', overview.qualityRate >= 95 ? TECH_COLORS.emerald : overview.qualityRate >= 85 ? TECH_COLORS.amber : TECH_COLORS.rose, <CheckCircle2 className="w-5 h-5" />, 'EXCELLENT RATE')}
              {metricCard('缺陷率', overview.defectRate, '%', overview.defectRate > 5 ? TECH_COLORS.rose : TECH_COLORS.cyan, <Target className="w-5 h-5" />, 'DEFECT RATE')}
            </div>
          </section>

          {/* 缺陷TOP5 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <Target className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">缺陷 TOP5</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">TOP 5 DEFECTS</span>
            </div>
            {top5.length > 0 ? (
              <div className="h-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top5.slice().reverse()} layout="vertical" margin={{ top: 10, right: 60, left: 80, bottom: 10 }}>
                    <defs>
                      <linearGradient id="top5Gradient" x1="0" y1="0" x2="1" y2="0">
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
                      fontSize={13}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 8 }}
                      itemStyle={{ color: '#e2e8f0' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value: number, _name: string, props: any) => [`${value} 次（${props.payload.percentage}%）`, props.payload.name]}
                    />
                    <Bar dataKey="count" name="缺陷数量" fill="url(#top5Gradient)" radius={[0, 6, 6, 0]} barSize={22}>
                      {top5.slice().reverse().map((_, index) => (
                        <Cell key={index} fill={`url(#top5Gradient)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-2">
                  {top5.map((d, i) => (
                    <div key={i} className="text-right text-xs">
                      <p className="text-slate-300 font-medium">{d.name}</p>
                      <p className="text-slate-500 font-mono">{d.count} 次 · {d.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                <div className="text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>暂无缺陷排名数据</p>
                </div>
              </div>
            )}
          </section>

          {/* 缺陷趋势 + 缺陷结构 */}
          <section className="grid grid-cols-2 gap-6">
            {/* 缺陷趋势 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">缺陷趋势分析</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">TREND</span>
              </div>
              {trend.length > 1 ? (
                <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 4" stroke="#33415540" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ stroke: 'rgba(255, 255, 255, 0.08)', strokeWidth: 1 }}
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 8 }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                      <Area type="monotone" dataKey="defectCount" name="缺陷数量" stroke="#3b82f6" strokeWidth={2} fill="url(#trendArea)" />
                      <Line type="monotone" dataKey="defectRate" name="缺陷率(%)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="qualityRate" name="优质率(%)" stroke="#10b981" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>暂无足够趋势数据（至少2天）</p>
                  </div>
                </div>
              )}
            </div>

            {/* 缺陷结构分布 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <PieChartIcon className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-lg font-bold text-white">缺陷结构分布</h2>
                <span className="ml-auto text-xs text-slate-500 font-mono">STRUCTURE</span>
              </div>
              {structure.length > 0 ? (
                <div className="h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {structure.map((_, i) => (
                          <filter key={`glow-${i}`} id={`structGlow${i}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2.5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        ))}
                      </defs>
                      <Pie
                        data={structure}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {structure.map((_, i) => (
                          <Cell key={i} fill={TECH_COLORS.chartPalette[i % TECH_COLORS.chartPalette.length]} style={{ filter: `url(#structGlow${i})` }} />
                        ))}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize={18} fontWeight={700}>
                        {structure.reduce((s, c) => s + c.count, 0)}
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
                    {structure.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: TECH_COLORS.chartPalette[i % TECH_COLORS.chartPalette.length] }} />
                        <span className="text-slate-400">{item.name}</span>
                        <span className="text-slate-500 font-mono">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                  <div className="text-center">
                    <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>暂无缺陷结构数据</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 机台质量对比 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>
            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white">机台质量对比</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">MACHINE COMPARISON</span>
            </div>
            {machineData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-xs text-slate-500 font-mono uppercase tracking-wider px-4">
                  <span>机台</span>
                  <span>抽检样本数</span>
                  <span>缺陷数量</span>
                  <span>缺陷率</span>
                </div>
                <div className="space-y-2">
                  {machineData.map((m, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 items-center px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-slate-600/30 transition-colors">
                      <span className="text-cyan-300 font-mono font-medium">{m.machine}</span>
                      <span className="text-slate-200">{m.sampleCount}</span>
                      <span className={m.defectCount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>{m.defectCount}</span>
                      <span className="text-slate-300 font-mono">{m.defectRate}%</span>
                    </div>
                  ))}
                </div>
                <div className="h-64 relative mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={machineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="machineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#33415540" vertical={false} />
                      <XAxis dataKey="machine" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 8 }}
                        itemStyle={{ color: '#e2e8f0' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Bar dataKey="defectCount" name="缺陷数量" fill="url(#machineGradient)" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>暂无机台质量数据</p>
                </div>
              </div>
            )}
          </section>

          {/* AI质量分析 */}
          <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-blue-900/20 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl"></div>
            <div className="relative flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
                <span className="absolute inset-0 rounded-lg bg-blue-400/20 animate-ping opacity-20"></span>
              </div>
              <h2 className="text-lg font-bold text-white">AI 质量分析</h2>
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 font-mono tracking-wider">
                AI ANALYSIS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* 异常识别 */}
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-rose-500/15 hover:border-rose-500/25 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">异常识别</h3>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.anomaly.map((text, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-rose-400 shrink-0"></span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 原因分析 */}
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-amber-500/15 hover:border-amber-500/25 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">原因分析</h3>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.cause.length > 0 ? aiAnalysis.cause.map((text, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0"></span>
                      <span>{text}</span>
                    </li>
                  )) : (
                    <li className="text-xs text-slate-500">当前数据未识别出明确根因，建议持续观察。</li>
                  )}
                </ul>
              </div>

              {/* 改进建议 */}
              <div className="relative p-4 rounded-xl bg-slate-900/40 border border-emerald-500/15 hover:border-emerald-500/25 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">改进建议</h3>
                </div>
                <ul className="space-y-2">
                  {aiAnalysis.suggestion.map((text, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}

      {/* 详情弹窗 */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setSelectedRecord(null)}>
          <div
            className="relative bg-slate-900/95 border border-slate-700/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(59,130,246,0.1)] mx-4 animate-in zoom-in-95 fade-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/40 p-6 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  质量记录详情
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-mono">ID: {selectedRecord.id}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors group">
                <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20"><FileText className="w-4 h-4 text-blue-400" /></div>
                  基础信息
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '检验日期', value: selectedRecord.inspectionDate },
                    { label: '合作生产点', value: selectedRecord.productionPoint },
                    { label: '牌号', value: selectedRecord.brand },
                    { label: '机台', value: selectedRecord.machine },
                    { label: '班别', value: `${selectedRecord.shiftGroup || ''} ${selectedRecord.shift || ''}班`.trim() },
                    { label: '记录人', value: selectedRecord.inspector },
                    { label: '烟丝批次', value: selectedRecord.batchNumber || '-' },
                    { label: '取样时间', value: selectedRecord.samplingTime || '-' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-3.5 border border-slate-700/25">
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-slate-200">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <div className="p-1 rounded bg-red-500/10 border border-red-500/20"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                  {typeLabel}缺陷详情
                </h4>
                {(() => {
                  const defectKey = `${defectType}Defects` as keyof typeof selectedRecord;
                  const defects = selectedRecord[defectKey] as any[] || [];
                  if (defects.length === 0) {
                    return (
                      <div className="text-center py-10 bg-emerald-500/[0.03] rounded-xl border border-dashed border-emerald-500/20">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-semibold">本次检验无{typeLabel}缺陷</p>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto rounded-xl border border-slate-700/30 bg-slate-900/30">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-800/60 border-b border-slate-700/40">
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">缺陷部位</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">缺陷名称</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">缺陷类别</th>
                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">缺陷数量</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/20">
                          {defects.map((defect: any, idx: number) => (
                            <tr key={idx} className="hover:bg-red-500/[0.03] transition-colors">
                              <td className="px-4 py-3 text-slate-300">{defect.location}</td>
                              <td className="px-4 py-3 text-white font-medium">{defect.defectName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono ${
                                  defect.category === 'A' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                  defect.category === 'B' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
                                  defect.category === 'C' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                                  'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                }`}>
                                  {defect.category}类
                                </span>
                              </td>
                              <td className={`px-4 py-3 font-bold tabular-nums ${defect.quantity > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{defect.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QualityAnalysisBase;
