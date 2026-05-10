/**
 * 授权验证上下文
 * @description 管理应用访问授权状态
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * 授权码（生产环境应通过环境变量或后端验证）
 */
const VALID_AUTH_CODE = '7BEE48C1309288BA89AABD3EDF536C02C9A9FB453C64B0D2BD5B6FD9483325D8';
const AUTH_STORAGE_KEY = 'ppl-training-auth';

/**
 * 授权上下文类型
 */
interface AuthContextType {
  isAuthenticated: boolean;
  login: (code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 授权提供者组件
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 检查本地存储的授权状态
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  /**
   * 登录验证
   * @param code 输入的授权码
   * @returns 是否验证通过
   */
  const login = (code: string): boolean => {
    if (code.trim().toUpperCase() === VALID_AUTH_CODE) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  /**
   * 登出
   */
  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 使用授权的 Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
