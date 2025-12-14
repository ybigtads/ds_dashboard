-- Migration: 사용자 프로필 확장 및 수상 내역 테이블

-- 1. users 테이블에 프로필 정보 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cohort INTEGER,  -- 기수 (예: 26)
ADD COLUMN IF NOT EXISTS name VARCHAR(100),  -- 이름 (예: 이준찬)
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;  -- 프로필 완성 여부

-- 2. 수상 내역 테이블 생성
CREATE TABLE IF NOT EXISTS awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,  -- 수상 제목 (예: "1위", "우수상")
  rank INTEGER,  -- 순위 (1, 2, 3 등)
  description TEXT,  -- 수상 내용 설명
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_awards_user_id ON awards(user_id);
CREATE INDEX IF NOT EXISTS idx_awards_competition_id ON awards(competition_id);
CREATE INDEX IF NOT EXISTS idx_users_cohort ON users(cohort);

-- 4. RLS 정책 for awards
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view awards" ON awards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own awards" ON awards
  FOR ALL USING (auth.uid() = user_id);

-- 5. users 테이블 UPDATE 정책 추가 (프로필 완성을 위해)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
