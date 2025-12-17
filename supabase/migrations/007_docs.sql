-- =============================================
-- Migration: Docs System
-- =============================================

-- Docs 테이블
CREATE TABLE IF NOT EXISTS docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_docs_author_id ON docs(author_id);
CREATE INDEX IF NOT EXISTS idx_docs_category ON docs(category);
CREATE INDEX IF NOT EXISTS idx_docs_slug ON docs(slug);
CREATE INDEX IF NOT EXISTS idx_docs_is_published ON docs(is_published);
CREATE INDEX IF NOT EXISTS idx_docs_created_at ON docs(created_at DESC);

-- Enable RLS
ALTER TABLE docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published docs" ON docs
    FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can create docs" ON docs
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own docs" ON docs
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete docs" ON docs
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );
