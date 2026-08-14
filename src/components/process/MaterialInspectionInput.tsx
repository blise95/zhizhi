import React, { useState, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Printer,
  Download,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Package,
  Hash,
  User,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  Send,
  ArrowRight,
} from 'lucide-react';
import { getCurrentUser } from '../auth/Login';

// 类型定义
interface MaterialInspectionData {
  // 基础信息
  inspectionDate: string;
  productionPoint: string;
  materialType: string;
  materialCode: string;
  batchNumber: string;
  supplier: string;
  inspector: string;

  // 检验指标
  colorDifference: string; // 材料色差
  printing: string;        // 材料印刷
  cutting: string;         // 材料切割
  fontComplete: string;    // 字体完整

  // 整体检验结果（自动计算）
  overallResult: string;

  // 检验图片
  images: string[];
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

const INSPECTION_ITEMS = [
  { key: 'colorDifference', label: '材料色差' },
  { key: 'printing', label: '材料印刷' },
  { key: 'cutting', label: '材料切割' },
  { key: 'fontComplete', label: '字体完整' },
];

const RESULT_OPTIONS = ['合格', '不合格'];

// 获取当天日期
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function MaterialInspectionInput() {
  // 表单状态
  const [formData, setFormData] = useState<MaterialInspectionData>({
    inspectionDate: getTodayDate(),
    productionPoint: '',
    materialType: '',
    materialCode: '',
    batchNumber: '',
    supplier: '',
    inspector: '',
    colorDifference: '',
    printing: '',
    cutting: '',
    fontComplete: '',
    overallResult: '',
    images: [],
  });

  // 状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计算整体检验结果
  const calculateOverallResult = (data: MaterialInspectionData) => {
    const results = [
      data.colorDifference,
      data.printing,
      data.cutting,
      data.fontComplete,
    ].filter(r => r !== '');

    if (results.length < 4) {
      return '';
    }

    const hasFail = results.some(r => r === '不合格');
    return hasFail ? '不合格' : '合格';
  };

  // 更新表单字段
  const updateField = (field: keyof MaterialInspectionData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // 如果更新了检验指标，重新计算整体结果
      if (['colorDifference', 'printing', 'cutting', 'fontComplete'].includes(field)) {
        newData.overallResult = calculateOverallResult(newData);
      }

      return newData;
    });

    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 数据校验
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.inspectionDate.trim()) {
      newErrors.inspectionDate = '请选择检验日期';
    }
    if (!formData.productionPoint) {
      newErrors.productionPoint = '请选择合作生产点';
    }
    if (!formData.materialType) {
      newErrors.materialType = '请选择材料类型';
    }
    if (!formData.materialCode.trim()) {
      newErrors.materialCode = '请输入材料代码';
    }
    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = '请输入材料批次号';
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = '请输入供应商';
    }
    if (!formData.inspector.trim()) {
      newErrors.inspector = '请输入检验员';
    }
    if (!formData.colorDifference) {
      newErrors.colorDifference = '请选择检验结果';
    }
    if (!formData.printing) {
      newErrors.printing = '请选择检验结果';
    }
    if (!formData.cutting) {
      newErrors.cutting = '请选择检验结果';
    }
    if (!formData.fontComplete) {
      newErrors.fontComplete = '请选择检验结果';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交数据
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // 保存到localStorage
    const records = JSON.parse(localStorage.getItem('materialInspectionRecords') || '[]');
    const currentUser = getCurrentUser();
    const now = new Date().toISOString();
    const record = {
      ...formData,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
      uploader: currentUser?.displayName || currentUser?.username || '未知用户',
    };
    records.push(record);
    localStorage.setItem('materialInspectionRecords', JSON.stringify(records));

    // 显示提交成功弹窗
    const recordCount = records.length;
    setSubmitMessage(`已成功保存第 ${recordCount} 条记录`);
    setShowSuccess(true);

    // 重置表单
    setFormData({
      inspectionDate: getTodayDate(),
      productionPoint: '',
      materialType: '',
      materialCode: '',
      batchNumber: '',
      supplier: '',
      inspector: '',
      colorDifference: '',
      printing: '',
      cutting: '',
      fontComplete: '',
      overallResult: '',
      images: [],
    });
    setErrors({});
  };

  // 重置表单
  const handleReset = () => {
    // 检查是否有图片或已填写的数据
    const hasContent =
      formData.images.length > 0 ||
      formData.materialCode ||
      formData.batchNumber ||
      formData.supplier ||
      formData.inspector ||
      formData.colorDifference ||
      formData.printing ||
      formData.cutting ||
      formData.fontComplete;

    if (hasContent && !showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    setFormData({
      inspectionDate: getTodayDate(),
      productionPoint: '',
      materialType: '',
      materialCode: '',
      batchNumber: '',
      supplier: '',
      inspector: '',
      colorDifference: '',
      printing: '',
      cutting: '',
      fontComplete: '',
      overallResult: '',
      images: [],
    });
    setErrors({});
    setShowResetConfirm(false);
  };

  // 图片上传处理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, result],
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    // 重置input以允许重复上传同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除图片
  const handleDeleteImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 导出Excel功能
  const handleExportExcel = () => {
    // 创建CSV内容（包含图片Base64）
    let csvContent = '\uFEFF'; // UTF-8 BOM

    csvContent += '智·质 - 卷烟数智化质量管理与智能分析平台\n';
    csvContent += '材料到厂检验录入\n\n';

    csvContent += '【基础信息】\n';
    csvContent += `检验日期,${formData.inspectionDate}\n`;
    csvContent += `合作生产点,${formData.productionPoint}\n`;
    csvContent += `材料类型,${formData.materialType}\n`;
    csvContent += `材料代码,${formData.materialCode}\n`;
    csvContent += `材料批次号,${formData.batchNumber}\n`;
    csvContent += `供应商,${formData.supplier}\n`;
    csvContent += `检验员,${formData.inspector}\n\n`;

    csvContent += '【检验指标】\n';
    csvContent += `检验指标,检验结果\n`;
    csvContent += `材料色差,${formData.colorDifference}\n`;
    csvContent += `材料印刷,${formData.printing}\n`;
    csvContent += `材料切割,${formData.cutting}\n`;
    csvContent += `字体完整,${formData.fontComplete}\n\n`;

    csvContent += `本次检验结果,${formData.overallResult}\n\n`;

    if (formData.images.length > 0) {
      csvContent += `【检验图片】共${formData.images.length}张\n`;
      formData.images.forEach((img, index) => {
        csvContent += `图片${index + 1},${img.substring(0, 50)}...\n`;
      });
    }

    // 创建并下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `材料到厂检验_${formData.inspectionDate}_${formData.materialType}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="p-6 space-y-6 print:p-0">
      {/* 页面标题 */}
      <div className="print:hidden">
        <h1 className="text-page-title text-foreground">材料到厂检验录入</h1>
        <p className="text-body text-muted-foreground">辅料质量管控 / 材料到厂检验录入</p>
      </div>

      {/* 打印标题 */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">智·质</h1>
        <p className="text-sm text-gray-600">卷烟数智化质量管理与智能分析平台</p>
        <h2 className="text-xl font-bold mt-4">材料到厂检验记录</h2>
      </div>

      {/* 基础信息 */}
      <section className="data-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/30">
          <FileText className="w-5 h-5 text-brand-blue" />
          <h2 className="text-module-title text-foreground">基础信息</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* 检验日期 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              检验日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.inspectionDate}
              onChange={(e) => updateField('inspectionDate', e.target.value)}
              className={`form-input ${errors.inspectionDate ? 'border-red-500' : ''}`}
            />
            {errors.inspectionDate && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.inspectionDate}
              </p>
            )}
          </div>

          {/* 合作生产点 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              合作生产点 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.productionPoint}
              onChange={(e) => updateField('productionPoint', e.target.value)}
              className={`form-select ${errors.productionPoint ? 'border-red-500' : ''}`}
            >
              <option value="">请选择</option>
              {PRODUCTION_POINTS.map(point => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
            {errors.productionPoint && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.productionPoint}
              </p>
            )}
          </div>

          {/* 材料类型 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              材料类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.materialType}
              onChange={(e) => updateField('materialType', e.target.value)}
              className={`form-select ${errors.materialType ? 'border-red-500' : ''}`}
            >
              <option value="">请选择</option>
              {MATERIAL_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.materialType && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.materialType}
              </p>
            )}
          </div>

          {/* 材料代码 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              材料代码 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.materialCode}
              onChange={(e) => updateField('materialCode', e.target.value)}
              placeholder="请输入材料代码"
              className={`form-input ${errors.materialCode ? 'border-red-500' : ''}`}
            />
            {errors.materialCode && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.materialCode}
              </p>
            )}
          </div>

          {/* 材料批次号 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" />
              材料批次号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.batchNumber}
              onChange={(e) => updateField('batchNumber', e.target.value)}
              placeholder="请输入批次号"
              className={`form-input ${errors.batchNumber ? 'border-red-500' : ''}`}
            />
            {errors.batchNumber && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.batchNumber}
              </p>
            )}
          </div>

          {/* 供应商 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              供应商 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
              placeholder="请输入供应商名称"
              className={`form-input ${errors.supplier ? 'border-red-500' : ''}`}
            />
            {errors.supplier && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.supplier}
              </p>
            )}
          </div>

          {/* 检验员 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              检验员 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.inspector}
              onChange={(e) => updateField('inspector', e.target.value)}
              placeholder="请输入检验员姓名"
              className={`form-input ${errors.inspector ? 'border-red-500' : ''}`}
            />
            {errors.inspector && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{errors.inspector}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 检验指标 */}
      <section className="data-card p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border/30">
          <CheckCircle2 className="w-5 h-5 text-brand-blue" />
          <h2 className="text-module-title text-foreground">检验指标</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground bg-background/50">
                  检验指标
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground bg-background/50 w-48">
                  检验结果
                </th>
              </tr>
            </thead>
            <tbody>
              {INSPECTION_ITEMS.map((item) => (
                <tr key={item.key} className="border-b border-border/20 hover:bg-background/30 transition-colors">
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={(formData as any)[item.key]}
                      onChange={(e) => updateField(item.key as keyof MaterialInspectionData, e.target.value)}
                      className={`form-select ${
                        errors[item.key] ? 'border-red-500' :
                        (formData as any)[item.key] === '合格' ? 'border-green-500 bg-green-500/10' :
                        (formData as any)[item.key] === '不合格' ? 'border-red-500 bg-red-500/10' : ''
                      }`}
                    >
                      <option value="">请选择</option>
                      {RESULT_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {errors[item.key] && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />{errors[item.key]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 整体检验结果 */}
      {formData.overallResult && (
        <section className={`data-card p-6 ${
          formData.overallResult === '合格'
            ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-transparent'
            : 'border-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {formData.overallResult === '合格' ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-foreground">本次检验结果</h3>
                <p className="text-sm text-muted-foreground">
                  基于4项检验指标自动判定
                </p>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-lg text-xl font-bold ${
              formData.overallResult === '合格'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
            }`}>
              {formData.overallResult}
            </div>
          </div>
        </section>
      )}

      {/* 检验图片 */}
      <section className="data-card p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-brand-blue" />
            <h2 className="text-module-title text-foreground">检验图片</h2>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* 图片预览区域 */}
        {formData.images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-border/50 bg-background/50 hover:border-brand-blue/50 transition-all"
              >
                <img
                  src={image}
                  alt={`检验图片 ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewImage(image)}
                />

                {/* 删除按钮 */}
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* 图片序号 */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                  #{index + 1}
                </div>

                {/* 放大图标 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <ZoomIn className="w-10 h-10 text-white" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-lg">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              暂无检验图片，点击上方按钮上传
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              支持 JPG、PNG、GIF 等格式，可多选
            </p>
          </div>
        )}

        {/* 图片计数 */}
        {formData.images.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="w-4 h-4" />
            已上传 {formData.images.length} 张图片
          </div>
        )}
      </section>

      {/* 图片预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="预览图片"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
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

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <h3 className="text-lg font-semibold text-foreground">确认重置</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              此操作将清空所有已填写的内容和已上传的图片，且无法撤销。确定要继续吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮区域 */}
      <section className="flex flex-wrap gap-4 pt-4 print:hidden">
        {/* 提交按钮（科技感设计） */}
        <button
          onClick={handleSubmit}
          className="px-10 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-brand-blue via-blue-500 to-blue-600 hover:from-brand-blue-dark hover:via-blue-600 hover:to-blue-700 rounded-xl shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/40 transition-all duration-300 flex items-center gap-3 border border-brand-blue/20 hover:border-brand-blue/40 relative overflow-hidden group"
          title="提交后数据将保存到数据库，可在查询页面查看"
        >
          {/* 科技感背景动画 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

          {/* 按钮内容 */}
          <Send className="w-5 h-5 relative z-10" />
          <span className="relative z-10">提 交</span>

          {/* 右侧箭头 */}
          <ArrowRight className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" />
        </button>

        <button
          onClick={handleReset}
          className="btn-secondary flex items-center gap-2 px-6 py-3"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>

        <button
          onClick={handlePrint}
          className="btn-secondary flex items-center gap-2 px-6 py-3"
        >
          <Printer className="w-4 h-4" />
          打印
        </button>

        <button
          onClick={handleExportExcel}
          className="btn-secondary flex items-center gap-2 px-6 py-3"
        >
          <Download className="w-4 h-4" />
          导出Excel
        </button>
      </section>

      {/* 打印内容区域 */}
      <div className="hidden print:block space-y-6">
        {/* 打印基础信息表格 */}
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b">
              <td className="py-2 px-4 font-semibold bg-gray-50 w-32">检验日期</td>
              <td className="py-2 px-4">{formData.inspectionDate}</td>
              <td className="py-2 px-4 font-semibold bg-gray-50 w-32">合作生产点</td>
              <td className="py-2 px-4">{formData.productionPoint}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-semibold bg-gray-50">材料类型</td>
              <td className="py-2 px-4">{formData.materialType}</td>
              <td className="py-2 px-4 font-semibold bg-gray-50">材料代码</td>
              <td className="py-2 px-4">{formData.materialCode}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 px-4 font-semibold bg-gray-50">材料批次号</td>
              <td className="py-2 px-4">{formData.batchNumber}</td>
              <td className="py-2 px-4 font-semibold bg-gray-50">供应商</td>
              <td className="py-2 px-4">{formData.supplier}</td>
            </tr>
            <tr>
              <td className="py-2 px-4 font-semibold bg-gray-50">检验员</td>
              <td className="py-2 px-4" colSpan={3}>{formData.inspector}</td>
            </tr>
          </tbody>
        </table>

        {/* 打印检验指标表格 */}
        <table className="w-full text-sm border-collapse mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border text-left">检验指标</th>
              <th className="py-2 px-4 border text-left">检验结果</th>
            </tr>
          </thead>
          <tbody>
            {INSPECTION_ITEMS.map(item => (
              <tr key={item.key}>
                <td className="py-2 px-4 border">{item.label}</td>
                <td className={`py-2 px-4 border font-semibold ${
                  (formData as any)[item.key] === '合格' ? 'text-green-600' :
                  (formData as any)[item.key] === '不合格' ? 'text-red-600' : ''
                }`}>
                  {(formData as any)[item.key] || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 整体结果 */}
        {formData.overallResult && (
          <div className={`mt-6 p-4 rounded text-center font-bold text-lg ${
            formData.overallResult === '合格' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            本次检验结果：{formData.overallResult}
          </div>
        )}

        {/* 打印图片 */}
        {formData.images.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">检验图片</h3>
            <div className="grid grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`检验图片 ${index + 1}`}
                  className="w-full h-48 object-cover border rounded"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 提交成功提示（全屏覆盖式） */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-tech mx-4 animate-in zoom-in-95 fade-in duration-300 text-center">
            {/* 成功图标 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-in zoom-in-95 duration-500 delay-100">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* 成功文字 */}
            <h3 className="text-2xl font-bold text-foreground mb-2">提交完成</h3>
            <p className="text-base font-medium text-green-400 mb-1">{submitMessage || '数据已成功保存'}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              数据已保存到数据库<br/>
              可在「材料检验结果查询」页面查看
            </p>

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-8 px-10 py-3 text-base font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
