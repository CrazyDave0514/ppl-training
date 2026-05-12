/**
 * 用户画像问卷向导页面 - V1.2.2 重构版
 * @description 3 步骤向导式问卷，滑动条交互，3 秒动画后直接生成
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../store/ProfileContext';
import { useUser } from '../../store/UserContext';
import { usePlan } from '../../store/PlanContext';
import { generateWeeklySchedule, convertScheduleToPlans } from '../../utils/planGenerator';
import type { UserProfile, FitnessGoal, FitnessExperience, BodyPart, Injury, Equipment, TrainingTime, SessionDuration } from '../../types';

// 步骤配置（3 步）
const STEPS = [
  { id: 1, title: '基础信息', description: '让我们了解您的基本情况' },
  { id: 2, title: '健身目标', description: '设定您的健身方向' },
  { id: 3, title: '偏好设置', description: '定制您的训练偏好' },
];

// 选项配置
const GOAL_OPTIONS: { value: FitnessGoal; label: string; icon: string; desc: string }[] = [
  { value: 'muscle', label: '增肌', icon: '💪', desc: '增加肌肉量，提升力量' },
  { value: 'fat_loss', label: '减脂', icon: '🔥', desc: '降低体脂，塑造线条' },
  { value: 'shape', label: '塑形', icon: '✨', desc: '改善体态，紧致身材' },
  { value: 'maintain', label: '维持', icon: '🔄', desc: '保持健康，维持现状' },
];

const EXPERIENCE_OPTIONS: { value: FitnessExperience; label: string; desc: string }[] = [
  { value: 'beginner', label: '新手', desc: '刚开始健身，经验不足6个月' },
  { value: 'intermediate', label: '中级', desc: '有一定基础，经验6个月-2年' },
  { value: 'advanced', label: '高级', desc: '经验丰富，训练超过2年' },
];

const BODY_PART_OPTIONS: { value: BodyPart; label: string }[] = [
  { value: 'chest', label: '胸部' },
  { value: 'back', label: '背部' },
  { value: 'shoulders', label: '肩部' },
  { value: 'arms', label: '手臂' },
  { value: 'legs', label: '腿部' },
  { value: 'core', label: '核心' },
];

const INJURY_OPTIONS: { value: Injury; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'shoulder', label: '肩部' },
  { value: 'lower_back', label: '腰部' },
  { value: 'knee', label: '膝盖' },
  { value: 'wrist', label: '手腕' },
  { value: 'other', label: '其他' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'dumbbell', label: '哑铃' },
  { value: 'barbell', label: '杠铃' },
  { value: 'machine', label: '器械' },
  { value: 'bodyweight', label: '自重' },
  { value: 'band', label: '弹力带' },
  { value: 'cable', label: '绳索' },
  { value: 'kettlebell', label: '壶铃' },
];

const TRAINING_TIME_OPTIONS: { value: TrainingTime; label: string; desc: string }[] = [
  { value: 'morning', label: '早晨', desc: '6:00-9:00' },
  { value: 'forenoon', label: '上午', desc: '9:00-12:00' },
  { value: 'noon', label: '中午', desc: '12:00-14:00' },
  { value: 'afternoon', label: '下午', desc: '14:00-18:00' },
  { value: 'evening', label: '晚间', desc: '18:00-22:00' },
];

/**
 * 滑动条组件 - 移动端优化版
 * 使用 touch 事件实现丝滑拖动体验
 */
