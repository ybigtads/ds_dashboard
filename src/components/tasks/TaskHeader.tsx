'use client';

import { Task } from '@/types';
import { metricLabels, statusLabels, daconStatusColors } from '@/lib/utils';
import { TaskProgressBar } from './TaskProgressBar';

type TaskStatus = 'upcoming' | 'active' | 'ended';

interface TaskHeaderProps {
  task: Task;
  status: TaskStatus;
  participantCount: number;
  canSubmit: boolean;
  onSubmitClick: () => void;
}

export function TaskHeader({
  task,
  status,
  participantCount,
  canSubmit,
  onSubmitClick
}: TaskHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        {/* 제목 + 상태 배지 + 제출 버튼 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${daconStatusColors[status]}`}
              >
                {statusLabels[status]}
              </span>
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: '#002648' }}
            >
              {task.title}
            </h1>
          </div>

          {/* 제출 버튼 (헤더 우측 고정) */}
          <div className="flex-shrink-0">
            <button
              onClick={onSubmitClick}
              disabled={!canSubmit}
              className="dacon-btn-primary w-full sm:w-auto"
            >
              {status === 'upcoming'
                ? '대기 중'
                : status === 'ended'
                  ? '종료됨'
                  : '제출하기'}
            </button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-500 block mb-1">평가 지표</span>
            <p className="font-semibold" style={{ color: '#002648' }}>
              {task.evaluation_metric ? metricLabels[task.evaluation_metric] : '커스텀'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">참가자</span>
            <p className="font-semibold" style={{ color: '#002648' }}>
              {participantCount}명
            </p>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">일일 제출</span>
            <p className="font-semibold" style={{ color: '#002648' }}>
              {task.max_submissions_per_day}회
            </p>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">채점 방식</span>
            <p className="font-semibold" style={{ color: '#002648' }}>
              {task.use_custom_scoring ? '커스텀' : '자동'}
            </p>
          </div>
        </div>

        {/* 진행 상황 바 */}
        <TaskProgressBar
          startDate={task.start_date}
          endDate={task.end_date}
          status={status}
        />
      </div>
    </div>
  );
}
