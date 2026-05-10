/**
 * 训练进行中页面
 * @description Apple Health 风格记录训练数据，包括各动作的组数、次数、重量
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { useSession } from '../../store/SessionContext';
import type { SessionExercise, Set as ExerciseSet, TrainingSession } from '../../types';
import ExercisePicker from '../../components/ExercisePicker';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
} from '../../data/planTemplates';

/**
 * 未完成组信息
 */
interface IncompleteSetInfo {
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  missingWeight: boolean;
  missingReps: boolean;
}

/**
 * 训练进行中页面组件
 */
const Training: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');

  const { currentUser } = useUser();
  const { getPlan } = usePlan();
  const { currentSession, startTraining, startFreeTraining, updateSession, finishTraining, cancelTraining } = useSession();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [hasValidated, setHasValidated] = useState(false); // 是否已触发过验证

  // 初始化训练会话
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    // 如果有当前会话，检查是否是当前计划的会话
    if (currentSession) {
      // 如果当前会话的计划ID与URL中的planId匹配，使用当前会话
      // 否则需要创建新的会话
      if (planId && currentSession.planId === planId) {
        setSession(currentSession);
        return;
      }
      // 如果不匹配，说明是其他计划的残留会话，继续创建新会话
    }

    if (planId) {
      const plan = getPlan(planId);
      if (plan) {
        const newSession = startTraining(plan);
        setSession(newSession);
      } else {
        navigate('/plans');
      }
    } else {
      const newSession = startFreeTraining('push', '自由训练');
      setSession(newSession);
    }
  }, [currentUser, planId, getPlan, startTraining, startFreeTraining, currentSession, navigate]);

  /**
   * 检查未完成的组 - 必须在条件返回之前调用
   */
  const incompleteSets = useMemo((): IncompleteSetInfo[] => {
    if (!session) return [];
    
    const incomplete: IncompleteSetInfo[] = [];
    
    session.exercises.forEach(exercise => {
      exercise.sets.forEach((set, setIndex) => {
        const missingWeight = !set.weight || set.weight <= 0;
        const missingReps = !set.reps || set.reps <= 0;
        
        if (missingWeight || missingReps) {
          incomplete.push({
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            setIndex,
            missingWeight,
            missingReps,
          });
        }
      });
    });
    
    return incomplete;
  }, [session]);

  /**
   * 获取未完成组的动作 ID 集合
   */
  const incompleteExerciseIds = useMemo(() => {
    return new Set(incompleteSets.map(info => info.exerciseId));
  }, [incompleteSets]);

  // 如果未登录
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#8E8E93] mb-4">请先选择用户</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#007AFF] text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 如果会话未初始化
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#8E8E93]">正在初始化训练...</p>
        </div>
      </div>
    );
  }

  /**
   * 检查是否有未完成的组
   */
  const hasIncompleteSets = incompleteSets.length > 0;

  /**
   * 检查某组的某个字段是否未填写
   */
  const isSetFieldIncomplete = (exerciseId: string, setIndex: number, field: 'weight' | 'reps'): boolean => {
    const info = incompleteSets.find(
      item => item.exerciseId === exerciseId && item.setIndex === setIndex
    );
    if (!info) return false;
    return field === 'weight' ? info.missingWeight : info.missingReps;
  };

  /**
   * 更新会话状态
   */
  const updateSessionState = (newSession: TrainingSession) => {
    setSession(newSession);
    updateSession(newSession);
  };

  /**
   * 处理添加动作
   */
  const handleAddExercise = (libraryExercise: { id: string; name: string; category: string }) => {
    const newExercise: SessionExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: libraryExercise.name,
      sets: [],
      isFromPlan: false,
      libraryId: libraryExercise.id.startsWith('custom-') ? null : libraryExercise.id,
    };

    const updatedSession = {
      ...session,
      exercises: [...session.exercises, newExercise],
    };
    updateSessionState(updatedSession);
    setShowExercisePicker(false);
    setExpandedExercise(newExercise.id);
  };

  /**
   * 处理删除动作
   */
  const handleDeleteExercise = (exerciseId: string) => {
    const updatedSession = {
      ...session,
      exercises: session.exercises.filter((ex) => ex.id !== exerciseId),
    };
    updateSessionState(updatedSession);
    if (expandedExercise === exerciseId) {
      setExpandedExercise(null);
    }
  };

  /**
   * 处理添加组
   */
  const handleAddSet = (exerciseId: string) => {
    const newSet: ExerciseSet = {
      reps: 12,
      weight: 0,
    };

    const updatedSession = {
      ...session,
      exercises: session.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex
      ),
    };
    updateSessionState(updatedSession);
  };

  /**
   * 处理更新组
   */
  const handleUpdateSet = (exerciseId: string, setIndex: number, updatedSet: ExerciseSet) => {
    const updatedSession = {
      ...session,
      exercises: session.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((set, index) => (index === setIndex ? updatedSet : set)) }
          : ex
      ),
    };
    updateSessionState(updatedSession);
  };

  /**
   * 处理删除组
   */
  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    const updatedSession = {
      ...session,
      exercises: session.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((_, index) => index !== setIndex) } : ex
      ),
    };
    updateSessionState(updatedSession);
  };

  /**
   * 处理完成训练
   */
  const handleFinish = () => {
    finishTraining();
    navigate('/');
  };

  /**
   * 处理点击完成训练
   */
  const handleFinishClick = () => {
    if (hasIncompleteSets) {
      // 标记已触发验证，启用红框高亮
      setHasValidated(true);
      // 展开第一个未完成的动作
      const firstIncomplete = incompleteSets[0];
      setExpandedExercise(firstIncomplete.exerciseId);
      setShowIncompleteWarning(true);
    } else {
      setShowFinishConfirm(true);
    }
  };

  /**
   * 处理取消训练
   */
  const handleCancel = () => {
    cancelTraining();
    navigate('/plans');
  };

  /**
   * 计算总组数
   */
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  /**
   * 计算总容量
   */
  const totalVolume = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0),
    0
  );

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

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5EA] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] text-[#FF3B30] transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-[#1C1C1E]">{session.planName}</h1>
                <p className="text-sm text-[#8E8E93]">{trainingTypeLabels[session.type]}</p>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>
              {getTypeIcon(session.type)}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#F2F2F7] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{session.exercises.length}</p>
              <p className="text-xs text-[#8E8E93]">动作</p>
            </div>
            <div className="flex-1 bg-[#F2F2F7] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{totalSets}</p>
              <p className="text-xs text-[#8E8E93]">组数</p>
            </div>
            <div className="flex-1 bg-[#F2F2F7] rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#007AFF]">{totalVolume > 0 ? Math.round(totalVolume) : '-'}</p>
              <p className="text-xs text-[#8E8E93]">容量 (kg)</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 动作列表 */}
        <div className="space-y-4">
          {session.exercises.map((exercise, exerciseIndex) => (
            <div
              key={exercise.id}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm animate-slide-up ${
                hasValidated && incompleteExerciseIds.has(exercise.id) ? 'ring-2 ring-[#FF3B30]' : ''
              }`}
              style={{ animationDelay: `${exerciseIndex * 50}ms` }}
            >
              {/* 动作头部 */}
              <div
                onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#F2F2F7] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    hasValidated && incompleteExerciseIds.has(exercise.id) 
                      ? 'bg-[#FF3B30] text-white' 
                      : 'bg-[#F2F2F7] text-[#8E8E93]'
                  }`}>
                    {exerciseIndex + 1}
                  </span>
                  <div className="text-left">
                    <h3 className="font-bold text-[#1C1C1E]">{exercise.name}</h3>
                    <p className="text-sm text-[#8E8E93]">{exercise.sets.length} 组</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteExercise(exercise.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#FF3B30] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg
                    className={`w-5 h-5 text-[#8E8E93] transition-transform duration-200 ${expandedExercise === exercise.id ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* 组详情 */}
              {expandedExercise === exercise.id && (
                <div className="border-t border-[#E5E5EA] p-4 animate-fade-in">
                  {/* 组列表 */}
                  <div className="space-y-2 mb-4">
                    {exercise.sets.map((set, setIndex) => {
                      const isWeightIncomplete = hasValidated && isSetFieldIncomplete(exercise.id, setIndex, 'weight');
                      const isRepsIncomplete = hasValidated && isSetFieldIncomplete(exercise.id, setIndex, 'reps');
                      
                      return (
                        <div
                          key={setIndex}
                          className={`flex items-center gap-2 rounded-xl p-3 ${
                            (isWeightIncomplete || isRepsIncomplete) 
                              ? 'bg-red-50 border-2 border-[#FF3B30]' 
                              : 'bg-[#F2F2F7]'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            (isWeightIncomplete || isRepsIncomplete) 
                              ? 'bg-[#FF3B30] text-white' 
                              : 'bg-white text-[#8E8E93]'
                          }`}>
                            {setIndex + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className={`block text-xs mb-1 ${
                                isWeightIncomplete ? 'text-[#FF3B30]' : 'text-[#8E8E93]'
                              }`}>
                                重量 (kg) {isWeightIncomplete && '*'}
                              </label>
                              <input
                                type="number"
                                value={set.weight || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exercise.id, setIndex, {
                                    ...set,
                                    weight: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className={`w-full text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                  isWeightIncomplete 
                                    ? 'bg-white border-2 border-[#FF3B30] focus:ring-[#FF3B30]' 
                                    : 'bg-white focus:ring-[#007AFF]'
                                }`}
                                min={0}
                                step={0.5}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${
                                isRepsIncomplete ? 'text-[#FF3B30]' : 'text-[#8E8E93]'
                              }`}>
                                次数 {isRepsIncomplete && '*'}
                              </label>
                              <input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) =>
                                  handleUpdateSet(exercise.id, setIndex, {
                                    ...set,
                                    reps: parseInt(e.target.value) || 0,
                                  })
                                }
                                className={`w-full text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                  isRepsIncomplete 
                                    ? 'bg-white border-2 border-[#FF3B30] focus:ring-[#FF3B30]' 
                                    : 'bg-white focus:ring-[#007AFF]'
                                }`}
                                min={0}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSet(exercise.id, setIndex)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#FF3B30] transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* 添加组按钮 */}
                  <button
                    onClick={() => handleAddSet(exercise.id)}
                    className="w-full bg-[#F2F2F7] text-[#1C1C1E] font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加组
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* 添加动作按钮 */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full bg-white border-2 border-dashed border-[#E5E5EA] hover:border-[#007AFF] rounded-2xl p-4 text-center transition-all duration-200"
          >
            <div className="flex items-center justify-center gap-2 text-[#8E8E93] hover:text-[#007AFF]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">添加动作</span>
            </div>
          </button>
        </div>
      </main>

      {/* 底部固定栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-[#E5E5EA] p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleFinishClick}
            disabled={totalSets === 0}
            className={`w-full font-bold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
              hasValidated && hasIncompleteSets 
                ? 'bg-[#FF9500] text-white' 
                : 'bg-[#34C759] text-white disabled:bg-[#E5E5EA] disabled:text-[#8E8E93]'
            }`}
          >
            {hasValidated && hasIncompleteSets 
              ? `完成训练 (还有 ${incompleteSets.length} 组未填写)` 
              : `完成训练 (${totalSets} 组)`
            }
          </button>
        </div>
      </div>

      {/* 动作选择器 */}
      {showExercisePicker && (
        <ExercisePicker
          category={session.type}
          onSelect={handleAddExercise}
          onCancel={() => setShowExercisePicker(false)}
        />
      )}

      {/* 完成确认弹窗 */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowFinishConfirm(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-green-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">完成训练</h2>
            <p className="text-[#8E8E93] text-center mb-2">
              本次训练共 {session.exercises.length} 个动作，{totalSets} 组
            </p>
            {totalVolume > 0 && (
              <p className="text-[#007AFF] text-center mb-6 font-medium">
                总容量: {Math.round(totalVolume)} kg
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                继续训练
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 bg-[#34C759] text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 取消确认弹窗 */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowCancelConfirm(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#FF3B30]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">取消训练</h2>
            <p className="text-[#8E8E93] text-center mb-6">
              确定要取消本次训练吗？已记录的数据将不会保存。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                继续训练
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-[#FF3B30] text-white font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未完成警告弹窗 */}
      {showIncompleteWarning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowIncompleteWarning(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-orange-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#FF9500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">训练未完成</h2>
            <p className="text-[#8E8E93] text-center mb-2">
              还有 <span className="text-[#FF9500] font-bold">{incompleteSets.length}</span> 组数据未填写
            </p>
            <div className="bg-red-50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-[#FF3B30] font-medium mb-2">未完成的动作：</p>
              <ul className="text-sm text-[#1C1C1E] space-y-1">
                {Array.from(new Set(incompleteSets.map(s => s.exerciseName))).map((name, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]"></span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-[#8E8E93] text-center mb-4">
              请补充红框标记的重量和次数数据
            </p>
            <button
              onClick={() => setShowIncompleteWarning(false)}
              className="w-full bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              继续填写
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;
