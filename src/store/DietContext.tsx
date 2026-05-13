/**
 * @file DietContext.tsx
 * @description 饮食计划状态管理 Context
 * 管理用户的每日饮食记录、餐食计划和营养摄入追踪
 * V1.2.3 更新：水分自动生成、指标范围校验
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DietRecord, MealPlan, DailyNutrition, UserProfile, DailyNutritionRange } from '../types';
import { getDietRecordsByUser, addDietRecord, updateDietRecord, generateId, getCurrentUser } from '../utils/storage';
import { generateMealPlan, calculateDailyNutrition, calculateWaterTarget, calculateNutritionRanges } from '../utils/mealPlanGenerator';

/**
 * 饮食计划 Context 类型定义
 */
interface DietContextType {
  // 当前日期
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  
  // 饮食记录
  dietRecords: DietRecord[];
  refreshDietRecords: () => void;
  
  // 当前日期的饮食记录
  todayRecord: DietRecord | null;
  
  // 餐食计划
  mealPlan: MealPlan | null;
  generateDailyMealPlan: (profile: UserProfile, trainingTime?: 'morning' | 'afternoon' | 'evening' | 'rest') => MealPlan;
  
  // 营养统计
  dailyNutrition: DailyNutrition;
  
  // 营养范围（V1.2.3 新增）
  nutritionRanges: DailyNutritionRange | null;
  
  // 记录操作
  addFoodToMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodId: string, amount: number) => void;
  removeFoodFromMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodIndex: number) => void;
  updateFoodAmount: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodIndex: number, amount: number) => void;
  
  // 指标校验（V1.2.3 新增）
  validateNutritionChange: (newNutrition: DailyNutrition) => { isValid: boolean; exceededMetrics: string[] };
  
  // 加载状态
  isLoading: boolean;
}

const DietContext = createContext<DietContextType | undefined>(undefined);

/**
 * 获取日期字符串 (YYYY-MM-DD)
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 饮食计划 Provider 组件
 */
