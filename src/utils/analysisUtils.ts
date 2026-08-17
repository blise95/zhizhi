/**
 * 质量分析中心 - 工具函数
 * 用于处理缺陷数据的统计、筛选和分析
 *
 * 数据口径统一要求：
 * 1. 优质率：与质量驾驶舱完全共用 qualityEngine.ts 的评级算法。
 *    优质率 = 评级为优等品的批次 ÷ 有效批次 × 100%
 * 2. 缺陷率 = 当月总缺陷数量 ÷（当月样本量 × 215）× 100%
 * 3. 四个分析模块（箱/条/盒/烟支）统计逻辑统一，仅按 defectType 区分缺陷字段。
 */

import { rateRecords } from '../lib/qualityEngine';

// 缺陷类型枚举
export enum DefectType {
  BOX = 'box',           // 箱装外观缺陷
  CARTON = 'carton',     // 条装外观缺陷
  PACK = 'pack',         // 盒装外观缺陷
  CIGARETTE = 'cigarette' // 烟支外观缺陷
}

// 缺陷类型对应的中文标签
export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  [DefectType.BOX]: '箱装外观',
  [DefectType.CARTON]: '条装外观',
  [DefectType.PACK]: '盒装外观',
  [DefectType.CIGARETTE]: '烟支外观',
};

// 每个样本对应的缺陷评价项目总数（缺陷率分母系数）
export const DEFECT_RATE_BASE = 215;

// 过程质量记录中的缺陷数据结构
export interface DefectRecord {
  location: string;      // 缺陷部位
  defectName: string;    // 缺陷名称
  category: string;      // 缺陷类别 (A/B/C/D)
  quantity: number;      // 缺陷数量
  scoreCategory?: 'box' | 'carton' | 'pack' | 'physical' | 'appearance' | 'misc'; // 烟支缺陷细分评分类别
}

// 过程质量记录
export interface ProcessQualityRecord {
  id: string;
  inspectionDate: string;
  productionPoint: string;
  brand: string;
  machine: string;
  shiftGroup: string;
  shift: string;
  inspector: string;
  batchNumber: string;
  steelStamp?: string;
  boxDefects?: DefectRecord[];
  cartonDefects?: DefectRecord[];
  packDefects?: DefectRecord[];
  cigaretteDefects?: DefectRecord[];
  createdAt: string;
}

// 筛选条件
export interface FilterConditions {
  dateFrom: string;
  dateTo: string;
  productionPoint: string;
  brand: string;
  machine: string;
  shiftGroup: string;
  shift: string;
}

// ==================== 新版分析指标 ====================

/** 分析中心核心指标 */
export interface AnalysisOverview {
  totalSamples: number;       // 抽检样本数
  totalDefects: number;       // 缺陷数量
  qualityRate: number;        // 优质率（%）
  defectRate: number;           // 缺陷率（%）
}

/** 机台质量对比数据 */
export interface MachineAnalysisData {
  machine: string;
  sampleCount: number;          // 该机台样本数
  defectCount: number;          // 该机台缺陷数
  defectRate: number;           // 该机台缺陷率
}

/** 缺陷结构分布项 */
export interface DefectStructureItem {
  name: string;                 // 缺陷名称（箱/条/盒用部位+名称，烟支用名称）
  location: string;             // 缺陷部位
  category: string;             // 缺陷类别
  count: number;
  percentage: number;
}

/** TOP5缺陷 */
export interface TopDefectItem {
  rank: number;
  name: string;
  location: string;
  category: string;
  count: number;
  percentage: number;         // 占该类型总缺陷数比例
}

/** 趋势数据点 */
export interface TrendDataPoint {
  date: string;
  sampleCount: number;
  defectCount: number;
  defectRate: number;           // 当日缺陷率
  qualityRate: number;            // 当日优质率（按天计算）
}

/** AI质量分析 */
export interface AIQualityAnalysis {
  anomaly: string[];    // 异常识别
  cause: string[];     // 原因分析
  suggestion: string[]; // 改进建议
}

// ==================== 旧版兼容接口（保留） ====================

