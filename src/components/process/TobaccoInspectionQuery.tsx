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
  Pencil,
  Trash2,
  Save,
  User,
  Clock,
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
  updatedAt?: string;
  uploader?: string;
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

  // 编辑与删除状态
  const [editingRecord, setEditingRecord] = useState<TobaccoInspectionRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<TobaccoInspectionRecord>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<TobaccoInspectionRecord | null>(null);

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

  // 删除确认
  const handleDeleteClick = (record: TobaccoInspectionRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  // 执行删除
  const confirmDelete = () => {
    if (!recordToDelete) return;
    const updated = allData.filter(r => r.id !== recordToDelete.id);
    localStorage.setItem('tobaccoInspectionRecords', JSON.stringify(updated));
    setAllData(updated);
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  // 打开编辑弹窗
  const handleEditClick = (record: TobaccoInspectionRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record });
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingRecord || !editForm) return;
    const updated = allData.map(r => {
      if (r.id === editingRecord.id) {
        return { ...r, ...editForm, updatedAt: new Date().toISOString() } as TobaccoInspectionRecord;
      }
      return r;
    });
    localStorage.setItem('tobaccoInspectionRecords', JSON.stringify(updated));
    setAllData(updated);
    setEditingRecord(null);
    setEditForm({});
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  // 导出Excel
  const handleExport = () => {
    const headers = [
      '序号', '检验日期', '合作生产点', '烟丝牌号', '烟丝批次号',
      '烟丝水份(%)', '水份判定', '烟丝填充值(cm³/g)', '填充值判定',
      '本次检验结果', '上传者', '上传时间', '更新时间'
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
      item.uploader || '-',
      item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
      item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-',
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
    link.download = `烟丝检验结果查询_${new Date().toISOString().split('T')[0]}.csv`;
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
        <h1 className="text-page-title text-foreground">烟丝检验结果查询</h1>
        <p className="text-body text-muted-foreground mt-1">辅料质量管控 / 烟丝检验结果查询</p>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  上传者
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  上传时间
                </th>
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
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{record.uploader || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(record)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-brand-blue hover:text-brand-blue/80 bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          查看详情
                        </button>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
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

      {/* 编辑弹窗 */}
      {editingRecord && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={cancelEdit} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border/50 rounded-2xl shadow-2xl m-4">
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between z-10 bg-gradient-to-r from-brand-blue to-blue-600">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                修改烟丝检验记录
              </h3>
              <button onClick={cancelEdit} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  基础信息
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">检验日期</label>
                    <input
                      type="date"
                      value={(editForm.inspectionDate as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, inspectionDate: e.target.value }))}
                      className="input-field text-sm w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
                    <select
                      value={(editForm.productionPoint as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, productionPoint: e.target.value }))}
                      className="input-field text-sm w-full"
                    >
                      <option value="">请选择</option>
                      {PRODUCTION_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">烟丝牌号</label>
                    <select
                      value={(editForm.tobaccoBrand as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, tobaccoBrand: e.target.value }))}
                      className="input-field text-sm w-full"
                    >
                      <option value="">请选择</option>
                      {TOBACCO_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">批次号</label>
                    <input
                      type="text"
                      value={(editForm.batchNumber as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="input-field text-sm w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-brand-blue" />
                  检验指标
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">烟丝水份 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={(editForm.moistureValue as number) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, moistureValue: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-sm w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">水份判定</label>
                    <select
                      value={(editForm.moistureResult as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, moistureResult: e.target.value }))}
                      className="input-field text-sm w-full"
                    >
                      <option value="">请选择</option>
                      <option value="合格">合格</option>
                      <option value="不合格">不合格</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">烟丝填充值 (cm³/g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={(editForm.fillingValue as number) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fillingValue: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-sm w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">填充值判定</label>
                    <select
                      value={(editForm.fillingResult as string) || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fillingResult: e.target.value }))}
                      className="input-field text-sm w-full"
                    >
                      <option value="">请选择</option>
                      <option value="合格">合格</option>
                      <option value="不合格">不合格</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
                <div><span className="font-medium">上传者：</span>{editForm.uploader || '-'}</div>
                <div><span className="font-medium">上传时间：</span>{editForm.createdAt ? new Date(editForm.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 bg-background/30">
              <button onClick={cancelEdit} className="px-6 py-2 rounded-lg border border-border hover:bg-accent/10 transition-colors text-sm font-medium">
                取消
              </button>
              <button onClick={saveEdit} className="px-6 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors text-sm font-medium flex items-center gap-2">
                <Save className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">确认删除记录？</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  检验日期：{recordToDelete.inspectionDate}，烟丝牌号：{recordToDelete.tobaccoBrand}，批次：{recordToDelete.batchNumber}<br />
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
    </div>
  );
}
