/**
 * 计划模板数据 - 9套训练模板
 * @description 包含 Push/Pull/Legs 三种训练类型，每种3个难度级别
 */

import type { PlanTemplate, TrainingType, DifficultyLevel } from '../types';

/**
 * 计划模板数据
 * 3种训练类型 x 3个难度级别 = 9套模板
 */
export const planTemplates: PlanTemplate[] = [
  // ==================== Push (推) - 3个级别 ====================
  {
    id: 'template-push-beginner',
    name: 'Push 初级',
    type: 'push',
    level: 'beginner',
    exercises: [
      { libraryId: 'push-001', sets: 4, reps: 12, weightRange: '空杆-40kg' },
      { libraryId: 'push-008', sets: 4, reps: 12, weightRange: '5-15kg' },
      { libraryId: 'push-010', sets: 4, reps: 12, weightRange: '2.5-7.5kg' },
      { libraryId: 'push-014', sets: 4, reps: 12, weightRange: '轻重量' },
    ],
  },
  {
    id: 'template-push-intermediate',
    name: 'Push 中级',
    type: 'push',
    level: 'intermediate',
    exercises: [
      { libraryId: 'push-001', sets: 4, reps: 8, weightRange: '60-80kg' },
      { libraryId: 'push-003', sets: 3, reps: 10, weightRange: '40-60kg' },
      { libraryId: 'push-008', sets: 4, reps: 10, weightRange: '15-25kg' },
      { libraryId: 'push-010', sets: 4, reps: 12, weightRange: '7.5-12.5kg' },
      { libraryId: 'push-012', sets: 3, reps: 15, weightRange: '5-10kg' },
      { libraryId: 'push-014', sets: 3, reps: 12, weightRange: '中等重量' },
    ],
  },
  {
    id: 'template-push-advanced',
    name: 'Push 高级',
    type: 'push',
    level: 'advanced',
    exercises: [
      { libraryId: 'push-001', sets: 5, reps: 5, weightRange: '80-120kg' },
      { libraryId: 'push-003', sets: 4, reps: 8, weightRange: '60-80kg' },
      { libraryId: 'push-007', sets: 3, reps: 10, weightRange: '自重+' },
      { libraryId: 'push-009', sets: 4, reps: 8, weightRange: '50-70kg' },
      { libraryId: 'push-010', sets: 4, reps: 15, weightRange: '10-15kg' },
      { libraryId: 'push-011', sets: 3, reps: 15, weightRange: '中等重量' },
      { libraryId: 'push-013', sets: 3, reps: 8, weightRange: '60-80kg' },
      { libraryId: 'push-014', sets: 4, reps: 12, weightRange: '大重量' },
    ],
  },

  // ==================== Pull (拉) - 3个级别 ====================
  {
    id: 'template-pull-beginner',
    name: 'Pull 初级',
    type: 'pull',
    level: 'beginner',
    exercises: [
      { libraryId: 'pull-002', sets: 4, reps: 12, weightRange: '轻重量' },
      { libraryId: 'pull-003', sets: 4, reps: 12, weightRange: '轻-中等' },
      { libraryId: 'pull-009', sets: 4, reps: 12, weightRange: '5-10kg' },
      { libraryId: 'pull-010', sets: 4, reps: 12, weightRange: '5-10kg' },
    ],
  },
  {
    id: 'template-pull-intermediate',
    name: 'Pull 中级',
    type: 'pull',
    level: 'intermediate',
    exercises: [
      { libraryId: 'pull-001', sets: 4, reps: 8, weightRange: '自重/辅助' },
      { libraryId: 'pull-002', sets: 4, reps: 10, weightRange: '体重50-70%' },
      { libraryId: 'pull-003', sets: 4, reps: 10, weightRange: '中等重量' },
      { libraryId: 'pull-005', sets: 3, reps: 10, weightRange: '15-25kg' },
      { libraryId: 'pull-008', sets: 3, reps: 10, weightRange: '20-30kg' },
      { libraryId: 'pull-010', sets: 3, reps: 12, weightRange: '10-15kg' },
    ],
  },
  {
    id: 'template-pull-advanced',
    name: 'Pull 高级',
    type: 'pull',
    level: 'advanced',
    exercises: [
      { libraryId: 'pull-001', sets: 5, reps: 8, weightRange: '负重+' },
      { libraryId: 'pull-002', sets: 4, reps: 10, weightRange: '体重80%+' },
      { libraryId: 'pull-004', sets: 4, reps: 8, weightRange: '60-80kg' },
      { libraryId: 'pull-005', sets: 4, reps: 10, weightRange: '30-40kg' },
      { libraryId: 'pull-007', sets: 4, reps: 15, weightRange: '中等重量' },
      { libraryId: 'pull-008', sets: 4, reps: 10, weightRange: '40-50kg' },
      { libraryId: 'pull-010', sets: 4, reps: 12, weightRange: '15-20kg' },
      { libraryId: 'pull-013', sets: 4, reps: 12, weightRange: '大重量' },
    ],
  },

  // ==================== Legs (腿) - 3个级别 ====================
  {
    id: 'template-legs-beginner',
    name: 'Legs 初级',
    type: 'legs',
    level: 'beginner',
    exercises: [
      { libraryId: 'legs-001', sets: 4, reps: 12, weightRange: '空杆-40kg' },
      { libraryId: 'legs-004', sets: 4, reps: 12, weightRange: '轻重量' },
      { libraryId: 'legs-008', sets: 4, reps: 12, weightRange: '轻重量' },
      { libraryId: 'legs-011', sets: 4, reps: 12, weightRange: '轻重量' },
    ],
  },
  {
    id: 'template-legs-intermediate',
    name: 'Legs 中级',
    type: 'legs',
    level: 'intermediate',
    exercises: [
      { libraryId: 'legs-001', sets: 4, reps: 8, weightRange: '60-100kg' },
      { libraryId: 'legs-004', sets: 4, reps: 12, weightRange: '100-150kg' },
      { libraryId: 'legs-005', sets: 3, reps: 10, weightRange: '40-60kg' },
      { libraryId: 'legs-007', sets: 3, reps: 12, weightRange: '中等重量' },
      { libraryId: 'legs-008', sets: 3, reps: 15, weightRange: '中等重量' },
      { libraryId: 'legs-011', sets: 4, reps: 15, weightRange: '中等重量' },
    ],
  },
  {
    id: 'template-legs-advanced',
    name: 'Legs 高级',
    type: 'legs',
    level: 'advanced',
    exercises: [
      { libraryId: 'legs-001', sets: 5, reps: 5, weightRange: '120-180kg' },
      { libraryId: 'legs-002', sets: 4, reps: 8, weightRange: '80-100kg' },
      { libraryId: 'legs-004', sets: 4, reps: 10, weightRange: '200kg+' },
      { libraryId: 'legs-005', sets: 4, reps: 8, weightRange: '80-100kg' },
      { libraryId: 'legs-009', sets: 3, reps: 10, weightRange: '负重20-30kg' },
      { libraryId: 'legs-013', sets: 4, reps: 12, weightRange: '大重量' },
      { libraryId: 'legs-011', sets: 5, reps: 15, weightRange: '大重量' },
      { libraryId: 'legs-012', sets: 5, reps: 15, weightRange: '大重量' },
    ],
  },
];

