/**
 * 训练详情页面
 * @description Apple Health 风格查看历史训练记录的详细信息，支持编辑和删除
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import type { TrainingSession, SessionExercise, Set } from '../../types';
import { getSessionById, deleteSession, updateSession } from '../../utils/storage';
import {
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
} from '../../data/planTemplates';

/**
 * 训练详情页面组件
 */
const SessionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentUser } = useUser();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 编辑模式下的临时状态
  const [editDate, setEditDate] = useState('');
  const [editExercises, setEditExercises] = useState<SessionExercise[]>([]);

  // 加载训练记录
  useEffect(() => {
    if (sessionId && currentUser) {
      const foundSession = getSessionById(currentUser.id, sessionId);
      if (foundSession) {
        setSession(foundSession);
      } else {
        navigate('/');
      }
    }
  }, [sessionId, currentUser, navigate]);

  /**
   * 进入编辑模式
   * @description 将当前 session 数据复制到编辑状态中
   */
  const enterEditMode = useCallback(() => {
    if (!session) return;
    setEditDate(session.date);
    // 深拷贝 exercises，避免直接修改原始数据
    setEditExercises(JSON.parse(JSON.stringify(session.exercises)));
    setIsEditing(true);
  }, [session]);

  /**
   * 取消编辑模式
   * @description 丢弃所有编辑内容，恢复原始数据
   */
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditDate('');
    setEditExercises([]);
  }, []);

  /**
   * 保存编辑内容
   * @description 将编辑后的数据持久化到 localStorage
   */
  const saveEdit = useCallback(() => {
    if (!currentUser || !session) return;
    updateSession(currentUser.id, session.id, {
      date: editDate,
      exercises: editExercises,
    });
    // 更新本地状态
    setSession({
      ...session,
      date: editDate,
      exercises: editExercises,
    });
    setIsEditing(false);
  }, [currentUser, session, editDate, editExercises]);

  /**
   * 修改指定动作的指定组数据
   * @param exerciseIndex - 动作索引
   * @param setIndex - 组索引
   * @param field - 要修改的字段（weight 或 reps）
   * @param value - 新值
   */
  const handleSetChange = useCallback(
    (exerciseIndex: number, setIndex: number, field: keyof Set, value: number) => {
      setEditExercises((prev) => {
        const updated = [...prev];
        updated[exerciseIndex] = {
          ...updated[exerciseIndex],
          sets: updated[exerciseIndex].sets.map((s, i) =>
            i === setIndex ? { ...s, [field]: value } : s
          ),
        };
        return updated;
      });
    },
    []
  );

  /**
   * 为指定动作添加一组
   * @param exerciseIndex - 动作索引
   */
  const handleAddSet = useCallback((exerciseIndex: number) => {
    setEditExercises((prev) => {
      const updated = [...prev];
      const currentSets = updated[exerciseIndex].sets;
      // 继承上一组的重量和次数，若无则默认为 0
      const lastSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : { weight: 0, reps: 0 };
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...currentSets, { weight: lastSet.weight, reps: lastSet.reps }],
      };
      return updated;
    });
  }, []);

  /**
   * 删除指定动作的指定组
   * @param exerciseIndex - 动作索引
   * @param setIndex - 组索引
   */
  const handleDeleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setEditExercises((prev) => {
      const updated = [...prev];
      if (updated[exerciseIndex].sets.length <= 1) return prev; // 至少保留一组
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: updated[exerciseIndex].sets.filter((_, i) => i !== setIndex),
      };
      return updated;
    });
  }, []);

  /**
   * 添加新动作
   * @description 在编辑模式下添加一个空白动作
   */
  const handleAddExercise = useCallback(() => {
    setEditExercises((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 15),
        name: '新动作',
        sets: [{ weight: 0, reps: 0 }],
        isFromPlan: false,
        libraryId: null,
      },
    ]);
  }, []);

  /**
   * 删除指定动作
   * @param exerciseIndex - 动作索引
   */
  const handleDeleteExercise = useCallback((exerciseIndex: number) => {
    setEditExercises((prev) => {
      if (prev.length <= 1) return prev; // 至少保留一个动作
      return prev.filter((_, i) => i !== exerciseIndex);
    });
  }, []);

  /**
   * 修改动作名称
   * @param exerciseIndex - 动作索引
   * @param name - 新名称
   */
  const handleExerciseNameChange = useCallback((exerciseIndex: number, name: string) => {
    setEditExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex] = { ...updated[exerciseIndex], name };
      return updated;
    });
  }, []);

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

  // 如果记录未加载
  if (!session) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#8E8E93]">加载中...</p>
        </div>
      </div>
    );
  }

  /**
   * 处理删除记录
   */
  const handleDelete = () => {
    if (currentUser) {
      deleteSession(currentUser.id, session.id);
      navigate('/');
    }
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
   * 计算总次数
   */
  const totalReps = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + set.reps, 0),
    0
  );

  /**
   * 获取训练类型图标
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'pull':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'legs':
        return (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
          </svg>
        );
      default:
        return null;
    }
  };

  /**
   * 格式化时间
   */
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * 渲染编辑模式下的组数据输入行
   * @param exerciseIndex - 动作索引
   * @param set - 组数据
   * @param setIndex - 组索引
   */
  const renderEditableSetRow = (exerciseIndex: number, set: Set, setIndex: number) => (
    <div
      key={setIndex}
      className="flex items-center gap-2 bg-[#F2F2F7] rounded-xl p-3"
    >
      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-[#8E8E93] font-medium flex-shrink-0">
        {setIndex + 1}
      </span>
      <input
        type="number"
        value={set.weight || ''}
        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
        placeholder="重量"
        className="w-20 px-2 py-1.5 bg-white rounded-lg text-sm text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
      />
      <span className="text-[#8E8E93] text-sm flex-shrink-0">kg</span>
      <span className="text-[#8E8E93] text-sm">×</span>
      <input
        type="number"
        value={set.reps || ''}
        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', parseFloat(e.target.value) || 0)}
        placeholder="次数"
        className="w-20 px-2 py-1.5 bg-white rounded-lg text-sm text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
      />
      <span className="text-[#8E8E93] text-sm flex-shrink-0">次</span>
      {/* 删除组按钮 */}
      <button
        onClick={() => handleDeleteSet(exerciseIndex, setIndex)}
        className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#FF3B30] flex-shrink-0 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  /**
   * 渲染编辑模式下的动作卡片
   * @param exercise - 动作数据
   * @param exerciseIndex - 动作索引
   */
  const renderEditableExercise = (exercise: SessionExercise, exerciseIndex: number) => (
    <div
      key={exercise.id}
      className="bg-white rounded-2xl overflow-hidden shadow-sm animate-slide-up"
      style={{ animationDelay: `${exerciseIndex * 50}ms` }}
    >
      <div className="p-4">
        {/* 动作名称（可编辑） + 删除动作按钮 */}
        <div className="flex items-center gap-3 mb-3">
          <span className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-sm text-[#8E8E93] font-medium flex-shrink-0">
            {exerciseIndex + 1}
          </span>
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => handleExerciseNameChange(exerciseIndex, e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#F2F2F7] rounded-lg text-sm font-bold text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          <button
            onClick={() => handleDeleteExercise(exerciseIndex)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#FF3B30] flex-shrink-0 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* 可编辑的组数据 */}
        <div className="space-y-2">
          {exercise.sets.map((set, setIndex) =>
            renderEditableSetRow(exerciseIndex, set, setIndex)
          )}
        </div>

        {/* 添加组按钮 */}
        <button
          onClick={() => handleAddSet(exerciseIndex)}
          className="mt-2 w-full py-2 text-sm text-[#007AFF] font-medium bg-blue-50 rounded-xl active:bg-blue-100 transition-colors"
        >
          + 添加一组
        </button>
      </div>
    </div>
  );

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
            <h1 className="text-xl font-bold text-[#1C1C1E]">
              {isEditing ? '编辑训练' : '训练详情'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* 编辑/保存按钮 */}
            {!isEditing ? (
              <button
                onClick={enterEditMode}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-blue-50 text-[#007AFF] transition-all duration-200"
                title="编辑"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={saveEdit}
                className="h-10 px-4 flex items-center justify-center rounded-xl bg-[#007AFF] text-white text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                保存
              </button>
            )}
            {/* 删除按钮（编辑模式下隐藏） */}
            {!isEditing && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 text-[#FF3B30] transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 训练概览卡片 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${trainingTypeIconColors[session.type]}`}>
              {getTypeIcon(session.type)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1C1C1E]">{session.planName}</h2>
              <p className={`text-lg font-medium ${trainingTypeTextColors[session.type]}`}>
                {trainingTypeLabels[session.type]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 日期字段：编辑模式下可修改 */}
            <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
              {isEditing ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-2 py-1 bg-white rounded-lg text-lg font-bold text-[#1C1C1E] text-center focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              ) : (
                <p className="text-2xl font-bold text-[#1C1C1E]">{session.date}</p>
              )}
              <p className="text-xs text-[#8E8E93]">日期</p>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{formatTime(session.createdAt)}</p>
              <p className="text-xs text-[#8E8E93]">时间</p>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{session.exercises.length}</p>
              <p className="text-xs text-[#8E8E93]">动作数</p>
            </div>
            <div className="bg-[#F2F2F7] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{totalSets}</p>
              <p className="text-xs text-[#8E8E93]">总组数</p>
            </div>
          </div>

          {/* 统计数据 */}
          {(totalVolume > 0 || totalReps > 0) && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {totalVolume > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#007AFF]">{Math.round(totalVolume)}</p>
                  <p className="text-sm text-[#007AFF]">总容量 (kg)</p>
                </div>
              )}
              {totalReps > 0 && (
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#34C759]">{totalReps}</p>
                  <p className="text-sm text-[#34C759]">总次数</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 动作详情 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1C1C1E]">动作详情</h3>
            {/* 编辑模式下显示添加动作按钮 */}
            {isEditing && (
              <button
                onClick={handleAddExercise}
                className="text-sm text-[#007AFF] font-medium px-3 py-1 rounded-lg bg-blue-50 active:bg-blue-100 transition-colors"
              >
                + 添加动作
              </button>
            )}
          </div>

          {isEditing
            ? editExercises.map((exercise, exerciseIndex) =>
                renderEditableExercise(exercise, exerciseIndex)
              )
            : session.exercises.map((exercise, exerciseIndex) => {
                const exerciseVolume = exercise.sets.reduce((acc, set) => acc + set.weight * set.reps, 0);
                const exerciseReps = exercise.sets.reduce((acc, set) => acc + set.reps, 0);

                return (
                  <div
                    key={exercise.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm animate-slide-up"
                    style={{ animationDelay: `${exerciseIndex * 50}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-sm text-[#8E8E93] font-medium">
                            {exerciseIndex + 1}
                          </span>
                          <h4 className="font-bold text-[#1C1C1E]">{exercise.name}</h4>
                        </div>
                        <span className="text-xs text-[#8E8E93] bg-[#F2F2F7] px-2 py-1 rounded-lg">
                          {exercise.isFromPlan ? '来自计划' : '新增'}
                        </span>
                      </div>

                      {/* 组详情 */}
                      <div className="space-y-2">
                        {exercise.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="flex items-center justify-between bg-[#F2F2F7] rounded-xl p-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-[#8E8E93] font-medium">
                                {setIndex + 1}
                              </span>
                              <span className="text-[#1C1C1E]">{set.weight > 0 ? `${set.weight} kg` : '自重'}</span>
                              <span className="text-[#8E8E93]">×</span>
                              <span className="text-[#1C1C1E]">{set.reps} 次</span>
                            </div>
                            {set.weight > 0 && (
                              <span className="text-sm text-[#8E8E93]">{Math.round(set.weight * set.reps)} kg</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 动作统计 */}
                      <div className="flex gap-4 mt-3 pt-3 border-t border-[#E5E5EA]">
                        <span className="text-sm text-[#8E8E93]">{exercise.sets.length} 组 · {exerciseReps} 次</span>
                        {exerciseVolume > 0 && (
                          <span className="text-sm text-[#007AFF] font-medium">容量: {Math.round(exerciseVolume)} kg</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* 编辑模式底部按钮 */}
        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={cancelEdit}
              className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98]"
            >
              取消
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 bg-[#007AFF] text-white font-bold py-3.5 rounded-2xl transition-all duration-200 active:scale-[0.98]"
            >
              保存修改
            </button>
          </div>
        )}

        {/* 再次训练按钮（非编辑模式下显示） */}
        {!isEditing && session.planId && (
          <button
            onClick={() => navigate(`/training?planId=${session.planId}`)}
            className="w-full mt-6 bg-[#007AFF] text-white font-bold py-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
          >
            再次使用该计划训练
          </button>
        )}
      </main>

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
            <h2 className="text-xl font-bold text-[#1C1C1E] text-center mb-2">删除记录</h2>
            <p className="text-[#8E8E93] text-center mb-6">确定要删除这条训练记录吗？此操作不可恢复。</p>
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

export default SessionDetail;
