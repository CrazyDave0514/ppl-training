/**
 * Mock 数据生成脚本
 * @description 生成模拟训练记录和身体记录，注入到 localStorage 用于功能展示和测试
 * @usage 在浏览器控制台中执行 injectMockData()，或在页面加载前注入
 */

import type { AppStorage, User, TrainingSession, BodyRecord, TrainingPlan, Exercise } from '../types';

/** localStorage 存储键名 */
const STORAGE_KEY = 'ppl-training-app';

/** 生成简易 UUID */
const generateId = (): string => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

/** 格式化日期为 YYYY-MM-DD */
const formatDate = (d: Date): string => d.toISOString().split('T')[0];

/** 获取过去 N 天的日期字符串 */
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

/**
 * Push 训练动作模板
 */
const pushExercises: Exercise[] = [
  { id: generateId(), name: '杠铃卧推', defaultSets: 4, defaultReps: 8, defaultWeight: 60, libraryId: 'push-001' },
  { id: generateId(), name: '上斜哑铃卧推', defaultSets: 3, defaultReps: 10, defaultWeight: 22, libraryId: 'push-004' },
  { id: generateId(), name: '哑铃飞鸟', defaultSets: 3, defaultReps: 12, defaultWeight: 14, libraryId: 'push-005' },
  { id: generateId(), name: '哑铃肩推', defaultSets: 4, defaultReps: 10, defaultWeight: 20, libraryId: 'push-008' },
  { id: generateId(), name: '绳索侧平举', defaultSets: 3, defaultReps: 15, defaultWeight: 8, libraryId: 'push-009' },
  { id: generateId(), name: '三头绳索下压', defaultSets: 3, defaultReps: 12, defaultWeight: 25, libraryId: 'push-012' },
];

/**
 * Pull 训练动作模板
 */
const pullExercises: Exercise[] = [
  { id: generateId(), name: '引体向上', defaultSets: 4, defaultReps: 8, defaultWeight: 0, libraryId: 'pull-001' },
  { id: generateId(), name: '杠铃划船', defaultSets: 4, defaultReps: 10, defaultWeight: 50, libraryId: 'pull-003' },
  { id: generateId(), name: '坐姿绳索划船', defaultSets: 3, defaultReps: 12, defaultWeight: 45, libraryId: 'pull-005' },
  { id: generateId(), name: '高位下拉', defaultSets: 3, defaultReps: 10, defaultWeight: 50, libraryId: 'pull-002' },
  { id: generateId(), name: '面拉', defaultSets: 3, defaultReps: 15, defaultWeight: 12, libraryId: 'pull-009' },
  { id: generateId(), name: '杠铃弯举', defaultSets: 3, defaultReps: 12, defaultWeight: 25, libraryId: 'pull-011' },
];

/**
 * Legs 训练动作模板
 */
const legsExercises: Exercise[] = [
  { id: generateId(), name: '杠铃深蹲', defaultSets: 4, defaultReps: 8, defaultWeight: 80, libraryId: 'legs-001' },
  { id: generateId(), name: '罗马尼亚硬拉', defaultSets: 4, defaultReps: 10, defaultWeight: 70, libraryId: 'legs-003' },
  { id: generateId(), name: '腿举', defaultSets: 3, defaultReps: 12, defaultWeight: 120, libraryId: 'legs-005' },
  { id: generateId(), name: '腿弯举', defaultSets: 3, defaultReps: 12, defaultWeight: 35, libraryId: 'legs-008' },
  { id: generateId(), name: '小腿提踵', defaultSets: 4, defaultReps: 15, defaultWeight: 60, libraryId: 'legs-011' },
  { id: generateId(), name: '保加利亚分腿蹲', defaultSets: 3, defaultReps: 10, defaultWeight: 20, libraryId: 'legs-007' },
];

/**
 * 根据动作模板生成模拟训练记录
 * @param userId - 用户 ID
 * @param type - 训练类型
 * @param date - 训练日期
 * @param exercises - 动作模板
 * @returns 训练记录对象
 */
const createMockSession = (
  userId: string,
  type: TrainingSession['type'],
  date: string,
  exercises: Exercise[]
): TrainingSession => {
  const planNames: Record<string, string> = {
    push: 'Push 推日计划',
    pull: 'Pull 拉日计划',
    legs: 'Legs 腿日计划',
  };

  return {
    id: generateId(),
    userId,
    planId: `mock-plan-${type}`,
    planName: planNames[type],
    type,
    date,
    exercises: exercises.map(ex => ({
      id: generateId(),
      name: ex.name,
      sets: Array.from({ length: ex.defaultSets ?? 3 }, () => ({
        reps: (ex.defaultReps ?? 10) + Math.floor(Math.random() * 3) - 1,
        weight: Math.max(0, (ex.defaultWeight ?? 0) + Math.floor(Math.random() * 5) - 2),
      })),
      isFromPlan: true,
      libraryId: ex.libraryId ?? null,
    })),
    createdAt: new Date(date).toISOString(),
  };
};

/**
 * 生成模拟身体记录
 * @param userId - 用户 ID
 * @param date - 记录日期
 * @param dayOffset - 距今天数（用于体重趋势计算）
 * @param baseWeight - 基础体重
 * @returns 身体记录对象
 */
const createMockBodyRecord = (
  userId: string,
  date: string,
  dayOffset: number,
  baseWeight: number
): BodyRecord => ({
  id: generateId(),
  userId,
  date,
  // 体重缓慢下降趋势：每天约 -0.02kg，加随机波动 ±0.5kg
  weight: Math.round((baseWeight - dayOffset * 0.02 + (Math.random() - 0.5) * 1.0) * 10) / 10,
  // 体脂率缓慢下降：从 20% 开始，每天约 -0.03%，加随机波动
  bodyFat: Math.round((20 - dayOffset * 0.03 + (Math.random() - 0.5) * 1.5) * 10) / 10,
  createdAt: new Date(date).toISOString(),
});

