/**
 * AI质量趋势预测 - 工具函数
 *
 * 核心原则：
 * 1. 所有预测必须基于系统真实历史数据，禁止凭空生成。
 * 2. 优质率计算与质量驾驶舱完全一致，使用 qualityEngine.ts 的 rateRecords 评级算法。
 * 3. 缺陷率 = 当期总缺陷数 ÷（当期样本量 × 215）× 100%。
 * 4. 预测模型采用时间序列趋势外推（线性回归 + 指数平滑），并在历史数据不足时给出可信度提示。
 */

import { rateRecords } from '../lib/qualityEngine';
import {
  type ProcessQualityRecord,
  type DefectRecord,
  DefectType,
  getDefectFieldByType,
  DEFECT_RATE_BASE,
  formatLocalDate,
  loadProcessQualityData,
} from './analysisUtils';
import type { PhysicalTestRecord } from '../data/physicalTestTypes';
import {
  PHYSICAL_INDICATOR_KEYS,
  getIndicatorStandard,
  resolveBrandName,
  getAllBrands,
  PHYSICAL_INDICATOR_LABELS,
  PHYSICAL_INDICATOR_UNITS,
} from '../services/cigarettePhysicalStandardService';

export type PredictionTarget =
  | 'comprehensive'
  | 'box'
  | 'carton'
  | 'pack'
  | 'cigarette'
  | 'machine'
  | 'brand'
  | 'productionPoint'
  | 'physical';

export type ForecastDays = 7 | 14 | 30;

export type RiskLevel = '低' | '中' | '较高' | '高';

export interface AIPredictionFilters {
  predictionTarget: PredictionTarget;
  productionPoint: string;
  brand: string;
  machine: string;
  shiftGroup: string;
  shift: string;
  forecastDays: ForecastDays;
}

export interface DailyMetricPoint {
  date: string;
  fullLabel: string;
  sampleCount: number;
  defectCount: number;
  qualityRate: number;
  defectRate: number;
  isActual: boolean;
}

export interface ForecastPoint {
  date: string;
  label: string;
  qualityRate?: number;
  defectRate?: number;
  defectCount?: number;
  value?: number; // 物测指标用
  isActual: boolean;
}

export interface PredictionOverview {
  currentStatus: '优秀' | '良好' | '稳定' | '关注' | '异常';
  futureTrend: '改善' | '稳定' | '恶化';
  riskLevel: RiskLevel;
  topProblem: string;
  focusMachine: string;
  predictedRiskCount: number;
  confidence: number;
  confidenceLevel: '高' | '中' | '低';
  dataWarning?: string;
}

export interface QualityRatePrediction {
  currentRate: number;
  predictedRate: number;
  change: number;
  riskLevel: RiskLevel;
  warning?: string;
}

export interface DefectRatePrediction {
  currentRate: number;
  predictedRate: number;
  change: number;
  trend: '上升' | '下降' | '稳定' | '异常波动';
  riskLevel: RiskLevel;
  warning?: string;
}

export interface FutureDefectRisk {
  rank: number;
  name: string;
  location: string;
  field: string;
  fieldLabel: string;
  historyCount: number;
  recentCount: number;
  historyTrend: '↑' | '↓' | '→';
  forecastTrend: '预计增加' | '预计减少' | '基本稳定';
  riskLevel: RiskLevel;
  growthRate: number;
}

export interface MachineRiskItem {
  rank: number;
  machine: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;
  qualityRate: number;
  recentDefectTrend: '↑' | '↓' | '→';
  mainRisk: string;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
}

export interface BrandRiskItem {
  rank: number;
  brand: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;
  qualityRate: number;
  riskLevel: RiskLevel;
  mainProblem: string;
  reason: string;
}

export interface ProductionPointRiskItem {
  rank: number;
  name: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;
  qualityRate: number;
  riskLevel: RiskLevel;
  mainProblem: string;
  reason: string;
}

export interface PhysicalIndicatorPrediction {
  indicatorId: string;
  name: string;
  unit: string;
  center: number;
  upper: number;
  lower: number;
  data: ForecastPoint[];
  currentValue: number;
  predictedValue: number;
  trend: '上升' | '下降' | '稳定';
  distanceToUpper: number;
  distanceToLower: number;
  riskLevel: RiskLevel;
  warning?: string;
}

export interface AbnormalCombination {
  riskLevel: RiskLevel;
  combination: string;
  description: string;
  reason: string;
}

export interface RiskAlert {
  id: string;
  level: RiskLevel;
  object: string;
  reason: string;
  forecastTime: string;
  measure: string;
}

export interface AIPredictionResult {
  overview: PredictionOverview;
  qualityRatePrediction: QualityRatePrediction;
  defectRatePrediction: DefectRatePrediction;
  comprehensiveTrend: ForecastPoint[];
  futureDefectRisks: FutureDefectRisk[];
  machineRisks: MachineRiskItem[];
  brandRisks: BrandRiskItem[];
  productionPointRisks: ProductionPointRiskItem[];
  physicalPredictions: PhysicalIndicatorPrediction[];
  abnormalCombinations: AbnormalCombination[];
  alerts: RiskAlert[];
  reasons: string[];
  suggestions: string[];
}

// 物测指标标准统一从 cigarettePhysicalStandardService 读取
// 不再写死任何指标中心值、上下限或单位

const FIELD_CONFIG: { field: DefectType; label: string }[] = [
  { field: DefectType.BOX, label: '箱装' },
  { field: DefectType.CARTON, label: '条装' },
  { field: DefectType.PACK, label: '盒装' },
  { field: DefectType.CIGARETTE, label: '烟支' },
];

