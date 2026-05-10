/**
 * 存储层 - localStorage 操作封装
 * @description 封装 localStorage 读写操作，提供类型安全的存储接口
 */

import type { AppStorage, User, TrainingPlan, TrainingSession, BodyRecord } from '../types';

/** localStorage 存储键名 */
const STORAGE_KEY = 'ppl-training-app';

/**
 * 获取默认存储数据
 * @returns 初始化的 AppStorage 对象
 */
const getDefaultStorage = (): AppStorage => ({
  currentUser: null,
  users: [],
  plans: {},
  sessions: {},
  bodyRecords: {},
});

/**
 * 从 localStorage 读取应用数据
 * @returns AppStorage 对象，若不存在则返回默认数据
 */
export const getStorage = (): AppStorage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultStorage();
    }
    const parsed = JSON.parse(data);
    // 兼容旧版本数据：确保新增字段存在
    const defaults = getDefaultStorage();
    return {
      currentUser: parsed.currentUser ?? defaults.currentUser,
      users: parsed.users ?? defaults.users,
      plans: parsed.plans ?? defaults.plans,
      sessions: parsed.sessions ?? defaults.sessions,
      bodyRecords: parsed.bodyRecords ?? defaults.bodyRecords,
    } as AppStorage;
  } catch (error) {
    console.error('读取存储数据失败:', error);
    return getDefaultStorage();
  }
};

/**
 * 保存应用到 localStorage
 * @param data - 要保存的 AppStorage 数据
 */
export const setStorage = (data: AppStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存存储数据失败:', error);
  }
};

/**
 * 清除所有应用数据
 */
export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除存储数据失败:', error);
  }
};

// ==================== 用户相关操作 ====================

/**
 * 获取所有用户列表
 * @returns 用户数组
 */
export const getUsers = (): User[] => {
  const storage = getStorage();
  return storage.users;
};

/**
 * 获取当前用户
 * @returns 当前用户对象或 null
 */
export const getCurrentUser = (): User | null => {
  const storage = getStorage();
  if (!storage.currentUser) return null;
  return storage.users.find(u => u.id === storage.currentUser) || null;
};

/**
 * 设置当前用户
 * @param userId - 用户 ID 或 null
 */
export const setCurrentUser = (userId: string | null): void => {
  const storage = getStorage();
  storage.currentUser = userId;
  setStorage(storage);
};

/**
 * 添加用户
 * @param user - 用户对象
 */
export const addUser = (user: User): void => {
  const storage = getStorage();
  storage.users.push(user);
  // 如果是第一个用户，自动设为当前用户
  if (storage.users.length === 1) {
    storage.currentUser = user.id;
  }
  setStorage(storage);
};

/**
 * 删除用户及其关联数据
 * @param userId - 用户 ID
 */
export const deleteUser = (userId: string): void => {
  const storage = getStorage();
  storage.users = storage.users.filter(u => u.id !== userId);
  delete storage.plans[userId];
  delete storage.sessions[userId];
  // 如果删除的是当前用户，重置当前用户
  if (storage.currentUser === userId) {
    storage.currentUser = storage.users.length > 0 ? storage.users[0].id : null;
  }
  setStorage(storage);
};

// ==================== 计划相关操作 ====================

/**
 * 获取用户的所有计划
 * @param userId - 用户 ID
 * @returns 计划数组
 */
export const getPlansByUser = (userId: string): TrainingPlan[] => {
  const storage = getStorage();
  return storage.plans[userId] || [];
};

/**
 * 根据 ID 获取计划
 * @param userId - 用户 ID
 * @param planId - 计划 ID
 * @returns 计划对象或 undefined
 */
export const getPlanById = (userId: string, planId: string): TrainingPlan | undefined => {
  const plans = getPlansByUser(userId);
  return plans.find(p => p.id === planId);
};

/**
 * 添加计划
 * @param userId - 用户 ID
 * @param plan - 计划对象
 */
export const addPlan = (userId: string, plan: TrainingPlan): void => {
  const storage = getStorage();
  if (!storage.plans[userId]) {
    storage.plans[userId] = [];
  }
  storage.plans[userId].push(plan);
  setStorage(storage);
};

/**
 * 更新计划
 * @param userId - 用户 ID
 * @param plan - 更新后的计划对象
 */
export const updatePlan = (userId: string, plan: TrainingPlan): void => {
  const storage = getStorage();
  if (!storage.plans[userId]) return;
  const index = storage.plans[userId].findIndex(p => p.id === plan.id);
  if (index !== -1) {
    storage.plans[userId][index] = plan;
    setStorage(storage);
  }
};

/**
 * 删除计划
 * @param userId - 用户 ID
 * @param planId - 计划 ID
 */
export const deletePlan = (userId: string, planId: string): void => {
  const storage = getStorage();
  if (!storage.plans[userId]) return;
  storage.plans[userId] = storage.plans[userId].filter(p => p.id !== planId);
  setStorage(storage);
};

// ==================== 训练记录相关操作 ====================

/**
 * 获取用户的所有训练记录
 * @param userId - 用户 ID
 * @returns 训练记录数组（按日期倒序）
 */
