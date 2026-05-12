/**
 * @file openaiService.ts
 * @description OpenAI 服务 - 用于优化训练计划和饮食计划
 * 提供 AI 驱动的个性化计划优化建议
 */

import type { UserProfile, WeeklySchedule, MealPlan } from '../types';

/**
 * OpenAI API 配置
 */
interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/**
 * AI 优化结果
 */
interface AIOptimizationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  suggestions?: string[];
}

/**
 * 训练计划优化请求
 */
interface TrainingPlanOptimizationRequest {
  profile: UserProfile;
  currentSchedule: WeeklySchedule;
  feedback?: string; // 用户反馈
  preferences?: {
    focusAreas?: string[]; // 重点训练部位
    avoidExercises?: string[]; // 避免的动作
    preferredExercises?: string[]; // 偏好的动作
  };
}

/**
 * 饮食计划优化请求
 */
interface DietPlanOptimizationRequest {
  profile: UserProfile;
  currentMealPlan: MealPlan;
  restrictions?: string[]; // 饮食限制
  preferences?: string[]; // 饮食偏好
  allergies?: string[]; // 过敏食物
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: OpenAIConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

/**
 * 获取 OpenAI 配置
 */
function getConfig(): OpenAIConfig {
  const stored = localStorage.getItem('openai-config');
  if (stored) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  }
  return DEFAULT_CONFIG;
}

/**
 * 保存 OpenAI 配置
 */
export function saveOpenAIConfig(config: Partial<OpenAIConfig>): void {
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem('openai-config', JSON.stringify(updated));
}

/**
 * 检查是否已配置 OpenAI
 */
export function isOpenAIConfigured(): boolean {
  const config = getConfig();
  return !!config.apiKey;
}

/**
 * 构建训练计划优化 Prompt
 */
function buildTrainingPrompt(request: TrainingPlanOptimizationRequest): string {
  const { profile, currentSchedule, feedback, preferences } = request;
  
  return `你是一位专业的健身教练和训练计划设计师。请根据以下用户信息优化训练计划。

## 用户画像
- 性别: ${profile.gender === 'male' ? '男' : '女'}
- 年龄: ${profile.age} 岁
- 身高: ${profile.height} cm
- 体重: ${profile.currentWeight} kg
- 健身目标: ${getGoalText(profile.goal)}
- 训练经验: ${getExperienceText(profile.experience)}
- 每周训练天数: ${profile.trainingDays} 天
- 可用器械: ${profile.availableEquipment.map(getEquipmentText).join(', ')}
- 活动水平: ${getActivityLevelText(profile.activityLevel)}

## 当前训练计划
${JSON.stringify(currentSchedule, null, 2)}

${feedback ? `## 用户反馈\n${feedback}` : ''}

${preferences?.focusAreas ? `## 重点关注部位\n${preferences.focusAreas.join(', ')}` : ''}

${preferences?.avoidExercises ? `## 需要避免的动作\n${preferences.avoidExercises.join(', ')}` : ''}

## 优化要求
1. 根据用户目标和经验水平调整动作选择
2. 确保训练量适中，避免过度训练
3. 平衡各部位训练，避免肌肉失衡
4. 考虑用户可用器械
5. 提供具体的组数、次数建议
6. 添加训练技巧和注意事项

请返回优化后的训练计划，格式为 JSON：
{
  "optimizedSchedule": {
    "days": [{"day": "周一", "focus": "胸部+三头", "exercises": [{"name": "动作名称", "sets": 4, "reps": "8-12", "notes": "注意事项"}]}]
  },
  "suggestions": ["优化建议1", "优化建议2"],
  "reasoning": "优化理由说明"
}`;
}

/**
 * 构建饮食计划优化 Prompt
 */
function buildDietPrompt(request: DietPlanOptimizationRequest): string {
  const { profile, currentMealPlan, restrictions, preferences, allergies } = request;
  
  return `你是一位专业的营养师。请根据以下用户信息优化饮食计划。

## 用户画像
- 性别: ${profile.gender === 'male' ? '男' : '女'}
- 年龄: ${profile.age} 岁
- 身高: ${profile.height} cm
- 体重: ${profile.currentWeight} kg
- 健身目标: ${getGoalText(profile.goal)}
- 活动水平: ${getActivityLevelText(profile.activityLevel)}

## 当前饮食计划
${JSON.stringify(currentMealPlan, null, 2)}

${restrictions?.length ? `## 饮食限制\n${restrictions.join(', ')}` : ''}

${preferences?.length ? `## 饮食偏好\n${preferences.join(', ')}` : ''}

${allergies?.length ? `## 过敏食物\n${allergies.join(', ')}` : ''}

## 优化要求
1. 确保蛋白质摄入充足，支持肌肉生长/保持
2. 根据训练目标调整碳水比例
3. 选择健康脂肪来源
4. 确保微量营养素充足
5. 考虑餐食的可执行性
6. 提供替代食物选项

请返回优化后的饮食计划，格式为 JSON：
{
  "optimizedMealPlan": {
    "breakfast": [{"food": "食物名称", "amount": "份量", "calories": 300}],
    "lunch": [...],
    "dinner": [...],
    "snack": [...]
  },
  "nutritionSummary": {
    "calories": 2000,
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "suggestions": ["优化建议1", "优化建议2"],
  "alternatives": {"食物A": ["替代选项1", "替代选项2"]}
}`;
}

/**
 * 调用 OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
  const config = getConfig();
  
  if (!config.apiKey) {
    throw new Error('OpenAI API Key 未配置');
  }
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的健身教练和营养师，擅长制定个性化的训练和饮食计划。请提供详细、专业、可执行的建议。'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 错误: ${error}`);
  }
  
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * 优化训练计划
 */