// ==================== 默认筛选 ====================

export function getDefaultAIPredictionFilters(): AIPredictionFilters {
  return {
    predictionTarget: 'comprehensive',
    productionPoint: '',
    brand: '',
    machine: '',
    shiftGroup: '',
    shift: '',
    forecastDays: 7,
  };
}

export function filterRecordsByConditions(
  records: ProcessQualityRecord[],
  filters: Pick<AIPredictionFilters, 'productionPoint' | 'brand' | 'machine' | 'shiftGroup' | 'shift'>
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
  filters: Pick<AIPredictionFilters, 'productionPoint' | 'brand' | 'machine' | 'shiftGroup' | 'shift'>
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

// ==================== 数据加载（统一入口） ====================

export { loadProcessQualityData };

export async function loadPhysicalTestRecords(): Promise<PhysicalTestRecord[]> {
  const { listTypedRecords, RECORD_TYPE } = await import('../services/qualityData');
  try {
    return await listTypedRecords<PhysicalTestRecord>(RECORD_TYPE.PHYSICAL);
  } catch (e) {
    console.error('加载烟支物测数据失败:', e);
    return [];
  }
}

// ==================== 统计计算 ====================

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

function countFieldDefects(record: ProcessQualityRecord, field: DefectType): number {
  const key = getDefectFieldByType(field);
  const defects = record[key] as DefectRecord[] | undefined;
  return defects ? defects.reduce((sum, d) => sum + (d.quantity || 1), 0) : 0;
}

export function calculateMetrics(records: ProcessQualityRecord[]) {
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

  return {
    totalSamples,
    totalDefects,
    qualityRate,
    defectRate,
    abnormalCount,
  };
}

// ==================== 时间序列工具 ====================

function getLastNDays(n: number, endDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(formatLocalDate(d));
  }
  return dates;
}

function getFutureNDays(n: number, startDate: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(formatLocalDate(d));
  }
  return dates;
}

function createDailyBuckets(endDate: Date, days: number): { date: string; label: string }[] {
  return getLastNDays(days, endDate).map(date => ({
    date,
    label: date.slice(5),
  }));
}

function calculateDailyMetrics(
  records: ProcessQualityRecord[],
  field: DefectType | 'all',
  endDate: Date,
  days: number
): DailyMetricPoint[] {
  const buckets = createDailyBuckets(endDate, days);
  return buckets
    .map(bucket => {
      const matched = records.filter(r => r.inspectionDate === bucket.date);
      const sampleCount = matched.length;
      if (sampleCount === 0) return null;

      const defectCount = field === 'all'
        ? matched.reduce((sum, r) => sum + countAllDefects(r), 0)
        : matched.reduce((sum, r) => sum + countFieldDefects(r, field), 0);

      const ratings = rateRecords(matched as any);
      const excellentCount = ratings.filter(r => r.rating === 'excellent').length;
      const qualityRate = parseFloat(((excellentCount / sampleCount) * 100).toFixed(2));
      const defectRate = parseFloat(((defectCount / (sampleCount * DEFECT_RATE_BASE)) * 100).toFixed(2));

      return {
        date: bucket.date,
        fullLabel: bucket.date,
        sampleCount,
        defectCount,
        qualityRate,
        defectRate,
        isActual: true,
      };
    })
    .filter((d): d is DailyMetricPoint => d !== null);
}

// ==================== 预测算法 ====================

