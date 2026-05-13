/**
 * @file mealPlanGenerator.ts
 * @description 饮食计划生成器
 * 根据用户画像和训练时间生成个性化的每日餐食计划
 * 使用 Mifflin-St Jeor 公式计算卡路里需求
 * V1.2.3 更新：水分自动生成、营养范围计算
 */

import type { UserProfile, MealPlan, DailyNutrition, MealItem, DailyNutritionRanges, NutritionRange } from '../types';
import { foodDatabase, getFoodsByCategory } from '../data/foodDatabase';
import { 
  calculateBMR, 
  calculateMacroTargets
} from './nutritionCalculator';

/**
 * 训练时间类型
 */
type TrainingTime = 'morning' | 'afternoon' | 'evening' | 'rest';

/**
 * 生成每日餐食计划
 * @description V1.2.3 更新：根据营养目标动态调整食物分量，确保全打卡后圆环打满
 * @param profile - 用户画像
 * @param trainingTime - 训练时间（影响餐食分配）
 * @returns 餐食计划
 */
export function generateMealPlan(
  profile: UserProfile,
  trainingTime: TrainingTime = 'rest'
): MealPlan {
  // 1. 计算每日营养目标
  const targets = calculateDailyTargets(profile);
  
  // 2. 根据训练时间分配每餐营养比例
  const mealDistribution = getMealDistribution(trainingTime);
  
  // 3. 计算每餐的营养目标
  const mealTargets = {
    breakfast: {
      calories: Math.round(targets.calories * mealDistribution.breakfast.calories),
      protein: Math.round(targets.protein * mealDistribution.breakfast.calories),
      carbs: Math.round(targets.carbs * mealDistribution.breakfast.calories * mealDistribution.breakfast.carbsRatio),
      fat: Math.round(targets.fat * mealDistribution.breakfast.calories),
    },
    lunch: {
      calories: Math.round(targets.calories * mealDistribution.lunch.calories),
      protein: Math.round(targets.protein * mealDistribution.lunch.calories),
      carbs: Math.round(targets.carbs * mealDistribution.lunch.calories * mealDistribution.lunch.carbsRatio),
      fat: Math.round(targets.fat * mealDistribution.lunch.calories),
    },
    dinner: {
      calories: Math.round(targets.calories * mealDistribution.dinner.calories),
      protein: Math.round(targets.protein * mealDistribution.dinner.calories),
      carbs: Math.round(targets.carbs * mealDistribution.dinner.calories * mealDistribution.dinner.carbsRatio),
      fat: Math.round(targets.fat * mealDistribution.dinner.calories),
    },
    snack: {
      calories: Math.round(targets.calories * mealDistribution.snack.calories),
      protein: Math.round(targets.protein * mealDistribution.snack.calories),
      carbs: Math.round(targets.carbs * mealDistribution.snack.calories * mealDistribution.snack.carbsRatio),
      fat: Math.round(targets.fat * mealDistribution.snack.calories),
    },
  };
  
  // 4. 生成每餐的食物组合（传入营养目标，动态调整分量）
  const breakfast = generateBreakfast(mealTargets.breakfast);
  const lunch = generateLunch(mealTargets.lunch);
  const dinner = generateDinner(mealTargets.dinner);
  const snack = generateSnack(mealTargets.snack);
  
  const mealPlan = { breakfast, lunch, dinner, snack };
  
  // 5. 补齐营养缺口：检查各维度是否达标，不足则追加食物
  fillNutritionGaps(mealPlan, targets);
  
  return mealPlan;
}

/**
 * 补齐营养缺口
 * @description 检查生成的餐食计划各维度是否达标，不足则追加高对应营养素的食物
 * V1.2.3 更新：循环补齐直到各维度达标
 */
