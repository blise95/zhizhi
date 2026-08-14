import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  SearchCheck,
  FlaskConical,
  PackageCheck,
  Leaf,
  BarChart3,
  PackageSearch,
  PackageOpen,
  Cigarette,
  TrendingUp,
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string }[];
}

const menuData: MenuItem[] = [
  {
    id: 'dashboard',
    label: '质量驾驶舱',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: 'process',
    label: '过程质量管控',
    icon: <ClipboardList className="w-5 h-5" />,
    children: [
      { id: 'process-input', label: '卷包过程质量数据录入' },
      { id: 'physical-test', label: '烟支物测指标数据录入' },
    ],
  },
  {
    id: 'material',
    label: '辅料质量管控',
    icon: <PackageCheck className="w-5 h-5" />,
    children: [
      { id: 'material-inspection', label: '材料到厂检验录入' },
      { id: 'tobacco-inspection', label: '烟丝到厂检验录入' },
    ],
  },
  {
    id: 'query',
    label: '质量数据查询',
    icon: <SearchCheck className="w-5 h-5" />,
    children: [
      { id: 'process-query', label: '过程质量数据查询' },
      { id: 'material-query', label: '材料检验结果查询' },
      { id: 'tobacco-query', label: '烟丝检验结果查询' },
      { id: 'physical-test-query', label: '烟支物测数据查询' },
    ],
  },
  {
    id: 'analysis',
    label: '质量分析中心',
    icon: <BarChart3 className="w-5 h-5" />,
    children: [
      { id: 'box-analysis', label: '箱装外观质量分析' },
      { id: 'carton-analysis', label: '条装外观质量分析' },
      { id: 'pack-analysis', label: '盒装外观质量分析' },
      { id: 'cigarette-analysis', label: '烟支外观质量分析' },
      { id: 'comprehensive-analysis', label: '综合质量汇总分析' },
    ],
  },
  {
    id: 'ai',
    label: '智质应用',
    icon: <BrainCircuit className="w-5 h-5" />,
    children: [
      { id: 'ai-prediction', label: 'AI质量趋势预测' },
    ],
  },
];

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ activeMenu, onMenuChange, collapsed = false, onToggle }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleChildClick = (childId: string) => {
    onMenuChange(childId);
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex flex-col z-50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-64'}
      `}
    >
      {/* 品牌区域 */}
      <div className={`
        h-16 flex items-center border-b border-sidebar-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'justify-center px-2' : 'px-6'}
      `}>
        {collapsed ? (
          /* 收起状态：仅显示Logo */
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center shadow-tech">
              <span className="text-white font-bold text-lg">智</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-quality-normal border-2 border-sidebar-background animate-pulse-slow"></div>
          </div>
        ) : (
          /* 展开状态：完整品牌信息 */
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center shadow-tech">
                <span className="text-white font-bold text-lg">智</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-quality-normal border-2 border-sidebar-background animate-pulse-slow"></div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-sidebar-foreground tracking-wide">智</span>
                <span className="w-1 h-1 rounded-full bg-brand-blue"></span>
                <span className="text-xl font-bold text-sidebar-foreground tracking-wide">质</span>
              </div>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5 tracking-wider">
                卷烟数智化质量管理平台
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 导航菜单区域 */}
      <nav className={`
        flex-1 overflow-y-auto overflow-x-hidden py-4
        transition-all duration-300 ease-in-out
        ${collapsed ? 'px-2' : 'px-3'}
      `}>
        <ul className="space-y-1">
          {menuData.map((item, index) => {
            const isActive = activeMenu === item.id ||
              item.children?.some(child => child.id === activeMenu);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.id}>
                {/* 一级菜单项 */}
                <div
                  className={`
                    group relative flex items-center rounded-lg transition-all duration-200 cursor-pointer
                    ${collapsed ? 'justify-center px-0 py-2.5' : `gap-3 px-3 py-2`}
                    ${isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                    }
                  `}
                  onClick={() => !hasChildren && onMenuChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* 激活指示条 - 仅展开时显示 */}
                  {!collapsed && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-blue rounded-r-full"></div>
                  )}

                  {/* 激活指示点 - 收起时显示 */}
                  {collapsed && isActive && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                  )}

                  {/* 序号标签 - 仅展开时显示 */}
                  {!collapsed && (
                    <span className={`
                      text-xs font-semibold w-5 h-5 flex items-center justify-center rounded shrink-0
                      ${isActive
                        ? 'bg-brand-blue/20 text-brand-blue'
                        : 'bg-sidebar-accent/30 text-muted-foreground group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground'
                      }
                    `}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}

                  {/* 图标 */}
                  <span className={`
                    shrink-0 transition-colors duration-200
                    ${isActive ? 'text-brand-blue' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}
                    ${collapsed ? 'w-6 h-6' : 'w-5 h-5'}
                  `}>
                    {item.icon}
                  </span>

                  {/* 菜单文字 - 仅展开时显示 */}
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium truncate">{item.label}</span>
                      {hasChildren && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      )}
                    </>
                  )}

                  {/* 收起时的 Tooltip */}
                  {collapsed && hoveredItem === item.id && (
                    <div className="
                      absolute left-full ml-3 top-1/2 -translate-y-1/2 z-[100]
                      px-3 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-md text-white text-sm font-medium
                      border border-slate-700/50 shadow-xl whitespace-nowrap
                      pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150
                    ">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900/95"></div>
                    </div>
                  )}
                </div>

                {/* 子菜单 - 仅展开且有子菜单时显示 */}
                {hasChildren && !collapsed && (
                  <ul className="mt-1 ml-4 space-y-0.5 pl-3 border-l border-sidebar-border/50">
                    {item.children!.map((child) => {
                      const isChildActive = activeMenu === child.id;
                      return (
                        <li key={child.id}>
                          <button
                            onClick={() => handleChildClick(child.id)}
                            className={`
                              w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-150
                              ${isChildActive
                                ? 'bg-brand-blue/10 text-brand-blue font-medium'
                                : 'text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground'
                              }
                            `}
                          >
                            <span className={`
                              w-1.5 h-1.5 rounded-full transition-all duration-200 shrink-0
                              ${isChildActive ? 'bg-brand-blue scale-110' : 'bg-muted-foreground/30'}
                            `}></span>
                            <span className="truncate">{child.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部区域：收起按钮 + 状态信息 */}
      <div className="border-t border-sidebar-border">
        {/* 收起/展开切换按钮 */}
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 px-4 py-3
            text-muted-foreground hover:text-sidebar-foreground
            hover:bg-sidebar-accent/40 transition-all duration-200
            group border-b border-sidebar-border/50
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? '展开菜单' : '收起菜单'}
        >
          <span className={`
            shrink-0 transition-transform duration-300 group-hover:rotate-180
            ${collapsed ? '' : ''}
          `}>
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </span>
          {!collapsed && (
            <span className="text-sm font-medium">{collapsed ? '' : '收起侧栏'}</span>
          )}
        </button>

        {/* 状态信息 - 仅展开时显示 */}
        {!collapsed && (
          <div className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>系统状态</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-quality-normal animate-pulse-slow"></span>
                <span className="text-quality-normal">运行中</span>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground/60">
              v1.0.0 | 智·质 Platform
            </div>
          </div>
        )}

        {/* 收起时的状态指示点 */}
        {collapsed && (
          <div className="flex justify-center py-3">
            <span className="w-2 h-2 rounded-full bg-quality-normal animate-pulse-slow"></span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
