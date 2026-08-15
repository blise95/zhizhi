/**
 * 综合质量汇总分析 - 工具函数
 *
 * 统计口径：
 * 1. 优质率：与质量驾驶舱完全一致，使用 qualityEngine.ts 的 rateRecords 评级算法。
 *    优质率 = 评级为优等品的批次 ÷ 有效批次 × 100%
 * 2. 缺陷率 = 当期总缺陷数量 ÷（当期样本量 × 215）× 100%
 * 3. 月度按日期展示趋势，季度/半年度/年度按月份展示趋势。
 */

import { rateRecords, calculateBatchRating } from '../lib/qualityEngine';
import type { ProcessQualityRecord, DefectRecord, FilterConditions } from './analysisUtils';
import type { PhysicalTestRecord } from '../data/physicalTestTypes';
import { DefectType, getDefectFieldByType, DEFECT_RATE_BASE, formatLocalDate } from './analysisUtils';
import {
  STANDARD_INDICATORS,
  getBrandStandards,
  getIndicatorStandard,
  resolveBrandName,
  type PhysicalIndicatorKey,
} from '../services/cigarettePhysicalStandardService';

export type PeriodType = 'month' | 'quarter' | 'halfYear' | 'year';

export interface PeriodRange {
  type: PeriodType;
  year: number;
  month?: number;      // 月度专用
  quarter?: number;    // 季度专用
  half?: 1 | 2;        // 半年度专用
  from: string;
  to: string;
  label: string;
}

export interface ComprehensiveFilters extends FilterConditions {
  periodType: PeriodType;
  year: number;
  month?: number;
  quarter?: number;
  half?: 1 | 2;
}

export interface CoreMetrics {
  totalSamples: number;
  totalDefects: number;
  qualityRate: number;
  defectRate: number;
  abnormalCount: number;
  healthIndex: number;
}

export interface TrendPoint {
  label: string;
  fullLabel: string;
  sampleCount: number;
  defectCount: number;
  qualityRate: number;
  defectRate: number;
}

export interface FieldComparisonItem {
  field: string;
  fieldLabel: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;
  qualityRate: number;
}

export interface EntityComparisonItem {
  name: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;
  qualityRate: number;
}

export interface TopDefectItem {
  rank: number;
  name: string;
  location: string;
  field: string;
  fieldLabel: string;
  count: number;
  percentage: number;
}