/**
 * 简单线性回归：y = a + bx
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, i) => a + i * values[i], 0);
  const sumXX = x.reduce((a, i) => a + i * i, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const meanY = sumY / n;
  const ssTot = values.reduce((a, v) => a + (v - meanY) ** 2, 0);
  const ssRes = values.reduce((a, v, i) => a + (v - (intercept + slope * i)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

function exponentialSmoothing(values: number[], alpha = 0.3): number[] {
  if (values.length === 0) return [];
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function forecastSeries(
  actualValues: number[],
  steps: number,
  options: { min?: number; max?: number } = {}
): number[] {
  const n = actualValues.length;
  if (n === 0) return Array(steps).fill(0);

  const { slope, intercept } = linearRegression(actualValues);
  const smoothed = exponentialSmoothing(actualValues);
  const lastSmoothed = smoothed[smoothed.length - 1];
  const lastIndex = n - 1;

  const forecast: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const trend = intercept + slope * (lastIndex + i);
    // 组合线性趋势与指数平滑
    const combined = trend * 0.6 + lastSmoothed * 0.4;
    let value = combined;
    if (options.min !== undefined) value = Math.max(value, options.min);
    if (options.max !== undefined) value = Math.min(value, options.max);
    forecast.push(parseFloat(value.toFixed(2)));
  }
  return forecast;
}

function determineTrend(values: number[]): '上升' | '下降' | '稳定' | '异常波动' {
  if (values.length < 4) return '稳定';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const std = Math.sqrt(secondHalf.reduce((a, v) => a + (v - secondAvg) ** 2, 0) / secondHalf.length);

  if (std > Math.abs(secondAvg) * 0.3 && std > 0.5) return '异常波动';
  if (secondAvg > firstAvg * 1.15) return '上升';
  if (secondAvg < firstAvg * 0.85) return '下降';
  return '稳定';
}

function determineArrowTrend(values: number[]): '↑' | '↓' | '→' {
  if (values.length < 4) return '→';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;
  if (firstAvg === 0) return secondAvg > 0 ? '↑' : '→';
  if (secondAvg > firstAvg * 1.2) return '↑';
  if (secondAvg < firstAvg * 0.8) return '↓';
  return '→';
}

// ==================== 核心预测结果 ====================

export function predictQualityRate(
  records: ProcessQualityRecord[],
  forecastDays: number
): QualityRatePrediction {
  const current = calculateMetrics(records);
  const daily = calculateDailyMetrics(records, 'all', new Date(), 60);
  const rates = daily.map(d => d.qualityRate).filter(v => !isNaN(v));

  if (rates.length < 3) {
    return {
      currentRate: current.qualityRate,
      predictedRate: current.qualityRate,
      change: 0,
      riskLevel: '低',
      warning: undefined,
    };
  }

  const predicted = forecastSeries(rates, forecastDays, { min: 0, max: 100 });
  const predictedRate = predicted[predicted.length - 1];
  const change = parseFloat((predictedRate - current.qualityRate).toFixed(2));

  let riskLevel: RiskLevel = '低';
  let warning: string | undefined;
  if (change < -5 || predictedRate < 80) {
    riskLevel = '高';
    warning = '优质率预测显著下降，建议立即排查影响优质率的关键缺陷。';
  } else if (change < -2 || predictedRate < 90) {
    riskLevel = '中';
    warning = '优质率预测呈下降趋势，建议加强过程监控。';
  }

  return {
    currentRate: current.qualityRate,
    predictedRate,
    change,
    riskLevel,
    warning,
  };
}

export function predictDefectRate(
  records: ProcessQualityRecord[],
  forecastDays: number
): DefectRatePrediction {
  const current = calculateMetrics(records);
  const daily = calculateDailyMetrics(records, 'all', new Date(), 60);
  const rates = daily.map(d => d.defectRate).filter(v => !isNaN(v));

  if (rates.length < 3) {
    return {
      currentRate: current.defectRate,
      predictedRate: current.defectRate,
      change: 0,
      trend: '稳定',
      riskLevel: '低',
    };
  }

  const predicted = forecastSeries(rates, forecastDays, { min: 0 });
  const predictedRate = predicted[predicted.length - 1];
  const change = parseFloat((predictedRate - current.defectRate).toFixed(2));
  const trend = determineTrend(rates);

  let riskLevel: RiskLevel = '低';
  let warning: string | undefined;
  if (trend === '上升' && change > 2) {
    riskLevel = '高';
    warning = '缺陷率预测明显上升，未来质量风险较高。';
  } else if (trend === '上升' && change > 0.5) {
    riskLevel = '中';
    warning = '缺陷率预测呈上升趋势，建议提前关注。';
  }

  return {
    currentRate: current.defectRate,
    predictedRate,
    change,
    trend,
    riskLevel,
    warning,
  };
}

// ==================== 综合质量趋势预测图 ====================

export function calculateComprehensiveTrendPrediction(
  records: ProcessQualityRecord[],
  forecastDays: number
): ForecastPoint[] {
  const daily = calculateDailyMetrics(records, 'all', new Date(), 90);
  const actualRates = daily.map(d => d.qualityRate);
  const actualDefectRates = daily.map(d => d.defectRate);

  const predictedRates = forecastSeries(actualRates, forecastDays, { min: 0, max: 100 });
  const predictedDefectRates = forecastSeries(actualDefectRates, forecastDays, { min: 0 });
  const futureDates = getFutureNDays(forecastDays);

  const actualPoints: ForecastPoint[] = daily.map(d => ({
    date: d.date,
    label: d.date.slice(5),
    qualityRate: d.qualityRate,
    defectRate: d.defectRate,
    defectCount: d.defectCount,
    isActual: true,
  }));

  const futurePoints: ForecastPoint[] = futureDates.map((date, i) => ({
    date,
    label: date.slice(5),
    qualityRate: predictedRates[i],
    defectRate: predictedDefectRates[i],
    isActual: false,
  }));

  return [...actualPoints, ...futurePoints];
}

// ==================== 未来缺陷风险 TOP10 ====================

export function predictFutureDefectRisks(
  records: ProcessQualityRecord[],
  forecastDays: number
): FutureDefectRisk[] {
  const endDate = new Date();
  const recentEnd = formatLocalDate(endDate);
  const recentStartDate = new Date(endDate);
  recentStartDate.setDate(recentStartDate.getDate() - 14);
  const recentStart = formatLocalDate(recentStartDate);

  const previousEndDate = new Date(recentStartDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - 14);
  const previousStart = formatLocalDate(previousStartDate);

  const map = new Map<string, FutureDefectRisk & { _recent: number; _history: number }>();

  records.forEach(record => {
    FIELD_CONFIG.forEach(({ field, label: fieldLabel }) => {
      const key = getDefectFieldByType(field);
      const defects = record[key] as DefectRecord[] | undefined;
      if (!defects) return;
      defects.forEach(d => {
        const qty = d.quantity || 1;
        const mapKey = `${fieldLabel}::${d.defectName}::${d.location}`;
        let item = map.get(mapKey);
        if (!item) {
          item = {
            rank: 0,
            name: d.defectName,
            location: d.location,
            field: field as string,
            fieldLabel,
            historyCount: 0,
            recentCount: 0,
            historyTrend: '→',
            forecastTrend: '基本稳定',
            riskLevel: '低',
            growthRate: 0,
            _recent: 0,
            _history: 0,
          };
          map.set(mapKey, item);
        }
        item.historyCount += qty;
        if (record.inspectionDate >= recentStart && record.inspectionDate <= recentEnd) {
          item._recent += qty;
        } else if (record.inspectionDate >= previousStart && record.inspectionDate <= formatLocalDate(previousEndDate)) {
          item._history += qty;
        }
      });
    });
  });

  const results = Array.from(map.values())
    .map(item => {
      const recent = item._recent;
      const history = item._history;
      const growthRate = history > 0
        ? parseFloat((((recent - history) / history) * 100).toFixed(1))
        : recent > 0 ? 100 : 0;

      item.recentCount = recent;
      item.historyTrend = recent > history * 1.2 ? '↑' : recent < history * 0.8 ? '↓' : '→';

      if (recent > history * 1.3 && recent >= 2) {
        item.forecastTrend = '预计增加';
        item.riskLevel = growthRate > 100 ? '高' : '较高';
      } else if (recent < history * 0.7) {
        item.forecastTrend = '预计减少';
        item.riskLevel = '低';
      } else {
        item.forecastTrend = '基本稳定';
        item.riskLevel = recent >= 3 ? '中' : '低';
      }
      item.growthRate = growthRate;
      return item;
    })
    .filter(item => item.historyCount > 0 || item.recentCount > 0)
    .sort((a, b) => {
      const riskWeight = { 高: 4, 较高: 3, 中: 2, 低: 1 };
      if (riskWeight[b.riskLevel] !== riskWeight[a.riskLevel]) {
        return riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      }
      return b.growthRate - a.growthRate;
    })
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return results;
}

// ==================== 机台风险预测 ====================

export function predictMachineRisks(
  records: ProcessQualityRecord[],
  forecastDays: number
): MachineRiskItem[] {
  const machineMap = new Map<string, ProcessQualityRecord[]>();
  records.forEach(r => {
    const key = r.machine || '未知机台';
    if (!machineMap.has(key)) machineMap.set(key, []);
    machineMap.get(key)!.push(r);
  });

  const results: MachineRiskItem[] = [];
  machineMap.forEach((group, machine) => {
    const metrics = calculateMetrics(group);
    const daily = calculateDailyMetrics(group, 'all', new Date(), 30);
    const defectCounts = daily.map(d => d.defectCount);
    const recentTrend = determineArrowTrend(defectCounts);

    // 风险评分：0-100
    let riskScore = 0;
    if (metrics.qualityRate < 85) riskScore += 30;
    if (metrics.qualityRate < 70) riskScore += 20;
    if (metrics.defectRate > 5) riskScore += 25;
    if (metrics.defectRate > 10) riskScore += 15;
    if (recentTrend === '↑') riskScore += 20;
    if (metrics.abnormalCount > 0) riskScore += 10;
    riskScore = Math.min(100, riskScore);

    let riskLevel: RiskLevel = '低';
    if (riskScore >= 70) riskLevel = '高';
    else if (riskScore >= 50) riskLevel = '较高';
    else if (riskScore >= 30) riskLevel = '中';

    let mainRisk = '整体质量稳定';
    if (recentTrend === '↑') mainRisk = '缺陷呈上升趋势';
    else if (metrics.defectRate > 5) mainRisk = '缺陷率偏高';
    else if (metrics.qualityRate < 85) mainRisk = '优质率偏低';

    let reason = `${machine} 机台当前优质率 ${metrics.qualityRate}%，缺陷率 ${metrics.defectRate}%。`;
    if (recentTrend === '↑') {
      reason += '近期缺陷数量呈上升趋势，未来质量风险增加。';
    } else if (recentTrend === '↓') {
      reason += '近期缺陷数量呈下降趋势，质量持续改善。';
    } else {
      reason += '近期缺陷数量保持稳定。';
    }

    results.push({
      rank: 0,
      machine,
      sampleCount: metrics.totalSamples,
      defectCount: metrics.totalDefects,
      defectRate: metrics.defectRate,
      qualityRate: metrics.qualityRate,
      recentDefectTrend: recentTrend,
      mainRisk,
      riskLevel,
      riskScore,
      reason,
    });
  });

  return results
    .sort((a, b) => b.riskScore - a.riskScore || b.defectRate - a.defectRate)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ==================== 牌号风险预测 ====================

export function predictBrandRisks(records: ProcessQualityRecord[]): BrandRiskItem[] {
  const brandMap = new Map<string, ProcessQualityRecord[]>();
  records.forEach(r => {
    const key = r.brand || '未知牌号';
    if (!brandMap.has(key)) brandMap.set(key, []);
    brandMap.get(key)!.push(r);
  });

  const results: BrandRiskItem[] = [];
  brandMap.forEach((group, brand) => {
    const metrics = calculateMetrics(group);
    const daily = calculateDailyMetrics(group, 'all', new Date(), 30);
    const defectRates = daily.map(d => d.defectRate);
    const trend = determineTrend(defectRates);

    let riskLevel: RiskLevel = '低';
    if (metrics.qualityRate < 70 || (trend === '上升' && metrics.defectRate > 5)) riskLevel = '高';
    else if (metrics.qualityRate < 85 || (trend === '上升' && metrics.defectRate > 2)) riskLevel = '中';

    let mainProblem = '整体质量稳定';
    if (trend === '上升') mainProblem = '缺陷率呈上升趋势';
    else if (metrics.defectRate > 5) mainProblem = '缺陷率偏高';
    else if (metrics.qualityRate < 85) mainProblem = '优质率偏低';

    const reason = `${brand} 当前优质率 ${metrics.qualityRate}%，缺陷率 ${metrics.defectRate}%。` +
      (trend === '上升' ? '近期缺陷率呈上升趋势，未来存在质量波动风险。' : '近期质量趋势保持稳定。');

    results.push({
      rank: 0,
      brand,
      sampleCount: metrics.totalSamples,
      defectCount: metrics.totalDefects,
      defectRate: metrics.defectRate,
      qualityRate: metrics.qualityRate,
      riskLevel,
      mainProblem,
      reason,
    });
  });

  return results
    .sort((a, b) => {
      const riskWeight = { 高: 3, 中: 2, 低: 1 };
      if (riskWeight[b.riskLevel] !== riskWeight[a.riskLevel]) {
        return riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      }
      return b.defectRate - a.defectRate;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ==================== 合作生产点风险预测 ====================

export function predictProductionPointRisks(records: ProcessQualityRecord[]): ProductionPointRiskItem[] {
  const pointMap = new Map<string, ProcessQualityRecord[]>();
  records.forEach(r => {
    const key = r.productionPoint || '未知生产点';
    if (!pointMap.has(key)) pointMap.set(key, []);
    pointMap.get(key)!.push(r);
  });

  const results: ProductionPointRiskItem[] = [];
  pointMap.forEach((group, name) => {
    const metrics = calculateMetrics(group);
    const daily = calculateDailyMetrics(group, 'all', new Date(), 30);
    const defectRates = daily.map(d => d.defectRate);
    const trend = determineTrend(defectRates);

    let riskLevel: RiskLevel = '低';
    if (metrics.qualityRate < 70 || (trend === '上升' && metrics.defectRate > 5)) riskLevel = '高';
    else if (metrics.qualityRate < 85 || (trend === '上升' && metrics.defectRate > 2)) riskLevel = '中';

    let mainProblem = '整体质量稳定';
    if (trend === '上升') mainProblem = '缺陷率呈上升趋势';
    else if (metrics.defectRate > 5) mainProblem = '缺陷率偏高';

    const reason = `${name} 当前优质率 ${metrics.qualityRate}%，缺陷率 ${metrics.defectRate}%。` +
      (trend === '上升' ? '近期缺陷率呈上升趋势，未来存在质量风险。' : '近期质量趋势保持稳定。');

    results.push({
      rank: 0,
      name,
      sampleCount: metrics.totalSamples,
      defectCount: metrics.totalDefects,
      defectRate: metrics.defectRate,
      qualityRate: metrics.qualityRate,
      riskLevel,
      mainProblem,
      reason,
    });
  });

  return results
    .sort((a, b) => {
      const riskWeight = { 高: 3, 中: 2, 低: 1 };
      if (riskWeight[b.riskLevel] !== riskWeight[a.riskLevel]) {
        return riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
      }
      return b.defectRate - a.defectRate;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// ==================== 烟支物测趋势预测 ====================

function parsePhysicalValue(value: string | number | undefined): number | null {
  if (value === undefined || value === '' || value === null) return null;
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) ? null : num;
}

/** 为物测预测解析牌号：优先使用用户选择的牌号，否则从记录推断，最后回退到标准库第一个牌号 */
function resolvePredictionBrand(physicalRecords: PhysicalTestRecord[], explicitBrand?: string): string | null {
  if (explicitBrand) {
    const resolved = resolveBrandName(explicitBrand);
    if (resolved) return resolved;
  }
  // 从记录推断最常见牌号
  const brandCounts = new Map<string, number>();
  physicalRecords.forEach(r => {
    if (!r.brand) return;
    const resolved = resolveBrandName(r.brand);
    if (!resolved) return;
    brandCounts.set(resolved, (brandCounts.get(resolved) || 0) + 1);
  });
  if (brandCounts.size > 0) {
    return Array.from(brandCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }
  // 回退到标准库第一个牌号（保证界面仍有标准线可展示）
  const allBrands = getAllBrands();
  return allBrands.length > 0 ? allBrands[0] : null;
}

export function predictPhysicalIndicators(
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  brand?: string
): PhysicalIndicatorPrediction[] {
  const endDate = new Date();
  const dailyBuckets = createDailyBuckets(endDate, 60);
  const brandKey = resolvePredictionBrand(physicalRecords, brand);

  if (!brandKey) {
    return [];
  }

  return PHYSICAL_INDICATOR_KEYS.map((indicatorId) => {
    const std = getIndicatorStandard(brandKey, indicatorId);
    // 无标准或标准不完整则跳过该指标
    if (!std || std.standard.value == null || std.standard.min == null || std.standard.max == null) {
      return null;
    }

    const center = std.standard.value;
    const upper = std.standard.max;
    const lower = std.standard.min;
    const name = std.name || PHYSICAL_INDICATOR_LABELS[indicatorId];
    const unit = std.unit || PHYSICAL_INDICATOR_UNITS[indicatorId];

    const points: ForecastPoint[] = [];

    // 历史实际值
    dailyBuckets.forEach(bucket => {
      const matched = physicalRecords.filter(r => r.date === bucket.date);
      const values = matched
        .map(r => parsePhysicalValue((r as any)[indicatorId]?.x))
        .filter((v): v is number => v !== null);
      const avg = values.length > 0
        ? parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(3))
        : center;
      points.push({
        date: bucket.date,
        label: bucket.date.slice(5),
        value: avg,
        isActual: true,
      });
    });

    // 预测未来
    const actualValues = points.map(p => p.value ?? center);
    const predicted = forecastSeries(actualValues, forecastDays);
    const futureDates = getFutureNDays(forecastDays);

    futureDates.forEach((date, i) => {
      points.push({
        date,
        label: date.slice(5),
        value: predicted[i],
        isActual: false,
      });
    });

    const currentValue = actualValues[actualValues.length - 1] ?? center;
    const predictedValue = predicted[predicted.length - 1];

    const trend: '上升' | '下降' | '稳定' =
      predictedValue > currentValue * 1.02 ? '上升' :
      predictedValue < currentValue * 0.98 ? '下降' : '稳定';

    const distanceToUpper = upper > center
      ? parseFloat(((upper - predictedValue) / (upper - center) * 100).toFixed(1))
      : 100;
    const distanceToLower = center > lower
      ? parseFloat(((predictedValue - lower) / (center - lower) * 100).toFixed(1))
      : 100;

    let riskLevel: RiskLevel = '低';
    let warning: string | undefined;
    if (predictedValue > upper || predictedValue < lower) {
      riskLevel = '高';
      warning = `${name}预测值已超出标准范围，存在质量风险。`;
    } else if (distanceToUpper < 20 || distanceToLower < 20) {
      riskLevel = '较高';
      warning = `${name}预测值接近标准边界，需持续监控。`;
    } else if (trend === '上升' && distanceToUpper < 40) {
      riskLevel = '中';
      warning = `${name}预测呈上升趋势，正向标准上限靠近。`;
    } else if (trend === '下降' && distanceToLower < 40) {
      riskLevel = '中';
      warning = `${name}预测呈下降趋势，正向标准下限靠近。`;
    }

    return {
      indicatorId,
      name,
      unit,
      center,
      upper,
      lower,
      data: points,
      currentValue,
      predictedValue,
      trend,
      distanceToUpper,
      distanceToLower,
      riskLevel,
      warning,
    };
  }).filter((p): p is PhysicalIndicatorPrediction => p !== null);
}

