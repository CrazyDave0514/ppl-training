/**
 * 快速创建页面
 * @description Apple Health 风格选择训练类型和难度级别，从模板生成计划
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import type { TrainingType, DifficultyLevel, Exercise } from '../../types';
import {
  getTemplate,
  difficultyLabels,
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
  trainingTypeBorderColors,
} from '../../data/planTemplates';
import { getExerciseById } from '../../data/exerciseLibrary';
import ExercisePicker from '../../components/ExercisePicker';

/**
 * 快速创建页面组件
 */
const QuickCreate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { createPlan } = usePlan();
  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [planName, setPlanName] = useState('');
  // 可编辑的动作列表（从模板初始化，用户可修改）
  const [editableExercises, setEditableExercises] = useState<Exercise[]>([]);
  // 选择的训练日
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  // 动作选择器状态
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

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

  /**
   * 获取当前选中的模板
   */
  const selectedTemplate = selectedType && selectedLevel ? getTemplate(selectedType, selectedLevel) : null;

  /**
   * 处理选择训练类型
   * 当选择 'free' 类型时，直接进入预览页面，不需要选择难度
   */
  const handleSelectType = (type: TrainingType) => {
    setSelectedType(type);
    setEditableExercises([]);
    setSelectedDays([]);
    
    // 自由动作类型直接进入预览页面，不需要选择难度
    if (type === 'free') {
      setShowPreview(true);
      return;
    }
    
    if (selectedLevel) {
      const template = getTemplate(type, selectedLevel);
      if (template) {
        const exercises: Exercise[] = template.exercises.map((ex, i) => {
          const libraryItem = getExerciseById(ex.libraryId);
          return {
            id: `ex-${Date.now()}-${i}`,
            name: libraryItem?.name || '未知动作',
            defaultSets: ex.sets,
            defaultReps: ex.reps,
            defaultWeight: 0,
            libraryId: ex.libraryId,
          };
        });
        setEditableExercises(exercises);
      }
      setShowPreview(true);
    }
  };

  /**
   * 处理选择难度级别
   */
  const handleSelectLevel = (level: DifficultyLevel) => {
    setSelectedLevel(level);
    if (selectedType) {
      // 初始化可编辑动作列表
      const template = getTemplate(selectedType, level);
      if (template) {
        const exercises: Exercise[] = template.exercises.map((ex, i) => {
          const libraryItem = getExerciseById(ex.libraryId);
          return {
            id: `ex-${Date.now()}-${i}`,
            name: libraryItem?.name || '未知动作',
            defaultSets: ex.sets,
            defaultReps: ex.reps,
            defaultWeight: 0,
            libraryId: ex.libraryId,
          };
        });
        setEditableExercises(exercises);
      }
      setShowPreview(true);
    }
  };

  /**
   * 处理创建计划
   * 自由动作类型不需要难度级别
   */
  const handleCreatePlan = () => {
    if (!currentUser || !selectedType) return;
    
    // 自由动作类型不需要难度级别
    if (selectedType !== 'free' && !selectedLevel) return;

    const name = planName.trim() || (selectedTemplate?.name || (selectedType === 'free' ? '自由训练' : ''));
    
    // 使用可编辑的动作列表创建计划
    const newPlan = createPlan({
      userId: currentUser.id,
      name: name || '自由训练',
      type: selectedType,
      source: 'template' as const,
      exercises: editableExercises,
      dayOfWeek: selectedDays,
    });

    if (newPlan) {
      navigate('/plans');
    }
  };

  /**
   * 获取训练类型图标
   */
  const getTypeIcon = (type: TrainingType) => {
    switch (type) {
      case 'push':
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'pull':
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'legs':
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
          </svg>
        );
      case 'free':
        return (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        );
    }
  };

  /**
   * 获取难度描述
   */
  const getLevelDescription = (level: DifficultyLevel): string => {
    switch (level) {
      case 'beginner':
        return '适合新手，动作简单，组数适中';
      case 'intermediate':
        return '适合有一定基础，中等强度训练';
      case 'advanced':
        return '适合进阶者，高强度多动作';
    }
  };

  const trainingTypes: TrainingType[] = ['push', 'pull', 'legs'];
  const difficultyLevels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

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
            <h1 className="text-xl font-bold text-[#1C1C1E]">快速创建计划</h1>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${selectedType ? 'text-[#007AFF]' : 'text-[#1C1C1E]'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                  selectedType ? 'bg-[#007AFF] text-white' : 'bg-[#E5E5EA] text-[#8E8E93]'
                }`}
              >
                1
              </div>
              <span className="font-medium text-sm">选择类型</span>
            </div>
            <div className="w-8 h-px bg-[#E5E5EA]" />
            <div className={`flex items-center gap-2 ${selectedLevel ? 'text-[#007AFF]' : 'text-[#8E8E93]'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                  selectedLevel ? 'bg-[#007AFF] text-white' : 'bg-[#E5E5EA] text-[#8E8E93]'
                }`}
              >
                2
              </div>
              <span className="font-medium text-sm">选择难度</span>
            </div>
          </div>
        </div>

        {/* 选择训练类型 */}
        {!showPreview && (
          <section className="mb-8 animate-slide-up">
            <h2 className="text-lg font-bold text-[#1C1C1E] mb-4 px-1">选择训练类型</h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {trainingTypes.map((type, index) => (
                <button
                  key={type}
                  onClick={() => handleSelectType(type)}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 animate-slide-up ${
                    selectedType === type
                      ? `${trainingTypeBorderColors[type]} bg-white shadow-md`
                      : 'border-transparent bg-white shadow-sm hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${trainingTypeIconColors[type]}`}>
                    {getTypeIcon(type)}
                  </div>
                  <h3 className="font-bold text-[#1C1C1E] text-center mb-1">{trainingTypeLabels[type].split(' ')[0]}</h3>
                  <p className="text-xs text-[#8E8E93] text-center">
                    {type === 'push' && '胸 · 肩 · 三头'}
                    {type === 'pull' && '背 · 二头 · 后束'}
                    {type === 'legs' && '腿 · 臀 · 核心'}
                  </p>
                </button>
              ))}
            </div>
            {/* 自由动作卡片 - 单独一行 */}
            <button
              onClick={() => handleSelectType('free')}
              className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 animate-slide-up ${
                selectedType === 'free'
                  ? 'border-[#AF52DE] bg-white shadow-md'
                  : 'border-transparent bg-white shadow-sm hover:shadow-md'
              }`}
              style={{ animationDelay: '150ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#AF52DE]">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[#1C1C1E] text-lg">自由动作</h3>
                  <p className="text-sm text-[#8E8E93]">自定义动作组合</p>
                </div>
              </div>
            </button>
          </section>
        )}

        {/* 选择难度级别 - 自由动作类型不需要选择难度 */}
        {!showPreview && selectedType && selectedType !== 'free' && (
          <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-lg font-bold text-[#1C1C1E] mb-4 px-1">选择难度级别</h2>
            <div className="space-y-3">
              {difficultyLevels.map((level, index) => (
                <button
                  key={level}
                  onClick={() => handleSelectLevel(level)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 animate-slide-up ${
                    selectedLevel === level
                      ? 'border-[#007AFF] bg-blue-50'
                      : 'border-transparent bg-white shadow-sm hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#1C1C1E]">{difficultyLabels[level]}</h3>
                      <p className="text-sm text-[#8E8E93] mt-1">{getLevelDescription(level)}</p>
                    </div>
                    {selectedLevel === level && (
                      <div className="w-6 h-6 rounded-full bg-[#007AFF] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 预览和确认 - 支持自由动作类型 */}
        {showPreview && (selectedTemplate || selectedType === 'free') && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1C1C1E]">计划预览</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedType(null);
                  setSelectedLevel(null);
                  setPlanName('');
                  setEditableExercises([]);
                  setSelectedDays([]);
                }}
                className="text-sm text-[#007AFF] font-medium"
              >
                重新选择
              </button>
            </div>

            {/* 计划名称输入 */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <label className="block text-sm text-[#8E8E93] mb-2">计划名称（可选）</label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={selectedTemplate?.name || '自由训练'}
                className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
              />
            </div>

            {/* 计划信息 */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedType ? trainingTypeIconColors[selectedType] : 'bg-[#AF52DE]'}`}>
                  {selectedType && getTypeIcon(selectedType)}
                </div>
                <div>
                  <h3 className="font-bold text-[#1C1C1E]">{planName.trim() || (selectedTemplate?.name || '自由训练')}</h3>
                  <p className={`text-sm font-medium ${selectedType ? trainingTypeTextColors[selectedType] : 'text-[#AF52DE]'}`}>
                    {selectedType && trainingTypeLabels[selectedType]}
                    {selectedTemplate && ` · ${difficultyLabels[selectedTemplate.level]}`}
                  </p>
                </div>
              </div>

              {/* 动作列表（可编辑） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#8E8E93]">包含 {editableExercises.length} 个动作：</p>
                  <button
                    onClick={() => {
                      setEditingExerciseIndex(editableExercises.length);
                      setShowExercisePicker(true);
                    }}
                    className="text-xs text-[#007AFF] font-medium flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加动作
                  </button>
                </div>
                {editableExercises.map((ex, index) => (
                  <div key={ex.id} className="bg-[#F2F2F7] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-[#8E8E93] font-medium">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => {
                            setEditingExerciseIndex(index);
                            setShowExercisePicker(true);
                          }}
                          className="text-[#1C1C1E] text-sm font-medium text-left hover:text-[#007AFF] transition-colors"
                        >
                          {ex.name}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setEditableExercises(editableExercises.filter((_, i) => i !== index));
                        }}
                        className="text-[#FF3B30] p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pl-9">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={ex.defaultSets ?? 3}
                          onChange={(e) => {
                            const updated = [...editableExercises];
                            updated[index] = { ...updated[index], defaultSets: parseInt(e.target.value) || 3 };
                            setEditableExercises(updated);
                          }}
                          className="w-14 bg-white text-[#1C1C1E] text-sm text-center px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                          min="1"
                          max="10"
                        />
                        <span className="text-xs text-[#8E8E93]">组</span>
                      </div>
                      <span className="text-xs text-[#C7C7CC]">×</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={ex.defaultReps ?? 10}
                          onChange={(e) => {
                            const updated = [...editableExercises];
                            updated[index] = { ...updated[index], defaultReps: parseInt(e.target.value) || 10 };
                            setEditableExercises(updated);
                          }}
                          className="w-14 bg-white text-[#1C1C1E] text-sm text-center px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                          min="1"
                          max="100"
                        />
                        <span className="text-xs text-[#8E8E93]">次</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 选择训练日 */}
              <div className="mt-4 pt-4 border-t border-[#E5E5EA]">
                <p className="text-sm text-[#8E8E93] mb-2">选择训练日（可多选）</p>
                <div className="flex flex-wrap gap-2">
                  {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
                    const dayVal = i === 6 ? 0 : i + 1; // 1=周一...6=周六, 0=周日
                    const isSelected = selectedDays.includes(dayVal);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDays(isSelected ? selectedDays.filter(d => d !== dayVal) : [...selectedDays, dayVal]);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected ? 'bg-[#007AFF] text-white' : 'bg-[#F2F2F7] text-[#8E8E93]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 创建按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                返回修改
              </button>
              <button
                onClick={handleCreatePlan}
                className="flex-1 bg-[#007AFF] text-white font-medium py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
              >
                创建计划
              </button>
            </div>
          </section>
        )}
      </main>

      {/* 动作选择器 */}
      {showExercisePicker && selectedType && editingExerciseIndex !== null && (
        <ExercisePicker
          category={selectedType}
          onSelect={(exercise) => {
            // 如果是添加新动作（index === length），则添加到列表末尾
            if (editingExerciseIndex === editableExercises.length) {
              const newEx: Exercise = {
                id: `ex-${Date.now()}`,
                name: exercise.name,
                defaultSets: 3,
                defaultReps: 10,
                defaultWeight: 0,
                libraryId: exercise.id,
              };
              setEditableExercises([...editableExercises, newEx]);
            } else {
              // 否则编辑现有动作
              const updated = [...editableExercises];
              updated[editingExerciseIndex] = {
                ...updated[editingExerciseIndex],
                name: exercise.name,
                libraryId: exercise.id,
              };
              setEditableExercises(updated);
            }
            setShowExercisePicker(false);
            setEditingExerciseIndex(null);
          }}
          onCancel={() => {
            setShowExercisePicker(false);
            setEditingExerciseIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default QuickCreate;
