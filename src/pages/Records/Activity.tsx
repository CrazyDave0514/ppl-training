/**
 * 运动记录子组件
 * @description 展示训练记录列表 + 运动热力图，支持删除记录
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../store/UserContext';
import { getSessionsByUser, deleteSession } from '../../utils/storage';
import type { TrainingSession } from '../../types';

/**
 * 训练类型配置
 */
const typeConfig: Record<string, { label: string; color: string }> = {
  push: { label: 'Push', color: 'bg-blue-100 text-blue-700' },
  pull: { label: 'Pull', color: 'bg-green-100 text-green-700' },
  legs: { label: 'Legs', color: 'bg-orange-100 text-orange-700' },
};

/**
 * 计算训练总容量
 * @param session - 训练记录
 * @returns 总容量（kg）
 */
const calcTotalVolume = (session: TrainingSession): number => {
  return session.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, set) => setTotal + set.weight * set.reps, 0);
  }, 0);
};

/**
 * 热力图颜色配置
 */
const heatColors = {
  none: '#E5E5EA',
  low: '#B4D6FA',
  mid: '#5AAFFF',
  high: '#007AFF',
};

/**
 * 获取训练容量对应的颜色
 * @param volume - 训练容量
 * @returns 对应的颜色值
 */
const getHeatColor = (volume: number): string => {
  if (volume === 0) return heatColors.none;
  if (volume < 1000) return heatColors.low;
  if (volume <= 3000) return heatColors.mid;
  return heatColors.high;
};

/**
 * 热力图组件
 * @param sessions - 训练记录列表
 */
