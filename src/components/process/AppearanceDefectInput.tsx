import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Package,
  BoxSelect,
  Cigarette,
  Layers,
} from 'lucide-react';

// 导入缺陷库数据
import type {
  DefectCategory,
  DefectItem,
} from '@/data/defectLibrary';
import {
  BOX_DEFECTS,
  CARTON_DEFECTS,
  PACK_DEFECTS,
  CIGARETTE_DEFECTS,
  getLocations,
  getDefectsByLocation,
} from '@/data/defectLibrary';

// 单条缺陷记录接口
interface DefectRecord {
  id: string;
  location: string;
  defectName: string;
  defectCode: string;
  category: string;
  quantity: number;
}

// 缺陷模块配置
interface DefectModuleConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  library: DefectCategory;
  color: string;
}

// 缺陷模块配置列表
const DEFECT_MODULES: DefectModuleConfig[] = [
  {
    key: 'box',
    label: '箱装外观缺陷',
    icon: <Package className="w-5 h-5" />,
    library: BOX_DEFECTS,
    color: 'blue',
  },
  {
    key: 'carton',
    label: '条装外观缺陷',
    icon: <Layers className="w-5 h-5" />,
    library: CARTON_DEFECTS,
    color: 'purple',
  },
  {
    key: 'pack',
    label: '盒装外观缺陷',
    icon: <BoxSelect className="w-5 h-5" />,
    library: PACK_DEFECTS,
    color: 'cyan',
  },
  {
    key: 'cigarette',
    label: '烟支外观缺陷',
    icon: <Cigarette className="w-5 h-5" />,
    library: CIGARETTE_DEFECTS,
    color: 'orange',
  },
];

interface AppearanceDefectInputProps {
  onDataChange?: (data: Record<string, DefectRecord[]>) => void;
  initialData?: Record<string, DefectRecord[]>;
}

