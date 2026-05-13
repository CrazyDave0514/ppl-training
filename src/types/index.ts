/**
 * FitPlus - 智能健身计划管理 App - 类型定义
 * @description 定义所有数据模型和类型
 */

// ==================== 基础枚举 ====================

/** 训练类型 */
export type TrainingType = 'push' | 'pull' | 'legs' | 'free';

/** 计划来源 */
export type PlanSource = 'manual' | 'template' | 'ai';

/** 难度级别 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// ==================== 用户相关 ====================

/**
 * 用户
 */
export interface User {
  /** 用户唯一标识（UUID） */
  id: string;
  /** 用户名/昵称 */
  name: string;
  /** 头像（base64 或 URL） */
  avatar?: string;
  /** 身高 cm */
  height?: number;
  /** 出生日期 YYYY-MM-DD */
  birthDate?: string;
  /** 年龄（从 birthDate 计算） */
  age?: number;
  /** 血型 */
  bloodType?: string;
  /** 性别 */
  gender?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

// ==================== 训练计划相关 ====================

/**
 * 计划中的动作
 */
export interface Exercise {
  /** 动作唯一标识（UUID） */
  id: string;
  /** 动作名称 */
  name: string;
  /** 组数（V1.2.2 新增，兼容旧格式） */
  sets?: number;
  /** 默认组数 */
  defaultSets?: number;
  /** 次数（V1.2.2 新增，支持范围如 "8-12"） */
  reps?: string;
  /** 默认次数 */
  defaultReps?: number;
  /** 重量（kg，用户填写） */
  weight?: number;
  /** 默认重量（kg） */
  defaultWeight?: number;
  /** 休息秒数（V1.2.2 新增） */
  restSeconds?: number;
  /** 是否完成（V1.2.2 新增） */
  completed?: boolean;
  /** 组记录（V1.2.2 新增） */
  setRecords?: { reps: number; weight: number }[];
  /** 关联动作库 ID（null 表示自定义动作） */
  libraryId?: string | null;
}

/**
 * 训练计划
 */
export interface TrainingPlan {
  /** 计划唯一标识（UUID） */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 计划名称 */
  name: string;
  /** 训练类型 */
  type: TrainingType;
  /** 来源：手动创建 / 模板生成 */
  source: PlanSource;
  /** 动作列表 */
  exercises: Exercise[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 训练日，0=周日 1=周一 ... 6=周六，空数组表示未安排 */
  dayOfWeek: number[];
}

// ==================== 训练记录相关 ====================

/**
 * 组数据
 */
export interface Set {
  /** 完成次数 */
  reps: number;
  /** 使用重量（kg） */
  weight: number;
}

/**
 * 训练中的动作
 */
export interface SessionExercise {
  /** 动作唯一标识（UUID） */
  id: string;
  /** 动作名称 */
  name: string;
  /** 各组数据 */
  sets: Set[];
  /** 是否来自原始计划（false 表示训练中新增） */
  isFromPlan: boolean;
  /** 关联动作库 ID */
  libraryId: string | null;
}

/**
 * 训练记录
 */
export interface TrainingSession {
  /** 记录唯一标识（UUID） */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 基于的计划 ID（可为空，表示自由训练） */
  planId: string | null;
  /** 计划名称（冗余存储） */
  planName: string;
  /** 训练类型 */
  type: TrainingType;
  /** 训练日期（YYYY-MM-DD） */
  date: string;
  /** 实际训练动作列表 */
  exercises: SessionExercise[];
  /** 创建时间 */
  createdAt: string;
}

// ==================== 动作库相关 ====================

/**
 * 动作库条目
 */
export interface ExerciseLibraryItem {
  /** 动作库唯一标识 */
  id: string;
  /** 动作名称 */
  name: string;
  /** 所属训练类型 */
  category: TrainingType;
  /** 目标肌群 */
  targetMuscles: string[];
  /** 所需器械 */
  equipment?: string[];
  /** 动作说明（后续扩展） */
  description: string;
  /** 演示媒体链接（后续扩展） */
  mediaUrl: string | null;
}

// ==================== 计划模板相关 ====================

/**
 * 模板动作
 */
export interface TemplateExercise {
  /** 关联动作库 ID */
  libraryId: string;
  /** 建议组数 */
  sets: number;
  /** 建议次数 */
  reps: number;
  /** 建议重量范围 */
  weightRange: string;
}

/**
 * 计划模板
 */
export interface PlanTemplate {
  /** 模板唯一标识 */
  id: string;
  /** 模板名称 */
  name: string;
  /** 训练类型 */
  type: TrainingType;
  /** 难度级别 */
  level: DifficultyLevel;
  /** 模板动作列表 */
  exercises: TemplateExercise[];
}

// ==================== 身体记录相关 ====================

/**
 * 身体记录
 */
export interface BodyRecord {
  /** 记录唯一标识 */
  id: string;
  /** 所属用户 ID */
  userId: string;
  /** 记录日期（YYYY-MM-DD） */
  date: string;
  /** 体重 kg */
  weight: number;
  /** 体脂率 %（可选） */
  bodyFat?: number;
  /** 创建时间 */
  createdAt: string;
}

// ==================== localStorage 存储结构 ====================

/**
 * 应用存储数据结构
 */
export interface AppStorage {
  /** 当前用户 ID */
  currentUser: string | null;
  /** 用户列表 */
  users: User[];
  /** 计划数据（按用户 ID 分组） */
  plans: Record<string, TrainingPlan[]>;
  /** 训练记录（按用户 ID 分组） */
  sessions: Record<string, TrainingSession[]>;
  /** 身体记录（按用户 ID 分组） */
  bodyRecords: Record<string, BodyRecord[]>;
  /** 用户画像（按用户 ID 分组）- V1.2.2 */
  userProfiles: Record<string, UserProfile>;
  /** 饮食记录（按用户 ID 分组）- V1.2.2 */
  dietRecords: Record<string, DietRecord[]>;
}

// ==================== 组件 Props 类型 ====================

/**
 * 动作选择器 Props
 */
export interface ExercisePickerProps {
  /** 当前训练类型 */
  category: TrainingType;
  /** 已选中的动作 ID */
  selectedId?: string;
  /** 选择回调 */
  onSelect: (exercise: ExerciseLibraryItem) => void;
  /** 取消回调 */
  onCancel: () => void;
}

/**
 * 动作卡片 Props
 */
export interface ExerciseCardProps {
  /** 动作数据 */
  exercise: Exercise | SessionExercise;
  /** 是否可编辑 */
  editable?: boolean;
  /** 删除回调 */
  onDelete?: () => void;
  /** 替换回调 */
  onReplace?: () => void;
}

/**
 * 组数据行 Props
 */
export interface SetRowProps {
  /** 组索引 */
  index: number;
  /** 组数据 */
  set: Set;
  /** 数据变更回调 */
  onChange: (set: Set) => void;
  /** 删除回调 */
  onDelete?: () => void;
}

// ==================== V1.2.2 用户画像相关 ====================

/** 健身目标 */
export type FitnessGoal = 'muscle' | 'fat_loss' | 'shape' | 'maintain';

/** 健身经验 */
export type FitnessExperience = 'beginner' | 'intermediate' | 'advanced';

/** 身体部位 */
export type BodyPart = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

/** 伤病部位 */
export type Injury = 'none' | 'shoulder' | 'lower_back' | 'knee' | 'wrist' | 'other';

/** 可用器械 */
export type Equipment = 'dumbbell' | 'barbell' | 'machine' | 'bodyweight' | 'band' | 'cable' | 'kettlebell';

/** 主要训练时间 */
export type TrainingTime = 'morning' | 'forenoon' | 'noon' | 'afternoon' | 'evening';

/** 每周训练天数（V1.2.2 扩展到 7 天） */
export type WeeklyDays = 2 | 3 | 4 | 5 | 6 | 7;

/** 每次训练时长（分钟）（V1.2.2 扩展范围 30-120） */
export type SessionDuration = 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 | 110 | 120;

/** 活动水平 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/**
 * 用户画像（问卷数据）
 */
export interface UserProfile {
  /** 用户ID */
  id: string;
  /** 性别 */
  gender: 'male' | 'female';
  /** 年龄 */
  age: number;
  /** 身高 cm */
  height: number;
  /** 当前体重 kg */
  currentWeight: number;
  /** 目标体重 kg（可选） */
  targetWeight?: number;
  /** 健身目标（支持多选，但'maintain'独占） */
  goals: FitnessGoal[];
  /** 健身经验 */
  experience: FitnessExperience;
  /** 每周训练天数 */
  trainingDays: WeeklyDays;
  /** 每次训练时长（分钟） */
  trainingDuration: SessionDuration;
  /** 身体部位偏好 */
  preferredBodyParts: BodyPart[];
  /** 伤病情况 */
  injuries: Injury[];
  /** 可用器械 */
  availableEquipment: Equipment[];
  /** 主要训练时间 */
  trainingTime: TrainingTime;
  /** 活动水平 */
  activityLevel: ActivityLevel;
  /** 问卷完成时间 */
  completedAt: string;
}

// ==================== V1.2.2 饮食计划相关 ====================

/**
 * 食物条目
 */
export interface FoodItem {
  /** 食物 ID */
  foodId: string;
  /** 食物名称 */
  name: string;
  /** 食用量 g */
  amount: number;
  /** 热量 kcal */
  calories: number;
  /** 蛋白质 g */
  protein: number;
  /** 脂肪 g */
  fat: number;
  /** 碳水化合物 g */
  carbs: number;
}

/**
 * 餐次记录
 */
export interface MealEntry {
  /** 食物列表 */
  foods: FoodItem[];
  /** 总热量 */
  totalCalories: number;
}

/**
 * 餐食项目
 */
export interface MealItem {
  /** 食物 ID */
  foodId: string;
  /** 份量 g */
  amount: number;
}

/**
 * 餐食计划
 */
export interface MealPlan {
  /** 早餐 */
  breakfast: MealItem[];
  /** 午餐 */
  lunch: MealItem[];
  /** 晚餐 */
  dinner: MealItem[];
  /** 加餐 */
  snack: MealItem[];
}

/**
 * 营养统计项
 */
export interface NutritionStat {
  /** 目标值 */
  target: number;
  /** 实际值 */
  actual: number;
  /** 剩余值 */
  remaining: number;
}

/**
 * 每日营养统计
 */
export interface DailyNutrition {
  /** 日期 */
  date: string;
  /** 卡路里 */
  calories: NutritionStat;
  /** 蛋白质 */
  protein: NutritionStat;
  /** 碳水 */
  carbs: NutritionStat;
  /** 脂肪 */
  fat: NutritionStat;
}

/**
 * 饮食记录
 */
export interface DietRecord {
  /** 记录ID */
  id: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 所属用户 ID */
  userId: string;
  /** 餐食计划 */
  mealPlan: MealPlan;
  /** 每日营养统计 */
  dailyNutrition: DailyNutrition;
  /** 喝水量 ml */
  waterIntake: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 每日营养目标
 */
export interface DailyNutritionTarget {
  /** 目标卡路里 kcal */
  calories: number;
  /** 目标蛋白质 g */
  protein: number;
  /** 目标脂肪 g */
  fat: number;
  /** 目标碳水 g */
  carbs: number;
}

/**
 * 三餐卡路里分配
 */
export interface MealCalorieSplit {
  /** 早餐占比 */
  breakfast: number;
  /** 午餐占比 */
  lunch: number;
  /** 晚餐占比 */
  dinner: number;
  /** 加餐占比 */
  snacks: number;
}

// ==================== V1.2.2 AI 计划生成相关 ====================

/** 训练分割类型 */
export type TrainingSplit =
  | 'full_body'
  | 'push_pull_legs'
  | 'upper_lower'
  | 'bro_split'
  | 'ppl_2x';

/** 单日训练计划（V1.2.2 计划生成器使用） */
export interface DayPlan {
  /** 日期（1-7 对应周一到周日） */
  day: number;
  /** 当日标签 */
  label: string;
  /** 当日训练类型 */
  types: TrainingType[];
  /** 当日动作列表 */
  exercises: Exercise[];
}

/** 周训练日安排（V1.2.2 支持两种格式） */
export interface WeeklySchedule {
  /** 分割类型（可选，兼容旧格式） */
  split?: TrainingSplit;
  /** 每周目标（V1.2.2 新增） */
  weeklyGoal?: FitnessGoal;
  /** 每日安排 */
  days: DayPlan[];
}

/** 单日训练安排（旧格式，兼容） */
export interface WeeklyDayPlan {
  /** 日期索引（0=周一） */
  dayIndex: number;
  /** 当日训练类型标签 */
  label: string;
  /** 当日训练类型（用于动作库过滤） */
  types: TrainingType[];
  /** 当日动作列表 */
  exercises: Exercise[];
}

/**
 * AI 生成请求
 */
export interface AIGenerateRequest {
  /** 用户画像 */
  profile: UserProfile;
  /** 规则引擎生成的计划 */
  ruleBasedPlan: WeeklySchedule;
  /** 历史训练完成度（可选） */
  historyCompletion?: Record<string, number>;
}

/**
 * AI 生成响应
 */
export interface AIGenerateResponse {
  /** 优化后的周计划 */
  optimizedPlan: WeeklySchedule;
  /** AI 建议说明 */
  suggestions: string[];
}