export interface ContributionItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PeriodComparison {
  metric: string;
  label: string;
  current: number;
  previous: number;
  change: number;
  changePct: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export interface PhysicalTrendPoint {
  label: string;
  fullLabel: string;
  x: number;
  upper: number;
  lower: number;
  center: number;
}

export interface PhysicalIndicatorAnalysis {
  indicatorId: string;
  name: string;
  unit: string;
  data: PhysicalTrendPoint[];
}

export interface AIComprehensiveAnalysis {
  overallEvaluation: string;
  overallLevel: '优秀' | '良好' | '稳定' | '需关注' | '异常';
  mainProblems: string[];
  trendJudgment: string;
  risks: string[];
  suggestions: string[];
}

// ==================== 常量 ====================

const FIELD_CONFIG: { field: DefectType; label: string; color: string }[] = [
  { field: DefectType.BOX, label: '箱装', color: '#3b82f6' },
  { field: DefectType.CARTON, label: '条装', color: '#06b6d4' },
  { field: DefectType.PACK, label: '盒装', color: '#8b5cf6' },
  { field: DefectType.CIGARETTE, label: '烟支', color: '#f43f5e' },
];

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 物测指标配置统一从 public/data/cigarette_physical_standards.json 读取，
// 不再写死标准值。以下仅保留指标字段到中文名的映射。

// ==================== 周期计算 ====================

export function getDefaultComprehensiveFilters(): ComprehensiveFilters {
  const now = new Date();
  return {
    periodType: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    dateFrom: '',
    dateTo: '',
    productionPoint: '',
    brand: '',
    machine: '',
    shiftGroup: '',
    shift: '',
  };
}

export function getPeriodRange(periodType: PeriodType, year: number, subValue?: number): PeriodRange {
  switch (periodType) {
    case 'month': {
      const month = subValue ?? new Date().getMonth() + 1;
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const to = formatLocalDate(new Date(year, month, 0));
      return { type: 'month', year, month, from, to, label: `${year}年${month}月` };
    }
    case 'quarter': {
      const quarter = (subValue as 1 | 2 | 3 | 4) ?? Math.floor(new Date().getMonth() / 3) + 1;
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      const from = `${year}-${String(startMonth).padStart(2, '0')}-01`;
      const to = formatLocalDate(new Date(year, endMonth, 0));
      return { type: 'quarter', year, quarter, from, to, label: `${year}年第${quarter}季度` };
    }
    case 'halfYear': {
      const half = (subValue as 1 | 2) ?? (new Date().getMonth() < 6 ? 1 : 2);
      const from = half === 1 ? `${year}-01-01` : `${year}-07-01`;
      const to = half === 1 ? `${year}-06-30` : `${year}-12-31`;
      return { type: 'halfYear', year, half, from, to, label: `${year}年${half === 1 ? '上半年' : '下半年'}` };
    }
    case 'year': {
      return { type: 'year', year, from: `${year}-01-01`, to: `${year}-12-31`, label: `${year}年度` };
    }
  }
}

export function getPreviousPeriodRange(range: PeriodRange): PeriodRange {
  switch (range.type) {
    case 'month':
      if (range.month === 1) {
        return getPeriodRange('month', range.year - 1, 12);
      }
      return getPeriodRange('month', range.year, range.month! - 1);
    case 'quarter':
      if (range.quarter === 1) {
        return getPeriodRange('quarter', range.year - 1, 4);
      }
      return getPeriodRange('quarter', range.year, range.quarter! - 1);
    case 'halfYear':
      if (range.half === 1) {
        return getPeriodRange('halfYear', range.year - 1, 2);
      }
      return getPeriodRange('halfYear', range.year, 1);
    case 'year':
      return getPeriodRange('year', range.year - 1);
  }
}

export function getAvailablePeriodOptions(type: PeriodType, year: number): { value: number; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  switch (type) {
    case 'month':
      return Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }));
    case 'quarter':
      return [
        { value: 1, label: '第1季度' },
        { value: 2, label: '第2季度' },
        { value: 3, label: '第3季度' },
        { value: 4, label: '第4季度' },
      ];
    case 'halfYear':
      return [
        { value: 1, label: '上半年' },
        { value: 2, label: '下半年' },
      ];
    case 'year':
      // 提供前后5年
      return Array.from({ length: 11 }, (_, i) => {
        const y = currentYear - 5 + i;
        return { value: y, label: `${y}年` };
      });
  }
}

// ==================== 数据加载 ====================