function fillNutritionGaps(mealPlan: MealPlan, targets: { calories: number; protein: number; carbs: number; fat: number }): void {
  // 最多补齐3轮，避免无限循环
  for (let round = 0; round < 3; round++) {
    // 重新计算当前所有食物的营养总和
    let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
    const allMeals = [...mealPlan.breakfast, ...mealPlan.lunch, ...mealPlan.dinner, ...mealPlan.snack];
    for (const item of allMeals) {
      const food = foodDatabase.find(f => f.id === item.foodId);
      if (food) {
        const ratio = item.amount / 100;
        totalCal += food.calories * ratio;
        totalPro += food.protein * ratio;
        totalCarb += food.carbs * ratio;
        totalFat += food.fat * ratio;
      }
    }
    
    let filled = false;
    
    // 碳水缺口：追加米饭到午餐（米饭高碳水低脂肪）
    const carbGap = targets.carbs - totalCarb;
    if (carbGap > 15) {
      const rice = foodDatabase.find(f => f.id === 'white_rice');
      if (rice && rice.carbs > 0) {
        const neededAmount = Math.round((carbGap / rice.carbs) * 100);
        mealPlan.lunch.push({ foodId: rice.id, amount: Math.max(20, neededAmount) });
        filled = true;
      }
    }
    
    // 蛋白质缺口：追加鸡胸肉到午餐（高蛋白低脂肪）
    const proGap = targets.protein - totalPro;
    if (proGap > 8) {
      const chicken = foodDatabase.find(f => f.id === 'chicken_breast');
      if (chicken && chicken.protein > 0) {
        const neededAmount = Math.round((proGap / chicken.protein) * 100);
        mealPlan.lunch.push({ foodId: chicken.id, amount: Math.max(20, neededAmount) });
        filled = true;
      }
    }
    
    // 如果没有需要补齐的维度，退出循环
    if (!filled) break;
  }
}

/**
 * 计算每日营养目标
 */
function calculateDailyTargets(profile: UserProfile): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  // 使用 Mifflin-St Jeor 公式
  const bmr = calculateBMR({
    gender: profile.gender,
    currentWeight: profile.currentWeight,
    height: profile.height,
    age: profile.age,
  });
  
  // 活动系数
  const activityFactors: Record<number, number> = {
    2: 1.375,
    3: 1.55,
    4: 1.55,
    5: 1.725,
    6: 1.725,
  };
  const activityFactor = activityFactors[profile.trainingDays] || 1.375;
  const tdee = Math.round(bmr * activityFactor);
  
  // 目标调整
  const goalAdjustments: Record<string, number> = {
    muscle: 300,
    fat_loss: -400,
    shape: 0,
    maintain: 0,
  };
  const primaryGoal = profile.goals?.[0] || 'muscle';
  const targetCalories = tdee + (goalAdjustments[primaryGoal] || 0);
  
  const macros = calculateMacroTargets(targetCalories, primaryGoal);
  
  return {
    calories: targetCalories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };
}

/**
 * 根据训练时间获取餐食营养分配比例
 * 训练前后的餐食会调整碳水化合物的分配
 */
function getMealDistribution(trainingTime: TrainingTime): {
  breakfast: { calories: number; carbsRatio: number };
  lunch: { calories: number; carbsRatio: number };
  dinner: { calories: number; carbsRatio: number };
  snack: { calories: number; carbsRatio: number };
} {
  const baseDistribution = {
    breakfast: { calories: 0.25, carbsRatio: 1.0 },
    lunch: { calories: 0.35, carbsRatio: 1.0 },
    dinner: { calories: 0.30, carbsRatio: 1.0 },
    snack: { calories: 0.10, carbsRatio: 1.0 },
  };
  
  switch (trainingTime) {
    case 'morning':
      // 晨练：早餐增加碳水，练前补充能量
      return {
        breakfast: { calories: 0.30, carbsRatio: 1.3 }, // 更多碳水
        lunch: { calories: 0.35, carbsRatio: 0.9 },
        dinner: { calories: 0.25, carbsRatio: 0.9 },
        snack: { calories: 0.10, carbsRatio: 1.0 },
      };
      
    case 'afternoon':
      // 下午练：午餐增加碳水
      return {
        breakfast: { calories: 0.25, carbsRatio: 0.9 },
        lunch: { calories: 0.40, carbsRatio: 1.3 }, // 更多碳水
        dinner: { calories: 0.25, carbsRatio: 0.9 },
        snack: { calories: 0.10, carbsRatio: 1.0 },
      };
      
    case 'evening':
      // 晚上练：晚餐增加碳水，练后恢复
      return {
        breakfast: { calories: 0.25, carbsRatio: 0.9 },
        lunch: { calories: 0.30, carbsRatio: 0.9 },
        dinner: { calories: 0.35, carbsRatio: 1.3 }, // 更多碳水
        snack: { calories: 0.10, carbsRatio: 1.0 },
      };
      
    case 'rest':
    default:
      // 休息日：均衡分配
      return baseDistribution;
  }
}

