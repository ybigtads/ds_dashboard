'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { getTaskStatus } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'upcoming' | 'ended';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'all') return true;
    return getTaskStatus(task) === statusFilter;
  });

  // 상태별로 정렬: 진행 중 > 예정 > 종료
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const statusOrder = { active: 0, upcoming: 1, ended: 2 };
    const statusA = getTaskStatus(a);
    const statusB = getTaskStatus(b);

    if (statusOrder[statusA] !== statusOrder[statusB]) {
      return statusOrder[statusA] - statusOrder[statusB];
    }

    // 같은 상태면 시작일 기준 정렬
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });

  const statusCounts = {
    all: tasks.length,
    active: tasks.filter(t => getTaskStatus(t) === 'active').length,
    upcoming: tasks.filter(t => getTaskStatus(t) === 'upcoming').length,
    ended: tasks.filter(t => getTaskStatus(t) === 'ended').length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">과제</h1>

        <div className="flex gap-2">
          {(['all', 'active', 'upcoming', 'ended'] as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' && `전체 (${statusCounts.all})`}
              {status === 'active' && `진행 중 (${statusCounts.active})`}
              {status === 'upcoming' && `예정 (${statusCounts.upcoming})`}
              {status === 'ended' && `종료 (${statusCounts.ended})`}
            </button>
          ))}
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? '등록된 과제가 없습니다.'
              : `${statusFilter === 'active' ? '진행 중인' : statusFilter === 'upcoming' ? '예정된' : '종료된'} 과제가 없습니다.`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
