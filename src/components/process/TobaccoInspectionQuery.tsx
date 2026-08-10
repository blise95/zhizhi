import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Download,
  Printer,
  Calendar,
  Filter,
  FileText,
  Eye,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Weight,
} from 'lucide-react';

// 类型定义
interface TobaccoInspectionRecord {
  id: string;
  inspectionDate: string;
  productionPoint: string;
  tobaccoBrand: string;
  batchNumber: string;
  moistureValue: number;
  moistureResult: string;
  fillingValue: number;
  fillingResult: string;
  overallResult: string;
  createdAt: string;
}

interface FilterConditions {
  dateFrom: string;
  dateTo: string;
  productionPoint: string;
  tobaccoBrand: string;
  overallResult: string;
}

// 常量定义
const PRODUCTION_POINTS = ['阿联酋环球烟草', '印尼科伦印象'];
const TOBACCO_BRANDS = ['MOD-1D', 'MOD-2D', 'MOD-6'];

export function TobaccoInspectionQuery() {
  // 状态管理
  const [allData, setAllData] = useState<TobaccoInspectionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<TobaccoInspectionRecord[]>([]);
  const [filters, setFilters] = useState<FilterConditions>({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    productionPoint: '',
    tobaccoBrand: '',
    overallResult: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<TobaccoInspectionRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const pageSize = 10;

  // 初始化：加载模拟数据或从localStorage读取
  useEffect(() => {
    loadData();
  }, []);

  // 筛选逻辑
  useEffect(() => {
    let result = [...allData];

    if (filters.dateFrom) {
      result = result.filter(item => item.inspectionDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(item => item.inspectionDate <= filters.dateTo);
    }
    if (filters.productionPoint) {
      result = result.filter(item => item.productionPoint === filters.productionPoint);
    }
    if (filters.tobaccoBrand) {
      result = result.filter(item => item.tobaccoBrand === filters.tobaccoBrand);
    }
    if (filters.overallResult) {
      result = result.filter(item => item.overallResult === filters.overallResult);
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [filters, allData]);

  // 加载数据
  const loadData = () => {
    const savedData = localStorage.getItem('tobaccoInspectionRecords');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setAllData(parsed);
        return;
      } catch (e) {
        console.error('解析数据失败:', e);
      }
    }

    // 如果没有数据，生成模拟数据
    const mockData = generateMockData();
    setAllData(mockData);
    localStorage.setItem('tobaccoInspectionRecords', JSON.stringify(mockData));
  };

  // 生成模拟数据
  const generateMockData = (): TobaccoInspectionRecord[] => {
    const data: TobaccoInspectionRecord[] = [];
    const today = new Date();

    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(i / 3));

      const moistureValue = parseFloat((11.5 + Math.random() * 2).toFixed(1));
      const fillingValue = parseFloat((5.0 + Math.random() * 1.2).toFixed(2));

      const moistureResult = moistureValue >= 11.9 && moistureValue <= 12.9 ? '合格' : '不合格';
      const fillingResult = fillingValue >= 5.5 ? '合格' : '不合格';
      const overallResult = moistureResult === '合格' && fillingResult === '合格' ? '检验合格' : '检验不合格';

      data.push({
        id: `TOB-${String(i + 1).padStart(4, '0')}`,
        inspectionDate: date.toISOString().split('T')[0],
        productionPoint: PRODUCTION_POINTS[i % 2],
        tobaccoBrand: TOBACCO_BRANDS[i % 3],
        batchNumber: `YS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
        moistureValue,
        moistureResult,
        fillingValue,
        fillingResult,
        overallResult,
        createdAt: date.toISOString(),
      });
    }

    return data.sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());
  };

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // 统计数据
  const statistics = useMemo(() => ({
    totalRecords: filteredData.length,
    productionPoints: [...new Set(filteredData.map(d => d.productionPoint))].length,
    tobaccoBrands: [...new Set(filteredData.map(d => d.tobaccoBrand))].length,
    unqualifiedCount: filteredData.filter(d => d.overallResult === '检验不合格').length,
  }), [filteredData]);

  // 查询操作
  const handleSearch = () => {
    // 筛选已通过useEffect自动处理
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      productionPoint: '',
      tobaccoBrand: '',
      overallResult: '',
    });
  };

  // 查看当天
  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today,
    }));
  };

  // 查看详情
  const handleViewDetail = (record: TobaccoInspectionRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // 导出Excel
  const handleExport = () => {
    const headers = [
      '序号', '检验日期', '合作生产点', '烟丝牌号', '烟丝批次号',
      '烟丝水份(%)', '水份判定', '烟丝填充值(cm³/g)', '填充值判定',
      '本次检验结果'
    ];

    const rows = filteredData.map((item, index) => [
      index + 1,
      item.inspectionDate,
      item.productionPoint,
      item.tobaccoBrand,
      item.batchNumber,
      item.moistureValue,
      item.moistureResult,
      item.fillingValue,
      item.fillingResult,
      item.overallResult,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `烟丝到厂检验查询_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 打印
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">烟丝到厂检验查询</h1>
        <p className="text-body text-muted-foreground mt-1">辅料质量管控 / 烟丝到厂检验查询</p>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">数据记录数</p>
              <p className="text-2xl font-bold text-foreground">{statistics.totalRecords}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-blue" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">合作生产点</p>
              <p className="text-2xl font-bold text-foreground">{statistics.productionPoints}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">烟丝牌号</p>
              <p className="text-2xl font-bold text-foreground">{statistics.tobaccoBrands}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Weight className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">不合格记录</p>
              <p className="text-2xl font-bold text-red-400">{statistics.unqualifiedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 查询筛选区域 */}
      <div className="data-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-brand-blue" />
          <h2 className="text-module-title text-foreground">筛选条件</h2>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          {/* 日期范围 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">开始日期</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">结束日期</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
          </div>

          {/* 合作生产点 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
            <select
              value={filters.productionPoint}
              onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              {PRODUCTION_POINTS.map(point => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
          </div>

          {/* 烟丝牌号 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">烟丝牌号</label>
            <select
              value={filters.tobaccoBrand}
              onChange={(e) => setFilters({ ...filters, tobaccoBrand: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              {TOBACCO_BRANDS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* 整体结果 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">整体结果</label>
            <select
              value={filters.overallResult}
              onChange={(e) => setFilters({ ...filters, overallResult: e.target.value })}
              className="input-field"
            >
              <option value="">全部</option>
              <option value="检验合格">检验合格</option>
              <option value="检验不合格">检验不合格</option>
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button onClick={handleToday} className="btn-primary px-4 py-2">
            查看当天
          </button>
          <button onClick={handleSearch} className="btn-primary px-4 py-2">
            <Search className="w-4 h-4 mr-1.5" />
            查询
          </button>
          <button onClick={handleReset} className="btn-secondary px-4 py-2">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            重置
          </button>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{filteredData.length}</span> 条记录
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary px-4 py-2">
            <Download className="w-4 h-4 mr-1.5" />
            导出Excel
          </button>
          <button onClick={handlePrint} className="btn-secondary px-4 py-2">
            <Printer className="w-4 h-4 mr-1.5" />
            打印
          </button>
        </div>
      </div>

      {/* 查询结果表格 */}
      <div className="data-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-surface/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">序号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">检验日期</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">合作生产点</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">烟丝牌号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">批次号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">烟丝水份</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">填充值</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">检验结果</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <tr key={record.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{record.inspectionDate}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{record.productionPoint}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{record.tobaccoBrand}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{record.batchNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-foreground">{record.moistureValue}%</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        record.moistureResult === '合格'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {record.moistureResult}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-foreground">{record.fillingValue}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        record.fillingResult === '合格'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {record.fillingResult}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        record.overallResult === '检验合格'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {record.overallResult === '检验合格' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        )}
                        {record.overallResult}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewDetail(record)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-brand-blue hover:text-brand-blue/80 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 mb-3 opacity-50" />
                      <p>暂无符合条件的检验数据</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              显示 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} 条，共 {filteredData.length} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-brand-blue text-white font-semibold'
                      : 'bg-surface hover:bg-surface/80 text-foreground'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩层 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          />

          {/* 弹窗内容 */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border/50 rounded-2xl shadow-2xl m-4">
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-foreground">烟丝到厂检验详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-lg bg-surface hover:bg-surface/80 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-6">
              {/* 整体检验结果 */}
              <div className={`p-4 rounded-xl border ${
                selectedRecord.overallResult === '检验合格'
                  ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30'
                  : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedRecord.overallResult === '检验合格' ? (
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">本次检验结果</p>
                    <p className={`text-2xl font-bold ${
                      selectedRecord.overallResult === '检验合格' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedRecord.overallResult}
                    </p>
                  </div>
                </div>
              </div>

              {/* 基础信息 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  基础信息
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '检验日期', value: selectedRecord.inspectionDate },
                    { label: '合作生产点', value: selectedRecord.productionPoint },
                    { label: '烟丝牌号', value: selectedRecord.tobaccoBrand },
                    { label: '烟丝批次号', value: selectedRecord.batchNumber },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 检验指标 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-brand-blue" />
                  检验指标
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">检验指标</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">标准要求</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">实际检测值</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">判定</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <tr>
                        <td className="px-4 py-3 text-sm text-foreground flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-cyan-400" />
                          烟丝水份
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">12.4 ± 0.5 %</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-foreground">{selectedRecord.moistureValue} %</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            selectedRecord.moistureResult === '合格'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedRecord.moistureResult === '合格' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <X className="w-3.5 h-3.5 mr-1" />
                            )}
                            {selectedRecord.moistureResult}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm text-foreground flex items-center gap-2">
                          <Weight className="w-4 h-4 text-orange-400" />
                          烟丝填充值
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">≥ 5.5 cm³/g</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-foreground">{selectedRecord.fillingValue}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            selectedRecord.fillingResult === '合格'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedRecord.fillingResult === '合格' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            ) : (
                              <X className="w-3.5 h-3.5 mr-1" />
                            )}
                            {selectedRecord.fillingResult}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
