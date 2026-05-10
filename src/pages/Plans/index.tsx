/**
 * 计划列表页面
 * @description Apple Health 风格显示所有训练计划，支持开始训练、编辑、删除
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import type { TrainingPlan } from '../../types';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';

/**
 * 计划列表页面组件
 * @description Apple Health 风格显示所有训练计划，未登录时保持 UI 布局并显示空状态引导
 */
const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { plans, deletePlan } = usePlan();
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);
  const [filter, setFilter] = useState<'all' | 'push' | 'pull' | 'legs'>('all');

  /**
   * 过滤后的计划列表
   */
  const filteredPlans = currentUser && filter === 'all' ? plans : currentUser ? plans.filter((p) => p.type === filter) : [];

  /**
   * 按类型分组的计划
   */
  const plansByType = {
    push: plans.filter((p) => p.type === 'push'),
    pull: plans.filter((p) => p.type === 'pull'),
    legs: plans.filter((p) => p.type === 'legs'),
  };

  /**
   * 处理开始训练
   * @description 未登录时提示登录，已登录时跳转到训练页面
   */
  const handleStartTraining = (planId: string) => {
    if (!currentUser) {
      alert('请先登录后再操作');
      return;
    }
    navigate(`/training?planId=${planId}`);
  };

  /**
   * 处理编辑计划
   * @description 未登录时提示登录，已登录时跳转到编辑页面
   */
  const handleEditPlan = (planId: string) => {
    if (!currentUser) {
      alert('请先登录后再操作');
      return;
    }
    navigate(`/plan/${planId}`);
  };

  /**
   * 处理删除计划
   */
  const handleDeletePlan = () => {
    if (planToDelete) {
      deletePlan(planToDelete.id);
      setPlanToDelete(null);
    }
  };

  /**
   * 处理快速创建
   * @description 未登录时提示登录，已登录时跳转到快速创建页面
   */
  const handleQuickCreate = () => {
    if (!currentUser) {
      alert('请先登录后再操作');
      return;
    }
    navigate('/quick-create');
  };

  /**
   * 获取训练类型图标
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'pull':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'legs':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
          </svg>
        );
      default:
        return null;
    }
  };

  const filterTabs = [
    { key: 'all', label: '全部', count: plans.length },
    { key: 'push', label: 'Push', count: plansByType.push.length },
    { key: 'pull', label: 'Pull', count: plansByType.pull.length },
    { key: 'legs', label: 'Legs', count: plansByType.legs.length },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5EA] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] text-[#007AFF] transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1C1C1E]">我的计划</h1>
          </div>
          <button
            onClick={handleQuickCreate}
            className="bg-[#007AFF] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建
          </button>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 未登录时显示空状态引导 */}
        {!currentUser ? (
          <div className="py-16 flex flex-col items-center px-4">
            <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-[#8E8E93] text-sm mb-4">请先登录查看训练计划</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              登录
            </button>
          </div>
        ) : (
          <>
            {/* 过滤标签 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as typeof filter)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                    filter === tab.key
                      ? 'bg-[#007AFF] text-white'
                      : 'bg-white text-[#8E8E93] shadow-sm'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* 计划列表 */}
            {filteredPlans.length > 0 ? (
              <div className="space-y-4">
                {filteredPlans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trainingTypeIconColors[plan.type]}`}>
                            {getTypeIcon(plan.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1C1C1E]">{plan.name}</h3>
                            <p className={`text-sm font-medium ${trainingTypeTextColors[plan.type]}`}>
                              {trainingTypeLabels[plan.type]}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-[#8E8E93] bg-[#F2F2F7] px-2 py-1 rounded-lg">
                          {plan.source === 'template' ? '模板' : '自定义'}
                        </span>
                      </div>

                      {/* 动作预览 */}
                      <div className="bg-[#F2F2F7] rounded-xl p-3 mb-4">
                        <p className="text-sm text-[#8E8E93] mb-2">{plan.exercises.length} 个动作</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.exercises.slice(0, 4).map((ex) => (
                            <span
                              key={ex.id}
                              className="text-xs bg-white text-[#1C1C1E] px-2.5 py-1 rounded-lg"
                            >
                              {ex.name}
                            </span>
                          ))}
                          {plan.exercises.length > 4 && (
                            <span className="text-xs text-[#8E8E93] px-2 py-1">+{plan.exercises.length - 4}</span>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartTraining(plan.id)}
                          className="flex-1 bg-[#007AFF] text-white font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                        >
                          开始训练
                        </button>
                        <button
                          onClick={() => handleEditPlan(plan.id)}
                          className="px-4 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl transition-all duration-200 active:scale-[0.98]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan)}
                          className="px-4 bg-[#F2F2F7] text-[#FF3B30] rounded-xl transition-all duration-200 active:scale-[0.98]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-[#F2F2F7] rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">还没有计划</h3>
                <p className="text-[#8E8E93] mb-6">创建您的第一个训练计划开始追踪</p>
                <button
                  onClick={() => navigate('/quick-create')}
                  className="bg-[#007AFF] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  快速创建
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 删除确认弹窗 */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setPlanToDelete(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">确认删除</h2>
            <p className="text-[#8E8E93] text-center mb-2">
              确定要删除计划 <span className="text-[#1C1C1E] font-medium">"{planToDelete.name}"</span> 吗？
            </p>
            <p className="text-sm text-[#8E8E93] text-center mb-6">此操作不可恢复</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPlanToDelete(null)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleDeletePlan}
                className="flex-1 bg-[#FF3B30] text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