export function AppearanceDefectInput({ onDataChange, initialData }: AppearanceDefectInputProps) {
  // 各模块的缺陷记录
  const [defectRecords, setDefectRecords] = useState<Record<string, DefectRecord[]>>({
    box: [],
    carton: [],
    pack: [],
    cigarette: [],
  });

  // 模块展开状态
  const [expandedModules, setExpandedModules] = useState<string[]>(['box', 'carton', 'pack', 'cigarette']);

  // 当数据变化时通知父组件
  useEffect(() => {
    if (onDataChange) {
      onDataChange(defectRecords);
    }
  }, [defectRecords, onDataChange]);

  // 当传入历史缺陷数据时，设置为初始值（支持连续录入记忆）
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDefectRecords({
        box: initialData.box || [],
        carton: initialData.carton || [],
        pack: initialData.pack || [],
        cigarette: initialData.cigarette || [],
      });
    }
  }, [initialData]);

  // 切换模块展开/折叠
  const toggleModule = (moduleKey: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleKey)
        ? prev.filter(key => key !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  // 添加新的缺陷记录
  const addDefectRecord = (moduleKey: string) => {
    const newRecord: DefectRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      location: '',
      defectName: '',
      defectCode: '',
      category: '',
      quantity: 1,
    };

    setDefectRecords(prev => ({
      ...prev,
      [moduleKey]: [...(prev[moduleKey] || []), newRecord],
    }));
  };

  // 更新缺陷记录
  const updateDefectRecord = (
    moduleKey: string,
    recordId: string,
    field: keyof DefectRecord,
    value: any
  ) => {
    setDefectRecords(prev => ({
      ...prev,
      [moduleKey]: prev[moduleKey].map(record =>
        record.id === recordId ? { ...record, [field]: value } : record
      ),
    }));
  };

  // 当选择部位时，清空已选的缺陷名称
  const handleLocationChange = (
    moduleKey: string,
    recordId: string,
    location: string
  ) => {
    updateDefectRecord(moduleKey, recordId, 'location', location);
    updateDefectRecord(moduleKey, recordId, 'defectName', '');
    updateDefectRecord(moduleKey, recordId, 'defectCode', '');
    updateDefectRecord(moduleKey, recordId, 'category', '');
  };

  // 当选择缺陷名称时，自动填充代码和类别
  const handleDefectNameChange = (
    moduleKey: string,
    recordId: string,
    defectCode: string
  ) => {
    const defects = getDefectsByLocation(
      moduleKey,
      defectRecords[moduleKey].find(r => r.id === recordId)?.location || ''
    );
    const defect = defects.find(d => d.code === defectCode);

    if (defect) {
      updateDefectRecord(moduleKey, recordId, 'defectName', defect.name);
      updateDefectRecord(moduleKey, recordId, 'defectCode', defect.code);
      updateDefectRecord(moduleKey, recordId, 'category', defect.category);
    }
  };

  // 删除缺陷记录
  const removeDefectRecord = (moduleKey: string, recordId: string) => {
    setDefectRecords(prev => ({
      ...prev,
      [moduleKey]: prev[moduleKey].filter(record => record.id !== recordId),
    }));
  };

  // 获取颜色样式类
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
      blue: {
        bg: 'bg-brand-blue/10',
        border: 'border-brand-blue/30',
        text: 'text-brand-blue',
        hover: 'hover:border-brand-blue/50 hover:bg-brand-blue/5',
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        hover: 'hover:border-purple-500/50 hover:bg-purple-500/5',
      },
      cyan: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        text: 'text-cyan-400',
        hover: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
      },
      orange: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        hover: 'hover:border-orange-500/50 hover:bg-orange-500/5',
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  // 渲染单个缺陷模块
  const renderDefectModule = (config: DefectModuleConfig) => {
    const isExpanded = expandedModules.includes(config.key);
    const records = defectRecords[config.key] || [];
    const colors = getColorClasses(config.color);
    const locations = getLocations(config.key);

    return (
      <section key={config.key} className="data-card mb-4">
        {/* 模块标题 */}
        <button
          onClick={() => toggleModule(config.key)}
          className="w-full flex items-center justify-between p-4 -mt-4 -mx-4 mb-4 hover:bg-accent/5 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
              <span className={colors.text}>{config.icon}</span>
            </div>
            <div className="text-left">
              <h3 className="text-section-title text-foreground">{config.label}</h3>
              <p className="text-caption">{config.library.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {records.length > 0 && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                {records.length}条记录
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* 模块内容 */}
        {isExpanded && (
          <div className="space-y-4">
            {/* 缺陷记录列表 */}
            {records.length > 0 && (
              <div className="space-y-3">
                {records.map((record, index) => {
                  const defectOptions = getDefectsByLocation(config.key, record.location);

                  return (
                    <div
                      key={record.id}
                      className={`p-4 rounded-lg bg-background/50 border ${colors.border} ${colors.hover} transition-all duration-200`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <span className={`${colors.text}`}>#{index + 1}</span>
                          <span>缺陷记录</span>
                        </div>

                        <button
                          onClick={() => removeDefectRecord(config.key, record.id)}
                          className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                          title="删除此条记录"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-3">
                        {/* 缺陷部位 */}
                        <div className="col-span-3 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span>缺陷部位</span>
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            value={record.location}
                            onChange={(e) =>
                              handleLocationChange(config.key, record.id, e.target.value)
                            }
                            className="form-select text-sm"
                          >
                            <option value="">请选择部位</option>
                            {locations.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 缺陷名称 */}
                        <div className="col-span-4 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span>缺陷名称</span>
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            value={record.defectCode}
                            onChange={(e) =>
                              handleDefectNameChange(config.key, record.id, e.target.value)
                            }
                            className="form-select text-sm"
                            disabled={!record.location}
                          >
                            <option value="">
                              {record.location ? '请选择缺陷' : '请先选择部位'}
                            </option>
                            {defectOptions.map((defect) => (
                              <option key={defect.code} value={defect.code}>
                                {defect.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 缺陷类别 - 下拉选择 */}
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span>类别</span>
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            value={record.category}
                            onChange={(e) =>
                              updateDefectRecord(config.key, record.id, 'category', e.target.value)
                            }
                            className="form-select text-sm text-center font-medium"
                          >
                            <option value="">请选择</option>
                            <option value="A">A类</option>
                            <option value="B">B类</option>
                            <option value="C">C类</option>
                            <option value="D">D类</option>
                          </select>
                        </div>

                        {/* 数量 */}
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <span>数量</span>
                            <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={record.quantity}
                            onChange={(e) =>
                              updateDefectRecord(
                                config.key,
                                record.id,
                                'quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="form-input text-sm text-center"
                          />
                        </div>

                        {/* 操作按钮占位 */}
                        <div className="col-span-1"></div>
                      </div>

                      {/* 显示选中缺陷的标准说明 */}
                      {record.defectCode && (
                        <div className="mt-3 p-2.5 rounded-md bg-background/80 border border-border/30">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-brand-blue mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {defectOptions.find(d => d.code === record.defectCode)?.standard ||
                                '暂无标准说明'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 空状态提示 */}
            {records.length === 0 && (
              <div className="py-8 text-center border border-dashed border-border/50 rounded-lg">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border mb-3`}>
                  <span className={colors.text}>
                    <Package className="w-6 h-6" />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">暂无{config.label}记录</p>
                <p className="text-xs text-muted-foreground/60">
                  点击下方按钮添加缺陷记录
                </p>
              </div>
            )}

            {/* 添加按钮 */}
            <button
              onClick={() => addDefectRecord(config.key)}
              className={`w-full py-2.5 px-4 rounded-lg border-2 border-dashed ${colors.border} ${colors.hover} flex items-center justify-center gap-2 text-sm font-medium ${colors.text} transition-all duration-200`}
            >
              <Plus className="w-4 h-4" />
              添加{config.label.replace('外观缺陷', '')}记录
            </button>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-2">
      {/* 外观缺陷录入标题 */}
      <div className="flex items-center gap-3 pt-2 pb-2">
        <div className="p-2 rounded-lg bg-quality-normal/10 border border-quality-normal/30">
          <AlertCircle className="w-5 h-5 text-quality-normal" />
        </div>
        <div>
          <h2 className="text-section-title text-foreground">外观缺陷录入</h2>
          <p className="text-caption">根据实际检测情况，录入各类外观缺陷</p>
        </div>
      </div>

      {/* 渲染所有缺陷模块 */}
      {DEFECT_MODULES.map(renderDefectModule)}

      {/* 统计信息 */}
      <div className="data-card mt-4">
        <div className="grid grid-cols-4 gap-4">
          {DEFECT_MODULES.map((config) => {
            const count = defectRecords[config.key]?.length || 0;
            const colors = getColorClasses(config.color);

            return (
              <div
                key={config.key}
                className={`p-4 rounded-lg bg-background/50 border ${colors.border} text-center`}
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg} mb-2`}>
                  <span className={colors.text}>{config.icon}</span>
                </div>
                <div className={`text-2xl font-bold text-foreground ${count > 0 ? colors.text : ''}`}>
                  {count}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {config.label.replace('外观缺陷', '')}
                </div>
              </div>
            );
          })}
        </div>

        {/* 总计 */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">缺陷记录总计</span>
          <span className="text-lg font-bold text-foreground">
            {Object.values(defectRecords).reduce((sum, records) => sum + records.length, 0)}
            条
          </span>
        </div>
      </div>
    </div>
  );
}

export default AppearanceDefectInput;
