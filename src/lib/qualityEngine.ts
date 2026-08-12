/**
 * 质量引擎（Quality Engine）
 *
 * 依据《卷烟外在质量分级及评级规定》（QJ/ZY-GY.02-027-2023）
 * 统一质量统计、评级、扣分、合格判定与预警逻辑。
 *
 * 数据链路：
 *   检验批次 → 缺陷识别 → 缺陷等级 A/B/C/D → 标准扣分 → 累计扣分 →
 *   产品评级（优等/一等/二等/不合格） → 合格/不合格判定 → 合格带问题判定 →
 *   统计 → 驾驶舱展示
 */

import type { ProcessQualityRecord, DefectRecord } from '@/utils/analysisUtils';

// ==================== 常量定义 ====================

/** 缺陷部位对应的评分类别 */
export type ScoreCategory = 'box' | 'carton' | 'pack' | 'physical' | 'appearance' | 'misc';

export const SCORE_CATEGORY_LABELS: Record<ScoreCategory, string> = {
  box: '箱',
  carton: '条',
  pack: '盒',
  physical: '物测',
  appearance: '外观',
  misc: '杂项',
};

/**
 * 标准扣分表（表1：卷烟包装与卷制质量缺陷分级和单位扣分值表）
 * 行：缺陷等级 A/B/C/D
 * 列：部位类别 箱/条/盒/物测/外观/杂项
 */
export const DEFECT_SCORE_TABLE: Record<string, Record<ScoreCategory, number>> = {
  A: { box: 100, carton: 100, pack: 200, physical: 0, appearance: 120, misc: 200 },
  B: { box: 30, carton: 30, pack: 50, physical: 0, appearance: 20, misc: 30 },
  C: { box: 10, carton: 10, pack: 10, physical: 12, appearance: 8, misc: 10 },
  D: { box: 5, carton: 5, pack: 5, physical: 2, appearance: 2, misc: 2 },
};

/** 产品外在质量评级阈值（5.3.1 累计扣分） */
export const RATING_THRESHOLDS = [
  { max: 18, key: 'excellent', label: '优等品', shortLabel: '优等' },
  { max: 100, key: 'first', label: '一等品', shortLabel: '一等' },
  { max: 200, key: 'second', label: '二等品', shortLabel: '二等' },
  { max: Infinity, key: 'unqualified', label: '不合格品', shortLabel: '不合格' },
] as const;

export type ProductRating = (typeof RATING_THRESHOLDS)[number]['key'];

export const RATING_META: Record<
  ProductRating,
  { label: string; shortLabel: string; color: string; bg: string; border: string }
> = {
  excellent: {
    label: '优等品',
    shortLabel: '优等',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  first: {
    label: '一等品',
    shortLabel: '一等',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.35)',
  },
  second: {
    label: '二等品',
    shortLabel: '二等',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  unqualified: {
    label: '不合格品',
    shortLabel: '不合格',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.35)',
  },
};

export type PassStatus = 'pass' | 'fail';
export type IssueStatus = 'normal' | 'withIssue';

export interface BatchRating {
  recordId: string;
  inspectionDate: string;
  machine: string;
  brand: string;
  shiftGroup: string;
  shift: string;
  productionPoint: string;
  totalScore: number;
  rating: ProductRating;
  passStatus: PassStatus;
  issueStatus: IssueStatus;
  defectCount: number;
  defectsByCategory: Record<string, number>;
  defects: DefectRecord[];
}

export interface TimeRange {
  type: 'today' | 'week' | 'month' | 'custom';
  from: string;
  to: string;
  label: string;
}

export interface QualityStats {
  totalBatches: number;
  passCount: number;
  passRate: number;
  excellentCount: number;
  excellentRate: number;
  firstCount: number;
  firstRate: number;
  secondCount: number;
  secondRate: number;
  unqualifiedCount: number;
  unqualifiedRate: number;
  totalScore: number;
  avgScore: number;
  defectBatches: number;
  defectRate: number;
  totalDefects: number;
  withIssueCount: number;
  defectsByCategory: Record<string, number>;
}

export interface QualityStatsWithComparison {
  current: QualityStats;
  previous: QualityStats;
  changes: {
    totalBatches: number;
    totalBatchesPct: number;
    passRatePoints: number;
    excellentRatePoints: number;
    firstRatePoints: number;
    secondRatePoints: number;
    unqualifiedRatePoints: number;
    avgScore: number;
    avgScorePct: number;
    defectRatePoints: number;
  };
}

