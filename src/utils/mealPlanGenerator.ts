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
  
  // 3. 生成每餐的食物组合
  const breakfast = generateBreakfast(mealDistribution.breakfast.calories, targets);
  const lunch = generateLunch(mealDistribution.lunch.calories, targets);
  const dinner = generateDinner(mealDistribution.dinner.calories, targets);
  const snack = generateSnack(mealDistribution.snack.calories, targets);
  
  return {
    breakfast,
    lunch,
    dinner,
    snack,
  };
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
 * 生成早餐
 * 重点：优质蛋白质 + 复合碳水 + 适量脂肪
 */
function generateBreakfast(
  _calorieRatio: number,
  _targets: { calories: number; protein: number; carbs: number; fat: number }
): MealItem[] {
  const items: MealItem[] = [];
  
  // 蛋白质来源（鸡蛋、牛奶、希腊酸奶）
  const proteinFoods = getFoodsByCategory('protein');
  const egg = proteinFoods.find(f => f.id === 'egg');
  const milk = proteinFoods.find(f => f.id === 'milk');
  
  if (egg) {
    items.push({ foodId: egg.id, amount: 100 }); // 2个鸡蛋约100g
  }
  if (milk) {
    items.push({ foodId: milk.id, amount: 250 }); // 一杯牛奶
  }
  
  // 碳水来源（燕麦、全麦面包）
  const carbFoods = getFoodsByCategory('carbs');
  const oats = carbFoods.find(f => f.id === 'oats');
  
  if (oats) {
    items.push({ foodId: oats.id, amount: 50 }); // 50g燕麦
  }
  
  // 水果补充
  const fruitFoods = getFoodsByCategory('fruit');
  const banana = fruitFoods.find(f => f.id === 'banana');
  
  if (banana) {
    items.push({ foodId: banana.id, amount: 100 }); // 一根香蕉
  }
  
  return items;
}

/**
 * 生成午餐
 * 重点：充足蛋白质 + 主食 + 蔬菜
 */
function generateLunch(
  _calorieRatio: number,
  _targets: { calories: number; protein: number; carbs: number; fat: number }
): MealItem[] {
  const items: MealItem[] = [];
  
  // 蛋白质来源（鸡胸肉、鱼类、牛肉）
  const proteinFoods = getFoodsByCategory('protein');
  const chicken = proteinFoods.find(f => f.id === 'chicken_breast');
  
  if (chicken) {
    items.push({ foodId: chicken.id, amount: 150 }); // 150g鸡胸肉
  }
  
  // 主食（米饭、糙米）
  const carbFoods = getFoodsByCategory('carbs');
  const rice = carbFoods.find(f => f.id === 'rice');
  
  if (rice) {
    items.push({ foodId: rice.id, amount: 200 }); // 200g米饭
  }
  
  // 蔬菜
  const vegetableFoods = getFoodsByCategory('vegetable');
  const broccoli = vegetableFoods.find(f => f.id === 'broccoli');
  
  if (broccoli) {
    items.push({ foodId: broccoli.id, amount: 150 }); // 150g西兰花
  }
  
  // 健康脂肪（橄榄油烹饪）
  const fatFoods = getFoodsByCategory('fat');
  const oliveOil = fatFoods.find(f => f.id === 'olive_oil');
  
  if (oliveOil) {
    items.push({ foodId: oliveOil.id, amount: 10 }); // 10g橄榄油
  }
  
  return items;
}

/**
 * 生成晚餐
 * 重点：蛋白质 + 适量碳水 + 大量蔬菜
 */
function generateDinner(
  _calorieRatio: number,
  _targets: { calories: number; protein: number; carbs: number; fat: number }
): MealItem[] {
  const items: MealItem[] = [];
  
  // 蛋白质来源（鱼类、豆腐、瘦肉）
  const proteinFoods = getFoodsByCategory('protein');
  const salmon = proteinFoods.find(f => f.id === 'salmon');
  const tofu = proteinFoods.find(f => f.id === 'tofu');
  
  if (salmon) {
    items.push({ foodId: salmon.id, amount: 120 }); // 120g三文鱼
  }
  if (tofu) {
    items.push({ foodId: tofu.id, amount: 100 }); // 100g豆腐
  }
  
  // 主食（比午餐少一些）
  const carbFoods = getFoodsByCategory('carbs');
  const sweetPotato = carbFoods.find(f => f.id === 'sweet_potato');
  
  if (sweetPotato) {
    items.push({ foodId: sweetPotato.id, amount: 150 }); // 150g红薯
  }
  
  // 更多蔬菜
  const vegetableFoods = getFoodsByCategory('vegetable');
  const spinach = vegetableFoods.find(f => f.id === 'spinach');
  const tomato = vegetableFoods.find(f => f.id === 'tomato');
  
  if (spinach) {
    items.push({ foodId: spinach.id, amount: 100 });
  }
  if (tomato) {
    items.push({ foodId: tomato.id, amount: 100 });
  }
  
  return items;
}

/**
 * 生成加餐/零食
 * 重点：蛋白质补充 + 健康脂肪 + 少量碳水
 */
function generateSnack(
  _calorieRatio: number,
  _targets: { calories: number; protein: number; carbs: number; fat: number }
): MealItem[] {
  const items: MealItem[] = [];
  
  // 坚果（健康脂肪 + 蛋白质）
  const fatFoods = getFoodsByCategory('fat');
  const almonds = fatFoods.find(f => f.id === 'almonds');
  
  if (almonds) {
    items.push({ foodId: almonds.id, amount: 30 }); // 30g杏仁
  }
  
  // 蛋白质补充（希腊酸奶）
  const proteinFoods = getFoodsByCategory('protein');
  const yogurt = proteinFoods.find(f => f.id === 'greek_yogurt');
  
  if (yogurt) {
    items.push({ foodId: yogurt.id, amount: 150 }); // 150g希腊酸奶
  }
  
  // 水果
  const fruitFoods = getFoodsByCategory('fruit');
  const apple = fruitFoods.find(f => f.id === 'apple');
  
  if (apple) {
    items.push({ foodId: apple.id, amount: 150 }); // 一个苹果
  }
  
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
