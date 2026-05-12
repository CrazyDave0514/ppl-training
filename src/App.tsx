/**
 * App 组件 - 应用主入口
 * @description 配置 React Router 路由，添加授权验证
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { UserProvider } from './store/UserContext';
import { PlanProvider } from './store/PlanContext';
import { SessionProvider } from './store/SessionContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ProfileProvider } from './store/ProfileContext';
import { DietProvider } from './store/DietContext';
import { getCachedAccounts } from './utils/authCache';
import Layout from './components/Layout';

// 页面组件
import Home from './pages/Home';
import Plans from './pages/Plans';
import PlanDetail from './pages/PlanDetail';
import QuickCreate from './pages/QuickCreate';
import Training from './pages/Training';
import SessionDetail from './pages/SessionDetail';
import Records from './pages/Records';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ProfileWizard from './pages/ProfileWizard';

/**
 * 临时组件 - 清除所有本地数据并跳转首页
 * @description 仅用于开发调试，验收后删除
 */
function ClearAllData() {
  useEffect(() => {
    localStorage.removeItem('ppl-training-auth');
    localStorage.removeItem('ppl-training-app');
    localStorage.removeItem('ppl-training-auth-cache');
    window.location.href = '/';
  }, []);
  return <div>正在清除数据...</div>;
}

/**
 * 受保护的路由包装器
 * 未认证且无缓存账号时跳转授权码页，否则放行
 * 各页面内部根据 currentUser 状态处理未登录引导
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Outlet />;
  // 未认证但有缓存账号（退出登录状态），放行让各页面处理
  if (getCachedAccounts().length > 0) return <Outlet />;
  // 未认证且无缓存账号（首次使用），跳转授权码页
  return <Navigate to="/auth" replace />;
};

/**
 * 授权页面路由包装器
 * 已授权用户重定向到首页
 */
const AuthRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <Auth />;
};

/**
 * 带布局的路由包装器
 */
const LayoutWrapper: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

/**
 * App 组件
 * @returns React.ReactElement
 */
function App(): React.ReactElement {
  return (
    <AuthProvider>
      <UserProvider>
        <ProfileProvider>
          <DietProvider>
            <PlanProvider>
              <SessionProvider>
                <Router>
                  <Routes>
                    {/* 授权页面 - 无需登录 */}
                    <Route path="/auth" element={<AuthRoute />} />

                    {/* 受保护的路由 - 需要授权 */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<LayoutWrapper />}>
                        {/* 首页 */}
                        <Route path="/" element={<Home />} />

                        {/* 记录 */}
                        <Route path="/records" element={<Records />} />

                        {/* 计划管理 */}
                        <Route path="/plans" element={<Plans />} />
                        <Route path="/plan/:planId" element={<PlanDetail />} />

                        {/* 快速创建 */}
                        <Route path="/quick-create" element={<QuickCreate />} />

                        {/* 训练进行中 */}
                        <Route path="/training" element={<Training />} />

                        {/* 训练详情 */}
                        <Route path="/session/:sessionId" element={<SessionDetail />} />

                        {/* 设置 */}
                        <Route path="/settings" element={<Settings />} />

                        {/* 用户画像问卷 */}
                        <Route path="/profile-wizard" element={<ProfileWizard />} />
                      </Route>
                    </Route>

                    {/* 404 重定向到首页 */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                    {/* 临时：清除所有数据 */}
                    <Route path="/clear-all" element={<ClearAllData />} />
                  </Routes>
                </Router>
              </SessionProvider>
            </PlanProvider>
          </DietProvider>
        </ProfileProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
