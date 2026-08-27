/**
 * 智合服务不可用时，用主站已加载的过程质量数据回答时段质量问题。
 * 评级口径与驾驶舱共用 qualityEngine.ts。
 */
import { RATING_META, rateRecords, type BatchRating } from '@/lib/qualityEngine';
import type { DefectRecord, ProcessQualityRecord } from '@/utils/analysisUtils';

export interface LocalDateRange {
  from: string;
  to: string;
  label: string;
}

const CN_DAY_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function cnOrDigitToInt(token: string): number | null {
  if (/^\d+$/.test(token)) {
    const n = Number(token);
    return n >= 1 && n <= 90 ? n : null;
  }
  return CN_DAY_NUM[token] ?? null;
}

export function parseLocalDateRange(question: string, now = new Date()): LocalDateRange {
  const today = isoDate(now);
  const compact = question.replace(/\s+/g, '').toLowerCase();

  const week = compact.match(/(过去|近|最近)一?周/);
  if (week) {
    const from = isoDate(addDays(now, -6));
    return { from, to: today, label: week[0] };
  }

  const days = compact.match(/(过去|近|最近|前)(\d+|[一二两三四五六七八九十]+)天/);
  if (days) {
    const n = cnOrDigitToInt(days[2]);
    if (n) {
      const from = isoDate(addDays(now, -(n - 1)));
      return { from, to: today, label: days[0] };
    }
  }

  const ymd = compact.match(/(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})[日号]?/);
  const md = compact.match(/(\d{1,2})月(\d{1,2})[日号]?/)
    || compact.match(/(?<![\d.])(\d{1,2})[./-](\d{1,2})(?![\d.])/);
  const dateHit = ymd || md;
  if (dateHit) {
    const year = ymd ? Number(dateHit[1]) : now.getFullYear();
    const month = ymd ? Number(dateHit[2]) : Number(dateHit[1]);
    const day = ymd ? Number(dateHit[3]) : Number(dateHit[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(year, month - 1, day);
      if (d.getMonth() === month - 1) {
        if (!ymd && d.getTime() > now.getTime()) {
          d.setFullYear(year - 1);
        }
        const iso = isoDate(d);
        return { from: iso, to: iso, label: dateHit[0] };
      }
    }
  }

  if (/(今天|今日|当天|本日)/.test(compact)) {
    const label = compact.includes('今日') ? '今日' : compact.includes('当天') ? '当天' : '今天';
    return { from: today, to: today, label };
  }
  if (/(昨天|昨日)/.test(compact)) {
    const y = isoDate(addDays(now, -1));
    return { from: y, to: y, label: compact.includes('昨日') ? '昨日' : '昨天' };
  }
  if (/(本周|这周|这一周)/.test(compact)) {
    const monday = now.getDay() === 0 ? addDays(now, -6) : addDays(now, 1 - now.getDay());
    const sunday = addDays(monday, 6);
    return { from: isoDate(monday), to: isoDate(sunday), label: '本周' };
  }
  if (/(上周|上一周)/.test(compact)) {
    const thisMonday = now.getDay() === 0 ? addDays(now, -6) : addDays(now, 1 - now.getDay());
    const monday = addDays(thisMonday, -7);
    const sunday = addDays(monday, 6);
    return { from: isoDate(monday), to: isoDate(sunday), label: '上周' };
  }
  if (/(本月|这个月)/.test(compact)) {
    const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from, to: isoDate(last), label: '本月' };
  }
  if (/(上月|上个月)/.test(compact)) {
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    const from = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-01`;
    return { from, to: isoDate(last), label: '上月' };
  }
  if (/(最近|近期)/.test(compact)) {
    const from = isoDate(addDays(now, -29));
    return { from, to: today, label: '近期' };
  }

  const from = isoDate(addDays(now, -29));
  return { from, to: today, label: '近期' };
}

const KNOWLEDGE_ONLY =
  /属于什么等级|怎么判定|如何判定|判定标准|缺陷代码|分值线|扣分表|A类缺陷|B类缺陷|C类缺陷|D类缺陷/;

const DATA_HINT =
  /质量|缺陷|优质率|合格率|批次|机台|趋势|异常|牌号|怎么样|如何|样本/;

export function looksLikeQualityDataQuestion(question: string): boolean {
  if (KNOWLEDGE_ONLY.test(question) && !/(今天|今日|本周|本月|过去|最近|近期).*(缺陷|质量|批次)/.test(question)) {
    return false;
  }
  return DATA_HINT.test(question);
}

function collectDefects(record: ProcessQualityRecord): DefectRecord[] {
  return [
    ...(record.boxDefects || []),
    ...(record.cartonDefects || []),
    ...(record.packDefects || []),
    ...(record.cigaretteDefects || []),
  ];
}

function topDefects(records: ProcessQualityRecord[], topN = 3) {
  const counter = new Map<string, { name: string; location: string; count: number }>();
  records.forEach((r) => {
    collectDefects(r).forEach((d) => {
      const name = d.defectName || '未命名缺陷';
      const key = `${d.location || ''}::${name}`;
      const prev = counter.get(key) || { name, location: d.location || '', count: 0 };
      prev.count += d.quantity || 1;
      counter.set(key, prev);
    });
  });
  return [...counter.values()].sort((a, b) => b.count - a.count).slice(0, topN);
}

function statusFromDefectRate(rate: number) {
  if (rate > 20) return '异常';
  if (rate > 10) return '需关注';
  if (rate > 5) return '稳定';
  return '良好';
}

function rangeText(range: LocalDateRange) {
  if (range.from === range.to) return `（${range.from}）`;
  return `（${range.from} ~ ${range.to}）`;
}

function machineFocusLines(ratings: BatchRating[]): string[] {
  const groups = new Map<string, BatchRating[]>();
  ratings.forEach((r) => {
    const key = r.machine || '未知机台';
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  });
  const ranked = [...groups.entries()]
    .map(([machine, list]) => {
      const defectCount = list.reduce((s, x) => s + x.defectCount, 0);
      const defectBatches = list.filter((x) => x.defectCount > 0).length;
      const defectRate = list.length ? (defectBatches / list.length) * 100 : 0;
      return { machine, batchCount: list.length, defectCount, defectRate };
    })
    .sort((a, b) => b.defectRate - a.defectRate || b.defectCount - a.defectCount)
    .slice(0, 3);
  if (!ranked.length) return [];
  return [
    '需关注机台：' +
      ranked
        .map((m) => `${m.machine}（${m.batchCount} 批，缺陷率 ${m.defectRate.toFixed(2)}%）`)
        .join('、') +
      '。',
  ];
}

function shiftLabel(record: ProcessQualityRecord): string {
  const group = (record.shiftGroup || '').trim();
  const team = (record.shift || '').trim();
  const names = ['早班', '中班', '晚班', '白班', '夜班'];
  for (const v of [group, team]) {
    if (names.some((n) => v.includes(n))) return v;
    if (['早', '中', '晚', '白', '夜'].includes(v)) return `${v}班`;
  }
  return group || team || '未分班';
}

function productionSamples(records: ProcessQualityRecord[]) {
  const seen = new Set<string>();
  const samples: { shift: string; brand: string }[] = [];
  records.forEach((r) => {
    const brand = (r.brand || '').trim();
    if (!brand) return;
    const shift = shiftLabel(r);
    const key = `${shift}::${brand}`;
    if (seen.has(key)) return;
    seen.add(key);
    samples.push({ shift, brand });
  });
  return samples;
}

export function answerLocalQualityQuestion(
  question: string,
  processRecords: ProcessQualityRecord[]
): string | null {
  if (!looksLikeQualityDataQuestion(question)) return null;

  const range = parseLocalDateRange(question);
  const filtered = processRecords.filter((r) => {
    const d = (r.inspectionDate || '').slice(0, 10);
    return d && d >= range.from && d <= range.to;
  });

  const askSample = /样本数|几个样本|多少样本|有几个样本/.test(question);
  const askBrands = /什么牌号|哪些牌号|生成了什么|生产了什么|生产了哪些/.test(question)
    && !/趋势|下降|对比|缺陷率/.test(question);

  if (askSample || askBrands) {
    const samples = productionSamples(filtered);
    if (samples.length === 0) {
      return `${range.label}${rangeText(range)}系统暂无过程质量检验记录，${askSample ? '样本数为 0' : '无法判断生产了哪些牌号'}。`;
    }
    const grouped = new Map<string, string[]>();
    samples.forEach((s) => {
      const list = grouped.get(s.shift) || [];
      if (!list.includes(s.brand)) list.push(s.brand);
      grouped.set(s.shift, list);
    });
    const uniqueBrands = [...new Set(samples.map((s) => s.brand))];
    if (askSample) {
      const lines = [
        `${range.label}${rangeText(range)}共 ${samples.length} 个样本。`,
        '口径：同一班次同一牌号只计 1 个样本（例如早班 7 条超细白记录仍算 1 个样本）。',
        '明细：',
      ];
      grouped.forEach((brands, shift) => {
        lines.push(`- ${shift}：${brands.join('、')}（${brands.length} 个样本）`);
      });
      return lines.join('\n');
    }
    const lines = [
      `${range.label}${rangeText(range)}生产牌号共 ${uniqueBrands.length} 个：${uniqueBrands.join('、')}。`,
      '分班明细：',
    ];
    grouped.forEach((brands, shift) => {
      lines.push(`- ${shift}：${brands.join('、')}`);
    });
    return lines.join('\n');
  }

  if (filtered.length === 0) {
    return `${range.label}${rangeText(range)}系统暂未录入质量检验记录，无法评估该时段质量状况。`;
  }

  const ratings = rateRecords(filtered);
  const total = ratings.length;
  const defectBatches = ratings.filter((r) => r.defectCount > 0).length;
  const defectRate = total ? (defectBatches / total) * 100 : 0;
  const excellent = ratings.filter((r) => r.rating === 'excellent').length;
  const first = ratings.filter((r) => r.rating === 'first').length;
  const second = ratings.filter((r) => r.rating === 'second').length;
  const unqualified = ratings.filter((r) => r.rating === 'unqualified').length;
  const pass = ratings.filter((r) => r.passStatus === 'pass').length;
  const machines = [...new Set(ratings.map((r) => r.machine).filter(Boolean))];
  const brands = [...new Set(ratings.map((r) => r.brand).filter(Boolean))];
  const top = topDefects(filtered, 3);
  const topText = top.length ? top.map((d) => `${d.name}(${d.count}次)`).join('、') : '暂无';
  const status = statusFromDefectRate(defectRate);

  const lines = [
    `${range.label}${rangeText(range)}系统共录入 ${total} 批过程质量检验记录，涉及机台 ${machines.join('、') || '无'}，牌号 ${brands.join('、') || '无'}。`,
    `缺陷批次 ${defectBatches} 批，缺陷率 ${defectRate.toFixed(2)}%，整体状态：${status}。`,
    `按 5.3.1 评级：${RATING_META.excellent.label} ${excellent} 批，${RATING_META.first.label} ${first} 批，${RATING_META.second.label} ${second} 批，${RATING_META.unqualified.label} ${unqualified} 批；合格率 ${((pass / total) * 100).toFixed(1)}%，优质率 ${((excellent / total) * 100).toFixed(1)}%。`,
    `主要缺陷：${topText}。`,
  ];

  if (/机台|哪台/.test(question)) {
    lines.push(...machineFocusLines(ratings));
  }

  return lines.join('\n');
}