/**
 * 根据训练类型和难度获取模板
 * @param type - 训练类型
 * @param level - 难度级别
 * @returns 计划模板或 undefined
 */
export const getTemplate = (
  type: TrainingType,
  level: DifficultyLevel
): PlanTemplate | undefined => {
  return planTemplates.find(t => t.type === type && t.level === level);
};

/**
 * 根据训练类型获取所有模板
 * @param type - 训练类型
 * @returns 模板数组
 */
export const getTemplatesByType = (type: TrainingType): PlanTemplate[] => {
  return planTemplates.filter(t => t.type === type);
};

/**
 * 根据难度级别获取所有模板
 * @param level - 难度级别
 * @returns 模板数组
 */
export const getTemplatesByLevel = (level: DifficultyLevel): PlanTemplate[] => {
  return planTemplates.filter(t => t.level === level);
};

/**
 * 获取所有模板
 * @returns 模板数组
 */
export const getAllTemplates = (): PlanTemplate[] => {
  return [...planTemplates];
};

/**
 * 难度级别中文映射
 */
export const difficultyLabels: Record<DifficultyLevel, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

/**
 * 训练类型中文映射
 */
export const trainingTypeLabels: Record<TrainingType, string> = {
  push: 'Push (推)',
  pull: 'Pull (拉)',
  legs: 'Legs (腿)',
  free: '自由动作',
};

/**
 * 训练类型颜色映射 - Apple Health 风格
 * 使用浅色背景配深色图标
 */
export const trainingTypeColors: Record<TrainingType, string> = {
  push: 'bg-red-50',      // 浅红背景
  pull: 'bg-blue-50',     // 浅蓝背景
  legs: 'bg-green-50',    // 浅绿背景
  free: 'bg-purple-50',   // 浅紫背景
};

/**
 * 训练类型图标背景颜色 - 深色
 */
export const trainingTypeIconColors: Record<TrainingType, string> = {
  push: 'bg-[#FF3B30]',   // iOS 红
  pull: 'bg-[#007AFF]',   // iOS 蓝
  legs: 'bg-[#34C759]',   // iOS 绿
  free: 'bg-[#AF52DE]',   // iOS 紫
};

/**
 * 训练类型边框颜色映射
 */
export const trainingTypeBorderColors: Record<TrainingType, string> = {
  push: 'border-[#FF3B30]',
  pull: 'border-[#007AFF]',
  legs: 'border-[#34C759]',
  free: 'border-[#AF52DE]',
};

/**
 * 训练类型文字颜色映射
 */
export const trainingTypeTextColors: Record<TrainingType, string> = {
  push: 'text-[#FF3B30]',
  pull: 'text-[#007AFF]',
  legs: 'text-[#34C759]',
  free: 'text-[#AF52DE]',
};

/**
 * 训练类型浅色背景（用于标签）
 */
export const trainingTypeLightColors: Record<TrainingType, string> = {
  push: 'bg-red-50 text-[#FF3B30]',
  pull: 'bg-blue-50 text-[#007AFF]',
  legs: 'bg-green-50 text-[#34C759]',
  free: 'bg-purple-50 text-[#AF52DE]',
};
