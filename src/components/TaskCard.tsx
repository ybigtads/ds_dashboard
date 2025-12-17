'use client';

import Link from 'next/link';
import { Task } from '@/types';
import { getTaskStatus, formatDate, metricShortLabels, statusLabels, statusColors } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const status = getTaskStatus(task);

  return (
    <Link href={`/tasks/${task.slug}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {task.title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {task.description || '설명이 없습니다.'}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-auto">
          <div>
            <span className="block text-gray-400">시작일</span>
            <span>{formatDate(task.start_date)}</span>
          </div>
          <div>
            <span className="block text-gray-400">종료일</span>
            <span>{formatDate(task.end_date)}</span>
          </div>
          <div className="col-span-2">
            <span className="block text-gray-400">평가 지표</span>
            <span className="font-medium text-gray-700">
              {metricShortLabels[task.evaluation_metric] || task.evaluation_metric.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
