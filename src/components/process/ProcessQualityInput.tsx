import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  RotateCcw,
  X,
  Calendar,
  Clock,
  FileText,
  User,
  Hash,
  Package,
  Factory,
  Send,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { AppearanceDefectInput } from './AppearanceDefectInput';
import { getCurrentUser } from '../auth/Login';
import { ImageCapture } from '../common/ImageCapture';
import type { ParsedQualityForm } from '@/services/ocrService';
import { inspectionApi } from '@/services/api';
import { buildInspectionSubmit } from '@/services/qualityData';

// 表单数据类型定义
interface FormData {
  date: string;
  shift: string;
  shiftNumber: string;
  machine: string;
  productionPoint: string;
  brand: string;
  recorder: string;
  samplingTime: string;
  sampleNumber: string;
  steelStamp: string;
  tobaccoBatch: string;
}

// 缺陷记录接口
interface DefectRecord {
  id: string;
  location: string;
  defectName: string;
  defectCode: string;
  category: string;
  quantity: number;
  scoreCategory?: 'box' | 'carton' | 'pack' | 'physical' | 'appearance' | 'misc';
}

// 单条历史记忆记录
interface HistoryRecord {
  formData: FormData;
  defectData: Record<string, DefectRecord[]>;
  savedAt: string;
}

// 按机台分组的历史记忆
interface MachineHistory {
  lastUsedMachine?: string;
  [machine: string]: HistoryRecord | string | undefined;
}

// 下拉选项配置
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

interface ProcessQualityInputProps {
  onBack?: () => void;
}