/**
 * 生成完整的 Mock 数据（全新注入）
 * @returns AppStorage 对象
 */
export const generateMockData = (): AppStorage => {
  const userId = 'mock-user-001';
  const user: User = {
    id: userId,
    name: '健身达人',
    avatar: undefined,
    height: 175,
    birthDate: '1995-06-15',
    age: 30,
    bloodType: 'A',
    gender: '男',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // 生成训练记录：过去 84 天（12 周），约 55-60 条
  const sessions: TrainingSession[] = [];
  const trainingTypes: TrainingSession['type'][] = ['push', 'pull', 'legs'];
  let typeIndex = 0;

  for (let day = 84; day >= 1; day--) {
    // 模拟训练频率：约 70% 的天数有训练
    const shouldTrain = Math.random() < 0.70;
    if (shouldTrain) {
      const type = trainingTypes[typeIndex % 3];
      typeIndex++;
      const exercises = type === 'push' ? pushExercises : type === 'pull' ? pullExercises : legsExercises;
      sessions.push(createMockSession(userId, type, daysAgo(day), exercises));
    }
  }

  // 生成训练计划
  const plans: TrainingPlan[] = [
    { id: `mock-plan-push`, userId, name: 'Push 推日计划', type: 'push', source: 'template', exercises: pushExercises, dayOfWeek: [1], createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: `mock-plan-pull`, userId, name: 'Pull 拉日计划', type: 'pull', source: 'template', exercises: pullExercises, dayOfWeek: [3], createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: `mock-plan-legs`, userId, name: 'Legs 腿日计划', type: 'legs', source: 'template', exercises: legsExercises, dayOfWeek: [5], createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  // 生成身体记录：过去 30 天，约每 1-2 天一次，约 20 条
  const bodyRecords: BodyRecord[] = [];
  for (let day = 30; day >= 1; day--) {
    if (day % 2 === 0 || Math.random() < 0.4) {
      bodyRecords.push(createMockBodyRecord(userId, daysAgo(day), day, 73));
    }
  }

  return {
    currentUser: userId,
    users: [user],
    plans: { [userId]: plans },
    sessions: { [userId]: sessions },
    bodyRecords: { [userId]: bodyRecords },
    userProfiles: {},
    dietRecords: {},
  };
};

/**
 * 向当前已有用户追加 Mock 数据（不覆盖现有数据）
 * @description 读取当前 localStorage 中的用户 ID，追加训练和身体记录
 */
export const appendMockData = (): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 无数据时使用全量注入
      injectMockData();
      return;
    }

    const storage = JSON.parse(raw);
    const userId = storage.currentUser;
    if (!userId || !storage.users || storage.users.length === 0) {
      injectMockData();
      return;
    }

    // 确保字段存在
    if (!storage.sessions) storage.sessions = {};
    if (!storage.bodyRecords) storage.bodyRecords = {};
    if (!storage.sessions[userId]) storage.sessions[userId] = [];
    if (!storage.bodyRecords[userId]) storage.bodyRecords[userId] = [];

    // 获取已有日期集合，避免重复
    const existingDates = new Set(storage.sessions[userId].map((s: TrainingSession) => s.date));
    const existingBodyDates = new Set(storage.bodyRecords[userId].map((r: BodyRecord) => r.date));

    const trainingTypes: TrainingSession['type'][] = ['push', 'pull', 'legs'];
    let typeIndex = 0;
    let newSessions = 0;
    let newBodyRecords = 0;

    // 追加训练记录：过去 84 天
    for (let day = 84; day >= 1; day--) {
      const date = daysAgo(day);
      if (existingDates.has(date)) continue;

      if (Math.random() < 0.70) {
        const type = trainingTypes[typeIndex % 3];
        typeIndex++;
        const exercises = type === 'push' ? pushExercises : type === 'pull' ? pullExercises : legsExercises;
        storage.sessions[userId].push(createMockSession(userId, type, date, exercises));
        existingDates.add(date);
        newSessions++;
      }
    }

    // 追加身体记录：过去 30 天
    for (let day = 30; day >= 1; day--) {
      const date = daysAgo(day);
      if (existingBodyDates.has(date)) continue;

      if (day % 2 === 0 || Math.random() < 0.4) {
        storage.bodyRecords[userId].push(createMockBodyRecord(userId, date, day, 73));
        newBodyRecords++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    console.log('✅ Mock 数据追加完成！');
    console.log(`- 用户: ${storage.users.find((u: User) => u.id === userId)?.name || userId}`);
    console.log(`- 新增训练记录: ${newSessions} 条（总计 ${storage.sessions[userId].length} 条）`);
    console.log(`- 新增身体记录: ${newBodyRecords} 条（总计 ${storage.bodyRecords[userId].length} 条）`);
    console.log('请刷新页面查看效果。');
  } catch (error) {
    console.error('追加 Mock 数据失败:', error);
  }
};

/**
 * 将 Mock 数据注入到 localStorage（全量覆盖）
 * @description 调用此函数后刷新页面即可看到模拟数据
 */
export const injectMockData = (): void => {
  const mockData = generateMockData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  console.log('✅ Mock 数据已注入！');
  console.log(`- 用户: ${mockData.users[0].name}`);
  console.log(`- 训练记录: ${mockData.sessions[mockData.currentUser!].length} 条`);
  console.log(`- 身体记录: ${mockData.bodyRecords[mockData.currentUser!].length} 条`);
  console.log(`- 训练计划: ${mockData.plans[mockData.currentUser!].length} 个`);
  console.log('请刷新页面查看效果。');
};

export default generateMockData;
