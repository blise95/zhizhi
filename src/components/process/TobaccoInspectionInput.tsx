import React, { useState, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Printer,
  Download,
  Calendar,
  Globe,
  Package,
  Hash,
  Droplets,
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ArrowRight,
} from 'lucide-react';
import { getCurrentUser } from '../auth/Login';
import { RECORD_TYPE, createTypedRecord } from '@/services/qualityData';

// 类型定义
interface TobaccoInspectionData {
  // 基础信息
  inspectionDate: string;
  productionPoint: string;
  tobaccoBrand: string;
  batchNumber: string;

  // 检验指标
  moistureValue: string;      // 烟丝水份检测值
  moistureResult: '合格' | '不合格' | '';  // 烟丝水份判定
  fillingValue: string;       // 烟丝填充值检测值
  fillingResult: '合格' | '不合格' | '';   // 烟丝填充值判定

  // 整体结果
  overallResult: '检验合格' | '检验不合格' | '';
}

// 常量定义
const PRODUCTION_POINTS = ['阿联酋环球烟草', '印尼科伦印象'];
const TOBACCO_BRANDS = ['MOD-1D', 'MOD-2D', 'MOD-6'];

// 烟丝水份标准：12.4 ± 0.5 (11.9 ~ 12.9)
const MOISTURE_STANDARD = {
  target: 12.4,
  tolerance: 0.5,
  min: 11.9,
  max: 12.9,
  unit: '%',
  display: '12.4 ± 0.5',
};

// 烟丝填充值标准：≥ 5.5 cm³/g
const FILLING_STANDARD = {
  min: 5.5,
  unit: 'cm³/g',
  display: '≥ 5.5',
};