export interface QualityOverview {
  totalSamples: number;
  totalDefects: number;
  defectSampleCount: number;
  qualityRate: number;
}

export interface MachineDefectData {
  machine: string;
  defectCount: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface DefectRankItem {
  name: string;
  count: number;
  location: string;
  category: string;
}

export interface TopDefect {
  rank: number;
  name: string;
  location: string;
  category: string;
  count: number;
}

// ==================== 日期与数据加载 ====================

/**
 * 将 Date 格式化为本地时区 YYYY-MM-DD
 * 避免 toISOString() 在正时区出现跨日偏差
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 获取当前月份的日期范围
 */
export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  return {
    from: formatLocalDate(firstDay),
    to: formatLocalDate(now),
  };
}

/**
 * 从后端 MySQL 加载过程质量数据
 */
export async function loadProcessQualityData(): Promise<ProcessQualityRecord[]> {
  const { fetchProcessQualityRecords } = await import('../services/qualityData');
  try {
    const records = await fetchProcessQualityRecords();
    console.log(`✅ 分析中心加载了 ${records.length} 条质量记录`);
    return records;
  } catch (e) {
    console.error('❌ 加载过程质量数据失败:', e);
    return [];
  }
}

/**
 * 根据缺陷类型获取对应的缺陷字段
 */
export function getDefectFieldByType(type: DefectType): keyof ProcessQualityRecord {
  switch (type) {
    case DefectType.BOX:
      return 'boxDefects';
    case DefectType.CARTON:
      return 'cartonDefects';
    case DefectType.PACK:
      return 'packDefects';
    case DefectType.CIGARETTE:
      return 'cigaretteDefects';
    default:
      return 'boxDefects';
  }
}

/**
 * 根据筛选条件过滤数据
 */
export function filterByConditions(
  records: ProcessQualityRecord[],
  filters: FilterConditions
): ProcessQualityRecord[] {
  return records.filter(record => {
    if (filters.dateFrom && record.inspectionDate < filters.dateFrom) return false;
    if (filters.dateTo && record.inspectionDate > filters.dateTo) return false;
    if (filters.productionPoint && record.productionPoint !== filters.productionPoint) return false;
    if (filters.brand && record.brand !== filters.brand) return false;
    if (filters.machine && record.machine !== filters.machine) return false;
    if (filters.shiftGroup && record.shiftGroup !== filters.shiftGroup) return false;
    if (filters.shift && record.shift !== filters.shift) return false;
    return true;
  });
}

// ==================== 新版统计函数 ====================

/**
 * 计算指定缺陷类型的缺陷总数
 */
function countDefectsByType(record: ProcessQualityRecord, defectType: DefectType): number {
  const field = getDefectFieldByType(defectType);
  const defects = record[field] as DefectRecord[] | undefined;
  if (!defects || defects.length === 0) return 0;
  return defects.reduce((sum, d) => sum + (d.quantity || 1), 0);
}

/**
 * 计算分析中心核心指标
 * 优质率：使用 qualityEngine.ts 的评级结果，与驾驶舱完全一致
 * 缺陷率：总缺陷数 / (样本数 × 215) × 100%
 */
export function calculateAnalysisOverview(
  records: ProcessQualityRecord[],
  defectType: DefectType
): AnalysisOverview {
  const totalSamples = records.length;
  const totalDefects = records.reduce(
    (sum, r) => sum + countDefectsByType(r, defectType),
    0
  );

  // 优质率：调用 qualityEngine 统一评级算法
  let qualityRate = 0;
  if (totalSamples > 0) {
    const ratings = rateRecords(records as any);
    const excellentCount = ratings.filter(r => r.rating === 'excellent').length;
    qualityRate = parseFloat(((excellentCount / totalSamples) * 100).toFixed(2));
  }

  // 缺陷率：严格按标准公式
  const defectRate = totalSamples > 0
    ? parseFloat(((totalDefects / (totalSamples * DEFECT_RATE_BASE)) * 100).toFixed(2))
    : 0;

  return {
    totalSamples,
    totalDefects,
    qualityRate,
    defectRate,
  };
}

/**
 * 计算机台质量对比数据
 */