const Heatmap: React.FC<{ sessions: TrainingSession[] }> = ({ sessions }) => {
  const heatmapData = useMemo(() => {
    // 计算最近 12 周（84 天）的数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 找到 12 周前的周一
    const totalDays = 84;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // 调整到周一
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // 构建日期到容量的映射
    const volumeMap: Record<string, number> = {};
    sessions.forEach(s => {
      if (volumeMap[s.date]) {
        volumeMap[s.date] += calcTotalVolume(s);
      } else {
        volumeMap[s.date] = calcTotalVolume(s);
      }
    });

    // 生成网格数据：7 行（周一到周日）× N 列
    const weeks: { date: string; volume: number; day: number }[][] = [];
    let currentWeek: { date: string; volume: number; day: number }[] = [];
    let current = new Date(startDate);

    while (current <= today || currentWeek.length > 0) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeekNum = current.getDay();
      const adjustedDay = dayOfWeekNum === 0 ? 6 : dayOfWeekNum - 1; // 周一=0, 周日=6

      if (adjustedDay === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      if (current <= today) {
        currentWeek.push({
          date: dateStr,
          volume: volumeMap[dateStr] || 0,
          day: adjustedDay,
        });
      } else {
        currentWeek.push({ date: '', volume: 0, day: adjustedDay });
      }

      current.setDate(current.getDate() + 1);

      if (current > today && adjustedDay === 6) {
        weeks.push(currentWeek);
        break;
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // 统计
    const totalSessions = sessions.length;
    const activeDays = Object.keys(volumeMap).length;

    // 月份标签
    const monthLabels: { label: string; colIndex: number }[] = [];
    weeks.forEach((week, colIndex) => {
      const firstDay = week.find(d => d.date);
      if (firstDay && firstDay.date) {
        const month = parseInt(firstDay.date.split('-')[1]);
        const label = `${month}月`;
        if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== label) {
          monthLabels.push({ label, colIndex });
        }
      }
    });

    return { weeks, totalSessions, activeDays, monthLabels };
  }, [sessions]);

  const { weeks, totalSessions, activeDays, monthLabels } = heatmapData;

  return (
    <div className="bg-white rounded-2xl p-4 mb-4">
      {/* 统计 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-[#1C1C1E]">{totalSessions}</p>
          <p className="text-xs text-[#8E8E93]">总训练次数</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#1C1C1E]">{activeDays}</p>
          <p className="text-xs text-[#8E8E93]">训练天数</p>
        </div>
      </div>

      {/* 热力图网格 */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="inline-block min-w-full">
          {/* 月份标签 */}
          <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="text-[10px] text-[#8E8E93]"
                style={{
                  width: '14px',
                  marginLeft: i === 0 ? `${m.colIndex * 16}px` : `${(m.colIndex - monthLabels[i - 1].colIndex) * 16}px`,
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* 星期标签 + 网格 */}
          <div className="flex gap-0">
            {/* 星期标签 */}
            <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0" style={{ width: '24px' }}>
              {['一', '', '三', '', '五', '', '日'].map((label, i) => (
                <div
                  key={i}
                  className="text-[10px] text-[#8E8E93] flex items-center justify-end"
                  style={{ height: '14px', lineHeight: '14px' }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 网格 */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="rounded-[3px]"
                      style={{
                        width: '14px',
                        height: '14px',
                        backgroundColor: day.date ? getHeatColor(day.volume) : 'transparent',
                      }}
                      title={day.date ? `${day.date}: ${day.volume}kg` : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[10px] text-[#8E8E93]">少</span>
        {[heatColors.none, heatColors.low, heatColors.mid, heatColors.high].map((color, i) => (
          <div
            key={i}
            className="rounded-[2px]"
            style={{ width: '10px', height: '10px', backgroundColor: color }}
          />
        ))}
        <span className="text-[10px] text-[#8E8E93]">多</span>
      </div>
    </div>
  );
};

/**
 * 运动记录组件
 * @description 展示训练记录列表 + 运动热力图，未登录时显示空状态引导
 */
const Activity: React.FC = () => {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * 处理 FAB 按钮或"开始训练"按钮点击
   * @description 未登录时提示登录，已登录时跳转到开始训练页面
   */
  const handleFabClick = () => {
    if (!currentUser) {
      alert('请先登录后再操作');
      return;
    }
    navigate('/training');
  };

  /**
   * 处理删除训练记录
   * @description 弹出确认提示后删除指定记录并刷新列表
   * @param e - 点击事件（阻止冒泡，避免触发卡片跳转）
   * @param sessionId - 要删除的记录 ID
   */
  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // 阻止冒泡，避免触发卡片的 onClick 跳转
    const confirmed = window.confirm('确定要删除这条训练记录吗？此操作不可恢复。');
    if (confirmed) {
      deleteSession(currentUser!.id, sessionId);
      setRefreshKey((prev) => prev + 1); // 触发重新渲染以刷新列表
    }
  };

  // 未登录时显示空状态引导
  if (!currentUser) {
    return (
      <div className="relative">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-[#8E8E93] text-sm mb-4">请先登录查看训练记录</p>
          <button
            onClick={handleFabClick}
            className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            登录
          </button>
        </div>
        {/* 浮动添加按钮 */}
        <button
          onClick={handleFabClick}
          className="fixed bottom-24 right-5 w-16 h-16 bg-[#007AFF] rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-10 safe-area-bottom"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  // 使用 refreshKey 确保删除后重新获取数据
  const displaySessions = useMemo(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return getSessionsByUser(currentUser.id);
  }, [currentUser.id, refreshKey]);

  if (displaySessions.length === 0) {
    return (
      <div className="relative">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-[#8E8E93] text-sm mb-4">还没有训练记录</p>
          <button
            onClick={handleFabClick}
            className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            记录运动数据
          </button>
        </div>
        {/* 浮动添加按钮 */}
        <button
          onClick={handleFabClick}
          className="fixed bottom-24 right-5 w-16 h-16 bg-[#007AFF] rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-10 safe-area-bottom"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 热力图 */}
      <Heatmap sessions={displaySessions} />

      {/* 训练记录列表 */}
      <div className="space-y-3">
        {displaySessions.map((session) => {
          const config = typeConfig[session.type] || typeConfig.push;
          const totalVolume = calcTotalVolume(session);
          const totalSets = session.exercises.reduce((t, e) => t + e.sets.length, 0);

          return (
            <div
              key={session.id}
              onClick={() => navigate(`/session/${session.id}`)}
              className="w-full bg-white rounded-2xl p-4 text-left active:bg-[#F2F2F7] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1C1C1E]">{session.planName}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => handleDelete(e, session.id)}
                    className="text-[#FF3B30] text-xs px-2 py-0.5 rounded-lg active:bg-red-50 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8E8E93]">{session.date}</span>
                <div className="flex items-center gap-3 text-xs text-[#8E8E93]">
                  <span>{session.exercises.length} 动作</span>
                  <span>{totalSets} 组</span>
                  <span>{totalVolume.toLocaleString()} kg</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 浮动添加按钮 */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-24 right-5 w-16 h-16 bg-[#007AFF] rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-10 safe-area-bottom"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default Activity;
