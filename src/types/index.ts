/**
 * 三分化训练 App - 类型定义
 * @description 定义所有数据模型和类型
 */

// ==================== 基础枚举 ====================

/** 训练类型 */
export type TrainingType = 'push' | 'pull' | 'legs';

/** 计划来源 */
export type PlanSource = 'manual' | 'template';

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
  /** 默认组数 */
  defaultSets: number;
  /** 默认次数 */
  defaultReps: number;
  /** 默认重量（kg） */
  defaultWeight: number;
  /** 关联动作库 ID（null 表示自定义动作） */
  libraryId: string | null;
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
