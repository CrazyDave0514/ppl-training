/**
 * 首页组件 - V1.2.3 重构版
 * @description Apple Health 风格首页，今日概览模块（训练+饮食合并）
 * V1.2.3 更新：合并今日概览、按餐食打卡、弧形进度
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { useDiet } from '../../store/DietContext';
import type { TrainingSession } from '../../types';
import { getSessionsByUser } from '../../utils/storage';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';
import { foodDatabase } from '../../data/foodDatabase';

/**
 * 弧形进度组件
 */
const ArcProgress: React.FC<{
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
}> = ({ value, max, size = 120, strokeWidth = 8, color, label }) => {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const currentAngle = startAngle + totalAngle * progress;
  
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const describeArc = (start: number, end: number) => {
    const startRad = toRad(start);
    const endRad = toRad(end);
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  const bgPath = describeArc(startAngle, endAngle);
  const progressPath = describeArc(startAngle, currentAngle);
  
  return (
    <div className="relative" style={{ width: size, height: size * 0.75 }}>
      <svg width={size} height={size} className="overflow-visible">
        <path d={bgPath} fill="none" stroke="#E5E5EA" strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={progressPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-xl font-bold text-[#1C1C1E]">{value}</span>
        <span className="text-[10px] text-[#8E8E93]">{label}</span>
      </div>
    </div>
  );
};

/**
 * 首页组件
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, users, createUser, switchUser, deleteUser } = useUser();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { plans } = usePlan();
  const { 
    dailyNutrition, 
    actualNutrition,
    mealPlan,
    completedMeals,
    checkInMeal,
    uncheckInMeal,
    getCurrentMealType,
  } = useDiet();
  const [newUserName, setNewUserName] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // 加载训练记录
  useEffect(() => {
    if (currentUser) {
      const userSessions = getSessionsByUser(currentUser.id);
      setSessions(userSessions.slice(0, 5));
    } else {
      setSessions([]);
    }
  }, [currentUser]);

  // 获取今日训练计划（只取第一个，单日单计划）
  const todayJsDay = new Date().getDay();
  const todayPlans = plans.filter(p => p.dayOfWeek?.includes(todayJsDay)).slice(0, 1);
  const todaySessions = sessions.filter(s => s.date === new Date().toISOString().split('T')[0]);
  
  // 获取当前时段
  const currentMealType = getCurrentMealType();
  const mealTypeLabels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };

  /**
   * 处理创建用户
   */
  const handleCreateUser = () => {
    if (newUserName.trim()) {
      createUser(newUserName.trim());
      setNewUserName('');
      setShowCreateModal(false);
    }
  };

  /**
   * 处理删除用户
   */
  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert('至少保留一个用户');
      return;
    }
    setUserToDelete(userId);
  };

  /**
   * 确认删除用户
   */
  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDelete(null);
      setShowUserMenu(false);
    }
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
   * 处理餐食打卡
   */
  const handleMealCheckIn = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (completedMeals[mealType]) {
      uncheckInMeal(mealType);
    } else {
      checkInMeal(mealType);
    }
  };

  // 未登录状态
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-sm animate-scale-in">
          <img
            src="/icon-80.png"
            alt="FitPlus"
            className="w-20 h-20 mx-auto mb-6 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-[#1C1C1E] mb-2">FitPlus</h1>
          <p className="text-[#8E8E93] mb-8">Push / Pull / Legs 训练追踪</p>

          {users.length === 0 ? (
            <>
              <p className="text-[#8E8E93] mb-6">创建您的第一个用户开始训练</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-[#007AFF] hover:bg-[#0056CC] text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                创建用户
              </button>
            </>
          ) : (
            <>
              <p className="text-[#8E8E93] mb-6">选择用户继续</p>
              <div className="space-y-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => switchUser(user.id)}
                    className="w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-medium py-3.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {user.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full mt-4 border-2 border-[#007AFF] text-[#007AFF] font-medium py-3 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                + 创建新用户
              </button>
            </>
          )}
        </div>

        {/* 创建用户弹窗 */}
        {showCreateModal && (
          <Modal title="创建用户" onClose={() => setShowCreateModal(false)}>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="输入用户名"
              className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3.5 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUserName('');
                }}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!newUserName.trim()}
                className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5EA] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icon-40.png"
              alt="FitPlus"
              className="w-10 h-10 rounded-xl shadow-md"
            />
            <div>
              <h1 className="text-lg font-bold text-[#1C1C1E]">FitPlus</h1>
              <p className="text-xs text-[#8E8E93]">Push / Pull / Legs</p>
            </div>
          </div>

          {/* 用户切换 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-[#F2F2F7] text-[#1C1C1E] px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{currentUser.name}</span>
              <svg className="w-4 h-4 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 用户菜单 */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg overflow-hidden animate-scale-in border border-[#E5E5EA]">
                <div className="p-2">
                  <p className="text-xs text-[#8E8E93] px-3 py-2 font-medium">切换用户</p>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        user.id === currentUser.id ? 'bg-[#007AFF] text-white' : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'
                      }`}
                    >
                      <span>{user.name}</span>
                      {user.id === currentUser.id && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#E5E5EA] p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-[#1C1C1E] hover:bg-[#F2F2F7] flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    创建新用户
                  </button>
                </div>
                <div className="border-t border-[#E5E5EA] p-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleDeleteUser(user.id)}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-[#FF3B30] hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      删除 {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 今日概览模块（训练+饮食合并） */}
        <section className="animate-slide-up" style={{ animationDelay: '0ms' }}>
          <h2 className="text-lg font-bold text-[#1C1C1E] mb-3 px-1">今日概览</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* 训练部分 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[#1C1C1E]">今日训练</h3>
                {todayPlans.length === 0 && todaySessions.length === 0 && (
                  <button
                    onClick={() => navigate('/plans')}
                    className="text-xs text-[#007AFF]"
                  >
                    去创建
                  </button>
                )}
              </div>
              
              {todayPlans.length > 0 ? (
                todayPlans.map(plan => {
                  const completedSession = todaySessions.find(s => s.planId === plan.id);
                  const isCompleted = !!completedSession;
                  
                  return (
                    <div key={plan.id} className={`flex items-center justify-between rounded-xl p-3 ${
                      isCompleted ? 'bg-[#34C759]/10' : 'bg-[#F2F2F7]'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${trainingTypeIconColors[plan.type]}`}>
                          {getTypeIcon(plan.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-[#1C1C1E]">{plan.name}</h4>
                          <p className="text-xs text-[#8E8E93]">{plan.exercises.length} 个动作</p>
                        </div>
                      </div>
                      {isCompleted ? (
                        <span className="text-xs text-[#34C759] font-medium">已完成</span>
                      ) : (
                        <button
                          onClick={() => navigate(`/training?planId=${plan.id}`)}
                          className="bg-[#007AFF] text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                        >
                          开始
                        </button>
                      )}
                    </div>
                  );
                })
              ) : todaySessions.length > 0 ? (
                todaySessions.map(session => (
                  <div key={session.id} className="flex items-center justify-between bg-[#34C759]/10 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>
                        {getTypeIcon(session.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-[#1C1C1E]">{session.planName}</h4>
                        <p className="text-xs text-[#8E8E93]">{session.exercises.length} 个动作</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#34C759] font-medium">已完成</span>
                  </div>
                ))
              ) : (
                <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#8E8E93]">今日暂无训练计划</p>
                </div>
              )}
            </div>
            
            {/* 分隔线 */}
            <div className="border-t border-[#E5E5EA] my-4"></div>
            
            {/* 饮食部分 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[#1C1C1E]">今日摄入</h3>
                {!mealPlan?.breakfast?.length && (
                  <button
                    onClick={() => navigate('/plans')}
                    className="text-xs text-[#007AFF]"
                  >
                    去生成
                  </button>
                )}
              </div>
              
              {mealPlan && mealPlan.breakfast.length > 0 ? (
                <>
                  {/* 弧形进度 */}
                  <div className="flex justify-center mb-4">
                    <ArcProgress
                      value={actualNutrition.calories.actual}
                      max={dailyNutrition.calories.target}
                      color="#34C759"
                      label="kcal"
                    />
                  </div>
                  
                  {/* 当前时段餐食 + 打卡 */}
                  <div className="bg-[#F2F2F7] rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#8E8E93]">当前时段</span>
                        <p className="font-medium text-[#1C1C1E]">{mealTypeLabels[currentMealType]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {mealPlan[currentMealType]?.length > 0 ? (
                          <>
                            <span className="text-xs text-[#8E8E93]">
                              {mealPlan[currentMealType].reduce((acc: number, item: { foodId: string; amount: number }) => {
                                const food = getFoodById(item.foodId);
                                return acc + (food ? Math.round(food.calories * (item.amount / 100)) : 0);
                              }, 0)} kcal
                            </span>
                            <button
                              onClick={() => handleMealCheckIn(currentMealType)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                completedMeals[currentMealType]
                                  ? 'bg-[#FF9500]/10 text-[#FF9500]'
                                  : 'bg-[#34C759] text-white'
                              }`}
                            >
                              {completedMeals[currentMealType] ? '取消' : '打卡'}
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[#8E8E93]">无餐食</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 当前时段食物列表 */}
                    {mealPlan[currentMealType]?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#E5E5EA]">
                        {mealPlan[currentMealType].map((item: { foodId: string; amount: number }, idx: number) => {
                          const food = getFoodById(item.foodId);
                          if (!food) return null;
                          return (
                            <div key={idx} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <span>{food.icon}</span>
                                <span className="text-sm text-[#1C1C1E]">{food.name}</span>
                              </div>
                              <span className="text-xs text-[#8E8E93]">{item.amount}g</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#8E8E93]">今日暂无饮食计划</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 快捷操作 */}
        <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h2 className="text-lg font-bold text-[#1C1C1E] mb-3 px-1">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/quick-create')}
              className="bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#1C1C1E] mb-1">快速创建</h3>
              <p className="text-sm text-[#8E8E93]">从模板生成计划</p>
            </button>
            <button
              onClick={() => navigate('/plans')}
              className="bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
            >
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#1C1C1E] mb-1">我的计划</h3>
              <p className="text-sm text-[#8E8E93]">管理训练计划</p>
            </button>
          </div>
        </section>

        {/* 最近训练 */}
        <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-[#1C1C1E]">最近训练</h2>
            {sessions.length > 0 && (
              <button
                onClick={() => navigate('/records')}
                className="text-sm text-[#007AFF] font-medium"
              >
                查看全部
              </button>
            )}
          </div>

          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/session/${session.id}`)}
                  className="bg-white rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>
                        {getTypeIcon(session.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1C1C1E]">{session.planName}</h3>
                        <p className="text-sm text-[#8E8E93]">
                          {session.exercises.length} 个动作 · {session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} 组
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${trainingTypeTextColors[session.type]}`}>
                        {trainingTypeLabels[session.type].split(' ')[0]}
                      </span>
                      <p className="text-xs text-[#8E8E93]">{session.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-[#8E8E93]">暂无训练记录</p>
            </div>
          )}
        </section>
      </main>

      {/* 创建用户弹窗 */}
      {showCreateModal && (
        <Modal title="创建用户" onClose={() => setShowCreateModal(false)}>
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="输入用户名"
            className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3.5 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setNewUserName('');
              }}
              className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
            >
              取消
            </button>
            <button
              onClick={handleCreateUser}
              disabled={!newUserName.trim()}
              className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </Modal>
      )}

      {/* 删除用户确认弹窗 */}
      {userToDelete && (
        <Modal title="删除用户" onClose={() => setUserToDelete(null)}>
          <p className="text-[#8E8E93] mb-6">确定要删除该用户吗？此操作无法撤销。</p>
          <div className="flex gap-3">
            <button
              onClick={() => setUserToDelete(null)}
              className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
            >
              取消
            </button>
            <button
              onClick={confirmDeleteUser}
              className="flex-1 bg-[#FF3B30] text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              删除
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/**
 * 弹窗组件
 */
const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({
  title,
  children,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1C1C1E]">{title}</h3>
          <button onClick={onClose} className="text-[#8E8E93]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Home;