// ==================== 异常组合识别 ====================

export function detectAbnormalCombinations(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  selectedBrand?: string
): AbnormalCombination[] {
  const combinations: AbnormalCombination[] = [];
  const machineRisks = predictMachineRisks(records, forecastDays);
  const brandRisks = predictBrandRisks(records);
  const defectRisks = predictFutureDefectRisks(records, forecastDays);
  const physicalPredictions = predictPhysicalIndicators(physicalRecords, forecastDays, selectedBrand);

  // 筛选高风险机台
  const highRiskMachines = machineRisks.filter(m => m.riskLevel === '高' || m.riskLevel === '较高').slice(0, 3);
  const risingBrands = brandRisks.filter(b => b.riskLevel === '高' || b.riskLevel === '中').slice(0, 3);
  const risingDefects = defectRisks.filter(d => d.riskLevel === '高' || d.riskLevel === '较高').slice(0, 5);
  const physicalRisks = physicalPredictions.filter(p => p.riskLevel === '高' || p.riskLevel === '较高' || p.riskLevel === '中').slice(0, 3);

  highRiskMachines.forEach(machine => {
    risingBrands.forEach(brandRisk => {
      risingDefects.forEach(defect => {
        physicalRisks.forEach(physical => {
          combinations.push({
            riskLevel: machine.riskLevel === '高' || physical.riskLevel === '高' ? '高' : '较高',
            combination: `${machine.machine}机台 + ${brandRisk.brand} + ${physical.name}上升 + ${defect.fieldLabel}${defect.name}增加`,
            description: `高风险组合：${machine.machine}机台、${brandRisk.brand}、${physical.name}呈${physical.trend}趋势，同时${defect.fieldLabel}缺陷「${defect.name}」增加。`,
            reason: '历史数据表明，当机台、牌号、物测指标与特定缺陷同时出现恶化趋势时，整体质量缺陷存在明显增加风险，建议提前检查。',
          });
        });
      });
    });
  });

  return combinations.slice(0, 6);
}

