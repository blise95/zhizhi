import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QualityDashboard } from './components/dashboard/QualityDashboard';
import { ProcessQualityInput } from './components/process/ProcessQualityInput';
import { ProcessQualityQuery } from './components/process/ProcessQualityQuery';
import { CigarettePhysicalTestInput } from './components/process/CigarettePhysicalTestInput';
import { CigarettePhysicalTestQuery } from './components/process/CigarettePhysicalTestQuery';
import { MaterialInspectionInput } from './components/process/MaterialInspectionInput';
import { MaterialInspectionQuery } from './components/process/MaterialInspectionQuery';
import { TobaccoInspectionInput } from './components/process/TobaccoInspectionInput';
import { TobaccoInspectionQuery } from './components/process/TobaccoInspectionQuery';
import { BoxQualityAnalysis } from './components/analysis/BoxQualityAnalysis';
import { CartonQualityAnalysis } from './components/analysis/CartonQualityAnalysis';
import { PackQualityAnalysis } from './components/analysis/PackQualityAnalysis';
import { CigaretteQualityAnalysis } from './components/analysis/CigaretteQualityAnalysis';
import { ComprehensiveQualityAnalysis } from './components/analysis/ComprehensiveQualityAnalysis';
import { AIPredictionAnalysis } from './components/analysis/AIPredictionAnalysis';
import { ZhiZhiFloatingChat } from './components/common/ZhiZhiFloatingChat';
import Login, { getCurrentUser, logout } from './components/auth/Login';
import { authApi } from './services/api';

function App() {
  const [activeMenu, setActiveMenu] = useState(() => {
    try {
      return localStorage.getItem('zhiquality_active_menu') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName: string; role: string } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 持久化当前菜单，刷新后保持页面
  useEffect(() => {
    localStorage.setItem('zhiquality_active_menu', activeMenu);
  }, [activeMenu]);

  // 检查登录状态（以服务端会话为准）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('login')) {
      logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      return;
    }

    const cached = getCurrentUser();
    if (!cached?.token) {
      return;
    }

    authApi
      .me()
      .then((profile) => {
        setIsAuthenticated(true);
        setCurrentUser({
          username: profile.username,
          displayName: profile.displayName,
          role: profile.role,
        });
      })
      .catch(() => {
        logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
      });
  }, []);

  // 登录成功回调
  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  };

  // 登出
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // 未登录时显示登录页面
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 根据当前菜单获取页面信息
  const getPageInfo = () => {
    const pageMap: Record<string, { title: string; breadcrumbs: { label: string; path?: string }[] }> = {
      dashboard: {
        title: '质量驾驶舱',
        breadcrumbs: [{ label: '质量驾驶舱' }],
      },
      'process-input': {
        title: '卷包过程质量数据录入',
        breadcrumbs: [
          { label: '过程质量管控' },
          { label: '卷包过程质量数据录入' },
        ],
      },
      'process-query': {
        title: '卷包过程质量数据查询',
        breadcrumbs: [
          { label: '过程质量管控' },
          { label: '卷包过程质量数据查询' },
        ],
      },
      'physical-test': {
        title: '烟支物测指标数据录入',
        breadcrumbs: [
          { label: '过程质量管控' },
          { label: '烟支物测指标数据录入' },
        ],
      },
      'physical-test-query': {
        title: '烟支物测数据查询',
        breadcrumbs: [
          { label: '质量数据查询' },
          { label: '烟支物测数据查询' },
        ],
      },
      'material-inspection': {
        title: '材料到厂检验录入',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '材料到厂检验录入' },
        ],
      },
      'material-query': {
        title: '材料检验结果查询',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '材料检验结果查询' },
        ],
      },
      'tobacco-inspection': {
        title: '烟丝到厂检验录入',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '烟丝到厂检验录入' },
        ],
      },
      'tobacco-query': {
        title: '烟丝检验结果查询',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '烟丝检验结果查询' },
        ],
      },
      'box-analysis': {
        title: '箱装外观质量分析',
        breadcrumbs: [
          { label: '质量分析中心' },
          { label: '箱装外观质量分析' },
        ],
      },
      'carton-analysis': {
        title: '条装外观质量分析',
        breadcrumbs: [
          { label: '质量分析中心' },
          { label: '条装外观质量分析' },
        ],
      },
      'pack-analysis': {
        title: '盒装外观质量分析',
        breadcrumbs: [
          { label: '质量分析中心' },
          { label: '盒装外观质量分析' },
        ],
      },
      'cigarette-analysis': {
        title: '烟支外观质量分析',
        breadcrumbs: [
          { label: '质量分析中心' },
          { label: '烟支外观质量分析' },
        ],
      },
      'comprehensive-analysis': {
        title: '综合质量汇总分析',
        breadcrumbs: [
          { label: '质量分析中心' },
          { label: '综合质量汇总分析' },
        ],
      },
      'ai-prediction': {
        title: 'AI质量趋势预测',
        breadcrumbs: [
          { label: '智质应用' },
          { label: 'AI质量趋势预测' },
        ],
      },
    };

    return pageMap[activeMenu] || pageMap.dashboard;
  };

  const pageInfo = getPageInfo();

  // 渲染主内容区
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <QualityDashboard />;
      case 'process-input':
        return <ProcessQualityInput onBack={() => setActiveMenu('dashboard')} />;
      case 'process-query':
        return <ProcessQualityQuery />;
      case 'physical-test':
        return <CigarettePhysicalTestInput onBack={() => setActiveMenu('dashboard')} />;
      case 'physical-test-query':
        return <CigarettePhysicalTestQuery />;
      case 'material-inspection':
        return <MaterialInspectionInput />;
      case 'material-query':
        return <MaterialInspectionQuery />;
      case 'tobacco-inspection':
        return <TobaccoInspectionInput />;
      case 'tobacco-query':
        return <TobaccoInspectionQuery />;
      case 'box-analysis':
        return <BoxQualityAnalysis />;
      case 'carton-analysis':
        return <CartonQualityAnalysis />;
      case 'pack-analysis':
        return <PackQualityAnalysis />;
      case 'cigarette-analysis':
        return <CigaretteQualityAnalysis />;
      case 'comprehensive-analysis':
        return <ComprehensiveQualityAnalysis />;
      case 'ai-prediction':
        return <AIPredictionAnalysis />;
      default:
        // 其他页面的占位符
        return (
          <div className="p-6">
            <div className="data-card">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-4 border border-brand-blue/20">
                  <span className="text-4xl">🚧</span>
                </div>
                <h2 className="text-page-title text-foreground mb-2">功能开发中</h2>
                <p className="text-body text-muted-foreground max-w-md">
                  该模块正在建设中，敬请期待。当前可体验质量驾驶舱功能。
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 左侧导航 */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 主内容区域 */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-[68px]' : 'ml-64'}`}>
        {/* 顶部栏 */}
        <Header
          currentPage={pageInfo.title}
          breadcrumbs={pageInfo.breadcrumbs}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* 内容区 */}
        <main className="pt-16">
          {renderContent()}
        </main>
      </div>

      {/* 智合 AI 智能副驾驶 */}
      <ZhiZhiFloatingChat />
    </div>
  );
}

export default App;
