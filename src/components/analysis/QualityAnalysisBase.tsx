import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Calendar,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  Search,
  List,
  Eye,
  X,
} from 'lucide-react';
import {
  DefectType,
} from '../../utils/analysisUtils';
import type {
  FilterConditions,
  QualityOverview,
  MachineDefectData,
  CategoryStat,
  TopDefect,
  TrendDataPoint,
} from '../../utils/analysisUtils';
import {
  getCurrentMonthRange,
  loadProcessQualityData,
  filterByConditions,
  calculateQualityOverview,
  calculateMachineDefectComparison,
  calculateCategoryStats,
  calculateDefectRanking,
  getTopDefects,
  calculateDefectTrend,
  generateAISummary,
  DEFECT_TYPE_LABELS,
} from '../../utils/analysisUtils';

// 筛选选项（与卷包过程质量数据录入保持一致）
const PRODUCTION_POINTS = ['阿联酋环球烟草', '印尼科伦印象'];
const BRANDS = [
  '摩登（中东-EU）',
  '摩登（普通红吉布提）',
  '摩登（普通红国际）',
  '摩登（普通银国际）',
  '摩登（细支）',
  '摩登（细支金）',
  '摩登（超细支）',
  '摩登（超细金）',
  '摩登（超细银）',
  '摩登（超细黑）',
  '摩登（97超细白）',
];
const MACHINES = ['2#', '4#', '9#', '10#', 'ALW 9#', 'ALW 1#'];
const SHIFT_GROUPS = ['早班', '夜班'];
const SHIFTS = ['1', '2'];

// 图表颜色
const CHART_COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

interface QualityAnalysisBaseProps {
  defectType: DefectType;
}

