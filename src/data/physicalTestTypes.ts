/**
 * 烟支物测指标数据结构定义
 * 基于"烟支物测指标标准.xlsx"统一标准库
 */

// 物测指标类型
export interface PhysicalTestIndicator {
  id: string;              // 指标ID
  name: string;            // 指标名称（中文）
  nameEn: string;          // 指标名称（英文）
  unit?: string;           // 单位
  subItems: SubItem[];     // 子项（X, SD, MAX, MIN）
  standardKey: string;     // 对应标准库中的指标 key
}

// 子项类型
export interface SubItem {
  key: string;             // 子项键名（x, sd, max, min）
  label: string;           // 显示标签（X, SD, MAX, MIN）
  fullName: string;        // 全称（平均值、标准差、最大值、最小值）
  placeholder: string;     // 输入框占位符
}

// 单次检测记录的完整数据
export interface PhysicalTestRecord {
  // 基础信息
  id: string;
  date: string;                    // 日期
  shiftType: string;               // 班别（早班/夜班）
  shift: string;                   // 班次（1/2）
  machine: string;                 // 机台
  productionPoint: string;         // 合作生产点
  brand: string;                   // 牌号
  recorder: string;                // 记录人
  testTime: string;                // 烟支检测时间

  // 物测指标数据（与统一标准库对齐）
  length: IndicatorData;           // 长度
  circumference: IndicatorData;    // 烟支圆周
  drawResistance: IndicatorData;   // 吸阻
  weight: IndicatorData;           // 重量
  ventilation: IndicatorData;      // 通风度

  // 元数据
  createdAt: string;
  updatedAt: string;
  uploader?: string; // 上传者（当前登录用户）
}

// 单个指标的检测数据
export interface IndicatorData {
  x: string | number;      // 平均值 X
  sd: string | number;     // 标准差 SD
  max: string | number;    // 最大值 MAX
  min: string | number;    // 最小值 MIN
}

// 物测指标配置（与 public/data/cigarette_physical_standards.json 对齐）
export const PHYSICAL_TEST_INDICATORS: PhysicalTestIndicator[] = [
  {
    id: 'length',
    name: '长度',
    nameEn: 'Length',
    unit: 'mm',
    standardKey: 'length',
    subItems: [
      { key: 'x', label: 'X', fullName: '平均值', placeholder: '请输入X' },
      { key: 'sd', label: 'SD', fullName: '标准差', placeholder: '请输入SD' },
      { key: 'max', label: 'MAX', fullName: '最大值', placeholder: '请输入MAX' },
      { key: 'min', label: 'MIN', fullName: '最小值', placeholder: '请输入MIN' },
    ]
  },
  {
    id: 'circumference',
    name: '烟支圆周',
    nameEn: 'Circumference',
    unit: 'mm',
    standardKey: 'circumference',
    subItems: [
      { key: 'x', label: 'X', fullName: '平均值', placeholder: '请输入X' },
      { key: 'sd', label: 'SD', fullName: '标准差', placeholder: '请输入SD' },
      { key: 'max', label: 'MAX', fullName: '最大值', placeholder: '请输入MAX' },
      { key: 'min', label: 'MIN', fullName: '最小值', placeholder: '请输入MIN' },
    ]
  },
  {
    id: 'drawResistance',
    name: '吸阻',
    nameEn: 'Draw Resistance',
    unit: 'pa',
    standardKey: 'drawResistance',
    subItems: [
      { key: 'x', label: 'X', fullName: '平均值', placeholder: '请输入X' },
      { key: 'sd', label: 'SD', fullName: '标准差', placeholder: '请输入SD' },
      { key: 'max', label: 'MAX', fullName: '最大值', placeholder: '请输入MAX' },
      { key: 'min', label: 'MIN', fullName: '最小值', placeholder: '请输入MIN' },
    ]
  },
  {
    id: 'weight',
    name: '重量',
    nameEn: 'Weight',
    unit: 'mg',
    standardKey: 'weight',
    subItems: [
      { key: 'x', label: 'X', fullName: '平均值', placeholder: '请输入X' },
      { key: 'sd', label: 'SD', fullName: '标准差', placeholder: '请输入SD' },
      { key: 'max', label: 'MAX', fullName: '最大值', placeholder: '请输入MAX' },
      { key: 'min', label: 'MIN', fullName: '最小值', placeholder: '请输入MIN' },
    ]
  },
  {
    id: 'ventilation',
    name: '通风度',
    nameEn: 'Ventilation',
    unit: '%',
    standardKey: 'ventilation',
    subItems: [
      { key: 'x', label: 'X', fullName: '平均值', placeholder: '请输入X' },
      { key: 'sd', label: 'SD', fullName: '标准差', placeholder: '请输入SD' },
      { key: 'max', label: 'MAX', fullName: '最大值', placeholder: '请输入MAX' },
      { key: 'min', label: 'MIN', fullName: '最小值', placeholder: '请输入MIN' },
    ]
  }
];

// 默认空指标数据
export const createEmptyIndicatorData = (): IndicatorData => ({
  x: '',
  sd: '',
  max: '',
  min: ''
});

// 默认空记录
export const createEmptyPhysicalTestRecord = (): Omit<PhysicalTestRecord, 'id' | 'createdAt' | 'updatedAt'> => ({
  date: '',
  shiftType: '',
  shift: '',
  machine: '',
  productionPoint: '',
  brand: '',
  recorder: '',
  testTime: '',
  length: createEmptyIndicatorData(),
  circumference: createEmptyIndicatorData(),
  drawResistance: createEmptyIndicatorData(),
  weight: createEmptyIndicatorData(),
  ventilation: createEmptyIndicatorData()
});
