import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  Printer,
  Eye,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Factory,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Pencil,
  Trash2,
  Save,
  User,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Scatter,
  ResponsiveContainer,
} from 'recharts';
import {
  RECORD_TYPE,
  listTypedRecords,
  updateTypedRecord,
  deleteTypedRecord,
} from '@/services/qualityData';
import { formatDateTime, formatLocalDate } from '@/utils/analysisUtils';

// 导入类型定义
import type {
  PhysicalTestRecord,
  IndicatorData,
} from '@/data/physicalTestTypes';
import {
  PHYSICAL_TEST_INDICATORS,
} from '@/data/physicalTestTypes';
import {
  getBrandStandards,
  getIndicatorStandard,
  checkPhysicalValue,
  formatStandardValue,
  formatStandardRange,
  resolveBrandName,
  type PhysicalIndicatorKey,
} from '@/services/cigarettePhysicalStandardService';

// 筛选条件接口
interface FilterConditions {
  dateFrom: string;
  dateTo: string;
  productionPoint: string;
  brand: string;
  shiftType: string;
  shift: string;
  machine: string;
}

// 常量定义 - 与录入页面保持一致
const PRODUCTION_POINTS = [
  { value: 'uae', label: '阿联酋环球烟草' },
  { value: 'indonesia', label: '印尼科伦印象' },
];

const BRANDS = [
  { value: 'modern-eu', label: '摩登（中东-EU）' },
  { value: 'normal-red-djibouti', label: '摩登（普通红吉布提）' },
  { value: 'normal-red-intl', label: '摩登（普通红国际）' },
  { value: 'normal-silver-intl', label: '摩登（普通银国际）' },
  { value: 'slim', label: '摩登（细支）' },
  { value: 'slim-gold', label: '摩登（细支金）' },
  { value: 'ultra-slim', label: '摩登（超细支）' },
  { value: 'ultra-gold', label: '摩登（超细金）' },
  { value: 'ultra-silver', label: '摩登（超细银）' },
  { value: 'ultra-black', label: '摩登（超细黑）' },
  { value: 'ultra-white-97', label: '摩登（97超细白）' },
];

const SHIFT_TYPES = [
  { value: 'morning', label: '早班' },
  { value: 'night', label: '夜班' },
];

const SHIFTS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
];

const MACHINES = [
  { value: '2#', label: '2#' },
  { value: '4#', label: '4#' },
  { value: '9#', label: '9#' },
  { value: '10#', label: '10#' },
  { value: 'ALW 9#', label: 'ALW 9#' },
  { value: 'ALW 1#', label: 'ALW 1#' },
];

// 每页显示条数
const PAGE_SIZE = 15;

// 烟支物测规格限统一从标准库读取，不再写死
function getSpecLimits(brand: string, indicatorId: string) {
  const std = getIndicatorStandard(brand, indicatorId as PhysicalIndicatorKey);
  if (!std || std.standard.value == null || std.standard.min == null || std.standard.max == null) {
    return null;
  }
  return {
    USL: std.standard.max,
    LSL: std.standard.min,
    target: std.standard.value,
    unit: std.unit,
    display: formatStandardValue(std),
  };
}

// 趋势图数据点接口
interface TrendDataPoint {
  index: number;
  label: string;
  value: number;
  date: string;
  machine: string;
  isOutSpec: boolean;
}

