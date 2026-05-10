/**
 * 记录页面
 * @description 包含运动和身体两个子模块
 */

import React, { useState } from 'react';
import { useUser } from '../../store/UserContext';
import Activity from './Activity';
import Body from './Body';

/**
 * 记录页面组件
 * @description 包含运动和身体两个子模块，未登录时也保持标签栏和 FAB 可见
 */
const Records: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'body'>('activity');
  const { currentUser } = useUser();

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 头部 */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] mb-3">记录</h1>

          {/* 子模块切换 */}
          <div className="flex bg-[#E5E5EA] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'activity'
                  ? 'bg-white text-[#1C1C1E] shadow-sm'
                  : 'text-[#8E8E93]'
              }`}
            >
              运动
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'body'
                  ? 'bg-white text-[#1C1C1E] shadow-sm'
                  : 'text-[#8E8E93]'
              }`}
            >
              身体
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'activity' ? <Activity /> : <Body />}
      </div>

      {/* 未登录时显示 FAB */}
      {!currentUser && (
        <button
          onClick={() => alert('请先登录后再操作')}
          className="fixed bottom-24 right-5 w-16 h-16 bg-[#007AFF] rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-10"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Records;