const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}> = ({ value, min, max, step, unit, onChange }) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState(value);

  // 同步外部 value 变化
  React.useEffect(() => {
    if (!isDragging) {
      setDisplayValue(value);
    }
  }, [value, isDragging]);

  const calcValueFromX = React.useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + ratio * (max - min);
    const stepped = Math.round(rawValue / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    // 体重保留一位小数
    return step < 1 ? Number(clamped.toFixed(1)) : clamped;
  }, [min, max, step, value]);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const touch = e.touches[0];
    const newValue = calcValueFromX(touch.clientX);
    setDisplayValue(newValue);
    onChange(newValue);
  }, [calcValueFromX, onChange]);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const newValue = calcValueFromX(touch.clientX);
    setDisplayValue(newValue);
    onChange(newValue);
  }, [calcValueFromX, onChange]);

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newValue = calcValueFromX(e.clientX);
    setDisplayValue(newValue);
    onChange(newValue);

    const handleMouseMove = (ev: MouseEvent) => {
      const newValue = calcValueFromX(ev.clientX);
      setDisplayValue(newValue);
      onChange(newValue);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [calcValueFromX, onChange]);

  const percentage = ((displayValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#8E8E93]">{min}{unit}</span>
        <span className="text-2xl font-bold text-[#007AFF]">{displayValue}<span className="text-sm font-normal">{unit}</span></span>
        <span className="text-sm text-[#8E8E93]">{max}{unit}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-2 bg-[#E5E5EA] rounded-full select-none"
        style={{ touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* 进度条 */}
        <div
          className="absolute h-2 bg-[#007AFF] rounded-full pointer-events-none"
          style={{ width: `${percentage}%` }}
        />
        {/* 滑块 - 扩大触控热区 */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none ${
            isDragging ? 'w-8 h-8 -mt-1 shadow-lg scale-110' : 'w-7 h-7 -mt-0.5 shadow-md'
          } bg-white border-[3px] border-[#007AFF] rounded-full`}
          style={{
            left: `${percentage}%`,
            transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        />
        {/* 隐形扩大触控区域 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 -mt-5"
          style={{ left: `${percentage}%`, touchAction: 'none' }}
        />
      </div>
    </div>
  );
};

/**
 * 生成动画组件
 */
const GeneratingAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  
  React.useEffect(() => {
    const duration = 3000; // 3 秒
    const interval = 50; // 每 50ms 更新
    const step = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return next;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 border-4 border-[#E5E5EA] rounded-full" />
        <div 
          className="absolute inset-0 border-4 border-[#007AFF] rounded-full transition-all"
          style={{ 
            clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`,
            transform: 'rotate(-90deg)',
            transformOrigin: 'center'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">💪</span>
        </div>
      </div>
      <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">正在生成您的专属计划</h2>
      <p className="text-[#8E8E93] mb-6">根据您的身体数据和健身目标...</p>
      <div className="w-64 h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#007AFF] rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 text-sm text-[#8E8E93]">{Math.round(progress)}%</p>
    </div>
  );
};

const ProfileWizard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { profile, saveProfile } = useProfile();
  const { createPlan } = usePlan();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 表单数据（优先使用已有数据，否则使用默认值）
  const [formData, setFormData] = useState<Partial<UserProfile>>(() => {
    if (profile) {
      return { ...profile };
    }
    return {
      gender: 'male',
      age: 25,
      height: 170,
      currentWeight: 65,
      targetWeight: 65,
      goals: [], // 健身目标：默认无选择（改为数组）
      experience: undefined, // 训练经验：默认无选择
      trainingDays: 4,
      trainingDuration: 60,
      preferredBodyParts: [], // 身体部位偏好：默认无选择
      injuries: [], // 伤病情况：默认无选择
      availableEquipment: [], // 可用器械：默认无选择（修改：之前是 ['dumbbell', 'bodyweight']）
      trainingTime: undefined, // 训练时间：默认无选择
    };
  });

  const updateField = useCallback(<K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleMultiSelect = useCallback(<T extends string>(field: keyof UserProfile, value: T, current: T[]) => {
    const exists = current.includes(value);
    if (exists) {
      updateField(field, current.filter(v => v !== value) as UserProfile[typeof field]);
    } else {
      updateField(field, [...current, value] as UserProfile[typeof field]);
    }
  }, [updateField]);

  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!(formData.gender && formData.age && formData.height && formData.currentWeight);
      case 2:
        // Step 2: 健身目标（多选）、经验、天数、时长
        return !!(formData.goals?.length && formData.experience && formData.trainingDays && formData.trainingDuration);
      case 3:
        // Step 3 需要 4 个配置都有值：身体部位、伤病情况、可用器械、训练时间
        return !!(
          formData.preferredBodyParts?.length &&
          formData.injuries?.length &&
          formData.availableEquipment?.length &&
          formData.trainingTime
        );
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      // 第 3 步完成后直接开始生成
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleReturn = () => {
    navigate(-1);
  };

  /**
   * 检查表单数据是否有实质性变化（影响训练计划的变化）
   */
  const hasSignificantChanges = () => {
    if (!profile) return false;
    // 检查影响训练计划的关键字段
    const keyFields: (keyof UserProfile)[] = [
      'goals', 'experience', 'trainingDays', 'trainingDuration',
      'availableEquipment', 'injuries', 'trainingTime'
    ];
    return keyFields.some(field => {
      const oldVal = profile[field];
      const newVal = formData[field];
      if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        return JSON.stringify(oldVal.sort()) !== JSON.stringify(newVal.sort());
      }
      return oldVal !== newVal;
    });
  };

  /**
   * 处理生成计划按钮点击
   */
  const handleGenerate = () => {
    if (!currentUser) {
      alert('请先登录');
      return;
    }
    
    // 如果是编辑模式且有实质性变化，提示用户
    if (profile && hasSignificantChanges()) {
      const confirmed = window.confirm(
        '修改健身档案将会重新生成训练计划，当前计划将被替换。\n\n是否确认调整健身档案？'
      );
      if (!confirmed) {
        return;
      }
    }
    
    setIsGenerating(true);
  };

  /**
   * 生成动画完成后的回调 - 保存画像并生成训练计划
   */
  const handleGenerateComplete = () => {
    if (!currentUser) {
      console.error('[ProfileWizard] currentUser is null');
      return;
    }

    // 保存画像
    const profileData = {
      ...formData,
      id: currentUser.id,
      completedAt: new Date().toISOString(),
    } as UserProfile;
    saveProfile(profileData);
    console.log('[ProfileWizard] Profile saved:', profileData);

    // 生成周计划
    try {
      const schedule = generateWeeklySchedule(profileData);
      console.log('[ProfileWizard] Schedule generated:', schedule);
      console.log('[ProfileWizard] Days count:', schedule.days.length);
      console.log('[ProfileWizard] Exercises per day:', schedule.days.map(d => d.exercises.length));

      // 转换为 TrainingPlan 数组并逐个保存
      const plans = convertScheduleToPlans(schedule, currentUser.id);
      console.log('[ProfileWizard] Plans to create:', plans.length);
      console.log('[ProfileWizard] First plan exercises:', plans[0]?.exercises);

      plans.forEach((plan, i) => {
        console.log(`[ProfileWizard] Creating plan ${i + 1}:`, plan.name, 'exercises:', plan.exercises.length);
        createPlan({
          userId: plan.userId,
          name: plan.name,
          type: plan.type,
          source: plan.source,
          exercises: plan.exercises,
          dayOfWeek: plan.dayOfWeek,
        });
      });

      console.log('[ProfileWizard] All plans created, navigating to /plans');
    } catch (error) {
      console.error('[ProfileWizard] Error generating schedule:', error);
    }

    // 跳转到计划页
    navigate('/plans');
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step.id < currentStep
                  ? 'bg-[#34C759] text-white'
                  : step.id === currentStep
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-[#F2F2F7] text-[#8E8E93]'
              }`}
            >
              {step.id < currentStep ? '✓' : step.id}
            </div>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-1 ${
                step.id < currentStep ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // 渲染步骤 1：基础信息（滑动条）
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* 性别选择 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">性别</label>
        <div className="flex gap-4">
          {['male', 'female'].map((gender) => (
            <button
              key={gender}
              onClick={() => updateField('gender', gender as 'male' | 'female')}
              className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                formData.gender === gender
                  ? 'border-[#007AFF] bg-[#007AFF]/5'
                  : 'border-[#E5E5EA] bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">{gender === 'male' ? '👨' : '👩'}</span>
              <span className="text-[#1C1C1E] font-medium">{gender === 'male' ? '男' : '女'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 年龄滑动条 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">年龄</label>
        <Slider
          value={formData.age || 25}
          min={18}
          max={80}
          step={1}
          unit="岁"
          onChange={(v) => updateField('age', v)}
        />
      </div>

      {/* 身高滑动条 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">身高</label>
        <Slider
          value={formData.height || 170}
          min={140}
          max={220}
          step={1}
          unit="cm"
          onChange={(v) => updateField('height', v)}
        />
      </div>

      {/* 当前体重滑动条 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">当前体重</label>
        <Slider
          value={formData.currentWeight || 65}
          min={30}
          max={150}
          step={0.5}
          unit="kg"
          onChange={(v) => updateField('currentWeight', v)}
        />
      </div>

      {/* 目标体重滑动条（可选） */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">
          目标体重 <span className="text-[#8E8E93] font-normal">（可选）</span>
        </label>
        <Slider
          value={formData.targetWeight || formData.currentWeight || 65}
          min={30}
          max={150}
          step={0.5}
          unit="kg"
          onChange={(v) => updateField('targetWeight', v)}
        />
      </div>
    </div>
  );

  // 渲染步骤 2：健身目标（滑动条）
  /**
   * 处理健身目标多选
   * 规则：'maintain'（维持）独占，不可与其他同时选择
   */
  const toggleGoal = (value: FitnessGoal) => {
    const current = formData.goals || [];
    const exists = current.includes(value);
    
    if (value === 'maintain') {
      // 点击"维持"：如果已选则取消，否则只选"维持"
      updateField('goals', exists ? [] : ['maintain']);
    } else {
      // 点击其他目标：如果已选则取消，否则添加（同时移除"维持"）
      if (exists) {
        updateField('goals', current.filter(g => g !== value));
      } else {
        updateField('goals', [...current.filter(g => g !== 'maintain'), value]);
      }
    }
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">健身目标（可多选）</label>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_OPTIONS.map((option) => {
            const isSelected = (formData.goals || []).includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => toggleGoal(option.value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#007AFF] bg-[#007AFF]/5'
                    : 'border-[#E5E5EA] bg-white'
                }`}
              >
                <span className="text-2xl mb-2 block">{option.icon}</span>
                <div className="font-semibold text-[#1C1C1E]">{option.label}</div>
                <div className="text-xs text-[#8E8E93] mt-1">{option.desc}</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#8E8E93] mt-2">* "维持"不可与其他目标同时选择</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">训练经验</label>
        <div className="space-y-2">
          {EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateField('experience', option.value)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                formData.experience === option.value
                  ? 'border-[#007AFF] bg-[#007AFF]/5'
                  : 'border-[#E5E5EA] bg-white'
              }`}
            >
              <div className="font-semibold text-[#1C1C1E]">{option.label}</div>
              <div className="text-sm text-[#8E8E93]">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 每周训练天数滑动条 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">每周训练天数</label>
        <Slider
          value={formData.trainingDays || 4}
          min={2}
          max={7}
          step={1}
          unit="天"
          onChange={(v) => updateField('trainingDays', v as 2 | 3 | 4 | 5 | 6 | 7)}
        />
      </div>

      {/* 每次训练时长滑动条 */}
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-3">每次训练时长</label>
        <Slider
          value={formData.trainingDuration || 60}
          min={30}
          max={120}
          step={10}
          unit="分钟"
          onChange={(v) => updateField('trainingDuration', v as SessionDuration)}
        />
      </div>
    </div>
  );

  // 渲染步骤 3：偏好设置
  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
          身体部位偏好 <span className="text-[#8E8E93] font-normal">（可多选）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BODY_PART_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleMultiSelect('preferredBodyParts', option.value, formData.preferredBodyParts || [])}
              className={`px-4 py-2 rounded-xl border-2 transition-all ${
                formData.preferredBodyParts?.includes(option.value)
                  ? 'border-[#007AFF] bg-[#007AFF] text-white'
                  : 'border-[#E5E5EA] bg-white text-[#1C1C1E]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-2">伤病情况</label>
        <div className="flex flex-wrap gap-2">
          {INJURY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (option.value === 'none') {
                  updateField('injuries', ['none']);
                } else {
                  const current = formData.injuries?.filter(i => i !== 'none') || [];
                  toggleMultiSelect('injuries', option.value, current);
                }
              }}
              className={`px-4 py-2 rounded-xl border-2 transition-all ${
                formData.injuries?.includes(option.value)
                  ? option.value === 'none'
                    ? 'border-[#34C759] bg-[#34C759] text-white'
                    : 'border-[#FF3B30] bg-[#FF3B30] text-white'
                  : 'border-[#E5E5EA] bg-white text-[#1C1C1E]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
          可用器械 <span className="text-[#8E8E93] font-normal">（可多选）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleMultiSelect('availableEquipment', option.value, formData.availableEquipment || [])}
              className={`px-4 py-2 rounded-xl border-2 transition-all ${
                formData.availableEquipment?.includes(option.value)
                  ? 'border-[#007AFF] bg-[#007AFF] text-white'
                  : 'border-[#E5E5EA] bg-white text-[#1C1C1E]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1C1C1E] mb-2">主要训练时间</label>
        <div className="grid grid-cols-3 gap-2">
          {TRAINING_TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateField('trainingTime', option.value)}
              className={`p-3 rounded-2xl border-2 text-center transition-all ${
                formData.trainingTime === option.value
                  ? 'border-[#007AFF] bg-[#007AFF]/5'
                  : 'border-[#E5E5EA] bg-white'
              }`}
            >
              <div className="font-semibold text-[#1C1C1E]">{option.label}</div>
              <div className="text-xs text-[#8E8E93] mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-8">
      {/* 生成动画 */}
      {isGenerating && <GeneratingAnimation onComplete={handleGenerateComplete} />}
      
      {/* 头部 */}
      <div className="bg-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleReturn}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F2F2F7] text-[#007AFF] transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-[#1C1C1E]">{STEPS[currentStep - 1].title}</h1>
            <p className="text-xs text-[#8E8E93]">{STEPS[currentStep - 1].description}</p>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="bg-white pb-4">
        <div className="max-w-md mx-auto px-4">
          {renderStepIndicator()}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="max-w-md mx-auto px-4 mt-6">
        {renderStepContent()}
      </div>

      {/* 底部按钮 */}
      <div className="max-w-md mx-auto px-4 mt-8">
        <div className="flex gap-4">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-4 rounded-2xl bg-[#F2F2F7] text-[#1C1C1E] font-semibold"
            >
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            className={`flex-1 py-4 rounded-2xl font-semibold transition-colors ${
              isStepValid()
                ? 'bg-[#007AFF] text-white'
                : 'bg-[#E5E5EA] text-[#8E8E93]'
            }`}
          >
            {currentStep === 3 ? '生成我的计划' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileWizard;
