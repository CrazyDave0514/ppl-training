/**
 * 首页组件 - V1.2.3 重构版
 * @description Apple Health 风格首页，周看板 + 今日概览
 * V1.2.3 更新：周看板、每道菜单独打卡、弧形进度
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { useDiet } from '../../store/DietContext';
import type { TrainingSession, TrainingType } from '../../types';
import { getSessionsByUser } from '../../utils/storage';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';
import { foodDatabase } from '../../data/foodDatabase';

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
  size?: number;
}> = ({ nutrition, size = 200 }) => {
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
    { radius: 85, color: '#FF9500', value: nutrition.carbs.actual, max: nutrition.carbs.target, label: '碳水' },
    { radius: 72, color: '#007AFF', value: nutrition.protein.actual, max: nutrition.protein.target, label: '蛋白质' },
    { radius: 59, color: '#FF3B30', value: nutrition.fat.actual, max: nutrition.fat.target, label: '脂肪' },
    { radius: 46, color: '#34C759', value: nutrition.calories.actual, max: nutrition.calories.target, label: '热量' },
  ];
  
  const totalAngle = endAngle - startAngle;
  
  return (
    <div className="relative flex justify-center" style={{ width: size, height: size * 0.85 }}>
      <svg width={size} height={size} className="overflow-visible">
        {layers.map((layer, index) => {
          const progress = layer.max > 0 ? Math.min(layer.value / layer.max, 1) : 0;
          const currentAngle = startAngle + totalAngle * progress;
          const bgPath = describeArc(layer.radius, startAngle, endAngle);
          const progressPath = describeArc(layer.radius, startAngle, currentAngle);
          
          return (
            <g key={index}>
              <path d={bgPath} fill="none" stroke="#E5E5EA" strokeWidth={8} strokeLinecap="round" />
              <path d={progressPath} fill="none" stroke={layer.color} strokeWidth={8} strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <span className="text-3xl font-bold text-[#1C1C1E]">{nutrition.calories.actual}</span>
        <span className="text-xs text-[#8E8E93]">已摄入 kcal</span>
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
    actualNutrition,
    mealPlan,
    checkInFoodItem,
    uncheckInFoodItem,
    selectedDayOfWeek,
    setSelectedDayOfWeek,
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

  // 周日期计算
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
  
  // 获取今日训练计划（单日单计划）
  const todayPlans = plans.filter(p => p.dayOfWeek?.includes(todayDayOfWeek)).slice(0, 1);
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === todayDateStr);
  
  /**
   * 获取食物详情
   */
  const getFoodById = (foodId: string) => {
    return foodDatabase.find(f => f.id === foodId);
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
  const getTypeIcon = (type: TrainingType) => {
    switch (type) {
      case 'push':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'pull':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'legs':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
          </svg>
        );
      case 'free':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  /**
   * 处理每道菜打卡
   */
  const handleFoodCheckIn = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', foodIndex: number, isCompleted: boolean) => {
    if (isCompleted) {
      uncheckInFoodItem(mealType, foodIndex);
    } else {
      checkInFoodItem(mealType, foodIndex);
    }
  };

  // 未登录状态
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-sm animate-scale-in">
          <img src="/icon-80.png" alt="FitPlus" className="w-20 h-20 mx-auto mb-6 shadow-lg" />
          <h1 className="text-2xl font-bold text-[#1C1C1E] mb-2">FitPlus</h1>
          <p className="text-[#8E8E93] mb-8">Push / Pull / Legs 训练追踪</p>

          {users.length === 0 ? (
            <>
              <p className="text-[#8E8E93] mb-6">创建您的第一个用户开始训练</p>
              <button onClick={() => setShowCreateModal(true)} className="w-full bg-[#007AFF] text-white font-medium py-3.5 px-6 rounded-xl">
                创建用户
              </button>
            </>
          ) : (
            <>
              <p className="text-[#8E8E93] mb-6">选择用户继续</p>
              <div className="space-y-3">
                {users.map((user) => (
                  <button key={user.id} onClick={() => switchUser(user.id)} className="w-full bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3.5 px-6 rounded-xl flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {user.name}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCreateModal(true)} className="w-full mt-4 border-2 border-[#007AFF] text-[#007AFF] font-medium py-3 px-6 rounded-xl">
                + 创建新用户
              </button>
            </>
          )}
        </div>

        {showCreateModal && (
          <Modal title="创建用户" onClose={() => setShowCreateModal(false)}>
            <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="输入用户名" className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3.5 rounded-xl mb-4" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowCreateModal(false); setNewUserName(''); }} className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl">取消</button>
              <button onClick={handleCreateUser} disabled={!newUserName.trim()} className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl disabled:opacity-50">创建</button>
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
            <img src="/icon-40.png" alt="FitPlus" className="w-10 h-10 rounded-xl shadow-md" />
            <div>
              <h1 className="text-lg font-bold text-[#1C1C1E]">FitPlus</h1>
              <p className="text-xs text-[#8E8E93]">Push / Pull / Legs</p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-[#F2F2F7] text-[#1C1C1E] px-4 py-2.5 rounded-xl">
              <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">{currentUser.name}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E5E5EA]">
                <div className="p-2">
                  {users.map((user) => (
                    <button key={user.id} onClick={() => { switchUser(user.id); setShowUserMenu(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between ${user.id === currentUser.id ? 'bg-[#007AFF] text-white' : 'text-[#1C1C1E]'}`}>
                      <span>{user.name}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#E5E5EA] p-2">
                  <button onClick={() => { setShowUserMenu(false); setShowCreateModal(true); }} className="w-full text-left px-3 py-2.5 rounded-xl text-[#1C1C1E] hover:bg-[#F2F2F7] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    创建新用户
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 周看板 */}
        <section className="animate-slide-up">
          <h2 className="text-lg font-bold text-[#1C1C1E] mb-3 px-1">本周计划</h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* 周日期条 */}
            <div className="flex justify-between mb-4">
              {weekDates.map((date, index) => {
                const dayOfWeek = index + 1;
                const isToday = dayOfWeek === todayDayOfWeek;
                const isSelected = dayOfWeek === selectedDayOfWeek;
                const dayPlan = plans.find(p => p.dayOfWeek?.includes(dayOfWeek));
                const dateStr = date.toISOString().split('T')[0];
                const daySession = sessions.find(s => s.date === dateStr);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDayOfWeek(dayOfWeek)}
                    className={`flex flex-col items-center py-2 px-2 rounded-xl transition-all ${
                      isSelected ? 'bg-[#007AFF]/10' : ''
                    }`}
                  >
                    <span className={`text-xs mb-1 ${isToday ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}>
                      {['一', '二', '三', '四', '五', '六', '日'][index]}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      daySession ? 'bg-[#34C759]' : dayPlan ? trainingTypeIconColors[dayPlan.type] : 'bg-[#E5E5EA]'
                    }`}>
                      {daySession ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : dayPlan ? (
                        getTypeIcon(dayPlan.type)
                      ) : (
                        <span className="text-xs text-[#8E8E93]">{date.getDate()}</span>
                      )}
                    </div>
                    <span className={`text-xs ${isToday ? 'text-[#007AFF] font-bold' : 'text-[#8E8E93]'}`}>
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* 今日训练 */}
            <div className="border-t border-[#E5E5EA] pt-4 mb-4">
              <h3 className="font-medium text-[#1C1C1E] mb-3">今日训练</h3>
              {todayPlans.length > 0 ? (
                todayPlans.map(plan => {
                  const completedSession = todaySessions.find(s => s.planId === plan.id);
                  const isCompleted = !!completedSession;
                  
                  return (
                    <div key={plan.id} className={`flex items-center justify-between rounded-xl p-3 ${isCompleted ? 'bg-[#34C759]/10' : 'bg-[#F2F2F7]'}`}>
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
                        <button onClick={() => navigate(`/training?planId=${plan.id}`)} className="bg-[#007AFF] text-white text-xs font-medium px-3 py-1.5 rounded-lg">开始</button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#8E8E93]">今日暂无训练计划</p>
                  <button onClick={() => navigate('/plans')} className="mt-2 text-xs text-[#007AFF]">去创建</button>
                </div>
              )}
            </div>
            
            {/* 今日摄入 */}
            <div className="border-t border-[#E5E5EA] pt-4">
              <h3 className="font-medium text-[#1C1C1E] mb-3">今日摄入</h3>
              
              {mealPlan && (mealPlan.breakfast.length > 0 || mealPlan.lunch.length > 0 || mealPlan.dinner.length > 0 || mealPlan.snack.length > 0) ? (
                <>
                  {/* 弧形进度 */}
                  <div className="flex justify-center mb-4">
                    <MultiArcProgress nutrition={{ calories: actualNutrition.calories, protein: actualNutrition.protein, carbs: actualNutrition.carbs, fat: actualNutrition.fat }} />
                  </div>
                  
                  {/* 摄入量解释 */}
                  <div className="flex justify-center gap-4 mb-4 text-xs">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#34C759]"></span><span className="text-[#8E8E93]">热量 {actualNutrition.calories.actual}/{actualNutrition.calories.target}</span></div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#007AFF]"></span><span className="text-[#8E8E93]">蛋白质 {actualNutrition.protein.actual}g</span></div>
                  </div>
                  
                  {/* 餐食列表 + 每道菜打卡 */}
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
                    const mealItems = mealPlan[mealType];
                    if (mealItems.length === 0) return null;
                    
                    const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
                    
                    return (
                      <div key={mealType} className="mb-3">
                        <h4 className="text-xs text-[#8E8E93] mb-2">{mealLabels[mealType]}</h4>
                        <div className="space-y-2">
                          {mealItems.map((item, idx) => {
                            const food = getFoodById(item.foodId);
                            if (!food) return null;
                            const isCompleted = item.isCompleted || false;
                            
                            return (
                              <div key={idx} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isCompleted ? 'bg-[#34C759]/10' : 'bg-[#F2F2F7]'}`}>
                                <div className="flex items-center gap-2">
                                  <span>{food.icon}</span>
                                  <span className="text-sm text-[#1C1C1E]">{food.name}</span>
                                  <span className="text-xs text-[#8E8E93]">{item.amount}g</span>
                                </div>
                                <button
                                  onClick={() => handleFoodCheckIn(mealType, idx, isCompleted)}
                                  className={`px-2 py-1 rounded text-xs font-medium ${isCompleted ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#34C759] text-white'}`}
                                >
                                  {isCompleted ? '取消' : '打卡'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#8E8E93]">今日暂无饮食计划</p>
                  <button onClick={() => navigate('/plans')} className="mt-2 text-xs text-[#007AFF]">去生成</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 快捷操作 */}
        <section className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <h2 className="text-lg font-bold text-[#1C1C1E] mb-3 px-1">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/quick-create')} className="bg-white rounded-2xl p-4 text-left shadow-sm">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="font-semibold text-[#1C1C1E] mb-1">快速创建</h3>
              <p className="text-sm text-[#8E8E93]">从模板生成计划</p>
            </button>
            <button onClick={() => navigate('/plans')} className="bg-white rounded-2xl p-4 text-left shadow-sm">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
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
            {sessions.length > 0 && <button onClick={() => navigate('/records')} className="text-sm text-[#007AFF] font-medium">查看全部</button>}
          </div>

          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} onClick={() => navigate(`/session/${session.id}`)} className="bg-white rounded-2xl p-4 cursor-pointer shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>{getTypeIcon(session.type)}</div>
                      <div>
                        <h3 className="font-semibold text-[#1C1C1E]">{session.planName}</h3>
                        <p className="text-sm text-[#8E8E93]">{session.exercises.length} 个动作 · {session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} 组</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${trainingTypeTextColors[session.type]}`}>{trainingTypeLabels[session.type].split(' ')[0]}</span>
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
          <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="输入用户名" className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3.5 rounded-xl mb-4" autoFocus />
          <div className="flex gap-3">
            <button onClick={() => { setShowCreateModal(false); setNewUserName(''); }} className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl">取消</button>
            <button onClick={handleCreateUser} disabled={!newUserName.trim()} className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl disabled:opacity-50">创建</button>
          </div>
        </Modal>
      )}

      {/* 删除用户确认弹窗 */}
      {userToDelete && (
        <Modal title="删除用户" onClose={() => setUserToDelete(null)}>
          <p className="text-[#8E8E93] mb-6">确定要删除该用户吗？此操作无法撤销。</p>
          <div className="flex gap-3">
            <button onClick={() => setUserToDelete(null)} className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl">取消</button>
            <button onClick={confirmDeleteUser} className="flex-1 bg-[#FF3B30] text-white font-medium py-3 rounded-xl">删除</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

/**
 * 弹窗组件
 */
const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1C1C1E]">{title}</h3>
          <button onClick={onClose} className="text-[#8E8E93]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Home;