// ==================== 风险预警中心 ====================

export function generateRiskAlerts(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  selectedBrand?: string
): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const qualityPrediction = predictQualityRate(records, forecastDays);
  const defectPrediction = predictDefectRate(records, forecastDays);
  const machineRisks = predictMachineRisks(records, forecastDays);
  const defectRisks = predictFutureDefectRisks(records, forecastDays);
  const physicalPredictions = predictPhysicalIndicators(physicalRecords, forecastDays, selectedBrand);

  if (qualityPrediction.warning) {
    alerts.push({
      id: 'quality-rate',
      level: qualityPrediction.riskLevel,
      object: '优质率',
      reason: `当前优质率 ${qualityPrediction.currentRate}%，预测未来${forecastDays}天降至 ${qualityPrediction.predictedRate}%（${qualityPrediction.change > 0 ? '+' : ''}${qualityPrediction.change}个百分点）。`,
      forecastTime: `未来${forecastDays}天`,
      measure: '排查影响优质率的关键缺陷，加强首检与巡检。',
    });
  }

  if (defectPrediction.warning) {
    alerts.push({
      id: 'defect-rate',
      level: defectPrediction.riskLevel,
      object: '缺陷率',
      reason: `当前缺陷率 ${defectPrediction.currentRate}%，预测未来${forecastDays}天升至 ${defectPrediction.predictedRate}%（+${defectPrediction.change}个百分点）。`,
      forecastTime: `未来${forecastDays}天`,
      measure: '重点监控高频缺陷与对应机台，提前开展工艺排查。',
    });
  }

  machineRisks.filter(m => m.riskLevel === '高' || m.riskLevel === '较高').forEach(m => {
    alerts.push({
      id: `machine-${m.machine}`,
      level: m.riskLevel,
      object: m.machine,
      reason: m.reason,
      forecastTime: `未来${forecastDays}天`,
      measure: `建议重点检查${m.machine}机台运行状态，增加抽检频次。`,
    });
  });

  defectRisks.filter(d => d.riskLevel === '高' || d.riskLevel === '较高').slice(0, 3).forEach(d => {
    alerts.push({
      id: `defect-${d.name}`,
      level: d.riskLevel,
      object: `${d.fieldLabel}·${d.name}`,
      reason: `近14天该缺陷${d.historyTrend === '↑' ? '持续上升' : '出现频次增加'}，增长幅度 ${d.growthRate}%。`,
      forecastTime: `未来${forecastDays}天`,
      measure: `针对${d.name}开展专项排查，分析发生位置与频次。`,
    });
  });

  physicalPredictions.filter(p => p.riskLevel === '高' || p.riskLevel === '较高').forEach(p => {
    alerts.push({
      id: `physical-${p.indicatorId}`,
      level: p.riskLevel,
      object: p.name,
      reason: p.warning || `${p.name}预测呈${p.trend}趋势。`,
      forecastTime: `未来${forecastDays}天`,
      measure: '持续跟踪物测指标，若继续向标准边界靠近应及时排查。',
    });
  });

  return alerts;
}

