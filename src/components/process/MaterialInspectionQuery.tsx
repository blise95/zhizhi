import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  X,
  Pencil,
  Trash2,
  Save,
  User,
  Clock,
} from 'lucide-react';

// 类型定义
interface MaterialInspectionRecord {
  id: number;
  // 基础信息
  inspectionDate: string;
  productionPoint: string;
  materialType: string;
  materialCode: string;
  batchNumber: string;
  supplier: string;
  inspector: string;
  // 检验指标
  colorDifference: string;
  printing: string;
  cutting: string;
  fontComplete: string;
  // 整体结果
  overallResult: string;
  // 图片
  images: string[];
  // 元数据
  createdAt: string;
  updatedAt?: string;
  uploader?: string;
}

interface FilterConditions {
  dateFrom: string;
  dateTo: string;
  productionPoint: string;
  materialType: string;
  supplier: string;
  overallResult: string;
}

// 选项定义
const PRODUCTION_POINTS = [
  '阿联酋环球烟草',
  '印尼科伦印象',
];

const MATERIAL_TYPES = [
  '卷烟纸',
  '水松纸',
  '商标纸',
  '条盒纸',
  '框架纸',
  '内衬纸',
  '纸箱',
];

// 获取当天日期
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function MaterialInspectionQuery() {
  // 状态管理
  const [allData, setAllData] = useState<MaterialInspectionRecord[]>([]);
  const [filteredData, setFilteredData] = useState<MaterialInspectionRecord[]>([]);
  const [filters, setFilters] = useState<FilterConditions>({
    dateFrom: getTodayDate(),
    dateTo: getTodayDate(),
    productionPoint: '',
    materialType: '',
    supplier: '',
    overallResult: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<MaterialInspectionRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const pageSize = 10;

  // 编辑与删除状态
  const [editingRecord, setEditingRecord] = useState<MaterialInspectionRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<MaterialInspectionRecord>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaterialInspectionRecord | null>(null);

  // 初始化：加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = () => {
    const records = JSON.parse(localStorage.getItem('materialInspectionRecords') || '[]');
    setAllData(records);
  };

  // 筛选数据
  useEffect(() => {
    let result = [...allData];

    // 日期筛选
    if (filters.dateFrom) {
      result = result.filter(item => item.inspectionDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(item => item.inspectionDate <= filters.dateTo);
    }

    // 合作生产点筛选
    if (filters.productionPoint) {
      result = result.filter(item => item.productionPoint === filters.productionPoint);
    }

    // 材料类型筛选
    if (filters.materialType) {
      result = result.filter(item => item.materialType === filters.materialType);
    }

    // 供应商筛选
    if (filters.supplier) {
      result = result.filter(item =>
        item.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }

    // 整体结果筛选
    if (filters.overallResult) {
      result = result.filter(item => item.overallResult === filters.overallResult);
    }

    // 按日期降序排序（最新的在前）
    result.sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());

    setFilteredData(result);
    setCurrentPage(1); // 重置到第一页
  }, [filters, allData]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // 统计数据
  const statistics = useMemo(() => {
    const total = filteredData.length;
    const productionPoints = new Set(filteredData.map(item => item.productionPoint)).size;
    const materialTypes = new Set(filteredData.map(item => item.materialType)).size;
    const suppliers = new Set(filteredData.map(item => item.supplier)).size;
    const failedCount = filteredData.filter(item => item.overallResult === '不合格').length;

    return { total, productionPoints, materialTypes, suppliers, failedCount };
  }, [filteredData]);

  // 查看当天
  const handleViewToday = () => {
    const today = getTodayDate();
    setFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today,
    }));
  };

  // 查询
  const handleSearch = () => {
    // 触发筛选（useEffect会自动执行）
    loadData(); // 重新加载最新数据
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      dateFrom: getTodayDate(),
      dateTo: getTodayDate(),
      productionPoint: '',
      materialType: '',
      supplier: '',
      overallResult: '',
    });
  };

  // 导出Excel
  const handleExportExcel = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM

    csvContent += '智·质 - 卷烟数智化质量管理与智能分析平台\n';
    csvContent += '材料到厂检验记录查询\n\n';

    csvContent += `导出时间,${new Date().toLocaleString()}\n`;
    csvContent += `数据总量,${filteredData.length}条\n\n`;

    csvContent += '检验日期,合作生产点,材料类型,材料代码,批次号,供应商,检验员,材料色差,材料印刷,材料切割,字体完整,本次检验结果,图片数量,上传者,上传时间,更新时间\n';

    filteredData.forEach(record => {
      csvContent += `${record.inspectionDate},`;
      csvContent += `${record.productionPoint},`;
      csvContent += `${record.materialType},`;
      csvContent += `${record.materialCode},`;
      csvContent += `${record.batchNumber},`;
      csvContent += `${record.supplier},`;
      csvContent += `${record.inspector},`;
      csvContent += `${record.colorDifference},`;
      csvContent += `${record.printing},`;
      csvContent += `${record.cutting},`;
      csvContent += `${record.fontComplete},`;
      csvContent += `${record.overallResult},`;
      csvContent += `${record.images.length}张,`;
      csvContent += `${record.uploader || '-'},`;
      csvContent += `${record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'},`;
      csvContent += `${record.updatedAt ? new Date(record.updatedAt).toLocaleString() : '-'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `材料到厂检验查询_${getTodayDate()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // 删除确认
  const handleDeleteClick = (record: MaterialInspectionRecord) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  // 执行删除
  const confirmDelete = () => {
    if (!recordToDelete) return;
    const updated = allData.filter(r => r.id !== recordToDelete.id);
    localStorage.setItem('materialInspectionRecords', JSON.stringify(updated));
    setAllData(updated);
    setShowDeleteConfirm(false);
    setRecordToDelete(null);
  };

  // 打开编辑弹窗
  const handleEditClick = (record: MaterialInspectionRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record });
  };

  // 保存编辑
  const saveEdit = () => {
    if (!editingRecord || !editForm) return;
    const updated = allData.map(r => {
      if (r.id === editingRecord.id) {
        return { ...r, ...editForm, updatedAt: new Date().toISOString() } as MaterialInspectionRecord;
      }
      return r;
    });
    localStorage.setItem('materialInspectionRecords', JSON.stringify(updated));
    setAllData(updated);
    setEditingRecord(null);
    setEditForm({});
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  // 打印
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* 页面标题 */}
      <div className="print:hidden">
        <h1 className="text-page-title text-foreground">材料到厂检验查询</h1>
        <p className="text-body text-muted-foreground">辅料质量管控 / 材料到厂检验查询</p>
      </div>

      {/* 数据概览 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 print:hidden">
        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">数据记录数</p>
              <p className="text-2xl font-bold text-foreground mt-1">{statistics.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-blue" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">合作生产点</p>
              <p className="text-2xl font-bold text-foreground mt-1">{statistics.productionPoints}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">材料类型</p>
              <p className="text-2xl font-bold text-foreground mt-1">{statistics.materialTypes}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">供应商数量</p>
              <p className="text-2xl font-bold text-foreground mt-1">{statistics.suppliers}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="data-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">不合格记录</p>
              <p className={`text-2xl font-bold mt-1 ${statistics.failedCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {statistics.failedCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 筛选区域 */}
      <section className="data-card p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-blue" />
            <h2 className="text-module-title text-foreground">查询条件</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {showFilters ? '收起' : '展开'}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 开始日期 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">开始日期</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* 结束日期 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">结束日期</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* 合作生产点 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
                <select
                  value={filters.productionPoint}
                  onChange={(e) => setFilters(prev => ({ ...prev, productionPoint: e.target.value }))}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {PRODUCTION_POINTS.map(point => (
                    <option key={point} value={point}>{point}</option>
                  ))}
                </select>
              </div>

              {/* 材料类型 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">材料类型</label>
                <select
                  value={filters.materialType}
                  onChange={(e) => setFilters(prev => ({ ...prev, materialType: e.target.value }))}
                  className="form-select"
                >
                  <option value="">全部</option>
                  {MATERIAL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 供应商 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">供应商</label>
                <input
                  type="text"
                  value={filters.supplier}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="输入供应商名称"
                  className="form-input"
                />
              </div>

              {/* 整体结果 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">检验结果</label>
                <select
                  value={filters.overallResult}
                  onChange={(e) => setFilters(prev => ({ ...prev, overallResult: e.target.value }))}
                  className="form-select"
                >
                  <option value="">全部</option>
                  <option value="合格">合格</option>
                  <option value="不合格">不合格</option>
                </select>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={handleViewToday} className="btn-primary flex items-center gap-2 px-4 py-2">
                <Calendar className="w-4 h-4" />
                查看当天
              </button>

              <button onClick={handleSearch} className="btn-primary flex items-center gap-2 px-4 py-2">
                <Search className="w-4 h-4" />
                查询
              </button>

              <button onClick={handleResetFilters} className="btn-secondary flex items-center gap-2 px-4 py-2">
                <RotateCcw className="w-4 h-4" />
                重置
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 操作栏 */}
      <div className="flex items-center justify-between print:hidden">
        <div className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{filteredData.length}</span> 条记录
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 px-4 py-2">
            <Download className="w-4 h-4" />
            导出Excel
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 px-4 py-2">
            <Printer className="w-4 h-4" />
            打印
          </button>
        </div>
      </div>

      {/* 数据表格 */}
      <section className="data-card overflow-hidden print:border-0 print:shadow-none print:bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-background/50">
                <th className="text-left py-3 px-4 font-semibold text-foreground">检验日期</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">合作生产点</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">材料类型</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">材料代码</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">批次号</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">供应商</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">检验员</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  上传者
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  上传时间
                </th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">检验结果</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">图片</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border/20 hover:bg-background/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">{record.inspectionDate}</td>
                    <td className="py-3 px-4 text-foreground">{record.productionPoint}</td>
                    <td className="py-3 px-4 text-foreground">{record.materialType}</td>
                    <td className="py-3 px-4 text-foreground font-mono text-xs">{record.materialCode}</td>
                    <td className="py-3 px-4 text-foreground font-mono text-xs">{record.batchNumber}</td>
                    <td className="py-3 px-4 text-foreground">{record.supplier}</td>
                    <td className="py-3 px-4 text-foreground">{record.inspector}</td>
                    <td className="py-3 px-4 text-foreground">{record.uploader || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        record.overallResult === '合格'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {record.overallResult === '合格' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        {record.overallResult}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {record.images.length > 0 ? (
                        <span className="inline-flex items-center text-blue-400">
                          <ImageIcon className="w-4 h-4 mr-1" />
                          {record.images.length}张
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          查看详情
                        </button>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-xs"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          修改
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs"
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
                  <td colSpan={12} className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无数据</p>
                    <p className="text-xs mt-1">请调整筛选条件或录入新的检验数据</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 print:hidden">
            <div className="text-sm text-muted-foreground">
              显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} 条，共 {filteredData.length} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-border text-sm disabled:opacity-50 hover:bg-background transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    page === currentPage
                      ? 'bg-brand-blue text-white'
                      : 'border border-border hover:bg-background'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-border text-sm disabled:opacity-50 hover:bg-background transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 详情弹窗 */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <h2 className="text-xl font-bold text-foreground">检验记录详情</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* 整体结果 */}
              <div className={`p-4 rounded-lg ${
                selectedRecord.overallResult === '合格'
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">本次检验结果</span>
                  <span className={`px-4 py-1.5 rounded-full font-bold text-lg ${
                    selectedRecord.overallResult === '合格'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedRecord.overallResult}
                  </span>
                </div>
              </div>

              {/* 基础信息 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">基础信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">检验日期</span>
                    <span className="text-foreground font-medium">{selectedRecord.inspectionDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">合作生产点</span>
                    <span className="text-foreground font-medium">{selectedRecord.productionPoint}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">材料类型</span>
                    <span className="text-foreground font-medium">{selectedRecord.materialType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">材料代码</span>
                    <span className="text-foreground font-mono font-medium">{selectedRecord.materialCode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">材料批次号</span>
                    <span className="text-foreground font-mono font-medium">{selectedRecord.batchNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">供应商</span>
                    <span className="text-foreground font-medium">{selectedRecord.supplier}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/20">
                    <span className="text-muted-foreground">检验员</span>
                    <span className="text-foreground font-medium">{selectedRecord.inspector}</span>
                  </div>
                </div>
              </div>

              {/* 检验指标 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">检验指标</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-4 text-sm font-semibold">检验指标</th>
                      <th className="text-center py-2 px-4 text-sm font-semibold">检验结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/20">
                      <td className="py-3 px-4">材料色差</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedRecord.colorDifference === '合格'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedRecord.colorDifference}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-3 px-4">材料印刷</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedRecord.printing === '合格'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedRecord.printing}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-border/20">
                      <td className="py-3 px-4">材料切割</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedRecord.cutting === '合格'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedRecord.cutting}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">字体完整</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          selectedRecord.fontComplete === '合格'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedRecord.fontComplete}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 检验图片 */}
              {selectedRecord.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    检验图片（{selectedRecord.images.length}张）
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedRecord.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border/50 cursor-pointer group"
                        onClick={() => setPreviewImage(image)}
                      >
                        <img
                          src={image}
                          alt={`检验图片 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 图片全屏预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[95vh]">
            <img
              src={previewImage}
              alt="预览图片"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingRecord && editForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-brand-blue to-blue-600">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                修改材料检验记录
              </h2>
              <button onClick={cancelEdit} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-4">基础信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: '检验日期', field: 'inspectionDate', type: 'date' },
                    { label: '合作生产点', field: 'productionPoint', type: 'select', options: PRODUCTION_POINTS },
                    { label: '材料类型', field: 'materialType', type: 'select', options: MATERIAL_TYPES },
                    { label: '材料代码', field: 'materialCode', type: 'text' },
                    { label: '批次号', field: 'batchNumber', type: 'text' },
                    { label: '供应商', field: 'supplier', type: 'text' },
                    { label: '检验员', field: 'inspector', type: 'text' },
                  ].map(item => (
                    <div key={item.field} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{item.label}</label>
                      {item.type === 'select' ? (
                        <select
                          value={(editForm[item.field as keyof MaterialInspectionRecord] as string) || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                          className="form-select text-sm w-full"
                        >
                          <option value="">请选择</option>
                          {(item.options as string[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          type={item.type}
                          value={(editForm[item.field as keyof MaterialInspectionRecord] as string) || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                          className="form-input text-sm w-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground mb-4">检验指标</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '材料色差', field: 'colorDifference' },
                    { label: '材料印刷', field: 'printing' },
                    { label: '材料切割', field: 'cutting' },
                    { label: '字体完整', field: 'fontComplete' },
                  ].map(item => (
                    <div key={item.field} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{item.label}</label>
                      <select
                        value={(editForm[item.field as keyof MaterialInspectionRecord] as string) || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, [item.field]: e.target.value }))}
                        className="form-select text-sm w-full"
                      >
                        <option value="">请选择</option>
                        <option value="合格">合格</option>
                        <option value="不合格">不合格</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground border-t border-border/30 pt-4">
                <div><span className="font-medium">上传者：</span>{editForm.uploader || '-'}</div>
                <div><span className="font-medium">上传时间：</span>{editForm.createdAt ? new Date(editForm.createdAt).toLocaleString() : '-'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border/50 bg-background/30">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">确认删除记录？</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  检验日期：{recordToDelete.inspectionDate}，材料：{recordToDelete.materialType}，批次：{recordToDelete.batchNumber}<br />
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
