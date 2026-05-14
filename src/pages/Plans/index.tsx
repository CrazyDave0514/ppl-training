/**
 * 计划页面 - V1.2.3 重构版
 * @description 包含动作计划和饮食计划两个 Tab，支持智能计划生成
 * V1.2.3 更新：周选择器、弧形进度、按每道菜打卡、侧边悬浮按钮
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
 * 餐食图标
 */
const mealIcons: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

/**
 * 多层弧形进度组件（小米运动健康风格）
 */
const MultiArcProgress: React.FC<{
  nutrition: {
    calories: { actual: number; target: number };
    protein: { actual: number; target: number };
    carbs: { actual: number; target: number };
    fat: { actual: number; target: number };
  };
  size?: number;
}> = ({ nutrition, size = 240 }) => {
  const center = size / 2;
  const startAngle = 150;
  const endAngle = 390;

  /** 角度转弧度 */
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  /** 描述弧线路径 */
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
    { radius: 105, color: '#FF9500', value: nutrition.carbs.actual, max: nutrition.carbs.target },
    { radius: 90, color: '#007AFF', value: nutrition.protein.actual, max: nutrition.protein.target },
    { radius: 75, color: '#FF3B30', value: nutrition.fat.actual, max: nutrition.fat.target },
    { radius: 60, color: '#34C759', value: nutrition.calories.actual, max: nutrition.calories.target },
  ];

  const totalAngle = endAngle - startAngle;

  return (
    <div className="relative flex justify-center" style={{ width: size, height: size * 0.75 }}>
      <svg width={size} height={size} className="overflow-visible">
        {layers.map((layer, index) => {
          const progress = layer.max > 0 ? Math.min(layer.value / layer.max, 1) : 0;
          const currentAngle = startAngle + totalAngle * progress;
          const bgPath = describeArc(layer.radius, startAngle, endAngle);
          const progressPath = describeArc(layer.radius, startAngle, currentAngle);
          return (
            <g key={index}>
              <path d={bgPath} fill="none" stroke="#E5E5EA" strokeWidth={12} strokeLinecap="round" />
              <path d={progressPath} fill="none" stroke={layer.color} strokeWidth={12} strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: '8px' }}>
        <span className="text-2xl font-bold text-[#1C1C1E] leading-tight">{nutrition.calories.actual}</span>
        <span className="text-[10px] text-[#8E8E93] mt-0.5 leading-tight">/ {nutrition.calories.target} kcal</span>
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
    checkInFoodItem,
    uncheckInFoodItem,
    selectedDayOfWeek,
    setSelectedDayOfWeek,
    dietRecords,
  } = useDiet();

  const [activeTab, setActiveTab] = useState<TabType>('action');
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 添加食物弹窗状态
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodStep, setAddFoodStep] = useState<'meal' | 'food'>('meal');
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [foodAmount, setFoodAmount] = useState<number>(100);

  // 删除饮食计划确认
  const [showDeleteDietModal, setShowDeleteDietModal] = useState(false);

  const displayPlans = currentUser ? plans : [];
  const canGenerateDietPlan = hasProfile && plans.length > 0;

  /** 获取选中的日期是否有饮食记录 */
  const getSelectedDayDietRecord = () => {
    const dateStr = weekDates[selectedDayOfWeek - 1].toISOString().split('T')[0];
    const record = dietRecords.find(r => r.date === dateStr);
    return record && record.mealPlan && record.mealPlan.breakfast.length > 0;
  };

  /** 获取食物详情 */
  const getFoodById = (foodId: string) => foodDatabase.find(f => f.id === foodId);

  /** 计算餐食营养合计 */
  const calculateMealNutrition = (mealItems: { foodId: string; amount: number; isCompleted?: boolean }[]) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
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

  /** 获取周日期列表 */
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const todayJsDay = new Date().getDay();
  const todayDayOfWeek = todayJsDay === 0 ? 7 : todayJsDay;

  /** 获取选中日期的标签 */
  const getSelectedDayLabel = () => {
    const labels = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const isToday = selectedDayOfWeek === todayDayOfWeek;
    return isToday ? '今日' : labels[selectedDayOfWeek];
  };

  // ==================== 事件处理 ====================

  /** 开始训练 */
  const handleStartTraining = (planId: string) => {
    if (!currentUser) { alert('请先登录后再操作'); return; }
    navigate(`/training?planId=${planId}`);
  };

  /** 编辑计划 */
  const handleEditPlan = (planId: string) => {
    if (!currentUser) { alert('请先登录后再操作'); return; }
    navigate(`/plan/${planId}?mode=edit`);
  };

  /** 删除计划 */
  const handleDeletePlan = () => {
    if (planToDelete) { deletePlan(planToDelete.id); setPlanToDelete(null); }
  };

  /** 智能生成训练计划 */
  const handleGeneratePlan = async () => {
    if (!hasProfile || !profile) { navigate('/profile-wizard'); return; }
    setGenerating(true);
    try {
      const weeklySchedule = generateWeeklySchedule(profile);
      if (currentUser) {
        const generatedPlans = convertScheduleToPlans(weeklySchedule, currentUser.id);
        generatedPlans.forEach(plan => addPlan(currentUser.id, plan));
        refreshPlans();
      }
      alert('智能计划生成成功！');
      setShowGenerateModal(false);
    } catch (error) {
      console.error('生成计划失败:', error);
      alert('生成计划失败，请重试');
    } finally { setGenerating(false); }
  };

  /** 生成本周饮食计划 */
  const handleGenerateWeeklyDietPlan = () => {
    if (!hasProfile || !profile) { navigate('/profile-wizard'); return; }
    const dayTrainingMap = [1, 2, 3, 4, 5, 6, 7].map(day => {
      const dayPlans = plans.filter(p => p.dayOfWeek?.includes(day));
      return { dayOfWeek: day, trainingType: dayPlans.length > 0 ? dayPlans[0].type : 'rest' as TrainingType | 'rest' };
    });
    generateWeeklyMealPlan(profile, dayTrainingMap);
    alert('本周饮食计划已生成！');
  };

  /** 删除饮食计划 - 删除选中的日期 */
  const handleDeleteDietPlan = () => {
    const dateStr = weekDates[selectedDayOfWeek - 1].toISOString().split('T')[0];
    deleteDailyDietPlan(dateStr);
    setShowDeleteDietModal(false);
  };

  /** 删除食物 */
  const handleRemoveFood = (mealType: MealType, foodIndex: number) => {
    removeFoodFromMeal(mealType, foodIndex);
  };

  /** 每道菜打卡/取消 */
  const handleFoodCheckIn = (mealType: MealType, foodIndex: number, isCompleted: boolean) => {
    if (isCompleted) { uncheckInFoodItem(mealType, foodIndex); }
    else { checkInFoodItem(mealType, foodIndex); }
  };

  /** 打开添加食物弹窗（侧边悬浮按钮触发） */
  const handleOpenAddFood = () => {
    setAddFoodStep('meal');
    setSelectedMealType(null);
    setSelectedFoodId('');
    setFoodAmount(100);
    setShowAddFoodModal(true);
  };

  /** 选择餐类后进入食物选择 */
  const handleSelectMealType = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setAddFoodStep('food');
  };

  /** 返回餐类选择 */
  const handleBackToMealSelect = () => {
    setAddFoodStep('meal');
    setSelectedMealType(null);
    setSelectedFoodId('');
  };

  /** 确认添加食物 */
  const handleConfirmAddFood = () => {
    if (!selectedMealType || !selectedFoodId) return;
    addFoodToMeal(selectedMealType, selectedFoodId, foodAmount);
    setShowAddFoodModal(false);
    setSelectedFoodId('');
    setFoodAmount(100);
  };

  /** 关闭添加食物弹窗 */
  const handleCloseAddFood = () => {
    setShowAddFoodModal(false);
    setSelectedMealType(null);
    setSelectedFoodId('');
    setFoodAmount(100);
  };

  /** 获取训练类型图标 */
  const getTypeIcon = (type: TrainingType) => {
    switch (type) {
      case 'push': return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
      case 'pull': return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
      case 'legs': return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" /></svg>;
      case 'free': return <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-[#1C1C1E] mb-3">计划</h1>
          <div className="flex bg-[#E5E5EA] rounded-xl p-1">
            <button onClick={() => setActiveTab('action')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'action' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93]'}`}>动作计划</button>
            <button onClick={() => setActiveTab('diet')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'diet' ? 'bg-white text-[#1C1C1E] shadow-sm' : 'text-[#8E8E93]'}`}>饮食计划</button>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {!currentUser ? (
          /* 未登录引导 */
          <div className="py-16 flex flex-col items-center px-4">
            <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <p className="text-[#8E8E93] text-sm mb-4">请先登录查看计划</p>
            <button onClick={() => navigate('/')} className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform">登录</button>
          </div>
        ) : activeTab === 'action' ? (
          /* ============ 动作计划 Tab ============ */
          <>
            {displayPlans.length > 0 ? (
              <div className="space-y-4">
                {displayPlans.map((plan, index) => (
                  <div key={plan.id} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trainingTypeIconColors[plan.type]}`}>{getTypeIcon(plan.type)}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[#1C1C1E]">{plan.name}</h3>
                              <span className="text-xs text-[#8E8E93] bg-[#F2F2F7] px-2 py-0.5 rounded">{plan.source === 'template' ? '模板' : plan.source === 'ai' ? '智能' : '自定义'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${trainingTypeTextColors[plan.type]}`}>{trainingTypeLabels[plan.type]}</p>
                              {plan.dayOfWeek && plan.dayOfWeek.length > 0 && (
                                <span className="text-xs text-[#8E8E93]">{plan.dayOfWeek.map(d => d === 1 ? '周一' : d === 2 ? '周二' : d === 3 ? '周三' : d === 4 ? '周四' : d === 5 ? '周五' : d === 6 ? '周六' : '周日').join('、')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#F2F2F7] rounded-xl p-3 mb-4">
                        <p className="text-sm text-[#8E8E93] mb-2">{plan.exercises.length} 个动作</p>
                        <div className="flex flex-wrap gap-2">
                          {plan.exercises.slice(0, 4).map((ex) => (<span key={ex.id} className="text-xs bg-white text-[#1C1C1E] px-2.5 py-1 rounded-lg">{ex.name}</span>))}
                          {plan.exercises.length > 4 && (<span className="text-xs text-[#8E8E93] px-2 py-1">+{plan.exercises.length - 4}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleStartTraining(plan.id)} className="flex-1 bg-[#007AFF] text-white font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]">开始训练</button>
                        <button onClick={() => handleEditPlan(plan.id)} className="px-4 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl transition-all duration-200 active:scale-[0.98]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setPlanToDelete(plan)} className="px-4 bg-[#F2F2F7] text-[#FF3B30] rounded-xl transition-all duration-200 active:scale-[0.98]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-[#F2F2F7] rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">还没有计划</h3>
                <p className="text-[#8E8E93] mb-6">创建您的第一个训练计划开始追踪</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('/quick-create')} className="bg-[#007AFF] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]">快速创建</button>
                  <button onClick={() => hasProfile ? setShowGenerateModal(true) : navigate('/profile-wizard')} className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]">智能生成</button>
                </div>
              </div>
            )}

            {/* 动作计划 - 侧边悬浮添加按钮 */}
            <div className="fixed bottom-24 right-5 z-10">
              <button
                onClick={() => navigate('/quick-create')}
                className="w-16 h-16 bg-[#007AFF] text-white rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                title="快速创建计划"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </>
        ) : (
          /* ============ 饮食计划 Tab ============ */
          <>
            {!canGenerateDietPlan ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm animate-fade-in">
                <div className="w-20 h-20 bg-[#F2F2F7] rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <h3 className="text-xl font-bold text-[#1C1C1E] mb-2">完善健身档案和训练计划</h3>
                <p className="text-[#8E8E93] mb-6">开始智能饮食管理</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => navigate('/profile-wizard')} className="bg-[#007AFF] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]">去完善健身档案</button>
                  <button onClick={() => navigate('/quick-create')} className="bg-[#34C759] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]">去创建训练计划</button>
                </div>
              </div>
            ) : (
              <>
                {/* 合并模块：本周饮食 + 今日营养 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  {/* 标题行 */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#1C1C1E]">{getSelectedDayLabel()}饮食</h3>
                    {getSelectedDayDietRecord() && (
                      <button onClick={() => setShowDeleteDietModal(true)} className="text-sm text-[#FF3B30] font-medium">删除计划</button>
                    )}
                  </div>

                  {/* 星期选择器 - 紧凑型，不溢出 */}
                  <div className="flex justify-between mb-4">
                    {weekDates.map((date, index) => {
                      const dayOfWeek = index + 1;
                      const isToday = dayOfWeek === todayDayOfWeek;
                      const isSelected = dayOfWeek === selectedDayOfWeek;
                      const dateStr = date.toISOString().split('T')[0];
                      const dayRecord = dietRecords.find(r => r.date === dateStr);

                      // 计算当天4维度实际摄入（仅已打卡菜品）
                      let dayCalories = 0, dayProtein = 0, dayCarbs = 0, dayFat = 0;
                      let dayTargetCal = 0, dayTargetPro = 0, dayTargetCarb = 0, dayTargetFat = 0;
                      if (dayRecord) {
                        dayTargetCal = dayRecord.dailyNutrition.calories.target;
                        dayTargetPro = dayRecord.dailyNutrition.protein.target;
                        dayTargetCarb = dayRecord.dailyNutrition.carbs.target;
                        dayTargetFat = dayRecord.dailyNutrition.fat.target;
                        (['breakfast', 'lunch', 'dinner', 'snack'] as const).forEach(mt => {
                          dayRecord.mealPlan[mt].forEach(item => {
                            if (item.isCompleted) {
                              const food = getFoodById(item.foodId);
                              if (food) {
                                const ratio = item.amount / 100;
                                dayCalories += food.calories * ratio;
                                dayProtein += food.protein * ratio;
                                dayCarbs += food.carbs * ratio;
                                dayFat += food.fat * ratio;
                              }
                            }
                          });
                        });
                      }

                      // 4维度综合进度：各维度完成率的平均值
                      const calProgress = dayTargetCal > 0 ? Math.min(dayCalories / dayTargetCal, 1) : 0;
                      const proProgress = dayTargetPro > 0 ? Math.min(dayProtein / dayTargetPro, 1) : 0;
                      const carbProgress = dayTargetCarb > 0 ? Math.min(dayCarbs / dayTargetCarb, 1) : 0;
                      const fatProgress = dayTargetFat > 0 ? Math.min(dayFat / dayTargetFat, 1) : 0;
                      const progress = (calProgress + proProgress + carbProgress + fatProgress) / 4;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDayOfWeek(dayOfWeek)}
                          className={`flex flex-col items-center py-1.5 px-1.5 rounded-xl transition-all flex-1 ${isSelected ? 'bg-[#34C759]/10' : ''}`}
                        >
                          <span className={`text-[10px] mb-1 ${isToday ? 'text-[#34C759] font-bold' : 'text-[#8E8E93]'}`}>
                            {['一', '二', '三', '四', '五', '六', '日'][index]}
                          </span>
                          {/* 小圆点进度指示 - 根据实际打卡进度显示颜色 */}
                          <div className="relative w-6 h-6 mb-1">
                            <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
                              <circle cx="12" cy="12" r="9" fill="none" stroke="#E5E5EA" strokeWidth="3" />
                              <circle cx="12" cy="12" r="9" fill="none" stroke={progress > 0 ? '#34C759' : '#E5E5EA'} strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 9 * progress} ${2 * Math.PI * 9}`}
                                style={{ transition: 'all 0.5s ease' }}
                              />
                            </svg>
                          </div>
                          <span className={`text-[10px] ${isToday ? 'text-[#34C759] font-bold' : 'text-[#8E8E93]'}`}>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 弧形进度 + 摄入量解释 */}
                  {mealPlan && mealPlan.breakfast.length > 0 ? (
                    <>
                      <div className="flex justify-center mb-3">
                        <MultiArcProgress nutrition={{ calories: actualNutrition.calories, protein: actualNutrition.protein, carbs: actualNutrition.carbs, fat: actualNutrition.fat }} />
                      </div>
                      <div className="bg-[#F2F2F7] rounded-xl p-3 mb-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34C759]"></span><span className="text-[#8E8E93]">热量</span></div>
                            <span className="text-[#1C1C1E] font-medium">{actualNutrition.calories.actual}/{actualNutrition.calories.target}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]"></span><span className="text-[#8E8E93]">蛋白质</span></div>
                            <span className="text-[#1C1C1E] font-medium">{actualNutrition.protein.actual}/{actualNutrition.protein.target}g</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]"></span><span className="text-[#8E8E93]">碳水</span></div>
                            <span className="text-[#1C1C1E] font-medium">{actualNutrition.carbs.actual}/{actualNutrition.carbs.target}g</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]"></span><span className="text-[#8E8E93]">脂肪</span></div>
                            <span className="text-[#1C1C1E] font-medium">{actualNutrition.fat.actual}/{actualNutrition.fat.target}g</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => generateDailyMealPlan(profile!, 'rest')} className="w-full bg-[#F2F2F7] text-[#1C1C1E] font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm">重新生成计划</button>
                    </>
                  ) : (
                    <div className="py-10 text-center">
                      <div className="w-16 h-16 bg-[#F2F2F7] rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </div>
                      <p className="text-[#8E8E93] mb-4 text-sm">还没有饮食计划</p>
                      <button onClick={handleGenerateWeeklyDietPlan} className="bg-[#34C759] text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] text-sm">生成本周计划</button>
                    </div>
                  )}
                </div>

                {/* 餐食列表 + 每道菜打卡 */}
                {mealPlan && mealPlan.breakfast.length > 0 && (
                  <div className="space-y-3">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
                      const mealItems = mealPlan[mealType];
                      const nutrition = calculateMealNutrition(mealItems);
                      const completedCount = mealItems.filter(item => item.isCompleted).length;

                      return (
                        <div key={mealType} className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{mealIcons[mealType]}</span>
                              <h4 className="font-bold text-[#1C1C1E]">{mealLabels[mealType]}</h4>
                              {completedCount > 0 && (
                                <span className="text-xs bg-[#34C759] text-white px-2 py-0.5 rounded-full">{completedCount}/{mealItems.length}</span>
                              )}
                            </div>
                            <span className="text-sm text-[#8E8E93]">{nutrition.calories} kcal</span>
                          </div>

                          {mealItems.length > 0 ? (
                            <div className="space-y-2">
                              {mealItems.map((item, idx) => {
                                const food = getFoodById(item.foodId);
                                if (!food) return null;
                                const isCompleted = item.isCompleted || false;
                                return (
                                  <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isCompleted ? 'bg-[#34C759]/10' : 'bg-[#F2F2F7]'}`}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{food.icon}</span>
                                      <div>
                                        <span className="text-sm text-[#1C1C1E]">{food.name}</span>
                                        <span className="text-xs text-[#8E8E93] ml-1">{item.amount}g</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-[#8E8E93]">{Math.round(food.calories * (item.amount / 100))} kcal</span>
                                      <button onClick={() => handleFoodCheckIn(mealType, idx, isCompleted)} className={`px-2 py-1 rounded text-xs font-medium transition-all ${isCompleted ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#34C759] text-white'}`}>
                                        {isCompleted ? '取消' : '打卡'}
                                      </button>
                                      <button onClick={() => handleRemoveFood(mealType, idx)} className="text-[#FF3B30] p-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-[#8E8E93] py-2">暂无食物</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 饮食计划 - 侧边悬浮添加食物按钮 */}
                <div className="fixed bottom-24 right-5 z-10">
                  <button
                    onClick={handleOpenAddFood}
                    className="w-16 h-16 bg-[#007AFF] text-white rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform"
                    title="添加食物"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ============ 弹窗区域 ============ */}

      {/* 删除计划确认弹窗 */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">删除计划</h3>
            <p className="text-[#8E8E93] mb-6">确定要删除计划"{planToDelete.name}"吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button onClick={() => setPlanToDelete(null)} className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl">取消</button>
              <button onClick={handleDeletePlan} className="flex-1 py-3 bg-[#FF3B30] text-white font-medium rounded-xl">删除</button>
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
              <button onClick={() => setShowGenerateModal(false)} className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl">取消</button>
              <button onClick={handleGeneratePlan} disabled={generating} className="flex-1 py-3 bg-[#34C759] text-white font-medium rounded-xl disabled:opacity-50">{generating ? '生成中...' : '确认生成'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除饮食计划确认弹窗 */}
      {showDeleteDietModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">删除饮食计划</h3>
            <p className="text-[#8E8E93] mb-6">确定要删除选中日期的饮食计划吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteDietModal(false)} className="flex-1 py-3 bg-[#F2F2F7] text-[#1C1C1E] font-medium rounded-xl">取消</button>
              <button onClick={handleDeleteDietPlan} className="flex-1 py-3 bg-[#FF3B30] text-white font-medium rounded-xl">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加食物弹窗（两步式：选餐类 → 选食物） */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[85vh] flex flex-col">
            {/* 弹窗头部 */}
            <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {addFoodStep === 'food' && (
                  <button onClick={handleBackToMealSelect} className="text-[#007AFF] p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                )}
                <h3 className="text-lg font-bold text-[#1C1C1E]">
                  {addFoodStep === 'meal' ? '添加食物' : `添加食物 · ${selectedMealType ? mealLabels[selectedMealType] : ''}`}
                </h3>
              </div>
              <button onClick={handleCloseAddFood} className="text-[#8E8E93] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* 步骤一：选择餐类 */}
            {addFoodStep === 'meal' && (
              <div className="p-4 space-y-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mt) => (
                  <button
                    key={mt}
                    onClick={() => handleSelectMealType(mt)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#F2F2F7] active:bg-[#E5E5EA] transition-colors"
                  >
                    <span className="text-2xl">{mealIcons[mt]}</span>
                    <span className="font-medium text-[#1C1C1E]">{mealLabels[mt]}</span>
                    <svg className="w-5 h-5 text-[#C7C7CC] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}

            {/* 步骤二：选择食物和分量 */}
            {addFoodStep === 'food' && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {foodDatabase.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => setSelectedFoodId(food.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${selectedFoodId === food.id ? 'border-[#007AFF] bg-[#007AFF]/5' : 'border-[#E5E5EA]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{food.icon}</span>
                          <div className="text-left">
                            <p className="font-medium text-[#1C1C1E]">{food.name}</p>
                            <p className="text-xs text-[#8E8E93]">{food.calories} kcal/100g</p>
                          </div>
                        </div>
                        {selectedFoodId === food.id && (
                          <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedFoodId && (
                  <div className="p-4 border-t border-[#E5E5EA] shrink-0">
                    <label className="block text-sm text-[#8E8E93] mb-2">份量 (克)</label>
                    <input type="number" value={foodAmount} onChange={(e) => setFoodAmount(Number(e.target.value))} className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] mb-3" min="1" />
                    <button onClick={handleConfirmAddFood} className="w-full py-3 bg-[#007AFF] text-white font-medium rounded-xl active:scale-[0.98] transition-transform">确认添加</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
