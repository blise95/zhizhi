import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Sparkles, Activity, Server, AlertCircle, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchProcessQualityRecords, listTypedRecords, RECORD_TYPE } from '@/services/qualityData';
import { answerLocalQualityQuestion } from '@/lib/zhiheLocalAnswer';
import type { ProcessQualityRecord } from '@/utils/analysisUtils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    doc_name: string;
    page_number?: number;
    section_title?: string;
  }>;
  reasoning?: string;
  error?: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_ZHIHE_API_URL ||
  (import.meta.env.PROD ? '/zhihe' : 'http://localhost:8000');

const W_WIDTH = 360;
const W_HEIGHT = 520;
const ICON_SIZE = 64;

const SUGGESTIONS = [
  { label: '今日质量怎么样？', icon: Activity },
  { label: '过去七天质量怎么样？', icon: TrendingUp },
  { label: '最近有哪些质量异常？', icon: AlertCircle },
  { label: '哪个机台需要重点关注？', icon: Server },
  { label: '帮我分析近期质量趋势', icon: TrendingUp },
  { label: '当前主要缺陷是什么？', icon: Activity },
  { label: '缺支属于什么等级？', icon: AlertCircle },
  { label: '小盒透明纸皱怎么判定？', icon: Activity },
];

/**
 * 智合 AI 数字核心头像
 *
 * 视觉定位：AI 智能化 + 数字中枢 + 工业科技
 * 不再使用卡通机器人头部，而是抽象为“拥有智能核心的 AI 数字生命体”。
 */
function ZhiHeCoreAvatar({ size = 'md', className }: { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClass = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32 sm:w-36 sm:h-36',
    xl: 'w-40 h-40 sm:w-48 sm:h-48',
  }[size];

  const ringScale = {
    xs: { outer: 1.7, middle: 1.4, inner: 1.15 },
    sm: { outer: 1.65, middle: 1.35, inner: 1.12 },
    md: { outer: 1.6, middle: 1.32, inner: 1.1 },
    lg: { outer: 1.55, middle: 1.28, inner: 1.08 },
    xl: { outer: 1.5, middle: 1.25, inner: 1.06 },
  }[size];

  return (
    <div className={cn('relative inline-flex items-center justify-center ai-core-avatar', sizeClass, className)}>
      {/* 外层能量晕 */}
      <div
        className="absolute rounded-full bg-brand-blue/5 animate-core-breathe"
        style={{ inset: `${(1 - ringScale.outer) * 50 - 12}%` }}
      />

      {/* 外层数据轨道环 */}
      <div
        className="absolute rounded-full border border-dashed border-cyan-500/25 animate-core-rotate ai-core-ring"
        style={{ inset: `${(1 - ringScale.outer) * 50}%` }}
      />

      {/* 中层能量轨道环 */}
      <div
        className="absolute rounded-full border border-dotted border-brand-blue/30 animate-core-rotate-reverse ai-core-ring"
        style={{ inset: `${(1 - ringScale.middle) * 50}%` }}
      />

      {/* 内层脉冲环 */}
      <div
        className="absolute rounded-full border border-cyan-400/20 animate-ring-pulse"
        style={{ inset: `${(1 - ringScale.inner) * 50}%` }}
      />

      {/* 核心光晕底 */}
      <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--brand-blue)/0.35)_0%,transparent_55%)]" />
      <div className="absolute inset-[15%] rounded-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-[0_0_28px_hsl(var(--brand-blue)/0.5)]" />

      {/* AI 数字核心 SVG */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10 w-[72%] h-[72%]"
      >
        <defs>
          <linearGradient id="coreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="coreInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <filter id="coreBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 外框 - 科技六边形核心壳 */}
        <path
          d="M50 12 L82 30 L82 70 L50 88 L18 70 L18 30 Z"
          fill="none"
          stroke="url(#coreGradient)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          opacity="0.7"
        />

        {/* 内部能量核心 - 圆角六边形 */}
        <path
          d="M50 22 L72 35 L72 65 L50 78 L28 65 L28 35 Z"
          fill="url(#coreInner)"
          stroke="url(#coreGradient)"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* 中央发光核心 */}
        <circle cx="50" cy="50" r="14" fill="url(#coreGlow)" filter="url(#coreBlur)" className="animate-core-breathe" />
        <circle cx="50" cy="50" r="7" fill="#22d3ee" filter="url(#coreBlur)" className="animate-core-breathe" />

        {/* 核心数据网格 */}
        <path d="M36 50 H64" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
        <path d="M50 36 V64" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
        <path d="M40 40 L60 60" stroke="#22d3ee" strokeWidth="0.4" strokeOpacity="0.25" />
        <path d="M60 40 L40 60" stroke="#22d3ee" strokeWidth="0.4" strokeOpacity="0.25" />

        {/* 数据粒子 */}
        <circle cx="50" cy="24" r="1.5" fill="#22d3ee" opacity="0.8">
          <animate attributeName="cy" values="24;76;24" dur="3.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="24" cy="50" r="1.2" fill="#60a5fa" opacity="0.7">
          <animate attributeName="cx" values="24;76;24" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.15;0.7" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="76" r="1.3" fill="#22d3ee" opacity="0.6">
          <animate attributeName="cy" values="76;24;76" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* 环绕数据点 */}
        <circle cx="50" cy="8" r="1.8" fill="#22d3ee" filter="url(#coreBlur)">
          <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="8s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="92" r="1.5" fill="#60a5fa" filter="url(#coreBlur)">
          <animateTransform attributeName="transform" type="rotate" from="180 50 50" to="540 50 50" dur="10s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* 扫描线 */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        <div className="tech-scanline opacity-60" />
      </div>
    </div>
  );
}

