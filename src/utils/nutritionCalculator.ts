/**
 * 营养计算工具
 * @description 基于 Mifflin-St Jeor 公式计算卡路里和宏量营养素
 */

import type {
  UserProfile,
  DailyNutritionTarget,
  MealCalorieSplit,
} from '../types';

/**
 * 计算基础代谢率（BMR）
 * Mifflin-St Jeor 公式
 */
export function calculateBMR(profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'currentWeight'>): number {
  const { gender, age, height, currentWeight: weight } = profile;

  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * 活动系数
 */
const ACTIVITY_FACTORS: Record<number, number> = {
  2: 1.375,  // 轻度活动
  3: 1.55,   // 中度活动
  4: 1.55,   // 中度活动
  5: 1.725,  // 高度活动
  6: 1.725,  // 高度活动
};

/**
 * 计算每日总消耗（TDEE）
 */
export function calculateTDEE(
  profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'currentWeight' | 'trainingDays'>
): number {
  const bmr = calculateBMR(profile);
  const activityFactor = ACTIVITY_FACTORS[profile.trainingDays] || 1.375;
  return Math.round(bmr * activityFactor);
}

/**
 * 目标卡路里调整值
 */
const GOAL_ADJUSTMENTS: Record<string, { min: number; max: number }> = {
  muscle: { min: 300, max: 500 },
  fat_loss: { min: -500, max: -300 },
  shape: { min: -200, max: 200 },
  maintain: { min: 0, max: 0 },
};

/**
 * 计算每日目标卡路里
 */
export function calculateTargetCalories(
  profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'currentWeight' | 'trainingDays' | 'goal'>
): number {
  const tdee = calculateTDEE(profile);
  const adjustment = GOAL_ADJUSTMENTS[profile.goal] || { min: 0, max: 0 };
  // 取调整范围中间值
  const avgAdjustment = Math.round((adjustment.min + adjustment.max) / 2);
  return Math.round(tdee + avgAdjustment);
}

/**
 * 蛋白质系数（g/kg体重）
 */
const PROTEIN_FACTORS: Record<string, { min: number; max: number }> = {
  muscle: { min: 2.0, max: 2.2 },
  fat_loss: { min: 2.2, max: 2.5 },
  shape: { min: 1.6, max: 2.0 },
  maintain: { min: 1.6, max: 2.0 },
};

/**
 * 计算每日营养目标
 */
export function calculateNutritionTargets(
  profile: Pick<UserProfile, 'gender' | 'age' | 'height' | 'currentWeight' | 'trainingDays' | 'goal'>
): DailyNutritionTarget {
  const targetCalories = calculateTargetCalories(profile);
  const weight = profile.currentWeight;

  // 蛋白质
  const proteinFactor = PROTEIN_FACTORS[profile.goal] || { min: 1.6, max: 2.0 };
  const protein = Math.round(((proteinFactor.min + proteinFactor.max) / 2) * weight);

  // 脂肪（占总热量 25%）
  const fatCalories = targetCalories * 0.25;
  const fat = Math.round(fatCalories / 9); // 1g 脂肪 = 9 kcal
  const minFat = Math.round(weight * 0.6);
  const finalFat = Math.max(fat, minFat);

  // 碳水（剩余热量）
  const proteinCalories = protein * 4;
  const fatCaloriesFinal = finalFat * 9;
  const carbCalories = targetCalories - proteinCalories - fatCaloriesFinal;
  const carbs = Math.round(Math.max(carbCalories / 4, 50)); // 最低 50g

  return {
    calories: targetCalories,
    protein,
    fat: finalFat,
    carbs,
  };
}

/**
 * 计算三餐卡路里分配
 * 根据用户主要训练时间动态调整
 */
export function calculateMealSplit(profile: Pick<UserProfile, 'trainingTime'>): MealCalorieSplit {
  switch (profile.trainingTime) {
    case 'morning':
      return { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snacks: 0.10 };
    case 'noon':
      return { breakfast: 0.30, lunch: 0.35, dinner: 0.35, snacks: 0.00 };
    case 'evening':
      return { breakfast: 0.30, lunch: 0.35, dinner: 0.35, snacks: 0.00 };
    default:
      return { breakfast: 0.30, lunch: 0.40, dinner: 0.30, snacks: 0.00 };
  }
}

/**
 * 计算各餐营养目标
 */
export function calculateMealTargets(
  dailyTarget: DailyNutritionTarget,
  split: MealCalorieSplit
): { breakfast: DailyNutritionTarget; lunch: DailyNutritionTarget; dinner: DailyNutritionTarget; snacks: DailyNutritionTarget } {
  const calcMeal = (ratio: number): DailyNutritionTarget => ({
    calories: Math.round(dailyTarget.calories * ratio),
    protein: Math.round(dailyTarget.protein * ratio),
    fat: Math.round(dailyTarget.fat * ratio),
    carbs: Math.round(dailyTarget.carbs * ratio),
  });

  return {
    breakfast: calcMeal(split.breakfast),
    lunch: calcMeal(split.lunch),
    dinner: calcMeal(split.dinner),
    snacks: calcMeal(split.snacks),
  };
}

/**
 * 营养素标签映射
 */
export const nutritionLabels = {
  calories: '热量',
  protein: '蛋白质',
  fat: '脂肪',
  carbs: '碳水',
} as const;

/**
 * 营养素单位映射
 */
export const nutritionUnits = {
  calories: 'kcal',
  protein: 'g',
  fat: 'g',
  carbs: 'g',
} as const;

/**
 * 宏量营养素目标类型
 */
export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 根据卡路里和目标计算宏量营养素
 * 简化版，用于 mealPlanGenerator
 */
export function calculateMacroTargets(calories: number, goal: string): MacroTargets {
  const PROTEIN_RATIOS: Record<string, number> = {
    muscle: 0.30,
    fat_loss: 0.40,
    shape: 0.30,
    maintain: 0.25,
  };
  
  const FAT_RATIOS: Record<string, number> = {
    muscle: 0.25,
    fat_loss: 0.25,
    shape: 0.25,
    maintain: 0.30,
  };
  
  const proteinRatio = PROTEIN_RATIOS[goal] || 0.30;
  const fatRatio = FAT_RATIOS[goal] || 0.25;
  const carbRatio = 1 - proteinRatio - fatRatio;
  
  const proteinCalories = calories * proteinRatio;
  const fatCalories = calories * fatRatio;
  const carbCalories = calories * carbRatio;
  
  return {
    calories,
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbCalories / 4),
    fat: Math.round(fatCalories / 9),
  };
}

/**
 * 餐食分配比例
 */
export function distributeMeals(calories: number): { breakfast: number; lunch: number; dinner: number; snack: number } {
  return {
    breakfast: Math.round(calories * 0.25),
    lunch: Math.round(calories * 0.35),
    dinner: Math.round(calories * 0.30),
    snack: Math.round(calories * 0.10),
  };
}