export function ProcessQualityInput({ onBack }: ProcessQualityInputProps) {
  // 获取当天日期（YYYY-MM-DD格式）
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 表单状态
  const [formData, setFormData] = useState<FormData>({
    date: getTodayDate(),  // 默认当天日期
    shift: '',
    shiftNumber: '',
    machine: '',
    productionPoint: '',
    brand: '',
    recorder: '',
    samplingTime: '',
    sampleNumber: '',
    steelStamp: '',
    tobaccoBatch: '',
  });

  // 错误信息状态
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // OCR 拍照识别面板
  const [showOCR, setShowOCR] = useState(false);

  // 处理 OCR 识别结果回填
  const handleOCRResult = (data: ParsedQualityForm) => {
    setFormData(prev => ({
      ...prev,
      date: data.date || prev.date,
      shift: data.shift || prev.shift,
      shiftNumber: data.shiftNumber || prev.shiftNumber,
      machine: data.machine || prev.machine,
      productionPoint: data.productionPoint || prev.productionPoint,
      brand: data.brand || prev.brand,
      recorder: data.recorder || prev.recorder,
      sampleNumber: data.sampleNumber || prev.sampleNumber,
      steelStamp: data.steelStamp || prev.steelStamp,
      tobaccoBatch: data.tobaccoBatch || prev.tobaccoBatch,
    }));

    // 缺陷识别回填：按缺陷名称在 defectLibrary 中查找匹配项
    if (data.defects && data.defects.length > 0) {
      import('@/data/defectLibrary').then(({ ALL_DEFECT_CATEGORIES }) => {
        const next: Record<string, DefectRecord[]> = { box: [], carton: [], pack: [], cigarette: [] };
        data.defects?.forEach(item => {
          for (const cat of ALL_DEFECT_CATEGORIES) {
            for (const loc of cat.locations) {
              const found = loc.defects.find(d => d.name.includes(item.name) || item.name.includes(d.name));
              if (found) {
                const categoryKey = cat.key;
                next[categoryKey] = next[categoryKey] || [];
                next[categoryKey].push({
                  id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  location: loc.location,
                  defectName: found.name,
                  defectCode: found.code,
                  category: found.category,
                  quantity: item.quantity,
                  scoreCategory: (found.scoreCategory as DefectRecord['scoreCategory']) || 'appearance',
                });
                return;
              }
            }
          }
        });
        if (Object.values(next).some(arr => arr.length > 0)) {
          setDefectData(next);
        }
      });
    }

    setShowOCR(false);
  };

  // 重置确认对话框
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 重置时是否同时清除历史记忆
  const [clearHistoryOnReset, setClearHistoryOnReset] = useState(false);

  // 提交成功提示
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // 缺陷数据状态
  const [defectData, setDefectData] = useState<Record<string, DefectRecord[]>>({
    box: [],
    carton: [],
    pack: [],
    cigarette: [],
  });

  // 加载指定机台的历史记忆（切换机台或初始加载时调用）
  const loadMachineHistory = (machine: string) => {
    if (!machine) return false;
    try {
      const historyRaw = localStorage.getItem(HISTORY_KEY);
      if (!historyRaw) return false;
      const history: MachineHistory = JSON.parse(historyRaw);
      const record = history[machine] as HistoryRecord | undefined;
      if (!record || !record.formData) return false;

      const remembered: FormData = {
        ...record.formData,
        date: getTodayDate(), // 日期默认当天，不记忆
        machine,              // 确保机台与选择一致
        samplingTime: '',     // 每次必须重新填写
        sampleNumber: '',     // 每次必须重新填写
      };
      setFormData(remembered);
      setHasHistory(true);

      if (record.defectData) {
        const nextDefectData = {
          box: record.defectData.box || [],
          carton: record.defectData.carton || [],
          pack: record.defectData.pack || [],
          cigarette: record.defectData.cigarette || [],
        };
        setHistoryDefectData(nextDefectData);
        setDefectData(nextDefectData);
      }
      return true;
    } catch (error) {
      console.error('加载机台历史记忆失败：', error);
      return false;
    }
  };

  // 页面加载时：如果有上次使用的机台记忆，自动带出该机台数据
  useEffect(() => {
    try {
      const historyRaw = localStorage.getItem(HISTORY_KEY);
      if (historyRaw) {
        const history: MachineHistory = JSON.parse(historyRaw);
        if (history && typeof history === 'object' && Object.keys(history).length > 0) {
          setHasHistory(true);
          const lastMachine = history.lastUsedMachine as string | undefined;
          if (lastMachine) {
            loadMachineHistory(lastMachine);
          }
        }
      }
    } catch (error) {
      console.error('加载历史记忆失败：', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理缺陷数据变化
  const handleDefectDataChange = (data: Record<string, DefectRecord[]>) => {
    setDefectData(data);
  };

  // 上一条记录记忆key（用于连续录入自动带出）
  const HISTORY_KEY = 'processQualityLastRecord';

  // 是否有历史记忆（用于显示连续录入提示）
  const [hasHistory, setHasHistory] = useState(false);

  // 从历史记录带出的缺陷数据初始值
  const [historyDefectData, setHistoryDefectData] = useState<Record<string, DefectRecord[]>>({
    box: [],
    carton: [],
    pack: [],
    cigarette: [],
  });

  // 取样时间输入框引用（提交成功后自动聚焦）
  const samplingTimeRef = useRef<HTMLInputElement>(null);

  // 输入变更处理
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // 切换机台时：自动带出该机台上一次填写的内容
    if (field === 'machine' && value) {
      loadMachineHistory(value);
    }
  };

  // 数据校验
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.date.trim()) newErrors.date = '请选择日期';
    if (!formData.shift) newErrors.shift = '请选择班别';
    if (!formData.shiftNumber) newErrors.shiftNumber = '请选择班次';
    if (!formData.machine) newErrors.machine = '请选择机台';
    if (!formData.productionPoint) newErrors.productionPoint = '请选择合作生产点';
    if (!formData.brand) newErrors.brand = '请选择牌号';
    if (!formData.recorder.trim()) newErrors.recorder = '请输入记录人';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 正式提交处理
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        const currentUser = getCurrentUser();
        const shiftLabel = OPTIONS.shift.find(s => s.value === formData.shift)?.label || formData.shift;
        const machineLabel = OPTIONS.machine.find(m => m.value === formData.machine)?.label || formData.machine;
        const productionPoint = OPTIONS.productionPoint.find(p => p.value === formData.productionPoint)?.label || formData.productionPoint;
        const brand = OPTIONS.brand.find(b => b.value === formData.brand)?.label || formData.brand;

        const payload = buildInspectionSubmit({
          date: formData.date,
          shiftLabel,
          shiftNumber: formData.shiftNumber,
          machine: machineLabel,
          productionPoint,
          brand,
          sampleTime: formData.samplingTime || '',
          sampleTicketNo: formData.sampleNumber || '',
          uploader: currentUser?.displayName || currentUser?.username || '未知用户',
          boxDefects: defectData.box,
          cartonDefects: defectData.carton,
          packDefects: defectData.pack,
          cigaretteDefects: defectData.cigarette,
        });

        const result = await inspectionApi.submit(payload);
        if (!result.success) {
          throw new Error(result.message || '提交失败');
        }

        // 机台记忆仅作表单方便，不是业务数据源
        const historyRaw = localStorage.getItem(HISTORY_KEY);
        const history: MachineHistory = historyRaw ? JSON.parse(historyRaw) : {};
        const currentMachine = formData.machine || 'unknown';
        history[currentMachine] = {
          formData: { ...formData },
          defectData: { ...defectData },
          savedAt: new Date().toISOString(),
        };
        history.lastUsedMachine = currentMachine;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        setHasHistory(true);

        setSubmitMessage(result.message || '记录保存成功！请继续录入下一条');
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          setSubmitMessage('');
        }, 3000);

        setFormData(prev => ({
          ...prev,
          samplingTime: '',
          sampleNumber: '',
        }));
        setErrors({});

        setTimeout(() => {
          samplingTimeRef.current?.focus();
        }, 100);

        window.dispatchEvent(new Event('quality-data-updated'));

      } catch (error) {
        console.error('❌ 数据提交失败：', error);
        alert('数据提交失败，请重试！\n错误信息：' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };

  // 暂存处理（可选功能）
  const handleDraftSave = () => {
    if (!formData.date || !formData.productionPoint) {
      alert('请至少填写日期和合作生产点后再暂存');
      return;
    }

    try {
      const draftData = {
        ...formData,
        defectData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('processQualityDraft', JSON.stringify(draftData));
      alert('草稿已保存！可稍后继续编辑');
    } catch (error) {
      alert('草稿保存失败：' + (error as Error).message);
    }
  };

  // 清除历史记忆
  const clearHistoryMemory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHasHistory(false);
    setHistoryDefectData({ box: [], carton: [], pack: [], cigarette: [] });
  };

  // 重置处理（默认保留历史记忆，方便后续继续连续录入）
  const handleReset = (clearHistory = false) => {
    setFormData({
      date: getTodayDate(),
      shift: '',
      shiftNumber: '',
      machine: '',
      productionPoint: '',
      brand: '',
      recorder: '',
      samplingTime: '',
      sampleNumber: '',
      steelStamp: '',
      tobaccoBatch: '',
    });
    setDefectData({ box: [], carton: [], pack: [], cigarette: [] });
    setErrors({});
    setShowResetConfirm(false);

    if (clearHistory) {
      clearHistoryMemory();
    }
  };

  // 取消处理
  const handleCancel = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 页面标题区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-foreground">卷包过程质量数据录入</h1>
          <p className="text-caption mt-1">录入卷烟生产过程中的基础信息和质量检测数据</p>
        </div>
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-accent/10 transition-all duration-200"
        >
          返回驾驶舱
        </button>
      </div>

      {/* 连续录入提示 */}
      {hasHistory && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-brand-blue/30 bg-brand-blue/5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-brand-blue/15">
              <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">已连续录入模式：已按机台自动带出历史记录</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                切换机台时会自动带出该机台上一次填写的内容；仅“取样时间”和“取样件号”需要重新填写
              </p>
            </div>
          </div>
          <button
            onClick={clearHistoryMemory}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-danger border border-border/50 hover:border-danger/50 rounded-lg hover:bg-danger/5 transition-colors whitespace-nowrap"
          >
            清除记忆
          </button>
        </div>
      )}

      {/* OCR 拍照识别入口 */}
      <div className="flex items-center justify-between rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-brand-blue/15 p-1.5">
            <Camera className="h-4 w-4 text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">拍照智能识别录入</p>
            <p className="text-xs text-muted-foreground">拍摄纸质记录表或质检单，自动识别并回填基础信息与缺陷数据</p>
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
          mode="quality"
          title="卷包过程质量数据识别"
          onCapture={handleOCRResult}
          onCancel={() => setShowOCR(false)}
        />
      )}

      {/* 基础信息模块 */}
      <section className="data-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
          <div className="p-2 rounded-lg bg-brand-blue/10">
            <FileText className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="text-section-title text-foreground">基础信息</h2>
            <p className="text-caption">填写生产批次的基本信息</p>
          </div>
        </div>

        {/* 表单内容 - 模块化布局 */}
        <div className="space-y-6">
          {/* 第一行：日期 | 班别 | 班次 | 机台 */}
          <div className="grid grid-cols-4 gap-6">
            {/* 日期 */}
            <FormField
              label="日期"
              required
              icon={<Calendar className="w-4 h-4" />}
              error={errors.date}
            >
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`form-input ${errors.date ? 'border-danger focus:ring-danger/30' : ''}`}
              />
            </FormField>

            {/* 班别 */}
            <FormField
              label="班别"
              required
              icon={<Clock className="w-4 h-4" />}
              error={errors.shift}
            >
              <select
                value={formData.shift}
                onChange={(e) => handleInputChange('shift', e.target.value)}
                className={`form-select ${errors.shift ? 'border-danger focus:ring-danger/30' : ''}`}
              >
                <option value="">请选择班别</option>
                {OPTIONS.shift.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {/* 班次 */}
            <FormField
              label="班次"
              required
              icon={<Hash className="w-4 h-4" />}
              error={errors.shiftNumber}
            >
              <select
                value={formData.shiftNumber}
                onChange={(e) => handleInputChange('shiftNumber', e.target.value)}
                className={`form-select ${errors.shiftNumber ? 'border-danger focus:ring-danger/30' : ''}`}
              >
                <option value="">请选择班次</option>
                {OPTIONS.shiftNumber.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {/* 机台 */}
            <FormField
              label="机台"
              required
              icon={<Factory className="w-4 h-4" />}
              error={errors.machine}
            >
              <select
                value={formData.machine}
                onChange={(e) => handleInputChange('machine', e.target.value)}
                className={`form-select ${errors.machine ? 'border-danger focus:ring-danger/30' : ''}`}
              >
                <option value="">请选择机台</option>
                {OPTIONS.machine.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* 第二行：合作生产点 | 牌号 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 合作生产点 */}
            <FormField
              label="合作生产点"
              required
              icon={<Package className="w-4 h-4" />}
              error={errors.productionPoint}
            >
              <select
                value={formData.productionPoint}
                onChange={(e) => handleInputChange('productionPoint', e.target.value)}
                className={`form-select ${errors.productionPoint ? 'border-danger focus:ring-danger/30' : ''}`}
              >
                <option value="">请选择合作生产点</option>
                {OPTIONS.productionPoint.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {/* 牌号 */}
            <FormField
              label="牌号"
              required
              icon={<Hash className="w-4 h-4" />}
              error={errors.brand}
            >
              <select
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={`form-select ${errors.brand ? 'border-danger focus:ring-danger/30' : ''}`}
              >
                <option value="">请选择牌号</option>
                {OPTIONS.brand.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* 第三行：记录人 | 取样时间 | 取样件号 */}
          <div className="grid grid-cols-3 gap-6">
            {/* 记录人 */}
            <FormField
              label="记录人"
              required
              icon={<User className="w-4 h-4" />}
              error={errors.recorder}
            >
              <input
                type="text"
                value={formData.recorder}
                onChange={(e) => handleInputChange('recorder', e.target.value)}
                placeholder="请输入记录人姓名"
                className={`form-input ${errors.recorder ? 'border-danger focus:ring-danger/30' : ''}`}
              />
            </FormField>

            {/* 取样时间 */}
            <FormField
              label="取样时间"
              icon={<Clock className="w-4 h-4" />}
            >
              <input
                ref={samplingTimeRef}
                type="time"
                value={formData.samplingTime}
                onChange={(e) => handleInputChange('samplingTime', e.target.value)}
                placeholder="--:--"
                className="form-input"
              />
            </FormField>

            {/* 取样件号 */}
            <FormField
              label="取样件号"
              icon={<Hash className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.sampleNumber}
                onChange={(e) => handleInputChange('sampleNumber', e.target.value)}
                placeholder="请输入取样件号"
                className="form-input"
              />
            </FormField>
          </div>

          {/* 第四行：条盒钢印 | 烟丝批次 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 条盒钢印 */}
            <FormField
              label="条盒钢印"
              icon={<FileText className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.steelStamp}
                onChange={(e) => handleInputChange('steelStamp', e.target.value)}
                placeholder="请输入条盒钢印"
                className="form-input"
              />
            </FormField>

            {/* 烟丝批次 */}
            <FormField
              label="烟丝批次"
              icon={<Package className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.tobaccoBatch}
                onChange={(e) => handleInputChange('tobaccoBatch', e.target.value)}
                placeholder="请输入烟丝批次"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* 外观缺陷录入模块 */}
      <AppearanceDefectInput
        onDataChange={handleDefectDataChange}
        initialData={historyDefectData}
      />

      {/* 操作按钮区域 */}
      <section className="data-card">
        <div className="flex items-center justify-between pt-2 pb-2">
          {/* 左侧：暂存按钮 */}
          <button
            onClick={handleDraftSave}
            className="px-6 py-2.5 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent/10 hover:text-foreground hover:border-accent/50 transition-all duration-200 flex items-center gap-2"
            title="保存为草稿，可稍后继续编辑"
          >
            <FileText className="w-4 h-4" />
            暂存草稿
          </button>

          {/* 右侧：操作按钮组 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-6 py-2.5 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent/10 hover:text-foreground hover:border-accent/50 transition-all duration-200 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>

            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent/10 hover:text-foreground hover:border-accent/50 transition-all duration-200 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              取消
            </button>

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
          </div>
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
                可在「过程质量数据查询」页面查看
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
      </section>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-tech mx-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <RotateCcw className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground mb-1">确认重置表单？</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  重置将清空当前已填写的所有内容，此操作不可撤销。
                </p>
              </div>
            </div>

            {/* 是否同时清除历史记忆 */}
            <label className="flex items-center gap-3 px-1 py-2 mb-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={clearHistoryOnReset}
                onChange={(e) => setClearHistoryOnReset(e.target.checked)}
                className="w-4 h-4 rounded border-border text-brand-blue focus:ring-brand-blue/30 bg-background cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                同时清除历史记忆（下次进入不再自动带出）
              </span>
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-5 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleReset(clearHistoryOnReset)}
                className="px-5 py-2 text-sm font-medium text-white bg-warning hover:bg-warning/90 rounded-lg transition-colors"
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

// 表单字段组件
function FormField({
  children,
  label,
  required,
  icon,
  error,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-danger flex items-center gap-1 mt-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default ProcessQualityInput;

// 全局样式注入（在组件文件中）
const styleSheet = `
  .form-input,
  .form-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: hsl(var(--foreground));
    background-color: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 0.5rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .form-input:hover,
  .form-select:hover {
    border-color: hsl(220 25% 35%);
  }

  .form-input:focus,
  .form-select:focus {
    border-color: hsl(var(--brand-blue));
    box-shadow: 0 0 0 3px hsl(var(--brand-blue) / 0.15);
  }

  .form-input::placeholder {
    color: hsl(var(--muted-foreground));
  }

  .form-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-in {
    animation: fadeIn 0.3s ease-out;
  }
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styleSheet;
  document.head.appendChild(styleEl);
}
