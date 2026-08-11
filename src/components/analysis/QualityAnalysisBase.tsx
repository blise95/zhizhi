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
} from 'lucide-react';
import {
  DefectType,
} from '../../utils/analysisUtils';
import type {
  FilterConditions,
  QualityOverview,
  MachineDefectData,
  CategoryStat,
  TopDefect,
  TrendDataPoint,
} from '../../utils/analysisUtils';
import {
  getCurrentMonthRange,
  loadProcessQualityData,
  filterByConditions,
  calculateQualityOverview,
  calculateMachineDefectComparison,
  calculateCategoryStats,
  calculateDefectRanking,
  getTopDefects,
  calculateDefectTrend,
  generateAISummary,
  DEFECT_TYPE_LABELS,
} from '../../utils/analysisUtils';

// 筛选选项（与卷包过程质量数据录入保持一致）
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

// ========== 科技感统一配色体系 ==========
const TECH_COLORS = {
  // 主色系 - 科技蓝渐变
  primary: '#3b82f6',       // 科技蓝
  primaryLight: '#60a5fa',  // 亮蓝
  primaryDark: '#2563eb',   // 深蓝
  primaryGlow: 'rgba(59, 130, 246, 0.35)',

  // 辅助色系
  cyan: '#06b6d4',          // 青蓝
  cyanLight: '#22d3ee',
  cyanGlow: 'rgba(6, 182, 212, 0.3)',

  emerald: '#10b981',       // 翠绿（用于样本数/良好指标）
  emeraldGlow: 'rgba(16, 185, 129, 0.3)',

  amber: '#f59e0b',         // 琥珀（警告）
  rose: '#f43f5e',          // 玫红（缺陷/异常）
  violet: '#8b5cf6',        // 紫罗兰

  // 图表专用色板（按优先级排列，科技感强）
  chartPalette: [
    '#3b82f6', // 科技蓝
    '#06b6d4', // 青蓝
    '#8b5cf6', // 紫罗兰
    '#10b981', // 翠绿
    '#f59e0b', // 琥珀
    '#f43f5e', // 玫红
    '#ec4899', // 粉红
  ],

  // 渐变定义（用于柱状图和面积图）
  barGradientStart: '#60a5fa',
  barGradientEnd: '#2563eb',
  areaGradientStart: 'rgba(59, 130, 246, 0.25)',
  areaGradientEnd: 'rgba(59, 130, 246, 0.02)',
  lineGlow: 'rgba(59, 130, 246, 0.6)',

  // 背景与边框
  cardBg: 'rgba(15, 23, 42, 0.6)',
  gridLine: 'rgba(71, 85, 105, 0.2)',
  axisText: 'rgba(148, 163, 184, 0.8)',

  // Tooltip
  tooltipBg: 'rgba(15, 23, 42, 0.95)',
  tooltipBorder: 'rgba(59, 130, 246, 0.3)',
};

// 兼容旧代码的CHART_COLORS
const CHART_COLORS = TECH_COLORS.chartPalette;

interface QualityAnalysisBaseProps {
  defectType: DefectType;
}

