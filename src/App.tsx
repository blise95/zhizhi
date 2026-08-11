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
import Login, { getCurrentUser, logout } from './components/auth/Login';

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; displayName: string; role: string } | null>(null);

  // 检查登录状态
  useEffect(() => {
    // 仅当 URL 带有 ?login 参数时强制回到登录页（便于开发预览登录特效）
    const params = new URLSearchParams(window.location.search);
    if (params.has('login')) {
      localStorage.removeItem('zhiquality_auth');
    }

    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
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
        title: '材料到厂检验查询',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '材料到厂检验查询' },
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
        title: '烟丝到厂检验查询',
        breadcrumbs: [
          { label: '辅料质量管控' },
          { label: '烟丝到厂检验查询' },
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
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* 主内容区域 */}
      <div className="ml-64 min-h-screen">
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
    </div>
  );
}

export default App;
