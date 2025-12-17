import { Task, TaskWithStatus, Competition, CompetitionWithStatus } from '@/types';

// Task 상태 계산
export function getTaskStatus(task: Task): 'upcoming' | 'active' | 'ended' {
  const now = new Date();
  const start = new Date(task.start_date);
  const end = new Date(task.end_date);

  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

export function addStatusToTask(task: Task): TaskWithStatus {
  return {
    ...task,
    status: getTaskStatus(task),
  };
}

// 하위 호환성을 위한 alias
export function getCompetitionStatus(competition: Competition): 'upcoming' | 'active' | 'ended' {
  return getTaskStatus(competition as Task);
}

export function addStatusToCompetition(competition: Competition): CompetitionWithStatus {
  return addStatusToTask(competition as Task);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return '오늘';
    if (absDays === 1) return '어제';
    if (absDays < 7) return `${absDays}일 전`;
    if (absDays < 30) return `${Math.floor(absDays / 7)}주 전`;
    return formatDate(date);
  } else {
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays < 7) return `${diffDays}일 후`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 후`;
    return formatDate(date);
  }
}

export const metricLabels: Record<string, string> = {
  rmse: 'RMSE (Root Mean Squared Error)',
  accuracy: 'Accuracy',
  f1: 'F1 Score',
  auc: 'AUC (Area Under Curve)',
};

export const metricShortLabels: Record<string, string> = {
  rmse: 'RMSE',
  accuracy: 'Accuracy',
  f1: 'F1',
  auc: 'AUC',
};

export const statusLabels: Record<string, string> = {
  upcoming: '예정',
  active: '진행 중',
  ended: '종료',
};

export const statusColors: Record<string, string> = {
  upcoming: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  ended: 'bg-gray-100 text-gray-800',
};
