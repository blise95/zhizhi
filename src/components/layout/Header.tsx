import React from 'react';
import {
  Bell,
  User,
  Clock,
  Server,
  ChevronRight,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  breadcrumbs: { label: string; path?: string }[];
  currentUser?: { username: string; displayName: string; role: string } | null;
  onLogout?: () => void;
}

export function Header({ currentPage, breadcrumbs, currentUser, onLogout }: HeaderProps) {
  // 获取当前时间
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  });
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-card/80 backdrop-blur-md border-b border-border z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* 左侧：页面信息 */}
        <div className="flex items-center gap-4">
          {/* 当前页面标题 */}
          <h1 className="text-lg font-semibold text-foreground">{currentPage}</h1>

          {/* 面包屑导航 */}
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span
                  className={`
                    ${index === breadcrumbs.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer transition-colors'
                    }
                  `}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* 右侧：系统信息 */}
        <div className="flex items-center gap-6">
          {/* 日期时间 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{dateStr} {timeStr}</span>
          </div>

          {/* 系统状态指示器 */}
          <div className="flex items-center gap-4 px-3 py-1.5 rounded-md bg-background/50 border border-border/50">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-quality-normal" />
              <span className="text-xs text-muted-foreground">服务正常</span>
            </div>
          </div>

          {/* 通知按钮 */}
          <button className="relative p-2 rounded-lg hover:bg-accent/10 transition-colors group">
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse-slow"></span>
          </button>

          {/* 用户信息 */}
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-blue-dark/20 flex items-center justify-center border border-brand-blue/30">
              <User className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground leading-tight">
                {currentUser?.displayName || currentUser?.username || '用户'}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                {currentUser?.role || '质量管理部'}
              </span>
            </div>
            {/* 登出按钮 */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-2 p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors group"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
