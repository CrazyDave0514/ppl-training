/**
 * 用户画像 Context
 * @description 管理用户画像（问卷数据），提供创建/更新/查询功能
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserProfile } from '../types';
import {
  getUserProfile,
  setUserProfile,
  deleteUserProfile,
} from '../utils/storage';
import { useUser } from './UserContext';

/**
 * ProfileContext 类型定义
 */
interface ProfileContextType {
  /** 当前用户的画像 */
  profile: UserProfile | null;
  /** 是否已完成画像 */
  hasProfile: boolean;
  /** 创建或更新画像 */
  saveProfile: (profile: Omit<UserProfile, 'completedAt'>) => void;
  /** 删除画像 */
  deleteProfile: () => void;
  /** 刷新画像数据 */
  refreshProfile: () => void;
}

// 创建 Context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

/**
 * ProfileProvider 组件
 * @param children - 子组件
 */
export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  /**
   * 从存储加载用户画像
   */
  const loadProfile = useCallback(() => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const storedProfile = getUserProfile(currentUser.id);
    setProfile(storedProfile || null);
  }, [currentUser]);

  // 初始化加载 + 用户切换时重新加载
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * 创建或更新画像
   * @param profileData - 画像数据（不含 completedAt）
   */
  const saveProfile = useCallback(
    (profileData: Omit<UserProfile, 'completedAt'>) => {
      if (!currentUser) return;
      const newProfile: UserProfile = {
        ...profileData,
        completedAt: new Date().toISOString(),
      };
      setUserProfile(currentUser.id, newProfile);
      setProfile(newProfile);
    },
    [currentUser]
  );

  /**
   * 删除画像
   */
  const deleteProfile = useCallback(() => {
    if (!currentUser) return;
    deleteUserProfile(currentUser.id);
    setProfile(null);
  }, [currentUser]);

  /**
   * 刷新画像数据
   */
  const refreshProfile = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  const value: ProfileContextType = {
    profile,
    hasProfile: !!profile,
    saveProfile,
    deleteProfile,
    refreshProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

/**
 * useProfile Hook
 * @returns ProfileContext 值
 * @throws 如果在 Provider 外使用则抛出错误
 */
export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;
