// ==================== 기본 타입 ====================

export type UserRole = 'user' | 'creator' | 'admin';
export type EvaluationMetric = 'rmse' | 'accuracy' | 'f1' | 'auc' | 'map50';
export type TaskStatus = 'upcoming' | 'active' | 'ended';

// ==================== User ====================

export interface User {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  auth_provider: 'google' | 'github';
  role: UserRole;
  is_admin: boolean; // @deprecated - use role === 'admin' instead
  cohort: number | null;
  name: string | null;
  bio?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  is_public?: boolean;
  profile_completed: boolean;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  display_cohort: boolean;
  display_name_public: boolean;
  theme: 'light' | 'dark';
}

// ==================== Task (구 Competition) ====================

export interface DataFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Task {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  evaluation_metric: EvaluationMetric | null;
  answer_file_path: string | null;
  // 새 필드
  data_description: string | null;
  data_files: DataFile[];
  data_download_url: string | null;
  code_description: string | null;
  code_git_url: string | null;
  code_vessl_guide: string | null;
  is_published: boolean;
  max_submissions_per_day: number;
  // 커스텀 채점
  use_custom_scoring: boolean;
  custom_scoring_code: string | null;
  // 메타
  created_by: string;
  created_at: string;
}

export interface TaskWithStatus extends Task {
  status: TaskStatus;
}

// 하위 호환성을 위한 alias
export type Competition = Task;
export type CompetitionWithStatus = TaskWithStatus;

// ==================== Task Creator ====================

export interface TaskCreator {
  id: string;
  user_id: string;
  task_id: string;
  assigned_by: string | null;
  assigned_at: string;
  // 조인용
  user?: User;
  task?: Task;
}

// ==================== Submission ====================

export interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  file_path: string;
  score: number | null;
  submitted_at: string;
  // 조인용
  task?: Task;
  user?: User;
}

// ==================== Award ====================

export interface Award {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  rank: number | null;
  description: string | null;
  awarded_at: string;
  created_at: string;
  task?: Task;
  user?: User;
}

// ==================== Leaderboard ====================

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

// ==================== Board (자유 토론) ====================

export interface BoardPost {
  id: string;
  task_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // 조인용
  author?: User;
  comments_count?: number;
}

export interface BoardComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  // 조인용
  author?: User;
  replies?: BoardComment[];
}

// ==================== Questions (Q&A) ====================

export interface Question {
  id: string;
  task_id: string;
  author_id: string;
  title: string;
  content: string;
  is_resolved: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  // 조인용
  author?: User;
  answers_count?: number;
}

export interface QuestionAnswer {
  id: string;
  question_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

// ==================== Docs (전역 문서) ====================

export interface Doc {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: User;
}

// ==================== API Response 타입 ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
}
