export interface User {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  auth_provider: 'google' | 'github';
  is_admin: boolean;
  cohort: number | null;  // 기수 (예: 26)
  name: string | null;  // 이름 (예: 이준찬)
  profile_completed: boolean;  // 프로필 완성 여부
  created_at: string;
}

export interface Award {
  id: string;
  user_id: string;
  competition_id: string | null;
  title: string;  // 수상 제목 (예: "1위", "우수상")
  rank: number | null;
  description: string | null;
  awarded_at: string;
  created_at: string;
  // 조인된 정보
  competition?: Competition;
  user?: User;
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
  cohort: number | null;
  name: string | null;
  best_score: number;
  submission_count: number;
  last_submission: string;
}

export type EvaluationMetric = 'rmse' | 'accuracy' | 'f1' | 'auc';

export interface CompetitionWithStatus extends Competition {
  status: 'upcoming' | 'active' | 'ended';
}
