/**
 * 烟支物测标准库服务
 *
 * 统一读取 public/data/cigarette_physical_standards.json，
 * 提供按牌号、按指标查询标准及合格判定能力。
 */
import standardsData from '../../public/data/cigarette_physical_standards.json';

export interface PhysicalStandardValue {
  value: number | null;
  tolerance: number | null;
  min: number | null;
  max: number | null;
  unit: string;
  raw: string;
}

export interface PhysicalIndicatorStandard {
  name: string;
  unit: string;
  standard: PhysicalStandardValue;
}

export interface BrandPhysicalStandards {
  brand: string;
  indicators: Record<string, PhysicalIndicatorStandard>;
}

export interface PhysicalStandardsLibrary {
  metadata: {
    source: string;
    totalBrands: number;
    indicators: string[];
    updatedAt: string;
  };
  standards: Record<string, BrandPhysicalStandards>;
}

const library: PhysicalStandardsLibrary = standardsData as unknown as PhysicalStandardsLibrary;

/** 系统内部牌号 value → 标准库中文牌号名 */
export const BRAND_VALUE_TO_STANDARD_NAME: Record<string, string> = {
  'modern-eu': '摩登（中东-EU）',
  'normal-red-djibouti': '摩登（普通红吉布提）',
  'normal-red-intl': '摩登（普通红国际）',
  'normal-silver-intl': '摩登（普通银国际）',
  'slim': '摩登（细支）',
  'slim-gold': '摩登（细支金）',
  'ultra-slim': '摩登（超细支）',
  'ultra-gold': '摩登（超细金）',
  'ultra-silver': '摩登（超细银）',
  'ultra-black': '摩登（超细黑）',
  'ultra-white-97': '摩登（97超细白）',
};

/** 将系统内部 value 或中文名解析为标准库中的牌号 key */
export function resolveBrandName(brand: string): string | null {
  if (!brand) return null;
  if (library.standards[brand]) return brand;
  const mapped = BRAND_VALUE_TO_STANDARD_NAME[brand];
  if (mapped && library.standards[mapped]) return mapped;
  return null;
}

/** 物测指标 key 列表 */
export const PHYSICAL_INDICATOR_KEYS = ['length', 'circumference', 'drawResistance', 'weight', 'ventilation'] as const;

export type PhysicalIndicatorKey = (typeof PHYSICAL_INDICATOR_KEYS)[number];

/** 指标 key → 中文名 */
export const PHYSICAL_INDICATOR_LABELS: Record<PhysicalIndicatorKey, string> = {
  length: '长度',
  circumference: '烟支圆周',
  drawResistance: '吸阻',
  weight: '重量',
  ventilation: '通风度',
};

/** 指标 key → 单位 */
export const PHYSICAL_INDICATOR_UNITS: Record<PhysicalIndicatorKey, string> = {
  length: 'mm',
  circumference: 'mm',
  drawResistance: 'pa',
  weight: 'mg',
  ventilation: '%',
};

/** 指标数组（用于遍历） */
export const STANDARD_INDICATORS: { key: PhysicalIndicatorKey; name: string; unit: string }[] =
  PHYSICAL_INDICATOR_KEYS.map((key) => ({
    key,
    name: PHYSICAL_INDICATOR_LABELS[key],
    unit: PHYSICAL_INDICATOR_UNITS[key],
  }));

/** 获取标准库元数据 */
export function getStandardsMetadata() {
  return library.metadata;
}

/** 获取所有牌号列表 */
export function getAllBrands(): string[] {
  return Object.keys(library.standards);
}

/** 判断标准库中是否存在某牌号（支持内部 value 或中文名） */
export function hasBrand(brand: string): boolean {
  return !!resolveBrandName(brand);
}

/** 获取某牌号的全部物测标准（支持内部 value 或中文名） */
export function getBrandStandards(brand: string): BrandPhysicalStandards | null {
  const key = resolveBrandName(brand);
  if (!key) return null;
  return library.standards[key];
}

/** 获取某牌号某指标的标准（支持内部 value 或中文名） */
export function getIndicatorStandard(
  brand: string,
  indicator: PhysicalIndicatorKey
): PhysicalIndicatorStandard | null {
  const brandStd = getBrandStandards(brand);
  if (!brandStd) return null;
  return brandStd.indicators[indicator] || null;
}

/** 将指标 key 标准化（兼容大小写、中文名） */
export function normalizeIndicatorKey(input: string): PhysicalIndicatorKey | null {
  const s = input.trim().toLowerCase();
  const map: Record<string, PhysicalIndicatorKey> = {
    length: 'length',
    长度: 'length',
    circumference: 'circumference',
    烟支圆周: 'circumference',
    圆周: 'circumference',
    drawresistance: 'drawResistance',
    吸阻: 'drawResistance',
    weight: 'weight',
    重量: 'weight',
    ventilation: 'ventilation',
    通风度: 'ventilation',
  };
  return map[s] || null;
}

/** 判定单个检测值是否合格
 * @returns '合格' | '不合格' | '无标准'
 */
export function checkPhysicalValue(
  brand: string,
  indicator: PhysicalIndicatorKey | string,
  value: number
): '合格' | '不合格' | '无标准' {
  const brandKey = resolveBrandName(brand);
  const indKey = typeof indicator === 'string' ? normalizeIndicatorKey(indicator) : indicator;
  if (!brandKey || !indKey) return '无标准';
  const std = getIndicatorStandard(brandKey, indKey);
  if (!std || std.standard.value == null || std.standard.min == null || std.standard.max == null) {
    return '无标准';
  }
  return value >= std.standard.min && value <= std.standard.max ? '合格' : '不合格';
}

/** 计算检测值相对标准中心值的偏差
 * @returns 偏差值（带符号）或 null
 */
export function calcPhysicalDeviation(
  brand: string,
  indicator: PhysicalIndicatorKey | string,
  value: number
): number | null {
  const brandKey = resolveBrandName(brand);
  const indKey = typeof indicator === 'string' ? normalizeIndicatorKey(indicator) : indicator;
  if (!brandKey || !indKey) return null;
  const std = getIndicatorStandard(brandKey, indKey);
  if (!std || std.standard.value == null) return null;
  return Number((value - std.standard.value).toFixed(6));
}

/** 格式化标准值为可展示字符串 */
export function formatStandardValue(std: PhysicalIndicatorStandard | null): string {
  if (!std) return '无标准';
  if (std.standard.raw) return std.standard.raw;
  if (std.standard.value != null && std.standard.tolerance != null) {
    return `${std.standard.value}±${std.standard.tolerance}${std.unit}`;
  }
  return '无标准';
}

/** 获取标准范围的展示文本 */
export function formatStandardRange(std: PhysicalIndicatorStandard | null): string {
  if (!std) return '无标准';
  if (std.standard.min != null && std.standard.max != null) {
    return `${std.standard.min} ~ ${std.standard.max} ${std.unit}`;
  }
  return formatStandardValue(std);
}

/** 统一导出标准库原始数据 */
export { library as cigarettePhysicalStandardsLibrary };
