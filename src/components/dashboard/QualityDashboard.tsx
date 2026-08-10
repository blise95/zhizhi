/**
 * 智·质 - 质量驾驶舱（超级炫酷版）
 * 卷烟数智化质量管理与智能分析平台 - 核心总览入口
 *
 * 设计理念：
 * - 🚀 未来科技互联网风格
 * - ✨ 高端、炫酷、专业、精致
 * - 💫 丰富的动态视觉效果
 * - 🎯 数据驱动，稳定可靠（纯CSS实现）
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Factory,
  BarChart3,
  Target,
  Shield,
  Zap,
  Eye,
  Brain,
  Clock,
  Calendar,
  Package,
  Box,
  Layers,
  Sparkles,
  Radio,
  Gauge,
} from 'lucide-react';

// 导入类型和工具函数
import type {
  ProcessQualityRecord,
  DefectRecord,
} from '@/utils/analysisUtils';
import {
  loadProcessQualityData,
  getCurrentMonthRange,
} from '@/utils/analysisUtils';

import type {
  PhysicalTestRecord,
  IndicatorData,
} from '@/data/physicalTestTypes';
import {
  PHYSICAL_TEST_INDICATORS,
} from '@/data/physicalTestTypes';

// ==================== 常量定义 ====================

const MACHINES = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];

const APPEARANCE_TYPES = [
  { key: 'box', label: '箱装', icon: Box, color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400' },
  { key: 'carton', label: '条装', icon: Package, color: '#8b5cf6', gradient: 'from-purple-500 to-pink-400' },
  { key: 'pack', label: '盒装', icon: Layers, color: '#06b6d4', gradient: 'from-cyan-500 to-teal-400' },
  { key: 'cigarette', label: '烟支', icon: Zap, color: '#f59e0b', gradient: 'from-amber-500 to-orange-400' },
] as const;

const SPEC_LIMITS: Record<string, { USL: number; LSL: number; target: number }> = {
  weight: { USL: 920, LSL: 880, target: 900 },
  circumference: { USL: 24.35, LSL: 24.05, target: 24.20 },
  drawResistance: { USL: 1150, LSL: 850, target: 1000 },
  ventilationLength: { USL: 30, LSL: 20, target: 25 },
};

const INSPECTION_POINTS_PER_SAMPLE = 215;

// ==================== 接口定义 ====================

interface CoreKPI {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: string;
  icon: React.ReactNode;
  highlight?: boolean;
  glowColor?: string;
}

interface AppearanceQualityItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  qualityRate: number;
  defectCount: number;
  sampleCount: number;
}

interface MachineQualityItem {
  machine: string;
  defectCount: number;
  qualityRate: number;
  defectRate: number;
  sampleCount: number;
}

interface PhysicalTestStatus {
  indicatorId: string;
  name: string;
  unit: string;
  cpk: number | null;
  status: 'excellent' | 'good' | 'attention' | 'poor' | 'insufficient';
  statusLabel: string;
  mean: number;
  stdDev: number;
  sampleSize: number;
}

interface AlertItem {
  id: string;
  level: 'high' | 'warning' | 'normal';
  message: string;
  source: string;
}

interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

// ==================== 工具函数 ====================

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getWeekDay(date: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getDay()];
}

function calculateHealthIndex(
  qualityRate: number,
  defectRate: number,
  hasPoorCpk: boolean,
  hasHighAlerts: boolean
): number {
  let score = qualityRate;
  score -= Math.min(defectRate * 10, 10);
  if (hasPoorCpk) score -= 5;
  if (hasHighAlerts) score -= 3;
  return Math.max(0, Math.min(100, score));
}

// ==================== 动画数字组件 ====================

const AnimatedNumber: React.FC<{ value: number | string; decimals?: number }> = ({ value, decimals = 1 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      current = start + (end - start) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    let current = 0;
    animate();
  }, [numericValue]);

  return <span>{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()}</span>;
};

// ==================== 主组件 ====================

const QualityDashboard: React.FC = () => {
  // ==================== 状态管理 ====================

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [trendMetric, setTrendMetric] = useState<'qualityRate' | 'defectRate' | 'defectCount'>('qualityRate');
  const [machineMetric, setMachineMetric] = useState<'defectCount' | 'qualityRate' | 'defectRate'>('defectCount');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 实时更新时间
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 监听localStorage变化
  useEffect(() => {
    const handleStorage = () => setCurrentTime(new Date());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // 粒子背景动画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
    }> = [];

    // 创建粒子
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'][Math.floor(Math.random() * 4)],
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // 绘制光晕
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + '08';
        ctx.fill();
      });

      // 绘制连线
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `#3b82f6${Math.floor((1 - distance / 150) * 0.15 * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ==================== 数据加载 ====================

  const processData = useMemo((): ProcessQualityRecord[] => {
    try {
      return loadProcessQualityData();
    } catch (e) {
      console.error('加载过程质量数据失败:', e);
      return [];
    }
  }, [currentTime]);

  const physicalTestData = useMemo((): PhysicalTestRecord[] => {
    try {
      const data = localStorage.getItem('physicalTestRecords');
      if (!data) return [];
      return JSON.parse(data) as PhysicalTestRecord[];
    } catch (e) {
      console.error('加载物测数据失败:', e);
      return [];
    }
  }, [currentTime]);

  const monthRange = useMemo(() => getCurrentMonthRange(), []);

  // ==================== 数据计算：核心KPI ====================

  const coreKPIs = useMemo((): CoreKPI[] => {
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    const totalSamples = thisMonthData.length;
    let totalDefects = 0;
    let defectSampleCount = 0;

    thisMonthData.forEach(record => {
      ['boxDefects', 'cartonDefects', 'packDefects', 'cigaretteDefects'].forEach(key => {
        const defects = record[key as keyof ProcessQualityRecord] as DefectRecord[] | undefined;
        if (defects && defects.length > 0) {
          totalDefects += defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
          defectSampleCount++;
        }
      });
    });

    const qualityRate = totalSamples > 0
      ? parseFloat(((totalSamples - defectSampleCount) / totalSamples * 100).toFixed(1))
      : 0;

    const defectRate = totalSamples > 0
      ? parseFloat((totalDefects / (totalSamples * INSPECTION_POINTS_PER_SAMPLE) * 100).toFixed(3))
      : 0;

    const poorCpkCount = physicalTestData.filter(r =>
      r.date >= monthRange.from && r.date <= monthRange.to
    ).length > 0 ? 0 : 0;

    const healthIndex = calculateHealthIndex(qualityRate, defectRate, poorCpkCount > 0, false);

    return [
      {
        label: '质量健康指数',
        value: healthIndex.toFixed(1),
        unit: '',
        icon: <Shield className="w-7 h-7" />,
        highlight: true,
        trend: healthIndex >= 90 ? 'stable' : 'down',
        change: healthIndex >= 90 ? '优秀' : '需关注',
        glowColor: '#3b82f6',
      },
      {
        label: '本月抽检样本数',
        value: totalSamples,
        unit: '个',
        icon: <Target className="w-7 h-7" />,
        glowColor: '#10b981',
      },
      {
        label: '本月缺陷数量',
        value: totalDefects,
        unit: '项',
        icon: <AlertTriangle className="w-7 h-7" />,
        trend: totalDefects > 0 ? 'up' : undefined,
        change: totalDefects > 0 ? '需关注' : '',
        glowColor: '#ef4444',
      },
      {
        label: '综合优质率',
        value: `${qualityRate}`,
        unit: '%',
        icon: <CheckCircle2 className="w-7 h-7" />,
        trend: qualityRate >= 95 ? 'up' : qualityRate >= 90 ? 'stable' : 'down',
        change: qualityRate >= 95 ? '优秀' : qualityRate >= 90 ? '达标' : '待提升',
        glowColor: '#8b5cf6',
      },
      {
        label: '本月缺陷率',
        value: defectRate,
        unit: '%',
        icon: <Eye className="w-7 h-7" />,
        trend: defectRate < 0.1 ? 'stable' : defectRate < 0.2 ? 'down' : 'down',
        change: defectRate < 0.1 ? '正常' : '偏高',
        glowColor: '#f59e0b',
      },
    ];
  }, [processData, physicalTestData, monthRange]);

  // ==================== 数据计算：外观质量状态 ====================

  const appearanceQuality = useMemo((): AppearanceQualityItem[] => {
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    return APPEARANCE_TYPES.map(type => {
      let defectCount = 0;
      let sampleCount = 0;
      let defectSampleCount = 0;

      thisMonthData.forEach(record => {
        const defects = record[`${type.key}Defects` as keyof ProcessQualityRecord] as DefectRecord[] | undefined;
        if (defects && defects.length > 0) {
          sampleCount++;
          defectCount += defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
          defectSampleCount++;
        } else if (record[`${type.key}Defects` as keyof ProcessQualityRecord]) {
          sampleCount++;
        }
      });

      const qualityRate = sampleCount > 0
        ? parseFloat(((sampleCount - defectSampleCount) / sampleCount * 100).toFixed(1))
        : 0;

      return {
        key: type.key,
        label: type.label,
        icon: <type.icon className="w-6 h-6" />,
        color: type.color,
        gradient: type.gradient,
        qualityRate,
        defectCount,
        sampleCount,
      };
    });
  }, [processData, monthRange]);

  // ==================== 数据计算：机台质量对比 ====================

  const machineQuality = useMemo((): MachineQualityItem[] => {
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    return MACHINES.map(machine => {
      const machineData = thisMonthData.filter(r => r.machine === machine);

      let defectCount = 0;
      let defectSampleCount = 0;

      machineData.forEach(record => {
        ['boxDefects', 'cartonDefects', 'packDefects', 'cigaretteDefects'].forEach(key => {
          const defects = record[key as keyof ProcessQualityRecord] as DefectRecord[] | undefined;
          if (defects && defects.length > 0) {
            defectCount += defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
            defectSampleCount++;
          }
        });
      });

      const qualityRate = machineData.length > 0
        ? parseFloat(((machineData.length - defectSampleCount) / machineData.length * 100).toFixed(1))
        : 0;

      const defectRate = machineData.length > 0
        ? parseFloat((defectCount / (machineData.length * INSPECTION_POINTS_PER_SAMPLE) * 100).toFixed(3))
        : 0;

      return {
        machine,
        defectCount,
        qualityRate,
        defectRate,
        sampleCount: machineData.length,
      };
    }).sort((a, b) => b.defectCount - a.defectCount);
  }, [processData, monthRange]);

  // ==================== 数据计算：趋势数据 ====================

  const trendData = useMemo((): TrendDataPoint[] => {
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    const dateMap = new Map<string, { samples: number; defects: number; defectSamples: number }>();

    thisMonthData.forEach(record => {
      const date = record.inspectionDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, { samples: 0, defects: 0, defectSamples: 0 });
      }
      const stat = dateMap.get(date)!;
      stat.samples++;

      ['boxDefects', 'cartonDefects', 'packDefects', 'cigaretteDefects'].forEach(key => {
        const defects = record[key as keyof ProcessQualityRecord] as DefectRecord[] | undefined;
        if (defects && defects.length > 0) {
          stat.defects += defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
          stat.defectSamples++;
        }
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, stat]) => ({
        date,
        value: trendMetric === 'qualityRate'
          ? parseFloat(((stat.samples - stat.defectSamples) / stat.samples * 100).toFixed(1))
          : trendMetric === 'defectRate'
          ? parseFloat((stat.defects / (stat.samples * INSPECTION_POINTS_PER_SAMPLE) * 100).toFixed(3))
          : stat.defects,
        label: date.slice(5),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [processData, monthRange, trendMetric]);

  // ==================== 数据计算：物测状态 ====================

  const physicalTestStatus = useMemo((): PhysicalTestStatus[] => {
    const thisMonthData = physicalTestData.filter(r =>
      r.date >= monthRange.from && r.date <= monthRange.to
    );

    return PHYSICAL_TEST_INDICATORS.map(indicator => {
      const values: number[] = [];

      thisMonthData.forEach(record => {
        const data = record[indicator.id as keyof PhysicalTestRecord] as IndicatorData;
        if (data && data.x !== '' && data.x != null) {
          const x = parseFloat(String(data.x));
          if (!isNaN(x)) values.push(x);
        }
      });

      if (values.length < 2) {
        return {
          indicatorId: indicator.id,
          name: indicator.name,
          unit: indicator.unit,
          cpk: null,
          status: 'insufficient' as const,
          statusLabel: '样本不足',
          mean: 0,
          stdDev: 0,
          sampleSize: values.length,
        };
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const spec = SPEC_LIMITS[indicator.id];
      const cpu = spec ? (spec.USL - mean) / (3 * stdDev) : 0;
      const cpl = spec ? (mean - spec.LSL) / (3 * stdDev) : 0;
      const cpk = Math.min(cpu, cpl);

      let status: PhysicalTestStatus['status'];
      let statusLabel: string;
      if (cpk >= 1.67) { status = 'excellent'; statusLabel = '优秀'; }
      else if (cpk >= 1.33) { status = 'good'; statusLabel = '良好'; }
      else if (cpk >= 1.00) { status = 'attention'; statusLabel = '关注'; }
      else { status = 'poor'; statusLabel = '不足'; }

      return {
        indicatorId: indicator.id,
        name: indicator.name,
        unit: indicator.unit,
        cpk: parseFloat(cpk.toFixed(2)),
        status,
        statusLabel,
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(3)),
        sampleSize: values.length,
      };
    });
  }, [physicalTestData, monthRange]);

  // ==================== 数据计算：预警信息 ====================

  const alerts = useMemo((): AlertItem[] => {
    const alertList: AlertItem[] = [];
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    const machineDefects = new Map<string, number>();
    thisMonthData.forEach(record => {
      if (!machineDefects.has(record.machine)) {
        machineDefects.set(record.machine, 0);
      }
      ['boxDefects', 'cartonDefects', 'packDefects', 'cigaretteDefects'].forEach(key => {
        const defects = record[key as keyof ProcessQualityRecord] as DefectRecord[] | undefined;
        if (defects) {
          machineDefects.set(record.machine,
            machineDefects.get(record.machine)! + defects.reduce((s, d) => s + d.quantity, 0)
          );
        }
      });
    });

    const sortedMachines = Array.from(machineDefects.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedMachines.length > 0 && sortedMachines[0][1] > 10) {
      alertList.push({
        id: 'machine-high-defect',
        level: 'warning',
        message: `${sortedMachines[0][0]}机台缺陷数量偏高（${sortedMachines[0][1]}项）`,
        source: '外观质量',
      });
    }

    const lowCpkIndicators = physicalTestStatus.filter(p => p.cpk !== null && p.cpk < 1.33 && p.cpk >= 1.0);
    if (lowCpkIndicators.length > 0) {
      alertList.push({
        id: 'low-cpk',
        level: 'warning',
        message: `${lowCpkIndicators.map(i => i.name).join('、')}Cpk值需关注`,
        source: '烟支物测',
      });
    }

    const poorCpkIndicators = physicalTestStatus.filter(p => p.cpk !== null && p.cpk < 1.0);
    if (poorCpkIndicators.length > 0) {
      alertList.push({
        id: 'poor-cpk',
        level: 'high',
        message: `${poorCpkIndicators.map(i => i.name).join('、')}过程能力不足`,
        source: '烟支物测',
      });
    }

    if (alertList.length === 0 && thisMonthData.length > 0) {
      alertList.push({
        id: 'no-alert',
        level: 'normal',
        message: '当前无重大质量异常',
        source: '系统',
      });
    }

    return alertList;
  }, [processData, monthRange, physicalTestStatus]);

  // ==================== AI质量总结 ====================

  const aiSummary = useMemo((): string[] => {
    const summary: string[] = [];
    const thisMonthData = processData.filter(r =>
      r.inspectionDate >= monthRange.from && r.inspectionDate <= monthRange.to
    );

    if (thisMonthData.length === 0 && physicalTestData.length === 0) {
      return ['暂无数据，请先录入质量检测数据'];
    }

    const healthIdx = parseFloat(String(coreKPIs[0]?.value ?? 0));
    const qualityRate = parseFloat(String(coreKPIs[3]?.value ?? 0));
    if (healthIdx >= 90) {
      summary.push(`✨ 当前整体质量状况**优秀**，健康指数 **${healthIdx}**，综合优质率 **${qualityRate}%**。`);
    } else if (healthIdx >= 80) {
      summary.push(`📊 当前整体质量基本达标，健康指数 **${healthIdx}**，综合优质率 **${qualityRate}%**，部分指标需关注。`);
    } else {
      summary.push(`⚠️ 当前整体质量存在改进空间，健康指数 **${healthIdx}**，建议重点排查质量问题。`);
    }

    const maxDefectType = [...appearanceQuality].sort((a, b) => b.defectCount - a.defectCount)[0];
    if (maxDefectType && maxDefectType.defectCount > 0) {
      summary.push(`🔍 **${maxDefectType.label}**外观缺陷较为突出（**${maxDefectType.defectCount}项**），建议加强该环节质量控制。`);
    }

    const topDefectMachine = machineQuality[0];
    if (topDefectMachine && topDefectMachine.defectCount > 5) {
      summary.push(`🎯 **${topDefectMachine.machine}机台**缺陷数量最多（**${topDefectMachine.defectCount}项**），建议重点关注。`);
    }

    const poorCpkItems = physicalTestStatus.filter(p => p.status === 'poor' || p.status === 'attention');
    if (poorCpkItems.length > 0) {
      summary.push(`📈 ${poorCpkItems.map(i => i.name).join('、')}过程能力${poorCpkItems.some(p => p.status === 'poor') ? '**不足**' : '**偏低**'}，建议优化工艺参数。`);
    }

    const highAlerts = alerts.filter(a => a.level === 'high');
    const warningAlerts = alerts.filter(a => a.level === 'warning');
    if (highAlerts.length > 0) {
      summary.push(`🚨 发现 **${highAlerts.length}项高风险预警**，建议立即处理！`);
    } else if (warningAlerts.length > 0) {
      summary.push(`💡 存在 **${warningAlerts.length}项需关注**的质量指标，建议制定改进计划。`);
    } else if (thisMonthData.length > 0) {
      summary.push(`✅ 整体质量运行平稳，继续保持现有质量控制水平。`);
    }

    return summary.slice(0, 5);
  }, [processData, physicalTestData, coreKPIs, appearanceQuality, machineQuality, physicalTestStatus, alerts, monthRange]);

  // ==================== 渲染 ====================

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* 粒子背景 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.6 }}
      />

      {/* 渐变叠加层 */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/30 to-slate-950/95 z-[1] pointer-events-none"></div>

      {/* 网格背景 */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      ></div>

      {/* 内容层 */}
      <div className="relative z-10">
        {/* 顶部品牌区 */}
        <header className="border-b border-blue-500/20 backdrop-blur-xl bg-slate-900/40 sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              {/* 左侧：系统名称 */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1
                    className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 tracking-tight"
                    style={{ fontSize: '43px', lineHeight: 1.2 }}
                  >
                    智·质
                  </h1>
                  <div className="flex justify-center mt-2 ml-8">
                    <div className="relative inline-block">
                      <p
                        style={{
                          fontSize: '40px',
                          fontWeight: 500,
                          letterSpacing: '3px',
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ color: '#a5f3fc', fontWeight: 600 }}>数智驱动</span>
                        <span style={{ color: '#a5f3fc', fontWeight: 600, marginLeft: '0.3em' }}>，让质造更智能</span>
                      </p>
                      {/* 扫光效果层 */}
                      <div
                        className="absolute inset-0 pointer-events-none overflow-hidden rounded"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 15%, rgba(220,240,255,0.45) 50%, rgba(255,255,255,0) 85%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'sweepLight 2.5s ease-in-out infinite',
                          mixBlendMode: 'screen',
                        }}
                      />
                      {/* 低强度科技光晕 */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded"
                        style={{
                          boxShadow: '0 0 15px rgba(34, 211, 238, 0.12), 0 0 30px rgba(96, 165, 250, 0.08)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：实时系统状态仪表 */}
              <div className="flex items-center gap-6">
                <div className="relative px-6 py-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
                  {/* 微弱光晕背景 */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-cyan-500/5 pointer-events-none"></div>

                  <div className="relative text-right">
                    {/* 日期行 */}
                    <div className="text-base font-medium text-slate-400 tracking-widest mb-1">
                      {formatDate(currentTime)}&nbsp;{getWeekDay(currentTime)}
                    </div>

                    {/* 科技分隔线 */}
                    <div className="flex justify-center mb-2">
                      <div className="w-8 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"></div>
                    </div>

                    {/* 时间 - 视觉核心 */}
                    <div
                      className="font-mono tracking-wider"
                      style={{
                        fontSize: '40px',
                        fontWeight: 600,
                        color: '#a5f3fc',
                        lineHeight: 1,
                        textShadow: '0 0 20px rgba(165, 243, 252, 0.3), 0 0 40px rgba(96, 165, 250, 0.15)',
                      }}
                    >
                      {formatTime(currentTime)}
                    </div>
                  </div>

                  {/* 底部扫描线动画 */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-60"
                    style={{ animation: 'scanLine 3s ease-in-out infinite' }}
                  ></div>
                </div>

                {/* 系统状态指示器 */}
                <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></div>
                  <span className="text-xs font-semibold text-emerald-400 tracking-wider">ONLINE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 底部发光线 */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
        </header>

        {/* 主内容区 */}
        <main className="max-w-[1800px] mx-auto px-8 py-10 space-y-10">

          {/* ========== 第一层：质量核心指标 ========== */}
          <section>
            <div className="grid grid-cols-5 gap-6">
              {coreKPIs.map((kpi, index) => (
                <div
                  key={index}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer ${
                    kpi.highlight
                      ? 'bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-600/20 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02]'
                      : 'bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/50 hover:bg-slate-800/60 hover:scale-[1.02] backdrop-blur-sm'
                  }`}
                  onMouseEnter={() => setHoveredCard(`kpi-${index}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* 动态光效背景 */}
                  {kpi.highlight && (
                    <>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl group-hover:bg-blue-500/40 transition-all duration-500"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all duration-500"></div>
                    </>
                  )}

                  {/* 扫描线动画 */}
                  {hoveredCard === `kpi-${index}` && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent animate-scan"></div>
                  )}

                  <div className="relative p-7">
                    {/* 标题和图标 */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        kpi.highlight
                          ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 shadow-lg shadow-blue-500/30'
                          : 'bg-slate-700/50 group-hover:bg-slate-700/70'
                      }`}>
                        <span className={`transition-all duration-300 ${
                          kpi.highlight ? 'text-blue-300 drop-shadow-lg' : 'text-slate-400 group-hover:text-slate-200'
                        }`} style={{ filter: kpi.highlight ? `drop-shadow(0 0 10px ${kpi.glowColor})` : 'none' }}>
                          {kpi.icon}
                        </span>
                      </div>

                      {/* 趋势指示 */}
                      {kpi.trend && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm transition-all ${
                          kpi.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          kpi.trend === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}>
                          {kpi.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                          {kpi.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                          {kpi.trend === 'stable' && <Minus className="w-4 h-4" />}
                          <span>{kpi.change}</span>
                        </div>
                      )}
                    </div>

                    {/* 数值 */}
                    <div className="mb-3">
                      <span className={`font-black tracking-tight tabular-nums ${
                        kpi.highlight ? 'text-5xl' : 'text-4xl'
                      } text-transparent bg-clip-text bg-gradient-to-br ${
                        kpi.highlight ? 'from-white via-blue-100 to-cyan-100' : 'from-white to-slate-200'
                      }`}>
                        <AnimatedNumber value={kpi.value} decimals={typeof kpi.value === 'string' && kpi.value.includes('.') ? 1 : 0} />
                      </span>
                      {kpi.unit && (
                        <span className="ml-2 text-lg font-semibold text-slate-400">{kpi.unit}</span>
                      )}
                    </div>

                    {/* 标签 */}
                    <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-current opacity-50"></div>
                      {kpi.label}
                    </div>
                  </div>

                  {/* 底部发光线 */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          </section>

          {/* ========== 第二层：质量趋势 + 预警 ========== */}
          <section className="grid grid-cols-12 gap-6">
            {/* 左侧：质量趋势图 */}
            <div className="col-span-8">
              <div className="relative bg-slate-800/30 rounded-2xl border border-slate-700/40 backdrop-blur-sm overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
                {/* 卡片头部光效 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

                <div className="p-7">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-xl blur-lg"></div>
                        <div className="relative p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30">
                          <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">质量趋势</h2>
                        <p className="text-xs text-slate-500 mt-0.5">本月数据走势</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-xl p-1.5 border border-slate-700/40">
                      {[
                        { key: 'qualityRate' as const, label: '优质率' },
                        { key: 'defectRate' as const, label: '缺陷率' },
                        { key: 'defectCount' as const, label: '缺陷数量' },
                      ].map(metric => (
                        <button
                          key={metric.key}
                          onClick={() => setTrendMetric(metric.key)}
                          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                            trendMetric === metric.key
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 图表区域 */}
                  <div style={{ height: '340px' }} className="relative">
                    {trendData.length > 0 ? (
                      <div className="h-full flex items-end gap-3 px-4 pb-10 pt-6 relative">
                        {/* Y轴参考线 */}
                        <div className="absolute inset-0 px-4 pb-10 pt-6 pointer-events-none">
                          {[0, 25, 50, 75, 100].map(percent => (
                            <div
                              key={percent}
                              className="absolute left-0 right-0 border-t border-slate-700/30"
                              style={{ bottom: `${percent}%` }}
                            >
                              <span className="absolute -left-1 -top-2 text-xs text-slate-600">{percent}</span>
                            </div>
                          ))}
                        </div>

                        {trendData.map((point, idx) => {
                          const maxValue = Math.max(...trendData.map(d => d.value), 1);
                          const heightPercent = (point.value / maxValue) * 100;
                          const isLast = idx === trendData.length - 1;

                          return (
                            <div
                              key={idx}
                              className="flex-1 flex flex-col items-center group/bar"
                            >
                              <div className="relative w-full flex items-end justify-center mb-3" style={{ height: '280px' }}>
                                {/* 数值标签 */}
                                {(isLast || hoveredCard === `trend-${idx}`) && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-blue-500/90 text-white text-xs font-bold rounded-lg whitespace-nowrap backdrop-blur-sm z-10">
                                    {point.value.toFixed(trendMetric === 'defectRate' ? 3 : 1)}
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-500/90"></div>
                                  </div>
                                )}

                                {/* 柱状图 */}
                                <div
                                  className="w-full max-w-[45px] relative group-hover/bar:max-w-[50px] transition-all duration-300"
                                  onMouseEnter={() => setHoveredCard(`trend-${idx}`)}
                                  onMouseLeave={() => setHoveredCard(null)}
                                >
                                  {/* 渐变柱体 */}
                                  <div
                                    className="w-full rounded-t-lg relative overflow-hidden transition-all duration-500"
                                    style={{ height: `${Math.max(heightPercent, 3)}%` }}
                                  >
                                    <div className={`absolute inset-0 bg-gradient-to-t ${
                                      isLast
                                        ? 'from-blue-600 via-blue-500 to-cyan-400'
                                        : 'from-blue-500/80 via-blue-400/80 to-cyan-300/80'
                                    }`}></div>

                                    {/* 顶部高光 */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-lg"></div>

                                    {/* 光效 */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                  </div>

                                  {/* 发光效果 */}
                                  {isLast && (
                                    <div className="absolute inset-0 bg-blue-400/30 blur-xl -z-10 animate-pulse"></div>
                                  )}
                                </div>
                              </div>

                              {/* X轴标签 */}
                              <span className={`text-xs font-medium transition-colors ${
                                isLast ? 'text-blue-400' : 'text-slate-500 group-hover/bar:text-slate-400'
                              }`}>
                                {point.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                          <BarChart3 className="w-24 h-24 relative opacity-30" />
                        </div>
                        <p className="text-lg font-medium">暂无趋势数据</p>
                        <p className="text-sm mt-2 text-slate-600">请先录入质量检测数据</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：质量预警 */}
            <div className="col-span-4">
              <div className="relative bg-slate-800/30 rounded-2xl border border-slate-700/40 backdrop-blur-sm overflow-hidden h-full hover:border-amber-500/30 transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

                <div className="p-7">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/30 rounded-xl blur-lg"></div>
                      <div className="relative p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                        <Radio className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">质量预警</h2>
                      <p className="text-xs text-slate-500 mt-0.5">智能异常监测</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {alerts.length > 0 ? (
                      alerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                            alert.level === 'high'
                              ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/15'
                              : alert.level === 'warning'
                              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/15'
                              : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/15'
                          }`}
                        >
                          {/* 左侧色条 */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            alert.level === 'high' ? 'bg-red-500' :
                            alert.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></div>

                          <div className="flex items-start gap-4 p-5 pl-6">
                            <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${
                              alert.level === 'high' ? 'bg-red-500/20' :
                              alert.level === 'warning' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                            }`}>
                              {alert.level === 'high' ? <AlertTriangle className="w-5 h-5 text-red-400" /> :
                               alert.level === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-400" /> :
                               <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200 leading-relaxed font-medium">{alert.message}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-xs px-3 py-1 rounded-lg bg-slate-800/60 text-slate-400 font-medium border border-slate-700/30">
                                  {alert.source}
                                </span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                                  alert.level === 'high' ? 'bg-red-500/20 text-red-400' :
                                  alert.level === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {alert.level === 'high' ? '🔴 高风险' : alert.level === 'warning' ? '🟡 关注' : '🟢 正常'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-slate-500">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">暂无预警信息</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========== 第三层：外观质量状态 + 机台对比 ========== */}
          <section className="grid grid-cols-12 gap-6">
            {/* 左侧：四类外观质量状态 */}
            <div className="col-span-7">
              <div className="relative bg-slate-800/30 rounded-2xl border border-slate-700/40 backdrop-blur-sm overflow-hidden hover:border-cyan-500/30 transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <div className="p-7">
                  <div className="flex items-center gap-4 mb-7">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500/30 rounded-xl blur-lg"></div>
                      <div className="relative p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                        <Eye className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">外观质量状态</h2>
                      <p className="text-xs text-slate-500 mt-0.5">四类独立统计</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {appearanceQuality.map(item => (
                      <div key={item.key} className="group/item">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div
                              className="p-3 rounded-xl transition-all duration-300 group-hover/item:scale-110"
                              style={{
                                background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                                border: `1px solid ${item.color}40`,
                                boxShadow: `0 0 20px ${item.color}20`
                              }}
                            >
                              <span style={{ color: item.color }}>{item.icon}</span>
                            </div>
                            <div>
                              <span className="text-white font-bold text-lg">{item.label}</span>
                              <span className="text-xs text-slate-500 ml-3 font-medium">{item.sampleCount} 个样本</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200">
                                {item.qualityRate}
                              </span>
                              <span className="text-base text-slate-400 ml-1.5 font-semibold">%</span>
                            </div>
                            <div className="text-right min-w-[90px]">
                              <span className="text-base font-bold text-slate-300">{item.defectCount}</span>
                              <span className="text-xs text-slate-500 ml-1.5">项缺陷</span>
                            </div>
                          </div>
                        </div>

                        {/* 进度条 */}
                        <div className="h-3 bg-slate-700/30 rounded-full overflow-hidden backdrop-blur-sm border border-slate-700/20">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{
                              width: `${item.qualityRate}%`,
                              background: `linear-gradient(to right, ${item.color}, ${item.color}cc)`
                            }}
                          >
                            {/* 流光效果 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            {/* 顶部高光 */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30"></div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {appearanceQuality.every(q => q.sampleCount === 0) && (
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg font-medium">暂无外观质量数据</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：机台质量对比 */}
            <div className="col-span-5">
              <div className="relative bg-slate-800/30 rounded-2xl border border-slate-700/40 backdrop-blur-sm overflow-hidden hover:border-orange-500/30 transition-all duration-500">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>

                <div className="p-7">
                  <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/30 rounded-xl blur-lg"></div>
                        <div className="relative p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
                          <Factory className="w-6 h-6 text-orange-400" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">机台质量对比</h2>
                        <p className="text-xs text-slate-500 mt-0.5">实时排名</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900/60 rounded-lg p-1 border border-slate-700/40">
                      {[
                        { key: 'defectCount' as const, label: '缺陷数' },
                        { key: 'qualityRate' as const, label: '优质率' },
                        { key: 'defectRate' as const, label: '缺陷率' },
                      ].map(metric => (
                        <button
                          key={metric.key}
                          onClick={() => setMachineMetric(metric.key)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                            machineMetric === metric.key
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 机台排名列表 */}
                  <div className="space-y-3">
                    {machineQuality.map((machine, index) => {
                      const maxValue = Math.max(...machineQuality.map(m =>
                        machineMetric === 'defectCount' ? m.defectCount :
                        machineMetric === 'qualityRate' ? m.qualityRate : m.defectRate
                      ), 1);

                      const currentValue = machineMetric === 'defectCount' ? machine.defectCount :
                        machineMetric === 'qualityRate' ? machine.qualityRate : machine.defectRate;

                      const percentage = (currentValue / maxValue) * 100;

                      const rankColors = [
                        'from-amber-400 to-yellow-300 text-amber-900',
                        'from-slate-300 to-slate-200 text-slate-700',
                        'from-orange-400 to-orange-300 text-orange-900',
                      ];

                      return (
                        <div
                          key={machine.machine}
                          className="group/machine flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/20 hover:border-slate-600/40 transition-all duration-300 hover:scale-[1.02]"
                        >
                          {/* 排名 */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                            index < 3
                              ? `bg-gradient-to-br ${rankColors[index]} shadow-lg`
                              : 'bg-slate-700/50 text-slate-500'
                          }`}>
                            {index + 1}
                          </div>

                          {/* 机台名称 */}
                          <div className="w-18 text-white font-bold text-lg">{machine.machine}</div>

                          {/* 数值 */}
                          <div className="text-sm font-bold text-slate-200 min-w-[90px]">
                            {machineMetric === 'defectCount' ? `${currentValue} 项` :
                             machineMetric === 'qualityRate' ? `${currentValue}%` :
                             `${currentValue.toFixed(3)}%`}
                          </div>

                          {/* 进度条 */}
                          <div className="flex-1 h-2.5 bg-slate-700/30 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${
                                index === 0 ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400' :
                                index === 1 ? 'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200' :
                                index === 2 ? 'bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400' :
                                'bg-gradient-to-r from-slate-600 to-slate-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              {/* 流光效果 */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {machineQuality.every(m => m.sampleCount === 0) && (
                      <div className="text-center py-12 text-slate-500">
                        <p className="text-lg font-medium">暂无机台数据</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========== 第四层：烟支物测质量状态 ========== */}
          <section>
            <div className="relative bg-slate-800/30 rounded-2xl border border-slate-700/40 backdrop-blur-sm overflow-hidden hover:border-green-500/30 transition-all duration-500">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>

              <div className="p-7">
                <div className="flex items-center gap-4 mb-7">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/30 rounded-xl blur-lg"></div>
                    <div className="relative p-2.5 rounded-xl bg-green-500/20 border border-green-500/30">
                      <Gauge className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">烟支物测质量状态</h2>
                    <p className="text-xs text-slate-500 mt-0.5">六西格玛过程能力</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-5">
                  {physicalTestStatus.map(item => (
                    <div
                      key={item.indicatorId}
                      className="group/cpk relative overflow-hidden rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-500 hover:scale-[1.03]"
                    >
                      {/* 背景光效 */}
                      <div className={`absolute inset-0 opacity-0 group-hover/cpk:opacity-100 transition-opacity duration-500 ${
                        item.status === 'excellent' ? 'bg-emerald-500/5' :
                        item.status === 'good' ? 'bg-blue-500/5' :
                        item.status === 'attention' ? 'bg-amber-500/5' :
                        item.status === 'poor' ? 'bg-red-500/5' : ''
                      }`}></div>

                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-5">
                          <div>
                            <h3 className="text-white font-bold text-lg">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{item.unit}</p>
                          </div>

                          {/* 状态标识 */}
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm transition-all duration-300 ${
                            item.status === 'excellent' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/20' :
                            item.status === 'good' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20' :
                            item.status === 'attention' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/20' :
                            item.status === 'poor' ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/20' :
                            'bg-slate-700/50 text-slate-500 border-slate-600/30'
                          }`}>
                            {item.statusText}
                          </div>
                        </div>

                        {/* Cpk值 */}
                        <div className="mb-4">
                          {item.cpk !== null ? (
                            <div className="flex items-baseline gap-2">
                              <span className={`text-4xl font-black tabular-nums ${
                                item.status === 'excellent' ? 'text-emerald-400' :
                                item.status === 'good' ? 'text-blue-400' :
                                item.status === 'attention' ? 'text-amber-400' :
                                item.status === 'poor' ? 'text-red-400' : 'text-slate-500'
                              }`}>
                                {item.cpk}
                              </span>
                              <span className="text-base font-bold text-slate-500">Cpk</span>
                            </div>
                          ) : (
                            <span className="text-2xl text-slate-600 font-bold">-</span>
                          )}
                        </div>

                        {/* 补充信息 */}
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div className="px-3 py-2 rounded-lg bg-slate-700/30 border border-slate-700/20">
                            <span className="text-slate-500 block mb-0.5">均值</span>
                            <span className="text-slate-200 font-bold">{item.mean}</span>
                          </div>
                          <div className="px-3 py-2 rounded-lg bg-slate-700/30 border border-slate-700/20">
                            <span className="text-slate-500 block mb-0.5">σ</span>
                            <span className="text-slate-200 font-bold">{item.stdDev}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 font-medium px-3 py-1.5 rounded bg-slate-700/20 inline-block">
                          样本 N={item.sampleSize}
                        </div>
                      </div>

                      {/* 底部发光线 */}
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover/cpk:opacity-100 transition-opacity duration-500 ${
                        item.status === 'excellent' ? 'bg-emerald-500' :
                        item.status === 'good' ? 'bg-blue-500' :
                        item.status === 'attention' ? 'bg-amber-500' :
                        item.status === 'poor' ? 'bg-red-500' : 'bg-slate-600'
                      }`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ========== 第五层：AI质量总结 ========== */}
          <section>
            <div className="relative bg-gradient-to-br from-violet-950/40 via-purple-950/20 to-slate-900/40 rounded-2xl border border-violet-500/20 backdrop-blur-sm overflow-hidden hover:border-violet-500/40 transition-all duration-500">
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>

              {/* 网格图案 */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 1px 1px, white 1px, transparent 0)
                  `,
                  backgroundSize: '20px 20px',
                }}
              ></div>

              <div className="relative p-7">
                <div className="flex items-center gap-4 mb-7">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-500/40 rounded-2xl blur-xl animate-pulse"></div>
                    <div className="relative p-3 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 border border-violet-500/40">
                      <Brain className="w-7 h-7 text-violet-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                      AI 质量总结
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">基于当前数据的智能分析与建议</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {aiSummary.map((summary, index) => (
                    <div
                      key={index}
                      className="group/ai flex items-start gap-5 p-5 rounded-xl bg-slate-800/40 border border-slate-700/20 hover:bg-slate-800/60 hover:border-violet-500/30 transition-all duration-300 hover:translate-x-1"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover/ai:scale-110 transition-transform duration-300">
                          <span className="text-sm font-black text-white">{index + 1}</span>
                        </div>
                      </div>
                      <p className="flex-1 text-sm text-slate-300 leading-relaxed font-medium pt-1" dangerouslySetInnerHTML={{
                        __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                      }}></p>
                    </div>
                  ))}

                  {aiSummary.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                      <Brain className="w-20 h-20 mx-auto mb-5 opacity-20" />
                      <p className="text-lg font-medium">暂无数据可供分析</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 底部信息 */}
          <footer className="py-8 border-t border-slate-800/50 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
            <p className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              智·质 —— 卷烟数智化质量管理与智能分析平台
            </p>
            <p className="text-xs text-slate-600 mt-2 font-medium">
              数据自动同步自各业务模块 · 最后更新时间 {formatDate(currentTime)} {formatTime(currentTime)}
            </p>
          </footer>

        </main>
      </div>

      {/* 自定义CSS动画 */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes textShimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow {
          0% {
            filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.4)) drop-shadow(0 0 10px rgba(96, 165, 250, 0.3));
          }
          100% {
            filter: drop-shadow(0 0 15px rgba(34, 211, 238, 0.8)) drop-shadow(0 0 30px rgba(167, 139, 250, 0.6)) drop-shadow(0 0 45px rgba(96, 165, 250, 0.4));
          }
        }
        @keyframes sweepLight {
          0%, 20% { background-position: -100% 0; opacity: 0; }
          40% { opacity: 1; }
          60% { background-position: 100% 0; opacity: 1; }
          80%, 100% { background-position: 150% 0; opacity: 0; }
        }
        @keyframes scanLine {
          0%, 100% { opacity: 0.3; transform: scaleX(0.5); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export { QualityDashboard };
export default QualityDashboard;