/**
 * 营养目标接口
 */
interface MealNutritionTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 生成早餐
 * 重点：优质蛋白质 + 复合碳水 + 适量脂肪
 * V1.2.3 更新：根据营养目标动态调整分量
 */
function generateBreakfast(targets: MealNutritionTarget): MealItem[] {
  const items: MealItem[] = [];
  
  const proteinFoods = getFoodsByCategory('protein');
  const carbFoods = getFoodsByCategory('carbs');
  const fruitFoods = getFoodsByCategory('fruit');
  
  const egg = proteinFoods.find(f => f.id === 'egg_whole');
  const milk = proteinFoods.find(f => f.id === 'milk');
  const oats = carbFoods.find(f => f.id === 'oatmeal');
  const banana = fruitFoods.find(f => f.id === 'banana');
  
  // 基础分量对应的基础营养
  const baseEggCal = egg ? egg.calories * 1.0 : 0; // 100g
  const baseMilkCal = milk ? milk.calories * 2.5 : 0; // 250g
  const baseOatsCal = oats ? oats.calories * 0.5 : 0; // 50g
  const baseBananaCal = banana ? banana.calories * 1.0 : 0; // 100g
  const baseTotalCal = baseEggCal + baseMilkCal + baseOatsCal + baseBananaCal;
  
  // 按热量目标等比缩放所有食物
  const calScale = baseTotalCal > 0 ? targets.calories / baseTotalCal : 1;
  
  if (egg) items.push({ foodId: egg.id, amount: Math.max(50, Math.round(100 * calScale)) });
  if (milk) items.push({ foodId: milk.id, amount: Math.max(100, Math.round(250 * calScale)) });
  if (oats) items.push({ foodId: oats.id, amount: Math.max(20, Math.round(50 * calScale)) });
  if (banana) items.push({ foodId: banana.id, amount: Math.max(50, Math.round(100 * calScale)) });
  
  return items;
}

/**
 * 生成午餐
 * 重点：充足蛋白质 + 主食 + 蔬菜
 * V1.2.3 更新：根据营养目标动态调整分量
 */
function generateLunch(targets: MealNutritionTarget): MealItem[] {
  const items: MealItem[] = [];
  
  const proteinFoods = getFoodsByCategory('protein');
  const carbFoods = getFoodsByCategory('carbs');
  const vegetableFoods = getFoodsByCategory('vegetable');
  const fatFoods = getFoodsByCategory('fat');
  
  const chicken = proteinFoods.find(f => f.id === 'chicken_breast');
  const rice = carbFoods.find(f => f.id === 'white_rice');
  const broccoli = vegetableFoods.find(f => f.id === 'broccoli');
  const oliveOil = fatFoods.find(f => f.id === 'olive_oil');
  
  // 基础分量对应的基础营养
  const baseChickenCal = chicken ? chicken.calories * 1.5 : 0; // 150g
  const baseRiceCal = rice ? rice.calories * 2.0 : 0; // 200g
  const baseBroccoliCal = broccoli ? broccoli.calories * 1.5 : 0; // 150g
  const baseOilCal = oliveOil ? oliveOil.calories * 0.1 : 0; // 10g
  const baseTotalCal = baseChickenCal + baseRiceCal + baseBroccoliCal + baseOilCal;
  
  const calScale = baseTotalCal > 0 ? targets.calories / baseTotalCal : 1;
  
  if (chicken) items.push({ foodId: chicken.id, amount: Math.max(50, Math.round(150 * calScale)) });
  if (rice) items.push({ foodId: rice.id, amount: Math.max(50, Math.round(200 * calScale)) });
  if (broccoli) items.push({ foodId: broccoli.id, amount: Math.max(50, Math.round(150 * calScale)) });
  if (oliveOil) items.push({ foodId: oliveOil.id, amount: Math.max(5, Math.round(10 * calScale)) });
  
  return items;
}