// ==================== AI预测总览 ====================

export function generatePredictionOverview(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  selectedBrand?: string
): PredictionOverview {
  const metrics = calculateMetrics(records);
  const qualityPrediction = predictQualityRate(records, forecastDays);
  const defectPrediction = predictDefectRate(records, forecastDays);
  const machineRisks = predictMachineRisks(records, forecastDays);
  const defectRisks = predictFutureDefectRisks(records, forecastDays);

  // 当前状态
  let currentStatus: PredictionOverview['currentStatus'] = '优秀';
  if (metrics.qualityRate < 70 || metrics.defectRate > 10) currentStatus = '异常';
  else if (metrics.qualityRate < 85 || metrics.defectRate > 5) currentStatus = '关注';
  else if (metrics.qualityRate < 95 || metrics.defectRate > 2) currentStatus = '稳定';
  else if (metrics.qualityRate < 98) currentStatus = '良好';

  // 未来趋势
  let futureTrend: PredictionOverview['futureTrend'] = '稳定';
  if (qualityPrediction.change < -2 || defectPrediction.change > 1) futureTrend = '恶化';
  else if (qualityPrediction.change > 1 || defectPrediction.change < -0.5) futureTrend = '改善';

  // 风险等级
  const alerts = generateRiskAlerts(records, physicalRecords, forecastDays, selectedBrand);
  const highCount = alerts.filter(a => a.level === '高').length;
  const higherCount = alerts.filter(a => a.level === '较高').length;
  const midCount = alerts.filter(a => a.level === '中').length;

  let riskLevel: RiskLevel = '低';
  if (highCount > 0) riskLevel = '高';
  else if (higherCount > 0) riskLevel = '较高';
  else if (midCount > 0) riskLevel = '中';

  // 重点缺陷与机台
  const topDefect = defectRisks[0];
  const topMachine = machineRisks[0];

  // 可信度
  const dailyCount = calculateDailyMetrics(records, 'all', new Date(), 60).filter(d => d.sampleCount > 0).length;
  let confidence = 92;
  let confidenceLevel: '高' | '中' | '低' = '高';
  let dataWarning: string | undefined;
  if (dailyCount < 7) {
    confidence = 45;
    confidenceLevel = '低';
    dataWarning = '当前历史数据不足，预测结果仅供趋势参考。';
  } else if (dailyCount < 21) {
    confidence = 72;
    confidenceLevel = '中';
    dataWarning = '历史数据较少，预测结果存在不确定性。';
  }

  return {
    currentStatus,
    futureTrend,
    riskLevel,
    topProblem: topDefect ? `${topDefect.fieldLabel}·${topDefect.name}` : '暂无显著风险缺陷',
    focusMachine: topMachine ? topMachine.machine : '暂无重点关注机台',
    predictedRiskCount: alerts.length,
    confidence,
    confidenceLevel,
    dataWarning,
  };
}

