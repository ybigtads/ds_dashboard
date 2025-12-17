-- Migration: 커스텀 채점 함수 지원
-- 관리자/출제자가 JavaScript로 채점 로직을 직접 정의할 수 있도록 함

-- 1. tasks 테이블에 커스텀 채점 관련 컬럼 추가
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS use_custom_scoring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS custom_scoring_code TEXT;

-- 2. evaluation_metric을 nullable로 변경 (커스텀 채점 시 사용 안 함)
-- 기존 데이터는 유지되고, 새로 생성 시 custom_scoring=true면 metric이 null일 수 있음

COMMENT ON COLUMN tasks.use_custom_scoring IS '커스텀 JavaScript 채점 함수 사용 여부';
COMMENT ON COLUMN tasks.custom_scoring_code IS 'JavaScript 채점 함수 코드. function score(answer, submission) { return number; } 형태';