/**
 * 生成晚餐
 * 重点：蛋白质 + 适量碳水 + 大量蔬菜
 * V1.2.3 更新：根据营养目标动态调整分量
 */
function generateDinner(targets: MealNutritionTarget): MealItem[] {
  const items: MealItem[] = [];
  
  const proteinFoods = getFoodsByCategory('protein');
  const carbFoods = getFoodsByCategory('carbs');
  const vegetableFoods = getFoodsByCategory('vegetable');
  
  const salmon = proteinFoods.find(f => f.id === 'salmon');
  const tofu = proteinFoods.find(f => f.id === 'tofu');
  const sweetPotato = carbFoods.find(f => f.id === 'sweet_potato');
  const spinach = vegetableFoods.find(f => f.id === 'spinach');
  const tomato = vegetableFoods.find(f => f.id === 'tomato');
  
  // 基础分量对应的基础营养
  const baseSalmonCal = salmon ? salmon.calories * 1.2 : 0; // 120g
  const baseTofuCal = tofu ? tofu.calories * 1.0 : 0; // 100g
  const baseSweetPotatoCal = sweetPotato ? sweetPotato.calories * 1.5 : 0; // 150g
  const baseSpinachCal = spinach ? spinach.calories * 1.0 : 0; // 100g
  const baseTomatoCal = tomato ? tomato.calories * 1.0 : 0; // 100g
  const baseTotalCal = baseSalmonCal + baseTofuCal + baseSweetPotatoCal + baseSpinachCal + baseTomatoCal;
  
  const calScale = baseTotalCal > 0 ? targets.calories / baseTotalCal : 1;
  
  if (salmon) items.push({ foodId: salmon.id, amount: Math.max(50, Math.round(120 * calScale)) });
  if (tofu) items.push({ foodId: tofu.id, amount: Math.max(50, Math.round(100 * calScale)) });
  if (sweetPotato) items.push({ foodId: sweetPotato.id, amount: Math.max(50, Math.round(150 * calScale)) });
  if (spinach) items.push({ foodId: spinach.id, amount: Math.max(50, Math.round(100 * calScale)) });
  if (tomato) items.push({ foodId: tomato.id, amount: Math.max(50, Math.round(100 * calScale)) });
  
  return items;
}

/**
 * 生成加餐/零食
 * 重点：蛋白质补充 + 健康脂肪 + 少量碳水
 * V1.2.3 更新：根据营养目标动态调整分量
 */
function generateSnack(targets: MealNutritionTarget): MealItem[] {
  const items: MealItem[] = [];
  
  const fatFoods = getFoodsByCategory('fat');
  const proteinFoods = getFoodsByCategory('protein');
  const fruitFoods = getFoodsByCategory('fruit');
  
  const almonds = fatFoods.find(f => f.id === 'almonds');
  const yogurt = proteinFoods.find(f => f.id === 'greek_yogurt');
  const apple = fruitFoods.find(f => f.id === 'apple');
  
  // 基础分量对应的基础营养
  const baseAlmondsCal = almonds ? almonds.calories * 0.3 : 0; // 30g
  const baseYogurtCal = yogurt ? yogurt.calories * 1.5 : 0; // 150g
  const baseAppleCal = apple ? apple.calories * 1.5 : 0; // 150g
  const baseTotalCal = baseAlmondsCal + baseYogurtCal + baseAppleCal;
  
  const calScale = baseTotalCal > 0 ? targets.calories / baseTotalCal : 1;
  
  if (almonds) items.push({ foodId: almonds.id, amount: Math.max(10, Math.round(30 * calScale)) });
  if (yogurt) items.push({ foodId: yogurt.id, amount: Math.max(50, Math.round(150 * calScale)) });
  if (apple) items.push({ foodId: apple.id, amount: Math.max(50, Math.round(150 * calScale)) });
  
  return items;
}

/**
 * 计算餐食计划的营养统计
 */
export function calculateDailyNutrition(
  mealPlan: MealPlan,
  profile: UserProfile
): DailyNutrition {
  let actualCalories = 0;
  let actualProtein = 0;
  let actualCarbs = 0;
  let actualFat = 0;
  
  // 计算所有餐食的营养
  const allMeals = [
    ...mealPlan.breakfast,
    ...mealPlan.lunch,
    ...mealPlan.dinner,
    ...mealPlan.snack,
  ];
  
  for (const item of allMeals) {
    const food = foodDatabase.find(f => f.id === item.foodId);
    if (food) {
      const ratio = item.amount / 100; // 数据库是每100g
      actualCalories += food.calories * ratio;
      actualProtein += food.protein * ratio;
      actualCarbs += food.carbs * ratio;
      actualFat += food.fat * ratio;
    }
  }
  
  // 获取目标值
  const targets = calculateDailyTargets(profile);
  
  return {
    date: new Date().toISOString().split('T')[0],
    calories: {
      target: Math.round(targets.calories),
      actual: Math.round(actualCalories),
      remaining: Math.round(targets.calories - actualCalories),
    },
    protein: {
      target: Math.round(targets.protein),
      actual: Math.round(actualProtein),
      remaining: Math.round(targets.protein - actualProtein),
    },
    carbs: {
      target: Math.round(targets.carbs),
      actual: Math.round(actualCarbs),
      remaining: Math.round(targets.carbs - actualCarbs),
    },
    fat: {
      target: Math.round(targets.fat),
      actual: Math.round(actualFat),
      remaining: Math.round(targets.fat - actualFat),
    },
    water: {
      target: 0,
      actual: 0,
      remaining: 0,
    },
  };
}

/**
 * 更新餐食计划的营养统计
 * 当用户修改食物份量后重新计算
 */
export function updateMealPlanNutrition(
  mealPlan: MealPlan,
  profile: UserProfile
): DailyNutrition {
  return calculateDailyNutrition(mealPlan, profile);
}

/**
 * 获取食物详情
 */
export function getFoodDetails(foodId: string) {
  return foodDatabase.find(f => f.id === foodId);
}

/**
 * 计算单个餐食的营养
 */
export function calculateMealNutrition(mealItems: MealItem[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  
  for (const item of mealItems) {
    const food = foodDatabase.find(f => f.id === item.foodId);
    if (food) {
      const ratio = item.amount / 100;
      calories += food.calories * ratio;
      protein += food.protein * ratio;
      carbs += food.carbs * ratio;
      fat += food.fat * ratio;
    }
  }
  
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

/**
 * 计算每日水分目标（V1.2.3 新增）
 * @param profile - 用户画像
 * @param trainingTime - 训练时间
 * @returns 水分目标（ml）
 */
export function calculateWaterTarget(
  profile: UserProfile,
  trainingTime: 'morning' | 'afternoon' | 'evening' | 'rest' = 'rest'
): number {
  // 基础水分：体重 × 30ml
  let baseWater = profile.currentWeight * 30;
  
  // 训练日增加水分
  if (trainingTime !== 'rest') {
    // 训练日额外补充 500-1000ml
    baseWater += 750;
  }
  
  // 根据活动水平调整
  const activityFactors: Record<string, number> = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
    very_active: 1.4,
  };
  const factor = activityFactors[profile.activityLevel] || 1.0;
  
  return Math.round(baseWater * factor);
}

/**
 * 计算营养范围（V1.2.3 新增）
 * @param nutrition - 每日营养统计
 * @returns 营养范围
 */
export function calculateNutritionRanges(nutrition: DailyNutrition): DailyNutritionRanges {
  // 容差定义
  const tolerances = {
    calories: 0.10,    // ±10%
    protein: 0.10,     // ±10%
    carbs: 0.15,       // ±15%
    fat: 0.15,         // ±15%
    water: 0.20,       // ±20%
  };
  
  /**
   * 创建单个营养范围
   */
  const createRange = (target: number, tolerance: number): NutritionRange => ({
    target,
    min: Math.round(target * (1 - tolerance)),
    max: Math.round(target * (1 + tolerance)),
    tolerance,
  });
  
  return {
    calories: createRange(nutrition.calories.target, tolerances.calories),
    protein: createRange(nutrition.protein.target, tolerances.protein),
    carbs: createRange(nutrition.carbs.target, tolerances.carbs),
    fat: createRange(nutrition.fat.target, tolerances.fat),
    water: createRange(nutrition.water.target, tolerances.water),
  };
}
