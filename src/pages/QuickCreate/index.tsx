/**
 * 快速创建页面
 * @description Apple Health 风格选择训练类型和难度级别，从模板生成计划
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import type { TrainingType, DifficultyLevel } from '../../types';
import {
  getTemplate,
  difficultyLabels,
  trainingTypeLabels,
  trainingTypeIconColors,
  trainingTypeTextColors,
  trainingTypeBorderColors,
} from '../../data/planTemplates';
import { getExerciseById } from '../../data/exerciseLibrary';

/**
 * 快速创建页面组件
 */
const QuickCreate: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { createPlanFromTemplate } = usePlan();
  const [selectedType, setSelectedType] = useState<TrainingType | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [planName, setPlanName] = useState('');

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
   */
  const handleSelectType = (type: TrainingType) => {
    setSelectedType(type);
    if (selectedLevel) {
      setShowPreview(true);
    }
  };

  /**
   * 处理选择难度级别
   */
  const handleSelectLevel = (level: DifficultyLevel) => {
    setSelectedLevel(level);
    if (selectedType) {
      setShowPreview(true);
    }
  };

  /**
   * 处理创建计划
   */
  const handleCreatePlan = () => {
    if (!selectedTemplate || !currentUser || !selectedType || !selectedLevel) return;

    const name = planName.trim() || selectedTemplate.name;
    const newPlan = createPlanFromTemplate(name, selectedType, selectedLevel);

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
            <div className="grid grid-cols-3 gap-3">
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
          </section>
        )}

        {/* 选择难度级别 */}
        {!showPreview && selectedType && (
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

        {/* 预览和确认 */}
        {showPreview && selectedTemplate && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1C1C1E]">计划预览</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedType(null);
                  setSelectedLevel(null);
                  setPlanName('');
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
                placeholder={selectedTemplate.name}
                className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
              />
            </div>

            {/* 计划信息 */}
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trainingTypeIconColors[selectedTemplate.type]}`}>
                  {getTypeIcon(selectedTemplate.type)}
                </div>
                <div>
                  <h3 className="font-bold text-[#1C1C1E]">{planName.trim() || selectedTemplate.name}</h3>
                  <p className={`text-sm font-medium ${trainingTypeTextColors[selectedTemplate.type]}`}>
                    {trainingTypeLabels[selectedTemplate.type]} · {difficultyLabels[selectedTemplate.level]}
                  </p>
                </div>
              </div>

              {/* 动作列表 */}
              <div className="space-y-2">
                <p className="text-sm text-[#8E8E93] mb-2">包含 {selectedTemplate.exercises.length} 个动作：</p>
                {selectedTemplate.exercises.map((ex, index) => {
                  const libraryItem = getExerciseById(ex.libraryId);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-[#F2F2F7] rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs text-[#8E8E93] font-medium">
                          {index + 1}
                        </span>
                        <span className="text-[#1C1C1E]">{libraryItem?.name || '未知动作'}</span>
                      </div>
                      <span className="text-sm text-[#8E8E93]">{ex.sets} 组 × {ex.reps} 次</span>
                    </div>
                  );
                })}
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
    </div>
  );
};

export default QuickCreate;