// ==================== 原因分析与改进建议 ====================

export function generateReasons(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  selectedBrand?: string
): string[] {
  const reasons: string[] = [];
  const metrics = calculateMetrics(records);
  const machineRisks = predictMachineRisks(records, forecastDays);
  const defectRisks = predictFutureDefectRisks(records, forecastDays);
  const brandRisks = predictBrandRisks(records);
  const physicalPredictions = predictPhysicalIndicators(physicalRecords, forecastDays, selectedBrand);

  reasons.push(`当前系统共有 ${metrics.totalSamples} 个历史样本、${metrics.totalDefects} 个缺陷，优质率 ${metrics.qualityRate}%，缺陷率 ${metrics.defectRate}%。`);

  if (machineRisks[0] && machineRisks[0].riskLevel !== '低') {
    reasons.push(machineRisks[0].reason);
  }

  if (defectRisks[0] && defectRisks[0].riskLevel !== '低') {
    reasons.push(`未来风险最高的缺陷是「${defectRisks[0].fieldLabel}·${defectRisks[0].name}」，近14天${defectRisks[0].historyTrend === '↑' ? '持续上升' : '出现频次增加'}。`);
  }

  if (brandRisks[0] && brandRisks[0].riskLevel !== '低') {
    reasons.push(`${brandRisks[0].brand}牌号近期质量波动较大，${brandRisks[0].mainProblem}。`);
  }

  physicalPredictions.forEach(p => {
    if (p.riskLevel !== '低') {
      reasons.push(p.warning || `${p.name}预测呈${p.trend}趋势。`);
    }
  });

  if (reasons.length === 1) {
    reasons.push('当前历史数据未发现明显异常趋势，整体质量保持稳定。');
  }

  return reasons;
}

