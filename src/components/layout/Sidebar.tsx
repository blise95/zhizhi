import React from 'react';
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
      { id: 'material-query', label: '材料到厂检验查询' },
      { id: 'tobacco-query', label: '烟丝到厂检验查询' },
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
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const handleChildClick = (childId: string) => {
    onMenuChange(childId);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      {/* 品牌区域 */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {/* 品牌Logo */}
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-blue-dark flex items-center justify-center shadow-tech">
              <span className="text-white font-bold text-lg">智</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-quality-normal border-2 border-sidebar-background animate-pulse-slow"></div>
          </div>

          {/* 品牌名称 */}
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
      </div>

      {/* 导航菜单区域 */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuData.map((item, index) => {
            const isActive = activeMenu === item.id ||
              item.children?.some(child => child.id === activeMenu);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.id}>
                {/* 一级菜单项 - 标题 */}
                {hasChildren ? (
                  /* 有子菜单的：显示为标题 */
                  <div
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative
                      ${isActive
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground'
                      }
                    `}
                  >
                    {/* 激活指示条 */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-blue rounded-r-full"></div>
                    )}

                    {/* 序号标签 */}
                    <span className={`
                      text-xs font-semibold w-5 h-5 flex items-center justify-center rounded
                      ${isActive
                        ? 'bg-brand-blue/20 text-brand-blue'
                        : 'bg-sidebar-accent/30 text-muted-foreground'
                      }
                    `}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* 图标 */}
                    <span className={`
                      transition-colors duration-200
                      ${isActive ? 'text-brand-blue' : 'text-muted-foreground'}
                    `}>
                      {item.icon}
                    </span>

                    {/* 菜单文字 */}
                    <span className="flex-1 text-left text-sm font-semibold">{item.label}</span>
                  </div>
                ) : (
                  /* 无子菜单的：可点击的菜单项 */
                  <button
                    onClick={() => onMenuChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                      ${activeMenu === item.id
                        ? 'bg-sidebar-accent text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      }
                    `}
                  >
                    {/* 激活指示条 */}
                    {activeMenu === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-blue rounded-r-full"></div>
                    )}

                    {/* 序号标签 */}
                    <span className={`
                      text-xs font-semibold w-5 h-5 flex items-center justify-center rounded
                      ${activeMenu === item.id
                        ? 'bg-brand-blue/20 text-brand-blue'
                        : 'bg-sidebar-accent/30 text-muted-foreground group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground'
                      }
                    `}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* 图标 */}
                    <span className={`
                      transition-colors duration-200
                      ${activeMenu === item.id ? 'text-brand-blue' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}
                    `}>
                      {item.icon}
                    </span>

                    {/* 菜单文字 */}
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  </button>
                )}

                {/* 子菜单 - 始终显示 */}
                {hasChildren && (
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
                            {/* 子菜单激活点 */}
                            <span className={`
                              w-1.5 h-1.5 rounded-full transition-all duration-200
                              ${isChildActive ? 'bg-brand-blue scale-110' : 'bg-muted-foreground/30'}
                            `}></span>
                            <span>{child.label}</span>
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

      {/* 底部状态信息 */}
      <div className="p-4 border-t border-sidebar-border">
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
    </aside>
  );
}

export default Sidebar;