export function QualityAnalysisBase({ defectType }: QualityAnalysisBaseProps) {
  const typeLabel = DEFECT_TYPE_LABELS[defectType];

  // 筛选条件状态
  const [filters, setFilters] = useState<FilterConditions>(() => {
    const range = getCurrentMonthRange();
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

  // 数据状态
  const [allRecords, setAllRecords] = useState<any[]>([]);

  // 详细数据查询状态
  const [showDetailQuery, setShowDetailQuery] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // 加载数据
  useEffect(() => {
    const data = loadProcessQualityData();
    setAllRecords(data);
  }, []);

  // 根据筛选条件过滤数据
  const filteredRecords = useMemo(() => {
    return filterByConditions(allRecords as any[], filters);
  }, [allRecords, filters]);

  // 计算各项统计数据
  const overview = useMemo(() =>
    calculateQualityOverview(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const machineData = useMemo(() =>
    calculateMachineDefectComparison(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const categoryStats = useMemo(() =>
    calculateCategoryStats(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const defectRanking = useMemo(() =>
    calculateDefectRanking(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const topDefects = useMemo(() =>
    getTopDefects(defectRanking, 5),
    [defectRanking]
  );

  const trendData = useMemo(() =>
    calculateDefectTrend(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  // AI质量总结
  const aiSummary = useMemo(() =>
    generateAISummary(overview, machineData, categoryStats, topDefects, trendData, defectType, filters),
    [overview, machineData, categoryStats, topDefects, trendData, defectType, filters]
  );

  // 重置筛选为本月
  const handleResetToMonth = () => {
    const range = getCurrentMonthRange();
    setFilters({
      dateFrom: range.from,
      dateTo: range.to,
      productionPoint: '',
      brand: '',
      machine: '',
      shiftGroup: '',
      shift: '',
    });
  };

  // 判断是否有数据
  const hasData = filteredRecords.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">{typeLabel}质量分析</h1>
        <p className="text-body text-muted-foreground mt-1">质量分析中心 / {typeLabel}质量分析</p>
      </div>

      {/* 统计范围提示 - 科技感 */}
      <div className="relative overflow-hidden rounded-xl border border-slate-700/30 bg-slate-800/20 backdrop-blur-sm p-4 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15">
          <Calendar className="w-4.5 h-4.5 text-blue-400" />
        </div>
        <span className="text-sm text-slate-400">
          当前统计范围：<strong className="text-white font-mono">{filters.dateFrom}</strong> 至 <strong className="text-white font-mono">{filters.dateTo}</strong>
        </span>
        {hasData && (
          <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-mono">
            {filteredRecords.length} records
          </span>
        )}
      </div>

      {/* 筛选条件区域 - 科技感 */}
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
          {/* 开始日期 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">开始日期</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
          </div>

          {/* 结束日期 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">结束日期</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
          </div>

          {/* 合作生产点 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
            <select
              value={filters.productionPoint}
              onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {PRODUCTION_POINTS.map(point => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
          </div>

          {/* 牌号 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">牌号</label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {BRANDS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* 机台 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">机台</label>
            <select
              value={filters.machine}
              onChange={(e) => setFilters({ ...filters, machine: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {MACHINES.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>

          {/* 班别 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班别</label>
            <select
              value={filters.shiftGroup}
              onChange={(e) => setFilters({ ...filters, shiftGroup: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFT_GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {/* 班次 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班次</label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFTS.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button onClick={handleResetToMonth} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-lg transition-all duration-300">
            <Calendar className="w-4 h-4" />
            本月数据
          </button>
        </div>
      </div>

      {!hasData ? (
        /* 无数据提示 - 科技感 */
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
          {/* 第一部分：质量概况 - 科技感升级 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            {/* 顶部科技光线 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">质量概况</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">QUALITY OVERVIEW</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* 抽检样本数 - 科技卡片 */}
              <div className="relative group overflow-hidden rounded-xl bg-slate-900/50 border border-slate-700/30 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400 font-medium">抽检样本数</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/15">
                    <Package className="w-6 h-6 text-blue-400/70" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-white tracking-tight">{overview.totalSamples}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono">SAMPLES INSPECTED</p>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl"></div>
              </div>

              {/* 缺陷数量 */}
              <div className={`relative group overflow-hidden rounded-xl bg-slate-900/50 border ${overview.totalDefects > 0 ? 'border-red-900/30' : 'border-emerald-900/30'} p-6 transition-all duration-300 ${overview.totalDefects > 0 ? 'hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}>
                <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${overview.totalDefects > 0 ? 'via-red-500/30' : 'via-emerald-500/30'} to-transparent`}></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400 font-medium">缺陷数量</span>
                  <div className={`p-2 rounded-lg ${overview.totalDefects > 0 ? 'bg-red-500/10 border-red-500/15' : 'bg-emerald-500/10 border-emerald-500/15'}`}>
                    <AlertTriangle className={`w-6 h-6 ${overview.totalDefects > 0 ? 'text-red-400/70' : 'text-emerald-400/70'}`} />
                  </div>
                </div>
                <p className={`text-4xl font-bold tracking-tight ${overview.totalDefects > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {overview.totalDefects}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono">DEFECTS FOUND · {overview.defectSampleCount} 样本</p>
                <div className={`absolute bottom-0 right-0 w-20 h-20 ${overview.totalDefects > 0 ? 'bg-red-500/5' : 'bg-emerald-500/5'} rounded-full blur-2xl`}></div>
              </div>

              {/* 优质率 */}
              <div className={`relative group overflow-hidden rounded-xl bg-slate-900/50 border ${overview.qualityRate >= 95 ? 'border-emerald-900/30' : overview.qualityRate >= 85 ? 'border-amber-900/30' : 'border-red-900/30'} p-6 transition-all duration-300 ${overview.qualityRate >= 95 ? 'hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]' : overview.qualityRate >= 85 ? 'hover:border-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]'}`}>
                <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${overview.qualityRate >= 95 ? 'via-emerald-500/30' : overview.qualityRate >= 85 ? 'via-amber-500/30' : 'via-red-500/30'} to-transparent`}></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400 font-medium">优质率</span>
                  <div className={`p-2 rounded-lg ${overview.qualityRate >= 95 ? 'bg-emerald-500/10 border-emerald-500/15' : overview.qualityRate >= 85 ? 'bg-amber-500/10 border-amber-500/15' : 'bg-red-500/10 border-red-500/15'}`}>
                    <CheckCircle2 className={`w-6 h-6 ${overview.qualityRate >= 95 ? 'text-emerald-400/70' : overview.qualityRate >= 85 ? 'text-amber-400/70' : 'text-red-400/70'}`} />
                  </div>
                </div>
                <p className={`text-4xl font-bold tracking-tight ${overview.qualityRate >= 95 ? 'text-emerald-400' : overview.qualityRate >= 85 ? 'text-amber-400' : 'text-red-400'}`}>
                  {overview.qualityRate}<span className="text-2xl ml-0.5">%</span>
                </p>
                <p className="text-xs text-slate-500 mt-2 font-mono">
                  {overview.qualityRate >= 95 ? 'EXCELLENT' : overview.qualityRate >= 85 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                </p>
                {/* 优质率环形进度指示 */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(51,65,85,0.3)" strokeWidth="3"/>
                    <circle cx="18" cy="18" r="15.5" fill="none"
                      stroke={overview.qualityRate >= 95 ? '#10b981' : overview.qualityRate >= 85 ? '#f59e0b' : '#f43f5e'}
                      strokeWidth="3"
                      strokeDasharray={`${overview.qualityRate} 100`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* 第二部分：机台缺陷数对比 - 科技感柱状图 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"></div>

            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-lg font-bold text-white">机台缺陷数对比</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">MACHINE DEFECT COMPARISON</span>
            </div>

            {machineData.length > 0 ? (
              <div className="h-80 relative">
                {/* 背景光晕 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute bottom-8 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-8 right-1/4 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl"></div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      {/* 柱状图科技蓝渐变 */}
                      <linearGradient id="barGradientTech" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
                      </linearGradient>
                      {/* 柱状图顶部高光 */}
                      <linearGradient id="barHighlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      {/* 柱状图发光滤镜 */}
                      <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    {/* 科技感网格 */}
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="rgba(71, 85, 105, 0.15)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="machine"
                      stroke="rgba(148, 163, 184, 0.6)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(71, 85, 105, 0.3)' }}
                    />
                    <YAxis
                      stroke="rgba(148, 163, 184, 0.6)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(71, 85, 105, 0.3)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.96)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '10px',
                        color: '#e2e8f0',
                        fontSize: '13px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.1)',
                        backdropFilter: 'blur(10px)',
                        padding: '10px 14px',
                      }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 600 }}
                      cursor={{
                        fill: 'rgba(59, 130, 246, 0.06)',
                        radius: 4,
                      }}
                    />
                    <Bar
                      dataKey="defectCount"
                      name="缺陷数量"
                      fill="url(#barGradientTech)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {machineData.map((entry, index) => (
                        <Cell
                          key={`bar-${index}`}
                          fill={`url(#barGradientTech)`}
                          style={{ filter: entry.defectCount > 0 ? 'url(#barGlow)' : 'none' }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>暂无机台缺陷数据</p>
                </div>
              </div>
            )}
          </section>

          {/* 第三部分：缺陷分析 - 科技感图表 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>

            <div className="flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Target className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-bold text-white">缺陷分析</h2>
              <span className="ml-auto text-xs text-slate-500 font-mono">DEFECT ANALYSIS</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 缺陷类别分布 - 科技感环形图 */}
              <div className="relative">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  缺陷类别分布
                  <span className="text-xs text-slate-500 font-normal ml-auto">CATEGORY DISTRIBUTION</span>
                </h3>
                {categoryStats.length > 0 ? (
                  <div className="h-72 relative">
                    {/* 环形图中心光晕 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-28 h-28 bg-blue-500/5 rounded-full blur-2xl"></div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {/* 各扇区发光效果 */}
                          {categoryStats.map((_, index) => (
                            <filter key={`pie-glow-${index}`} id={`pieGlow${index}`} x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="2.5" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          ))}
                          {/* 内环阴影 */}
                          <radialGradient id="innerShadow" cx="50%" cy="50%" r="50%">
                            <stop offset="70%" stopColor="#0f172a" stopOpacity={0} />
                            <stop offset="100%" stopColor="#0f172a" stopOpacity={0.8} />
                          </radialGradient>
                        </defs>
                        <Pie
                          data={categoryStats}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={88}
                          paddingAngle={2.5}
                          strokeWidth={0}
                          animationDuration={1200}
                          animationEasing="ease-out"
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={TECH_COLORS.chartPalette[index % TECH_COLORS.chartPalette.length]}
                              style={{ filter: `url(#pieGlow${index})` }}
                            />
                          ))}
                        </Pie>
                        {/* 中心文字 */}
                        <text x="50%" y="46%" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">TOTAL</text>
                        <text x="50%" y="56%" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight={700}>
                          {categoryStats.reduce((s, c) => s + c.count, 0)}
                        </text>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.96)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            borderRadius: '10px',
                            color: '#e2e8f0',
                            fontSize: '13px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(139,92,246,0.1)',
                            backdropFilter: 'blur(10px)',
                            padding: '10px 14px',
                          }}
                          formatter={(value: number, name: string) => [
                            <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{value}</span>,
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* 图例 */}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center">
                      {categoryStats.map((cat, idx) => (
                        <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{
                              backgroundColor: TECH_COLORS.chartPalette[idx % TECH_COLORS.chartPalette.length],
                              boxShadow: `0 0 6px ${TECH_COLORS.chartPalette[idx % TECH_COLORS.chartPalette.length]}40`,
                            }}
                          ></span>
                          <span className="text-slate-400">{cat.category}类</span>
                          <span className="text-slate-500 font-mono">{cat.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                    <div className="text-center">
                      <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>暂无缺陷类别数据</p>
                    </div>
                  </div>
                )}
              </div>

              {/* TOP5缺陷排名 - 科技卡片 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  TOP5 缺陷排名
                  <span className="text-xs text-slate-500 font-normal ml-auto">DEFECT RANKING</span>
                </h3>
                {topDefects.length > 0 ? (
                  <div className="space-y-2.5">
                    {topDefects.map((defect, index) => (
                      <div
                        key={index}
                        className="group relative flex items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-700/20 transition-all duration-300 hover:border-slate-600/30 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                      >
                        {/* 排名徽标 */}
                        <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold font-mono ${
                          index === 0 ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-400 border border-red-500/20' :
                          index === 1 ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/20' :
                          index === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800/60 text-slate-400 border border-slate-700/20'
                        }`}>
                          {defect.rank}
                          {index < 3 && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current animate-ping opacity-40"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate transition-colors">{defect.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{defect.location} · {defect.category}类</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold tabular-nums ${index === 0 ? 'text-red-400' : index === 1 ? 'text-orange-400' : index === 2 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {defect.count}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Count</p>
                        </div>
                        {/* 进度条 */}
                        <div className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-20"
                          style={{ width: `${Math.min(100, defect.count * 10)}%`, color: index === 0 ? '#f43f5e' : index === 1 ? '#f97316' : '#f59e0b' }}
                        ></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                    <div className="text-center">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>暂无缺陷排名数据</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 缺陷趋势图 - 科技感面积折线图 */}
            <div className="mt-6 relative">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                缺陷趋势变化
                <span className="text-xs text-slate-500 font-normal ml-auto">TREND ANALYSIS</span>
              </h3>
              {trendData.length > 1 ? (
                <div className="h-72 relative">
                  {/* 背景光效 */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/3 left-1/3 w-40 h-32 bg-blue-500/[0.03] rounded-full blur-3xl"></div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        {/* 缺陷数量面积渐变 */}
                        <linearGradient id="areaGradientDefect" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="60%" stopColor="#3b82f6" stopOpacity={0.06} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        {/* 样本数面积渐变 */}
                        <linearGradient id="areaGradientSample" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="60%" stopColor="#10b981" stopOpacity={0.04} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        {/* 折线发光滤镜 */}
                        <filter id="lineGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      {/* 科技网格 */}
                      <CartesianGrid
                        strokeDasharray="3 4"
                        stroke="rgba(71, 85, 105, 0.12)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(148, 163, 184, 0.5)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(71, 85, 105, 0.25)' }}
                        tickFormatter={(val) => val.slice(5)}
                      />
                      <YAxis
                        stroke="rgba(148, 163, 184, 0.5)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(71, 85, 105, 0.25)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.96)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          borderRadius: '10px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(59,130,246,0.1)',
                          backdropFilter: 'blur(10px)',
                          padding: '10px 14px',
                        }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }}
                        iconType="circle"
                        iconSize={8}
                      />
                      {/* 样本数 - 面积+折线（底层） */}
                      <Area
                        type="monotone"
                        dataKey="sampleCount"
                        name="抽检样本数"
                        stroke="#10b981"
                        strokeWidth={1.5}
                        fill="url(#areaGradientSample)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#10b981', stroke: '#10b981', strokeWidth: 2, filter: 'url(#lineGlowFilter)' }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                      {/* 缺陷数量 - 面积+折线（顶层，带发光） */}
                      <Area
                        type="monotone"
                        dataKey="defectCount"
                        name="缺陷数量"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        fill="url(#areaGradientDefect)"
                        dot={{ r: 3.5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
                        activeDot={{
                          r: 7,
                          fill: '#3b82f6',
                          stroke: '#60a5fa',
                          strokeWidth: 3,
                          filter: 'url(#lineGlowFilter)',
                        }}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/30">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>暂无足够趋势数据（至少需要2天数据）</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 第三部分补充：详细数据查询 - 科技感表格 */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-sm p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="relative p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <List className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white">详细数据查询</h2>
                <span className="text-sm text-slate-400 ml-2 font-mono">
                  {filteredRecords.length} records
                </span>
              </div>
              <button
                onClick={() => setShowDetailQuery(!showDetailQuery)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all duration-300"
              >
                {showDetailQuery ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起列表
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    展开查看
                  </>
                )}
              </button>
            </div>

            {showDetailQuery && (
              <div className="space-y-4">
                {/* 科技感数据表格 */}
                <div className="overflow-x-auto rounded-xl border border-slate-700/30 bg-slate-900/30">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/60 border-b border-slate-700/40">
                        {['序号', '检验日期', '生产点', '牌号', '机台', '班别', `${typeLabel}缺陷数`, '操作'].map((th) => (
                          <th key={th} className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-r border-slate-700/20 last:border-r-0">
                            {th}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/20">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {
                          const defectKey = `${defectType}Defects` as keyof typeof record;
                          const defects = record[defectKey] as any[] || [];
                          const defectCount = defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
                          return (
                            <tr key={record.id || index} className="hover:bg-blue-500/[0.04] transition-colors group">
                              <td className="px-4 py-3 text-slate-400 font-mono text-xs">{String(index + 1).padStart(2, '0')}</td>
                              <td className="px-4 py-3 text-slate-300 font-mono">{record.inspectionDate}</td>
                              <td className="px-4 py-3 text-slate-300">{record.productionPoint}</td>
                              <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate" title={record.brand}>{record.brand}</td>
                              <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-cyan-300 font-mono">{record.machine}</span></td>
                              <td className="px-4 py-3 text-slate-400 text-xs">{record.shiftGroup}{record.shift ? ` ${record.shift}班` : ''}</td>
                              <td className={`px-4 py-3 font-semibold tabular-nums ${defectCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {defectCount > 0 && <span className="mr-1 inline-block w-1 h-1 rounded-full bg-red-400 animate-pulse"></span>}
                                {defectCount}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setSelectedRecord(record)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/15 hover:border-cyan-500/35 rounded-md transition-all duration-200"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  详情
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-8 h-8 opacity-30" />
                              <p>暂无符合条件的数据记录</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* 第四部分：AI质量总结 - 科技感卡片 */}
          <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-blue-900/20 backdrop-blur-sm p-6">
            {/* 多层顶部光线 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
            <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent blur-sm"></div>

            {/* 背景装饰光效 */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/[0.04] rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/[0.03] rounded-full blur-3xl"></div>

            <div className="relative flex items-center gap-2 mb-6">
              <div className="relative p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
                <span className="absolute inset-0 rounded-lg bg-blue-400/20 animate-ping opacity-20"></span>
              </div>
              <h2 className="text-lg font-bold text-white">AI 质量总结</h2>
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25 font-mono tracking-wider">
                AI ANALYSIS
              </span>
            </div>

            <div className="relative space-y-4">
              {aiSummary.map((paragraph, index) => (
                <div
                  key={index}
                  className="relative p-4 rounded-xl bg-slate-900/40 border border-slate-700/20 hover:border-blue-500/15 transition-all duration-300"
                >
                  <p
                    className="text-sm text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: paragraph
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-400 font-semibold">$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                  {/* 段落间装饰线 */}
                  {index < aiSummary.length - 1 && (
                    <div className="absolute -bottom-3 left-8 right-8 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* 详情弹窗 - 科技感升级 */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => setSelectedRecord(null)}>
          <div
            className="relative bg-slate-900/95 border border-slate-700/40 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(59,130,246,0.1)] mx-4 animate-in zoom-in-95 fade-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗顶部光线 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/40 p-6 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  质量记录详情
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-mono">ID: {selectedRecord.id}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2.5 hover:bg-slate-800 rounded-xl transition-colors group"
              >
                <X className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-6">
              {/* 基础信息 - 科技卡片网格 */}
              <div>
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
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
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-3.5 border border-slate-700/25 hover:border-slate-600/30 transition-colors group">
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 缺陷详情 */}
              <div>
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <div className="p-1 rounded bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
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
                        <p className="text-xs text-slate-500 mt-1">ALL CLEAR</p>
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
                          {defects.map((defect, idx) => (
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
                              <td className={`px-4 py-3 font-bold tabular-nums ${defect.quantity > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {defect.quantity}
                              </td>
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
