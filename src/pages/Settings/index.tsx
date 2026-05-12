/**
 * 设置页面 - V1.2.2 重构版
 * @description 合并身体信息+健身档案为二级页面，移除 AI 设置
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { useAuth } from '../../store/AuthContext';
import { useProfile } from '../../store/ProfileContext';
import { clearStorage } from '../../utils/storage';
import { compressImage } from '../../utils/imageUtils';

/**
 * 设置页面组件
 */
const Settings: React.FC = () => {
  const { currentUser, updateUser, refreshUsers } = useUser();
  const { logout } = useAuth();
  const { hasProfile } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showNameEditor, setShowNameEditor] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');

  /**
   * 保存昵称
   */
  const handleSaveName = () => {
    if (!currentUser) return;
    if (name.trim()) {
      updateUser(currentUser.id, { name: name.trim() });
      setShowNameEditor(false);
    }
  };

  /**
   * 修改头像
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * 清除所有数据
   */
  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
      clearStorage();
      window.location.reload();
    }
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

        {/* 健身档案（合并入口） */}
        <div>
          <h3 className="text-sm font-medium text-[#8E8E93] mb-2 px-1">个人档案</h3>
          <div className="bg-white rounded-2xl">
            <button
              onClick={() => navigate('/profile-wizard')}
              className="w-full flex items-center justify-between p-4 active:bg-[#F2F2F7] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#007AFF]/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#1C1C1E]">健身档案</p>
                  <p className="text-xs text-[#8E8E93]">
                    {hasProfile ? '已配置，点击编辑' : '未配置，点击设置'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasProfile && (
                  <span className="text-xs bg-[#34C759] text-white px-2 py-0.5 rounded-full">已配置</span>
                )}
                <svg className="w-4 h-4 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* 其他 */}
        <div>
          <h3 className="text-sm font-medium text-[#8E8E93] mb-2 px-1">其他</h3>
          <div className="bg-white rounded-2xl divide-y divide-[#E5E5EA]">
            <div className="flex items-center justify-between p-4">
              <span className="text-sm text-[#1C1C1E]">版本</span>
              <span className="text-sm text-[#8E8E93]">V1.2.2</span>
            </div>
            <button
              onClick={() => currentUser ? handleClearData() : alert('请先登录')}
              className="w-full flex items-center justify-between p-4 active:bg-[#F2F2F7] transition-colors"
            >
              <span className="text-sm text-[#FF3B30]">清除所有数据</span>
              <svg className="w-4 h-4 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
