/**
 * 布局组件
 * @description Apple Health 风格底部导航布局
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * 布局组件 Props
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 布局组件
 * @param children - 子组件
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // 在训练页面不显示底部导航
  if (location.pathname.startsWith('/training')) {
    return <>{children}</>;
  }

  /**
   * 导航项配置
   */
  const navItems = [
    {
      path: '/',
      label: '首页',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 transition-colors duration-200 ${active ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      path: '/plans',
      label: '计划',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 transition-colors duration-200 ${active ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      <div className="animate-fade-in">{children}</div>

      {/* 底部导航 - Apple Health 风格 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[#E5E5EA] safe-area-bottom">
        <div className="max-w-lg mx-auto px-6">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200"
              >
                {({ isActive }) => (
                  <>
                    {item.icon(isActive)}
                    <span
                      className={`text-xs mt-1 font-medium transition-colors duration-200 ${
                        isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
