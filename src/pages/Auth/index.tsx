/**
 * 授权登录页面
 * @description 输入授权码验证后才能访问应用，支持历史账号快速登录
 */

import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { getCachedAccounts, clearCachedAccounts, type CachedAccount } from '../../utils/authCache';

/**
 * 授权登录页面组件
 */
const Auth: React.FC = () => {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cachedAccounts, setCachedAccounts] = useState<CachedAccount[]>(() => getCachedAccounts());

  /**
   * 处理提交
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 模拟验证延迟
    setTimeout(() => {
      const success = login(code);
      if (!success) {
        setError('授权码无效，请检查后重试');
      }
      setIsLoading(false);
    }, 500);
  };

  /**
   * 处理历史账号点击 - 自动填入授权码并触发登录
   * @param account - 缓存的账号信息
   */
  const handleCachedAccountClick = (account: CachedAccount) => {
    setCode(account.authCode);
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(account.authCode);
      if (!success) {
        setError('授权码已失效，请重新输入');
      }
      setIsLoading(false);
    }, 500);
  };

  /**
   * 处理清除历史记录
   */
  const handleClearCache = () => {
    clearCachedAccounts();
    setCachedAccounts([]);
  };

  /**
   * 格式化最近登录时间
   * @param isoString - ISO 格式的时间字符串
   * @returns 格式化后的时间文本
   */
  const formatLoginTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#007AFF] rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1C1C1E]">FitPlus</h1>
          <p className="text-[#8E8E93] mt-2">内测版本，需要授权码访问</p>
        </div>

        {/* 授权码输入卡片 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                请输入授权码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入 64 位授权码"
                className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all font-mono text-sm"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl flex items-center gap-2 animate-fade-in">
                <svg className="w-5 h-5 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-[#FF3B30]">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="w-full bg-[#007AFF] text-white font-bold py-3 rounded-xl transition-all duration-200 disabled:bg-[#E5E5EA] disabled:text-[#8E8E93] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  验证中...
                </>
              ) : (
                '进入应用'
              )}
            </button>
          </form>
        </div>

        {/* 历史账号区域 */}
        {cachedAccounts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-medium text-[#8E8E93]">历史账号</span>
              <button
                onClick={handleClearCache}
                className="text-xs text-[#8E8E93] active:text-[#FF3B30] transition-colors"
              >
                清除历史记录
              </button>
            </div>
            <div className="space-y-2">
              {cachedAccounts.map((account) => (
                <button
                  key={account.authCode}
                  onClick={() => handleCachedAccountClick(account)}
                  disabled={isLoading}
                  className="w-full bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-[#F2F2F7] transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {account.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#1C1C1E]">{account.username}</p>
                      <p className="text-xs text-[#8E8E93]">
                        最近登录: {formatLoginTime(account.lastLoginTime)}
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        <p className="text-center text-xs text-[#8E8E93] mt-6">
          本应用目前处于内测阶段<br />
          如需授权码请联系开发者
        </p>
      </div>
    </div>
  );
};

export default Auth;