export function generateSuggestions(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  forecastDays: number,
  selectedBrand?: string
): string[] {
  const suggestions: string[] = [];
  const machineRisks = predictMachineRisks(records, forecastDays);
  const defectRisks = predictFutureDefectRisks(records, forecastDays);
  const physicalPredictions = predictPhysicalIndicators(physicalRecords, forecastDays, selectedBrand);

  const focusMachines = machineRisks.filter(m => m.riskLevel === '高' || m.riskLevel === '较高').slice(0, 2);
  if (focusMachines.length > 0) {
    suggestions.push(`重点机台：建议对 ${focusMachines.map(m => m.machine).join('、')} 增加抽检频次并检查设备运行参数。`);
  }

  const focusDefects = defectRisks.filter(d => d.riskLevel === '高' || d.riskLevel === '较高').slice(0, 2);
  if (focusDefects.length > 0) {
    suggestions.push(`重点缺陷：针对「${focusDefects.map(d => `${d.fieldLabel}·${d.name}`).join('、')}」开展专项排查与整改。`);
  }

  const focusPhysical = physicalPredictions.filter(p => p.riskLevel === '高' || p.riskLevel === '较高').slice(0, 2);
  if (focusPhysical.length > 0) {
    suggestions.push(`物测指标：持续关注${focusPhysical.map(p => p.name).join('、')}变化，若继续靠近标准边界应及时校准设备。`);
  }

  if (suggestions.length === 0) {
    suggestions.push('当前质量趋势稳定，建议继续保持现有管控措施并持续监控。');
  }

  suggestions.push('建议定期复盘AI预测结果，结合实际生产情况动态调整质量管控策略。');

  return suggestions;
}

// ==================== 主入口：生成完整AI预测结果 ====================

const DEFAULT_PREDICTION_RESULT: AIPredictionResult = {
  overview: {
    currentStatus: '稳定',
    futureTrend: '稳定',
    riskLevel: '低',
    topProblem: '暂无数据',
    focusMachine: '暂无',
    predictedRiskCount: 0,
    confidence: 0,
    confidenceLevel: '低',
    dataWarning: '当前历史数据不足，无法生成有效预测',
  },
  qualityRatePrediction: { currentRate: 0, predictedRate: 0, change: 0, riskLevel: '低' },
  defectRatePrediction: { currentRate: 0, predictedRate: 0, change: 0, trend: '稳定', riskLevel: '低' },
  comprehensiveTrend: [],
  futureDefectRisks: [],
  machineRisks: [],
  brandRisks: [],
  productionPointRisks: [],
  physicalPredictions: [],
  abnormalCombinations: [],
  alerts: [],
  reasons: [],
  suggestions: [],
};

function safePrediction<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.error('AI预测子模块执行失败:', e);
    return fallback;
  }
}

export function generateAIPredictionResult(
  records: ProcessQualityRecord[],
  physicalRecords: PhysicalTestRecord[],
  filters: AIPredictionFilters
): AIPredictionResult {
  const forecastDays = filters.forecastDays;

  try {
    const selectedBrand = filters.brand;
    return {
      overview: safePrediction(() => generatePredictionOverview(records, physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.overview),
      qualityRatePrediction: safePrediction(() => predictQualityRate(records, forecastDays), DEFAULT_PREDICTION_RESULT.qualityRatePrediction),
      defectRatePrediction: safePrediction(() => predictDefectRate(records, forecastDays), DEFAULT_PREDICTION_RESULT.defectRatePrediction),
      comprehensiveTrend: safePrediction(() => calculateComprehensiveTrendPrediction(records, forecastDays), DEFAULT_PREDICTION_RESULT.comprehensiveTrend),
      futureDefectRisks: safePrediction(() => predictFutureDefectRisks(records, forecastDays), DEFAULT_PREDICTION_RESULT.futureDefectRisks),
      machineRisks: safePrediction(() => predictMachineRisks(records, forecastDays), DEFAULT_PREDICTION_RESULT.machineRisks),
      brandRisks: safePrediction(() => predictBrandRisks(records), DEFAULT_PREDICTION_RESULT.brandRisks),
      productionPointRisks: safePrediction(() => predictProductionPointRisks(records), DEFAULT_PREDICTION_RESULT.productionPointRisks),
      physicalPredictions: safePrediction(() => predictPhysicalIndicators(physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.physicalPredictions),
      abnormalCombinations: safePrediction(() => detectAbnormalCombinations(records, physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.abnormalCombinations),
      alerts: safePrediction(() => generateRiskAlerts(records, physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.alerts),
      reasons: safePrediction(() => generateReasons(records, physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.reasons),
      suggestions: safePrediction(() => generateSuggestions(records, physicalRecords, forecastDays, selectedBrand), DEFAULT_PREDICTION_RESULT.suggestions),
    };
  } catch (e) {
    console.error('AI预测结果生成失败:', e);
    return DEFAULT_PREDICTION_RESULT;
  }
}
