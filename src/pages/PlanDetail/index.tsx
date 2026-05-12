/**
 * 计划详情/编辑页面
 * @description Apple Health 风格显示计划详情，支持编辑计划名称、增删改动作
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import type { Exercise, TrainingPlan } from '../../types';
import ExercisePicker from '../../components/ExercisePicker';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';

/**
 * 计划详情页面组件
 */
const PlanDetail: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser } = useUser();
  const { plans, updatePlan, deletePlan } = usePlan();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  // 用于动作名称选择器
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  // URL 参数控制编辑模式
  useEffect(() => {
    if (searchParams.get('mode') === 'edit') {
      setIsEditing(true);
    }
  }, [searchParams]);

  // 加载计划数据
  useEffect(() => {
    if (planId && currentUser) {
      const foundPlan = plans.find((p) => p.id === planId);
      if (foundPlan) {
        setPlan(foundPlan);
        setPlanName(foundPlan.name);
        setExercises([...foundPlan.exercises]);
        setSelectedDays(foundPlan.dayOfWeek || []);
      } else {
        navigate('/plans');
      }
    }
  }, [planId, plans, currentUser, navigate]);

  // 如果未登录，重定向到首页
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

  // 计划不存在
  if (!plan) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#8E8E93] mb-4">计划不存在</p>
          <button
            onClick={() => navigate('/plans')}
            className="bg-[#007AFF] text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200"
          >
            返回计划列表
          </button>
        </div>
      </div>
    );
  }

  /**
   * 处理保存计划
   */
  const handleSave = () => {
    const updatedPlan: TrainingPlan = {
      ...plan,
      name: planName.trim() || plan.name,
      exercises,
      dayOfWeek: selectedDays,
      updatedAt: new Date().toISOString(),
    };
    updatePlan(updatedPlan);
    setIsEditing(false);
    // 清除 URL 中的 mode 参数
    navigate(`/plan/${plan.id}`, { replace: true });
  };

  /**
   * 处理删除计划
   */
  const handleDelete = () => {
    deletePlan(plan.id);
    navigate('/plans');
  };

  /**
   * 处理添加动作
   */
  const handleAddExercise = (libraryExercise: { id: string; name: string; category: string }) => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: libraryExercise.name,
      defaultSets: 4,
      defaultReps: 12,
      defaultWeight: 0,
      libraryId: libraryExercise.id.startsWith('custom-') ? null : libraryExercise.id,
    };
    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
    setEditingExerciseIndex(null);
  };

  /**
   * 处理替换动作（用于编辑模式下点击动作名称）
   */
  const handleReplaceExercise = (libraryExercise: { id: string; name: string; category: string }) => {
    if (editingExerciseIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[editingExerciseIndex] = {
        ...updatedExercises[editingExerciseIndex],
        name: libraryExercise.name,
        libraryId: libraryExercise.id.startsWith('custom-') ? null : libraryExercise.id,
      };
      setExercises(updatedExercises);
      setEditingExerciseIndex(null);
    } else {
      // 如果没有指定索引，则添加新动作
      handleAddExercise(libraryExercise);
    }
    setShowExercisePicker(false);
  };

  /**
   * 处理更新动作
   */
  const handleUpdateExercise = (updatedExercise: Exercise) => {
    setExercises(exercises.map((ex) => (ex.id === updatedExercise.id ? updatedExercise : ex)));
    setEditingExercise(null);
  };

  /**
   * 处理删除动作
   */
  const handleDeleteExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  /**
   * 处理移动动作顺序
   */
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newExercises = [...exercises];
      [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
      setExercises(newExercises);
    } else if (direction === 'down' && index < exercises.length - 1) {
      const newExercises = [...exercises];
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
      setExercises(newExercises);
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

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-24">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-[#E5E5EA] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/plans')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] text-[#007AFF] transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1C1C1E]">计划详情</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPlanName(plan.name);
                    setExercises([...plan.exercises]);
                    setSelectedDays(plan.dayOfWeek || []);
                    navigate(`/plan/${plan.id}`, { replace: true });
                  }}
                  className="text-[#8E8E93] font-medium py-2 px-4 transition-all duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="bg-[#007AFF] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  保存
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/training?planId=${plan.id}`)}
                  className="bg-[#007AFF] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  开始训练
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#F2F2F7] text-[#1C1C1E] font-medium py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  编辑
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 计划信息 */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trainingTypeIconColors[plan.type]}`}>
              {getTypeIcon(plan.type)}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                  placeholder="计划名称"
                />
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#1C1C1E]">{plan.name}</h2>
                  <p className={`text-sm font-medium ${trainingTypeTextColors[plan.type]}`}>
                    {trainingTypeLabels[plan.type]}
                  </p>
                </>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-4 text-sm text-[#8E8E93]">
              <span>{exercises.length} 个动作</span>
              <span>·</span>
              <span>创建于 {new Date(plan.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          )}
        </div>

        {/* 动作列表 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1C1C1E]">动作列表</h3>
            {isEditing && (
              <button
                onClick={() => setShowExercisePicker(true)}
                className="bg-[#007AFF] text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加动作
              </button>
            )}
          </div>

          {exercises.map((exercise, index) => (
            <div
              key={exercise.id}
              className="bg-white rounded-2xl p-4 shadow-sm animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              {editingExercise?.id === exercise.id ? (
                /* 编辑模式 */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[#1C1C1E]">{exercise.name}</h4>
                    <button
                      onClick={() => setEditingExercise(null)}
                      className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#8E8E93] mb-1">组数</label>
                      <input
                        type="number"
                        value={editingExercise.defaultSets}
                        onChange={(e) =>
                          setEditingExercise({
                            ...editingExercise,
                            defaultSets: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8E8E93] mb-1">次数</label>
                      <input
                        type="number"
                        value={editingExercise.defaultReps}
                        onChange={(e) =>
                          setEditingExercise({
                            ...editingExercise,
                            defaultReps: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8E8E93] mb-1">重量 (kg)</label>
                      <input
                        type="number"
                        value={editingExercise.defaultWeight}
                        onChange={(e) =>
                          setEditingExercise({
                            ...editingExercise,
                            defaultWeight: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                        min={0}
                        step={0.5}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateExercise(editingExercise)}
                    className="w-full bg-[#007AFF] text-white font-medium py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    保存修改
                  </button>
                </div>
              ) : (
                /* 显示模式 */
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#F2F2F7] flex items-center justify-center text-xs text-[#8E8E93] font-medium">
                      {index + 1}
                    </span>
                    <div>
                      {isEditing ? (
                        <button
                          onClick={() => {
                            setEditingExerciseIndex(index);
                            setShowExercisePicker(true);
                          }}
                          className="font-semibold text-[#1C1C1E] text-left hover:text-[#007AFF] transition-colors"
                        >
                          {exercise.name}
                        </button>
                      ) : (
                        <h4 className="font-semibold text-[#1C1C1E]">{exercise.name}</h4>
                      )}
                      <p className="text-sm text-[#8E8E93]">
                        {exercise.defaultSets ?? 3} 组 × {exercise.defaultReps ?? 10} 次
                        {(exercise.defaultWeight ?? 0) > 0 && ` @ ${exercise.defaultWeight}kg`}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] disabled:opacity-30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] disabled:opacity-30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingExercise(exercise)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F2F2F7] text-[#8E8E93] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#FF3B30] transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {exercises.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-[#8E8E93] mb-4">还没有动作</p>
              {isEditing && (
                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="bg-[#007AFF] text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  添加动作
                </button>
              )}
            </div>
          )}
        </div>

        {/* 训练日选择 */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm animate-fade-in">
          <h3 className="text-lg font-bold text-[#1C1C1E] mb-3">训练日</h3>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
                const dayVal = i === 6 ? 0 : i + 1;
                const isSelected = selectedDays.includes(dayVal);
                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDays(isSelected ? selectedDays.filter(d => d !== dayVal) : [...selectedDays, dayVal]);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedDays.length > 0 ? (
                selectedDays.sort((a, b) => a === 0 ? 7 : a - (b === 0 ? 7 : b)).map(jsDay => {
                  const label = jsDay === 1 ? '周一' : jsDay === 2 ? '周二' : jsDay === 3 ? '周三' : jsDay === 4 ? '周四' : jsDay === 5 ? '周五' : jsDay === 6 ? '周六' : '周日';
                  return (
                    <span key={jsDay} className="bg-[#007AFF]/10 text-[#007AFF] text-sm font-medium px-3 py-1 rounded-lg">
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-[#8E8E93]">未安排训练日</span>
              )}
            </div>
          )}
        </div>

        {/* 删除计划按钮 */}
        {!isEditing && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full mt-8 bg-white text-[#FF3B30] font-medium py-3.5 rounded-2xl shadow-sm transition-all duration-200 active:scale-[0.98]"
          >
            删除计划
          </button>
        )}
      </main>

      {/* 动作选择器 */}
      {showExercisePicker && (
        <ExercisePicker
          category={plan.type}
          onSelect={editingExerciseIndex !== null ? handleReplaceExercise : handleAddExercise}
          onCancel={() => {
            setShowExercisePicker(false);
            setEditingExerciseIndex(null);
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
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
              确定要删除计划 <span className="text-[#1C1C1E] font-medium">"{plan.name}"</span> 吗？
            </p>
            <p className="text-sm text-[#8E8E93] text-center mb-6">此操作不可恢复</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
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

export default PlanDetail;
