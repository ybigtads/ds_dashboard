-- Migration: competitions 테이블을 tasks로 리네이밍 및 확장

-- 1. competitions 테이블 리네이밍
ALTER TABLE IF EXISTS competitions RENAME TO tasks;

-- 2. tasks 테이블에 새 필드 추가
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS data_description TEXT,
ADD COLUMN IF NOT EXISTS data_files JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS data_download_url TEXT,
ADD COLUMN IF NOT EXISTS code_description TEXT,
ADD COLUMN IF NOT EXISTS code_git_url TEXT,
ADD COLUMN IF NOT EXISTS code_vessl_guide TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_submissions_per_day INTEGER DEFAULT 5;

-- 3. 기존 데이터에 slug 생성 (title 기반)
UPDATE tasks
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'),
        '\s+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- 4. slug 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tasks_slug ON tasks(slug);
CREATE INDEX IF NOT EXISTS idx_tasks_is_published ON tasks(is_published);

-- 5. submissions 테이블의 FK 컬럼 리네이밍
ALTER TABLE submissions RENAME COLUMN competition_id TO task_id;

-- 6. awards 테이블의 FK 컬럼 리네이밍
ALTER TABLE awards RENAME COLUMN competition_id TO task_id;

-- 7. task_creators 테이블에 FK 추가 (이제 tasks 테이블이 존재)
ALTER TABLE task_creators
DROP CONSTRAINT IF EXISTS task_creators_task_id_fkey;

ALTER TABLE task_creators
ADD CONSTRAINT task_creators_task_id_fkey
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 8. 기존 인덱스 리네이밍 (존재하는 경우)
ALTER INDEX IF EXISTS idx_submissions_competition_id RENAME TO idx_submissions_task_id;
ALTER INDEX IF EXISTS idx_competitions_dates RENAME TO idx_tasks_dates;

-- 9. RLS 정책 업데이트 (tasks 테이블)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 published 과제 조회 가능
DROP POLICY IF EXISTS "Anyone can view competitions" ON tasks;
CREATE POLICY "Anyone can view published tasks" ON tasks
    FOR SELECT USING (is_published = true OR auth.uid() IS NOT NULL);

-- Creator/Admin만 과제 생성 가능
DROP POLICY IF EXISTS "Admins can create competitions" ON tasks;
CREATE POLICY "Creators and admins can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role IN ('creator', 'admin') OR users.is_admin = true)
        )
    );

-- Creator(본인 과제)/Admin만 수정 가능
DROP POLICY IF EXISTS "Admins can update competitions" ON tasks;
CREATE POLICY "Task owners and admins can update tasks" ON tasks
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM task_creators
            WHERE task_creators.task_id = tasks.id
            AND task_creators.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );

-- Admin만 삭제 가능
DROP POLICY IF EXISTS "Admins can delete competitions" ON tasks;
CREATE POLICY "Admins can delete tasks" ON tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );
