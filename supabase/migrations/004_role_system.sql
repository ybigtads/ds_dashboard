-- Migration: Role 시스템 추가
-- 기존 is_admin boolean을 role enum으로 확장

-- 1. Role enum 타입 생성
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'creator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. users 테이블에 role 컬럼 추가
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. 기존 is_admin 데이터를 role로 마이그레이션
UPDATE users SET role = 'admin' WHERE is_admin = true AND role = 'user';
UPDATE users SET role = 'user' WHERE (is_admin = false OR is_admin IS NULL) AND role IS NULL;

-- 4. role 컬럼 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 5. task_creators 테이블 생성 (Creator 권한 매핑)
-- 특정 과제에 대한 Creator 권한을 가진 사용자 매핑
CREATE TABLE IF NOT EXISTS task_creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL,  -- tasks 테이블 생성 후 FK 추가
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_creators_user ON task_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_task_creators_task ON task_creators(task_id);

-- 6. RLS 정책 for task_creators
ALTER TABLE task_creators ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 task_creators 조회 가능 (권한 체크용)
CREATE POLICY "Anyone can view task_creators" ON task_creators
    FOR SELECT USING (true);

-- Admin만 task_creators 관리 가능
CREATE POLICY "Admins can manage task_creators" ON task_creators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );
