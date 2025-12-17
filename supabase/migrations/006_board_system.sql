-- =============================================
-- Migration: Board & Questions System
-- =============================================

-- Board Posts (자유 토론)
CREATE TABLE IF NOT EXISTS board_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board Comments (게시글 댓글)
CREATE TABLE IF NOT EXISTS board_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES board_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions (Q&A 질문)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question Answers (Q&A 답변)
CREATE TABLE IF NOT EXISTS question_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_board_posts_task_id ON board_posts(task_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_author_id ON board_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_author_id ON board_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_id ON board_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_questions_task_id ON questions(task_id);
CREATE INDEX IF NOT EXISTS idx_questions_author_id ON questions(author_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_author_id ON question_answers(author_id);

-- Enable RLS
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_posts
CREATE POLICY "Anyone can view board posts" ON board_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create board posts" ON board_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts" ON board_posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete posts" ON board_posts
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );

-- RLS Policies for board_comments
CREATE POLICY "Anyone can view board comments" ON board_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON board_comments
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own comments" ON board_comments
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete comments" ON board_comments
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create questions" ON questions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own questions" ON questions
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete questions" ON questions
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );

-- RLS Policies for question_answers
CREATE POLICY "Anyone can view answers" ON question_answers
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create answers" ON question_answers
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own answers" ON question_answers
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete answers" ON question_answers
    FOR DELETE USING (
        auth.uid() = author_id
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );
