/**
 * 计划管理 Context
 * @description 管理训练计划的 CRUD 和从模板生成计划
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { TrainingPlan, TrainingType, DifficultyLevel, Exercise } from '../types';
import {
  getPlansByUser,
  addPlan as addStoragePlan,
  updatePlan as updateStoragePlan,
  deletePlan as deleteStoragePlan,
} from '../utils/storage';
import { getTemplate } from '../data/planTemplates';
import { getExerciseById } from '../data/exerciseLibrary';
import { useUser } from './UserContext';

/**
 * PlanContext 类型定义
 */
interface PlanContextType {
  /** 当前用户的所有计划 */
  plans: TrainingPlan[];
  /** 创建计划（手动） */
  createPlan: (plan: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>) => TrainingPlan;
  /** 从模板创建计划 */
  createPlanFromTemplate: (
    name: string,
    type: TrainingType,
    level: DifficultyLevel
  ) => TrainingPlan | null;
  /** 更新计划 */
  updatePlan: (plan: TrainingPlan) => void;
  /** 删除计划 */
  deletePlan: (planId: string) => void;
  /** 获取计划详情 */
  getPlan: (planId: string) => TrainingPlan | undefined;
  /** 重新加载计划 */
  refreshPlans: () => void;
}

// 创建 Context
const PlanContext = createContext<PlanContextType | undefined>(undefined);

/**
 * 生成唯一 ID
 * @returns UUID 字符串
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * PlanProvider 组件
 * @param children - 子组件
 */
export const PlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);

  /**
   * 从存储加载计划数据
   */
  const loadPlans = useCallback(() => {
    if (currentUser) {
      const userPlans = getPlansByUser(currentUser.id);
      setPlans(userPlans);
    } else {
      setPlans([]);
    }
  }, [currentUser]);

  // 初始化加载
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /**
   * 创建计划（手动）
   * @param planData - 计划数据（不含 id 和时间戳）
   * @returns 创建的计划对象
   */
  const createPlan = useCallback(
    (planData: Omit<TrainingPlan, 'id' | 'createdAt' | 'updatedAt'>): TrainingPlan => {
      const newPlan: TrainingPlan = {
        ...planData,
        id: `plan-${generateId()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dayOfWeek: [],
      };
      addStoragePlan(planData.userId, newPlan);
      loadPlans();
      return newPlan;
    },
    [loadPlans]
  );

  /**
   * 从模板创建计划
   * @param name - 计划名称
   * @param type - 训练类型
   * @param level - 难度级别
   * @returns 创建的计划对象或 null
   */
  const createPlanFromTemplate = useCallback(
    (name: string, type: TrainingType, level: DifficultyLevel): TrainingPlan | null => {
      if (!currentUser) return null;

      const template = getTemplate(type, level);
      if (!template) return null;

      // 从模板生成动作列表
      const exercises: Exercise[] = template.exercises.map(templateEx => {
        const libraryItem = getExerciseById(templateEx.libraryId);
        return {
          id: `ex-${generateId()}`,
          name: libraryItem?.name || '未知动作',
          defaultSets: templateEx.sets,
          defaultReps: templateEx.reps,
          defaultWeight: 0,
          libraryId: templateEx.libraryId,
        };
      });

      const newPlan: TrainingPlan = {
        id: `plan-${generateId()}`,
        userId: currentUser.id,
        name: name.trim() || template.name,
        type: template.type,
        source: 'template',
        exercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dayOfWeek: [],
      };

      addStoragePlan(currentUser.id, newPlan);
      loadPlans();
      return newPlan;
    },
    [currentUser, loadPlans]
  );

  /**
   * 更新计划
   * @param plan - 更新后的计划对象
   */
  const updatePlan = useCallback(
    (plan: TrainingPlan) => {
      const updatedPlan = { ...plan, updatedAt: new Date().toISOString() };
      updateStoragePlan(plan.userId, updatedPlan);
      loadPlans();
    },
    [loadPlans]
  );

  /**
   * 删除计划
   * @param planId - 计划 ID
   */
  const deletePlan = useCallback(
    (planId: string) => {
      if (!currentUser) return;
      deleteStoragePlan(currentUser.id, planId);
      loadPlans();
    },
    [currentUser, loadPlans]
  );

  /**
   * 获取计划详情
   * @param planId - 计划 ID
   * @returns 计划对象或 undefined
   */
  const getPlan = useCallback(
    (planId: string): TrainingPlan | undefined => {
      return plans.find(p => p.id === planId);
    },
    [plans]
  );

  /**
   * 刷新计划数据
   */
  const refreshPlans = useCallback(() => {
    loadPlans();
  }, [loadPlans]);

  const value: PlanContextType = {
    plans,
    createPlan,
    createPlanFromTemplate,
    updatePlan,
    deletePlan,
    getPlan,
    refreshPlans,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

/**
 * usePlan Hook
 * @returns PlanContext 值
 * @throws 如果在 Provider 外使用则抛出错误
 */
export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};

export default PlanContext;
