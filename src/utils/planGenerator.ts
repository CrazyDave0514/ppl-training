/**
 * 智能计划生成引擎 - V1.2.2 重构版
 * @description 根据用户画像（训练经验 × 器械）匹配动作模板，按实际天数生成计划
 */

import type { UserProfile, WeeklySchedule, DayPlan, TrainingPlan, TrainingType, Exercise } from '../types';
import { generateId } from './storage';

/**
 * 动作配置项
 */
interface ExerciseConfig {
  name: string;
  sets: number;
  reps: string;
  weightAdvice: string;
  targetMuscle: string;
  equipment: string[];
  avoidInjuries: string[];
}

/**
 * 训练类型配置
 */
interface TypeConfig {
  push: ExerciseConfig[];
  pull: ExerciseConfig[];
  legs: ExerciseConfig[];
}

/**
 * 经验级别配置
 */
interface ExperienceConfig {
  beginner: TypeConfig;
  intermediate: TypeConfig;
  advanced: TypeConfig;
}

/**
 * 动作模板库（按经验 × 器械维度）
 */
const EXERCISE_TEMPLATES: Record<string, ExperienceConfig> = {
  // 初级 × 自重
  'beginner_bodyweight': {
    beginner: {
      push: [
        { name: '标准俯卧撑', sets: 3, reps: '8-12', weightAdvice: '自重', targetMuscle: '胸大肌', equipment: ['bodyweight'], avoidInjuries: ['shoulder', 'wrist'] },
        { name: '上斜俯卧撑', sets: 3, reps: '10-15', weightAdvice: '自重', targetMuscle: '上胸', equipment: ['bodyweight'], avoidInjuries: ['shoulder'] },
        { name: '钻石俯卧撑', sets: 3, reps: '8-12', weightAdvice: '自重', targetMuscle: '肱三头', equipment: ['bodyweight'], avoidInjuries: ['shoulder', 'wrist'] },
        { name: '折刀俯卧撑', sets: 3, reps: '8-12', weightAdvice: '自重', targetMuscle: '肩部前束', equipment: ['bodyweight'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '反向划船', sets: 3, reps: '8-12', weightAdvice: '自重', targetMuscle: '背阔肌', equipment: ['bodyweight'], avoidInjuries: ['lower_back'] },
        { name: '俯身Y字伸展', sets: 3, reps: '10-15', weightAdvice: '自重', targetMuscle: '上背部', equipment: ['bodyweight'], avoidInjuries: ['lower_back'] },
        { name: '反向窄距俯卧撑', sets: 3, reps: '8-12', weightAdvice: '自重', targetMuscle: '肱二头', equipment: ['bodyweight'], avoidInjuries: ['shoulder'] },
        { name: '超人支撑', sets: 3, reps: '10-15', weightAdvice: '自重', targetMuscle: '下背部', equipment: ['bodyweight'], avoidInjuries: ['lower_back'] },
      ],
      legs: [
        { name: '徒手深蹲', sets: 3, reps: '12-15', weightAdvice: '自重', targetMuscle: '股四头', equipment: ['bodyweight'], avoidInjuries: ['knee'] },
        { name: '交替弓步蹲', sets: 3, reps: '10-12每侧', weightAdvice: '自重', targetMuscle: '股四头/臀', equipment: ['bodyweight'], avoidInjuries: ['knee'] },
        { name: '臀桥', sets: 3, reps: '15-20', weightAdvice: '自重', targetMuscle: '臀大肌', equipment: ['bodyweight'], avoidInjuries: ['lower_back'] },
        { name: '提踵', sets: 3, reps: '15-20', weightAdvice: '自重', targetMuscle: '小腿', equipment: ['bodyweight'], avoidInjuries: [] },
      ],
    },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 中级 × 哑铃
  'intermediate_dumbbell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: {
      push: [
        { name: '哑铃卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '胸大肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜哑铃卧推', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '上胸', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃肩推', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肩部', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃侧平举', sets: 4, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '三角肌中束', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃颈后臂屈伸', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '肱三头', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '哑铃俯身划船', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '单臂哑铃划船', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '中背部', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '哑铃弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['dumbbell'], avoidInjuries: ['wrist'] },
        { name: '哑铃反向飞鸟', sets: 4, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '后三角肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      legs: [
        { name: '哑铃深蹲', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['dumbbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '哑铃罗马尼亚硬拉', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '腘绳肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '哑铃箭步蹲', sets: 4, reps: '10-12每侧', weightAdvice: '中等重量', targetMuscle: '股四头/臀', equipment: ['dumbbell'], avoidInjuries: ['knee'] },
        { name: '哑铃提踵', sets: 4, reps: '15-20', weightAdvice: '中等重量', targetMuscle: '小腿', equipment: ['dumbbell'], avoidInjuries: [] },
      ],
    },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 初级 × 哑铃
  'beginner_dumbbell': {
    beginner: {
      push: [
        { name: '哑铃卧推', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '胸大肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜哑铃卧推', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '上胸', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃肩推', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '肩部', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃侧平举', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '三角肌中束', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃颈后臂屈伸', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '肱三头', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '哑铃俯身划船', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '背阔肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '单臂哑铃划船', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '中背部', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '哑铃弯举', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '肱二头', equipment: ['dumbbell'], avoidInjuries: ['wrist'] },
        { name: '哑铃反向飞鸟', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '后三角肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      legs: [
        { name: '高脚杯深蹲', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '股四头', equipment: ['dumbbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '哑铃箭步蹲', sets: 3, reps: '10-12每侧', weightAdvice: '轻重量', targetMuscle: '股四头/臀', equipment: ['dumbbell'], avoidInjuries: ['knee'] },
        { name: '哑铃罗马尼亚硬拉', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '腘绳肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '哑铃提踵', sets: 3, reps: '15-20', weightAdvice: '轻重量', targetMuscle: '小腿', equipment: ['dumbbell'], avoidInjuries: [] },
      ],
    },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 中级 × 杠铃
  'intermediate_barbell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: {
      push: [
        { name: '杠铃卧推', sets: 4, reps: '8-10', weightAdvice: '70% 1RM', targetMuscle: '胸大肌', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜哑铃卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '上胸', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃肩推', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肩部', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃侧平举', sets: 4, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '三角肌中束', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '绳索三头下压', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '肱三头', equipment: ['cable'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '杠铃俯身划船', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '单臂哑铃划船', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '中背部', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '杠铃弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['barbell'], avoidInjuries: ['wrist'] },
        { name: '面拉', sets: 4, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '后三角肌', equipment: ['cable'], avoidInjuries: ['shoulder'] },
      ],
      legs: [
        { name: '杠铃深蹲', sets: 4, reps: '8-10', weightAdvice: '70% 1RM', targetMuscle: '股四头', equipment: ['barbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '罗马尼亚硬拉', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '腘绳肌', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '腿举', sets: 4, reps: '10-12', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '提踵', sets: 4, reps: '15-20', weightAdvice: '中等重量', targetMuscle: '小腿', equipment: ['machine'], avoidInjuries: [] },
      ],
    },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 高级 × 全器械
  'advanced_full': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '杠铃卧推', sets: 5, reps: '6-8', weightAdvice: '75-80% 1RM', targetMuscle: '胸大肌', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜哑铃卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '上胸', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '绳索夹胸', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '胸肌内侧', equipment: ['cable'], avoidInjuries: ['shoulder'] },
        { name: '杠铃肩推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '肩部', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃侧平举', sets: 5, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '三角肌中束', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '双杠臂屈伸', sets: 4, reps: '8-10', weightAdvice: '自重或负重', targetMuscle: '肱三头/下胸', equipment: ['bodyweight'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '引体向上', sets: 5, reps: '6-10', weightAdvice: '自重或负重', targetMuscle: '背阔肌', equipment: ['bodyweight'], avoidInjuries: ['shoulder'] },
        { name: '杠铃俯身划船', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '中背部', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '坐姿划船', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['lower_back'] },
        { name: '杠铃弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['barbell'], avoidInjuries: ['wrist'] },
        { name: '锤式弯举', sets: 3, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '肱桡肌', equipment: ['dumbbell'], avoidInjuries: ['wrist'] },
        { name: '面拉', sets: 4, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '后三角肌', equipment: ['cable'], avoidInjuries: ['shoulder'] },
      ],
      legs: [
        { name: '杠铃深蹲', sets: 5, reps: '6-8', weightAdvice: '75-80% 1RM', targetMuscle: '股四头', equipment: ['barbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '罗马尼亚硬拉', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '腘绳肌', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '腿举', sets: 4, reps: '10-12', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '保加利亚分腿蹲', sets: 4, reps: '8-10每侧', weightAdvice: '中等重量', targetMuscle: '臀大肌/股四头', equipment: ['dumbbell'], avoidInjuries: ['knee'] },
        { name: '腿屈伸', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿弯举', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '腘绳肌', equipment: ['machine'], avoidInjuries: [] },
      ],
    },
  },
  // 初级 × 壶铃
  'beginner_kettlebell': {
    beginner: {
      push: [
        { name: '壶铃推举', sets: 3, reps: '10', weightAdvice: '选择合适重量的壶铃', targetMuscle: '三角肌前束/中束', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '壶铃地板推', sets: 3, reps: '10', weightAdvice: '选择合适重量的壶铃', targetMuscle: '胸大肌', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '壶铃单臂划船', sets: 3, reps: '10每侧', weightAdvice: '选择合适重量的壶铃', targetMuscle: '背阔肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带面拉', sets: 3, reps: '15', weightAdvice: '选择轻阻力弹力带', targetMuscle: '三角肌后束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带弯举', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '壶铃高脚杯深蹲', sets: 3, reps: '10', weightAdvice: '选择合适重量的壶铃', targetMuscle: '股四头/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '壶铃硬拉', sets: 3, reps: '10', weightAdvice: '选择合适重量的壶铃', targetMuscle: '腘绳肌/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带臀桥', sets: 3, reps: '15', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
      ],
    },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 初级 × 弹力带
  'beginner_band': {
    beginner: {
      push: [
        { name: '弹力带胸前推', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '胸大肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 3, reps: '15', weightAdvice: '选择轻阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带三头伸展', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱三头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '弹力带高位下拉', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带划船', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带弯举', sets: 3, reps: '12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '弹力带深蹲', sets: 3, reps: '15', weightAdvice: '选择中等阻力弹力带', targetMuscle: '股四头/臀大肌', equipment: ['band'], avoidInjuries: ['knee'] },
        { name: '弹力带臀桥', sets: 3, reps: '15', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带侧步走', sets: 3, reps: '15每侧', weightAdvice: '选择轻阻力弹力带', targetMuscle: '臀中肌', equipment: ['band'], avoidInjuries: ['knee'] },
      ],
    },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 中级 × 壶铃
  'intermediate_kettlebell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: {
      push: [
        { name: '壶铃推举', sets: 4, reps: '8-10', weightAdvice: '选择中等偏重壶铃', targetMuscle: '三角肌前束/中束', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '壶铃地板推', sets: 4, reps: '8-10', weightAdvice: '选择中等偏重壶铃', targetMuscle: '胸大肌', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 4, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '壶铃单臂划船', sets: 4, reps: '8-10每侧', weightAdvice: '选择中等偏重壶铃', targetMuscle: '背阔肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带面拉', sets: 4, reps: '12-15', weightAdvice: '选择轻阻力弹力带', targetMuscle: '三角肌后束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带弯举', sets: 4, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '壶铃高脚杯深蹲', sets: 4, reps: '8-10', weightAdvice: '选择中等偏重壶铃', targetMuscle: '股四头/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '壶铃硬拉', sets: 4, reps: '8-10', weightAdvice: '选择中等偏重壶铃', targetMuscle: '腘绳肌/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带臀桥', sets: 4, reps: '12-15', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
      ],
    },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 中级 × 弹力带
  'intermediate_band': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: {
      push: [
        { name: '弹力带胸前推', sets: 4, reps: '10-12', weightAdvice: '选择中等偏重阻力弹力带', targetMuscle: '胸大肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 4, reps: '12-15', weightAdvice: '选择轻阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带三头伸展', sets: 4, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱三头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '弹力带高位下拉', sets: 4, reps: '10-12', weightAdvice: '选择中等偏重阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带划船', sets: 4, reps: '10-12', weightAdvice: '选择中等偏重阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带弯举', sets: 4, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '弹力带深蹲', sets: 4, reps: '12-15', weightAdvice: '选择中等偏重阻力弹力带', targetMuscle: '股四头/臀大肌', equipment: ['band'], avoidInjuries: ['knee'] },
        { name: '弹力带臀桥', sets: 4, reps: '12-15', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带侧步走', sets: 4, reps: '12-15每侧', weightAdvice: '选择轻阻力弹力带', targetMuscle: '臀中肌', equipment: ['band'], avoidInjuries: ['knee'] },
      ],
    },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 高级 × 壶铃
  'advanced_kettlebell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '壶铃推举', sets: 5, reps: '6-8', weightAdvice: '选择较重壶铃', targetMuscle: '三角肌前束/中束', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '壶铃地板推', sets: 5, reps: '6-8', weightAdvice: '选择较重壶铃', targetMuscle: '胸大肌', equipment: ['kettlebell'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 5, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '壶铃单臂划船', sets: 5, reps: '6-8每侧', weightAdvice: '选择较重壶铃', targetMuscle: '背阔肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带面拉', sets: 4, reps: '12-15', weightAdvice: '选择轻阻力弹力带', targetMuscle: '三角肌后束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带弯举', sets: 4, reps: '8-10', weightAdvice: '选择中等阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '壶铃高脚杯深蹲', sets: 5, reps: '6-8', weightAdvice: '选择较重壶铃', targetMuscle: '股四头/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '壶铃硬拉', sets: 5, reps: '6-8', weightAdvice: '选择较重壶铃', targetMuscle: '腘绳肌/臀大肌', equipment: ['kettlebell'], avoidInjuries: ['lower_back'] },
        { name: '弹力带臀桥', sets: 4, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
      ],
    },
  },
  // 高级 × 弹力带
  'advanced_band': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '弹力带胸前推', sets: 5, reps: '8-10', weightAdvice: '选择较重阻力弹力带', targetMuscle: '胸大肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带侧平举', sets: 5, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '三角肌中束', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带三头伸展', sets: 5, reps: '8-10', weightAdvice: '选择较重阻力弹力带', targetMuscle: '肱三头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '弹力带高位下拉', sets: 5, reps: '8-10', weightAdvice: '选择较重阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['shoulder'] },
        { name: '弹力带划船', sets: 5, reps: '8-10', weightAdvice: '选择较重阻力弹力带', targetMuscle: '背阔肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带弯举', sets: 5, reps: '8-10', weightAdvice: '选择较重阻力弹力带', targetMuscle: '肱二头肌', equipment: ['band'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '弹力带深蹲', sets: 5, reps: '10-12', weightAdvice: '选择较重阻力弹力带', targetMuscle: '股四头/臀大肌', equipment: ['band'], avoidInjuries: ['knee'] },
        { name: '弹力带臀桥', sets: 5, reps: '10-12', weightAdvice: '选择中等阻力弹力带', targetMuscle: '臀大肌', equipment: ['band'], avoidInjuries: ['lower_back'] },
        { name: '弹力带侧步走', sets: 4, reps: '10-12每侧', weightAdvice: '选择轻阻力弹力带', targetMuscle: '臀中肌', equipment: ['band'], avoidInjuries: ['knee'] },
      ],
    },
  },
  // 高级 × 杠铃
  'advanced_barbell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '杠铃卧推', sets: 5, reps: '6-8', weightAdvice: '75-80% 1RM', targetMuscle: '胸大肌', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜杠铃卧推', sets: 4, reps: '8-10', weightAdvice: '70% 1RM', targetMuscle: '上胸', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '杠铃肩推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '肩部', equipment: ['barbell'], avoidInjuries: ['shoulder'] },
        { name: '窄距卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '肱三头', equipment: ['barbell'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '杠铃俯身划船', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '杠铃弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['barbell'], avoidInjuries: ['wrist'] },
        { name: '反向弯举', sets: 4, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '肱桡肌', equipment: ['barbell'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '杠铃深蹲', sets: 5, reps: '6-8', weightAdvice: '75-80% 1RM', targetMuscle: '股四头', equipment: ['barbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '罗马尼亚硬拉', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '腘绳肌', equipment: ['barbell'], avoidInjuries: ['lower_back'] },
        { name: '杠铃箭步蹲', sets: 4, reps: '8-10每侧', weightAdvice: '中等重量', targetMuscle: '股四头/臀', equipment: ['barbell'], avoidInjuries: ['knee'] },
      ],
    },
  },
  // 高级 × 哑铃
  'advanced_dumbbell': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '哑铃卧推', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '胸大肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '上斜哑铃卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '上胸', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃肩推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '肩部', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃侧平举', sets: 5, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '三角肌中束', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
        { name: '哑铃颈后臂屈伸', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱三头', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      pull: [
        { name: '哑铃俯身划船', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '单臂哑铃划船', sets: 5, reps: '6-8每侧', weightAdvice: '中等偏重', targetMuscle: '中背部', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '哑铃弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['dumbbell'], avoidInjuries: ['wrist'] },
        { name: '哑铃反向飞鸟', sets: 4, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '后三角肌', equipment: ['dumbbell'], avoidInjuries: ['shoulder'] },
      ],
      legs: [
        { name: '哑铃深蹲', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['dumbbell'], avoidInjuries: ['knee', 'lower_back'] },
        { name: '哑铃罗马尼亚硬拉', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '腘绳肌', equipment: ['dumbbell'], avoidInjuries: ['lower_back'] },
        { name: '保加利亚分腿蹲', sets: 4, reps: '8-10每侧', weightAdvice: '中等重量', targetMuscle: '臀大肌/股四头', equipment: ['dumbbell'], avoidInjuries: ['knee'] },
        { name: '哑铃提踵', sets: 4, reps: '12-15', weightAdvice: '中等重量', targetMuscle: '小腿', equipment: ['dumbbell'], avoidInjuries: [] },
      ],
    },
  },
  // 高级 × 固定器械
  'advanced_machine': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: {
      push: [
        { name: '器械卧推', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '胸大肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械肩推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '肩部', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械三头下压', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱三头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '坐姿划船', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['lower_back'] },
        { name: '高位下拉', sets: 5, reps: '6-8', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '腿举', sets: 5, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿屈伸', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿弯举', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '腘绳肌', equipment: ['machine'], avoidInjuries: [] },
        { name: '坐姿提踵', sets: 4, reps: '12-15', weightAdvice: '中等重量', targetMuscle: '小腿', equipment: ['machine'], avoidInjuries: [] },
      ],
    },
  },
  // 中级 × 固定器械
  'intermediate_machine': {
    beginner: { push: [], pull: [], legs: [] },
    intermediate: {
      push: [
        { name: '器械卧推', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '胸大肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械肩推', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肩部', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械三头下压', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '肱三头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '坐姿划船', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['lower_back'] },
        { name: '高位下拉', sets: 4, reps: '8-10', weightAdvice: '中等偏重', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械弯举', sets: 4, reps: '8-10', weightAdvice: '中等重量', targetMuscle: '肱二头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '腿举', sets: 4, reps: '10-12', weightAdvice: '中等偏重', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿屈伸', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿弯举', sets: 4, reps: '10-12', weightAdvice: '中等重量', targetMuscle: '腘绳肌', equipment: ['machine'], avoidInjuries: [] },
      ],
    },
    advanced: { push: [], pull: [], legs: [] },
  },
  // 初级 × 固定器械
  'beginner_machine': {
    beginner: {
      push: [
        { name: '器械卧推', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '胸大肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械肩推', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '肩部', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械三头下压', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '肱三头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      pull: [
        { name: '坐姿划船', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['lower_back'] },
        { name: '高位下拉', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '背阔肌', equipment: ['machine'], avoidInjuries: ['shoulder'] },
        { name: '器械弯举', sets: 3, reps: '10-12', weightAdvice: '轻重量', targetMuscle: '肱二头', equipment: ['machine'], avoidInjuries: ['wrist'] },
      ],
      legs: [
        { name: '腿举', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿屈伸', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '股四头', equipment: ['machine'], avoidInjuries: ['knee'] },
        { name: '腿弯举', sets: 3, reps: '12-15', weightAdvice: '轻重量', targetMuscle: '腘绳肌', equipment: ['machine'], avoidInjuries: [] },
      ],
    },
    intermediate: { push: [], pull: [], legs: [] },
    advanced: { push: [], pull: [], legs: [] },
  },
};

/**
 * 根据用户器械选择匹配模板键
 * @description 按经验级别优先匹配器械，确保任何器械组合都能生成动作
 */
function getTemplateKey(experience: string, equipment: string[]): string {
  const hasBarbell = equipment.includes('barbell');
  const hasDumbbell = equipment.includes('dumbbell');
  const hasMachine = equipment.includes('machine');
  const hasKettlebell = equipment.includes('kettlebell');
  const hasBand = equipment.includes('band');
  // 保留此变量用于未来扩展
  const hasBodyweight = equipment.includes('bodyweight');
  void hasBodyweight;
  
  // 高级优先
  if (experience === 'advanced') {
    if (hasBarbell && hasDumbbell && hasMachine) return 'advanced_full';
    if (hasBarbell) return 'advanced_barbell';
    if (hasDumbbell) return 'advanced_dumbbell';
    if (hasKettlebell) return 'advanced_kettlebell';
    if (hasBand) return 'advanced_band';
    if (hasMachine) return 'advanced_machine';
  }
  
  // 中级
  if (experience === 'intermediate') {
    if (hasBarbell) return 'intermediate_barbell';
    if (hasDumbbell) return 'intermediate_dumbbell';
    if (hasKettlebell) return 'intermediate_kettlebell';
    if (hasBand) return 'intermediate_band';
    if (hasMachine) return 'intermediate_machine';
  }
  
  // 初级
  if (hasDumbbell) return 'beginner_dumbbell';
  if (hasKettlebell) return 'beginner_kettlebell';
  if (hasBand) return 'beginner_band';
  if (hasMachine) return 'beginner_machine';
  
  return 'beginner_bodyweight';
}

/**
 * 根据伤病过滤动作
 */
function filterByInjuries(exercises: ExerciseConfig[], injuries: string[]): ExerciseConfig[] {
  if (injuries.includes('none') || injuries.length === 0) {
    return exercises;
  }
  
  return exercises.filter(ex => {
    // 检查动作是否有用户伤病对应的避免标记
    return !ex.avoidInjuries.some(injury => injuries.includes(injury));
  });
}

/**
 * 将 ExerciseConfig 转换为 Exercise
 */
function convertToExercise(config: ExerciseConfig, index: number): Exercise {
  return {
    id: `ex-${index}`,
    name: config.name,
    sets: config.sets,
    reps: config.reps,
    weight: 0, // 用户自行填写
    restSeconds: 60,
    completed: false,
    setRecords: [],
  };
}

/**
 * 根据每周天数确定训练分割方案
 */
function getSplitScheme(days: number): TrainingType[] {
  switch (days) {
    case 2:
      return ['push', 'pull']; // 全身分化简化版
    case 3:
      return ['push', 'pull', 'legs'];
    case 4:
      return ['push', 'pull', 'legs', 'push'];
    case 5:
      return ['push', 'pull', 'legs', 'push', 'pull'];
    case 6:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
    case 7:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'push'];
    default:
      return ['push', 'pull', 'legs', 'push'];
  }
}

/**
 * 生成一周训练计划（V1.2.2 按实际天数生成）
 */
export function generateWeeklySchedule(profile: UserProfile): WeeklySchedule {
  const templateKey = getTemplateKey(profile.experience, profile.availableEquipment);
  const template = EXERCISE_TEMPLATES[templateKey];
  
  if (!template) {
    throw new Error(`未找到模板: ${templateKey}`);
  }
  
  const experienceConfig = template[profile.experience];
  const splitScheme = getSplitScheme(profile.trainingDays);
  
  const days: DayPlan[] = [];
  
  splitScheme.forEach((type, index) => {
    // type 只会是 push/pull/legs，不会是 free
    const typeExercises = experienceConfig[type as keyof TypeConfig];
    
    // 过滤伤病
    const filteredExercises = filterByInjuries(typeExercises, profile.injuries);
    
    // 转换为 Exercise 对象
    const exercises = filteredExercises.map((config, exIndex) => 
      convertToExercise(config, index * 100 + exIndex)
    );
    
    days.push({
      day: index + 1,
      label: `${['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index]} - ${type === 'push' ? '推' : type === 'pull' ? '拉' : '腿'}训练`,
      types: [type],
      exercises,
    });
  });
  
  return {
    days,
    weeklyGoal: profile.goals?.[0] || 'muscle', // 使用第一个选中的目标，默认增肌
  };
}

/**
 * 将周计划转换为 TrainingPlan 数组
 */
export function convertScheduleToPlans(schedule: WeeklySchedule, userId: string): TrainingPlan[] {
  const now = new Date().toISOString();
  
  return schedule.days.map((day) => {
    const type = day.types[0] || 'push';

    const jsDay = day.day === 7 ? 0 : day.day;

    // 生成计划名称（不带星期前缀）
    const typeName = type === 'push' ? '推训练' : type === 'pull' ? '拉训练' : '腿训练';
    
    return {
      id: generateId(),
      userId,
      name: typeName,
      type,
      source: 'ai',
      exercises: day.exercises,
      dayOfWeek: [jsDay],
      createdAt: now,
      updatedAt: now,
    };
  });
}
