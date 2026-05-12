/**
 * 计划页面 - V1.2.2 重构版
 * @description 包含动作计划和饮食计划两个 Tab，支持智能计划生成
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { useProfile } from '../../store/ProfileContext';
import { useDiet } from '../../store/DietContext';
import type { TrainingPlan } from '../../types';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';
import { generateWeeklySchedule, convertScheduleToPlans } from '../../utils/planGenerator';
import { foodDatabase } from '../../data/foodDatabase';
import { addPlan } from '../../utils/storage';

/**
 * Tab 类型
 */
type TabType = 'action' | 'diet';

/**
 * 计划页面组件
 */
const Plans: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { plans, deletePlan, refreshPlans } = usePlan();
  const { profile, hasProfile } = useProfile();
  const { 
    mealPlan, 
    dailyNutrition, 
    waterIntake, 
    addWater,
    generateDailyMealPlan,
  } = useDiet();
  
  // 当前选中的 Tab
  const [activeTab, setActiveTab] = useState<TabType>('action');
  
  // 删除确认
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);
  
  // 生成计划弹窗
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  // 新增计划弹窗
  const [showAddModal, setShowAddModal] = useState(false);

  /**
   * 计划列表（V1.2.2 移除过滤，显示全部）
   */
  const displayPlans = currentUser ? plans : [];

  /**
   * 处理开始训练
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
   */
  const handleEditPlan = (planId: string) => {
    if (!currentUser) {
      alert('请先登录后再操作');
      return;
    }
    navigate(`/plan/${planId}?mode=edit`);
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
   * 处理生成智能计划
   */
  const handleGeneratePlan = async () => {
    if (!hasProfile || !profile) {
      navigate('/profile-wizard');
      return;
    }
    
    setGenerating(true);
    
    try {
      // 生成一周训练计划
      const weeklySchedule = generateWeeklySchedule(profile);
      
      // 转换为 TrainingPlan 并保存
      if (currentUser) {
        const generatedPlans = convertScheduleToPlans(weeklySchedule, currentUser.id);
        generatedPlans.forEach(plan => addPlan(currentUser.id, plan));
        refreshPlans();
      }
      
      alert('智能计划生成成功！已添加到您的计划列表。');
      setShowGenerateModal(false);
    } catch (error) {
      console.error('生成计划失败:', error);
      alert('生成计划失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * 处理生成饮食计划
   */
  const handleGenerateDietPlan = () => {
    if (!hasProfile || !profile) {
      navigate('/profile-wizard');
      return;
    }
    
    // 默认使用休息日配置，实际应该根据当天训练计划判断
    generateDailyMealPlan(profile, 'rest');
    alert('今日饮食计划已生成！');
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



  /**
   * 获取食物详情
   */
  const getFoodById = (foodId: string) => {
    return foodDatabase.find(f => f.id === foodId);
  };

  /**
   * 计算餐食营养
   */
  const calculateMealNutrition = (mealItems: { foodId: string; amount: number }[]) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    
    mealItems.forEach(item => {
      const food = getFoodById(item.foodId);
      if (food) {
        const ratio = item.amount / 100;
        calories += food.calories * ratio;
        protein += food.protein * ratio;
        carbs += food.carbs * ratio;
        fat += food.fat * ratio;
      }
    });
    
    return { calories: Math.round(calories), protein, carbs, fat };
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] mb-3">计划</h1>

          {/* 子模块切换 */}
          <div className="flex bg-[#E5E5EA] rounded-xl p-1">
            <button
              onClick={() => setActiveTab('action')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'action'
                  ? 'bg-white text-[#1C1C1E] shadow-sm'
                  : 'text-[#8E8E93]'
              }`}
            >
              动作计划
            </button>
            <button
              onClick={() => setActiveTab('diet')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === 'diet'
                  ? 'bg-white text-[#1C1C1E] shadow-sm'
                  : 'text-[#8E8E93]'
              }`}
            >
              饮食计划
            </button>
          </div>
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
            <p className="text-[#8E8E93] text-sm mb-4">请先登录查看计划</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              登录
            </button>
          </div>
        ) : activeTab === 'action' ? (
          /* 动作计划 Tab */
          <>
            {/* 计划列表（V1.2.2 移除过滤标签） */}
            {displayPlans.length > 0 ? (
              <div className="space-y-4">
                {displayPlans.map((plan, index) => (
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
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[#1C1C1E]">{plan.name}</h3>
                              <span className="text-xs text-[#8E8E93] bg-[#F2F2F7] px-2 py-0.5 rounded">
                                {plan.source === 'template' ? '模板' : plan.source === 'ai' ? '智能' : '自定义'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${trainingTypeTextColors[plan.type]}`}>
                                {trainingTypeLabels[plan.type]}
                              </p>
                              {plan.dayOfWeek && plan.dayOfWeek.length > 0 && (
                                <span className="text-xs text-[#8E8E93]">
                                  {plan.dayOfWeek.map(d => d === 1 ? '周一' : d === 2 ? '周二' : d === 3 ? '周三' : d === 4 ? '周四' : d === 5 ? '周五' : d === 6 ? '周六' : '周日').join('、')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
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
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/quick-create')}
                    className="bg-[#007AFF] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    快速创建
                  </button>
                  <button
                    onClick={() => hasProfile ? setShowGenerateModal(true) : navigate('/profile-wizard')}
                    className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    智能生成
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 饮食计划 Tab */
          <>
            {/* 营养概览卡片 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <h3 className="font-bold text-[#1C1C1E] mb-4">今日营养概览</h3>
              
              {/* 卡路里环形进度 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#E5E5EA"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#34C759"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(dailyNutrition.calories.actual / dailyNutrition.calories.target) * 226} 226`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-[#1C1C1E]">{dailyNutrition.calories.actual}</span>
                      <span className="text-xs text-[#8E8E93]">kcal</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-[#8E8E93]">目标: {dailyNutrition.calories.target} kcal</p>
                    <p className="text-sm text-[#34C759]">剩余: {dailyNutrition.calories.remaining} kcal</p>
                  </div>
                </div>
              </div>
              
              {/* 三大营养素 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-[#8E8E93] mb-1">蛋白质</p>
                  <p className="text-lg font-bold text-[#1C1C1E]">{dailyNutrition.protein.actual}g</p>
                  <p className="text-xs text-[#8E8E93]">/ {dailyNutrition.protein.target}g</p>
                  <div className="h-1 bg-[#E5E5EA] rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#007AFF] rounded-full"
                      style={{ width: `${Math.min((dailyNutrition.protein.actual / dailyNutrition.protein.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8E8E93] mb-1">碳水</p>
                  <p className="text-lg font-bold text-[#1C1C1E]">{dailyNutrition.carbs.actual}g</p>
                  <p className="text-xs text-[#8E8E93]">/ {dailyNutrition.carbs.target}g</p>
                  <div className="h-1 bg-[#E5E5EA] rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#FF9500] rounded-full"
                      style={{ width: `${Math.min((dailyNutrition.carbs.actual / dailyNutrition.carbs.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8E8E93] mb-1">脂肪</p>
                  <p className="text-lg font-bold text-[#1C1C1E]">{dailyNutrition.fat.actual}g</p>
                  <p className="text-xs text-[#8E8E93]">/ {dailyNutrition.fat.target}g</p>
                  <div className="h-1 bg-[#E5E5EA] rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-[#FF3B30] rounded-full"
                      style={{ width: `${Math.min((dailyNutrition.fat.actual / dailyNutrition.fat.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 水分摄入 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1C1C1E]">水分摄入</h3>
                <span className="text-[#007AFF] font-medium">{waterIntake} ml</span>
              </div>
              <div className="flex gap-2">
                {[250, 500, 750].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => addWater(amount)}
                    className="flex-1 bg-[#E5F0FF] text-[#007AFF] py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                  >
                    +{amount}ml
                  </button>
                ))}
              </div>
            </div>
            
            {/* 餐食列表 */}
            {mealPlan && (
              <div className="space-y-4">
                {[
                  { key: 'breakfast', label: '早餐', icon: '🌅' },
                  { key: 'lunch', label: '午餐', icon: '☀️' },
                  { key: 'dinner', label: '晚餐', icon: '🌙' },
                  { key: 'snack', label: '加餐', icon: '🍎' },
                ].map(({ key, label, icon }) => {
                  const items = mealPlan[key as keyof typeof mealPlan];
                  const nutrition = calculateMealNutrition(items);
                  
                  return (
                    <div key={key} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{icon}</span>
                          <h4 className="font-bold text-[#1C1C1E]">{label}</h4>
                        </div>
                        <span className="text-sm text-[#8E8E93]">{nutrition.calories} kcal</span>
                      </div>
                      
                      {items.length > 0 ? (
                        <div className="space-y-2">
                          {items.map((item, index) => {
                            const food = getFoodById(item.foodId);
                            if (!food) return null;
                            
                            return (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-[#F2F2F7] last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#F2F2F7] rounded-lg flex items-center justify-center text-lg">
                                    {food.icon}
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#1C1C1E]">{food.name}</p>
                                    <p className="text-xs text-[#8E8E93]">{item.amount}g · {Math.round(food.calories * item.amount / 100)} kcal</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-[#8E8E93] text-center py-4">暂无食物</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* 生成饮食计划按钮 */}
            <button
              onClick={handleGenerateDietPlan}
              className="w-full mt-6 bg-[#34C759] text-white text-base font-semibold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              生成今日饮食计划
            </button>
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

      {/* 新增计划弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-6">添加计划</h2>
            <div className="space-y-3">
              <button
                onClick={() => { setShowAddModal(false); navigate('/quick-create'); }}
                className="w-full bg-[#007AFF] text-white font-medium py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                快速创建
              </button>
              <button
                onClick={() => { setShowAddModal(false); hasProfile ? setShowGenerateModal(true) : navigate('/profile-wizard'); }}
                className="w-full bg-[#34C759] text-white font-medium py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                智能生成
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-3 text-[#8E8E93] font-medium py-2.5 rounded-xl transition-all duration-200"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 生成计划弹窗 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowGenerateModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-green-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">生成智能计划</h2>
            <p className="text-[#8E8E93] text-center mb-6">
              根据您的用户画像，系统将为您生成一周个性化训练计划
            </p>
            
            {profile && (
              <div className="bg-[#F2F2F7] rounded-xl p-4 mb-6">
                <p className="text-sm text-[#8E8E93] mb-2">当前画像</p>
                <div className="space-y-1">
                  <p className="text-sm text-[#1C1C1E]">目标: {profile.goals?.map(g => g === 'muscle' ? '增肌' : g === 'fat_loss' ? '减脂' : g === 'shape' ? '塑形' : '维持').join('、') || '未设置'}</p>
                  <p className="text-sm text-[#1C1C1E]">频率: 每周 {profile.trainingDays} 天</p>
                  <p className="text-sm text-[#1C1C1E]">经验: {profile.experience === 'beginner' ? '初级' : profile.experience === 'intermediate' ? '中级' : '高级'}</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="flex-1 bg-[#34C759] text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {generating ? '生成中...' : '确认生成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 悬浮添加按钮 */}
      {activeTab === 'action' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-5 w-16 h-16 bg-[#007AFF] text-white rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-40"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Plans;
