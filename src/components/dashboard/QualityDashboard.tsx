/**
 * 智·质 - 质量驾驶舱（重构版）
 *
 * 依据《卷烟外在质量分级及评级规定》（QJ/ZY-GY.02-027-2023）
 * 按照“质量结果 → 质量趋势 → 质量原因 → 质量定位 → 质量预警”五层架构重构。
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Factory,
  BarChart3,
  Shield,
  Activity,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  Package,
  X,
} from 'lucide-react';

import { loadProcessQualityData } from '@/utils/analysisUtils';
import type { ProcessQualityRecord } from '@/utils/analysisUtils';
import { resolveBrandName } from '@/services/cigarettePhysicalStandardService';
import {
  getTimeRange,
  getPreviousRange,
  computeStats,
  computeGradeDistribution,
  computeQualityTrend,
  computeDefectGradeDistribution,
  computeDefectTop10,
  computeMachineStats,
  computeAlerts,
  computeHealthStatus,
  RATING_META,
  type TimeRange,
  type QualityStatsWithComparison,
  type GradeDistributionItem,
  type TrendPoint,
  type DefectGradeItem,
  type DefectTopItem,
  type MachineStats,
  type AlertItem,
  type HealthStatus,
  type ProductRating,
} from '@/lib/qualityEngine';

// ==================== 样式常量 ====================

const TIME_OPTIONS: { key: TimeRange['type']; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' },
];

const GRADE_ORDER: ProductRating[] = ['excellent', 'first', 'second', 'unqualified'];

// ==================== 动画数字组件 ====================

const AnimatedNumber: React.FC<{ value: number; decimals?: number; suffix?: string }> = ({
  value,
  decimals = 1,
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let current = displayValue;
    const end = value;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      current = start + (end - start) * ease;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    const start = current;
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()}
      {suffix}
    </span>
  );
};

// ==================== 子组件：指标卡 ====================

interface KPICardProps {
  label: string;
  value: number;
  unit?: string;
  changePoints?: number;
  changePct?: number;
  changeUnit?: string;
  icon: React.ReactNode;
  color: string;
  decimals?: number;
  comparisonLabel?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit = '',
  changePoints,
  changePct,
  changeUnit = '个百分点',
  icon,
  color,
  decimals = 1,
  comparisonLabel,
}) => {
  const effectiveChange = changePoints !== undefined ? changePoints : changePct;
  const trend =
    effectiveChange !== undefined
      ? effectiveChange > 0
        ? 'up'
        : effectiveChange < 0
        ? 'down'
        : 'stable'
      : undefined;
  const isPct = changePct !== undefined;

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderColor: `${color}30`,
        boxShadow: `0 0 20px ${color}10`,
      }}
    >
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-10" style={{ background: color }} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-400">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">
              <AnimatedNumber value={value} decimals={decimals} />
            </span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </div>
          {trend !== undefined && effectiveChange !== undefined && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span
                className={
                  trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'
                }
              >
                {isPct
                  ? `${Math.abs(effectiveChange).toFixed(1)}%`
                  : `${Math.abs(effectiveChange).toFixed(decimals)}${changeUnit}`}
                {comparisonLabel && ` · ${comparisonLabel}`}
              </span>
            </div>
          )}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

// ==================== 子组件：横向条形图（等级分布） ====================

const GradeDistributionChart: React.FC<{ data: GradeDistributionItem[] }> = ({ data }) => {
  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.rating} className="group cursor-pointer">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-200">{item.label}</span>
            <span className="text-slate-400">
              {item.count}批 / {item.rate}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-90"
              style={{ width: `${item.rate}%`, background: item.color, boxShadow: `0 0 10px ${item.color}60` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== 子组件：表格（机台质量） ====================

const MachineTable: React.FC<{ data: MachineStats[] }> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/60 text-left text-slate-400">
            <th className="pb-3 pl-2 font-medium">机台</th>
            <th className="pb-3 font-medium">检验批次</th>
            <th className="pb-3 font-medium">优质率</th>
            <th className="pb-3 font-medium">合格率</th>
            <th className="pb-3 font-medium">累计扣分</th>
            <th className="pb-3 font-medium">缺陷数</th>
            <th className="pb-3 font-medium">不合格批</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={item.machine}
              className="border-b border-slate-800/40 transition-colors hover:bg-slate-800/30"
            >
              <td className="py-3 pl-2 font-medium text-slate-200">{item.machine}</td>
              <td className="py-3 text-slate-300">{item.batchCount}</td>
              <td className="py-3">
                <span
                  className="rounded px-2 py-0.5 text-xs font-medium"
                  style={{
                    color: item.excellentRate >= 90 ? '#10b981' : item.excellentRate >= 80 ? '#3b82f6' : '#f59e0b',
                    background: `${item.excellentRate >= 90 ? '#10b981' : item.excellentRate >= 80 ? '#3b82f6' : '#f59e0b'}20`,
                  }}
                >
                  {item.excellentRate}%
                </span>
              </td>
              <td className="py-3 text-slate-300">{item.passRate}%</td>
              <td className="py-3 text-slate-300">{item.totalScore}</td>
              <td className="py-3 text-slate-300">{item.defectCount}</td>
              <td className="py-3">
                {item.unqualifiedCount > 0 ? (
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-400">
                    {item.unqualifiedCount}批
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-slate-500">
                当前时间范围内无机台数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// ==================== 子组件：预警列表 ====================

const AlertList: React.FC<{ alerts: AlertItem[] }> = ({ alerts }) => {
  const levelConfig = {
    high: { icon: AlertCircle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: '严重' },
    warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: '警告' },
    normal: { icon: Activity, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', label: '提示' },
  };

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const cfg = levelConfig[alert.level];
        const Icon = cfg.icon;
        return (
          <div
            key={alert.id}
            className="flex items-start gap-3 rounded-lg border border-slate-700/50 p-3 transition-colors hover:bg-slate-800/40"
            style={{ background: 'rgba(15, 23, 42, 0.4)' }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200">{alert.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">来源：{alert.source}</p>
            </div>
          </div>
        );
      })}
      {alerts.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          当前时间范围内未发现质量异常，质量状态良好。
        </div>
      )}
    </div>
  );
};

function dubaiToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function uniqueRunningBrands(records: ProcessQualityRecord[], date: string): string[] {
  const names = new Set<string>();
  records.forEach((r) => {
    if (r.inspectionDate !== date) return;
    const raw = (r.brand || '').trim();
    if (!raw) return;
    names.add(resolveBrandName(raw) || raw);
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

// ==================== 主组件 ====================

const QualityDashboard: React.FC = () => {
  const [timeType, setTimeType] = useState<TimeRange['type']>('week');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [allRecords, setAllRecords] = useState<ProcessQualityRecord[]>([]);
  const [activeDefectIndex, setActiveDefectIndex] = useState<number | null>(null);
  const [runningBrandDate, setRunningBrandDate] = useState(dubaiToday);
  const [showRunningBrands, setShowRunningBrands] = useState(false);

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setAllRecords(await loadProcessQualityData());
    };
    load();
    window.addEventListener('quality-data-updated', load);
    return () => window.removeEventListener('quality-data-updated', load);
  }, []);

  const timeRange = useMemo<TimeRange>(() => {
    return getTimeRange(timeType, customFrom || undefined, customTo || undefined);
  }, [timeType, customFrom, customTo]);

  const previousRange = useMemo<TimeRange>(() => getPreviousRange(timeRange), [timeRange]);

  const currentRecords = useMemo(
    () => allRecords.filter(r => r.inspectionDate >= timeRange.from && r.inspectionDate <= timeRange.to),
    [allRecords, timeRange]
  );

  const previousRecords = useMemo(
    () => allRecords.filter(r => r.inspectionDate >= previousRange.from && r.inspectionDate <= previousRange.to),
    [allRecords, previousRange]
  );

  const stats = useMemo<QualityStatsWithComparison>(() => {
    return computeStats(currentRecords, previousRecords);
  }, [currentRecords, previousRecords]);

  const gradeDistribution = useMemo(() => computeGradeDistribution(currentRecords), [currentRecords]);
  const trendData = useMemo(() => computeQualityTrend(currentRecords, timeRange), [currentRecords, timeRange]);
  const defectGradeData = useMemo(() => computeDefectGradeDistribution(currentRecords), [currentRecords]);
  const defectScoreTop10 = useMemo(() => computeDefectTop10(currentRecords, 'score'), [currentRecords]);
  const machineStats = useMemo(() => computeMachineStats(currentRecords), [currentRecords]);
  const alerts = useMemo(
    () => computeAlerts(stats, currentRecords, previousRecords, timeRange),
    [stats, currentRecords, previousRecords, timeRange]
  );
  const health = useMemo(() => computeHealthStatus(stats, alerts), [stats, alerts]);
  const runningBrands = useMemo(
    () => uniqueRunningBrands(allRecords, runningBrandDate),
    [allRecords, runningBrandDate]
  );

  const comparisonLabel = previousRange.label;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-200">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px]">
        {/* 顶部标题与时间筛选 */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-cyan-400" />
              质量管控驾驶舱
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              数据更新时间：{currentTime.toLocaleString('zh-CN')}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border border-slate-700/60 bg-slate-800/50 p-1">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setTimeType(opt.key)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                    timeType === opt.key
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {timeType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                />
                <span className="text-slate-500">至</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                />
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-400">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <span>
                {timeRange.label}：{timeRange.from} ~ {timeRange.to}
              </span>
            </div>
          </div>
        </div>

        {/* 指定日期开动牌号（去重） */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-cyan-500/25 bg-slate-900/60 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">指定日期开动牌号</h2>
              <p className="text-xs text-slate-500">按检验日期统计，同一牌号只计 1 次</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/50 px-3 py-1.5">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <input
                type="date"
                value={runningBrandDate}
                onChange={(e) => {
                  setRunningBrandDate(e.target.value);
                  setShowRunningBrands(false);
                }}
                className="bg-transparent text-sm text-slate-200 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowRunningBrands(true)}
              className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20"
            >
              <span className="text-2xl font-bold text-white leading-none">{runningBrands.length}</span>
              <span>个牌号</span>
              <ChevronRight className="h-4 w-4" />
              查看明细
            </button>
          </div>
        </div>

        {showRunningBrands && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
            onClick={() => setShowRunningBrands(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-slate-700/50 bg-slate-900 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">开动牌号明细</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {runningBrandDate} 共 {runningBrands.length} 个不重复牌号
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRunningBrands(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {runningBrands.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700/60 py-10 text-center text-sm text-slate-500">
                  该日期暂无过程质量录入，没有开动牌号
                </p>
              ) : (
                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {runningBrands.map((brand, index) => (
                    <li
                      key={brand}
                      className="flex items-center gap-3 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2.5"
                    >
                      <span className="w-6 text-xs text-slate-500">{index + 1}</span>
                      <Package className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-slate-100">{brand}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* 第一层：核心指标 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <KPICard
            label="检验批次"
            value={stats.current.totalBatches}
            unit="批"
            changePct={stats.changes.totalBatchesPct}
            icon={<BarChart3 className="h-6 w-6" />}
            color="#3b82f6"
            decimals={0}
            comparisonLabel={comparisonLabel}
          />
          <KPICard
            label="合格率"
            value={stats.current.passRate}
            unit="%"
            changePoints={stats.changes.passRatePoints}
            icon={<CheckCircle2 className="h-6 w-6" />}
            color="#10b981"
          />
          <KPICard
            label="优质率"
            value={stats.current.excellentRate}
            unit="%"
            changePoints={stats.changes.excellentRatePoints}
            icon={<Shield className="h-6 w-6" />}
            color="#06b6d4"
          />
          <KPICard
            label="一等品率"
            value={stats.current.firstRate}
            unit="%"
            changePoints={stats.changes.firstRatePoints}
            icon={<Activity className="h-6 w-6" />}
            color="#8b5cf6"
          />
          <KPICard
            label="二等品率"
            value={stats.current.secondRate}
            unit="%"
            changePoints={stats.changes.secondRatePoints}
            icon={<TrendingUp className="h-6 w-6" />}
            color="#f59e0b"
          />
          <KPICard
            label="不合格率"
            value={stats.current.unqualifiedRate}
            unit="%"
            changePoints={stats.changes.unqualifiedRatePoints}
            icon={<AlertCircle className="h-6 w-6" />}
            color="#ef4444"
          />
          <KPICard
            label="累计批次扣分"
            value={stats.current.totalScore}
            unit="分"
            changePoints={stats.changes.totalScore}
            changeUnit="分"
            icon={<Clock className="h-6 w-6" />}
            color="#ec4899"
            decimals={0}
          />
          <div
            className="relative overflow-hidden rounded-xl border p-5"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderColor: `${health.status === 'healthy' ? '#10b981' : health.status === 'attention' ? '#f59e0b' : '#ef4444'}40`,
            }}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">当前质量状态</span>
                <span className="text-2xl">{health.emoji}</span>
              </div>
              <div className="text-xl font-bold text-white">{health.label}</div>
              <div className="mt-2 text-xs text-slate-400">
                {health.reasons.slice(0, 2).join('；')}
                {health.reasons.length > 2 && '…'}
              </div>
            </div>
          </div>
        </div>

        {/* 第二层：等级分布 + 优质率趋势 */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                产品质量等级分布
              </h2>
              <span className="text-xs text-slate-500">按批次最终评级</span>
            </div>
            <GradeDistributionChart data={gradeDistribution} />
          </div>

          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                优质率趋势
              </h2>
              <span className="text-xs text-slate-500">{timeRange.label}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExcellent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415540" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`${value}%`, '优质率']}
                  />
                  <Area
                    type="monotone"
                    dataKey="excellentRate"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExcellent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 第三层：合格率趋势 + 累计扣分趋势 */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                合格率趋势
              </h2>
              <span className="text-xs text-slate-500">{timeRange.label}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415540" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`${value}%`, '合格率']}
                  />
                  <Area
                    type="monotone"
                    dataKey="passRate"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPass)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Activity className="h-5 w-5 text-rose-400" />
                累计批次扣分趋势
              </h2>
              <span className="text-xs text-slate-500">{timeRange.label}</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#33415540" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} unit="分" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [`${value}分`, '累计扣分']}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalScore"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 第四层：缺陷等级分布 + 缺陷扣分TOP10 */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Filter className="h-5 w-5 text-amber-400" />
                缺陷等级分布
              </h2>
              <span className="text-xs text-slate-500">按缺陷数量 · 扣分</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="defectGradientA" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff8a8a" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="defectGradientB" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fcd34d" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="defectGradientC" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="defectGradientD" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="defectGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as DefectGradeItem;
                        const labelMap: Record<string, string> = {
                          A: 'A类严重缺陷',
                          B: 'B类较重缺陷',
                          C: 'C类一般缺陷',
                          D: 'D类轻微缺陷',
                        };
                        const total = defectGradeData.reduce((sum, d) => sum + d.count, 0);
                        const pct = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0.0';
                        return (
                          <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                              <span
                                className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                                style={{
                                  background:
                                    data.category === 'A'
                                      ? '#ef4444'
                                      : data.category === 'B'
                                      ? '#f59e0b'
                                      : data.category === 'C'
                                      ? '#3b82f6'
                                      : '#10b981',
                                  boxShadow: `0 0 10px ${
                                    data.category === 'A'
                                      ? '#ef4444'
                                      : data.category === 'B'
                                      ? '#f59e0b'
                                      : data.category === 'C'
                                      ? '#3b82f6'
                                      : '#10b981'
                                  }`,
                                }}
                              />
                              {labelMap[data.category] || '缺陷'}
                            </div>
                            <div className="space-y-1 text-xs text-slate-300">
                              <div className="flex justify-between gap-5">
                                <span className="text-slate-400">缺陷数量</span>
                                <span className="font-mono font-semibold text-white">{data.count}</span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span className="text-slate-400">数量占比</span>
                                <span className="font-mono font-semibold text-white">{pct}%</span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span className="text-slate-400">累计扣分</span>
                                <span className="font-mono font-semibold text-white">{data.score} 分</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={defectGradeData}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                    cornerRadius={8}
                    stroke="rgba(15,23,42,0.8)"
                    strokeWidth={3}
                    onMouseEnter={(_, index) => setActiveDefectIndex(index)}
                    onMouseLeave={() => setActiveDefectIndex(null)}
                  >
                    {defectGradeData.map((entry, index) => {
                      const isActive = activeDefectIndex === index;
                      const gradientId =
                        entry.category === 'A'
                          ? 'defectGradientA'
                          : entry.category === 'B'
                          ? 'defectGradientB'
                          : entry.category === 'C'
                          ? 'defectGradientC'
                          : 'defectGradientD';
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#${gradientId})`}
                          stroke={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.8)'}
                          strokeWidth={isActive ? 4 : 3}
                          filter={isActive ? 'url(#defectGlow)' : undefined}
                        />
                      );
                    })}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-xs tracking-wider">
                    缺陷总数
                  </text>
                  <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-2xl font-bold tracking-tight">
                    {stats.current.totalDefects}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 自定义图例 */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {defectGradeData.map((item, idx) => {
                const labelMap: Record<string, string> = {
                  A: 'A类严重缺陷',
                  B: 'B类较重缺陷',
                  C: 'C类一般缺陷',
                  D: 'D类轻微缺陷',
                };
                const colorMap: Record<string, string> = {
                  A: '#ef4444',
                  B: '#f59e0b',
                  C: '#3b82f6',
                  D: '#10b981',
                };
                const total = defectGradeData.reduce((sum, d) => sum + d.count, 0);
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';
                const isActive = activeDefectIndex === idx;
                return (
                  <div
                    key={item.category}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all duration-200 ${
                      isActive
                        ? 'border-slate-500/60 bg-slate-800/70'
                        : 'border-slate-700/30 bg-slate-800/20 hover:border-slate-600/50 hover:bg-slate-800/40'
                    }`}
                    onMouseEnter={() => setActiveDefectIndex(idx)}
                    onMouseLeave={() => setActiveDefectIndex(null)}
                  >
                    <div
                      className="h-8 w-1 rounded-full"
                      style={{
                        background: `linear-gradient(180deg, ${colorMap[item.category]}88, ${colorMap[item.category]})`,
                        boxShadow: isActive ? `0 0 10px ${colorMap[item.category]}` : undefined,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-slate-200">{labelMap[item.category]}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{item.count}次</span>
                        <span>·</span>
                        <span>{pct}%</span>
                        <span>·</span>
                        <span>{item.score}分</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingDown className="h-5 w-5 text-rose-400" />
                缺陷扣分 TOP10
              </h2>
              <span className="text-xs text-slate-500">按累计扣分排序</span>
            </div>
            <div className="space-y-2">
              {defectScoreTop10.map((item, idx) => (
                <div
                  key={`${item.location}-${item.name}-${idx}`}
                  className="flex items-center gap-3 rounded-lg bg-slate-800/30 px-3 py-2 transition-colors hover:bg-slate-800/50"
                >
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
                    style={{
                      background: idx < 3 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      color: idx < 3 ? '#fb7185' : '#94a3b8',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-200">
                      {item.name}
                      <span className="ml-2 text-xs text-slate-500">({item.location})</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.category}类 · {item.count}次
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-rose-400">{item.score}分</div>
                </div>
              ))}
              {defectScoreTop10.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">当前时间范围内无缺陷数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 第五层：机台质量分析 */}
        <div className="mb-6 rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Factory className="h-5 w-5 text-purple-400" />
              机台质量分析
            </h2>
            <span className="text-xs text-slate-500">按优质率排序</span>
          </div>
          <MachineTable data={machineStats} />
        </div>

        {/* 第六层：质量异常提醒 */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              质量异常提醒
            </h2>
            <span className="text-xs text-slate-500">基于同一时间段自动研判</span>
          </div>
          <AlertList alerts={alerts} />
        </div>
      </div>
    </div>
  );
};

export { QualityDashboard };
export default QualityDashboard;
