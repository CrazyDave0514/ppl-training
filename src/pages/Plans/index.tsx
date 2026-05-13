/**
 * 计划页面 - V1.2.3 重构版
 * @description 包含动作计划和饮食计划两个 Tab，支持智能计划生成
 * V1.2.3 更新：弧形进度、按餐食打卡、单日单计划限制
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { useProfile } from '../../store/ProfileContext';
import { useDiet } from '../../store/DietContext';
import type { TrainingPlan, TrainingType } from '../../types';
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
 * 餐食类型
 */
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * 餐食标签
 */
const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};



/**
 * 多层弧形进度组件
 */
const MultiArcProgress: React.FC<{
  nutrition: {
    calories: { actual: number; target: number };
    protein: { actual: number; target: number };
    carbs: { actual: number; target: number };
    fat: { actual: number; target: number };
  };
}> = ({ nutrition }) => {
  const size = 240;
  const center = size / 2;
  const startAngle = 150;
  const endAngle = 390;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const describeArc = (radius: number, start: number, end: number) => {
    const startRad = toRad(start);
    const endRad = toRad(end);
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  const layers = [
    { radius: 100, color: '#FF9500', value: nutrition.carbs.actual, max: nutrition.carbs.target, label: '碳水' },
    { radius: 85, color: '#007AFF', value: nutrition.protein.actual, max: nutrition.protein.target, label: '蛋白质' },
    { radius: 70, color: '#FF3B30', value: nutrition.fat.actual, max: nutrition.fat.target, label: '脂肪' },
    { radius: 55, color: '#34C759', value: nutrition.calories.actual, max: nutrition.calories.target, label: '热量' },
  ];
  
  const totalAngle = endAngle - startAngle;
  
  return (
    <div className="relative flex justify-center" style={{ width: size, height: size * 0.9 }}>
      <svg width={size} height={size} className="overflow-visible">
        {layers.map((layer, index) => {
          const progress = layer.max > 0 ? Math.min(layer.value / layer.max, 1) : 0;
          const currentAngle = startAngle + totalAngle * progress;
          const bgPath = describeArc(layer.radius, startAngle, endAngle);
          const progressPath = describeArc(layer.radius, startAngle, currentAngle);
          
          return (
            <g key={index}>
              <path d={bgPath} fill="none" stroke="#E5E5EA" strokeWidth={10} strokeLinecap="round" />
              <path d={progressPath} fill="none" stroke={layer.color} strokeWidth={10} strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
            </g>
          );
        })}
      </svg>
      {/* 中心显示总热量 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
        <span className="text-4xl font-bold text-[#1C1C1E]">{nutrition.calories.actual}</span>
        <span className="text-xs text-[#8E8E93] mt-1">已摄入 kcal</span>
        <span className="text-xs text-[#34C759] mt-1">目标 {nutrition.calories.target}</span>
      </div>
    </div>
  );
};

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
    actualNutrition,
    generateDailyMealPlan,
    generateWeeklyMealPlan,
    addFoodToMeal,
    removeFoodFromMeal,
    deleteDailyDietPlan,
    checkInMeal,
    uncheckInMeal,
    completedMeals,
  } = useDiet();
  
  // 当前选中的 Tab
  const [activeTab, setActiveTab] = useState<TabType>('action');
  
  // 删除确认
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);
  
  // 生成计划弹窗
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  

  
  // 餐食编辑弹窗
  const [editingMeal, setEditingMeal] = useState<MealType | null>(null);
  
  // 添加食物弹窗
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodAmount, setFoodAmount] = useState<number>(100);
  
  // 删除饮食计划确认
  const [showDeleteDietModal, setShowDeleteDietModal] = useState(false);

  /**
   * 计划列表
   */
  const displayPlans = currentUser ? plans : [];

  /**
   * 检查是否可以生成饮食计划
   */
  const canGenerateDietPlan = hasProfile && plans.length > 0;
  
  /**
   * 获取当前日期的字符串
   */
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  /**
   * 获取今日饮食记录
   */
  const getTodayDietRecord = () => {
    // 从 dietRecords 中查找今日记录
    // 这里简化处理，实际应该从 useDiet 获取
    return mealPlan && mealPlan.breakfast.length > 0;
  };

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
      const weeklySchedule = generateWeeklySchedule(profile);
      
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
   * 处理生成本周饮食计划
   */
  const handleGenerateWeeklyDietPlan = () => {
    if (!hasProfile || !profile) {
      navigate('/profile-wizard');
      return;
    }
    
    // 构建每天的训练类型映射
    const dayTrainingMap = [1, 2, 3, 4, 5, 6, 7].map(day => {
      const dayPlans = plans.filter(p => p.dayOfWeek?.includes(day));
      return {
        dayOfWeek: day,
        trainingType: dayPlans.length > 0 ? dayPlans[0].type : 'rest' as TrainingType | 'rest',
      };
    });
    
    generateWeeklyMealPlan(profile, dayTrainingMap);
    alert('本周饮食计划已生成！');
  };

  /**
   * 处理删除今日饮食计划
   */
  const handleDeleteDietPlan = () => {
    deleteDailyDietPlan(getTodayDateString());
    setShowDeleteDietModal(false);
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
    
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) };
  };

  /**
   * 处理添加食物
   */
  const handleAddFood = () => {
    if (!editingMeal || !selectedFoodId) return;
    addFoodToMeal(editingMeal, selectedFoodId, foodAmount);
    setShowAddFoodModal(false);
    setSelectedFoodId('');
    setFoodAmount(100);
  };

  /**
   * 处理删除食物
   */
  const handleRemoveFood = (mealType: MealType, foodIndex: number) => {
    removeFoodFromMeal(mealType, foodIndex);
  };

  /**
   * 处理餐食打卡
   */
  const handleMealCheckIn = (mealType: MealType) => {
    if (completedMeals[mealType]) {
      uncheckInMeal(mealType);
    } else {
      checkInMeal(mealType);
    }
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
                            {plan.type === 'push' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            )}
                            {plan.type === 'pull' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                            {plan.type === 'legs' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                              </svg>
                            )}
                            {plan.type === 'free' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )}
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

                      <div className="bg-[#F2F2F7] rounded-xl p-3 mb-4">
                        <p className="text-sm text-[#8E8E93] mb-2">{plan.exercises.length} 个动作</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.exercises.slice(0, 4).map((ex) => (
                            <span key={ex.id} className="text-xs bg-white text-[#1C1C1E] px-2.5 py-1 rounded-lg">
                              {ex.name}
                            </span>
                          ))}
                          {plan.exercises.length > 4 && (
                            <span className="text-xs text-[#8E8E93] px-2 py-1">+{plan.exercises.length - 4}</span>
                          )}
                        </div>
                      </div>

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
          /* 饮食计划 Tab - V1.2.3 重构：弧形进度 + 按餐食打卡 */
          <>
            {/* 缺省状态：无健身档案或无训练计划 */}
            {!canGenerateDietPlan ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-[#F2F2F7] rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">完善健身档案和训练计划</h3>
                <p className="text-[#8E8E93] mb-6">开始智能饮食管理</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/profile-wizard')}
                    className="bg-[#007AFF] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    去完善健身档案
                  </button>
                  <button
                    onClick={() => navigate('/quick-create')}
                    className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    去创建训练计划
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 弧形进度展示（小米运动健康风格） */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1C1C1E]">今日营养</h3>
                    {getTodayDietRecord() && (
                      <button
                        onClick={() => setShowDeleteDietModal(true)}
                        className="text-sm text-[#FF3B30] font-medium"
                      >
                        删除计划
                      </button>
                    )}
                  </div>
                  
                  {mealPlan && mealPlan.breakfast.length > 0 ? (
                    <>
                      {/* 多层弧形进度 */}
                      <div className="flex justify-center mb-6">
                        <MultiArcProgress 
                          nutrition={{
                            calories: actualNutrition.calories,
                            protein: actualNutrition.protein,
                            carbs: actualNutrition.carbs,
                            fat: actualNutrition.fat,
                          }}
                        />
                      </div>
                      
                      {/* 营养素图例 */}
                      <div className="flex justify-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#34C759]"></span>
                          <span className="text-xs text-[#8E8E93]">热量</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
                          <span className="text-xs text-[#8E8E93]">蛋白质</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#FF9500]"></span>
                          <span className="text-xs text-[#8E8E93]">碳水</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#FF3B30]"></span>
                          <span className="text-xs text-[#8E8E93]">脂肪</span>
                        </div>
                      </div>
                      
                      {/* 生成/重新生成按钮 */}
                      <button
                        onClick={() => generateDailyMealPlan(profile!, 'rest')}
                        className="w-full bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                      >
                        重新生成今日计划
                      </button>
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-20 h-20 bg-[#F2F2F7] rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-[#8E8E93] mb-4">今日还没有饮食计划</p>
                      <button
                        onClick={handleGenerateWeeklyDietPlan}
                        className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                      >
                        生成本周计划
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 餐食列表 + 打卡 */}
                {mealPlan && mealPlan.breakfast.length > 0 && (
                  <div className="space-y-3">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
                      const mealItems = mealPlan[mealType];
                      const nutrition = calculateMealNutrition(mealItems);
                      const isCompleted = completedMeals[mealType];
                      
                      return (
                        <div key={mealType} className={`bg-white rounded-2xl p-4 shadow-sm ${isCompleted ? 'opacity-75' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-[#1C1C1E]">{mealLabels[mealType]}</h4>
                              {isCompleted && (
                                <span className="text-xs bg-[#34C759] text-white px-2 py-0.5 rounded-full">
                                  已完成
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#8E8E93]">
                                {nutrition.calories} kcal
                              </span>
                              {/* 打卡按钮 */}
                              <button
                                onClick={() => handleMealCheckIn(mealType)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isCompleted
                                    ? 'bg-[#FF9500]/10 text-[#FF9500]'
                                    : 'bg-[#34C759] text-white'
                                }`}
                              >
                                {isCompleted ? '取消' : '打卡'}
                              </button>
                            </div>
                          </div>
                          
                          {mealItems.length > 0 ? (
                            <div className="space-y-2">
                              {mealItems.map((item, idx) => {
                                const food = getFoodById(item.foodId);
                                if (!food) return null;
                                return (
                                  <div key={idx} className="flex items-center justify-between py-2 border-b border-[#F2F2F7] last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{food.icon}</span>
                                      <span className="text-sm text-[#1C1C1E]">{food.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#8E8E93]">{item.amount}g</span>
                                      <span className="text-xs text-[#8E8E93]">
                                        {Math.round(food.calories * (item.amount / 100))} kcal
                                      </span>
                                      <button
                                        onClick={() => handleRemoveFood(mealType, idx)}
                                        className="text-[#FF3B30] p-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-[#8E8E93] py-2">暂无食物</p>
                          )}
                          
                          {/* 添加食物按钮 */}
                          <button
                            onClick={() => {
                              setEditingMeal(mealType);
                              setShowAddFoodModal(true);
                            }}
                            className="w-full mt-3 py-2 border border-dashed border-[#C7C7CC] rounded-xl text-sm text-[#8E8E93] hover:border-[#007AFF] hover:text-[#007AFF] transition-colors"
                          >
                            + 添加食物
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* 删除计划确认弹窗 */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">删除计划</h3>
            <p className="text-[#8E8E93] mb-6">确定要删除计划"{planToDelete.name}"吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPlanToDelete(null)}
                className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleDeletePlan}
                className="flex-1 py-3 bg-[#FF3B30] text-white font-medium rounded-xl"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成计划确认弹窗 */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">智能生成训练计划</h3>
            <p className="text-[#8E8E93] mb-6">根据您的健身档案，系统将为您生成一周的 PPL 训练计划。是否继续？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="flex-1 py-3 bg-[#34C759] text-white font-medium rounded-xl disabled:opacity-50"
              >
                {generating ? '生成中...' : '确认生成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除饮食计划确认弹窗 */}
      {showDeleteDietModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">删除饮食计划</h3>
            <p className="text-[#8E8E93] mb-6">确定要删除今日的饮食计划吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDietModal(false)}
                className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleDeleteDietPlan}
                className="flex-1 py-3 bg-[#FF3B30] text-white font-medium rounded-xl"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加食物弹窗 */}
      {showAddFoodModal && editingMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-4">添加食物 - {mealLabels[editingMeal]}</h3>
            
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="space-y-2">
                {foodDatabase.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => setSelectedFoodId(food.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border ${
                      selectedFoodId === food.id
                        ? 'border-[#007AFF] bg-[#007AFF]/5'
                        : 'border-[#E5E5EA]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{food.icon}</span>
                      <div className="text-left">
                        <p className="font-medium text-[#1C1C1E]">{food.name}</p>
                        <p className="text-xs text-[#8E8E93]">{food.calories} kcal/100g</p>
                      </div>
                    </div>
                    {selectedFoodId === food.id && (
                      <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedFoodId && (
              <div className="mb-4">
                <label className="block text-sm text-[#8E8E93] mb-2">份量 (克)</label>
                <input
                  type="number"
                  value={foodAmount}
                  onChange={(e) => setFoodAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E]"
                  min="1"
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddFoodModal(false);
                  setSelectedFoodId('');
                  setFoodAmount(100);
                }}
                className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handleAddFood}
                disabled={!selectedFoodId}
                className="flex-1 py-3 bg-[#007AFF] text-white font-medium rounded-xl disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
