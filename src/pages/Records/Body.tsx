/**
 * 身体数据子组件
 * @description 体重折线图 + BMI/体脂数据卡片 + 身体记录列表
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useUser } from '../../store/UserContext';
import { getBodyRecordsByUser, addBodyRecord, updateBodyRecord, deleteBodyRecord } from '../../utils/storage';
import { calcBMI } from '../../utils/imageUtils';
import type { BodyRecord } from '../../types';

/**
 * 体重折线图组件
 * @description SVG 折线图，支持横向滑动，每屏 7 天
 */
const WeightChart: React.FC<{
  records: BodyRecord[];
  onSelectDate?: (date: string) => void;
}> = ({ records, onSelectDate }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 最近 30 天数据（缺失日期自动继承前一天的有效值，保证折线连续）
  const chartData = useMemo(() => {
    if (records.length === 0) return [];

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // 构建日期到体重的映射
    const weightMap: Record<string, number> = {};
    records.forEach(r => {
      weightMap[r.date] = r.weight;
    });

    // 生成最近 30 天的数据点，缺失日期继承前一天值
    const data: { date: string; weight: number | null; label: string }[] = [];
    const current = new Date(thirtyDaysAgo);
    let lastWeight: number | null = null;
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0];
      const month = current.getMonth() + 1;
      const day = current.getDate();
      const weight = weightMap[dateStr] ?? lastWeight;
      data.push({
        date: dateStr,
        weight,
        label: `${month}/${day}`,
      });
      if (weight !== null) lastWeight = weight;
      current.setDate(current.getDate() + 1);
    }

    return data;
  }, [records]);

  // 默认选中最后一天，并通知父组件
  useEffect(() => {
    if (chartData.length > 0) {
      const lastIndex = chartData.length - 1;
      setActiveIndex(lastIndex);
      onSelectDate?.(chartData[lastIndex].date);
    }
  }, [chartData]);

  // 计算图表尺寸（需要在 hooks 之前，因为 useEffect 依赖这些值）
  const visibleCount = 7;
  const totalWidth = chartData.length > 0 ? chartData.length * 48 : 0;
  const svgWidth = visibleCount * 48;

  // 自动滚动到最新数据
  useEffect(() => {
    if (chartRef.current && chartData.length > 0) {
      const maxScroll = totalWidth - svgWidth;
      chartRef.current.scrollLeft = maxScroll > 0 ? maxScroll : 0;
    }
  }, [totalWidth, svgWidth, chartData.length]);

  // 无数据时不渲染图表（在所有 hooks 之后）
  if (chartData.length === 0) return null;

  const svgHeight = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 10 };

  // 计算 Y 轴范围
  const weights = chartData.map(d => d.weight).filter((w): w is number => w !== null);
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights)) - 2 : 50;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights)) + 2 : 100;
  const yRange = maxWeight - minWeight;

  const getY = (weight: number) => {
    return padding.top + ((maxWeight - weight) / yRange) * (svgHeight - padding.top - padding.bottom);
  };

  const getX = (index: number) => {
    return padding.left + index * 48 + 24;
  };

  // 生成折线路径
  const linePath = chartData
    .map((d, i) => {
      if (d.weight === null) return null;
      return `${i === 0 || chartData[i - 1]?.weight === null ? 'M' : 'L'} ${getX(i)} ${getY(d.weight)}`;
    })
    .filter(Boolean)
    .join(' ');

  // 生成填充路径
  const fillPath = (() => {
    const points: string[] = [];
    let started = false;
    chartData.forEach((d, i) => {
      if (d.weight === null) {
        if (started) {
          points.push(`L ${getX(i - 1)} ${svgHeight - padding.bottom}`);
          started = false;
        }
        return;
      }
      if (!started) {
        points.push(`M ${getX(i)} ${svgHeight - padding.bottom}`);
        points.push(`L ${getX(i)} ${getY(d.weight)}`);
        started = true;
      } else {
        points.push(`L ${getX(i)} ${getY(d.weight)}`);
      }
    });
    if (started) {
      const lastValid = chartData.map((d, i) => ({ d, i })).filter(x => x.d.weight !== null).pop();
      if (lastValid) {
        points.push(`L ${getX(lastValid.i)} ${svgHeight - padding.bottom}`);
      }
    }
    return points.join(' ');
  })();

  const activeRecord = chartData[activeIndex];

  return (
    <div className="bg-white rounded-2xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[#1C1C1E]">体重趋势</h3>
        {activeRecord && activeRecord.weight !== null && (
          <span className="text-xs text-[#8E8E93]">{activeRecord.label}</span>
        )}
      </div>

      <div
        ref={chartRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <svg width={totalWidth} height={svgHeight} viewBox={`0 0 ${totalWidth} ${svgHeight}`}>
          {/* Y 轴参考线 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + ratio * (svgHeight - padding.top - padding.bottom);
            const weight = maxWeight - ratio * yRange;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={totalWidth - padding.right}
                  y2={y}
                  stroke="#E5E5EA"
                  strokeWidth={0.5}
                  strokeDasharray={i === 0 || i === 4 ? '0' : '4,4'}
                />
                <text
                  x={padding.left - 2}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px]"
                  fill="#8E8E93"
                  style={{ fontSize: '9px' }}
                >
                  {weight.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* 渐变填充 */}
          {fillPath && (
            <path
              d={fillPath}
              fill="url(#blueGradient)"
              opacity={0.3}
            />
          )}

          {/* 折线 */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#007AFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 数据点 */}
          {chartData.map((d, i) => {
            if (d.weight === null) return null;
            const isActive = i === activeIndex;
            return (
              <g key={i}>
                {/* 选中数据点上方显示体重 */}
                {isActive && (
                  <text
                    x={getX(i)}
                    y={getY(d.weight) - 12}
                    textAnchor="middle"
                    className="text-[10px]"
                    fill="#007AFF"
                    fontWeight="bold"
                    style={{ fontSize: '10px' }}
                  >
                    {d.weight}
                  </text>
                )}
                <circle
                  cx={getX(i)}
                  cy={getY(d.weight)}
                  r={isActive ? 5 : 3}
                  fill={isActive ? '#007AFF' : '#fff'}
                  stroke="#007AFF"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  onClick={() => {
                    setActiveIndex(i);
                    onSelectDate?.(d.date);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* X 轴日期标签 */}
          {chartData.map((d, i) => (
            <text
              key={i}
              x={getX(i)}
              y={svgHeight - 8}
              textAnchor="middle"
              className="text-[9px]"
              fill={i === activeIndex ? '#007AFF' : '#8E8E93'}
              style={{ fontSize: '9px' }}
            >
              {d.label}
            </text>
          ))}

          {/* 渐变定义 */}
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007AFF" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

/**
 * BMI/体脂率/体重数据卡片
 * @description 根据选中日期显示对应数据，若该日期无记录则显示最新有效值
 */
const StatsCards: React.FC<{
  records: BodyRecord[];
  userHeight?: number;
  selectedDate?: string;
}> = ({ records, userHeight, selectedDate }) => {
  // 查找选中日期对应的记录，若无则取最新记录
  const targetRecord = selectedDate
    ? records.find(r => r.date === selectedDate) || records[0]
    : records[0];

  if (!targetRecord) return null;

  const bmi = userHeight ? calcBMI(targetRecord.weight, userHeight) : null;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-white rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-[#1C1C1E]">
          {bmi !== null ? bmi : '--'}
        </p>
        <p className="text-xs text-[#8E8E93] mt-1">BMI</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-[#1C1C1E]">
          {targetRecord.bodyFat !== undefined ? `${targetRecord.bodyFat}` : '--'}
        </p>
        <p className="text-xs text-[#8E8E93] mt-1">体脂率 %</p>
      </div>
      <div className="bg-white rounded-2xl p-3 text-center">
        <p className="text-2xl font-bold text-[#1C1C1E]">
          {targetRecord.weight}
        </p>
        <p className="text-xs text-[#8E8E93] mt-1">体重 kg</p>
      </div>
    </div>
  );
};

/**
 * 身体数据组件
 */
const Body: React.FC = () => {
  const { currentUser } = useUser();
  const [records, setRecords] = useState<BodyRecord[]>(
    currentUser ? getBodyRecordsByUser(currentUser.id) : []
  );
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BodyRecord | null>(null);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  if (!currentUser) return null;

  /** 刷新记录列表 */
  const refreshRecords = () => {
    setRecords(getBodyRecordsByUser(currentUser.id));
  };

  /** 打开新增弹窗 */
  const openAddModal = () => {
    setEditingRecord(null);
    setWeight('');
    setBodyFat('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowModal(true);
  };

  /** 打开编辑弹窗 */
  const openEditModal = (record: BodyRecord) => {
    setEditingRecord(record);
    setWeight(String(record.weight));
    setBodyFat(record.bodyFat !== undefined ? String(record.bodyFat) : '');
    setDate(record.date);
    setShowModal(true);
  };

  /** 保存（新增或编辑） */
  const handleSave = () => {
    if (!weight) return;
    if (editingRecord) {
      // 编辑模式：若修改了日期，需检查新日期是否与其他记录重复
      if (date !== editingRecord.date) {
        const duplicate = records.find(r => r.date === date && r.id !== editingRecord.id);
        if (duplicate) {
          const confirmed = window.confirm(`${date} 已有身体记录（${duplicate.weight}kg），是否覆盖？`);
          if (!confirmed) return;
        }
      }
      updateBodyRecord(currentUser.id, editingRecord.id, {
        date,
        weight: parseFloat(weight),
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      });
    } else {
      // 新增模式：检查日期是否已存在
      const duplicate = records.find(r => r.date === date);
      if (duplicate) {
        const confirmed = window.confirm(`${date} 已有身体记录（${duplicate.weight}kg），是否覆盖？`);
        if (!confirmed) return;
      }
      const record: BodyRecord = {
        id: Math.random().toString(36).substring(2, 15),
        userId: currentUser.id,
        date,
        weight: parseFloat(weight),
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        createdAt: new Date().toISOString(),
      };
      addBodyRecord(record);
    }
    refreshRecords();
    setShowModal(false);
  };

  /** 关闭弹窗 */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRecord(null);
    setWeight('');
    setBodyFat('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  /** 删除记录 */
  const handleDelete = (recordId: string) => {
    deleteBodyRecord(currentUser.id, recordId);
    refreshRecords();
  };

  return (
    <div>
      {/* 体重折线图 */}
      <WeightChart records={records} onSelectDate={setSelectedDate} />

      {/* BMI/体脂率/体重数据卡片 */}
      <StatsCards records={records} userHeight={currentUser.height} selectedDate={selectedDate} />

      {/* 历史记录 */}
      {records.length > 0 ? (
        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[#1C1C1E]">
                  {record.weight} kg
                  {record.bodyFat !== undefined ? ` · ${record.bodyFat}%` : ''}
                </p>
                <p className="text-xs text-[#8E8E93] mt-0.5">{record.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(record)}
                  className="text-[#007AFF] text-xs px-3 py-1 rounded-lg active:bg-blue-50 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-[#FF3B30] text-xs px-3 py-1 rounded-lg active:bg-red-50 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-[#E5E5EA] rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <p className="text-[#8E8E93] text-sm mb-4">还没有身体数据记录</p>
          <button
            onClick={openAddModal}
            className="bg-[#007AFF] text-white text-sm font-medium px-6 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            记录身体数据
          </button>
        </div>
      )}

      {/* 浮动添加按钮 - 始终可见 */}
      <button
        onClick={openAddModal}
        className="fixed bottom-20 right-5 w-14 h-14 bg-[#007AFF] rounded-full shadow-lg flex items-center justify-center active:scale-[0.95] transition-transform z-10 safe-area-bottom"
      >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

      {/* 添加弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#1C1C1E]">{editingRecord ? '编辑身体数据' : '记录身体数据'}</h3>
              <button
                onClick={handleCloseModal}
                className="text-[#8E8E93] text-sm"
              >
                取消
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="请输入体重"
                  className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-1.5">体脂率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="选填"
                  className="w-full px-4 py-3 bg-[#F2F2F7] rounded-xl text-[#1C1C1E] placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!weight}
                className="w-full bg-[#007AFF] text-white font-bold py-3 rounded-xl transition-all disabled:bg-[#E5E5EA] disabled:text-[#8E8E93] active:scale-[0.98]"
              >
                {editingRecord ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Body;
