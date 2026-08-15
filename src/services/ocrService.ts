/**
 * OCR 服务抽象层
 * 支持：Mock（演示）、Tesseract.js（浏览器离线）、Cloud（云端精准 OCR）
 */

import Tesseract from 'tesseract.js';

export interface OCRWord {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
}

export interface OCRResult {
  text: string;
  words: OCRWord[];
  confidence: number;
  provider: string;
}

export interface OCRProvider {
  name: string;
  recognize(image: string): Promise<OCRResult>;
}

export interface CloudOCRConfig {
  provider: 'tencent' | 'baidu' | 'ali' | 'custom';
  endpoint: string;
  secretId?: string;
  secretKey?: string;
  apiKey?: string;
  extraHeaders?: Record<string, string>;
}

export interface OCROptions {
  engine: 'mock' | 'tesseract' | 'cloud';
  lang?: string;
  cloud?: CloudOCRConfig;
}

// ==================== Mock OCR（演示用） ====================

export class MockOCR implements OCRProvider {
  name = 'mock';

  async recognize(image: string): Promise<OCRResult> {
    return {
      text: `日期：2026-08-15\n班次：早班\n班别：1\n机台：9#\n合作生产点：阿联酋环球烟草\n牌号：摩登（细支）\n样本数：50\n缺陷：皱褶 2\n重量：0.85\n长度：84.0\n圆周：17.0\n吸阻：1100`,
      words: [],
      confidence: 95,
      provider: this.name,
    };
  }
}

// ==================== Tesseract.js（浏览器离线） ====================

export class TesseractOCR implements OCRProvider {
  name = 'tesseract';
  private lang: string;

  constructor(lang = 'chi_sim+eng') {
    this.lang = lang;
  }

  async recognize(image: string): Promise<OCRResult> {
    const result = await Tesseract.recognize(image, this.lang, {
      logger: () => {},
    });

    const words: OCRWord[] =
      result.data.words?.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox,
      })) ?? [];

    return {
      text: result.data.text,
      words,
      confidence: result.data.confidence,
      provider: this.name,
    };
  }
}

// ==================== 云端 OCR（腾讯云/百度/阿里/自定义） ====================

export class CloudOCR implements OCRProvider {
  name = 'cloud';
  private config: CloudOCRConfig;

  constructor(config: CloudOCRConfig) {
    this.config = config;
  }

  async recognize(image: string): Promise<OCRResult> {
    const base64 = image.replace(/^data:image\/\w+;base64,/, '');

    // 自定义接口：POST { image: base64 } -> { text: string, words?: [...], confidence?: number }
    if (this.config.provider === 'custom') {
      const res = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.extraHeaders || {}),
        },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) throw new Error(`Cloud OCR 请求失败: ${res.status}`);
      const data = await res.json();
      return {
        text: data.text || '',
        words: data.words || [],
        confidence: data.confidence ?? 0,
        provider: `cloud-${this.config.provider}`,
      };
    }

    // 腾讯云/百度/阿里需要按各自签名方式构造请求，这里预留接口
    // 实际接入时需要根据具体服务商 SDK 或签名算法实现
    throw new Error(`暂未完成 ${this.config.provider} OCR 的签名实现，请先使用 custom 模式接入自有网关。`);
  }
}

// ==================== 工厂 ====================

export function createOCRProvider(options: OCROptions): OCRProvider {
  switch (options.engine) {
    case 'mock':
      return new MockOCR();
    case 'tesseract':
      return new TesseractOCR(options.lang);
    case 'cloud':
      if (!options.cloud) throw new Error('使用 cloud OCR 必须提供 cloud 配置');
      return new CloudOCR(options.cloud);
    default:
      return new MockOCR();
  }
}

// ==================== 识别结果解析 ====================

export interface ParsedQualityForm {
  date?: string;
  shift?: string;
  shiftNumber?: string;
  machine?: string;
  productionPoint?: string;
  brand?: string;
  sampleNumber?: string;
  steelStamp?: string;
  tobaccoBatch?: string;
  recorder?: string;
  defects?: Array<{ name: string; quantity: number }>;
}

export interface ParsedPhysicalForm {
  date?: string;
  shift?: string;
  shiftNumber?: string;
  machine?: string;
  productionPoint?: string;
  brand?: string;
  sampleNumber?: string;
  recorder?: string;
  indicators?: Record<string, number>;
}

function normalizeText(text: string): string {
  return text
    .replace(/[：:\s]+/g, ':')
    .replace(/[，,]/g, ' ')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .trim();
}

