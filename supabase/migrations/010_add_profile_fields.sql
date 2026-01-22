-- Add additional profile fields for users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS github_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);

-- Add comments for documentation
COMMENT ON COLUMN users.bio IS '사용자 자기소개 (최대 500자)';
COMMENT ON COLUMN users.github_url IS 'GitHub 프로필 URL';
COMMENT ON COLUMN users.linkedin_url IS 'LinkedIn 프로필 URL';
