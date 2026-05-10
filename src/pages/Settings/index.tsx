/**
 * 设置页面
 * @description 个人资料编辑、身体信息配置、系统设置
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { useAuth } from '../../store/AuthContext';
import { clearStorage } from '../../utils/storage';
import { compressImage, calcAge } from '../../utils/imageUtils';

/**
 * 设置页面组件
 * @description 个人资料编辑、身体信息配置、系统设置，未登录时保持所有按钮入口
 */
const Settings: React.FC = () => {
  const { currentUser, updateUser, refreshUsers } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNameEditor, setShowNameEditor] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');

  const [height, setHeight] = useState(currentUser?.height || 170);
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '');
  const [bloodType, setBloodType] = useState(currentUser?.bloodType || '');
  const [gender, setGender] = useState(currentUser?.gender || '');

  /**
   * 未登录时的通用拦截处理
   * @description 提示用户先登录
   */
  const requireLogin = () => {
    alert('请先登录');
  };

  const age = birthDate ? calcAge(birthDate) : undefined;

  /**
   * 保存昵称
   * @description 已登录时更新用户昵称，未登录时拦截
   */
  const handleSaveName = () => {
    if (!currentUser) return;
    if (name.trim()) {
      updateUser(currentUser.id, { name: name.trim() });
      setShowNameEditor(false);
    }
  };

  /**
   * 修改身高
   * @description 已登录时更新身高数据，未登录时拦截
   * @param delta - 身高变化量
   */
  const handleHeightChange = (delta: number) => {
    if (!currentUser) return;
    const newHeight = Math.min(250, Math.max(100, height + delta));
    setHeight(newHeight);
    updateUser(currentUser.id, { height: newHeight });
  };

  /**
   * 修改出生日期
   * @description 已登录时更新出生日期和年龄，未登录时拦截
   * @param date - 新的出生日期
   */
  const handleBirthDateChange = (date: string) => {
    if (!currentUser) return;
    setBirthDate(date);
    const calculatedAge = calcAge(date);
    updateUser(currentUser.id, { birthDate: date, age: calculatedAge });
  };

  /**
   * 修改头像
   * @description 已登录时压缩并更新头像，未登录时拦截
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 200, 0.8);
      updateUser(currentUser.id, { avatar: base64 });
    } catch (err) {
      console.error('头像上传失败:', err);
    }
    // 重置 input，允许重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * 清除所有数据
   * @description 弹出确认后清除本地存储并刷新页面
   */
  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      clearStorage();
      window.location.reload();
    }
  };

  /**
   * 处理性别变更
   * @description 已登录时更新性别，未登录时拦截
   */
  const handleGenderChange = (value: string) => {
    if (!currentUser) return;
    setGender(value);
    updateUser(currentUser.id, { gender: value || undefined });
  };

  /**
   * 处理血型变更
   * @description 已登录时更新血型，未登录时拦截
   */
  const handleBloodTypeChange = (value: string) => {
    if (!currentUser) return;
    setBloodType(value);
    updateUser(currentUser.id, { bloodType: value || undefined });
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E]">设置</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* 未登录时显示登录入口 */}
        {!currentUser && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-[#8E8E93]">未登录</p>
                  <p className="text-xs text-[#8E8E93]">登录后可编辑个人资料</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="bg-[#007AFF] text-white text-sm font-medium px-4 py-2 rounded-xl active:scale-[0.98] transition-transform"
              >
                登录
              </button>
            </div>
          </div>
        )}

        {/* 用户资料卡片 */}
        {currentUser && (
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden active:scale-[0.95] transition-transform relative"
              >
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="头像" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-[#007AFF] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-[#1C1C1E]">{currentUser.name}</p>
                <p className="text-xs text-[#8E8E93]">点击头像修改</p>
              </div>
              <button
                onClick={() => { setName(currentUser.name); setShowNameEditor(true); }}
                className="text-[#007AFF] text-sm"
              >
                编辑
              </button>
            </div>
          </div>
        )}

        {/* 身体信息 */}
        <div>
          <h3 className="text-sm font-medium text-[#8E8E93] mb-2 px-1">身体信息</h3>
          <div className="bg-white rounded-2xl divide-y divide-[#E5E5EA]">
            {/* 身高 - 步进选择器 */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">身高</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => currentUser ? handleHeightChange(-1) : requireLogin()}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-sm text-[#007AFF] w-12 text-center font-medium">{height}</span>
                <button
                  onClick={() => currentUser ? handleHeightChange(1) : requireLogin()}
                  className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center active:bg-[#E5E5EA] transition-colors"
                >
                  <svg className="w-4 h-4 text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-xs text-[#8E8E93]">cm</span>
              </div>
            </div>

            {/* 出生日期 */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">出生日期</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => currentUser ? handleBirthDateChange(e.target.value) : requireLogin()}
                  max={new Date().toISOString().split('T')[0]}
                  className="text-sm text-[#007AFF] bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* 年龄（自动计算，只读） */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">年龄</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8E8E93]">
                  {age !== undefined ? `${age} 岁` : '未设置'}
                </span>
              </div>
            </div>

            {/* 性别 */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">性别</span>
              <select
                value={gender}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="text-sm text-[#007AFF] bg-transparent focus:outline-none"
              >
                <option value="">未设置</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>

            {/* 血型 */}
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">血型</span>
              <select
                value={bloodType}
                onChange={(e) => handleBloodTypeChange(e.target.value)}
                className="text-sm text-[#007AFF] bg-transparent focus:outline-none"
              >
                <option value="">未设置</option>
                <option value="A">A 型</option>
                <option value="B">B 型</option>
                <option value="O">O 型</option>
                <option value="AB">AB 型</option>
              </select>
            </div>
          </div>
        </div>

        {/* 其他 */}
        <div>
          <h3 className="text-sm font-medium text-[#8E8E93] mb-2 px-1">其他</h3>
          <div className="bg-white rounded-2xl divide-y divide-[#E5E5EA]">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">版本</span>
              <span className="text-sm text-[#8E8E93]">V1.2.1</span>
            </div>
            <button
              onClick={() => currentUser ? handleClearData() : requireLogin()}
              className="w-full flex items-center justify-between p-4 active:bg-[#F2F2F7] transition-colors"
            >
              <span className="text-sm text-[#FF3B30]">清除所有数据</span>
              <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* 退出登录按钮仅在已登录时显示 */}
            {currentUser && (
              <button
                onClick={() => {
                  if (window.confirm('确定要退出登录吗？')) {
                    logout();
                    refreshUsers();
                  }
                }}
                className="w-full flex items-center justify-between p-4 active:bg-[#F2F2F7] transition-colors"
              >
                <span className="text-sm text-[#FF3B30]">退出登录</span>
                <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 昵称编辑弹窗 */}
      {showNameEditor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-4">修改昵称</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameEditor(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-sm font-medium active:scale-[0.98] transition-transform"
              >
                取消
              </button>
              <button
                onClick={handleSaveName}
                disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#007AFF] text-white text-sm font-medium active:scale-[0.98] transition-transform disabled:bg-[#E5E5EA] disabled:text-[#8E8E93]"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
