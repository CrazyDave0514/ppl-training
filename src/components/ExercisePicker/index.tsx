/**
 * 动作选择器组件
 * @description Apple Health 风格从动作库中选择动作，支持搜索和自定义添加
 */

import React, { useState, useMemo } from 'react';
import { getExercisesByCategory, searchExercises } from '../../data/exerciseLibrary';
import type { TrainingType, ExerciseLibraryItem } from '../../types';

/**
 * 动作选择器 Props
 */
interface ExercisePickerProps {
  category: TrainingType;
  onSelect: (exercise: { id: string; name: string; category: string }) => void;
  onCancel: () => void;
}

/**
 * 动作选择器组件
 * @param category - 训练类型
 * @param onSelect - 选择回调
 * @param onCancel - 取消回调
 */
const ExercisePicker: React.FC<ExercisePickerProps> = ({ category, onSelect, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');

  /**
   * 获取当前分类的动作列表
   */
  const categoryExercises = useMemo(() => getExercisesByCategory(category), [category]);

  /**
   * 过滤后的动作列表
   */
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryExercises;
    }
    return searchExercises(searchQuery).filter((ex) => ex.category === category);
  }, [categoryExercises, searchQuery, category]);

  /**
   * 处理选择动作
   */
  const handleSelect = (exercise: ExerciseLibraryItem) => {
    onSelect({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
    });
  };

  /**
   * 处理添加自定义动作
   */
  const handleAddCustom = () => {
    if (customExerciseName.trim()) {
      onSelect({
        id: `custom-${Date.now()}`,
        name: customExerciseName.trim(),
        category,
      });
      setCustomExerciseName('');
      setShowCustomInput(false);
    }
  };

  /**
   * 获取分类图标
   */
  const getCategoryIcon = () => {
    switch (category) {
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
    }
  };

  /**
   * 获取分类颜色
   */
  const getCategoryColor = () => {
    switch (category) {
      case 'push':
        return 'bg-[#FF3B30]';
      case 'pull':
        return 'bg-[#007AFF]';
      case 'legs':
        return 'bg-[#34C759]';
    }
  };

  /**
   * 获取分类名称
   */
  const getCategoryName = () => {
    switch (category) {
      case 'push':
        return 'Push (推)';
      case 'pull':
        return 'Pull (拉)';
      case 'legs':
        return 'Legs (腿)';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50 animate-fade-in" onClick={onCancel}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="border-b border-[#E5E5EA] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryColor()}`}>
                {getCategoryIcon()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1C1C1E]">选择动作</h2>
                <p className="text-sm text-[#8E8E93]">{getCategoryName()}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] text-[#8E8E93] transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8E93]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索动作..."
              className="w-full bg-[#F2F2F7] text-[#1C1C1E] pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 动作列表 */}
        <div className="overflow-y-auto max-h-[50vh] p-4">
          {filteredExercises.length > 0 ? (
            <div className="space-y-2">
              {filteredExercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="w-full p-4 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-xl text-left transition-all duration-200 active:scale-[0.98] animate-fade-in"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#1C1C1E]">{exercise.name}</h3>
                      <p className="text-sm text-[#8E8E93]">{exercise.targetMuscles.join('、')}</p>
                    </div>
                    <svg className="w-5 h-5 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#F2F2F7] rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-[#8E8E93] mb-2">没有找到匹配的动作</p>
              <p className="text-sm text-[#8E8E93]">尝试其他关键词或添加自定义动作</p>
            </div>
          )}
        </div>

        {/* 自定义动作 */}
        <div className="border-t border-[#E5E5EA] p-4">
          {showCustomInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                placeholder="输入动作名称"
                className="w-full bg-[#F2F2F7] text-[#1C1C1E] px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomExerciseName('');
                  }}
                  className="flex-1 bg-[#F2F2F7] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCustom}
                  disabled={!customExerciseName.trim()}
                  className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              添加自定义动作
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisePicker;
