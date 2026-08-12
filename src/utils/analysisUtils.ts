/**
 * 质量分析中心 - 工具函数
 * 用于处理缺陷数据的统计、筛选和分析
 */

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

// 质量概况指标
export interface QualityOverview {
  totalSamples: number;       // 抽检样本数
  totalDefects: number;       // 缺陷数量
  defectSampleCount: number;  // 缺陷样本数
  qualityRate: number;        // 优质率 (%)
}

// 机台缺陷数据
export interface MachineDefectData {
  machine: string;
  defectCount: number;
}

// 缺陷类别统计
export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

// 缺陷名称排名
export interface DefectRankItem {
  name: string;
  count: number;
  location: string;
  category: string;
}

// TOP缺陷
export interface TopDefect {
  rank: number;
  name: string;
  location: string;
  category: string;
  count: number;
}

// 缺陷趋势数据点
export interface TrendDataPoint {
  date: string;
  defectCount: number;
  sampleCount: number;
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
    from: firstDay.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

/**
 * 从 localStorage 加载过程质量数据
 * 统一使用 processQualityData key（与录入、查询页面保持一致）
 */
export function loadProcessQualityData(): ProcessQualityRecord[] {
  try {
    const data = localStorage.getItem('processQualityData');
    if (data) {
      const records = JSON.parse(data);
      console.log(`✅ 分析中心加载了 ${records.length} 条质量记录`);

      // 字段映射：将录入页面的字段名转换为分析中心期望的字段名
      return records.map((record: any) => ({
        id: record.id,
        inspectionDate: record.date || record.inspectionDate,  // date → inspectionDate
        productionPoint: record.productionPoint,
        brand: record.brand,
        machine: record.machine,
        shiftGroup: record.shiftType || record.shiftGroup,  // shiftType → shiftGroup
        shift: record.shift,
        inspector: record.recorder || record.inspector,  // recorder → inspector
        batchNumber: record.tobaccoBatch || record.batchNumber,
        boxDefects: record.boxDefects || [],
        cartonDefects: record.cartonDefects || [],
        packDefects: record.packDefects || [],
        cigaretteDefects: record.cigaretteDefects || [],
        createdAt: record.createdAt || new Date().toISOString(),
      }));
    }
    console.log('ℹ️ 暂无质量数据');
    return [];
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
    // 日期范围筛选
    if (filters.dateFrom && record.inspectionDate < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && record.inspectionDate > filters.dateTo) {
      return false;
    }

    // 合作生产点筛选
    if (filters.productionPoint && record.productionPoint !== filters.productionPoint) {
      return false;
    }

    // 牌号筛选
    if (filters.brand && record.brand !== filters.brand) {
      return false;
    }

    // 机台筛选
    if (filters.machine && record.machine !== filters.machine) {
      return false;
    }

    // 班别筛选
    if (filters.shiftGroup && record.shiftGroup !== filters.shiftGroup) {
      return false;
    }

    // 班次筛选
    if (filters.shift && record.shift !== filters.shift) {
      return false;
    }

    return true;
  });
}

/**
 * 计算质量概况指标
 */
export function calculateQualityOverview(
  records: ProcessQualityRecord[],
  defectType: DefectType
): QualityOverview {
  const defectField = getDefectFieldByType(defectType);

  let totalSamples = 0;
  let totalDefects = 0;
  let defectSampleCount = 0;

  records.forEach(record => {
    totalSamples++;
    const defects = record[defectField] as DefectRecord[] | undefined;

    if (defects && defects.length > 0) {
      defectSampleCount++;
      defects.forEach(defect => {
        totalDefects += defect.quantity || 1;
      });
    }
  });

  const qualityRate = totalSamples > 0
    ? ((totalSamples - defectSampleCount) / totalSamples) * 100
    : 100;

  return {
    totalSamples,
    totalDefects,
    defectSampleCount,
    qualityRate: Math.round(qualityRate * 100) / 100,
  };
}

/**
 * 计算机台缺陷对比数据
 */
export function calculateMachineDefectComparison(
  records: ProcessQualityRecord[],
  defectType: DefectType
): MachineDefectData[] {
  const defectField = getDefectFieldByType(defectType);
  const machineMap = new Map<string, number>();

  records.forEach(record => {
    const defects = record[defectField] as DefectRecord[] | undefined;
    if (defects) {
      defects.forEach(defect => {
        const current = machineMap.get(record.machine) || 0;
        machineMap.set(record.machine, current + (defect.quantity || 1));
      });
    }
  });

  // 转换为数组并按缺陷数量降序排序
  const result: MachineDefectData[] = Array.from(machineMap.entries())
    .map(([machine, defectCount]) => ({ machine, defectCount }))
    .sort((a, b) => b.defectCount - a.defectCount);

  return result;
}

/**
 * 计算缺陷类别统计
 */
export function calculateCategoryStats(
  records: ProcessQualityRecord[],
  defectType: DefectType
): CategoryStat[] {
  const defectField = getDefectFieldByType(defectType);
  const categoryMap = new Map<string, number>();

  records.forEach(record => {
    const defects = record[defectField] as DefectRecord[] | undefined;
    if (defects) {
      defects.forEach(defect => {
        const current = categoryMap.get(defect.category) || 0;
        categoryMap.set(defect.category, current + (defect.quantity || 1));
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

/**
 * 计算缺陷名称排名
 */
export function calculateDefectRanking(
  records: ProcessQualityRecord[],
  defectType: DefectType
): DefectRankItem[] {
  const defectField = getDefectFieldByType(defectType);
  const defectMap = new Map<string, { name: string; location: string; category: string; count: number }>();

  records.forEach(record => {
    const defects = record[defectField] as DefectRecord[] | undefined;
    if (defects) {
      defects.forEach(defect => {
        const key = `${defect.location}-${defect.defectName}`;
        const existing = defectMap.get(key);
        if (existing) {
          existing.count += defect.quantity || 1;
        } else {
          defectMap.set(key, {
            name: defect.defectName,
            location: defect.location,
            category: defect.category,
            count: defect.quantity || 1,
          });
        }
      });
    }
  });

  return Array.from(defectMap.values())
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取TOP5缺陷
 */
export function getTopDefects(
  ranking: DefectRankItem[],
  topN: number = 5
): TopDefect[] {
  return ranking.slice(0, topN).map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
}

/**
 * 计算缺陷趋势数据
 */
export function calculateDefectTrend(
  records: ProcessQualityRecord[],
  defectType: DefectType
): TrendDataPoint[] {
  const defectField = getDefectFieldByType(defectType);
  const dateMap = new Map<string, { defectCount: number; sampleCount: number }>();

  records.forEach(record => {
    const date = record.inspectionDate;
    const existing = dateMap.get(date) || { defectCount: 0, sampleCount: 0 };

    existing.sampleCount++;
    const defects = record[defectField] as DefectRecord[] | undefined;
    if (defects) {
      defects.forEach(defect => {
        existing.defectCount += defect.quantity || 1;
      });
    }

    dateMap.set(date, existing);
  });

  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 生成AI质量总结
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
  const summary: string[] = [];
  const typeLabel = DEFECT_TYPE_LABELS[defectType];

  // 如果没有数据
  if (overview.totalSamples === 0) {
    return ['当前筛选条件暂无足够质量数据，暂无法生成AI质量总结。'];
  }

  // 1. 总体情况
  summary.push(`【${typeLabel}质量总体情况】`);
  summary.push(`当前统计范围内共抽检 ${overview.totalSamples} 个样本，发现 ${overview.totalDefects} 个缺陷，涉及 ${overview.defectSampleCount} 个缺陷样本，优质率为 ${overview.qualityRate}%。`);

  // 2. 主要质量问题
  if (topDefects.length > 0) {
    summary.push(`\n【主要质量问题】`);
    summary.push(`${typeLabel}缺陷主要集中在以下方面：`);
    topDefects.slice(0, 3).forEach((defect, index) => {
      summary.push(`${index + 1}. ${defect.name}（${defect.location}）- ${defect.category}类缺陷，共 ${defect.count} 次`);
    });

    // 缺陷类别分析
    if (categoryStats.length > 0) {
      const mainCategory = categoryStats[0];
      summary.push(`从缺陷类别看，${mainCategory.category}类缺陷占比最高（${mainCategory.percentage}%），需重点关注。`);
    }
  }

  // 3. 机台差异
  if (machineData.length > 1) {
    summary.push(`\n【机台差异分析】`);
    const maxMachine = machineData[0];
    const minMachine = machineData[machineData.length - 1];

    if (maxMachine.defectCount > minMachine.defectCount * 2) {
      summary.push(`机台间差异明显：${maxMachine.machine}机台缺陷数最多（${maxMachine.defectCount}次），是${minMachine.machine}机台（${minMachine.defectCount}次）的${Math.round(maxMachine.defectCount / Math.max(minMachine.defectCount, 1))}倍，建议重点排查${maxMachine.machine}机台的工艺参数和操作规范。`);
    } else if (maxMachine.defectCount === minMachine.defectCount) {
      summary.push(`各机台缺陷分布较为均匀，无明显异常机台。`);
    } else {
      summary.push(`${maxMachine.machine}机台缺陷数相对较高（${maxMachine.defectCount}次），可适当关注。`);
    }
  } else if (machineData.length === 1) {
    summary.push(`\n【机台差异分析】`);
    summary.push(`当前仅${machineData[0].machine}机台有数据（${machineData[0].defectCount}次缺陷），无法进行机台间对比。`);
  }

  // 4. 质量趋势判断
  if (trendData.length >= 3) {
    summary.push(`\n【质量趋势判断】`);
    const recentData = trendData.slice(-7); // 最近7天或所有数据
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.defectCount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.defectCount, 0) / secondHalf.length;

    const changeRatio = secondAvg / Math.max(firstAvg, 0.01) - 1;

    if (changeRatio <= -0.2) {
      summary.push(`近期${typeLabel}缺陷呈**改善趋势**，后半段日均缺陷数较前半段下降约${Math.abs(Math.round(changeRatio * 100))}%，质量控制措施初见成效。`);
    } else if (changeRatio >= 0.2) {
      summary.push(`近期${typeLabel}缺陷呈**变差趋势**，后半段日均缺陷数较前段上升约${Math.round(changeRatio * 100)}%，建议立即排查原因并加强过程管控。`);
    } else if (Math.abs(changeRatio) < 0.1) {
      summary.push(`近期${typeLabel}质量**保持稳定**，缺陷数量波动较小，持续维持现有管控水平。`);
    } else {
      summary.push(`近期${typeLabel}质量**存在波动**，缺陷数量有一定起伏，建议加强监控并及时调整工艺参数。`);
    }
  }

  // 5. AI质量建议
  summary.push(`\n【AI质量建议】`);
  if (topDefects.length > 0) {
    const topDefect = topDefects[0];
    const suggestions = [];

    if (topDefect.category === 'A') {
      suggestions.push(`优先处理${topDefect.name}等A类致命缺陷，该类缺陷对产品影响最大`);
    } else if (topDefect.category === 'B') {
      suggestions.push(`重点关注${topDefect.name}等B类严重缺陷，及时调整相关工序`);
    }

    if (machineData.length > 0 && machineData[0].defectCount > 0) {
      suggestions.push(`加强对${machineData[0].machine}机台的巡检频次和质量把关`);
    }

    if (categoryStats.length > 1 && categoryStats[0].percentage > 50) {
      suggestions.push(`集中资源解决${categoryStats[0].category}类缺陷问题，可显著提升整体质量水平`);
    }

    if (suggestions.length > 0) {
      summary.push(suggestions.join('；') + '。');
    } else {
      summary.push(`继续保持当前质量管理措施，定期回顾分析数据，持续优化改进。`);
    }
  }

  return summary;
}
