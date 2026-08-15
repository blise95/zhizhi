import React, { useState } from 'react';
import {
  Send,
  RotateCcw,
  Printer,
  Download,
  X,
  Calendar,
  Clock,
  User,
  Factory,
  Package,
  FlaskConical,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { ImageCapture } from '../common/ImageCapture';
import type { ParsedPhysicalForm } from '@/services/ocrService';

// 导入类型定义
import type {
  PhysicalTestRecord,
  IndicatorData,
} from '@/data/physicalTestTypes';
import {
  PHYSICAL_TEST_INDICATORS,
  createEmptyIndicatorData,
} from '@/data/physicalTestTypes';
import { getCurrentUser } from '../auth/Login';

// 下拉选项配置（与录入页面保持一致）
const OPTIONS = {
  shift: [
    { value: 'morning', label: '早班' },
    { value: 'night', label: '夜班' },
  ],
  shiftNumber: [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
  ],
  machine: [
    { value: '2#', label: '2#' },
    { value: '4#', label: '4#' },
    { value: '9#', label: '9#' },
    { value: '10#', label: '10#' },
    { value: 'ALW 9#', label: 'ALW 9#' },
    { value: 'ALW 1#', label: 'ALW 1#' },
  ],
  productionPoint: [
    { value: 'uae', label: '阿联酋环球烟草' },
    { value: 'indonesia', label: '印尼科伦印象' },
  ],
  brand: [
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
  ],
};

interface CigarettePhysicalTestInputProps {
  onBack?: () => void;
}

export function CigarettePhysicalTestInput({ onBack }: CigarettePhysicalTestInputProps) {
  // 获取当天日期
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 基础信息状态
  const [basicInfo, setBasicInfo] = useState({
    date: getTodayDate(),
    shiftType: '',
    shiftNumber: '',
    machine: '',
    productionPoint: '',
    brand: '',
    recorder: '',
    testTime: '',
  });

  // 物测指标状态
  const [indicatorData, setIndicatorData] = useState<Record<string, IndicatorData>>(() => {
    const data: Record<string, IndicatorData> = {};
    PHYSICAL_TEST_INDICATORS.forEach(indicator => {
      data[indicator.id] = createEmptyIndicatorData();
    });
    return data;
  });

  // UI状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOCR, setShowOCR] = useState(false);

  // OCR 识别结果回填
  const handleOCRResult = (data: ParsedPhysicalForm) => {
    setBasicInfo(prev => ({
      ...prev,
      date: data.date || prev.date,
      shiftType: data.shift || prev.shiftType,
      shiftNumber: data.shiftNumber || prev.shiftNumber,
      machine: data.machine || prev.machine,
      productionPoint: data.productionPoint || prev.productionPoint,
      brand: data.brand || prev.brand,
      recorder: data.recorder || prev.recorder,
    }));

    if (data.indicators) {
      setIndicatorData(prev => {
        const next = { ...prev };
        Object.entries(data.indicators || {}).forEach(([key, value]) => {
          if (next[key]) {
            next[key] = { ...next[key], x: value.toString() };
          }
        });
        return next;
      });
    }

    setShowOCR(false);
  };

  // 更新基础信息
  const updateBasicInfo = (field: string, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 更新物测指标数据
  const updateIndicatorData = (indicatorId: string, subKey: string, value: string) => {
    setIndicatorData(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [subKey]: value,
      }
    }));
  };

  // 数据校验
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 基础信息必填验证
    if (!basicInfo.date) newErrors.date = '请选择日期';
    if (!basicInfo.shiftType) newErrors.shiftType = '请选择班别';
    if (!basicInfo.shiftNumber) newErrors.shiftNumber = '请选择班次';
    if (!basicInfo.machine) newErrors.machine = '请选择机台';
    if (!basicInfo.productionPoint) newErrors.productionPoint = '请选择合作生产点';
    if (!basicInfo.brand) newErrors.brand = '请选择牌号';
    if (!basicInfo.recorder.trim()) newErrors.recorder = '请输入记录人';
    if (!basicInfo.testTime) newErrors.testTime = '请输入检测时间';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交数据
  const handleSubmit = () => {
    if (!validateForm()) return;

    const currentUser = getCurrentUser();
    const now = new Date().toISOString();

    const record: PhysicalTestRecord = {
      id: Date.now().toString(),
      ...basicInfo,
      weight: indicatorData['weight'] || createEmptyIndicatorData(),
      circumference: indicatorData['circumference'] || createEmptyIndicatorData(),
      drawResistance: indicatorData['drawResistance'] || createEmptyIndicatorData(),
      ventilationLength: indicatorData['ventilationLength'] || createEmptyIndicatorData(),
      createdAt: now,
      updatedAt: now,
      uploader: currentUser?.displayName || currentUser?.username || '未知用户',
    };

    // 保存到localStorage
    const existingRecords = JSON.parse(localStorage.getItem('physicalTestRecords') || '[]');
    existingRecords.push(record);
    localStorage.setItem('physicalTestRecords', JSON.stringify(existingRecords));

    // 显示提交成功弹窗
    const recordCount = existingRecords.length;
    setSubmitMessage(`已成功保存第 ${recordCount} 条记录`);
    setShowSuccess(true);

    // 自动重置表单
    handleReset();
  };

  // 重置表单
  const handleReset = () => {
    setBasicInfo({
      date: getTodayDate(),
      shiftType: '',
      shiftNumber: '',
      machine: '',
      productionPoint: '',
      brand: '',
      recorder: '',
      testTime: '',
    });

    const emptyData: Record<string, IndicatorData> = {};
    PHYSICAL_TEST_INDICATORS.forEach(indicator => {
      emptyData[indicator.id] = createEmptyIndicatorData();
    });
    setIndicatorData(emptyData);

    setErrors({});
    setShowResetConfirm(false);
  };

  // 打印功能
  const handlePrint = () => {
    window.print();
  };

  // 导出Excel（CSV格式）
  const handleExportExcel = () => {
    const record = {
      ...basicInfo,
      ...indicatorData,
    };

    // 构建CSV内容
    let csvContent = '\uFEFF'; // BOM for UTF-8

    // 基础信息头部
    csvContent += '智·质 - 卷烟数智化质量管理与智能分析平台\n';
    csvContent += '烟支物测指标数据录入\n\n';
    csvContent += '基础信息\n';
    csvContent += `日期,${record.date}\n`;
    csvContent += `班别,${OPTIONS.shift.find(s => s.value === record.shiftType)?.label || ''}\n`;
    csvContent += `班次,${record.shiftNumber}\n`;
    csvContent += `机台,${OPTIONS.machine.find(m => m.value === record.machine)?.label || ''}\n`;
    csvContent += `合作生产点,${OPTIONS.productionPoint.find(p => p.value === record.productionPoint)?.label || ''}\n`;
    csvContent += `牌号,${OPTIONS.brand.find(b => b.value === record.brand)?.label || ''}\n`;
    csvContent += `记录人,${record.recorder}\n`;
    csvContent += `检测时间,${record.testTime}\n\n`;

    // 物测指标头部
    csvContent += '烟支物测指标\n';
    csvContent += '指标,X,SD,MAX,MIN\n';

    // 各项指标数据
    PHYSICAL_TEST_INDICATORS.forEach(indicator => {
      const data = indicatorData[indicator.id] || createEmptyIndicatorData();
      csvContent += `${indicator.name},${data.x},${data.sd},${data.max},${data.min}\n`;
    });

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `烟支物测指标_${record.date}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-background p-6 print:p-0">
      {/* 提交成功弹窗（全屏覆盖式） */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 fade-in duration-300">
            {/* 绿色渐变勾选图标 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-in zoom-in-95 duration-500 delay-100">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>

            {/* 标题 */}
            <h3 className="text-2xl font-bold text-foreground mb-2">提交完成</h3>
            <p className="text-muted-foreground text-sm mb-1">数据已成功保存</p>
            <p className="text-brand-blue font-medium text-base mb-6">{submitMessage}</p>

            {/* 说明文字 */}
            <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left space-y-2">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-brand-blue mt-0.5">●</span>
                数据已保存到数据库
              </p>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-brand-blue mt-0.5">●</span>
                可在「烟支物测数据查询」页面查看
              </p>
            </div>

            {/* 确认按钮 */}
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full px-6 py-3 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-page-title text-foreground">烟支物测指标数据录入</h1>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回驾驶舱
          </button>
        </div>
        <p className="text-body text-muted-foreground">过程质量管控 / 烟支物测指标数据录入</p>
      </div>

      {/* OCR 拍照识别入口 */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-brand-blue/15 p-1.5">
            <Camera className="h-4 w-4 text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">拍照智能识别录入</p>
            <p className="text-xs text-muted-foreground">拍摄物测记录表或检测设备屏幕，自动识别并回填基础信息与物测指标</p>
          </div>
        </div>
        <button
          onClick={() => setShowOCR(v => !v)}
          className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-blue/90"
        >
          {showOCR ? '收起识别' : '拍照识别'}
        </button>
      </div>

      {showOCR && (
        <ImageCapture
          mode="physical"
          title="烟支物测指标数据识别"
          onCapture={handleOCRResult}
          onCancel={() => setShowOCR(false)}
        />
      )}

      {/* 基础信息模块 */}
      <section className="data-card mb-6 print:border-0 print:shadow-none">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center border border-brand-blue/20">
            <Factory className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="text-module-title text-foreground">基础信息</h2>
          </div>
        </div>

        {/* 第一行：日期 | 班别 | 班次 | 机台 */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          {/* 日期 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4 text-brand-blue" />
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={basicInfo.date}
              onChange={(e) => updateBasicInfo('date', e.target.value)}
              className={`form-input ${errors.date ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.date && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.date}
              </p>
            )}
          </div>

          {/* 班别 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">班别 <span className="text-red-500">*</span></label>
            <select
              value={basicInfo.shiftType}
              onChange={(e) => updateBasicInfo('shiftType', e.target.value)}
              className={`form-select ${errors.shiftType ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">请选择班别</option>
              {OPTIONS.shift.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.shiftType && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.shiftType}
              </p>
            )}
          </div>

          {/* 班次 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">班次 <span className="text-red-500">*</span></label>
            <select
              value={basicInfo.shiftNumber}
              onChange={(e) => updateBasicInfo('shiftNumber', e.target.value)}
              className={`form-select ${errors.shiftNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">请选择班次</option>
              {OPTIONS.shiftNumber.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.shiftNumber && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.shiftNumber}
              </p>
            )}
          </div>

          {/* 机台 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">机台 <span className="text-red-500">*</span></label>
            <select
              value={basicInfo.machine}
              onChange={(e) => updateBasicInfo('machine', e.target.value)}
              className={`form-select ${errors.machine ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">请选择机台</option>
              {OPTIONS.machine.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.machine && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.machine}
              </p>
            )}
          </div>
        </div>

        {/* 第二行：合作生产点 | 牌号 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 合作生产点 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">合作生产点 <span className="text-red-500">*</span></label>
            <select
              value={basicInfo.productionPoint}
              onChange={(e) => updateBasicInfo('productionPoint', e.target.value)}
              className={`form-select ${errors.productionPoint ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">请选择合作生产点</option>
              {OPTIONS.productionPoint.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.productionPoint && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.productionPoint}
              </p>
            )}
          </div>

          {/* 牌号 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">牌号 <span className="text-red-500">*</span></label>
            <select
              value={basicInfo.brand}
              onChange={(e) => updateBasicInfo('brand', e.target.value)}
              className={`form-select ${errors.brand ? 'border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">请选择牌号</option>
              {OPTIONS.brand.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.brand && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.brand}
              </p>
            )}
          </div>
        </div>

        {/* 第三行：记录人 | 检测时间 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 记录人 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <User className="w-4 h-4 text-brand-blue" />
              记录人 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={basicInfo.recorder}
              onChange={(e) => updateBasicInfo('recorder', e.target.value)}
              placeholder="请输入记录人"
              className={`form-input ${errors.recorder ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.recorder && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.recorder}
              </p>
            )}
          </div>

          {/* 烟支检测时间 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Clock className="w-4 h-4 text-brand-blue" />
              烟支检测时间 <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={basicInfo.testTime}
              onChange={(e) => updateBasicInfo('testTime', e.target.value)}
              placeholder="HH:MM"
              className={`form-input ${errors.testTime ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {errors.testTime && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.testTime}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 烟支物测指标模块 */}
      <section className="data-card mb-6 print:border-0 print:shadow-none">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <FlaskConical className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-module-title text-foreground">烟支物测指标</h2>
          </div>
        </div>

        {/* 物测指标表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-32">指标名称</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-16">单位</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-28">X<br/><span className="font-normal text-xs text-muted-foreground">平均值</span></th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-28">SD<br/><span className="font-normal text-xs text-muted-foreground">标准差</span></th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-28">MAX<br/><span className="font-normal text-xs text-muted-foreground">最大值</span></th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-28">MIN<br/><span className="font-normal text-xs text-muted-foreground">最小值</span></th>
              </tr>
            </thead>
            <tbody>
              {PHYSICAL_TEST_INDICATORS.map((indicator) => {
                const data = indicatorData[indicator.id] || createEmptyIndicatorData();
                return (
                  <tr key={indicator.id} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                    {/* 指标名称 */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{indicator.name}</span>
                        <span className="text-xs text-muted-foreground">({indicator.nameEn})</span>
                      </div>
                    </td>

                    {/* 单位 */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-muted-foreground">{indicator.unit}</span>
                    </td>

                    {/* X - 平均值 */}
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={data.x}
                        onChange={(e) => updateIndicatorData(indicator.id, 'x', e.target.value)}
                        placeholder="X"
                        className="form-input text-center text-sm"
                      />
                    </td>

                    {/* SD - 标准差 */}
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={data.sd}
                        onChange={(e) => updateIndicatorData(indicator.id, 'sd', e.target.value)}
                        placeholder="SD"
                        className="form-input text-center text-sm"
                      />
                    </td>

                    {/* MAX - 最大值 */}
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={data.max}
                        onChange={(e) => updateIndicatorData(indicator.id, 'max', e.target.value)}
                        placeholder="MAX"
                        className="form-input text-center text-sm"
                      />
                    </td>

                    {/* MIN - 最小值 */}
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        step="0.01"
                        value={data.min}
                        onChange={(e) => updateIndicatorData(indicator.id, 'min', e.target.value)}
                        placeholder="MIN"
                        className="form-input text-center text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 表格说明 */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            <strong>说明：</strong>X=平均值，SD=标准差，MAX=最大值，MIN=最小值。
            所有数值型指标支持小数点后两位精度。
          </p>
        </div>
      </section>

      {/* 操作按钮区域 */}
      <section className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          {/* 提交按钮（科技感大按钮） */}
          <button
            onClick={handleSubmit}
            className="px-10 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-brand-blue via-blue-500 to-blue-600 hover:from-brand-blue-dark hover:via-blue-600 hover:to-blue-700 rounded-xl shadow-lg shadow-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue/40 transition-all duration-300 border border-brand-blue/20 hover:border-brand-blue/40 relative overflow-hidden group"
            title="提交后数据将保存到数据库，可在查询页面查看"
          >
            {/* 科技感光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

            <Send className="w-5 h-5 relative z-10" />
            <span className="relative z-10 tracking-wider">提 交</span>
            <ArrowRight className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1" />
          </button>

          {/* 重置按钮 */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-secondary flex items-center gap-2 px-6 py-3"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* 打印按钮 */}
          <button
            onClick={handlePrint}
            className="btn-outline flex items-center gap-2 px-6 py-3"
          >
            <Printer className="w-4 h-4" />
            打印
          </button>

          {/* 导出Excel按钮 */}
          <button
            onClick={handleExportExcel}
            className="btn-outline flex items-center gap-2 px-6 py-3"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
        </div>
      </section>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">确认重置</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  此操作将清空当前所有已填写的基础信息和物测指标数据。
                  <br /><br />
                  <strong className="text-yellow-600">此操作不可撤销！</strong>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
