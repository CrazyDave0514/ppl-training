/**
 * 授权缓存工具
 * @description 管理授权账号的本地缓存，支持最多 5 个历史账号
 */

/** 缓存存储 key */
const AUTH_CACHE_KEY = 'ppl-training-auth-cache';

/** 缓存账号最大数量 */
const MAX_CACHE_COUNT = 5;

/**
 * 缓存账号类型
 */
export interface CachedAccount {
  /** 用户名 */
  username: string;
  /** 授权码 */
  authCode: string;
  /** 最近登录时间（ISO 字符串） */
  lastLoginTime: string;
}

/**
 * 获取所有缓存的账号
 * @returns 缓存账号数组，按最近登录时间降序排列
 */
export const getCachedAccounts = (): CachedAccount[] => {
  try {
    const raw: string | null = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return [];
    const accounts: CachedAccount[] = JSON.parse(raw);
    return accounts.sort(
      (a: CachedAccount, b: CachedAccount) =>
        new Date(b.lastLoginTime).getTime() - new Date(a.lastLoginTime).getTime()
    );
  } catch {
    return [];
  }
};

/**
 * 清除所有缓存的账号
 */
export const clearCachedAccounts = (): void => {
  localStorage.removeItem(AUTH_CACHE_KEY);
};

/**
 * 将账号添加到缓存
 * @description 最多缓存 5 个账号，超出淘汰最久未使用的
 * @param username - 用户名
 * @param authCode - 授权码
 */
export const cacheAccount = (username: string, authCode: string): void => {
  const accounts: CachedAccount[] = getCachedAccounts();

  // 如果已存在相同授权码的账号，移除旧的（更新登录时间）
  const filtered = accounts.filter((a: CachedAccount) => a.authCode !== authCode);

  // 添加新记录
  const newAccount: CachedAccount = {
    username,
    authCode,
    lastLoginTime: new Date().toISOString(),
  };
  filtered.unshift(newAccount);

  // 最多保留 MAX_CACHE_COUNT 个
  const trimmed = filtered.slice(0, MAX_CACHE_COUNT);

  localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(trimmed));
};