export function QualityAnalysisBase({ defectType }: QualityAnalysisBaseProps) {
  const typeLabel = DEFECT_TYPE_LABELS[defectType];

  // 筛选条件状态
  const [filters, setFilters] = useState<FilterConditions>(() => {
    const range = getCurrentMonthRange();
    return {
      dateFrom: range.from,
      dateTo: range.to,
      productionPoint: '',
      brand: '',
      machine: '',
      shiftGroup: '',
      shift: '',
    };
  });

  // 数据状态
  const [allRecords, setAllRecords] = useState<any[]>([]);

  // 详细数据查询状态
  const [showDetailQuery, setShowDetailQuery] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // 加载数据
  useEffect(() => {
    const data = loadProcessQualityData();
    setAllRecords(data);
  }, []);

  // 根据筛选条件过滤数据
  const filteredRecords = useMemo(() => {
    return filterByConditions(allRecords as any[], filters);
  }, [allRecords, filters]);

  // 计算各项统计数据
  const overview = useMemo(() =>
    calculateQualityOverview(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const machineData = useMemo(() =>
    calculateMachineDefectComparison(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const categoryStats = useMemo(() =>
    calculateCategoryStats(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const defectRanking = useMemo(() =>
    calculateDefectRanking(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  const topDefects = useMemo(() =>
    getTopDefects(defectRanking, 5),
    [defectRanking]
  );

  const trendData = useMemo(() =>
    calculateDefectTrend(filteredRecords as any[], defectType),
    [filteredRecords, defectType]
  );

  // AI质量总结
  const aiSummary = useMemo(() =>
    generateAISummary(overview, machineData, categoryStats, topDefects, trendData, defectType, filters),
    [overview, machineData, categoryStats, topDefects, trendData, defectType, filters]
  );

  // 重置筛选为本月
  const handleResetToMonth = () => {
    const range = getCurrentMonthRange();
    setFilters({
      dateFrom: range.from,
      dateTo: range.to,
      productionPoint: '',
      brand: '',
      machine: '',
      shiftGroup: '',
      shift: '',
    });
  };

  // 判断是否有数据
  const hasData = filteredRecords.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-page-title text-foreground">{typeLabel}质量分析</h1>
        <p className="text-body text-muted-foreground mt-1">质量分析中心 / {typeLabel}质量分析</p>
      </div>

      {/* 统计范围提示 */}
      <div className="data-card p-3 flex items-center gap-3">
        <Calendar className="w-5 h-5 text-brand-blue" />
        <span className="text-sm text-muted-foreground">
          当前统计范围：<strong className="text-foreground">{filters.dateFrom}</strong> 至 <strong className="text-foreground">{filters.dateTo}</strong>
        </span>
        {hasData && (
          <span className="text-xs text-muted-foreground ml-auto">
            共 {filteredRecords.length} 条记录
          </span>
        )}
      </div>

      {/* 筛选条件区域 */}
      <div className="data-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-brand-blue" />
          <h2 className="text-module-title text-foreground">筛选条件</h2>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {/* 开始日期 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">开始日期</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="input-field"
            />
          </div>

          {/* 结束日期 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">结束日期</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="input-field"
            />
          </div>

          {/* 合作生产点 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">合作生产点</label>
            <select
              value={filters.productionPoint}
              onChange={(e) => setFilters({ ...filters, productionPoint: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {PRODUCTION_POINTS.map(point => (
                <option key={point} value={point}>{point}</option>
              ))}
            </select>
          </div>

          {/* 牌号 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">牌号</label>
            <select
              value={filters.brand}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {BRANDS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* 机台 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">机台</label>
            <select
              value={filters.machine}
              onChange={(e) => setFilters({ ...filters, machine: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {MACHINES.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>

          {/* 班别 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班别</label>
            <select
              value={filters.shiftGroup}
              onChange={(e) => setFilters({ ...filters, shiftGroup: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFT_GROUPS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {/* 班次 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">班次</label>
            <select
              value={filters.shift}
              onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
              className="form-select"
            >
              <option value="">全部</option>
              {SHIFTS.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button onClick={handleResetToMonth} className="btn-primary px-4 py-2">
            <Calendar className="w-4 h-4 mr-1.5" />
            本月数据
          </button>
        </div>
      </div>

      {!hasData ? (
        /* 无数据提示 */
        <div className="data-card p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg text-muted-foreground mb-2">暂无数据</p>
          <p className="text-sm text-muted-foreground/60">
            当前筛选条件下暂无{typeLabel}缺陷数据，请调整筛选条件或先在过程质量管控中录入数据
          </p>
        </div>
      ) : (
        <>
          {/* 第一部分：质量概况 */}
          <section className="data-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              <h2 className="text-module-title text-foreground">质量概况</h2>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* 抽检样本数 */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">抽检样本数</span>
                  <Package className="w-8 h-8 text-brand-blue/20" />
                </div>
                <p className="text-4xl font-bold text-foreground">{overview.totalSamples}</p>
                <p className="text-xs text-muted-foreground mt-2">当前统计范围内的实际抽检数量</p>
              </div>

              {/* 缺陷数量 */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">缺陷数量</span>
                  <AlertTriangle className={`w-8 h-8 ${overview.totalDefects > 0 ? 'text-red-400/20' : 'text-green-400/20'}`} />
                </div>
                <p className={`text-4xl font-bold ${overview.totalDefects > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {overview.totalDefects}
                </p>
                <p className="text-xs text-muted-foreground mt-2">涉及 {overview.defectSampleCount} 个缺陷样本</p>
              </div>

              {/* 优质率 */}
              <div className="bg-secondary/30 rounded-xl p-6 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">优质率</span>
                  <CheckCircle2 className={`w-8 h-8 ${overview.qualityRate >= 95 ? 'text-green-400/20' : overview.qualityRate >= 85 ? 'text-yellow-400/20' : 'text-red-400/20'}`} />
                </div>
                <p className={`text-4xl font-bold ${overview.qualityRate >= 95 ? 'text-green-400' : overview.qualityRate >= 85 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {overview.qualityRate}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {overview.qualityRate >= 95 ? '优秀' : overview.qualityRate >= 85 ? '良好' : '需改进'}
                </p>
              </div>
            </div>
          </section>

          {/* 第二部分：机台缺陷数对比 */}
          <section className="data-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-brand-blue" />
              <h2 className="text-module-title text-foreground">机台缺陷数对比</h2>
            </div>

            {machineData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={machineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="machine"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Bar dataKey="defectCount" name="缺陷数量" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                暂无机台缺陷数据
              </div>
            )}
          </section>

          {/* 第三部分：缺陷分析 */}
          <section className="data-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-brand-blue" />
              <h2 className="text-module-title text-foreground">缺陷分析</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 缺陷类别分析 - 饼图 */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">缺陷类别分布</h3>
                {categoryStats.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ category, percentage }) => `${category}类 ${percentage}%`}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    暂无缺陷类别数据
                  </div>
                )}
              </div>

              {/* TOP5缺陷 */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">TOP5 缺陷排名</h3>
                {topDefects.length > 0 ? (
                  <div className="space-y-3">
                    {topDefects.map((defect, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/20"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-red-500/20 text-red-400' :
                          index === 1 ? 'bg-orange-500/20 text-orange-400' :
                          index === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-muted-foreground/10 text-muted-foreground'
                        }`}>
                          {defect.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{defect.name}</p>
                          <p className="text-xs text-muted-foreground">{defect.location} · {defect.category}类</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{defect.count}</p>
                          <p className="text-xs text-muted-foreground">次</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-muted-foreground">
                    暂无缺陷排名数据
                  </div>
                )}
              </div>
            </div>

            {/* 缺陷趋势图 */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">缺陷趋势变化</h3>
              {trendData.length > 1 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="defectCount"
                        name="缺陷数量"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sampleCount"
                        name="抽检样本数"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  暂无足够趋势数据（至少需要2天数据）
                </div>
              )}
            </div>
          </section>

          {/* 第三部分补充：详细数据查询 */}
          <section className="data-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-brand-blue" />
                <h2 className="text-module-title text-foreground">详细数据查询</h2>
                <span className="text-sm text-muted-foreground ml-2">
                  （共 {filteredRecords.length} 条记录）
                </span>
              </div>
              <button
                onClick={() => setShowDetailQuery(!showDetailQuery)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 rounded-lg transition-all duration-200"
              >
                {showDetailQuery ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    收起列表
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    展开查看
                  </>
                )}
              </button>
            </div>

            {showDetailQuery && (
              <div className="space-y-4">
                {/* 数据表格 */}
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">序号</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">检验日期</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">生产点</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">牌号</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">机台</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">班别</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{typeLabel}缺陷数</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record, index) => {
                          const defectKey = `${defectType}Defects` as keyof typeof record;
                          const defects = record[defectKey] as any[] || [];
                          const defectCount = defects.reduce((sum, d) => sum + (d.quantity || 0), 0);
                          return (
                            <tr key={record.id || index} className="hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-3 text-foreground">{index + 1}</td>
                              <td className="px-4 py-3 text-foreground">{record.inspectionDate}</td>
                              <td className="px-4 py-3 text-foreground">{record.productionPoint}</td>
                              <td className="px-4 py-3 text-foreground">{record.brand}</td>
                              <td className="px-4 py-3 text-foreground">{record.machine}</td>
                              <td className="px-4 py-3 text-foreground">{record.shiftGroup}{record.shift ? ` ${record.shift}班` : ''}</td>
                              <td className={`px-4 py-3 font-medium ${defectCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {defectCount}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setSelectedRecord(record)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 rounded-md transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  查看详情
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                            暂无符合条件的数据记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* 第四部分：AI质量总结 */}
          <section className="data-card p-6 bg-gradient-to-br from-brand-blue/5 to-purple-500/5 border-brand-blue/20">
            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="w-5 h-5 text-brand-blue" />
              <h2 className="text-module-title text-foreground">AI质量总结</h2>
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-medium bg-brand-blue/10 text-brand-blue">
                智能分析
              </span>
            </div>

            <div className="space-y-4">
              {aiSummary.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-sm text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: paragraph
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-blue">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* 详情弹窗 */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
          <div
            className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-tech mx-4 animate-in zoom-in-95 fade-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-card border-b border-border/50 p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">质量记录详情</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  记录ID: {selectedRecord.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-6 space-y-6">
              {/* 基础信息 */}
              <div>
                <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-blue" />
                  基础信息
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '检验日期', value: selectedRecord.inspectionDate },
                    { label: '合作生产点', value: selectedRecord.productionPoint },
                    { label: '牌号', value: selectedRecord.brand },
                    { label: '机台', value: selectedRecord.machine },
                    { label: '班别', value: `${selectedRecord.shiftGroup || ''} ${selectedRecord.shift || ''}班`.trim() },
                    { label: '记录人', value: selectedRecord.inspector },
                    { label: '烟丝批次', value: selectedRecord.batchNumber || '-' },
                    { label: '取样时间', value: selectedRecord.samplingTime || '-' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-secondary/30 rounded-lg p-3 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 缺陷详情 */}
              <div>
                <h4 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  {typeLabel}缺陷详情
                </h4>
                {(() => {
                  const defectKey = `${defectType}Defects` as keyof typeof selectedRecord;
                  const defects = selectedRecord[defectKey] as any[] || [];
                  if (defects.length === 0) {
                    return (
                      <div className="text-center py-8 bg-secondary/20 rounded-lg border border-border/30">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400/50" />
                        <p className="text-green-400 font-medium">本次检验无{typeLabel}缺陷</p>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto rounded-lg border border-border/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-secondary/50 border-b border-border/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">缺陷部位</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">缺陷名称</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">缺陷类别</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">缺陷数量</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {defects.map((defect, idx) => (
                            <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                              <td className="px-4 py-3 text-foreground">{defect.location}</td>
                              <td className="px-4 py-3 text-foreground">{defect.defectName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  defect.category === 'A' ? 'bg-red-500/10 text-red-400' :
                                  defect.category === 'B' ? 'bg-orange-500/10 text-orange-400' :
                                  defect.category === 'C' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {defect.category}类
                                </span>
                              </td>
                              <td className={`px-4 py-3 font-semibold ${defect.quantity > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {defect.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QualityAnalysisBase;
