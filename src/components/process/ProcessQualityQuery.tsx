import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  Factory,
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ArrowLeft,
  X,
} from 'lucide-react';

// 导入缺陷库（用于详情展示）
import type { DefectRecord as DefectRecordType } from './AppearanceDefectInput';

// 数据接口定义
interface ProcessQualityData {
  id: string;
  // 基础信息
  date: string;
  shiftType: string;      // 班别
  shift: string;          // 班次
  machine: string;        // 机台
  productionPoint: string; // 合作生产点
  brand: string;          // 牌号
  recorder: string;       // 记录人
  samplingTime: string;   // 取样时间
  samplingNo: string;     // 取样件号
  steelStamp: string;     // 条盒钢印
  tobaccoBatch: string;   // 烟丝批次
  // 外观缺陷
  boxDefects?: DefectRecordType[];
  cartonDefects?: DefectRecordType[];
  packDefects?: DefectRecordType[];
  cigaretteDefects?: DefectRecordType[];
  // 时间戳
  createdAt: string;
  updatedAt: string;
}

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
const SHIFT_TYPES = ['早班', '夜班'];
const SHIFTS = ['1', '2'];
const MACHINES = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];

export function ProcessQualityQuery() {
  // 获取当天日期（YYYY-MM-DD格式）
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 状态管理
  const [allData, setAllData] = useState<ProcessQualityData[]>([]);
  const [filteredData, setFilteredData] = useState<ProcessQualityData[]>([]);
  const [filters, setFilters] = useState<FilterConditions>({
    dateFrom: getTodayDate(),  // 默认当天日期
    dateTo: getTodayDate(),    // 默认当天日期
    productionPoint: '',
    brand: '',
    shiftType: '',
    shift: '',
    machine: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessQualityData | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：加载数据（从localStorage或使用模拟数据）
  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = () => {
    setIsLoading(true);
    try {
      // 从localStorage加载已保存的数据（统一使用 processQualityData key）
      const savedData = localStorage.getItem('processQualityData');
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log(`✅ 成功加载 ${data.length} 条质量记录`);
        setAllData(data);
        setFilteredData(data);
      } else {
        // 没有数据时显示空状态
        console.log('ℹ️ 暂无保存的质量记录');
        setAllData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('❌ 加载数据失败:', error);
      setAllData([]);
      setFilteredData([]);
    }
    setIsLoading(false);
  };

  // 监听storage变化（当其他页面提交数据时自动刷新）
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 检测到数据更新，重新加载...');
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 生成模拟数据（用于演示）
  const generateMockData = (): ProcessQualityData[] => {
    const mockData: ProcessQualityData[] = [];
    const today = new Date();

    for (let i = 0; i < 25; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(i / 3));

      mockData.push({
        id: `REC-${Date.now()}-${i}`,
        date: date.toISOString().split('T')[0],
        shiftType: SHIFT_TYPES[i % 2],
        shift: SHIFTS[i % 2],
        machine: MACHINES[i % MACHINES.length],
        productionPoint: PRODUCTION_POINTS[i % 2],
        brand: BRANDS[i % BRANDS.length],
        recorder: `质量员${String.fromCharCode(65 + (i % 5))}`,
        samplingTime: `${String(8 + (i % 12)).padStart(2, '0')}:${String(i * 5 % 60).padStart(2, '0')}`,
        samplingNo: `S${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        steelStamp: `ST-${date.toISOString().split('T')[0].replace(/-/g, '')}-${i + 1}`,
        tobaccoBatch: `TB-2026-${String(i + 1).padStart(4, '0')}`,
        // 随机添加一些缺陷数据
        ...(i % 3 === 0 ? {
          boxDefects: [{
            id: `def-${i}-1`,
            location: '纸箱',
            defectName: '纸箱污',
            defectCode: 'XXWZC',
            category: 'C',
            quantity: 1,
          }],
        } : {}),
        ...(i % 4 === 0 ? {
          cigaretteDefects: [
            {
              id: `def-${i}-2`,
              location: '烟支外观',
              defectName: '空头',
              defectCode: 'JKKT',
              category: 'B',
              quantity: 2,
            },
            {
              id: `def-${i}-3`,
              location: '烟支外观',
              defectName: '爆口',
              defectCode: 'JKBK',
              category: 'A',
              quantity: 1,
            },
          ],
        } : {}),
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }

    return mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // 应用筛选条件
  useEffect(() => {
    let result = [...allData];

    // 日期范围筛选
    if (filters.dateFrom) {
      result = result.filter(item => item.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(item => item.date <= filters.dateTo);
    }

    // 其他条件筛选
    if (filters.productionPoint) {
      result = result.filter(item => item.productionPoint === filters.productionPoint);
    }
    if (filters.brand) {
      result = result.filter(item => item.brand === filters.brand);
    }
    if (filters.shiftType) {
      result = result.filter(item => item.shiftType === filters.shiftType);
    }
    if (filters.shift) {
      result = result.filter(item => item.shift === filters.shift);
    }
    if (filters.machine) {
      result = result.filter(item => item.machine === filters.machine);
    }

    setFilteredData(result);
    setCurrentPage(1); // 重置到第一页
  }, [filters, allData]);

  // 计算统计数据
  const statistics = useMemo(() => {
    return {
      totalRecords: filteredData.length,
      productionPoints: [...new Set(filteredData.map(d => d.productionPoint))].length,
      machines: [...new Set(filteredData.map(d => d.machine))].length,
      brands: [...new Set(filteredData.map(d => d.brand))].length,
      abnormalRecords: filteredData.filter(d =>
        (d.boxDefects && d.boxDefects.length > 0) ||
        (d.cartonDefects && d.cartonDefects.length > 0) ||
        (d.packDefects && d.packDefects.length > 0) ||
        (d.cigaretteDefects && d.cigaretteDefects.length > 0)
      ).length,
    };
  }, [filteredData]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // 查看当天数据
  const viewTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today,
    }));
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      productionPoint: '',
      brand: '',
      shiftType: '',
      shift: '',
      machine: '',
    });
  };

  // 查看详情
  const viewDetail = (record: ProcessQualityData) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // 导出Excel
  const exportToExcel = () => {
    // 准备导出数据
    const exportData = filteredData.map((item, index) => ({
      '序号': index + 1,
      '日期': item.date,
      '班别': item.shiftType,
      '班次': item.shift,
      '机台': item.machine,
      '合作生产点': item.productionPoint,
      '牌号': item.brand,
      '记录人': item.recorder,
      '取样时间': item.samplingTime,
      '取样件号': item.samplingNo,
      '条盒钢印': item.steelStamp,
      '烟丝批次': item.tobaccoBatch,
      '箱装缺陷数': item.boxDefects?.length || 0,
      '条装缺陷数': item.cartonDefects?.length || 0,
      '盒装缺陷数': item.packDefects?.length || 0,
      '烟支缺陷数': item.cigaretteDefects?.length || 0,
      '录入时间': item.createdAt,
    }));

    // 创建CSV内容（简单实现，实际项目可使用xlsx库）
    const headers = Object.keys(exportData[0] || {}).join(',');
    const rows = exportData.map(row => Object.values(row).join(','));
    const csvContent = '\uFEFF' + headers + '\n' + rows.join('\n'); // 添加BOM以支持中文

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `卷包过程质量数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 渲染统计卡片
  const renderStatCard = (title: string, value: number, icon: React.ReactNode, color: string) => (
    <div className={`p-4 rounded-lg bg-background/50 border border-border/50 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-brand-blue/10">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-foreground">卷包过程质量数据查询</h1>
          <p className="text-caption mt-1">查询、追溯和分析卷包过程质量数据</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={filteredData.length === 0}
            className="px-4 py-2 rounded-lg bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredData.length === 0}
            className="px-4 py-2 rounded-lg bg-brand-blue/10 text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/20 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            打印
          </button>
        </div>
      </div>

      {/* 数据概览区域 */}
      <div className="grid grid-cols-5 gap-4">
        {renderStatCard('数据记录数', statistics.totalRecords, <FileText className="w-6 h-6 text-brand-blue" />, 'hover:border-brand-blue/50')}
        {renderStatCard('合作生产点', statistics.productionPoints, <Users className="w-6 h-6 text-purple-400" />, 'hover:border-purple-500/50')}
        {renderStatCard('涉及机台', statistics.machines, <Factory className="w-6 h-6 text-cyan-400" />, 'hover:border-cyan-500/50')}
        {renderStatCard('涉及牌号', statistics.brands, <Package className="w-6 h-6 text-orange-400" />, 'hover:border-orange-500/50')}
        {renderStatCard('异常记录', statistics.abnormalRecords, <AlertTriangle className="w-6 h-6 text-danger" />, 'hover:border-danger/50')}
      </div>

      {/* 查询筛选区域 */}
      <div className="data-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-brand-blue" />
            <h2 className="text-section-title text-foreground">查询筛选</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={viewTodayData}
              className="px-4 py-2 rounded-lg bg-quality-normal/10 text-quality-normal border border-quality-normal/30 hover:bg-quality-normal/20 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              查看当天
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              {showFilters ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            {/* 第一行：日期范围 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">开始日期</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="form-input text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">结束日期</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="form-input text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
                <select
                  value={filters.productionPoint}
                  onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })}
                  className="form-select text-sm"
                >
                  <option value="">全部</option>
                  {PRODUCTION_POINTS.map(point => (
                    <option key={point} value={point}>{point}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 第二行：牌号、班别、班次、机台 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">牌号</label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="form-select text-sm"
                >
                  <option value="">全部</option>
                  {BRANDS.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">班别</label>
                <select
                  value={filters.shiftType}
                  onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })}
                  className="form-select text-sm"
                >
                  <option value="">全部</option>
                  {SHIFT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">班次</label>
                <select
                  value={filters.shift}
                  onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
                  className="form-select text-sm"
                >
                  <option value="">全部</option>
                  {SHIFTS.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">机台</label>
                <select
                  value={filters.machine}
                  onChange={(e) => setFilters({ ...filters, machine: e.target.value })}
                  className="form-select text-sm"
                >
                  <option value="">全部</option>
                  {MACHINES.map(machine => (
                    <option key={machine} value={machine}>{machine}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
              <button
                onClick={resetFilters}
                className="px-6 py-2 rounded-lg border border-border hover:bg-accent/10 transition-colors flex items-center gap-2 text-sm font-medium text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
              <button
                onClick={() => {}}
                className="px-6 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-brand-blue/25"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 查询结果区域 */}
      <div className="data-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-section-title text-foreground">查询结果</h2>
          <p className="text-sm text-muted-foreground">
            共 <span className="font-bold text-foreground">{filteredData.length}</span> 条数据
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-blue/10 animate-pulse mb-4">
              <Search className="w-6 h-6 text-brand-blue" />
            </div>
            <p className="text-muted-foreground">正在加载数据...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border/50 rounded-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">暂无数据</p>
            <p className="text-sm text-muted-foreground">
              请调整筛选条件或点击"查看当天"按钮
            </p>
          </div>
        ) : (
          <>
            {/* 数据表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">日期</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">班别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">机台</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">合作生产点</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">牌号</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">记录人</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">取样时间</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">缺陷数</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedData.map((record) => {
                    const totalDefects =
                      (record.boxDefects?.length || 0) +
                      (record.cartonDefects?.length || 0) +
                      (record.packDefects?.length || 0) +
                      (record.cigaretteDefects?.length || 0);

                    return (
                      <tr key={record.id} className="hover:bg-accent/5 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{record.date}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{record.shiftType}{record.shift}班</td>
                        <td className="px-4 py-3 text-sm text-foreground">{record.machine}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{record.productionPoint}</td>
                        <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate" title={record.brand}>{record.brand}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{record.recorder}</td>
                        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{record.samplingTime}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {totalDefects > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">
                              {totalDefects}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-quality-normal/10 text-quality-normal">
                              0
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => viewDetail(record)}
                            className="px-3 py-1.5 rounded-md bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} 条，共 {filteredData.length} 条
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md border border-border hover:bg-accent/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-brand-blue text-white'
                          : 'border border-border hover:bg-accent/10'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md border border-border hover:bg-accent/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="text-xl font-bold text-foreground">质量数据详情</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  记录ID：{selectedRecord.id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* 基础信息 */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-blue" />
                  基础信息
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '日期', value: selectedRecord.date },
                    { label: '班别', value: `${selectedRecord.shiftType}${selectedRecord.shift}班` },
                    { label: '机台', value: selectedRecord.machine },
                    { label: '合作生产点', value: selectedRecord.productionPoint },
                    { label: '牌号', value: selectedRecord.brand },
                    { label: '记录人', value: selectedRecord.recorder },
                    { label: '取样时间', value: selectedRecord.samplingTime },
                    { label: '取样件号', value: selectedRecord.samplingNo },
                    { label: '条盒钢印', value: selectedRecord.steelStamp },
                    { label: '烟丝批次', value: selectedRecord.tobaccoBatch },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg bg-background/50 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 外观缺陷信息 */}
              {((selectedRecord.boxDefects?.length || 0) > 0 ||
                (selectedRecord.cartonDefects?.length || 0) > 0 ||
                (selectedRecord.packDefects?.length || 0) > 0 ||
                (selectedRecord.cigaretteDefects?.length || 0) > 0) && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                    外观缺陷信息
                  </h3>
                  <div className="space-y-4">
                    {/* 箱装外观缺陷 */}
                    {selectedRecord.boxDefects && selectedRecord.boxDefects.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-blue-500/30">
                        <h4 className="text-sm font-bold text-blue-400 mb-3">箱装外观缺陷 ({selectedRecord.boxDefects.length}项)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷部位</th>
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷名称</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">类别</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">数量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.boxDefects.map((defect) => (
                              <tr key={defect.id} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground">{defect.location}</td>
                                <td className="px-3 py-2 text-foreground">{defect.defectName}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    defect.category === 'A' ? 'bg-red-500/20 text-red-400' :
                                    defect.category === 'B' ? 'bg-orange-500/20 text-orange-400' :
                                    defect.category === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {defect.category}类
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-foreground">{defect.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 条装外观缺陷 */}
                    {selectedRecord.cartonDefects && selectedRecord.cartonDefects.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-purple-500/30">
                        <h4 className="text-sm font-bold text-purple-400 mb-3">条装外观缺陷 ({selectedRecord.cartonDefects.length}项)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷部位</th>
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷名称</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">类别</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">数量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.cartonDefects.map((defect) => (
                              <tr key={defect.id} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground">{defect.location}</td>
                                <td className="px-3 py-2 text-foreground">{defect.defectName}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    defect.category === 'A' ? 'bg-red-500/20 text-red-400' :
                                    defect.category === 'B' ? 'bg-orange-500/20 text-orange-400' :
                                    defect.category === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {defect.category}类
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-foreground">{defect.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 盒装外观缺陷 */}
                    {selectedRecord.packDefects && selectedRecord.packDefects.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-cyan-500/30">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3">盒装外观缺陷 ({selectedRecord.packDefects.length}项)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷部位</th>
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷名称</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">类别</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">数量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.packDefects.map((defect) => (
                              <tr key={defect.id} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground">{defect.location}</td>
                                <td className="px-3 py-2 text-foreground">{defect.defectName}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    defect.category === 'A' ? 'bg-red-500/20 text-red-400' :
                                    defect.category === 'B' ? 'bg-orange-500/20 text-orange-400' :
                                    defect.category === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {defect.category}类
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-foreground">{defect.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 烟支外观缺陷 */}
                    {selectedRecord.cigaretteDefects && selectedRecord.cigaretteDefects.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-orange-500/30">
                        <h4 className="text-sm font-bold text-orange-400 mb-3">烟支外观缺陷 ({selectedRecord.cigaretteDefects.length}项)</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷部位</th>
                              <th className="px-3 py-2 text-left text-xs text-muted-foreground">缺陷名称</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">类别</th>
                              <th className="px-3 py-2 text-center text-xs text-muted-foreground">数量</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.cigaretteDefects.map((defect) => (
                              <tr key={defect.id} className="border-b border-border/20 last:border-0">
                                <td className="px-3 py-2 text-foreground">{defect.location}</td>
                                <td className="px-3 py-2 text-foreground">{defect.defectName}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                    defect.category === 'A' ? 'bg-red-500/20 text-red-400' :
                                    defect.category === 'B' ? 'bg-orange-500/20 text-orange-400' :
                                    defect.category === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {defect.category}类
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-foreground">{defect.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 无缺陷提示 */}
              {((selectedRecord.boxDefects?.length || 0) === 0 &&
                (selectedRecord.cartonDefects?.length || 0) === 0 &&
                (selectedRecord.packDefects?.length || 0) === 0 &&
                (selectedRecord.cigaretteDefects?.length || 0) === 0) && (
                <div className="py-8 text-center border border-dashed border-border/50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-quality-normal mx-auto mb-3" />
                  <p className="text-lg font-medium text-quality-normal">无外观缺陷</p>
                  <p className="text-sm text-muted-foreground mt-1">该次检测未发现外观质量问题</p>
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-background/30">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 rounded-lg border border-border hover:bg-accent/10 transition-colors text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProcessQualityQuery;
