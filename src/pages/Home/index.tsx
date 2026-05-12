/**
 * 首页组件
 * @description Apple Health 风格首页，用户切换、今日状态、历史列表
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import type { TrainingSession, TrainingPlan } from '../../types';
import { getSessionsByUser } from '../../utils/storage';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';

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
  const [newUserName, setNewUserName] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  // 选中的星期（默认今天）
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  // 加载训练记录
  useEffect(() => {
    if (currentUser) {
      const userSessions = getSessionsByUser(currentUser.id);
      setSessions(userSessions.slice(0, 5));
    } else {
      setSessions([]);
    }
  }, [currentUser]);

  // 周看板数据
  const todayJsDay = new Date().getDay(); // 0=周日, 1=周一...6=周六
  const weekDays = [
    { label: '周一', jsDay: 1 },
    { label: '周二', jsDay: 2 },
    { label: '周三', jsDay: 3 },
    { label: '周四', jsDay: 4 },
    { label: '周五', jsDay: 5 },
    { label: '周六', jsDay: 6 },
    { label: '周日', jsDay: 0 },
  ];

  /**
   * 获取指定星期几的训练计划
   * @param jsDay - JavaScript 的星期几（0=周日, 1=周一...6=周六）
   * @returns 该日的训练计划列表
   */
  const getPlansForDay = (jsDay: number): TrainingPlan[] => {
    return plans.filter(p => p.dayOfWeek?.includes(jsDay));
  };

  /**
   * 获取指定日期的训练记录
   * @param jsDay - JavaScript 的星期几
   * @returns 该日的训练记录
   */
  const getSessionsForDay = (jsDay: number): TrainingSession[] => {
    // 计算该星期几对应的日期
    const today = new Date();
    const currentDay = today.getDay();
    const diff = jsDay - currentDay;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    return sessions.filter(s => s.date === dateStr);
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
        {/* 训练周看板 */}
        {plans.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <h2 className="text-lg font-bold text-[#1C1C1E] mb-3 px-1">本周训练</h2>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map(({ label, jsDay }) => {
                  const dayPlans = getPlansForDay(jsDay);
                  const isToday = jsDay === todayJsDay;
                  const isSelected = jsDay === selectedDay;
                  const daySessions = getSessionsForDay(jsDay);
                  const hasCompleted = daySessions.length > 0;
                  return (
                    <button
                      key={jsDay}
                      onClick={() => setSelectedDay(jsDay)}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                        isSelected ? 'bg-[#007AFF]/10 ring-1 ring-[#007AFF]/30' : 'hover:bg-[#F2F2F7]'
                      }`}
                    >
                      <span className={`text-xs font-medium mb-1.5 ${isSelected ? 'text-[#007AFF]' : isToday ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
                        {label}
                      </span>
                      {dayPlans.length > 0 ? (
                        <div className="flex flex-col gap-1 w-full items-center">
                          {dayPlans.map(plan => (
                            <div
                              key={plan.id}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                plan.type === 'push' ? 'bg-blue-100 text-blue-600' :
                                plan.type === 'pull' ? 'bg-purple-100 text-purple-600' :
                                'bg-green-100 text-green-600'
                              }`}
                              title={plan.name}
                            >
                              {plan.type === 'push' ? '推' : plan.type === 'pull' ? '拉' : '腿'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#F2F2F7] flex items-center justify-center">
                          <span className="text-[10px] text-[#C7C7CC]">休</span>
                        </div>
                      )}
                      {/* 训练完成标记 */}
                      {hasCompleted && (
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#34C759]"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 选中日期训练详情 */}
              {(() => {
                const selectedPlans = getPlansForDay(selectedDay);
                const selectedSessions = getSessionsForDay(selectedDay);
                const isToday = selectedDay === todayJsDay;
                const dayLabel = weekDays.find(d => d.jsDay === selectedDay)?.label || '';
                
                if (selectedPlans.length === 0 && selectedSessions.length === 0) return null;
                
                return (
                  <div className="mt-4 pt-4 border-t border-[#E5E5EA]">
                    <p className="text-sm font-medium text-[#1C1C1E] mb-3">
                      {isToday ? '今日训练' : `${dayLabel}训练`}
                    </p>
                    <div className="space-y-2">
                      {/* 计划列表（按时间正序，未完成的在前） */}
                      {[...selectedPlans]
                        .sort((a, b) => {
                          // 检查是否已完成
                          const aCompleted = selectedSessions.some(s => s.planId === a.id);
                          const bCompleted = selectedSessions.some(s => s.planId === b.id);
                          // 未完成的排前面
                          if (aCompleted === bCompleted) return 0;
                          return aCompleted ? 1 : -1;
                        })
                        .map(plan => {
                          const completedSession = selectedSessions.find(s => s.planId === plan.id);
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
                                  <p className="text-xs text-[#8E8E93]">
                                    {isCompleted 
                                      ? `${completedSession!.exercises.length} 个动作 · ${completedSession!.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} 组`
                                      : `${plan.exercises.length} 个动作`
                                    }
                                  </p>
                                </div>
                              </div>
                              {isCompleted ? (
                                <button
                                  onClick={() => navigate(`/session/${completedSession!.id}`)}
                                  className="bg-[#34C759] text-white text-sm font-medium px-4 py-2 rounded-lg active:scale-[0.98] transition-transform"
                                >
                                  已完成
                                </button>
                              ) : (
                                <button
                                  onClick={() => navigate(`/training?planId=${plan.id}`)}
                                  className="bg-[#007AFF] text-white text-sm font-medium px-4 py-2 rounded-lg active:scale-[0.98] transition-transform"
                                >
                                  开始训练
                                </button>
                              )}
                            </div>
                          );
                        })}
                      
                      {/* 自由训练记录（不属于任何计划的） */}
                      {selectedSessions
                        .filter(s => !selectedPlans.some(p => p.id === s.planId))
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((session) => (
                          <div
                            key={session.id}
                            onClick={() => navigate(`/session/${session.id}`)}
                            className="flex items-center justify-between bg-[#34C759]/10 rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>
                                {getTypeIcon(session.type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-[#1C1C1E]">{session.planName}</h4>
                                <p className="text-xs text-[#8E8E93]">
                                  {session.exercises.length} 个动作 · {session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} 组
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-[#34C759] font-medium">
                              {new Date(session.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

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

      {/* 删除确认弹窗 */}
      {userToDelete && (
        <Modal title="确认删除" onClose={() => setUserToDelete(null)}>
          <div className="w-14 h-14 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[#8E8E93] text-center mb-6">
            删除用户将同时删除该用户的所有计划和训练记录，此操作不可恢复。
          </p>
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
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold text-[#1C1C1E] mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

export default Home;
