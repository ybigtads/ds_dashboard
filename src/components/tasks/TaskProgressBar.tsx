'use client';

import { calculateProgress, formatDate, calculateDDay } from '@/lib/utils';

interface TaskProgressBarProps {
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
}

export function TaskProgressBar({ startDate, endDate, status }: TaskProgressBarProps) {
  const progress = calculateProgress(startDate, endDate);
  const dday = calculateDDay(endDate);

  return (
    <div className="w-full">
      {/* 날짜 레이블 */}
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-gray-600">
          {formatDate(startDate)}
        </span>
        <span
          className="font-bold text-lg"
          style={{ color: status === 'ended' ? '#6b7280' : '#002648' }}
        >
          {dday}
        </span>
        <span className="text-gray-600">
          {formatDate(endDate)}
        </span>
      </div>

      {/* 진행 바 */}
      <div className="dacon-progress-bar">
        <div
          className="dacon-progress-fill"
          style={{
            width: `${progress}%`,
            background: status === 'ended'
              ? '#9ca3af'
              : 'linear-gradient(90deg, #00a8e8 0%, #002648 100%)'
          }}
        />
      </div>

      {/* 진행률 텍스트 */}
      <div className="text-right mt-1">
        <span className="text-xs text-gray-500">{progress}% 진행</span>
      </div>
    </div>
  );
}
