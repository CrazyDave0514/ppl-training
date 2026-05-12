/**
 * 训练记录 Context
 * @description 管理训练会话的创建和保存
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { TrainingSession, TrainingPlan, SessionExercise } from '../types';
import { addSession } from '../utils/storage';
import { useUser } from './UserContext';

/**
 * SessionContext 类型定义
 */
interface SessionContextType {
  /** 当前训练会话 */
  currentSession: TrainingSession | null;
  /** 是否正在训练中 */
  isTraining: boolean;
  /** 开始训练（基于计划） */
  startTraining: (plan: TrainingPlan) => TrainingSession;
  /** 开始自由训练 */
  startFreeTraining: (type: TrainingPlan['type'], name: string) => TrainingSession;
  /** 更新训练记录 */
  updateSession: (session: TrainingSession) => void;
  /** 完成训练并保存 */
  finishTraining: () => void;
  /** 取消训练 */
  cancelTraining: () => void;
}

// 创建 Context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * 生成唯一 ID
 * @returns UUID 字符串
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * SessionProvider 组件
 * @param children - 子组件
 */
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  /**
   * 开始训练（基于计划）
   * @param plan - 训练计划
   * @returns 训练会话对象
   */
  const startTraining = useCallback((plan: TrainingPlan): TrainingSession => {
    if (!currentUser) {
      throw new Error('未登录用户不能开始训练');
    }

    const today = new Date().toISOString().split('T')[0];

    // 从计划生成训练动作
    const exercises: SessionExercise[] = plan.exercises.map(planEx => ({
      id: planEx.id,
      name: planEx.name,
      sets: Array(planEx.defaultSets ?? 3).fill(null).map(() => ({
        reps: planEx.defaultReps ?? 10,
        weight: planEx.defaultWeight ?? 0,
      })),
      isFromPlan: true,
      libraryId: planEx.libraryId ?? null,
    }));

    const session: TrainingSession = {
      id: `session-${generateId()}`,
      userId: currentUser.id,
      planId: plan.id,
      planName: plan.name,
      type: plan.type,
      date: today,
      exercises,
      createdAt: new Date().toISOString(),
    };

    setCurrentSession(session);
    setIsTraining(true);
    return session;
  }, [currentUser]);

  /**
   * 开始自由训练
   * @param type - 训练类型
   * @param name - 训练名称
   * @returns 训练会话对象
   */
  const startFreeTraining = useCallback((type: TrainingPlan['type'], name: string): TrainingSession => {
    if (!currentUser) {
      throw new Error('未登录用户不能开始训练');
    }

    const today = new Date().toISOString().split('T')[0];

    const session: TrainingSession = {
      id: `session-${generateId()}`,
      userId: currentUser.id,
      planId: null,
      planName: name,
      type,
      date: today,
      exercises: [],
      createdAt: new Date().toISOString(),
    };

    setCurrentSession(session);
    setIsTraining(true);
    return session;
  }, [currentUser]);

  /**
   * 更新训练记录
   * @param session - 更新后的训练会话
   */
  const updateSession = useCallback((session: TrainingSession) => {
    setCurrentSession(session);
  }, []);

  /**
   * 完成训练并保存
   */
  const finishTraining = useCallback(() => {
    if (currentSession && currentUser) {
      // 过滤掉没有完成任何组的训练动作
      const validExercises = currentSession.exercises.filter(ex => 
        ex.sets.length > 0
      );
      
      if (validExercises.length > 0) {
        const sessionToSave = {
          ...currentSession,
          exercises: validExercises,
        };
        addSession(currentUser.id, sessionToSave);
      }
      
      setCurrentSession(null);
      setIsTraining(false);
    }
  }, [currentSession, currentUser]);

  /**
   * 取消训练
   */
  const cancelTraining = useCallback(() => {
    setCurrentSession(null);
    setIsTraining(false);
  }, []);

  const value: SessionContextType = {
    currentSession,
    isTraining,
    startTraining,
    startFreeTraining,
    updateSession,
    finishTraining,
    cancelTraining,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

/**
 * useSession Hook
 * @returns SessionContext 值
 * @throws 如果在 Provider 外使用则抛出错误
 */
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;
