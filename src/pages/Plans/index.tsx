/**
 * 计划页面 - V1.2.3 重构版
 * @description 包含动作计划和饮食计划两个 Tab，支持智能计划生成
 * V1.2.3 更新：周维度视图、圆环进度、饮食打卡、删除功能
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
 * 星期配置
 */
const weekDays = [
  { day: 1, label: '周一', shortLabel: '一' },
  { day: 2, label: '周二', shortLabel: '二' },
  { day: 3, label: '周三', shortLabel: '三' },
  { day: 4, label: '周四', shortLabel: '四' },
  { day: 5, label: '周五', shortLabel: '五' },
  { day: 6, label: '周六', shortLabel: '六' },
  { day: 7, label: '周日', shortLabel: '日' },
];

/**
 * 圆环进度组件（V1.2.3 新增）
 */
const CircularProgress: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  unit?: string;
}> = ({ value, max, size = 60, strokeWidth = 6, color, label, unit = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 背景圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
          />
          {/* 进度圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* 中心文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{value}{unit}</span>
        </div>
      </div>
      <span className="text-[10px] text-[#8E8E93] mt-1">{label}</span>
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
    selectedDayOfWeek, 
    setSelectedDayOfWeek,
    dietRecords,
    mealPlan, 
    dailyNutrition, 
    generateDailyMealPlan,
    generateWeeklyMealPlan,
    addFoodToMeal,
    removeFoodFromMeal,
    deleteDailyDietPlan,
    checkIn,
    uncheckIn,
    isCheckedIn,
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
  
  // 餐食编辑弹窗
  const [editingMeal, setEditingMeal] = useState<MealType | null>(null);
  
  // 添加食物弹窗
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodAmount, setFoodAmount] = useState<number>(100);
  
  // 删除饮食计划确认
  const [showDeleteDietModal, setShowDeleteDietModal] = useState(false);
  
  // 打卡确认弹窗
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [mealsToCheckIn, setMealsToCheckIn] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });

  /**
   * 计划列表
   */
  const displayPlans = currentUser ? plans : [];

  /**
   * 检查是否可以生成饮食计划
   */
  const canGenerateDietPlan = hasProfile && plans.length > 0;
  
  /**
   * 获取当前选中日期的饮食记录
   */
  const getCurrentDayRecord = () => {
    const weekStart = getWeekStartDate(new Date());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + selectedDayOfWeek - 1);
    const dateStr = formatDateString(targetDate);
    return dietRecords.find(r => r.date === dateStr) || null;
  };
  
  /**
   * 获取本周周一的日期
   */
  const getWeekStartDate = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  /**
   * 格式化日期字符串
   */
  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  /**
   * 获取星期几对应的训练类型
   */
  const getTrainingTypeForDay = (day: number): TrainingType | null => {
    const dayPlans = plans.filter(p => p.dayOfWeek.includes(day));
    if (dayPlans.length === 0) return null;
    return dayPlans[0].type;
  };
  
  /**
   * 检查某天是否有饮食计划
   */
  const hasDietPlanForDay = (day: number): boolean => {
    const weekStart = getWeekStartDate(new Date());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + day - 1);
    const dateStr = formatDateString(targetDate);
    return dietRecords.some(r => r.date === dateStr);
  };
  
  /**
   * 检查某天是否已打卡
   */
  const isDayCheckedIn = (day: number): boolean => {
    const weekStart = getWeekStartDate(new Date());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + day - 1);
    const dateStr = formatDateString(targetDate);
    const record = dietRecords.find(r => r.date === dateStr);
    return record?.isChecked || false;
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
   * 处理生成本周饮食计划（周维度）
   */
  const handleGenerateWeeklyDietPlan = () => {
    if (!hasProfile || !profile) {
      navigate('/profile-wizard');
      return;
    }
    
    // 构建每天的训练类型映射
    const dayTrainingMap = weekDays.map(wd => ({
      dayOfWeek: wd.day,
      trainingType: getTrainingTypeForDay(wd.day) || 'rest' as TrainingType | 'rest',
    }));
    
    generateWeeklyMealPlan(profile, dayTrainingMap);
    alert('本周饮食计划已生成！');
  };

  /**
   * 处理删除当日饮食计划
   */
  const handleDeleteDietPlan = () => {
    const weekStart = getWeekStartDate(new Date());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + selectedDayOfWeek - 1);
    const dateStr = formatDateString(targetDate);
    deleteDailyDietPlan(dateStr);
    setShowDeleteDietModal(false);
  };

  /**
   * 处理饮食打卡
   */
  const handleCheckIn = () => {
    checkIn(mealsToCheckIn);
    setShowCheckInModal(false);
    alert('打卡成功！');
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
          /* 饮食计划 Tab - V1.2.3 重构 */
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
                {/* 星期选择器（周维度） */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-[#1C1C1E]">本周饮食</h3>
                    <button
                      onClick={handleGenerateWeeklyDietPlan}
                      className="text-sm text-[#34C759] font-medium"
                    >
                      生成本周计划
                    </button>
                  </div>
                  <div className="flex justify-between">
                    {weekDays.map((wd) => {
                      const trainingType = getTrainingTypeForDay(wd.day);
                      const hasDiet = hasDietPlanForDay(wd.day);
                      const isChecked = isDayCheckedIn(wd.day);
                      const isSelected = selectedDayOfWeek === wd.day;
                      
                      return (
                        <button
                          key={wd.day}
                          onClick={() => setSelectedDayOfWeek(wd.day)}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                            isSelected ? 'bg-[#007AFF]/10' : 'hover:bg-[#F2F2F7]'
                          }`}
                        >
                          <span className={`text-xs ${isSelected ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
                            {wd.shortLabel}
                          </span>
                          <span className={`text-sm font-medium ${
                            trainingType 
                              ? trainingTypeTextColors[trainingType]
                              : 'text-[#8E8E93]'
                          }`}>
                            {trainingType ? (
                              trainingType === 'push' ? '推' :
                              trainingType === 'pull' ? '拉' :
                              trainingType === 'legs' ? '腿' : '休'
                            ) : '休'}
                          </span>
                          {/* 状态指示 */}
                          <div className="mt-1">
                            {hasDiet ? (
                              isChecked ? (
                                <span className="w-4 h-4 bg-[#34C759] rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="w-4 h-4 bg-[#FF9500] rounded-full" />
                              )
                            ) : (
                              <span className="w-4 h-4 border border-[#E5E5EA] rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* 圆环进度展示（V1.2.3 Apple Fitness 风格） */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1C1C1E]">
                      {weekDays.find(w => w.day === selectedDayOfWeek)?.label} 营养
                    </h3>
                    {getCurrentDayRecord() && (
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
                      {/* 热量大圆环 */}
                      <div className="flex justify-center mb-6">
                        <CircularProgress
                          value={dailyNutrition.calories.actual}
                          max={dailyNutrition.calories.target}
                          size={120}
                          strokeWidth={10}
                          color="#34C759"
                          label="热量"
                          unit=" kcal"
                        />
                      </div>
                      
                      {/* 其他四个指标小圆环 */}
                      <div className="flex justify-around mb-6">
                        <CircularProgress
                          value={dailyNutrition.protein.actual}
                          max={dailyNutrition.protein.target}
                          size={60}
                          strokeWidth={5}
                          color="#007AFF"
                          label="蛋白质"
                          unit="g"
                        />
                        <CircularProgress
                          value={dailyNutrition.carbs.actual}
                          max={dailyNutrition.carbs.target}
                          size={60}
                          strokeWidth={5}
                          color="#FF9500"
                          label="碳水"
                          unit="g"
                        />
                        <CircularProgress
                          value={dailyNutrition.fat.actual}
                          max={dailyNutrition.fat.target}
                          size={60}
                          strokeWidth={5}
                          color="#FF3B30"
                          label="脂肪"
                          unit="g"
                        />
                        <CircularProgress
                          value={Math.round(dailyNutrition.water.actual / 1000 * 10) / 10}
                          max={Math.round(dailyNutrition.water.target / 1000 * 10) / 10}
                          size={60}
                          strokeWidth={5}
                          color="#5AC8FA"
                          label="水分"
                          unit="L"
                        />
                      </div>
                      
                      {/* 打卡按钮 */}
                      <div className="flex gap-3">
                        {!isCheckedIn ? (
                          <button
                            onClick={() => setShowCheckInModal(true)}
                            className="flex-1 bg-[#34C759] text-white font-medium py-3 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            打卡
                          </button>
                        ) : (
                          <button
                            onClick={uncheckIn}
                            className="flex-1 bg-[#FF9500] text-white font-medium py-3 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            取消打卡
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const weekStart = getWeekStartDate(new Date());
                            const targetDate = new Date(weekStart);
                            targetDate.setDate(targetDate.getDate() + selectedDayOfWeek - 1);
                            generateDailyMealPlan(profile!, 'rest');
                          }}
                          className="px-4 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200 active:scale-[0.98]"
                        >
                          重新生成
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-[#8E8E93] mb-4">暂无饮食计划</p>
                      <button
                        onClick={() => generateDailyMealPlan(profile!, 'rest')}
                        className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                      >
                        生成今日计划
                      </button>
                    </div>
                  )}
                </div>
                
                {/* 餐食列表 */}
                {mealPlan && (
                  <div className="space-y-4">
                    {[
                      { key: 'breakfast' as MealType, label: '早餐', icon: '🌅' },
                      { key: 'lunch' as MealType, label: '午餐', icon: '☀️' },
                      { key: 'dinner' as MealType, label: '晚餐', icon: '🌙' },
                      { key: 'snack' as MealType, label: '加餐', icon: '🍎' },
                    ].map(({ key, label, icon }) => {
                      const items = mealPlan[key];
                      const nutrition = calculateMealNutrition(items);
                      
                      return (
                        <div key={key} className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{icon}</span>
                              <h4 className="font-bold text-[#1C1C1E]">{label}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#8E8E93]">{nutrition.calories} kcal</span>
                              <button
                                onClick={() => setEditingMeal(key)}
                                className="p-1.5 bg-[#F2F2F7] rounded-lg text-[#8E8E93] hover:text-[#007AFF] transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
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
              </>
            )}
          </>
        )}
      </main>

      {/* 删除动作计划确认弹窗 */}
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

      {/* 删除饮食计划确认弹窗 */}
      {showDeleteDietModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowDeleteDietModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">删除饮食计划</h2>
            <p className="text-[#8E8E93] text-center mb-6">
              确定要删除 {weekDays.find(w => w.day === selectedDayOfWeek)?.label} 的饮食计划吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDietModal(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleDeleteDietPlan}
                className="flex-1 bg-[#FF3B30] text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 打卡确认弹窗 */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowCheckInModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-4">确认打卡</h2>
            <p className="text-[#8E8E93] text-center mb-4">请确认今日已完成以下餐食：</p>
            
            <div className="space-y-3 mb-6">
              {[
                { key: 'breakfast', label: '🌅 早餐' },
                { key: 'lunch', label: '☀️ 午餐' },
                { key: 'dinner', label: '🌙 晚餐' },
                { key: 'snack', label: '🍎 加餐' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-[#F2F2F7] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mealsToCheckIn[key as keyof typeof mealsToCheckIn]}
                    onChange={(e) => setMealsToCheckIn(prev => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))}
                    className="w-5 h-5 rounded border-[#E5E5EA] text-[#34C759] focus:ring-[#34C759]"
                  />
                  <span className="text-[#1C1C1E]">{label}</span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleCheckIn}
                className="flex-1 bg-[#34C759] text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                确认打卡
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

      {/* 餐食编辑弹窗 */}
      {editingMeal && mealPlan && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setEditingMeal(null)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1C1C1E]">
                编辑{editingMeal === 'breakfast' ? '早餐' : editingMeal === 'lunch' ? '午餐' : editingMeal === 'dinner' ? '晚餐' : '加餐'}
              </h2>
              <button
                onClick={() => setEditingMeal(null)}
                className="p-2 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-[#F2F2F7] rounded-xl p-3 mb-4">
              {(() => {
                const nutrition = calculateMealNutrition(mealPlan[editingMeal]);
                return (
                  <p className="text-sm text-[#8E8E93]">
                    当前：蛋白质 {nutrition.protein}g · 碳水 {nutrition.carbs}g · 脂肪 {nutrition.fat}g
                  </p>
                );
              })()}
            </div>
            
            <div className="space-y-2 mb-4">
              {mealPlan[editingMeal].map((item, index) => {
                const food = getFoodById(item.foodId);
                if (!food) return null;
                
                return (
                  <div key={index} className="flex items-center justify-between bg-[#F2F2F7] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg">
                        {food.icon}
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1C1E]">{food.name}</p>
                        <p className="text-xs text-[#8E8E93]">{item.amount}g</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(editingMeal, index)}
                      className="p-2 text-[#FF3B30] hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowAddFoodModal(true)}
              className="w-full bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加食物
            </button>
          </div>
        </div>
      )}

      {/* 添加食物弹窗 */}
      {showAddFoodModal && editingMeal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowAddFoodModal(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">选择食物</h2>
            
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {foodDatabase.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFoodId(food.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedFoodId === food.id 
                      ? 'bg-[#007AFF]/10 border-2 border-[#007AFF]' 
                      : 'bg-[#F2F2F7] border-2 border-transparent hover:bg-[#E5E5EA]'
                  }`}
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg">
                    {food.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#1C1C1E]">{food.name}</p>
                    <p className="text-xs text-[#8E8E93]">{food.calories} kcal/100g</p>
                  </div>
                </button>
              ))}
            </div>
            
            {selectedFoodId && (
              <div className="mb-4">
                <label className="text-sm text-[#8E8E93] mb-2 block">份量 (g)</label>
                <input
                  type="number"
                  value={foodAmount}
                  onChange={(e) => setFoodAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  min={1}
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
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleAddFood}
                disabled={!selectedFoodId || foodAmount <= 0}
                className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                添加
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