export function CigarettePhysicalTestQuery() {
  // 获取当天日期
  const getTodayDate = () => formatLocalDate(new Date());

  // 状态管理
  const [allData, setAllData] = useState<PhysicalTestRecord[]>([]);
  const [filters, setFilters] = useState<FilterConditions>({
    dateFrom: getTodayDate(),
    dateTo: getTodayDate(),
    productionPoint: '',
    brand: '',
    shiftType: '',
    shift: '',
    machine: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<PhysicalTestRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('weight');
  const printRef = useRef<HTMLDivElement>(null);

  // 编辑与删除状态
  const [editingRecord, setEditingRecord] = useState<PhysicalTestRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<PhysicalTestRecord>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PhysicalTestRecord | null>(null);

  // 加载数据
  useEffect(() => {
    loadData();
    const refresh = () => { loadData(); };
    window.addEventListener('quality-data-updated', refresh);
    return () => window.removeEventListener('quality-data-updated', refresh);
  }, []);

  const loadData = async () => {
    try {
      const records = await listTypedRecords<PhysicalTestRecord>(RECORD_TYPE.PHYSICAL);
      const validRecords = records.filter(r =>
        r && r.id && r.date && (r.weight || r.circumference || r.drawResistance || r.ventilation || r.length)
      ).map(r => {
        if ((r as PhysicalTestRecord & { ventilationLength?: IndicatorData }).ventilationLength && !r.ventilation) {
          return { ...r, ventilation: (r as PhysicalTestRecord & { ventilationLength?: IndicatorData }).ventilationLength };
        }
        return r;
      });
      setAllData(validRecords);
    } catch (error) {
      console.error('加载烟支物测数据失败:', error);
      setAllData([]);
    }
  };

  // 根据筛选条件过滤数据
  const filteredData = useMemo(() => {
    let data = [...allData];

    // 日期筛选
    if (filters.dateFrom) {
      data = data.filter(r => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      data = data.filter(r => r.date <= filters.dateTo);
    }

    // 合作生产点筛选
    if (filters.productionPoint) {
      data = data.filter(r => r.productionPoint === filters.productionPoint);
    }

    // 牌号筛选
    if (filters.brand) {
      data = data.filter(r => r.brand === filters.brand);
    }

    // 班别筛选
    if (filters.shiftType) {
      data = data.filter(r => r.shiftType === filters.shiftType);
    }

    // 班次筛选
    if (filters.shift) {
      data = data.filter(r => String(r.shift) === filters.shift);
    }

    // 机台筛选
    if (filters.machine) {
      data = data.filter(r => r.machine === filters.machine);
    }

    return data;
  }, [allData, filters]);

  // 趋势图数据计算
  const trendData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const indicator = PHYSICAL_TEST_INDICATORS.find(ind => ind.id === selectedIndicator);
    if (!indicator) return [];

    // 提取有效数据点（优先使用筛选牌号的标准，无筛选时使用逐条记录牌号标准）
    const dataPoints: TrendDataPoint[] = [];
    filteredData.forEach((record, idx) => {
      const data = record[indicator.id as keyof PhysicalTestRecord] as IndicatorData;
      if (data && data.x !== '' && data.x != null) {
        const value = parseFloat(String(data.x));
        if (!isNaN(value)) {
          const brand = filters.brand || record.brand;
          const specLimits = getSpecLimits(brand, indicator.id);
          dataPoints.push({
            index: idx + 1,
            label: `${record.date} ${record.machine || ''}`,
            value: value,
            date: record.date,
            machine: record.machine || '',
            isOutSpec: specLimits ? (value > specLimits.USL || value < specLimits.LSL) : false,
          });
        }
      }
    });

    return dataPoints;
  }, [filteredData, selectedIndicator, filters.brand]);

  // 计算过程统计量
  const processStats = useMemo(() => {
    if (trendData.length === 0) {
      return { CL: 0, USL: 0, LSL: 0, target: 0, stdDev: 0, outSpecCount: 0, outSpecRate: 0, unit: '' };
    }

    // 统一使用当前筛选牌号或第一条记录牌号的标准
    const referenceBrand = filters.brand || filteredData[0]?.brand || '';
    const specLimits = getSpecLimits(referenceBrand, selectedIndicator);
    const values = trendData.map(d => d.value);

    // 计算均值（CL）
    const sum = values.reduce((acc, val) => acc + val, 0);
    const CL = sum / values.length;

    // 计算标准差
    const squaredDiffs = values.map(val => Math.pow(val - CL, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // 超规格数量
    const outSpecCount = trendData.filter(d => d.isOutSpec).length;
    const outSpecRate = (outSpecCount / trendData.length) * 100;

    return {
      CL: parseFloat(CL.toFixed(3)),
      USL: specLimits?.USL ?? 0,
      LSL: specLimits?.LSL ?? 0,
      target: specLimits?.target ?? 0,
      unit: specLimits?.unit ?? '',
      stdDev: parseFloat(stdDev.toFixed(3)),
      outSpecCount,
      outSpecRate: parseFloat(outSpecRate.toFixed(1)),
    };
  }, [trendData, selectedIndicator, filters.brand, filteredData]);

  // 过程状态判断
  const processStatus = useMemo(() => {
    if (trendData.length === 0) {
      return { status: 'no-data', label: '暂无数据', color: 'text-muted-foreground', bgColor: 'bg-secondary/50', icon: FileText };
    }

    const { outSpecRate, stdDev } = processStats;
    const specRange = processStats.USL - processStats.LSL;
    const cv = (stdDev / processStats.CL) * 100; // 变异系数

    // 判断逻辑
    if (outSpecRate > 0) {
      return {
        status: 'out-spec',
        label: `存在超规格数据 (${processStats.outSpecCount}个)`,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: AlertTriangle,
      };
    } else if (cv > 5) {
      return {
        status: 'unstable',
        label: '存在波动，需关注',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: Activity,
      };
    } else {
      return {
        status: 'stable',
        label: '过程稳定',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-30',
        icon: CheckCircle2,
      };
    }
  }, [trendData, processStats]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredData, currentPage]);

  // 总页数
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      dateFrom: getTodayDate(),
      dateTo: getTodayDate(),
      productionPoint: '',
      brand: '',
      shiftType: '',
      shift: '',
      machine: '',
    });
    setCurrentPage(1);
  };

  // 查询按钮点击
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // 查看详情
  const handleViewDetail = (record: PhysicalTestRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // 删除确认
  const handleDeleteClick = (record: PhysicalTestRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  // 执行删除
  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteTypedRecord(Number(recordToDelete.id));
      setAllData(allData.filter(r => r.id !== recordToDelete.id));
    } catch (e) {
      console.error(e);
      alert('删除失败，请检查网络或后端服务');
    }
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  // 打开编辑弹窗
  const handleEditClick = (record: PhysicalTestRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingRecord || !editForm) return;
    const merged = {
      ...editingRecord,
      ...editForm,
      updatedAt: new Date().toISOString(),
    } as PhysicalTestRecord;
    try {
      await updateTypedRecord(Number(editingRecord.id), merged as unknown as Record<string, unknown>);
      setAllData(allData.map(r => (r.id === editingRecord.id ? merged : r)));
      setEditingRecord(null);
      setEditForm({});
    } catch (e) {
      console.error(e);
      alert('保存失败，请检查网络或后端服务');
    }
  };

  // 取消编辑/删除
  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  // 更新编辑表单基础字段
  const updateEditField = (field: keyof PhysicalTestRecord, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // 更新编辑表单指标字段
  const updateEditIndicator = (indicatorId: string, subKey: keyof IndicatorData, value: string) => {
    setEditForm(prev => {
      const current = (prev[indicatorId as keyof PhysicalTestRecord] as IndicatorData) || { x: '', sd: '', max: '', min: '' };
      return {
        ...prev,
        [indicatorId]: { ...current, [subKey]: value },
      };
    });
  };

  // 导出Excel
  const handleExportExcel = () => {
    try {
      // 准备导出数据
      const exportData = filteredData.map(record => {
        const row: Record<string, any> = {
          '日期': record.date,
          '班别': record.shiftType === 'morning' ? '早班' : record.shiftType === 'night' ? '夜班' : record.shiftType,
          '班次': record.shift,
          '机台': record.machine,
          '合作生产点': PRODUCTION_POINTS.find(p => p.value === record.productionPoint)?.label || record.productionPoint,
          '牌号': BRANDS.find(b => b.value === record.brand)?.label?.replace('摩登（', '').replace('）', '') || record.brand,
          '记录人': record.recorder,
          '检测时间': record.testTime,
          '上传者': record.uploader || '-',
          '上传时间': formatDateTime(record.createdAt),
          '更新时间': formatDateTime(record.updatedAt),
        };

        // 添加物测指标
        PHYSICAL_TEST_INDICATORS.forEach(indicator => {
          const data = record[indicator.id as keyof PhysicalTestRecord] as IndicatorData;
          if (data) {
            row[`${indicator.name}-X`] = data.x !== '' && data.x != null ? parseFloat(String(data.x)).toFixed(2) : '';
            row[`${indicator.name}-SD`] = data.sd !== '' && data.sd != null ? parseFloat(String(data.sd)).toFixed(3) : '';
            row[`${indicator.name}-MAX`] = data.max !== '' && data.max != null ? parseFloat(String(data.max)).toFixed(2) : '';
            row[`${indicator.name}-MIN`] = data.min !== '' && data.min != null ? parseFloat(String(data.min)).toFixed(2) : '';
          }
        });

        return row;
      });

      // 创建CSV内容（简单实现，实际项目中可使用xlsx库）
      if (exportData.length === 0) {
        alert('没有数据可导出');
        return;
      }

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      // 添加BOM以支持中文
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `烟支物测数据_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      alert(`成功导出 ${exportData.length} 条记录`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 打印
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器是否阻止了弹窗');
      return;
    }

    const now = new Date();
    const dateTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>烟支物测数据查询结果</title>
          <style>
            body {
              font-family: "Microsoft YaHei", Arial, sans-serif;
              padding: 20px;
              font-size: 12px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .header h1 {
              font-size: 18px;
              margin: 0 0 10px 0;
              color: #333;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .filter-info {
              background: #f5f5f5;
              padding: 10px;
              margin-bottom: 15px;
              border-radius: 4px;
            }
            .filter-info p {
              margin: 3px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 8px;
              text-align: center;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            .footer {
              margin-top: 20px;
              text-align: right;
              color: #666;
              font-size: 11px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>智·质——卷烟数智化质量管理与智能分析平台</h1>
            <p><strong>烟支物测数据查询结果</strong></p>
          </div>

          <div class="filter-info">
            <p><strong>查询条件：</strong></p>
            <p>日期范围：${filters.dateFrom} 至 ${filters.dateTo}</p>
            ${filters.productionPoint ? `<p>合作生产点：${PRODUCTION_POINTS.find(p => p.value === filters.productionPoint)?.label}</p>` : ''}
            ${filters.brand ? `<p>牌号：${BRANDS.find(b => b.value === filters.brand)?.label}</p>` : ''}
            ${filters.machine ? `<p>机台：${filters.machine}</p>` : ''}
            ${filters.shiftType ? `<p>班别：${SHIFT_TYPES.find(s => s.value === filters.shiftType)?.label}</p>` : ''}
            ${filters.shift ? `<p>班次：${filters.shift}</p>` : ''}
            <p>查询时间：${dateTimeStr}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>日期</th>
                <th>班别</th>
                <th>班次</th>
                <th>机台</th>
                <th>牌号</th>
                ${PHYSICAL_TEST_INDICATORS.map(ind => `<th>${ind.name}<br/>X</th><th>SD</th><th>MAX</th><th>MIN</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((record, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${record.date}</td>
                  <td>${record.shiftType === 'morning' ? '早班' : record.shiftType === 'night' ? '夜班' : record.shiftType}</td>
                  <td>${record.shift}</td>
                  <td>${record.machine}</td>
                  <td>${BRANDS.find(b => b.value === record.brand)?.label?.replace('摩登（', '').replace('）', '') || record.brand}</td>
                  ${PHYSICAL_TEST_INDICATORS.map(ind => {
                    const data = record[ind.id as keyof PhysicalTestRecord] as IndicatorData;
                    return data ? `
                      <td>${data.x !== '' && data.x != null ? parseFloat(String(data.x)).toFixed(2) : '-'}</td>
                      <td>${data.sd !== '' && data.sd != null ? parseFloat(String(data.sd)).toFixed(3) : '-'}</td>
                      <td>${data.max !== '' && data.max != null ? parseFloat(String(data.max)).toFixed(2) : '-'}</td>
                      <td>${data.min !== '' && data.min != null ? parseFloat(String(data.min)).toFixed(2) : '-'}</td>
                    ` : '<td>-</td><td>-</td><td>-</td><td>-</td>';
                  }).join('')}
                  <td>${record.uploader || '-'}</td>
                  <td>${formatDateTime(record.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>共 ${filteredData.length} 条记录 | 打印时间：${dateTimeStr}</p>
            <p>系统名称：智·质——卷烟数智化质量管理与智能分析平台</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // 获取显示标签的辅助函数
  const getBrandLabel = (value: string) => {
    return BRANDS.find(b => b.value === value)?.label?.replace('摩登（', '').replace('）', '') || value;
  };

  const getShiftLabel = (value: string) => {
    return SHIFT_TYPES.find(s => s.value === value)?.label || value;
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Search className="w-7 h-7 text-brand-blue" />
          烟支物测数据查询
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          查询烟支物测指标录入中已保存的检测数据
        </p>
      </div>

      {/* 筛选区域 */}
      <div className="data-card mb-6">
        {/* 筛选标题栏 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand-blue" />
            <span className="font-semibold text-foreground">筛选条件</span>
          </div>
          {showFilters ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* 筛选表单 */}
        {showFilters && (
          <div className="px-6 pb-6 border-t border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {/* 日期范围 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">结束日期</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* 合作生产点 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <Factory className="w-4 h-4 inline mr-1" />
                  合作生产点
                </label>
                <select
                  value={filters.productionPoint}
                  onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {PRODUCTION_POINTS.map(point => (
                    <option key={point.value} value={point.value}>{point.label}</option>
                  ))}
                </select>
              </div>

              {/* 牌号 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <Package className="w-4 h-4 inline mr-1" />
                  牌号
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {BRANDS.map(brand => (
                    <option key={brand.value} value={brand.value}>{brand.label}</option>
                  ))}
                </select>
              </div>

              {/* 机台 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">机台</label>
                <select
                  value={filters.machine}
                  onChange={(e) => setFilters({ ...filters, machine: e.target.value })}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {MACHINES.map(machine => (
                    <option key={machine.value} value={machine.value}>{machine.label}</option>
                  ))}
                </select>
              </div>

              {/* 班别 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">班别</label>
                <select
                  value={filters.shiftType}
                  onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {SHIFT_TYPES.map(shift => (
                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                  ))}
                </select>
              </div>

              {/* 班次 */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">班次</label>
                <select
                  value={filters.shift}
                  onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {SHIFTS.map(shift => (
                    <option key={shift.value} value={shift.value}>{shift.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-border/30">
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
              <button
                onClick={resetFilters}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={handleExportExcel}
                className="btn-secondary flex items-center gap-2"
                disabled={filteredData.length === 0}
              >
                <Download className="w-4 h-4" />
                导出Excel
              </button>
              <button
                onClick={handlePrint}
                className="btn-secondary flex items-center gap-2"
                disabled={filteredData.length === 0}
              >
                <Printer className="w-4 h-4" />
                打印
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 数据统计信息 */}
      <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
        <div className="text-sm text-brand-blue">
          <FileText className="w-4 h-4 inline mr-2" />
          共查询到 <span className="font-bold text-foreground">{filteredData.length}</span> 条记录
          {filteredData.length > 0 && (
            <span className="ml-2">
              （第 {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredData.length)} 条）
            </span>
          )}
        </div>
      </div>

      {/* 数据表格 */}
      <div className="data-card overflow-hidden" ref={printRef}>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-border/30">
            <thead className="bg-secondary/50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  序号
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  日期
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  班别
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  班次
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  机台
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  牌号
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  上传者
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  上传时间
                </th>
                {PHYSICAL_TEST_INDICATORS.map(indicator => (
                  <React.Fragment key={indicator.id}>
                    <th colSpan={4} className="px-3 py-2 text-center text-xs font-semibold text-foreground uppercase tracking-wider bg-brand-blue/10">
                      {indicator.name} ({indicator.unit})
                    </th>
                  </React.Fragment>
                ))}
                <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  操作
                </th>
              </tr>
              {/* 子表头 */}
              <tr className="bg-secondary/30">
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                <th className="px-3 py-2"></th>
                {PHYSICAL_TEST_INDICATORS.map(indicator => (
                  <React.Fragment key={`${indicator.id}-sub`}>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">X</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">SD</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">MAX</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">MIN</th>
                  </React.Fragment>
                ))}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <tr key={record.id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {getShiftLabel(record.shiftType)}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground text-center whitespace-nowrap">
                      {record.shift}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {record.machine}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {getBrandLabel(record.brand)}
                    </td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {record.uploader || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(record.createdAt)}
                    </td>
                    {PHYSICAL_TEST_INDICATORS.map(indicator => {
                      const data = record[indicator.id as keyof PhysicalTestRecord] as IndicatorData;
                      return (
                        <React.Fragment key={`${record.id}-${indicator.id}`}>
                          <td className="px-2 py-3 text-sm text-foreground text-center whitespace-nowrap font-medium">
                            {data && data.x !== '' && data.x != null ? parseFloat(String(data.x)).toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-3 text-sm text-muted-foreground text-center whitespace-nowrap">
                            {data && data.sd !== '' && data.sd != null ? parseFloat(String(data.sd)).toFixed(3) : '-'}
                          </td>
                          <td className="px-2 py-3 text-sm text-muted-foreground text-center whitespace-nowrap">
                            {data && data.max !== '' && data.max != null ? parseFloat(String(data.max)).toFixed(2) : '-'}
                          </td>
                          <td className="px-2 py-3 text-sm text-muted-foreground text-center whitespace-nowrap">
                            {data && data.min !== '' && data.min != null ? parseFloat(String(data.min)).toFixed(2) : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="text-brand-blue hover:text-brand-blue/80 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
                        >
                          <Pencil className="w-4 h-4" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8 + PHYSICAL_TEST_INDICATORS.length * 4 + 1}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">暂无物测数据</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        当前筛选条件下没有找到烟支物测数据。
                        请先在"过程质量管控 → 烟支物测指标数据录入"中添加数据，
                        或调整筛选条件重新查询。
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="bg-secondary/50 px-4 py-3 flex items-center justify-between border-t border-border/30 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  显示第{' '}
                  <span className="font-medium text-foreground">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                  {' '}到{' '}
                  <span className="font-medium text-foreground">
                    {Math.min(currentPage * PAGE_SIZE, filteredData.length)}
                  </span>
                  {' '}条，共{' '}
                  <span className="font-medium text-foreground">{filteredData.length}</span> 条记录
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md bg-background px-2 py-2 text-sm font-semibold text-foreground ring-1 ring-inset ring-border hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-foreground bg-brand-blue/10">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md bg-background px-2 py-2 text-sm font-semibold text-foreground ring-1 ring-inset ring-border hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 六西格玛过程趋势分析 */}
      <div className="data-card mt-6">
        <div className="px-6 py-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              烟支物测指标趋势分析
            </h2>
            <div className="flex items-center gap-4">
              {/* 物测指标选择 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">物测指标：</label>
                <select
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  className="form-select text-sm"
                >
                  {PHYSICAL_TEST_INDICATORS.map(indicator => (
                    <option key={indicator.id} value={indicator.id}>
                      {indicator.name} ({indicator.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* 过程状态标识 */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${processStatus.bgColor} border ${processStatus.borderColor || 'border-transparent'}`}>
                <processStatus.icon className={`w-4 h-4 ${processStatus.color}`} />
                <span className={`text-sm font-medium ${processStatus.color}`}>{processStatus.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* 统计信息卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
              <div className="text-xs text-muted-foreground mb-1">中心线 (CL)</div>
              <div className="text-lg font-bold text-brand-blue">{processStats.CL}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
              <div className="text-xs text-muted-foreground mb-1">规格上限 (USL)</div>
              <div className="text-lg font-bold text-red-400">{processStats.USL}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
              <div className="text-xs text-muted-foreground mb-1">规格下限 (LSL)</div>
              <div className="text-lg font-bold text-red-400">{processStats.LSL}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
              <div className="text-xs text-muted-foreground mb-1">标准差 (σ)</div>
              <div className="text-lg font-bold text-foreground">{processStats.stdDev}</div>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
              <div className="text-xs text-muted-foreground mb-1">样本数量</div>
              <div className="text-lg font-bold text-foreground">{trendData.length}</div>
            </div>
          </div>

          {/* 趋势图 */}
          {trendData.length > 0 ? (
            <div className="bg-background/50 rounded-xl p-4 border border-border/30" style={{ height: '450px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

                  <XAxis
                    dataKey="index"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    label={{
                      value: '检测顺序',
                      position: 'bottom',
                      offset: 40,
                      fill: '#94a3b8',
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    domain={['auto', 'auto']}
                    label={{
                      value: `${PHYSICAL_TEST_INDICATORS.find(ind => ind.id === selectedIndicator)?.name || ''} (${PHYSICAL_TEST_INDICATORS.find(ind => ind.id === selectedIndicator)?.unit || ''})`,
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#94a3b8',
                      fontSize: 12,
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === '检测值') {
                        return [value.toFixed(2), name];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `第 ${label} 次检测`}
                  />

                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span style={{ color: '#e2e8f0' }}>{value}</span>}
                  />

                  {/* 规格上限 USL */}
                  <ReferenceLine
                    y={processStats.USL}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    label={{
                      value: `USL (${processStats.USL})`,
                      position: 'right',
                      fill: '#ef4444',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* 规格下限 LSL */}
                  <ReferenceLine
                    y={processStats.LSL}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    label={{
                      value: `LSL (${processStats.LSL})`,
                      position: 'right',
                      fill: '#ef4444',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* 中心线 CL */}
                  <ReferenceLine
                    y={processStats.CL}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `CL (${processStats.CL})`,
                      position: 'right',
                      fill: '#3b82f6',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  />

                  {/* 实际测量值折线 */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="检测值"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                  />

                  {/* 超规格异常点 - 使用Scatter标记 */}
                  <Scatter
                    data={trendData.filter(d => d.isOutSpec)}
                    x="index"
                    y="value"
                    fill="#ef4444"
                    r={6}
                    shape="circle"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-background/30 rounded-xl border border-border/20">
              <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">暂无趋势数据</h3>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                当前筛选条件下没有找到"{PHYSICAL_TEST_INDICATORS.find(ind => ind.id === selectedIndicator)?.name}"的有效检测数据。
                请先录入数据或调整筛选条件。
              </p>
            </div>
          )}

          {/* 图例说明 */}
          {trendData.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-cyan-500"></div>
                <span>实际测量值</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3b82f6' }}></div>
                <span>中心线 CL（过程均值）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
                <span>规格限 USL / LSL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>超规格异常点</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in border border-border/50">
            {/* 弹窗头部 */}
            <div className="bg-gradient-to-r from-brand-blue to-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                烟支物测检测详情
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* 基础信息卡片 */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/30">
                  基础信息
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">日期</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord.date}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">班别</div>
                    <div className="text-sm font-medium text-foreground">{getShiftLabel(selectedRecord.shiftType)}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">班次</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord.shift}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">机台</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord.machine}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">合作生产点</div>
                    <div className="text-sm font-medium text-foreground">
                      {PRODUCTION_POINTS.find(p => p.value === selectedRecord.productionPoint)?.label || selectedRecord.productionPoint}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">牌号</div>
                    <div className="text-sm font-medium text-foreground">
                      {BRANDS.find(b => b.value === selectedRecord.brand)?.label || selectedRecord.brand}
                    </div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">记录人</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord.recorder || '-'}</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border/20">
                    <div className="text-xs text-muted-foreground mb-1">检测时间</div>
                    <div className="text-sm font-medium text-foreground">{selectedRecord.testTime || '-'}</div>
                  </div>
                </div>
              </div>

              {/* 物测指标详情表格 */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/30">
                  物测指标详细数据
                </h3>
                <table className="w-full divide-y divide-border/30 border border-border/30">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">指标名称</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">单位</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">X (平均值)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">SD (标准差)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">MAX (最大值)</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-foreground">MIN (最小值)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {PHYSICAL_TEST_INDICATORS.map(indicator => {
                      const data = selectedRecord[indicator.id as keyof PhysicalTestRecord] as IndicatorData;
                      if (!data) return null;

                      return (
                        <tr key={indicator.id} className="hover:bg-accent/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{indicator.name}</span>
                              <span className="text-xs text-muted-foreground">({indicator.nameEn})</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground">{indicator.unit}</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                            {data.x !== '' && data.x != null ? parseFloat(String(data.x)).toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                            {data.sd !== '' && data.sd != null ? parseFloat(String(data.sd)).toFixed(3) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                            {data.max !== '' && data.max != null ? parseFloat(String(data.max)).toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                            {data.min !== '' && data.min != null ? parseFloat(String(data.min)).toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 元数据信息 */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">创建时间：</span>
                    {selectedRecord.createdAt || '-'}
                  </div>
                  <div>
                    <span className="font-medium">更新时间：</span>
                    {selectedRecord.updatedAt || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingRecord && editForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in border border-border/50">
            <div className="bg-gradient-to-r from-brand-blue to-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                修改烟支物测记录
              </h2>
              <button onClick={cancelEdit} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
              {/* 基础信息编辑 */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/30">基础信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">日期</label>
                    <input
                      type="date"
                      value={(editForm.date as string) || ''}
                      onChange={(e) => updateEditField('date', e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">班别</label>
                    <select
                      value={(editForm.shiftType as string) || ''}
                      onChange={(e) => updateEditField('shiftType', e.target.value)}
                      className="form-select text-sm"
                    >
                      <option value="">请选择</option>
                      {SHIFT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">班次</label>
                    <select
                      value={(editForm.shift as string) || ''}
                      onChange={(e) => updateEditField('shift', e.target.value)}
                      className="form-select text-sm"
                    >
                      <option value="">请选择</option>
                      {SHIFTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">机台</label>
                    <select
                      value={(editForm.machine as string) || ''}
                      onChange={(e) => updateEditField('machine', e.target.value)}
                      className="form-select text-sm"
                    >
                      <option value="">请选择</option>
                      {MACHINES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">合作生产点</label>
                    <select
                      value={(editForm.productionPoint as string) || ''}
                      onChange={(e) => updateEditField('productionPoint', e.target.value)}
                      className="form-select text-sm"
                    >
                      <option value="">请选择</option>
                      {PRODUCTION_POINTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">牌号</label>
                    <select
                      value={(editForm.brand as string) || ''}
                      onChange={(e) => updateEditField('brand', e.target.value)}
                      className="form-select text-sm"
                    >
                      <option value="">请选择</option>
                      {BRANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">记录人</label>
                    <input
                      type="text"
                      value={(editForm.recorder as string) || ''}
                      onChange={(e) => updateEditField('recorder', e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">检测时间</label>
                    <input
                      type="time"
                      value={(editForm.testTime as string) || ''}
                      onChange={(e) => updateEditField('testTime', e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 物测指标编辑 */}
              <div>
                <h3 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border/30">物测指标数据</h3>
                <div className="space-y-4">
                  {PHYSICAL_TEST_INDICATORS.map(indicator => {
                    const data = (editForm[indicator.id as keyof PhysicalTestRecord] as IndicatorData) || { x: '', sd: '', max: '', min: '' };
                    return (
                      <div key={indicator.id} className="bg-secondary/30 rounded-lg p-4 border border-border/20">
                        <h4 className="text-sm font-semibold text-foreground mb-3">{indicator.name} ({indicator.unit})</h4>
                        <div className="grid grid-cols-4 gap-4">
                          {(['x', 'sd', 'max', 'min'] as const).map(key => (
                            <div key={key} className="space-y-1.5">
                              <label className="text-xs text-muted-foreground uppercase">{key}</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={data[key] || ''}
                                onChange={(e) => updateEditIndicator(indicator.id, key, e.target.value)}
                                className="form-input text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/30 bg-secondary/20">
              <button onClick={cancelEdit} className="px-5 py-2 rounded-lg border border-border hover:bg-accent/10 text-sm font-medium">
                取消
              </button>
              <button onClick={saveEdit} className="px-5 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 text-sm font-medium flex items-center gap-2">
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && recordToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-md border border-border/50 p-6 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">确认删除记录？</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  记录日期：{recordToDelete.date}，机台：{recordToDelete.machine}<br />
                  删除后无法恢复，请谨慎操作。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); }}
                className="px-5 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent/10"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS动画样式 */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