export function loadPhysicalTestRecords(): PhysicalTestRecord[] {
  try {
    const data = localStorage.getItem('physicalTestRecords');
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (e) {
    console.error('加载烟支物测数据失败:', e);
    return [];
  }
}

export function loadProcessQualityData(): ProcessQualityRecord[] {
  try {
    const data = localStorage.getItem('processQualityData');
    if (data) {
      const records = JSON.parse(data);
      return records.map((record: any) => ({
        id: record.id,
        inspectionDate: record.date || record.inspectionDate,
        productionPoint: record.productionPoint,
        brand: record.brand,
        machine: record.machine,
        shiftGroup: record.shiftType || record.shiftGroup,
        shift: record.shift,
        inspector: record.recorder || record.inspector,
        batchNumber: record.tobaccoBatch || record.batchNumber,
        boxDefects: record.boxDefects || [],
        cartonDefects: record.cartonDefects || [],
        packDefects: record.packDefects || [],
        cigaretteDefects: record.cigaretteDefects || [],
        createdAt: record.createdAt || new Date().toISOString(),
      }));
    }
    return [];
  } catch (e) {
    console.error('加载过程质量数据失败:', e);
    return [];
  }
}

export function filterRecordsByConditions(
  records: ProcessQualityRecord[],
  filters: Pick<FilterConditions, 'productionPoint' | 'brand' | 'machine' | 'shiftGroup' | 'shift'>
): ProcessQualityRecord[] {
  return records.filter(record => {
    if (filters.productionPoint && record.productionPoint !== filters.productionPoint) return false;
    if (filters.brand && record.brand !== filters.brand) return false;
    if (filters.machine && record.machine !== filters.machine) return false;
    if (filters.shiftGroup && record.shiftGroup !== filters.shiftGroup) return false;
    if (filters.shift && record.shift !== filters.shift) return false;
    return true;
  });
}

export function filterPhysicalRecordsByConditions(
  records: PhysicalTestRecord[],
  filters: Pick<FilterConditions, 'productionPoint' | 'brand' | 'machine' | 'shiftGroup' | 'shift'>
): PhysicalTestRecord[] {
  return records.filter(record => {
    if (filters.productionPoint && record.productionPoint !== filters.productionPoint) return false;
    if (filters.brand && record.brand !== filters.brand) return false;
    if (filters.machine && record.machine !== filters.machine) return false;
    if (filters.shiftGroup && record.shiftType !== filters.shiftGroup) return false;
    if (filters.shift && record.shift !== filters.shift) return false;
    return true;
  });
}

// ==================== 核心指标 ====================

function countAllDefects(record: ProcessQualityRecord): number {
  let count = 0;
  (['boxDefects', 'cartonDefects', 'packDefects', 'cigaretteDefects'] as const).forEach(field => {
    const defects = record[field] as DefectRecord[] | undefined;
    if (defects) {
      count += defects.reduce((sum, d) => sum + (d.quantity || 1), 0);
    }
  });
  return count;
}

export function calculateCoreMetrics(records: ProcessQualityRecord[]): CoreMetrics {
  const totalSamples = records.length;
  const totalDefects = records.reduce((sum, r) => sum + countAllDefects(r), 0);

  let qualityRate = 0;
  let abnormalCount = 0;
  if (totalSamples > 0) {
    const ratings = rateRecords(records as any);
    const excellentCount = ratings.filter(r => r.rating === 'excellent').length;
    qualityRate = parseFloat(((excellentCount / totalSamples) * 100).toFixed(2));
    ratings.forEach(r => {
      if (r.rating === 'unqualified' || r.defectsByCategory.A > 0 || r.issueStatus === 'withIssue') {
        abnormalCount++;
      }
    });
  }

  const defectRate = totalSamples > 0
    ? parseFloat(((totalDefects / (totalSamples * DEFECT_RATE_BASE)) * 100).toFixed(2))
    : 0;

  // 质量健康指数：综合优质率和缺陷率，0-100
  const qualityScore = Math.max(0, Math.min(100, qualityRate));
  const defectScore = Math.max(0, Math.min(100, 100 - defectRate * 5)); // 缺陷率 20% 对应 0 分
  const healthIndex = parseFloat((qualityScore * 0.6 + defectScore * 0.4).toFixed(1));

  return {
    totalSamples,
    totalDefects,
    qualityRate,
    defectRate,
    abnormalCount,
    healthIndex,
  };
}

// ==================== 趋势分析 ====================

function createTrendBuckets(range: PeriodRange): { key: string; label: string; fullLabel: string; match: (date: string) => boolean }[] {
  if (range.type === 'month') {
    const from = new Date(range.from);
    const to = new Date(range.to);
    const buckets: { key: string; label: string; fullLabel: string; match: (date: string) => boolean }[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const dStr = formatLocalDate(cursor);
      buckets.push({
        key: dStr,
        label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
        fullLabel: dStr,
        match: (date: string) => date === dStr,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return buckets;
  }

  // 季度/半年度/年度均按月份聚合
  let months: number[];
  if (range.type === 'quarter') {
    const start = (range.quarter! - 1) * 3;
    months = [start + 1, start + 2, start + 3];
  } else if (range.type === 'halfYear') {
    months = range.half === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
  } else {
    months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  return months.map(m => {
    const monthStr = String(m).padStart(2, '0');
    return {
      key: `${range.year}-${monthStr}`,
      label: MONTH_LABELS[m - 1],
      fullLabel: `${range.year}年${MONTH_LABELS[m - 1]}`,
      match: (date: string) => date.startsWith(`${range.year}-${monthStr}`),
    };
  });
}

export function calculateComprehensiveTrend(records: ProcessQualityRecord[], range: PeriodRange): TrendPoint[] {
  const buckets = createTrendBuckets(range);
  return buckets.map(bucket => {
    const matched = records.filter(r => bucket.match(r.inspectionDate));
    const metrics = calculateCoreMetrics(matched);
    return {
      label: bucket.label,
      fullLabel: bucket.fullLabel,
      sampleCount: metrics.totalSamples,
      defectCount: metrics.totalDefects,
      qualityRate: metrics.qualityRate,
      defectRate: metrics.defectRate,
    };
  });
}

// ==================== 四大领域对比 ====================

export function calculateFieldComparison(records: ProcessQualityRecord[]): FieldComparisonItem[] {
  return FIELD_CONFIG.map(({ field, label, color }) => {
    const fieldKey = getDefectFieldByType(field);
    const sampleCount = records.length;
    let defectCount = 0;
    records.forEach(r => {
      const defects = r[fieldKey] as DefectRecord[] | undefined;
      if (defects) {
        defectCount += defects.reduce((sum, d) => sum + (d.quantity || 1), 0);
      }
    });

    let qualityRate = 0;
    if (sampleCount > 0) {
      const ratings = rateRecords(records as any);
      // 该领域优质率：以整批评级为准（与驾驶舱一致）
      const excellentCount = ratings.filter(r => r.rating === 'excellent').length;
      qualityRate = parseFloat(((excellentCount / sampleCount) * 100).toFixed(2));
    }

    return {
      field: label,
      fieldLabel: label,
      sampleCount,
      defectCount,
      defectRate: sampleCount > 0
        ? parseFloat(((defectCount / (sampleCount * DEFECT_RATE_BASE)) * 100).toFixed(2))
        : 0,
      qualityRate,
    };
  });
}

// ==================== 实体对比（生产点/机台） ====================

function calculateEntityComparison(
  records: ProcessQualityRecord[],
  groupKey: (r: ProcessQualityRecord) => string
): EntityComparisonItem[] {
  const map = new Map<string, ProcessQualityRecord[]>();
  records.forEach(r => {
    const key = groupKey(r) || '未知';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  return Array.from(map.entries())
    .map(([name, group]) => {
      const metrics = calculateCoreMetrics(group);
      return {
        name,
        sampleCount: metrics.totalSamples,
        defectCount: metrics.totalDefects,
        defectRate: metrics.defectRate,
        qualityRate: metrics.qualityRate,
      };
    })
    .sort((a, b) => b.sampleCount - a.sampleCount || b.qualityRate - a.qualityRate);
}

export function calculateProductionPointComparison(records: ProcessQualityRecord[]): EntityComparisonItem[] {
  return calculateEntityComparison(records, r => r.productionPoint);
}

export function calculateMachineComparison(records: ProcessQualityRecord[]): EntityComparisonItem[] {
  return calculateEntityComparison(records, r => r.machine)
    .sort((a, b) => b.qualityRate - a.qualityRate || a.defectRate - b.defectRate);
}

// ==================== 全局缺陷 TOP10 ====================

export function calculateGlobalTopDefects(records: ProcessQualityRecord[], topN: number = 10): TopDefectItem[] {
  const map = new Map<string, TopDefectItem & { _totalCount: number }>();
  let totalDefects = 0;

  FIELD_CONFIG.forEach(({ field, label: fieldLabel }) => {
    const fieldKey = getDefectFieldByType(field);
    records.forEach(r => {
      const defects = r[fieldKey] as DefectRecord[] | undefined;
      if (!defects) return;
      defects.forEach(d => {
        const qty = d.quantity || 1;
        totalDefects += qty;
        const key = `${fieldLabel}::${d.location}::${d.defectName}`;
        const existing = map.get(key);
        if (existing) {
          existing.count += qty;
        } else {
          map.set(key, {
            rank: 0,
            name: d.defectName,
            location: d.location,
            field: fieldLabel,
            fieldLabel,
            count: qty,
            percentage: 0,
            _totalCount: 0,
          });
        }
      });
    });
  });

  return Array.from(map.values())
    .map(item => ({
      ...item,
      percentage: totalDefects > 0 ? parseFloat(((item.count / totalDefects) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ==================== 质量问题贡献分析 ====================

export function calculateContribution(records: ProcessQualityRecord[]): ContributionItem[] {
  const totalDefects = records.reduce((sum, r) => sum + countAllDefects(r), 0);

  return FIELD_CONFIG.map(({ field, label, color }) => {
    const fieldKey = getDefectFieldByType(field);
    let count = 0;
    records.forEach(r => {
      const defects = r[fieldKey] as DefectRecord[] | undefined;
      if (defects) {
        count += defects.reduce((sum, d) => sum + (d.quantity || 1), 0);
      }
    });
    return {
      name: label,
      value: count,
      percentage: totalDefects > 0 ? parseFloat(((count / totalDefects) * 100).toFixed(2)) : 0,
      color,
    };
  }).filter(item => item.value > 0);
}

// ==================== 周期对比 ====================

export function calculatePeriodComparison(
  currentRecords: ProcessQualityRecord[],
  previousRecords: ProcessQualityRecord[]
): PeriodComparison[] {
  const current = calculateCoreMetrics(currentRecords);
  const previous = calculateCoreMetrics(previousRecords);

  const safePct = (now: number, prev: number) =>
    prev === 0 ? (now > 0 ? 100 : 0) : parseFloat((((now - prev) / prev) * 100).toFixed(1));

  const defineTrend = (change: number, isRate: boolean) => {
    const threshold = isRate ? 0.5 : 1;
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'up' : 'down';
  };

  // 优质率变化：上升=改善；缺陷率变化：上升=恶化
  const qualityTrend = current.qualityRate - previous.qualityRate >= 0 ? 'up' : 'down';
  const defectTrend = current.defectRate - previous.defectRate > 0 ? 'down' : 'up';

  return [
    {
      metric: 'totalSamples',
      label: '抽检样本数',
      current: current.totalSamples,
      previous: previous.totalSamples,
      change: current.totalSamples - previous.totalSamples,
      changePct: safePct(current.totalSamples, previous.totalSamples),
      trend: defineTrend(current.totalSamples - previous.totalSamples, false),
      unit: '个',
    },
    {
      metric: 'totalDefects',
      label: '缺陷数',
      current: current.totalDefects,
      previous: previous.totalDefects,
      change: current.totalDefects - previous.totalDefects,
      changePct: safePct(current.totalDefects, previous.totalDefects),
      trend: current.totalDefects - previous.totalDefects > 0 ? 'down' : 'up',
      unit: '个',
    },
    {
      metric: 'qualityRate',
      label: '优质率',
      current: current.qualityRate,
      previous: previous.qualityRate,
      change: parseFloat((current.qualityRate - previous.qualityRate).toFixed(2)),
      changePct: parseFloat((current.qualityRate - previous.qualityRate).toFixed(2)),
      trend: qualityTrend,
      unit: '%',
    },
    {
      metric: 'defectRate',
      label: '缺陷率',
      current: current.defectRate,
      previous: previous.defectRate,
      change: parseFloat((current.defectRate - previous.defectRate).toFixed(2)),
      changePct: parseFloat((current.defectRate - previous.defectRate).toFixed(2)),
      trend: defectTrend,
      unit: '%',
    },
  ];
}

// ==================== 烟支物测指标分析 ====================

function createPhysicalBuckets(range: PeriodRange): { key: string; label: string; fullLabel: string; match: (date: string) => boolean }[] {
  return createTrendBuckets(range);
}

function parsePhysicalValue(value: string | number | undefined): number | null {
  if (value === undefined || value === '' || value === null) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? null : num;
}

export function calculatePhysicalIndicatorAnalysis(
  records: PhysicalTestRecord[],
  range: PeriodRange
): PhysicalIndicatorAnalysis[] {
  const buckets = createPhysicalBuckets(range);

  // 取参考牌号：优先使用 records 中第一条记录的牌号（通常筛选后一致）
  const referenceBrand = records.length > 0 ? resolveBrandName(records[0].brand) : null;
  const brandStd = referenceBrand ? getBrandStandards(referenceBrand) : null;

  return STANDARD_INDICATORS.map((indicator) => {
    const std = brandStd?.indicators[indicator.key as PhysicalIndicatorKey];
    const center = std?.standard.value ?? 0;
    const upper = std?.standard.max ?? 0;
    const lower = std?.standard.min ?? 0;

    const data: PhysicalTrendPoint[] = buckets.map(bucket => {
      const matched = records.filter(r => bucket.match(r.date));
      const values = matched
        .map(r => parsePhysicalValue((r as any)[indicator.key]?.x))
        .filter((v): v is number => v !== null);

      const avgX = values.length > 0
        ? parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(3))
        : center;

      return {
        label: bucket.label,
        fullLabel: bucket.fullLabel,
        x: avgX,
        upper,
        lower,
        center,
      };
    });

    return {
      indicatorId: indicator.key,
      name: indicator.name,
      unit: indicator.unit,
      data,
    };
  });
}

// ==================== AI 综合评价 ====================

export function generateAIComprehensiveAnalysis(
  metrics: CoreMetrics,
  trend: TrendPoint[],
  fieldComparison: FieldComparisonItem[],
  productionPointComparison: EntityComparisonItem[],
  machineComparison: EntityComparisonItem[],
  topDefects: TopDefectItem[],
  contribution: ContributionItem[],
  periodComparison: PeriodComparison[],
  physicalAnalysis: PhysicalIndicatorAnalysis[]
): AIComprehensiveAnalysis {
  const mainProblems: string[] = [];
  const risks: string[] = [];
  const suggestions: string[] = [];

  if (metrics.totalSamples === 0) {
    return {
      overallEvaluation: '当前筛选条件下暂无质量数据，无法生成综合评价。',
      overallLevel: '稳定',
      mainProblems: ['当前筛选条件暂无足够质量数据。'],
      trendJudgment: '暂无趋势数据。',
      risks: [],
      suggestions: ['建议先在过程质量管控中录入数据，或放宽筛选条件。'],
    };
  }

  // 整体评价
  let overallLevel: AIComprehensiveAnalysis['overallLevel'] = '优秀';
  if (metrics.qualityRate < 70 || metrics.defectRate > 10 || metrics.healthIndex < 60) {
    overallLevel = '异常';
  } else if (metrics.qualityRate < 85 || metrics.defectRate > 5 || metrics.healthIndex < 75) {
    overallLevel = '需关注';
  } else if (metrics.qualityRate < 95 || metrics.defectRate > 2 || metrics.healthIndex < 85) {
    overallLevel = '稳定';
  } else if (metrics.qualityRate < 98) {
    overallLevel = '良好';
  }

  const overallEvaluation =
    `当前统计周期内共抽检 ${metrics.totalSamples} 个样本，发现 ${metrics.totalDefects} 个缺陷，` +
    `优质率 ${metrics.qualityRate}%，缺陷率 ${metrics.defectRate}%，质量健康指数 ${metrics.healthIndex}。` +
    `整体质量水平判定为「${overallLevel}」。`;

  // 主要问题识别
  mainProblems.push(`当前周期内总缺陷数为 ${metrics.totalDefects}，缺陷率 ${metrics.defectRate}%。`);

  if (topDefects.length > 0) {
    const top = topDefects[0];
    mainProblems.push(`全局主要缺陷为「${top.name}」（${top.field}），累计 ${top.count} 次，占全部缺陷的 ${top.percentage}%。`);
  }

  const worstField = fieldComparison.slice().sort((a, b) => b.defectRate - a.defectRate)[0];
  if (worstField && worstField.defectCount > 0) {
    mainProblems.push(`四大质量领域中，${worstField.fieldLabel}缺陷率最高（${worstField.defectRate}%），是当前质量问题的重点区域。`);
  }

  if (machineComparison.length > 1) {
    const worstMachine = machineComparison[machineComparison.length - 1];
    if (worstMachine.defectCount > 0) {
      mainProblems.push(`${worstMachine.name} 机台质量表现相对较弱，缺陷率 ${worstMachine.defectRate}%，建议重点关注。`);
    }
  }

  if (productionPointComparison.length > 1) {
    const worstPoint = productionPointComparison.slice().sort((a, b) => a.qualityRate - b.qualityRate)[0];
    if (worstPoint.defectCount > 0) {
      mainProblems.push(`${worstPoint.name} 优质率相对较低（${worstPoint.qualityRate}%），需针对性提升。`);
    }
  }

  // 趋势判断
  let trendJudgment = '当前周期内质量趋势保持稳定。';
  if (trend.length >= 2) {
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));
    const firstDefectRate = firstHalf.reduce((s, d) => s + d.defectRate, 0) / firstHalf.length || 0;
    const secondDefectRate = secondHalf.reduce((s, d) => s + d.defectRate, 0) / secondHalf.length || 0;
    const firstQuality = firstHalf.reduce((s, d) => s + d.qualityRate, 0) / firstHalf.length || 0;
    const secondQuality = secondHalf.reduce((s, d) => s + d.qualityRate, 0) / secondHalf.length || 0;

    if (secondDefectRate > firstDefectRate * 1.2 && secondQuality < firstQuality * 0.98) {
      trendJudgment = '近期缺陷率上升且优质率下降，质量呈现恶化趋势，需立即排查。';
    } else if (secondDefectRate < firstDefectRate * 0.8 && secondQuality > firstQuality * 1.01) {
      trendJudgment = '近期缺陷率下降且优质率提升，质量呈现持续改善趋势。';
    } else if (Math.abs(secondDefectRate - firstDefectRate) > firstDefectRate * 0.15) {
      trendJudgment = '近期质量指标波动较大，需关注过程稳定性。';
    }
  }

  // 风险识别
  if (metrics.qualityRate < 85) risks.push('优质率低于85%，存在质量等级下滑风险。');
  if (metrics.defectRate > 5) risks.push(`缺陷率达到${metrics.defectRate}%，超过5%警戒线。`);
  if (metrics.abnormalCount > 0) risks.push(`发现 ${metrics.abnormalCount} 批异常批次（含不合格/A类/合格带问题）。`);

  physicalAnalysis.forEach(indicator => {
    const outOfRange = indicator.data.some(d => d.x > d.upper || d.x < d.lower);
    if (outOfRange) {
      risks.push(`${indicator.name}存在超出标准上下限的检测值，需校准设备或调整工艺参数。`);
    }
  });

  if (risks.length === 0) risks.push('当前周期内未识别出重大质量风险。');

  // 改进建议
  if (worstField && worstField.defectCount > 0) {
    suggestions.push(`针对${worstField.fieldLabel}缺陷高发问题，开展专项工艺排查与整改。`);
  }
  if (topDefects.length > 0 && (topDefects[0].category === 'A' || topDefects[0].category === 'B')) {
    suggestions.push(`优先整改「${topDefects[0].name}」等${topDefects[0].category}类缺陷，建立专项防控清单。`);
  }
  if (machineComparison.length > 0 && machineComparison[machineComparison.length - 1].defectCount > 0) {
    const weakMachine = machineComparison[machineComparison.length - 1];
    suggestions.push(`加强对 ${weakMachine.name} 机台的点检与参数监控，必要时安排停机维保。`);
  }
  if (metrics.qualityRate < 90) {
    suggestions.push('以提升优等品率为核心目标，完善缺陷识别→扣分→评级→改进的闭环管理。');
  }
  if (suggestions.length === 0) {
    suggestions.push('当前质量指标整体平稳，建议继续保持现有管控措施并持续监控趋势。');
  }

  return {
    overallEvaluation,
    overallLevel,
    mainProblems,
    trendJudgment,
    risks,
    suggestions,
  };
}
