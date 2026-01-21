'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { getTaskStatus } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'upcoming' | 'ended';

const filterConfig: Record<StatusFilter, { label: string; icon: React.ReactNode }> = {
  all: {
    label: '전체',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  active: {
    label: '진행 중',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  upcoming: {
    label: '예정',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  ended: {
    label: '종료',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

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

  const filteredTasks = tasks.filter((task) => {
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
    active: tasks.filter((t) => getTaskStatus(t) === 'active').length,
    upcoming: tasks.filter((t) => getTaskStatus(t) === 'upcoming').length,
    ended: tasks.filter((t) => getTaskStatus(t) === 'ended').length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Skeleton */}
        <div className="mb-10">
          <div className="skeleton h-10 w-48 mb-3" />
          <div className="skeleton h-5 w-72" />
        </div>

        {/* Filter Skeleton */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-10 w-24 rounded-lg" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="flex justify-between">
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-px w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="skeleton h-10 w-full" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-10 animate-fade-in">
        <h1 className="heading-2 mb-2">과제</h1>
        <p className="body-base">
          데이터 과학 실력을 키울 수 있는 다양한 과제에 도전하세요
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 animate-slide-up stagger-1">
        <div className="tab-pill-group">
          {(Object.keys(filterConfig) as StatusFilter[]).map((status) => {
            const config = filterConfig[status];
            const count = statusCounts[status];
            const isSelected = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`tab-pill flex items-center gap-2 ${
                  isSelected ? 'tab-pill-active' : ''
                }`}
              >
                {config.icon}
                <span>{config.label}</span>
                <span
                  className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                      : 'bg-[var(--background-subtle)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task Grid */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--background-subtle)] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="heading-3 mb-2">과제가 없습니다</h3>
          <p className="body-small max-w-sm mx-auto">
            {statusFilter === 'all'
              ? '아직 등록된 과제가 없습니다. 곧 새로운 과제가 추가될 예정입니다.'
              : `${filterConfig[statusFilter].label} 상태의 과제가 없습니다. 다른 필터를 선택해보세요.`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map((task, index) => (
            <div
              key={task.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {tasks.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {statusCounts.active}
              </p>
              <p className="caption">진행 중인 과제</p>
            </div>
            <div className="w-px h-10 bg-[var(--border-subtle)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {statusCounts.upcoming}
              </p>
              <p className="caption">예정된 과제</p>
            </div>
            <div className="w-px h-10 bg-[var(--border-subtle)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {statusCounts.ended}
              </p>
              <p className="caption">완료된 과제</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