export const getSessionsByUser = (userId: string): TrainingSession[] => {
  const storage = getStorage();
  return (storage.sessions[userId] || []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * 根据 ID 获取训练记录
 * @param userId - 用户 ID
 * @param sessionId - 记录 ID
 * @returns 训练记录对象或 undefined
 */
export const getSessionById = (userId: string, sessionId: string): TrainingSession | undefined => {
  const sessions = getSessionsByUser(userId);
  return sessions.find(s => s.id === sessionId);
};

/**
 * 添加训练记录
 * @param userId - 用户 ID
 * @param session - 训练记录对象
 */
export const addSession = (userId: string, session: TrainingSession): void => {
  const storage = getStorage();
  if (!storage.sessions[userId]) {
    storage.sessions[userId] = [];
  }
  storage.sessions[userId].push(session);
  setStorage(storage);
};

/**
 * 删除训练记录
 * @param userId - 用户 ID
 * @param sessionId - 记录 ID
 */
export const deleteSession = (userId: string, sessionId: string): void => {
  const storage = getStorage();
  if (!storage.sessions[userId]) return;
  storage.sessions[userId] = storage.sessions[userId].filter(s => s.id !== sessionId);
  setStorage(storage);
};

/**
 * 更新训练记录
 * @param userId - 用户 ID
 * @param sessionId - 记录 ID
 * @param updates - 需要更新的字段
 */
export const updateSession = (
  userId: string,
  sessionId: string,
  updates: Partial<Omit<TrainingSession, 'id' | 'userId'>>
): void => {
  const storage = getStorage();
  if (!storage.sessions[userId]) return;
  const index = storage.sessions[userId].findIndex(s => s.id === sessionId);
  if (index === -1) return;
  storage.sessions[userId][index] = {
    ...storage.sessions[userId][index],
    ...updates,
  };
  setStorage(storage);
};

/**
 * 获取用户最近一次的训练记录
 * @param userId - 用户 ID
 * @returns 最近的训练记录或 undefined
 */
export const getLastSession = (userId: string): TrainingSession | undefined => {
  const sessions = getSessionsByUser(userId);
  return sessions[0];
};

/**
 * 获取用户今日训练记录
 * @param userId - 用户 ID
 * @returns 今日训练记录数组
 */
export const getTodaySessions = (userId: string): TrainingSession[] => {
  const today = new Date().toISOString().split('T')[0];
  const sessions = getSessionsByUser(userId);
  return sessions.filter(s => s.date === today);
};

// ==================== 身体记录相关操作 ====================

/**
 * 获取用户的所有身体记录
 * @param userId - 用户 ID
 * @returns 身体记录数组（按日期倒序）
 */
export const getBodyRecordsByUser = (userId: string): BodyRecord[] => {
  const storage = getStorage();
  return (storage.bodyRecords[userId] || []).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * 添加或更新身体记录（同日期自动去重，保留最新值）
 * @param record - 身体记录对象
 */
export const addBodyRecord = (record: BodyRecord): void => {
  const storage = getStorage();
  if (!storage.bodyRecords[record.userId]) {
    storage.bodyRecords[record.userId] = [];
  }
  // 同日期去重：若已存在该日期的记录，则更新而非新增
  const existingIndex = storage.bodyRecords[record.userId].findIndex(
    r => r.date === record.date
  );
  if (existingIndex !== -1) {
    storage.bodyRecords[record.userId][existingIndex] = {
      ...storage.bodyRecords[record.userId][existingIndex],
      weight: record.weight,
      bodyFat: record.bodyFat,
    };
  } else {
    storage.bodyRecords[record.userId].push(record);
  }
  setStorage(storage);
};

/**
 * 更新身体记录
 * @param userId - 用户 ID
 * @param recordId - 记录 ID
 * @param updates - 需要更新的字段
 */
export const updateBodyRecord = (
  userId: string,
  recordId: string,
  updates: Partial<Pick<BodyRecord, 'date' | 'weight' | 'bodyFat'>>
): void => {
  const storage = getStorage();
  if (!storage.bodyRecords[userId]) return;
  const index = storage.bodyRecords[userId].findIndex(r => r.id === recordId);
  if (index === -1) return;
  storage.bodyRecords[userId][index] = {
    ...storage.bodyRecords[userId][index],
    ...updates,
  };
  setStorage(storage);
};

/**
 * 删除身体记录
 * @param userId - 用户 ID
 * @param recordId - 记录 ID
 */
export const deleteBodyRecord = (userId: string, recordId: string): void => {
  const storage = getStorage();
  if (!storage.bodyRecords[userId]) return;
  storage.bodyRecords[userId] = storage.bodyRecords[userId].filter(r => r.id !== recordId);
  setStorage(storage);
};

// ==================== 用户更新操作 ====================

/**
 * 更新用户资料
 * @param userId - 用户 ID
 * @param updates - 需要更新的字段
 */
export const updateUser = (userId: string, updates: Partial<User>): void => {
  const storage = getStorage();
  const index = storage.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    storage.users[index] = { ...storage.users[index], ...updates };
    setStorage(storage);
  }
};
