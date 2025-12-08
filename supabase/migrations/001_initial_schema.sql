-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  evaluation_metric VARCHAR(20) NOT NULL CHECK (evaluation_metric IN ('rmse', 'accuracy', 'f1', 'auc')),
  answer_file_path VARCHAR(500),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500) NOT NULL,
  score FLOAT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_competition_id ON submissions(competition_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(score);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON competitions(start_date, end_date);

-- Create storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('answers', 'answers', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Create default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', '$2a$10$rQEY8t9F8sHqFOH8VXpzHu0KKPjK.oVKGGYlFVTMB0mVCXj0bLZ6m', true)
ON CONFLICT (username) DO NOTHING;
