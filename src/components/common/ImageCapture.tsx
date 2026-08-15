import React, { useState, useRef, useCallback } from 'react';
import { Camera, Image as ImageIcon, X, ScanLine, Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';
import {
  createOCRProvider,
  parseQualityForm,
  parsePhysicalForm,
  type OCROptions,
  type OCRResult,
  type ParsedQualityForm,
  type ParsedPhysicalForm,
} from '@/services/ocrService';

export type CaptureMode = 'camera' | 'album';

interface ImageCaptureProps {
  mode: 'quality' | 'physical';
  onCapture: (data: ParsedQualityForm | ParsedPhysicalForm, rawText: string) => void;
  onCancel?: () => void;
  title?: string;
}

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.85;

function compressImage(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context 初始化失败'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageCapture({ mode, onCapture, onCancel, title }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [parsed, setParsed] = useState<ParsedQualityForm | ParsedPhysicalForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [engine, setEngine] = useState<OCROptions['engine']>('mock');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);

      const provider = createOCRProvider({ engine });
      const result = await provider.recognize(compressed);
      setOcrResult(result);

      const parsedData = mode === 'quality' ? parseQualityForm(result.text) : parsePhysicalForm(result.text);
      setParsed(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '识别失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [engine, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (parsed) {
      onCapture(parsed, ocrResult?.text || '');
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setOcrResult(null);
    setParsed(null);
    setError(null);
  };

  const renderParsedPreview = () => {
    if (!parsed) return null;
    const entries = Object.entries(parsed).filter(([key, value]) => {
      if (value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && Object.keys(value).length === 0) return false;
      return true;
    });

    return (
      <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400">
          <ScanLine className="h-4 w-4" />
          <span>识别结果预览（请核对后确认）</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between rounded-md bg-slate-800/60 px-3 py-2">
              <span className="text-slate-400">{key}</span>
              <span className="text-slate-200 font-medium truncate">
                {Array.isArray(value)
                  ? value.map(v => `${v.name || ''}:${v.quantity || ''}`).join(', ')
                  : typeof value === 'object'
                    ? Object.entries(value).map(([k, v]) => `${k}:${v}`).join(', ')
                    : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-blue" />
          <h3 className="text-base font-semibold text-slate-100">{title || '拍照智能识别'}</h3>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-400">识别引擎：</label>
        <select
          value={engine}
          onChange={e => setEngine(e.target.value as OCROptions['engine'])}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-blue"
        >
          <option value="mock">演示模式（mock）</option>
          <option value="tesseract">浏览器离线 OCR（tesseract.js）</option>
          <option value="cloud">云端精准 OCR（需配置）</option>
        </select>
        <span className="text-xs text-slate-500">
          {engine === 'mock' && '返回模拟数据，用于界面演示'}
          {engine === 'tesseract' && '本地识别，无需网络，中文表格效果一般'}
          {engine === 'cloud' && '推荐：识别最精准，需配置云端 API'}
        </span>
      </div>

      {!preview ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-8 text-slate-300 transition hover:border-brand-blue hover:bg-slate-800/70 hover:text-brand-blue"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-medium">摄像头拍照</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/40 p-8 text-slate-300 transition hover:border-brand-blue hover:bg-slate-800/70 hover:text-brand-blue"
          >
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm font-medium">从相册选择</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-700">
            <img src={preview} alt="preview" className="max-h-64 w-full object-contain" />
            <button
              onClick={handleRetake}
              className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-slate-200 hover:bg-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {ocrResult && (
            <div className="rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
              <div className="mb-1 flex items-center justify-between">
                <span>置信度：{ocrResult.confidence.toFixed(1)}%</span>
                <span className="text-slate-500">引擎：{ocrResult.provider}</span>
              </div>
              <pre className="max-h-24 overflow-auto whitespace-pre-wrap text-slate-300">{ocrResult.text}</pre>
            </div>
          )}

          {renderParsedPreview()}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="mt-5 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            取消
          </button>
        )}
        {preview && !loading && (
          <button
            onClick={handleConfirm}
            disabled={!parsed}
            className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-blue/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            确认回填
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <span className="mt-2 text-sm text-slate-300">正在识别图片，请稍候…</span>
        </div>
      )}
    </div>
  );
}
