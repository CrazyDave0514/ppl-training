/**
 * App 组件 - 应用主入口
 * @description 配置 React Router 路由，添加授权验证
 */

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { UserProvider } from './store/UserContext';
import { PlanProvider } from './store/PlanContext';
import { SessionProvider } from './store/SessionContext';
import { AuthProvider, useAuth } from './store/AuthContext';
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

/**
 * 受保护的路由包装器
 * 未授权用户重定向到授权页面
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
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
                  </Route>
                </Route>

                {/* 404 重定向到首页 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SessionProvider>
        </PlanProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