/**
 * AI 分析中状态块
 */
function ThinkingBlock() {
  return (
    <div className="flex items-start gap-2.5">
      <ZhiHeCoreAvatar size="xs" />
      <div className="flex-1 max-w-[80%]">
        <div className="relative overflow-hidden rounded-xl border border-brand-blue/25 bg-slate-900/60 backdrop-blur-md p-3 shadow-[0_0_20px_hsl(var(--brand-blue)/0.12)]">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs font-medium text-cyan-300">智合正在分析质量数据…</span>
          </div>

          {/* 数据流进度条 */}
          <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden mb-2">
            <div className="h-full w-1/3 bg-gradient-to-r from-brand-blue via-cyan-400 to-brand-blue animate-data-flow rounded-full" />
          </div>

          {/* 数据粒子 */}
          <div className="flex items-center gap-1.5 h-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-cyan-400/60 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <div className="tech-scanline opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ZhiZhiFloatingChat() {
  // 登录后自动出现并展开
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // 默认位置：页面右侧中部
  const [position, setPosition] = useState(() => {
    const x = Math.max(16, window.innerWidth - W_WIDTH - 24);
    const y = Math.max(16, (window.innerHeight - W_HEIGHT) / 2);
    return { x, y };
  });

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragTargetRef = useRef<'panel' | 'icon' | null>(null);
  const iconMovedRef = useRef(false);
  const iconClickStart = useRef({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 恢复上次位置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zhihe_chat_position');
      if (saved) {
        const pos = JSON.parse(saved);
        if (typeof pos.x === 'number' && typeof pos.y === 'number') setPosition(pos);
      }
    } catch {
      // ignore
    }
  }, []);

  // 保存位置
  useEffect(() => {
    try {
      localStorage.setItem('zhihe_chat_position', JSON.stringify(position));
    } catch {
      // ignore
    }
  }, [position]);

  // 展开后聚焦输入框
  useEffect(() => {
    if (isOpen && isExpanded) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isExpanded]);

  // 自动滚动到底部
  useEffect(() => {
    if (isOpen && isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen, isExpanded]);

  // 点击外部自动收起
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isExpanded || !isOpen) return;
      const target = e.target as Node;
      const insidePanel = panelRef.current ? panelRef.current.contains(target) : false;
      const insideIcon = iconRef.current ? iconRef.current.contains(target) : false;
      if (!insidePanel && !insideIcon) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, isOpen]);

  // 拖拽逻辑
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, target: 'panel' | 'icon') => {
      const ref = target === 'panel' ? panelRef : iconRef;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      dragTargetRef.current = target;
      iconMovedRef.current = false;
      iconClickStart.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
      e.preventDefault();
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !dragTargetRef.current) return;
      if (dragTargetRef.current === 'icon') {
        const dx = e.clientX - iconClickStart.current.x;
        const dy = e.clientY - iconClickStart.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) iconMovedRef.current = true;
      }
      setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => {
      setDragging(false);
      dragTargetRef.current = null;
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  // 限制在可视区域内
  const clampPosition = (w: number, h: number) => {
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    return {
      x: Math.max(0, Math.min(position.x, maxX)),
      y: Math.max(0, Math.min(position.y, maxY)),
    };
  };

  const panelPos = clampPosition(W_WIDTH, W_HEIGHT);
  const iconPos = clampPosition(ICON_SIZE, ICON_SIZE);

  const handleSend = useCallback(
    async (text?: string) => {
      const question = (text ?? input).trim();
      if (!question || loading) return;

      setInput('');
      const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: question };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        let processRecords: ProcessQualityRecord[] = [];
        let physicalRecords: unknown[] = [];
        try {
          const [processRows, physicalRows] = await Promise.all([
            fetchProcessQualityRecords(),
            listTypedRecords(RECORD_TYPE.PHYSICAL),
          ]);
          processRecords = processRows;
          physicalRecords = physicalRows;
        } catch {
          // 读取失败不影响提问
        }

        const history = messages
          .filter((m) => !m.error)
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }));
        const previousUserQuestions = messages
          .filter((m) => m.role === 'user')
          .map((m) => m.content);

        try {
          const res = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question,
              history,
              context: {
                process_records: processRecords,
                physical_records: physicalRecords,
              },
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: '请求失败' }));
            throw new Error(err.detail || `HTTP ${res.status}`);
          }
          const data = await res.json();
          const assistantMessage: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: data.answer || '暂无回答',
            sources: [],
            reasoning: '',
          };
          setMessages((prev) => [...prev, assistantMessage]);
          return;
        } catch (apiErr: unknown) {
          const local = answerLocalQualityQuestion(question, processRecords, previousUserQuestions);
          if (local) {
            setMessages((prev) => [
              ...prev,
              {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: local,
              },
            ]);
            return;
          }
          throw apiErr;
        }
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: `智合暂不可用（${err instanceof Error ? err.message : '未知错误'}）。主站功能不受影响。`,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasConversation = messages.some((m) => m.role === 'user');

  if (!isOpen) return null;

  return (
    <>
      {/* 收起状态：AI 数字核心悬浮头像 */}
      {!isExpanded && (
        <button
          ref={iconRef}
          onMouseDown={(e) => handleMouseDown(e, 'icon')}
          onClick={() => {
            if (!iconMovedRef.current) setIsExpanded(true);
          }}
          className={cn(
            'fixed z-[100] rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105',
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          style={{
            left: iconPos.x,
            top: iconPos.y,
            width: ICON_SIZE,
            height: ICON_SIZE,
          }}
          title="智合 · 聚智协同，质领合作"
        >
          <div className="absolute inset-0 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-sm shadow-[0_0_30px_hsl(var(--brand-blue)/0.45),inset_0_0_20px_hsl(var(--brand-blue)/0.15)]" />
          <ZhiHeCoreAvatar size="md" />
          {/* 在线指示灯 */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-slate-950" />
          </span>
        </button>
      )}

      {/* 展开状态：AI 智能终端悬浮窗口 */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="fixed z-[100] w-[min(360px,92vw)] h-[min(520px,80vh)] rounded-2xl flex flex-col overflow-hidden"
          style={{
            left: panelPos.x,
            top: panelPos.y,
            background: 'linear-gradient(165deg, hsl(222 47% 13% / 0.72), hsl(224 50% 8% / 0.78))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow:
              '0 0 0 1px hsl(var(--brand-blue) / 0.22), 0 0 100px -30px hsl(var(--brand-blue) / 0.35), inset 0 0 80px -40px hsl(var(--brand-blue) / 0.12)',
          }}
        >
          {/* 边缘流光 */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none animate-edge-flow opacity-70"
            style={{
              padding: '1px',
              background: 'linear-gradient(135deg, transparent 30%, hsl(var(--brand-blue) / 0.35) 50%, transparent 70%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* 背景科技网格 */}
          <div className="absolute inset-0 pointer-events-none tech-grid-bg opacity-50" />

          {/* 背景光晕 */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,hsl(var(--brand-blue)/0.14)_0%,transparent_70%)]" />

          {/* 背景数据粒子 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full bg-cyan-400/40 blur-[1px] animate-particle-rise"
                style={{
                  left: `${15 + i * 14}%`,
                  bottom: `${10 + (i % 3) * 8}%`,
                  animationDelay: `${i * 0.7}s`,
                  animationDuration: `${2.5 + (i % 3) * 0.8}s`,
                }}
              />
            ))}
          </div>

          {/* 顶部拖拽区 / AI 终端标题 */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'panel')}
            className={cn(
              'relative flex items-center justify-between px-3.5 py-2.5 border-b border-brand-blue/15 bg-slate-950/40 select-none z-10',
              dragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
          >
            <div className="flex items-center gap-2.5">
              <ZhiHeCoreAvatar size="xs" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground tracking-wide">智合</h3>
                  <span className="px-1 py-px rounded text-[9px] font-semibold bg-brand-blue/20 text-brand-blue border border-brand-blue/25">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-cyan-300/80 leading-none tracking-wide">聚智协同，质领合作</p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setIsExpanded(false)}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-brand-blue/15 transition-colors"
                title="收起"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 内容区 */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden z-10">
            {!hasConversation ? (
              <div className="min-h-full flex flex-col items-center justify-center px-5 py-6 text-center">
                <ZhiHeCoreAvatar size="lg" className="mb-4" />
                <h2 className="text-lg font-bold text-foreground mb-1">您好，我是智合</h2>
                <p className="text-xs text-cyan-300/90 mb-1.5 tracking-wider">聚智协同，质领合作</p>
                <p className="text-[11px] text-slate-400 mb-5">您的 AI 质量智能助手</p>

                <div className="w-full space-y-2">
                  <p className="text-[10px] text-slate-500 mb-2 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-brand-blue" />
                    快速提问
                  </p>
                  {SUGGESTIONS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.label)}
                        className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-700/60 bg-slate-800/30 text-left hover:border-brand-blue/50 hover:bg-brand-blue/10 hover:shadow-[0_0_16px_hsl(var(--brand-blue)/0.15)] transition-all duration-200"
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                        <span className="text-xs text-slate-200 group-hover:text-white transition-colors">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn('flex items-start gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                    {msg.role === 'assistant' && <ZhiHeCoreAvatar size="xs" />}
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center border border-brand-blue/30 shadow-md shadow-brand-blue/15">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap relative overflow-hidden',
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white rounded-tr-sm shadow-md shadow-brand-blue/15'
                          : msg.error
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-slate-900/50 border border-brand-blue/15 text-foreground backdrop-blur-sm shadow-[0_0_16px_hsl(var(--brand-blue)/0.06)]'
                      )}
                    >
                      {msg.content}

                      {msg.role === 'assistant' && !msg.error && (
                        <div className="absolute inset-0 pointer-events-none opacity-30">
                          <div className="tech-scanline" />
                        </div>
                      )}

                    </div>
                  </div>
                ))}

                {loading && <ThinkingBlock />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="relative p-3 border-t border-brand-blue/15 bg-slate-950/40 z-10">
            <div className="relative flex items-center gap-2 rounded-xl bg-slate-950/60 border border-slate-700/60 px-3 py-2 transition-all input-glow">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入想问的问题"
                className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="ai-send-btn group flex items-center gap-1 pl-2.5 pr-2 py-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-cyan-500 text-white text-[10px] font-semibold shadow-md shadow-brand-blue/25 hover:shadow-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>发送</span>
                <Send className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
