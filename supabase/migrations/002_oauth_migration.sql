-- Migration: OAuth 인증 방식으로 전환
-- 기존 username/password 방식에서 OAuth (Google, GitHub) 방식으로 변경

-- 1. users 테이블에 OAuth 관련 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'google',
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- 2. password_hash를 nullable로 변경 (OAuth 사용자는 비밀번호 없음)
ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;

-- 3. username을 nullable로 변경 (이메일이 주요 식별자)
ALTER TABLE users
ALTER COLUMN username DROP NOT NULL;

-- 4. provider_id와 auth_provider 조합에 유니크 제약 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_id);

-- 5. email 인덱스 추가 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 참고: 기존 admin 계정은 유지됨 (필요시 수동 삭제)
-- DELETE FROM users WHERE username = 'admin' AND auth_provider = 'local';
