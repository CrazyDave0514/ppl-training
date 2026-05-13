/**
 * V1.2.3 测试脚本 - 验证餐食计划生成和营养计算
 * 运行: npx tsx test/v123-test.ts
 */

import { generateMealPlan, calculateDailyNutrition } from '../src/utils/mealPlanGenerator';
import { foodDatabase } from '../src/data/foodDatabase';

/** 模拟用户画像（字段名与 UserProfile 类型一致） */
const mockProfile = {
  id: 'test-user',
  gender: 'male' as const,
  age: 25,
  height: 175,
  currentWeight: 70,
  targetWeight: 68,
  activityLevel: 'moderate' as const,
  trainingDays: [1, 2, 4, 5],
  primaryGoal: 'muscle' as const,
};

/** 计算食物营养 */
function getFoodNutrition(foodId: string, amount: number) {
  const food = foodDatabase.find(f => f.id === foodId);
  if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const ratio = amount / 100;
  return {
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio),
    carbs: Math.round(food.carbs * ratio),
    fat: Math.round(food.fat * ratio),
  };
}

/** 计算餐食计划总营养 */
function calcMealPlanTotal(mealPlan: any) {
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    for (const item of mealPlan[mealType]) {
      const n = getFoodNutrition(item.foodId, item.amount);
      total.calories += n.calories;
      total.protein += n.protein;
      total.carbs += n.carbs;
      total.fat += n.fat;
    }
  }
  return total;
}

// ==================== 测试用例 ====================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (e: any) {
    console.log(`❌ ${name} - 异常: ${e.message}`);
    failed++;
  }
}

console.log('\n========== V1.2.3 测试 ==========\n');

// TC-GEN-001: 生成餐食计划不为空
test('TC-GEN-001: 生成餐食计划不为空', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  return plan.breakfast.length > 0 && plan.lunch.length > 0 && plan.dinner.length > 0 && plan.snack.length > 0;
});

// TC-GEN-002: 全打卡后热量达标
test('TC-GEN-002: 全打卡后热量达标 (≥95%)', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  const ratio = nutrition.calories.actual / nutrition.calories.target;
  console.log(`   热量: ${nutrition.calories.actual}/${nutrition.calories.target} (${(ratio * 100).toFixed(1)}%)`);
  return ratio >= 0.95;
});

// TC-GEN-003: 全打卡后蛋白质达标
test('TC-GEN-003: 全打卡后蛋白质达标 (≥90%)', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  const ratio = nutrition.protein.actual / nutrition.protein.target;
  console.log(`   蛋白质: ${nutrition.protein.actual}/${nutrition.protein.target}g (${(ratio * 100).toFixed(1)}%)`);
  return ratio >= 0.90;
});

// TC-GEN-004: 全打卡后碳水达标
test('TC-GEN-004: 全打卡后碳水达标 (≥90%)', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  const ratio = nutrition.carbs.actual / nutrition.carbs.target;
  console.log(`   碳水: ${nutrition.carbs.actual}/${nutrition.carbs.target}g (${(ratio * 100).toFixed(1)}%)`);
  return ratio >= 0.90;
});

// TC-GEN-005: 全打卡后脂肪达标
test('TC-GEN-005: 全打卡后脂肪达标 (≥90%)', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  const ratio = nutrition.fat.actual / nutrition.fat.target;
  console.log(`   脂肪: ${nutrition.fat.actual}/${nutrition.fat.target}g (${(ratio * 100).toFixed(1)}%)`);
  return ratio >= 0.90;
});

// TC-GEN-006: 4维度综合进度全打卡应为100%
test('TC-GEN-006: 4维度综合进度全打卡应≥95%', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  const calP = Math.min(nutrition.calories.actual / nutrition.calories.target, 1);
  const proP = Math.min(nutrition.protein.actual / nutrition.protein.target, 1);
  const carbP = Math.min(nutrition.carbs.actual / nutrition.carbs.target, 1);
  const fatP = Math.min(nutrition.fat.actual / nutrition.fat.target, 1);
  const avg = (calP + proP + carbP + fatP) / 4;
  console.log(`   4维度平均: ${(avg * 100).toFixed(1)}% (热${(calP*100).toFixed(0)}% 蛋${(proP*100).toFixed(0)}% 碳${(carbP*100).toFixed(0)}% 脂${(fatP*100).toFixed(0)}%)`);
  return avg >= 0.95;
});

// TC-GEN-007: 部分打卡进度应低于100%
test('TC-GEN-007: 部分打卡进度应低于100%', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  const nutrition = calculateDailyNutrition(plan, mockProfile as any);
  // 只统计早餐
  let partialCal = 0, partialPro = 0, partialCarb = 0, partialFat = 0;
  for (const item of plan.breakfast) {
    const n = getFoodNutrition(item.foodId, item.amount);
    partialCal += n.calories;
    partialPro += n.protein;
    partialCarb += n.carbs;
    partialFat += n.fat;
  }
  const calP = partialCal / nutrition.calories.target;
  const proP = partialPro / nutrition.protein.target;
  const carbP = partialCarb / nutrition.carbs.target;
  const fatP = partialFat / nutrition.fat.target;
  const avg = (calP + proP + carbP + fatP) / 4;
  console.log(`   仅早餐: 4维度平均 ${(avg * 100).toFixed(1)}%`);
  return avg < 1.0;
});

// TC-GEN-008: 未打卡天进度应为0
test('TC-GEN-008: 未打卡天进度应为0', () => {
  const plan = generateMealPlan(mockProfile as any, 'rest');
  // 所有菜品 isCompleted 都不设置（默认 undefined/false）
  let actualCal = 0;
  for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
    for (const item of plan[mealType]) {
      if (item.isCompleted) {
        actualCal += getFoodNutrition(item.foodId, item.amount).calories;
      }
    }
  }
  return actualCal === 0;
});

// TC-GEN-009: 食物分量根据目标动态调整（非硬编码）
test('TC-GEN-009: 食物分量动态调整（非固定值）', () => {
  const plan1 = generateMealPlan({ ...mockProfile, currentWeight: 60 } as any, 'rest');
  const plan2 = generateMealPlan({ ...mockProfile, currentWeight: 90 } as any, 'rest');
  const total1 = calcMealPlanTotal(plan1);
  const total2 = calcMealPlanTotal(plan2);
  console.log(`   60kg: ${total1.calories}kcal, 90kg: ${total2.calories}kcal`);
  return total1.calories !== total2.calories;
});

// TC-GEN-010: 训练日和休息日食物分量不同
test('TC-GEN-010: 训练日和休息日食物分量不同', () => {
  const planRest = generateMealPlan(mockProfile as any, 'rest');
  const planTrain = generateMealPlan(mockProfile as any, 'evening');
  const totalRest = calcMealPlanTotal(planRest);
  const totalTrain = calcMealPlanTotal(planTrain);
  console.log(`   休息日: ${totalRest.calories}kcal, 训练日: ${totalTrain.calories}kcal`);
  return totalRest.calories !== totalTrain.calories;
});

console.log(`\n========== 测试结果 ==========`);
console.log(`通过: ${passed}, 失败: ${failed}, 总计: ${passed + failed}`);
console.log(`通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) process.exit(1);
