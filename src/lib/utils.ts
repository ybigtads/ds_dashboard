import { Competition, CompetitionWithStatus } from '@/types';

export function getCompetitionStatus(competition: Competition): 'upcoming' | 'active' | 'ended' {
  const now = new Date();
  const start = new Date(competition.start_date);
  const end = new Date(competition.end_date);

  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

export function addStatusToCompetition(competition: Competition): CompetitionWithStatus {
  return {
    ...competition,
    status: getCompetitionStatus(competition),
  };
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

export const metricLabels: Record<string, string> = {
  rmse: 'RMSE (Root Mean Squared Error)',
  accuracy: 'Accuracy',
  f1: 'F1 Score',
  auc: 'AUC (Area Under Curve)',
};
