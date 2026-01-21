import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TASK_SLUG = '6-nlp-nli';
const LOCAL_FILE_PATH = 'test_answer.csv';
const VALID_LABELS = ['entailment', 'neutral', 'contradiction'];

async function uploadAnswerFile() {
  console.log('NLI 과제 정답 파일 업로드 스크립트');
  console.log('================================\n');

  // 1. 로컬 파일 존재 확인
  const absolutePath = path.resolve(LOCAL_FILE_PATH);
  console.log(`1. 파일 존재 확인: ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    console.error(`   ❌ 파일이 존재하지 않습니다: ${LOCAL_FILE_PATH}`);
    process.exit(1);
  }
  console.log('   ✓ 파일 존재 확인됨\n');

  // 2. CSV 형식 검증
  console.log('2. CSV 형식 검증 중...');
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  const lines = fileContent.trim().split('\n');

  if (lines.length < 2) {
    console.error('   ❌ CSV 파일에 데이터가 없습니다.');
    process.exit(1);
  }

  const header = lines[0].trim();
  if (header !== 'id,label' && header !== 'id,prediction') {
    console.error(`   ❌ 잘못된 헤더 형식: "${header}"`);
    console.error('   예상 형식: "id,label" 또는 "id,prediction"');
    process.exit(1);
  }
  console.log(`   ✓ 헤더 확인: ${header}`);

  // 레이블 값 검증 (샘플 확인)
  let invalidCount = 0;
  for (let i = 1; i < Math.min(lines.length, 100); i++) {
    const parts = lines[i].trim().split(',');
    if (parts.length !== 2) {
      console.error(`   ❌ 라인 ${i + 1}: 잘못된 형식 - "${lines[i]}"`);
      invalidCount++;
      continue;
    }
    const label = parts[1].trim();
    if (!VALID_LABELS.includes(label)) {
      console.error(`   ❌ 라인 ${i + 1}: 잘못된 레이블 - "${label}"`);
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    console.error(`\n   ❌ ${invalidCount}개의 검증 오류가 발견되었습니다.`);
    process.exit(1);
  }
  console.log(`   ✓ 총 ${lines.length - 1}개의 데이터 행 확인됨\n`);

  // 3. 과제 조회
  console.log(`3. 과제 조회 중... (slug: ${TASK_SLUG})`);
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, slug, title, answer_file_path')
    .eq('slug', TASK_SLUG)
    .single();

  if (taskError || !task) {
    console.error(`   ❌ 과제를 찾을 수 없습니다: ${TASK_SLUG}`);
    console.error('   에러:', taskError);
    process.exit(1);
  }
  console.log(`   ✓ 과제 조회 완료`);
  console.log(`   - ID: ${task.id}`);
  console.log(`   - 제목: ${task.title}`);
  console.log(`   - 기존 정답 파일: ${task.answer_file_path || '없음'}\n`);

  // 4. Supabase Storage에 업로드
  const storagePath = `${task.id}/answer.csv`;
  console.log(`4. Storage 업로드 중... (경로: answers/${storagePath})`);

  const fileBuffer = fs.readFileSync(absolutePath);
  const { error: uploadError } = await supabase.storage
    .from('answers')
    .upload(storagePath, fileBuffer, {
      contentType: 'text/csv',
      upsert: true,
    });

  if (uploadError) {
    console.error('   ❌ 업로드 실패:', uploadError);
    process.exit(1);
  }
  console.log('   ✓ Storage 업로드 완료\n');

  // 5. 과제 테이블 업데이트
  console.log('5. 과제 테이블 업데이트 중...');
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ answer_file_path: storagePath })
    .eq('id', task.id);

  if (updateError) {
    console.error('   ❌ 업데이트 실패:', updateError);
    process.exit(1);
  }
  console.log('   ✓ answer_file_path 업데이트 완료\n');

  // 완료 메시지
  console.log('================================');
  console.log('✅ 정답 파일 업로드 완료!\n');
  console.log('검증 방법:');
  console.log(`1. Supabase Storage에서 answers/${storagePath} 파일 확인`);
  console.log(`2. 웹 UI: /admin/tasks/${TASK_SLUG}/edit 페이지에서 정답 파일 경로 확인`);
  console.log(`3. 테스트 제출: /tasks/${TASK_SLUG} 페이지에서 샘플 CSV 제출 후 점수 확인`);
}

uploadAnswerFile().catch((error) => {
  console.error('예상치 못한 오류:', error);
  process.exit(1);
});
