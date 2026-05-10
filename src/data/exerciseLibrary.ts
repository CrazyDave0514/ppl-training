/**
 * 动作库数据 - 45个训练动作
 * @description 包含 Push/Pull/Legs 三分化的所有动作
 */

import type { ExerciseLibraryItem } from '../types';

/**
 * 动作库数据
 * 按训练类型分类：Push(推)、Pull(拉)、Legs(腿)
 */
export const exerciseLibrary: ExerciseLibraryItem[] = [
  // ==================== Push (推) - 15个动作 ====================
  {
    id: 'push-001',
    name: '杠铃卧推',
    category: 'push',
    targetMuscles: ['胸大肌', '三角肌前束', '肱三头肌'],
    description: '经典胸部训练动作',
    mediaUrl: null,
  },
  {
    id: 'push-002',
    name: '哑铃卧推',
    category: 'push',
    targetMuscles: ['胸大肌', '三角肌前束', '肱三头肌'],
    description: '哑铃版本允许更大的活动范围',
    mediaUrl: null,
  },
  {
    id: 'push-003',
    name: '上斜杠铃卧推',
    category: 'push',
    targetMuscles: ['胸大肌上部', '三角肌前束'],
    description: '重点训练上胸部',
    mediaUrl: null,
  },
  {
    id: 'push-004',
    name: '上斜哑铃卧推',
    category: 'push',
    targetMuscles: ['胸大肌上部', '三角肌前束'],
    description: '上斜角度建议30-45度',
    mediaUrl: null,
  },
  {
    id: 'push-005',
    name: '哑铃飞鸟',
    category: 'push',
    targetMuscles: ['胸大肌', '胸肌中缝'],
    description: '孤立训练胸肌，注意控制动作',
    mediaUrl: null,
  },
  {
    id: 'push-006',
    name: '绳索夹胸',
    category: 'push',
    targetMuscles: ['胸大肌', '胸肌中缝'],
    description: '持续张力，适合收尾',
    mediaUrl: null,
  },
  {
    id: 'push-007',
    name: '双杠臂屈伸',
    category: 'push',
    targetMuscles: ['胸大肌下部', '肱三头肌', '三角肌前束'],
    description: '身体前倾侧重胸部，直立侧重三头',
    mediaUrl: null,
  },
  {
    id: 'push-008',
    name: '坐姿哑铃推举',
    category: 'push',
    targetMuscles: ['三角肌前束', '三角肌中束', '肱三头肌'],
    description: '经典肩部训练动作',
    mediaUrl: null,
  },
  {
    id: 'push-009',
    name: '站姿杠铃推举',
    category: 'push',
    targetMuscles: ['三角肌前束', '三角肌中束', '肱三头肌'],
    description: '全身性肩部训练',
    mediaUrl: null,
  },
  {
    id: 'push-010',
    name: '哑铃侧平举',
    category: 'push',
    targetMuscles: ['三角肌中束'],
    description: '孤立训练中束，打造宽肩',
    mediaUrl: null,
  },
  {
    id: 'push-011',
    name: '绳索侧平举',
    category: 'push',
    targetMuscles: ['三角肌中束'],
    description: '持续张力，顶峰收缩',
    mediaUrl: null,
  },
  {
    id: 'push-012',
    name: '俯身哑铃飞鸟',
    category: 'push',
    targetMuscles: ['三角肌后束'],
    description: '训练后束，平衡肩部发展',
    mediaUrl: null,
  },
  {
    id: 'push-013',
    name: '窄距卧推',
    category: 'push',
    targetMuscles: ['肱三头肌', '胸大肌'],
    description: '重点训练肱三头肌',
    mediaUrl: null,
  },
  {
    id: 'push-014',
    name: '绳索下压',
    category: 'push',
    targetMuscles: ['肱三头肌'],
    description: '经典三头孤立动作',
    mediaUrl: null,
  },
  {
    id: 'push-015',
    name: '仰卧臂屈伸',
    category: 'push',
    targetMuscles: ['肱三头肌长头'],
    description: '重点刺激三头肌长头',
    mediaUrl: null,
  },

  // ==================== Pull (拉) - 15个动作 ====================
  {
    id: 'pull-001',
    name: '引体向上',
    category: 'pull',
    targetMuscles: ['背阔肌', '肱二头肌', '菱形肌'],
    description: '背部训练之王',
    mediaUrl: null,
  },
  {
    id: 'pull-002',
    name: '高位下拉',
    category: 'pull',
    targetMuscles: ['背阔肌', '肱二头肌', '大圆肌'],
    description: '引体向上的替代动作',
    mediaUrl: null,
  },
  {
    id: 'pull-003',
    name: '坐姿划船',
    category: 'pull',
    targetMuscles: ['背阔肌', '菱形肌', '斜方肌中部'],
    description: '厚背必备动作',
    mediaUrl: null,
  },
  {
    id: 'pull-004',
    name: '杠铃划船',
    category: 'pull',
    targetMuscles: ['背阔肌', '菱形肌', '斜方肌', '肱二头肌'],
    description: '经典自由重量背部动作',
    mediaUrl: null,
  },
  {
    id: 'pull-005',
    name: '哑铃单臂划船',
    category: 'pull',
    targetMuscles: ['背阔肌', '菱形肌', '肱二头肌'],
    description: '单侧训练，改善不平衡',
    mediaUrl: null,
  },
  {
    id: 'pull-006',
    name: '直臂下压',
    category: 'pull',
    targetMuscles: ['背阔肌'],
    description: '孤立训练背阔肌',
    mediaUrl: null,
  },
  {
    id: 'pull-007',
    name: '绳索面拉',
    category: 'pull',
    targetMuscles: ['三角肌后束', '菱形肌', '斜方肌中部'],
    description: '肩袖肌群训练，改善体态',
    mediaUrl: null,
  },
  {
    id: 'pull-008',
    name: '杠铃弯举',
    category: 'pull',
    targetMuscles: ['肱二头肌', '肱肌'],
    description: '经典二头训练',
    mediaUrl: null,
  },
  {
    id: 'pull-009',
    name: '哑铃弯举',
    category: 'pull',
    targetMuscles: ['肱二头肌', '肱肌'],
    description: '可交替或同时训练',
    mediaUrl: null,
  },
  {
    id: 'pull-010',
    name: '锤式弯举',
    category: 'pull',
    targetMuscles: ['肱肌', '肱桡肌', '肱二头肌'],
    description: '增加手臂厚度',
    mediaUrl: null,
  },
  {
    id: 'pull-011',
    name: '牧师凳弯举',
    category: 'pull',
    targetMuscles: ['肱二头肌短头'],
    description: '严格动作，孤立二头',
    mediaUrl: null,
  },
  {
    id: 'pull-012',
    name: '集中弯举',
    category: 'pull',
    targetMuscles: ['肱二头肌'],
    description: '极致孤立训练',
    mediaUrl: null,
  },
  {
    id: 'pull-013',
    name: '杠铃耸肩',
    category: 'pull',
    targetMuscles: ['斜方肌上部'],
    description: '训练斜方肌',
    mediaUrl: null,
  },
  {
    id: 'pull-014',
    name: '哑铃耸肩',
    category: 'pull',
    targetMuscles: ['斜方肌上部'],
    description: '更大活动范围',
    mediaUrl: null,
  },
  {
    id: 'pull-015',
    name: '反握高位下拉',
    category: 'pull',
    targetMuscles: ['背阔肌下部', '肱二头肌'],
    description: '反握刺激下背阔',
    mediaUrl: null,
  },

  // ==================== Legs (腿) - 15个动作 ====================
  {
    id: 'legs-001',
    name: '杠铃深蹲',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '腘绳肌', '核心'],
    description: '腿部训练之王',
    mediaUrl: null,
  },
  {
    id: 'legs-002',
    name: '颈前深蹲',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '核心'],
    description: '更侧重股四头肌',
    mediaUrl: null,
  },
  {
    id: 'legs-003',
    name: '哈克深蹲',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌'],
    description: '器械深蹲，更安全',
    mediaUrl: null,
  },
  {
    id: 'legs-004',
    name: '腿举',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '腘绳肌'],
    description: '大重量腿部训练',
    mediaUrl: null,
  },
  {
    id: 'legs-005',
    name: '罗马尼亚硬拉',
    category: 'legs',
    targetMuscles: ['腘绳肌', '臀大肌', '下背部'],
    description: '后侧链训练',
    mediaUrl: null,
  },
  {
    id: 'legs-006',
    name: '直腿硬拉',
    category: 'legs',
    targetMuscles: ['腘绳肌', '臀大肌', '下背部'],
    description: '重点拉伸腘绳肌',
    mediaUrl: null,
  },
  {
    id: 'legs-007',
    name: '腿弯举',
    category: 'legs',
    targetMuscles: ['腘绳肌'],
    description: '孤立训练腘绳肌',
    mediaUrl: null,
  },
  {
    id: 'legs-008',
    name: '腿屈伸',
    category: 'legs',
    targetMuscles: ['股四头肌'],
    description: '孤立训练股四头肌',
    mediaUrl: null,
  },
  {
    id: 'legs-009',
    name: '保加利亚分腿蹲',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '腘绳肌'],
    description: '单侧腿部训练',
    mediaUrl: null,
  },
  {
    id: 'legs-010',
    name: '箭步蹲',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '腘绳肌'],
    description: '行走或原地箭步蹲',
    mediaUrl: null,
  },
  {
    id: 'legs-011',
    name: '坐姿提踵',
    category: 'legs',
    targetMuscles: ['腓肠肌', '比目鱼肌'],
    description: '训练小腿肌群',
    mediaUrl: null,
  },
  {
    id: 'legs-012',
    name: '站姿提踵',
    category: 'legs',
    targetMuscles: ['腓肠肌'],
    description: '站姿训练小腿',
    mediaUrl: null,
  },
  {
    id: 'legs-013',
    name: '臀推',
    category: 'legs',
    targetMuscles: ['臀大肌', '腘绳肌'],
    description: '臀部孤立训练',
    mediaUrl: null,
  },
  {
    id: 'legs-014',
    name: '相扑硬拉',
    category: 'legs',
    targetMuscles: ['股四头肌', '臀大肌', '内收肌', '腘绳肌'],
    description: '宽站距硬拉',
    mediaUrl: null,
  },
  {
    id: 'legs-015',
    name: '臀桥',
    category: 'legs',
    targetMuscles: ['臀大肌', '腘绳肌'],
    description: '自重或负重臀桥',
    mediaUrl: null,
  },
];

/**
 * 根据训练类型获取动作列表
 * @param category - 训练类型
 * @returns 动作列表
 */
export const getExercisesByCategory = (category: 'push' | 'pull' | 'legs'): ExerciseLibraryItem[] => {
  return exerciseLibrary.filter(ex => ex.category === category);
};

/**
 * 根据 ID 获取动作
 * @param id - 动作 ID
 * @returns 动作对象或 undefined
 */
export const getExerciseById = (id: string): ExerciseLibraryItem | undefined => {
  return exerciseLibrary.find(ex => ex.id === id);
};

/**
 * 搜索动作
 * @param keyword - 关键词
 * @returns 匹配的动作列表
 */
export const searchExercises = (keyword: string): ExerciseLibraryItem[] => {
  const lowerKeyword = keyword.toLowerCase();
  return exerciseLibrary.filter(
    ex =>
      ex.name.toLowerCase().includes(lowerKeyword) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(lowerKeyword))
  );
};