export function TobaccoInspectionInput() {
  // 表单状态
  const [formData, setFormData] = useState<TobaccoInspectionData>({
    inspectionDate: new Date().toISOString().split('T')[0],
    productionPoint: '',
    tobaccoBrand: '',
    batchNumber: '',
    moistureValue: '',
    moistureResult: '',
    fillingValue: '',
    fillingResult: '',
    overallResult: '',
  });

  // 错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 提示消息
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 提交成功状态
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // 自动判定烟丝水份
  const evaluateMoisture = (value: string): '合格' | '不合格' | '' => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num >= MOISTURE_STANDARD.min && num <= MOISTURE_STANDARD.max ? '合格' : '不合格';
  };

  // 自动判定烟丝填充值
  const evaluateFilling = (value: string): '合格' | '不合格' | '' => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num >= FILLING_STANDARD.min ? '合格' : '不合格';
  };

  // 计算整体结果
  const calculateOverallResult = (
    moisture: '合格' | '不合格' | '',
    filling: '合格' | '不合格' | ''
  ): '检验合格' | '检验不合格' | '' => {
    if (!moisture || !filling) return '';
    return moisture === '合格' && filling === '合格' ? '检验合格' : '检验不合格';
  };

  // 处理输入变化
  const handleInputChange = (field: keyof TobaccoInspectionData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // 如果修改了水份检测值，自动重新判定
      if (field === 'moistureValue') {
        const moistureResult = evaluateMoisture(value);
        newData.moistureResult = moistureResult;
        newData.overallResult = calculateOverallResult(moistureResult, newData.fillingResult);
      }

      // 如果修改了填充值检测值，自动重新判定
      if (field === 'fillingValue') {
        const fillingResult = evaluateFilling(value);
        newData.fillingResult = fillingResult;
        newData.overallResult = calculateOverallResult(newData.moistureResult, fillingResult);
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

    if (!formData.inspectionDate) newErrors.inspectionDate = '请选择检验日期';
    if (!formData.productionPoint) newErrors.productionPoint = '请选择合作生产点';
    if (!formData.tobaccoBrand) newErrors.tobaccoBrand = '请选择烟丝牌号';
    if (!formData.batchNumber.trim()) newErrors.batchNumber = '请填写烟丝批次号';
    if (!formData.moistureValue.trim()) newErrors.moistureValue = '请输入烟丝水份检测值';
    if (!formData.fillingValue.trim()) newErrors.fillingValue = '请输入烟丝填充值检测值';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 显示提示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 提交数据
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!validateForm()) {
      showMessage('error', '请填写所有必填项');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const currentUser = getCurrentUser();
      const now = new Date().toISOString();
      const newRecord = {
        ...formData,
        createdAt: now,
        updatedAt: now,
        uploader: currentUser?.displayName || currentUser?.username || '未知用户',
      };

      await createTypedRecord(RECORD_TYPE.TOBACCO, newRecord as unknown as Record<string, unknown>, newRecord.uploader);

      setSubmitMessage('记录已保存到数据库');
      setShowSuccess(true);

      setFormData({
        inspectionDate: getTodayDate(),
        productionPoint: '',
        tobaccoBrand: '',
        batchNumber: '',
        moistureValue: '',
        moistureResult: '',
        fillingValue: '',
        fillingResult: '',
      });
      setErrors({});
      window.dispatchEvent(new Event('quality-data-updated'));
    } catch (error) {
      showMessage('error', '提交失败，请重试');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    const hasContent =
      formData.productionPoint ||
      formData.tobaccoBrand ||
      formData.batchNumber ||
      formData.moistureValue ||
      formData.fillingValue;

    if (hasContent) {
      if (!confirm('此操作将清空所有已填写的内容，且无法撤销。确定要继续吗？')) {
        return;
      }
    }

    setFormData({
      inspectionDate: new Date().toISOString().split('T')[0],
      productionPoint: '',
      tobaccoBrand: '',
      batchNumber: '',
      moistureValue: '',
      moistureResult: '',
      fillingValue: '',
      fillingResult: '',
      overallResult: '',
    });
    setErrors({});
    showMessage('success', '表单已重置');
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 导出Excel
  const handleExportExcel = () => {
    if (!validateForm()) {
      showMessage('error', '请先填写完整数据再导出');
      return;
    }

    const headers = [
      '智·质 - 卷烟数智化质量管理与智能分析平台',
      '烟丝到厂检验记录',
      '',
      '基础信息',
      `检验日期,${formData.inspectionDate}`,
      `合作生产点,${formData.productionPoint}`,
      `烟丝牌号,${formData.tobaccoBrand}`,
      `烟丝批次号,${formData.batchNumber}`,
      '',
      '检验指标',
      '检验指标,标准要求,实际检测值,判定',
      `烟丝水份,${MOISTURE_STANDARD.display} ${MOISTURE_STANDARD.unit},${formData.moistureValue},${formData.moistureResult}`,
      `烟丝填充值,${FILLING_STANDARD.display} ${FILLING_STANDARD.unit},${formData.fillingValue},${formData.fillingResult}`,
      '',
      `本次检验结果,${formData.overallResult}`,
      '',
      `导出时间,${new Date().toLocaleString('zh-CN')}`,
    ];

    const csvContent = '\uFEFF' + headers.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `烟丝到厂检验_${formData.inspectionDate}_${formData.tobaccoBrand}.csv`;
    link.click();

    showMessage('success', '导出成功！');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-page-title text-foreground">烟丝到厂检验录入</h1>
        <p className="text-body text-muted-foreground">辅料质量管控 / 烟丝到厂检验录入</p>
      </div>

      {/* 提示消息 */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          } backdrop-blur-sm animate-fade-in`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 基础信息模块 */}
        <section className="data-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
              <Package className="w-5 h-5 text-brand-blue" />
            </div>
            <h2 className="text-module-title text-foreground">基础信息</h2>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* 检验日期 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                检验日期 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                className={`w-full px-3 py-2.5 bg-background/80 rounded-md border ${
                  errors.inspectionDate ? 'border-red-500/50' : 'border-border/50'
                } text-foreground text-sm focus:outline-none focus:border-brand-blue/50 transition-colors`}
              />
              {errors.inspectionDate && (
                <p className="text-xs text-red-400">{errors.inspectionDate}</p>
              )}
            </div>

            {/* 合作生产点 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Globe className="w-4 h-4 text-muted-foreground" />
                合作生产点 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.productionPoint}
                onChange={(e) => handleInputChange('productionPoint', e.target.value)}
                className={`w-full px-3 py-2.5 bg-background/80 rounded-md border ${
                  errors.productionPoint ? 'border-red-500/50' : 'border-border/50'
                } text-foreground text-sm focus:outline-none focus:border-brand-blue/50 transition-colors`}
              >
                <option value="">请选择</option>
                {PRODUCTION_POINTS.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
              {errors.productionPoint && (
                <p className="text-xs text-red-400">{errors.productionPoint}</p>
              )}
            </div>

            {/* 烟丝牌号 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Package className="w-4 h-4 text-muted-foreground" />
                烟丝牌号 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.tobaccoBrand}
                onChange={(e) => handleInputChange('tobaccoBrand', e.target.value)}
                className={`w-full px-3 py-2.5 bg-background/80 rounded-md border ${
                  errors.tobaccoBrand ? 'border-red-500/50' : 'border-border/50'
                } text-foreground text-sm focus:outline-none focus:border-brand-blue/50 transition-colors`}
              >
                <option value="">请选择</option>
                {TOBACCO_BRANDS.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
              {errors.tobaccoBrand && (
                <p className="text-xs text-red-400">{errors.tobaccoBrand}</p>
              )}
            </div>

            {/* 烟丝批次号 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Hash className="w-4 h-4 text-muted-foreground" />
                烟丝批次号 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                placeholder="请输入批次号"
                className={`w-full px-3 py-2.5 bg-background/80 rounded-md border ${
                  errors.batchNumber ? 'border-red-500/50' : 'border-border/50'
                } text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-blue/50 transition-colors`}
              />
              {errors.batchNumber && (
                <p className="text-xs text-red-400">{errors.batchNumber}</p>
              )}
            </div>
          </div>
        </section>

        {/* 检验指标模块 */}
        <section className="data-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Scale className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-module-title text-foreground">检验指标</h2>
          </div>

          {/* 棖验指标表格 */}
          <div className="overflow-hidden rounded-lg border border-border/30">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground border-b border-border/30">
                    检验指标
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground border-b border-border/30">
                    标准要求
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground border-b border-border/30">
                    实际检测值
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground border-b border-border/30">
                    判定
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 烟丝水份 */}
                <tr className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 border-b border-border/20">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-foreground">烟丝水份</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-border/20">
                    <code className="px-2 py-1 bg-background/50 rounded text-sm text-brand-blue font-mono">
                      {MOISTURE_STANDARD.display} {MOISTURE_STANDARD.unit}
                    </code>
                  </td>
                  <td className="px-6 py-4 border-b border-border/20">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.moistureValue}
                      onChange={(e) => handleInputChange('moistureValue', e.target.value)}
                      placeholder="请输入检测值"
                      className={`w-40 px-3 py-2 bg-background/80 rounded-md border ${
                        errors.moistureValue ? 'border-red-500/50' : 'border-border/50'
                      } text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-blue/50 transition-colors`}
                    />
                    {errors.moistureValue && (
                      <p className="text-xs text-red-400 mt-1">{errors.moistureValue}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 border-b border-border/20 text-center">
                    {formData.moistureResult && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                          formData.moistureResult === '合格'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {formData.moistureResult === '合格' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {formData.moistureResult}
                      </span>
                    )}
                  </td>
                </tr>

                {/* 烟丝填充值 */}
                <tr className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-orange-400" />
                      <span className="font-medium text-foreground">烟丝填充值</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-background/50 rounded text-sm text-brand-blue font-mono">
                      {FILLING_STANDARD.display} {FILLING_STANDARD.unit}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.fillingValue}
                      onChange={(e) => handleInputChange('fillingValue', e.target.value)}
                      placeholder="请输入检测值"
                      className={`w-40 px-3 py-2 bg-background/80 rounded-md border ${
                        errors.fillingValue ? 'border-red-500/50' : 'border-border/50'
                      } text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-blue/50 transition-colors`}
                    />
                    {errors.fillingValue && (
                      <p className="text-xs text-red-400 mt-1">{errors.fillingValue}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {formData.fillingResult && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                          formData.fillingResult === '合格'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {formData.fillingResult === '合格' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {formData.fillingResult}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 本次检验结果 */}
          {formData.overallResult && (
            <div
              className={`mt-6 p-6 rounded-lg border transition-all ${
                formData.overallResult === '检验合格'
                  ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30'
                  : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 animate-pulse-slow'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.overallResult === '检验合格' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  )}
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        formData.overallResult === '检验合格' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      本次检验结果
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      基于两项检验指标自动判定
                    </p>
                  </div>
                </div>
                <div
                  className={`px-6 py-3 rounded-lg text-xl font-black ${
                    formData.overallResult === '检验合格'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {formData.overallResult}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 操作按钮区域 */}
        <section className="data-card p-6">
          <div className="flex items-center justify-end gap-4">
            {/* 提交按钮（科技感设计） */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-10 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-brand-blue via-blue-500 to-blue-600 hover:from-brand-blue-dark hover:via-blue-600 hover:to-blue-700 rounded-xl shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/40 transition-all duration-300 flex items-center gap-3 border border-brand-blue/20 hover:border-brand-blue/40 relative overflow-hidden group disabled:opacity-60 disabled:pointer-events-none"
              title="提交后数据将保存到数据库，可在查询页面查看"
            >
              {/* 科技感背景动画 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

              {/* 按钮内容 */}
              <Send className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{submitting ? '提交中…' : '提 交'}</span>

              {/* 右侧箭头 */}
              <ArrowRight className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200" />
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-surface hover:bg-surface/80 text-foreground rounded-lg font-medium border border-border/50 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-surface hover:bg-surface/80 text-foreground rounded-lg font-medium border border-border/50 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              打印
            </button>
            <button
              onClick={handleExportExcel}
              className="px-6 py-2.5 bg-surface hover:bg-surface/80 text-foreground rounded-lg font-medium border border-border/50 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出Excel
            </button>
          </div>
        </section>
      </div>

      {/* 打印样式 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .data-card,
          .data-card * {
            visibility: visible;
          }
          .data-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            page-break-inside: avoid;
          }
          button {
            display: none !important;
          }
        }
      `}</style>

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
              可在「烟丝检验结果查询」页面查看
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