export function calculateMachineAnalysisData(
  records: ProcessQualityRecord[],
  defectType: DefectType
): MachineAnalysisData[] {
  const machineMap = new Map<string, { sampleCount: number; defectCount: number }>();

  records.forEach(record => {
    const machine = record.machine || '未知机台';
    const entry = machineMap.get(machine) || { sampleCount: 0, defectCount: 0 };
    entry.sampleCount += 1;
    entry.defectCount += countDefectsByType(record, defectType);
    machineMap.set(machine, entry);
  });

  return Array.from(machineMap.entries())
    .map(([machine, data]) => ({
      machine,
      sampleCount: data.sampleCount,
      defectCount: data.defectCount,
      defectRate: data.sampleCount > 0
        ? parseFloat(((data.defectCount / (data.sampleCount * DEFECT_RATE_BASE)) * 100).toFixed(2))
        : 0,
    }))
    .sort((a, b) => b.defectCount - a.defectCount);
}

/**
 * 计算缺陷结构分布
 * 箱/条/盒按“部位-名称”聚合；烟支按“名称”聚合（同一部位不同名称视为不同类型）
 */
export function calculateDefectStructure(
  records: ProcessQualityRecord[],
  defectType: DefectType
): DefectStructureItem[] {
  const field = getDefectFieldByType(defectType);
  const map = new Map<string, DefectStructureItem>();
  let total = 0;

  records.forEach(record => {
    const defects = record[field] as DefectRecord[] | undefined;
    if (!defects) return;
    defects.forEach(d => {
      const qty = d.quantity || 1;
      total += qty;
      const key = defectType === DefectType.CIGARETTE
        ? `${d.defectName}`
        : `${d.location}-${d.defectName}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += qty;
      } else {
        map.set(key, {
          name: d.defectName,
          location: d.location,
          category: d.category,
          count: qty,
          percentage: 0,
        });
      }
    });
  });

  return Array.from(map.values())
    .map(item => ({
      ...item,
      percentage: total > 0 ? parseFloat(((item.count / total) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取 TOP5 缺陷
 */
export function calculateTopDefects(
  records: ProcessQualityRecord[],
  defectType: DefectType,
  topN: number = 5
): TopDefectItem[] {
  const structure = calculateDefectStructure(records, defectType);
  const total = structure.reduce((sum, item) => sum + item.count, 0);

  return structure.slice(0, topN).map((item, index) => ({
    rank: index + 1,
    name: item.name,
    location: item.location,
    category: item.category,
    count: item.count,
    percentage: total > 0 ? parseFloat(((item.count / total) * 100).toFixed(2)) : 0,
  }));
}

/**
 * 计算缺陷趋势数据
 */
export function calculateDefectTrend(
  records: ProcessQualityRecord[],
  defectType: DefectType
): TrendDataPoint[] {
  const dateMap = new Map<string, {
    records: ProcessQualityRecord[];
    defectCount: number;
    sampleCount: number;
  }>();

  records.forEach(record => {
    const date = record.inspectionDate;
    const entry = dateMap.get(date) || { records: [], defectCount: 0, sampleCount: 0 };
    entry.records.push(record);
    entry.sampleCount += 1;
    entry.defectCount += countDefectsByType(record, defectType);
    dateMap.set(date, entry);
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => {
      const dailyRatings = rateRecords(data.records as any);
      const excellentCount = dailyRatings.filter(r => r.rating === 'excellent').length;
      const qualityRate = data.sampleCount > 0
        ? parseFloat(((excellentCount / data.sampleCount) * 100).toFixed(2))
        : 0;
      return {
        date,
        sampleCount: data.sampleCount,
        defectCount: data.defectCount,
        defectRate: data.sampleCount > 0
          ? parseFloat(((data.defectCount / (data.sampleCount * DEFECT_RATE_BASE)) * 100).toFixed(2))
          : 0,
        qualityRate,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 生成 AI 质量分析
 * 基于真实数据：异常识别、原因分析、改进建议
 */
export function generateAIQualityAnalysis(
  overview: AnalysisOverview,
  machineData: MachineAnalysisData[],
  structure: DefectStructureItem[],
  top5: TopDefectItem[],
  trend: TrendDataPoint[],
  defectType: DefectType,
  filters: FilterConditions
): AIQualityAnalysis {
  const typeLabel = DEFECT_TYPE_LABELS[defectType];
  const anomaly: string[] = [];
  const cause: string[] = [];
  const suggestion: string[] = [];

  if (overview.totalSamples === 0) {
    return {
      anomaly: ['当前筛选条件暂无足够质量数据，暂无法识别异常。'],
      cause: [],
      suggestion: ['建议先在过程质量管控中录入数据，或放宽筛选条件。'],
    };
  }

  // 1. 异常识别
  anomaly.push(`当前统计范围内共抽检 ${overview.totalSamples} 个样本，发现 ${overview.totalDefects} 个${typeLabel}缺陷，优质率 ${overview.qualityRate}%，缺陷率 ${overview.defectRate}%。`);

  if (overview.qualityRate < 85) {
    anomaly.push(`优质率低于 85%，存在质量等级下滑风险，需重点关注。`);
  }

  if (overview.defectRate > 5) {
    anomaly.push(`缺陷率达到 ${overview.defectRate}%，超过 5% 警戒线，缺陷发生频率偏高。`);
  }

  if (top5.length > 0) {
    const top = top5[0];
    anomaly.push(`主要问题为「${top.name}」（${top.location}），累计 ${top.count} 次，占${typeLabel}缺陷的 ${top.percentage}%。`);
  }

  if (machineData.length > 1) {
    const max = machineData[0];
    const min = machineData[machineData.length - 1];
    if (max.defectCount > min.defectCount * 1.5) {
      anomaly.push(`机台间差异明显：${max.machine} 缺陷数最多（${max.defectCount} 次），显著高于其他机台。`);
    }
  }

  if (trend.length >= 3) {
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));
    const firstAvg = firstHalf.reduce((s, d) => s + d.defectCount, 0) / Math.max(firstHalf.length, 1);
    const secondAvg = secondHalf.reduce((s, d) => s + d.defectCount, 0) / Math.max(secondHalf.length, 1);
    if (secondAvg > firstAvg * 1.3) {
      anomaly.push(`近期缺陷呈上升趋势，后半段日均缺陷数较前段上升约 ${Math.round((secondAvg / firstAvg - 1) * 100)}%。`);
    } else if (secondAvg < firstAvg * 0.7) {
      anomaly.push(`近期缺陷呈下降趋势，后半段日均缺陷数较前段下降约 ${Math.round((1 - secondAvg / firstAvg) * 100)}%。`);
    }
  }

  // 2. 原因分析
  if (top5.length > 0) {
    const top = top5[0];
    const categoryText = top.category === 'A'
      ? 'A类严重缺陷，通常与材料错用、设备关键参数失控或操作严重失误有关'
      : top.category === 'B'
      ? 'B类较重缺陷，多与设备调整不当、工艺参数波动或来料一致性差有关'
      : top.category === 'C'
      ? 'C类一般缺陷，可能由常规磨损、轻微调整偏差或环境波动引起'
      : 'D类轻微缺陷，多为偶发轻微瑕疵或外观轻微偏差';
    cause.push(`TOP1 缺陷「${top.name}」为${categoryText}，建议从设备、材料、操作三个维度排查。`);
  }

  if (machineData.length > 1 && machineData[0].defectCount > machineData[machineData.length - 1].defectCount * 1.5) {
    cause.push(`${machineData[0].machine} 机台缺陷集中，可能是该机台模具/机械手/胶缸状态不稳定，或换牌后参数未及时调整。`);
  }

  if (structure.length > 1) {
    const main = structure[0];
    if (main.percentage > 40) {
      cause.push(`缺陷结构高度集中，${main.name} 单项占比超过 40%，说明存在系统性诱因而非随机波动。`);
    } else {
      cause.push(`缺陷类型分布较分散，需多工序协同排查，避免仅聚焦单一缺陷而忽视潜在关联因素。`);
    }
  }

  // 3. 改进建议
  if (top5.length > 0) {
    const top = top5[0];
    if (top.category === 'A' || top.category === 'B') {
      suggestion.push(`优先整改「${top.name}」等${top.category}类缺陷，建立首检/巡检专项检查清单。`);
    } else {
      suggestion.push(`针对「${top.name}」开展专项工艺优化，降低重复发生概率。`);
    }
  }

  if (machineData.length > 0 && machineData[0].defectCount > 0) {
    suggestion.push(`加强对 ${machineData[0].machine} 机台的点检与参数监控，必要时安排停机维保。`);
  }

  if (overview.qualityRate < 90) {
    suggestion.push(`以提升优等品率为目标，梳理从缺陷识别→扣分→评级→改进的闭环流程，定期复盘。`);
  }

  if (suggestion.length === 0) {
    suggestion.push(`当前质量指标整体平稳，建议继续保持现有管控措施并持续监控趋势。`);
  }

  return { anomaly, cause, suggestion };
}

// ==================== 旧版兼容函数（保留，防止其他页面引用报错） ====================

export function calculateQualityOverview(
  records: ProcessQualityRecord[],
  defectType: DefectType
): QualityOverview {
  const overview = calculateAnalysisOverview(records, defectType);
  const defectField = getDefectFieldByType(defectType);
  let defectSampleCount = 0;
  records.forEach(r => {
    const defects = r[defectField] as DefectRecord[] | undefined;
    if (defects && defects.length > 0) defectSampleCount++;
  });
  return {
    totalSamples: overview.totalSamples,
    totalDefects: overview.totalDefects,
    defectSampleCount,
    qualityRate: overview.qualityRate,
  };
}

export function calculateMachineDefectComparison(
  records: ProcessQualityRecord[],
  defectType: DefectType
): MachineDefectData[] {
  return calculateMachineAnalysisData(records, defectType).map(d => ({
    machine: d.machine,
    defectCount: d.defectCount,
  }));
}

export function calculateCategoryStats(
  records: ProcessQualityRecord[],
  defectType: DefectType
): CategoryStat[] {
  const field = getDefectFieldByType(defectType);
  const categoryMap = new Map<string, number>();
  records.forEach(record => {
    const defects = record[field] as DefectRecord[] | undefined;
    if (defects) {
      defects.forEach(defect => {
        categoryMap.set(defect.category, (categoryMap.get(defect.category) || 0) + (defect.quantity || 1));
      });
    }
  });
  const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateDefectRanking(
  records: ProcessQualityRecord[],
  defectType: DefectType
): DefectRankItem[] {
  return calculateDefectStructure(records, defectType).map(item => ({
    name: item.name,
    count: item.count,
    location: item.location,
    category: item.category,
  }));
}

export function getTopDefects(
  ranking: DefectRankItem[],
  topN: number = 5
): TopDefect[] {
  const total = ranking.reduce((sum, item) => sum + item.count, 0);
  return ranking.slice(0, topN).map((item, index) => ({
    rank: index + 1,
    name: item.name,
    location: item.location,
    category: item.category,
    count: item.count,
  }));
}

/**
 * 生成AI质量总结（旧版字符串数组格式，兼容旧调用）
 */
export function generateAISummary(
  overview: QualityOverview,
  machineData: MachineDefectData[],
  categoryStats: CategoryStat[],
  topDefects: TopDefect[],
  trendData: TrendDataPoint[],
  defectType: DefectType,
  filters: FilterConditions
): string[] {
  const analysis = generateAIQualityAnalysis(
    { totalSamples: overview.totalSamples, totalDefects: overview.totalDefects, qualityRate: overview.qualityRate, defectRate: 0 },
    machineData.map(m => ({ machine: m.machine, sampleCount: 0, defectCount: m.defectCount, defectRate: 0 })),
    categoryStats.map(c => ({ name: c.category, location: '', category: c.category, count: c.count, percentage: c.percentage })),
    topDefects.map(d => ({ ...d, percentage: 0 })),
    trendData,
    defectType,
    filters
  );
  return [...analysis.anomaly, '', ...analysis.cause, '', ...analysis.suggestion];
}
