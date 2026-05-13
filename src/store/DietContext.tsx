/**
 * @file DietContext.tsx
 * @description 饮食计划状态管理 Context
 * 管理用户的每日饮食记录、餐食计划和营养摄入追踪
 * V1.2.3 更新：周维度展示、饮食打卡、删除功能、圆环进度
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { 
  DietRecord, 
  MealPlan, 
  DailyNutrition, 
  UserProfile, 
  DailyNutritionRanges,
  WeeklyDietPlan,
  TrainingType,
  CompletedMeals,
} from '../types';
import { getFoodById } from '../data/foodDatabase';
import { 
  getDietRecordsByUser, 
  addDietRecord, 
  updateDietRecord, 
  deleteDietRecord,
  generateId, 
  getCurrentUser,
} from '../utils/storage';
import { 
  generateMealPlan, 
  calculateDailyNutrition, 
  calculateWaterTarget, 
  calculateNutritionRanges 
} from '../utils/mealPlanGenerator';

/**
 * 饮食计划 Context 类型定义
 */
interface DietContextType {
  // 当前选中日期
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  
  // 当前选中的星期（1=周一, 7=周日）
  selectedDayOfWeek: number;
  setSelectedDayOfWeek: (day: number) => void;
  
  // 饮食记录列表
  dietRecords: DietRecord[];
  refreshDietRecords: () => void;
  
  // 当前选中日期的饮食记录
  todayRecord: DietRecord | null;
  
  // 当前选中日期的餐食计划
  mealPlan: MealPlan | null;
  
  // 当前选中日期的营养统计
  dailyNutrition: DailyNutrition;
  
  // 营养范围
  nutritionRanges: DailyNutritionRanges | null;
  
  // 周维度数据
  weeklyDietPlan: WeeklyDietPlan | null;
  
  // 生成操作
  generateDailyMealPlan: (profile: UserProfile, trainingType?: TrainingType | 'rest') => MealPlan;
  generateWeeklyMealPlan: (profile: UserProfile, plans: { dayOfWeek: number; trainingType: TrainingType | 'rest' }[]) => void;
  
  // 记录操作（增删改查）
  addFoodToMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodId: string, amount: number) => void;
  removeFoodFromMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodIndex: number) => void;
  updateFoodAmount: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodIndex: number, amount: number) => void;
  
  // 删除单日饮食计划
  deleteDailyDietPlan: (date: string) => void;
  
  // 打卡功能（V1.2.3 更新 - 按餐食打卡）
  checkInMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  uncheckInMeal: (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  isCheckedIn: boolean;
  completedMeals: CompletedMeals;
  actualNutrition: DailyNutrition;
  getCurrentMealType: () => 'breakfast' | 'lunch' | 'dinner' | 'snack';
  
  // 指标校验
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
 * 获取日期对应的星期（1=周一, 7=周日）
 */
function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day; // 周日转为 7
}

/**
 * 获取本周周一日期
 */