export function DietProvider({ children }: { children: React.ReactNode }) {
  // 当前选中的日期
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // 所有饮食记录
  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  
  // 当前日期的记录
  const [todayRecord, setTodayRecord] = useState<DietRecord | null>(null);
  
  // 当前餐食计划
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  
  // 每日营养统计
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    date: getDateString(new Date()),
    calories: { target: 2000, actual: 0, remaining: 2000 },
    protein: { target: 150, actual: 0, remaining: 150 },
    carbs: { target: 200, actual: 0, remaining: 200 },
    fat: { target: 65, actual: 0, remaining: 65 },
    water: { target: 2500, actual: 0, remaining: 2500 },
  });
  
  // 营养范围（V1.2.3 新增）
  const [nutritionRanges, setNutritionRanges] = useState<DailyNutritionRange | null>(null);
  
  // 加载状态
  const [isLoading] = useState<boolean>(false);

  /**
   * 刷新饮食记录列表
   */
  const refreshDietRecords = useCallback(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const records = getDietRecordsByUser(currentUser.id);
      setDietRecords(records);
    }
  }, []);

  /**
   * 初始化加载
   */
  useEffect(() => {
    refreshDietRecords();
  }, [refreshDietRecords]);

  /**
   * 当日期变化时，更新今日记录
   */
  useEffect(() => {
    const dateStr = getDateString(currentDate);
    const record = dietRecords.find(r => r.date === dateStr) || null;
    setTodayRecord(record);
    
    if (record) {
      setMealPlan(record.mealPlan);
      setDailyNutrition(record.dailyNutrition);
    } else {
      // 如果没有记录，创建空计划
      setMealPlan({
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      });
      setDailyNutrition(prev => ({
        ...prev,
        date: dateStr,
        calories: { ...prev.calories, actual: 0, remaining: prev.calories.target },
        protein: { ...prev.protein, actual: 0, remaining: prev.protein.target },
        carbs: { ...prev.carbs, actual: 0, remaining: prev.carbs.target },
        fat: { ...prev.fat, actual: 0, remaining: prev.fat.target },
        water: { ...prev.water, actual: 0, remaining: prev.water.target },
      }));
    }
  }, [currentDate, dietRecords]);

  /**
   * 生成每日餐食计划
   */
  const generateDailyMealPlan = useCallback((
    profile: UserProfile,
    trainingTime: 'morning' | 'afternoon' | 'evening' | 'rest' = 'rest'
  ): MealPlan => {
    const newMealPlan = generateMealPlan(profile, trainingTime);
    setMealPlan(newMealPlan);
    
    // 计算营养统计（包含水分）
    const nutrition = calculateDailyNutrition(newMealPlan, profile);
    
    // 计算水分目标（V1.2.3 自动生成）
    const waterTarget = calculateWaterTarget(profile, trainingTime);
    nutrition.water = {
      target: waterTarget,
      actual: waterTarget, // 自动生成即达标
      remaining: 0,
    };
    
    setDailyNutrition(nutrition);
    
    // 计算营养范围（V1.2.3 新增）
    const ranges = calculateNutritionRanges(nutrition);
    setNutritionRanges(ranges);
    
    // 保存到记录
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      const record: DietRecord = {
        id: existingRecord?.id || generateId(),
        userId: currentUser.id,
        date: dateStr,
        mealPlan: newMealPlan,
        dailyNutrition: nutrition,
        waterIntake: waterTarget, // V1.2.3 水分自动生成
        createdAt: existingRecord?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      
      addDietRecord(record);
      refreshDietRecords();
    }
    
    return newMealPlan;
  }, [currentDate, dietRecords, refreshDietRecords]);

  /**
   * 添加食物到餐食
   */
  const addFoodToMeal = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodId: string,
    amount: number
  ) => {
    if (!mealPlan) return;
    
    const updatedPlan = { ...mealPlan };
    updatedPlan[mealType] = [...updatedPlan[mealType], { foodId, amount }];
    
    setMealPlan(updatedPlan);
    
    // 更新记录
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (existingRecord && currentUser) {
      const updatedRecord: DietRecord = {
        ...existingRecord,
        mealPlan: updatedPlan,
        updatedAt: Date.now(),
      };
      updateDietRecord(currentUser.id, dateStr, updatedRecord);
      refreshDietRecords();
    }
  }, [mealPlan, currentDate, dietRecords, refreshDietRecords]);

  /**
   * 从餐食中移除食物
   */
  const removeFoodFromMeal = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodIndex: number
  ) => {
    if (!mealPlan) return;
    
    const updatedPlan = { ...mealPlan };
    updatedPlan[mealType] = updatedPlan[mealType].filter((_, index) => index !== foodIndex);
    
    setMealPlan(updatedPlan);
    
    // 更新记录
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (existingRecord && currentUser) {
      const updatedRecord: DietRecord = {
        ...existingRecord,
        mealPlan: updatedPlan,
        updatedAt: Date.now(),
      };
      updateDietRecord(currentUser.id, dateStr, updatedRecord);
      refreshDietRecords();
    }
  }, [mealPlan, currentDate, dietRecords, refreshDietRecords]);

  /**
   * 更新食物份量
   */
  const updateFoodAmount = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodIndex: number,
    amount: number
  ) => {
    if (!mealPlan) return;
    
    const updatedPlan = { ...mealPlan };
    updatedPlan[mealType] = updatedPlan[mealType].map((item, index) =>
      index === foodIndex ? { ...item, amount } : item
    );
    
    setMealPlan(updatedPlan);
    
    // 更新记录
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (existingRecord && currentUser) {
      const updatedRecord: DietRecord = {
        ...existingRecord,
        mealPlan: updatedPlan,
        updatedAt: Date.now(),
      };
      updateDietRecord(currentUser.id, dateStr, updatedRecord);
      refreshDietRecords();
    }
  }, [mealPlan, currentDate, dietRecords, refreshDietRecords]);

  /**
   * 校验营养变化是否在合理范围内（V1.2.3 新增）
   */
  const validateNutritionChange = useCallback((
    newNutrition: DailyNutrition
  ): { isValid: boolean; exceededMetrics: string[] } => {
    if (!nutritionRanges) {
      return { isValid: true, exceededMetrics: [] };
    }
    
    const exceededMetrics: string[] = [];
    
    // 检查各项指标是否超出范围
    if (newNutrition.calories.actual < nutritionRanges.calories.min || 
        newNutrition.calories.actual > nutritionRanges.calories.max) {
      exceededMetrics.push('热量');
    }
    if (newNutrition.protein.actual < nutritionRanges.protein.min || 
        newNutrition.protein.actual > nutritionRanges.protein.max) {
      exceededMetrics.push('蛋白质');
    }
    if (newNutrition.carbs.actual < nutritionRanges.carbs.min || 
        newNutrition.carbs.actual > nutritionRanges.carbs.max) {
      exceededMetrics.push('碳水');
    }
    if (newNutrition.fat.actual < nutritionRanges.fat.min || 
        newNutrition.fat.actual > nutritionRanges.fat.max) {
      exceededMetrics.push('脂肪');
    }
    
    return {
      isValid: exceededMetrics.length === 0,
      exceededMetrics,
    };
  }, [nutritionRanges]);

  const value: DietContextType = {
    currentDate,
    setCurrentDate,
    dietRecords,
    refreshDietRecords,
    todayRecord,
    mealPlan,
    generateDailyMealPlan,
    dailyNutrition,
    nutritionRanges,
    addFoodToMeal,
    removeFoodFromMeal,
    updateFoodAmount,
    validateNutritionChange,
    isLoading,
  };

  return <DietContext.Provider value={value}>{children}</DietContext.Provider>;
}

/**
 * 使用 DietContext 的 Hook
 */
export function useDiet(): DietContextType {
  const context = useContext(DietContext);
  if (context === undefined) {
    throw new Error('useDiet must be used within a DietProvider');
  }
  return context;
}
