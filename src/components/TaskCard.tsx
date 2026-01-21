'use client';

import Link from 'next/link';
import { Task } from '@/types';
import { getTaskStatus, formatDate, metricShortLabels } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
}

const statusConfig = {
  active: {
    label: '진행 중',
    className: 'status-active',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  upcoming: {
    label: '예정',
    className: 'status-upcoming',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  ended: {
    label: '종료',
    className: 'status-ended',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

export function TaskCard({ task }: TaskCardProps) {
  const status = getTaskStatus(task);
  const config = statusConfig[status];

  // Calculate days remaining or days since end
  const now = new Date();
  const endDate = new Date(task.end_date);
  const startDate = new Date(task.start_date);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Link href={`/tasks/${task.slug}`} className="block group">
      <div className="card card-interactive card-accent h-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="heading-3 text-base group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2 flex-1">
            {task.title}
          </h3>
          <span className={`status-badge flex-shrink-0 ${config.className}`}>
            {config.label}
          </span>
        </div>

        {/* Description */}
        <p className="body-small text-[var(--text-tertiary)] line-clamp-2 mb-5 flex-1">
          {task.description || '설명이 없습니다.'}
        </p>

        {/* Divider */}
        <div className="h-px bg-[var(--border-subtle)] mb-4" />

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="caption mb-1">기간</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {formatDate(task.start_date)} ~ {formatDate(task.end_date)}
            </p>
          </div>
          <div>
            <p className="caption mb-1">평가 지표</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {task.evaluation_metric
                ? metricShortLabels[task.evaluation_metric] || task.evaluation_metric.toUpperCase()
                : '커스텀'}
            </p>
          </div>
        </div>

        {/* Status-specific footer */}
        {status === 'active' && daysRemaining > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--success)]">
                마감까지 {daysRemaining}일 남음
              </span>
              <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1">
                참여하기
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        )}

        {status === 'upcoming' && daysUntilStart > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--warning)]">
                시작까지 {daysUntilStart}일 남음
              </span>
              <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1">
                자세히 보기
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        )}

        {status === 'ended' && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">
                종료됨
              </span>
              <span className="text-xs text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1">
                결과 보기
                <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