function extractValue(text: string, patterns: string[]): string | undefined {
  const normalized = normalizeText(text);
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}[:\\s]+([^\\n\\s]+)`, 'i');
    const match = normalized.match(regex);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function mapShift(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.includes('早') || v.includes('白') || v.includes('day')) return 'morning';
  if (v.includes('晚') || v.includes('夜') || v.includes('night')) return 'night';
  return undefined;
}

function mapMachine(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[机台#\s]/g, '').trim();
  const machines = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];
  for (const m of machines) {
    const key = m.replace(/[#\s]/g, '').toLowerCase();
    if (normalized.toLowerCase() === key) return m;
  }
  return undefined;
}

function mapProductionPoint(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.includes('阿联酋') || value.includes('环球') || value.includes('UAE')) return 'uae';
  if (value.includes('印尼') || value.includes('科伦') || value.includes('Indonesia')) return 'indonesia';
  return undefined;
}

function mapBrand(value?: string): string | undefined {
  if (!value) return undefined;
  const brandMap: Record<string, string> = {
    '中东-EU': 'modern-eu',
    '普通红吉布提': 'normal-red-djibouti',
    '普通红国际': 'normal-red-intl',
    '普通银国际': 'normal-silver-intl',
    '细支金': 'slim-gold',
    '细支': 'slim',
    '超细金': 'ultra-gold',
    '超细支': 'ultra-slim',
    '超细银': 'ultra-silver',
    '超细黑': 'ultra-black',
    '97超细白': 'ultra-white-97',
  };
  for (const [key, val] of Object.entries(brandMap)) {
    if (value.includes(key)) return val;
  }
  return undefined;
}

export function parseQualityForm(text: string): ParsedQualityForm {
  const normalized = normalizeText(text);

  const defectLines = normalized
    .split('\n')
    .filter(line => /缺陷|外观|质量问题/.test(line) || /[:\s]+\d+\s*(个|处|条|支|次)?$/.test(line));

  const defects: Array<{ name: string; quantity: number }> = [];
  for (const line of defectLines) {
    const match = line.match(/([^:\n]+?)[:\s]+(\d+)/);
    if (match) {
      const name = match[1].replace(/缺陷|数量|个数/g, '').trim();
      if (name && !/样本|样本数|样品/.test(name)) {
        defects.push({ name, quantity: parseInt(match[2], 10) || 0 });
      }
    }
  }

  return {
    date: extractValue(text, ['日期', '时间', 'Date']),
    shift: mapShift(extractValue(text, ['班次', '班别', 'Shift'])),
    shiftNumber: extractValue(text, ['班别', '班组', '班次号']),
    machine: mapMachine(extractValue(text, ['机台', '机器', 'Machine'])),
    productionPoint: mapProductionPoint(extractValue(text, ['生产点', '合作生产点', '工厂', '产地'])),
    brand: mapBrand(extractValue(text, ['牌号', '品牌', 'Brand'])),
    sampleNumber: extractValue(text, ['样本数', '样本量', '样品数', 'Sample']),
    steelStamp: extractValue(text, ['钢印', '钢印号']),
    tobaccoBatch: extractValue(text, ['烟丝批号', '烟丝批次', '批次']),
    recorder: extractValue(text, ['记录人', '录入人', '检测人', 'Recorder']),
    defects: defects.length > 0 ? defects : undefined,
  };
}

export function parsePhysicalForm(text: string): ParsedPhysicalForm {
  const indicators: Record<string, number> = {};
  const normalized = normalizeText(text);

  const indicatorPatterns: Array<{ keys: string[]; field: string }> = [
    { keys: ['重量', 'weight'], field: 'weight' },
    { keys: ['长度', 'length'], field: 'length' },
    { keys: ['圆周', 'circumference'], field: 'circumference' },
    { keys: ['吸阻', 'drawResistance', 'draw resistance'], field: 'drawResistance' },
    { keys: ['硬度', 'hardness'], field: 'hardness' },
    { keys: ['总通风率', 'totalVentilation'], field: 'totalVentilation' },
    { keys: ['嘴通风率', 'filterVentilation'], field: 'filterVentilation' },
  ];

  for (const { keys, field } of indicatorPatterns) {
    for (const key of keys) {
      const regex = new RegExp(`${key}[:\\s]+([-+]?\\d*\\.?\\d+)`, 'i');
      const match = normalized.match(regex);
      if (match?.[1]) {
        indicators[field] = parseFloat(match[1]);
        break;
      }
    }
  }

  return {
    date: extractValue(text, ['日期', '时间', 'Date']),
    shift: mapShift(extractValue(text, ['班次', '班别', 'Shift'])),
    shiftNumber: extractValue(text, ['班别', '班组', '班次号']),
    machine: mapMachine(extractValue(text, ['机台', '机器', 'Machine'])),
    productionPoint: mapProductionPoint(extractValue(text, ['生产点', '合作生产点', '工厂', '产地'])),
    brand: mapBrand(extractValue(text, ['牌号', '品牌', 'Brand'])),
    sampleNumber: extractValue(text, ['样本数', '样本量', '样品数', 'Sample']),
    recorder: extractValue(text, ['记录人', '录入人', '检测人', 'Recorder']),
    indicators: Object.keys(indicators).length > 0 ? indicators : undefined,
  };
}
