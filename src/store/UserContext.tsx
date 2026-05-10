/**
 * 用户管理 Context
 * @description 管理当前用户、用户列表，提供创建/切换/删除用户功能
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../types';
import {
  getUsers,
  getCurrentUser,
  setCurrentUser as setStorageCurrentUser,
  addUser as addStorageUser,
  deleteUser as deleteStorageUser,
  updateUser as updateStorageUser,
} from '../utils/storage';

/**
 * UserContext 类型定义
 */
interface UserContextType {
  /** 当前用户 */
  currentUser: User | null;
  /** 所有用户列表 */
  users: User[];
  /** 创建新用户 */
  createUser: (name: string) => User;
  /** 切换当前用户 */
  switchUser: (userId: string) => void;
  /** 删除用户 */
  deleteUser: (userId: string) => void;
  /** 更新用户 */
  updateUser: (userId: string, data: Partial<User>) => void;
  /** 重新加载用户数据 */
  refreshUsers: () => void;
}

// 创建 Context
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * 生成唯一 ID
 * @returns UUID 字符串
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * UserProvider 组件
 * @param children - 子组件
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  /**
   * 从存储加载用户数据
   */
  const loadUsers = useCallback(() => {
    const storedUsers = getUsers();
    const storedCurrentUser = getCurrentUser();
    setUsers(storedUsers);
    setCurrentUser(storedCurrentUser);
  }, []);

  // 初始化加载
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /**
   * 创建新用户
   * @param name - 用户名
   * @returns 创建的用户对象
   */
  const createUser = useCallback((name: string): User => {
    const newUser: User = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    addStorageUser(newUser);
    loadUsers();
    return newUser;
  }, [loadUsers]);

  /**
   * 切换当前用户
   * @param userId - 用户 ID
   */
  const switchUser = useCallback((userId: string) => {
    setStorageCurrentUser(userId);
    loadUsers();
  }, [loadUsers]);

  /**
   * 删除用户
   * @param userId - 用户 ID
   */
  const deleteUser = useCallback((userId: string) => {
    deleteStorageUser(userId);
    loadUsers();
  }, [loadUsers]);

  /**
   * 更新用户
   * @param userId - 用户 ID
   * @param data - 更新的用户数据
   */
  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    updateStorageUser(userId, data);
    loadUsers();
  }, [loadUsers]);

  /**
   * 刷新用户数据
   */
  const refreshUsers = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const value: UserContextType = {
    currentUser,
    users,
    createUser,
    switchUser,
    deleteUser,
    updateUser,
    refreshUsers,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * useUser Hook
 * @returns UserContext 值
 * @throws 如果在 Provider 外使用则抛出错误
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