export async function optimizeTrainingPlan(
  request: TrainingPlanOptimizationRequest
): Promise<AIOptimizationResult<WeeklySchedule>> {
  try {
    if (!isOpenAIConfigured()) {
      return {
        success: false,
        error: 'OpenAI 未配置，请先在设置中配置 API Key',
      };
    }
    
    const prompt = buildTrainingPrompt(request);
    const response = await callOpenAI(prompt);
    
    // 解析 JSON 响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: result.optimizedSchedule,
      suggestions: result.suggestions,
    };
  } catch (error) {
    console.error('训练计划优化失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 优化饮食计划
 */
export async function optimizeDietPlan(
  request: DietPlanOptimizationRequest
): Promise<AIOptimizationResult<MealPlan>> {
  try {
    if (!isOpenAIConfigured()) {
      return {
        success: false,
        error: 'OpenAI 未配置，请先在设置中配置 API Key',
      };
    }
    
    const prompt = buildDietPrompt(request);
    const response = await callOpenAI(prompt);
    
    // 解析 JSON 响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: result.optimizedMealPlan,
      suggestions: result.suggestions,
    };
  } catch (error) {
    console.error('饮食计划优化失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 获取训练建议
 */
export async function getTrainingAdvice(
  profile: UserProfile,
  question: string
): Promise<string> {
  try {
    if (!isOpenAIConfigured()) {
      return '请先配置 OpenAI API Key 以使用 AI 建议功能。';
    }
    
    const prompt = `用户问题: ${question}

用户画像:
- 性别: ${profile.gender === 'male' ? '男' : '女'}
- 年龄: ${profile.age} 岁
- 健身目标: ${getGoalText(profile.goal)}
- 训练经验: ${getExperienceText(profile.experience)}

请提供专业的训练建议，回答要简洁实用。`;
    
    return await callOpenAI(prompt);
  } catch (error) {
    console.error('获取训练建议失败:', error);
    return '抱歉，暂时无法获取建议，请稍后重试。';
  }
}

/**
 * 辅助函数：获取目标文本
 */
function getGoalText(goal: string): string {
  const goalMap: Record<string, string> = {
    muscle: '增肌',
    fat_loss: '减脂',
    shape: '塑形',
    maintain: '维持',
  };
  return goalMap[goal] || goal;
}

/**
 * 辅助函数：获取经验文本
 */
function getExperienceText(exp: string): string {
  const expMap: Record<string, string> = {
    beginner: '初级（0-1年）',
    intermediate: '中级（1-3年）',
    advanced: '高级（3年以上）',
  };
  return expMap[exp] || exp;
}

/**
 * 辅助函数：获取器械文本
 */
function getEquipmentText(equipment: string): string {
  const equipmentMap: Record<string, string> = {
    barbell: '杠铃',
    dumbbell: '哑铃',
    cable: '绳索/滑轮',
    machine: '固定器械',
    bodyweight: '自重',
    kettlebell: '壶铃',
  };
  return equipmentMap[equipment] || equipment;
}

/**
 * 辅助函数：获取活动水平文本
 */
function getActivityLevelText(level: string): string {
  const levelMap: Record<string, string> = {
    sedentary: '久坐不动',
    light: '轻度活动',
    moderate: '中度活动',
    active: '高度活动',
    very_active: '极度活跃',
  };
  return levelMap[level] || level;
}

/**
 * 导出类型
 */
export type {
  OpenAIConfig,
  AIOptimizationResult,
  TrainingPlanOptimizationRequest,
  DietPlanOptimizationRequest,
};
