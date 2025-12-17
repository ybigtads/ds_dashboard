-- Migration: users 테이블 RLS 정책 수정
-- 문제: SELECT 정책이 없어서 인증된 사용자도 자신의 정보를 읽을 수 없음

-- 1. users 테이블 RLS 활성화 확인
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view public profiles" ON users;

-- 3. SELECT 정책: 인증된 사용자는 자신의 프로필 조회 가능
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 4. SELECT 정책: 프로필 완성된 사용자는 다른 사용자도 조회 가능 (구성원 목록용)
CREATE POLICY "Anyone can view completed profiles" ON users
  FOR SELECT
  USING (profile_completed = true);

-- 5. UPDATE 정책: 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. INSERT 정책: 자신의 프로필만 생성 가능
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