export interface GradeDistributionItem {
  rating: ProductRating;
  label: string;
  count: number;
  rate: number;
  color: string;
}

export interface TrendPoint {
  label: string;
  fullLabel: string;
  excellentRate: number;
  passRate: number;
  avgScore: number;
  totalScore: number;
  batchCount: number;
}

export interface DefectGradeItem {
  category: string;
  count: number;
  score: number;
}

export interface DefectTopItem {
  name: string;
  location: string;
  category: string;
  scoreCategory: ScoreCategory;
  count: number;
  score: number;
}

export interface MachineStats {
  machine: string;
  batchCount: number;
  excellentRate: number;
  passRate: number;
  avgScore: number;
  defectCount: number;
  totalScore: number;
  unqualifiedCount: number;
}

export interface AlertItem {
  id: string;
  level: 'high' | 'warning' | 'normal';
  message: string;
  source: string;
}

export interface HealthStatus {
  status: 'healthy' | 'attention' | 'abnormal';
  label: string;
  emoji: string;
  reasons: string[];
}

// ==================== 工具函数 ====================

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(a: string, b: string): number {
  const da = parseDate(a).getTime();
  const db = parseDate(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getTimeRange(type: TimeRange['type'], customFrom?: string, customTo?: string): TimeRange {
  const now = new Date();
  const today = formatDate(now);

  if (type === 'today') {
    return { type, from: today, to: today, label: '今日' };
  }

  if (type === 'week') {
    const start = getWeekStart(now);
    const end = addDays(start, 6);
    return {
      type,
      from: formatDate(start),
      to: formatDate(end),
      label: '本周',
    };
  }

  if (type === 'month') {
    const start = getMonthStart(now);
    const end = getMonthEnd(now);
    return {
      type,
      from: formatDate(start),
      to: formatDate(end),
      label: '本月',
    };
  }

  return {
    type,
    from: customFrom || today,
    to: customTo || today,
    label: '自定义',
  };
}

export function getPreviousRange(range: TimeRange): TimeRange {
  const days = Math.max(0, diffDays(range.from, range.to));

  if (range.type === 'today') {
    const prev = formatDate(addDays(parseDate(range.from), -1));
    return { type: 'today', from: prev, to: prev, label: '昨日' };
  }

  const prevEnd = addDays(parseDate(range.from), -1);
  const prevStart = addDays(prevEnd, -days);

  return {
    type: range.type,
    from: formatDate(prevStart),
    to: formatDate(prevEnd),
    label: range.type === 'week' ? '上周' : range.type === 'month' ? '上月' : '上一周期',
  };
}

// ==================== 扣分与评级逻辑 ====================

/**
 * 将 defect 中的 scoreCategory（或根据 location 推断）映射为评分类别
 */
function resolveScoreCategory(defect: DefectRecord): ScoreCategory {
  if ((defect as any).scoreCategory) {
    return (defect as any).scoreCategory as ScoreCategory;
  }
  // 默认：烟支缺陷无细分类型时，按外观处理
  return 'appearance';
}

/**
 * 根据缺陷等级和评分类别计算单项扣分
 */
export function getDefectScore(category: string, scoreCategory?: ScoreCategory): number {
  const cat = (category || 'D').toUpperCase();
  const sc = scoreCategory || 'appearance';
  return DEFECT_SCORE_TABLE[cat]?.[sc] ?? DEFECT_SCORE_TABLE.D[sc] ?? 2;
}

function getRating(totalScore: number): ProductRating {
  for (const t of RATING_THRESHOLDS) {
    if (totalScore <= t.max) return t.key;
  }
  return 'unqualified';
}

export function calculateBatchRating(record: ProcessQualityRecord): BatchRating {
  const defectGroups: { field: keyof ProcessQualityRecord; scoreCategory: ScoreCategory }[] = [
    { field: 'boxDefects', scoreCategory: 'box' },
    { field: 'cartonDefects', scoreCategory: 'carton' },
    { field: 'packDefects', scoreCategory: 'pack' },
    { field: 'cigaretteDefects', scoreCategory: 'appearance' },
  ];

  let totalScore = 0;
  let defectCount = 0;
  const defectsByCategory: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const allDefects: DefectRecord[] = [];

  defectGroups.forEach(({ field, scoreCategory }) => {
    const group = record[field] as DefectRecord[] | undefined;
    if (!group) return;
    group.forEach(d => {
      const sc = field === 'cigaretteDefects' ? resolveScoreCategory(d) : scoreCategory;
      const qty = d.quantity || 1;
      const score = getDefectScore(d.category, sc) * qty;
      totalScore += score;
      defectCount += qty;
      const cat = (d.category || 'D').toUpperCase();
      defectsByCategory[cat] = (defectsByCategory[cat] || 0) + qty;
      allDefects.push(d);
    });
  });

  const rating = getRating(totalScore);
  // 产品内控标准：不合格品判定以累计扣分 > 200 为标准（与评级一致）
  const passStatus: PassStatus = rating === 'unqualified' ? 'fail' : 'pass';

  // 合格带问题：合格批次中，出现 A 类缺陷或累计扣分超过优等品阈值
  const issueStatus: IssueStatus =
    passStatus === 'pass' && (defectsByCategory.A > 0 || totalScore > RATING_THRESHOLDS[0].max)
      ? 'withIssue'
      : 'normal';

  return {
    recordId: record.id || '',
    inspectionDate: record.inspectionDate || '',
    machine: record.machine || '',
    brand: record.brand || '',
    shiftGroup: record.shiftGroup || '',
    shift: record.shift || '',
    productionPoint: record.productionPoint || '',
    totalScore,
    rating,
    passStatus,
    issueStatus,
    defectCount,
    defectsByCategory,
    defects: allDefects,
  };
}

export function rateRecords(records: ProcessQualityRecord[]): BatchRating[] {
  return records.map(calculateBatchRating);
}

export function filterByDateRange(records: ProcessQualityRecord[], from: string, to: string): ProcessQualityRecord[] {
  return records.filter(r => r.inspectionDate >= from && r.inspectionDate <= to);
}

// ==================== 统计聚合 ====================

function buildStats(ratings: BatchRating[]): QualityStats {
  const total = ratings.length;
  const passCount = ratings.filter(r => r.passStatus === 'pass').length;
  const excellentCount = ratings.filter(r => r.rating === 'excellent').length;
  const firstCount = ratings.filter(r => r.rating === 'first').length;
  const secondCount = ratings.filter(r => r.rating === 'second').length;
  const unqualifiedCount = ratings.filter(r => r.rating === 'unqualified').length;
  const totalScore = ratings.reduce((sum, r) => sum + r.totalScore, 0);
  const defectBatches = ratings.filter(r => r.defectCount > 0).length;
  const totalDefects = ratings.reduce((sum, r) => sum + r.defectCount, 0);
  const withIssueCount = ratings.filter(r => r.issueStatus === 'withIssue').length;
  const defectsByCategory: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  ratings.forEach(r => {
    Object.entries(r.defectsByCategory).forEach(([cat, count]) => {
      defectsByCategory[cat] = (defectsByCategory[cat] || 0) + count;
    });
  });

  return {
    totalBatches: total,
    passCount,
    passRate: total > 0 ? parseFloat(((passCount / total) * 100).toFixed(2)) : 0,
    excellentCount,
    excellentRate: total > 0 ? parseFloat(((excellentCount / total) * 100).toFixed(2)) : 0,
    firstCount,
    firstRate: total > 0 ? parseFloat(((firstCount / total) * 100).toFixed(2)) : 0,
    secondCount,
    secondRate: total > 0 ? parseFloat(((secondCount / total) * 100).toFixed(2)) : 0,
    unqualifiedCount,
    unqualifiedRate: total > 0 ? parseFloat(((unqualifiedCount / total) * 100).toFixed(2)) : 0,
    totalScore,
    avgScore: total > 0 ? parseFloat((totalScore / total).toFixed(2)) : 0,
    defectBatches,
    defectRate: total > 0 ? parseFloat(((defectBatches / total) * 100).toFixed(2)) : 0,
    totalDefects,
    withIssueCount,
    defectsByCategory,
  };
}

export function computeStats(
  currentRecords: ProcessQualityRecord[],
  previousRecords: ProcessQualityRecord[]
): QualityStatsWithComparison {
  const current = buildStats(rateRecords(currentRecords));
  const previous = buildStats(rateRecords(previousRecords));

  const safePct = (now: number, prev: number) =>
    prev === 0 ? (now > 0 ? 100 : 0) : parseFloat((((now - prev) / prev) * 100).toFixed(1));

  return {
    current,
    previous,
    changes: {
      totalBatches: current.totalBatches - previous.totalBatches,
      totalBatchesPct: safePct(current.totalBatches, previous.totalBatches),
      passRatePoints: parseFloat((current.passRate - previous.passRate).toFixed(2)),
      excellentRatePoints: parseFloat((current.excellentRate - previous.excellentRate).toFixed(2)),
      firstRatePoints: parseFloat((current.firstRate - previous.firstRate).toFixed(2)),
      secondRatePoints: parseFloat((current.secondRate - previous.secondRate).toFixed(2)),
      unqualifiedRatePoints: parseFloat((current.unqualifiedRate - previous.unqualifiedRate).toFixed(2)),
      avgScore: parseFloat((current.avgScore - previous.avgScore).toFixed(2)),
      avgScorePct: safePct(current.avgScore, previous.avgScore),
      defectRatePoints: parseFloat((current.defectRate - previous.defectRate).toFixed(2)),
    },
  };
}

// ==================== 等级分布 ====================

export function computeGradeDistribution(records: ProcessQualityRecord[]): GradeDistributionItem[] {
  const ratings = rateRecords(records);
  const total = ratings.length;

  return (['excellent', 'first', 'second', 'unqualified'] as ProductRating[]).map(key => {
    const count = ratings.filter(r => r.rating === key).length;
    return {
      rating: key,
      label: RATING_META[key].label,
      count,
      rate: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      color: RATING_META[key].color,
    };
  });
}

// ==================== 趋势分析 ====================

function createTrendLabels(range: TimeRange): { key: string; label: string; fullLabel: string; match: (dateStr: string, createdAt?: string) => boolean }[] {
  const from = parseDate(range.from);
  const to = parseDate(range.to);
  const days = Math.max(0, diffDays(range.from, range.to));

  // 单日：按小时分组（尽量使用 createdAt，否则按日期归入 00:00）
  if (days === 0) {
    return Array.from({ length: 24 }, (_, i) => {
      const hourLabel = `${pad(i)}:00`;
      return {
        key: hourLabel,
        label: hourLabel,
        fullLabel: `${range.from} ${hourLabel}`,
        match: (dateStr: string, createdAt?: string) => {
          if (dateStr !== range.from) return false;
          if (createdAt) {
            const dt = new Date(createdAt);
            return dt.getHours() === i;
          }
          return i === 0;
        },
      };
    });
  }

  // 多日期间按天分组
  const labels: { key: string; label: string; fullLabel: string; match: (dateStr: string) => boolean }[] = [];
  let cursor = new Date(from);
  while (cursor <= to) {
    const dStr = formatDate(cursor);
    const isWeek = days <= 6;
    labels.push({
      key: dStr,
      label: isWeek ? `${pad(cursor.getMonth() + 1)}/${pad(cursor.getDate())}` : `${cursor.getDate()}日`,
      fullLabel: dStr,
      match: (dateStr: string) => dateStr === dStr,
    });
    cursor = addDays(cursor, 1);
  }
  return labels;
}

export function computeQualityTrend(records: ProcessQualityRecord[], range: TimeRange): TrendPoint[] {
  const labels = createTrendLabels(range);
  return labels.map(label => {
    const matched = records.filter(r => label.match(r.inspectionDate, (r as any).createdAt));
    const ratings = rateRecords(matched);
    const total = ratings.length;
    const totalScore = ratings.reduce((s, r) => s + r.totalScore, 0);
    const passCount = ratings.filter(r => r.passStatus === 'pass').length;
    const excellentCount = ratings.filter(r => r.rating === 'excellent').length;

    return {
      label: label.label,
      fullLabel: label.fullLabel,
      batchCount: total,
      totalScore,
      avgScore: total > 0 ? parseFloat((totalScore / total).toFixed(2)) : 0,
      passRate: total > 0 ? parseFloat(((passCount / total) * 100).toFixed(2)) : 0,
      excellentRate: total > 0 ? parseFloat(((excellentCount / total) * 100).toFixed(2)) : 0,
    };
  });
}

// ==================== 缺陷分析 ====================

export function computeDefectGradeDistribution(records: ProcessQualityRecord[]): DefectGradeItem[] {
  const ratings = rateRecords(records);
  const result: Record<string, DefectGradeItem> = {};

  ratings.forEach(r => {
    Object.entries(r.defectsByCategory).forEach(([category, count]) => {
      if (!result[category]) {
        result[category] = { category, count: 0, score: 0 };
      }
      result[category].count += count;
      result[category].score += count * getDefectScore(category);
    });
  });

  return Object.values(result).sort((a, b) => b.score - a.score);
}

export function computeDefectTop10(
  records: ProcessQualityRecord[],
  by: 'count' | 'score' = 'count'
): DefectTopItem[] {
  const map = new Map<string, DefectTopItem>();

  const groups: { field: keyof ProcessQualityRecord; scoreCategory: ScoreCategory }[] = [
    { field: 'boxDefects', scoreCategory: 'box' },
    { field: 'cartonDefects', scoreCategory: 'carton' },
    { field: 'packDefects', scoreCategory: 'pack' },
    { field: 'cigaretteDefects', scoreCategory: 'appearance' },
  ];

  records.forEach(r => {
    groups.forEach(({ field, scoreCategory }) => {
      const g = r[field] as DefectRecord[] | undefined;
      if (!g) return;
      g.forEach(d => {
        const sc = field === 'cigaretteDefects' ? resolveScoreCategory(d) : scoreCategory;
        const key = `${d.location}::${d.defectName}::${sc}`;
        const qty = d.quantity || 1;
        const score = getDefectScore(d.category, sc) * qty;
        const existing = map.get(key);
        if (existing) {
          existing.count += qty;
          existing.score += score;
        } else {
          map.set(key, {
            name: d.defectName,
            location: d.location,
            category: d.category || 'D',
            scoreCategory: sc,
            count: qty,
            score,
          });
        }
      });
    });
  });

  return Array.from(map.values())
    .sort((a, b) => (by === 'count' ? b.count - a.count : b.score - a.score))
    .slice(0, 10);
}

// ==================== 机台质量分析 ====================

export function computeMachineStats(records: ProcessQualityRecord[]): MachineStats[] {
  const ratings = rateRecords(records);
  const map = new Map<string, MachineStats>();

  ratings.forEach(r => {
    const machine = r.machine || '未知机台';
    const existing = map.get(machine);
    if (existing) {
      existing.batchCount += 1;
      existing.totalScore += r.totalScore;
      existing.defectCount += r.defectCount;
      if (r.rating === 'excellent') existing.excellentRate += 1;
      if (r.passStatus === 'pass') existing.passRate += 1;
      if (r.rating === 'unqualified') existing.unqualifiedCount += 1;
    } else {
      map.set(machine, {
        machine,
        batchCount: 1,
        excellentRate: r.rating === 'excellent' ? 1 : 0,
        passRate: r.passStatus === 'pass' ? 1 : 0,
        avgScore: r.totalScore,
        defectCount: r.defectCount,
        totalScore: r.totalScore,
        unqualifiedCount: r.rating === 'unqualified' ? 1 : 0,
      });
    }
  });

  return Array.from(map.values())
    .map(m => ({
      ...m,
      excellentRate: m.batchCount > 0 ? parseFloat(((m.excellentRate / m.batchCount) * 100).toFixed(1)) : 0,
      passRate: m.batchCount > 0 ? parseFloat(((m.passRate / m.batchCount) * 100).toFixed(1)) : 0,
      avgScore: m.batchCount > 0 ? parseFloat((m.totalScore / m.batchCount).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.excellentRate - a.excellentRate || a.avgScore - b.avgScore);
}

// ==================== 预警与健康状态 ====================

export function computeAlerts(
  currentStats: QualityStatsWithComparison,
  currentRecords: ProcessQualityRecord[],
  previousRecords: ProcessQualityRecord[],
  range: TimeRange
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const { current, previous, changes } = currentStats;

  // 不合格批次
  if (current.unqualifiedCount > 0) {
    alerts.push({
      id: 'unqualified',
      level: 'high',
      message: `发现不合格批次 ${current.unqualifiedCount} 批，累计扣分超过 200 分，需立即追溯隔离。`,
      source: '产品评级',
    });
  }

  // 优质率下降
  if (changes.excellentRatePoints <= -3) {
    alerts.push({
      id: 'excellent-down',
      level: 'warning',
      message: `优质率较${range.type === 'today' ? '昨日' : '上一周期'}下降 ${Math.abs(changes.excellentRatePoints).toFixed(1)} 个百分点。`,
      source: '优质率趋势',
    });
  }

  // 平均扣分上升
  if (changes.avgScore >= 2) {
    alerts.push({
      id: 'avg-score-up',
      level: 'warning',
      message: `平均每批次扣分较${range.type === 'today' ? '昨日' : '上一周期'}上升 ${changes.avgScore.toFixed(1)} 分。`,
      source: '平均扣分',
    });
  }

  // B类缺陷增加
  const currentB = rateRecords(currentRecords).reduce((s, r) => s + (r.defectsByCategory.B || 0), 0);
  const previousB = rateRecords(previousRecords).reduce((s, r) => s + (r.defectsByCategory.B || 0), 0);
  if (previousB > 0 && currentB > previousB * 1.2) {
    alerts.push({
      id: 'b-defect-up',
      level: 'warning',
      message: `B类缺陷数量较${range.type === 'today' ? '昨日' : '上一周期'}增加 ${Math.round(((currentB - previousB) / previousB) * 100)}%。`,
      source: '缺陷等级',
    });
  }

  // A类缺陷
  const currentA = rateRecords(currentRecords).reduce((s, r) => s + (r.defectsByCategory.A || 0), 0);
  if (currentA > 0) {
    alerts.push({
      id: 'a-defect',
      level: 'high',
      message: `发现 A 类严重缺陷 ${currentA} 项，对消费者利益有直接损害。`,
      source: '缺陷等级',
    });
  }

  // 合格带问题
  if (current.withIssueCount > 0) {
    alerts.push({
      id: 'with-issue',
      level: 'normal',
      message: `有 ${current.withIssueCount} 批合格带问题产品，建议按 ERP 质量通知单流程追溯。`,
      source: '合格带问题',
    });
  }

  // 机台优质率下降
  const currentMachine = computeMachineStats(currentRecords);
  const previousMachine = computeMachineStats(previousRecords);
  currentMachine.forEach(cm => {
    const pm = previousMachine.find(p => p.machine === cm.machine);
    if (pm && cm.batchCount >= 5 && pm.batchCount >= 5) {
      const drop = pm.excellentRate - cm.excellentRate;
      if (drop >= 5) {
        alerts.push({
          id: `machine-${cm.machine}-down`,
          level: drop >= 10 ? 'high' : 'warning',
          message: `${cm.machine} 优质率较${range.type === 'today' ? '昨日' : '上一周期'}下降 ${drop.toFixed(1)} 个百分点。`,
          source: '机台质量',
        });
      }
    }
  });

  return alerts;
}

export function computeHealthStatus(
  currentStats: QualityStatsWithComparison,
  alerts: AlertItem[]
): HealthStatus {
  const { current, changes } = currentStats;
  const reasons: string[] = [];

  const hasHigh = alerts.some(a => a.level === 'high');
  const hasWarning = alerts.some(a => a.level === 'warning');

  if (hasHigh) {
    if (current.unqualifiedCount > 0) reasons.push(`发现 ${current.unqualifiedCount} 批不合格产品`);
    if ((current.defectsByCategory.A || 0) > 0) reasons.push('存在 A 类严重缺陷');
    return {
      status: 'abnormal',
      label: '异常',
      emoji: '🔴',
      reasons: reasons.length ? reasons : ['存在严重质量风险'],
    };
  }

  if (hasWarning || changes.excellentRatePoints <= -2 || changes.avgScore >= 1.5) {
    if (changes.excellentRatePoints <= -2) reasons.push(`优质率较上期下降 ${Math.abs(changes.excellentRatePoints).toFixed(1)} 个百分点`);
    if (changes.avgScore >= 1.5) reasons.push(`平均每批次扣分较上期上升 ${changes.avgScore.toFixed(1)} 分`);
    if (current.withIssueCount > 0) reasons.push(`${current.withIssueCount} 批合格带问题`);
    return {
      status: 'attention',
      label: '关注',
      emoji: '🟡',
      reasons: reasons.length ? reasons : ['部分质量指标出现波动'],
    };
  }

  reasons.push('合格率、优质率、扣分水平均处于正常范围');
  return {
    status: 'healthy',
    label: '健康',
    emoji: '🟢',
    reasons,
  };
}
