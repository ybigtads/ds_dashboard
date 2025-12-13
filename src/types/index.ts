export interface User {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  auth_provider: 'google' | 'github';
  is_admin: boolean;
  created_at: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  evaluation_metric: EvaluationMetric;
  answer_file_path: string;
  created_by: string;
  created_at: string;
}

export interface Submission {
  id: string;
  competition_id: string;
  user_id: string;
  file_path: string;
  score: number | null;
  submitted_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  email: string;
  avatar_url: string | null;
  best_score: number;
  submission_count: number;
  last_submission: string;
}

export type EvaluationMetric = 'rmse' | 'accuracy' | 'f1' | 'auc';

export interface CompetitionWithStatus extends Competition {
  status: 'upcoming' | 'active' | 'ended';
}