function getWeekStartDate(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 饮食计划 Provider 组件
 */
export function DietProvider({ children }: { children: React.ReactNode }) {
  // 当前选中的日期
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // 当前选中的星期
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(getDayOfWeek(new Date()));
  
  // 所有饮食记录
  const [dietRecords, setDietRecords] = useState<DietRecord[]>([]);
  
  // 当前选中日期的记录
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
  
  // 营养范围
  const [nutritionRanges, setNutritionRanges] = useState<DailyNutritionRanges | null>(null);
  
  // 周饮食计划
  const [weeklyDietPlan, setWeeklyDietPlan] = useState<WeeklyDietPlan | null>(null);
  
  // 是否已打卡
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  
  // 各餐食完成状态（V1.2.3 新增 - 按餐食打卡）
  const [completedMeals, setCompletedMeals] = useState<CompletedMeals>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });
  
  // 实际摄入营养（根据已完成餐食计算）
  const [actualNutrition, setActualNutrition] = useState<DailyNutrition>({
    date: getDateString(new Date()),
    calories: { target: 2000, actual: 0, remaining: 2000 },
    protein: { target: 150, actual: 0, remaining: 150 },
    carbs: { target: 200, actual: 0, remaining: 200 },
    fat: { target: 65, actual: 0, remaining: 65 },
    water: { target: 2500, actual: 0, remaining: 2500 },
  });
  
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
   * 计算实际摄入营养（根据已完成餐食）
   */
  const calculateActualNutrition = useCallback((
    mealPlan: MealPlan,
    completed: CompletedMeals,
    targets: DailyNutrition
  ): DailyNutrition => {
    const mealTypes: (keyof MealPlan)[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    let actualCalories = 0;
    let actualProtein = 0;
    let actualCarbs = 0;
    let actualFat = 0;
    
    mealTypes.forEach(mealType => {
      if (completed[mealType]) {
        mealPlan[mealType].forEach(item => {
          const food = getFoodById(item.foodId);
          if (food) {
            const ratio = item.amount / 100;
            actualCalories += food.calories * ratio;
            actualProtein += food.protein * ratio;
            actualCarbs += food.carbs * ratio;
            actualFat += food.fat * ratio;
          }
        });
      }
    });
    
    return {
      date: targets.date,
      calories: {
        target: targets.calories.target,
        actual: Math.round(actualCalories),
        remaining: Math.round(targets.calories.target - actualCalories),
      },
      protein: {
        target: targets.protein.target,
        actual: Math.round(actualProtein),
        remaining: Math.round(targets.protein.target - actualProtein),
      },
      carbs: {
        target: targets.carbs.target,
        actual: Math.round(actualCarbs),
        remaining: Math.round(targets.carbs.target - actualCarbs),
      },
      fat: {
        target: targets.fat.target,
        actual: Math.round(actualFat),
        remaining: Math.round(targets.fat.target - actualFat),
      },
      water: { ...targets.water },
    };
  }, []);

  /**
   * 当日期变化时，更新今日记录
   */
  useEffect(() => {
    const dateStr = getDateString(currentDate);
    const record = dietRecords.find(r => r.date === dateStr) || null;
    setTodayRecord(record);
    setIsCheckedIn(record?.isChecked || false);
    
    // 恢复各餐完成状态
    const mealsStatus = record?.completedMeals || {
      breakfast: false,
      lunch: false,
      dinner: false,
      snack: false,
    };
    setCompletedMeals(mealsStatus);
    
    if (record) {
      setMealPlan(record.mealPlan);
      setDailyNutrition(record.dailyNutrition);
      // 计算实际摄入
      const actual = calculateActualNutrition(record.mealPlan, mealsStatus, record.dailyNutrition);
      setActualNutrition(actual);
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
      setActualNutrition(prev => ({
        ...prev,
        date: dateStr,
        calories: { ...prev.calories, actual: 0, remaining: prev.calories.target },
        protein: { ...prev.protein, actual: 0, remaining: prev.protein.target },
        carbs: { ...prev.carbs, actual: 0, remaining: prev.carbs.target },
        fat: { ...prev.fat, actual: 0, remaining: prev.fat.target },
      }));
    }
  }, [currentDate, dietRecords, calculateActualNutrition]);

  /**
   * 当星期变化时，更新日期
   */
  useEffect(() => {
    const weekStart = getWeekStartDate(new Date());
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + selectedDayOfWeek - 1);
    setCurrentDate(newDate);
  }, [selectedDayOfWeek]);

  /**
   * 生成周饮食计划（V1.2.3 新增）
   */
  const generateWeeklyMealPlan = useCallback((
    profile: UserProfile,
    dayTrainingMap: { dayOfWeek: number; trainingType: TrainingType | 'rest' }[]
  ) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const weekStart = getWeekStartDate(new Date());
    const newWeeklyPlan: WeeklyDietPlan = {
      id: generateId(),
      userId: currentUser.id,
      weekStartDate: getDateString(weekStart),
      dailyPlans: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // 为每一天生成饮食计划
    for (let day = 1; day <= 7; day++) {
      const dayInfo = dayTrainingMap.find(d => d.dayOfWeek === day);
      const trainingType = dayInfo?.trainingType || 'rest';
      
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + day - 1);
      const dateStr = getDateString(dayDate);
      
      // 将训练类型映射为训练时间（用于餐食分配）
      const trainingTime = trainingType === 'rest' ? 'rest' : 'evening';
      
      // 生成当日餐食计划
      const mealPlan = generateMealPlan(profile, trainingTime);
      const nutrition = calculateDailyNutrition(mealPlan, profile);
      const waterTarget = calculateWaterTarget(profile, trainingTime);
      nutrition.water = {
        target: waterTarget,
        actual: waterTarget,
        remaining: 0,
      };
      
      // 保存记录
      const record: DietRecord = {
        id: generateId(),
        userId: currentUser.id,
        date: dateStr,
        mealPlan,
        dailyNutrition: nutrition,
        waterIntake: waterTarget,
        isChecked: false,
        completedMeals: {
          breakfast: false,
          lunch: false,
          dinner: false,
          snack: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addDietRecord(record);
      
      // 更新周计划
      newWeeklyPlan.dailyPlans[day] = {
        date: dateStr,
        trainingType,
        meals: mealPlan,
        nutritionTarget: {
          calories: nutrition.calories.target,
          protein: nutrition.protein.target,
          fat: nutrition.fat.target,
          carbs: nutrition.carbs.target,
        },
        isGenerated: true,
        isChecked: false,
      };
    }
    
    setWeeklyDietPlan(newWeeklyPlan);
    refreshDietRecords();
  }, [refreshDietRecords]);

  /**
   * 生成每日餐食计划
   */
  const generateDailyMealPlan = useCallback((
    profile: UserProfile,
    trainingType: TrainingType | 'rest' = 'rest'
  ): MealPlan => {
    // 将训练类型映射为训练时间
    const trainingTime = trainingType === 'rest' ? 'rest' : 'evening';
    
    const newMealPlan = generateMealPlan(profile, trainingTime);
    setMealPlan(newMealPlan);
    
    // 计算营养统计（包含水分）
    const nutrition = calculateDailyNutrition(newMealPlan, profile);
    
    // 计算水分目标
    const waterTarget = calculateWaterTarget(profile, trainingTime);
    nutrition.water = {
      target: waterTarget,
      actual: waterTarget,
      remaining: 0,
    };
    
    setDailyNutrition(nutrition);
    
    // 计算营养范围
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
        waterIntake: waterTarget,
        isChecked: existingRecord?.isChecked || false,
        completedMeals: existingRecord?.completedMeals || {
          breakfast: false,
          lunch: false,
          dinner: false,
          snack: false,
        },
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
   * 删除单日饮食计划（V1.2.3 新增）
   */
  const deleteDailyDietPlan = useCallback((
    date: string
  ) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    deleteDietRecord(currentUser.id, date);
    refreshDietRecords();
    
    // 如果删除的是当前选中日期，清空当前数据
    if (date === getDateString(currentDate)) {
      setMealPlan({
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      });
      setDailyNutrition({
        date,
        calories: { target: 0, actual: 0, remaining: 0 },
        protein: { target: 0, actual: 0, remaining: 0 },
        carbs: { target: 0, actual: 0, remaining: 0 },
        fat: { target: 0, actual: 0, remaining: 0 },
        water: { target: 0, actual: 0, remaining: 0 },
      });
      setIsCheckedIn(false);
    }
  }, [currentDate, refreshDietRecords]);

  /**
   * 按餐食打卡（V1.2.3 更新 - 支持单餐打卡）
   */
  const checkInMeal = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (!currentUser || !existingRecord) return;
    
    // 更新该餐完成状态
    const newCompletedMeals = {
      ...completedMeals,
      [mealType]: true,
    };
    
    // 检查是否所有餐都已完成
    const allCompleted = Object.values(newCompletedMeals).every(v => v);
    
    const updatedRecord: DietRecord = {
      ...existingRecord,
      completedMeals: newCompletedMeals,
      isChecked: allCompleted,
      updatedAt: Date.now(),
    };
    
    updateDietRecord(currentUser.id, dateStr, updatedRecord);
    setCompletedMeals(newCompletedMeals);
    setIsCheckedIn(allCompleted);
    
    // 重新计算实际摄入
    const actual = calculateActualNutrition(existingRecord.mealPlan, newCompletedMeals, existingRecord.dailyNutrition);
    setActualNutrition(actual);
    
    refreshDietRecords();
  }, [currentDate, dietRecords, completedMeals, calculateActualNutrition, refreshDietRecords]);

  /**
   * 取消单餐打卡（V1.2.3 新增）
   */
  const uncheckInMeal = useCallback((
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => {
    const dateStr = getDateString(currentDate);
    const existingRecord = dietRecords.find(r => r.date === dateStr);
    const currentUser = getCurrentUser();
    
    if (!currentUser || !existingRecord) return;
    
    // 更新该餐完成状态
    const newCompletedMeals = {
      ...completedMeals,
      [mealType]: false,
    };
    
    const updatedRecord: DietRecord = {
      ...existingRecord,
      completedMeals: newCompletedMeals,
      isChecked: false,
      updatedAt: Date.now(),
    };
    
    updateDietRecord(currentUser.id, dateStr, updatedRecord);
    setCompletedMeals(newCompletedMeals);
    setIsCheckedIn(false);
    
    // 重新计算实际摄入
    const actual = calculateActualNutrition(existingRecord.mealPlan, newCompletedMeals, existingRecord.dailyNutrition);
    setActualNutrition(actual);
    
    refreshDietRecords();
  }, [currentDate, dietRecords, completedMeals, calculateActualNutrition, refreshDietRecords]);

  /**
   * 获取当前时段（根据时间判断）
   */
  const getCurrentMealType = useCallback((): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 10 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 18) return 'snack';
    return 'dinner';
  }, []);

  /**
   * 校验营养变化是否在合理范围内
   */
  const validateNutritionChange = useCallback((
    newNutrition: DailyNutrition
  ): { isValid: boolean; exceededMetrics: string[] } => {
    if (!nutritionRanges) {
      return { isValid: true, exceededMetrics: [] };
    }
    
    const exceededMetrics: string[] = [];
    
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
    selectedDayOfWeek,
    setSelectedDayOfWeek,
    dietRecords,
    refreshDietRecords,
    todayRecord,
    mealPlan,
    dailyNutrition,
    nutritionRanges,
    weeklyDietPlan,
    generateDailyMealPlan,
    generateWeeklyMealPlan,
    addFoodToMeal,
    removeFoodFromMeal,
    updateFoodAmount,
    deleteDailyDietPlan,
    checkInMeal,
    uncheckInMeal,
    isCheckedIn,
    completedMeals,
    actualNutrition,
    getCurrentMealType,
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
