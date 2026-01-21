import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// === 설정 ===
const TASK_SLUG = '6-nlp-nli'; // 제출할 과제 slug
const CSV_FILE_PATH = 'test_answer.csv'; // 제출할 CSV 파일 경로

async function submitCSV() {
  console.log('CSV 제출 스크립트');
  console.log('==================\n');

  // 1. 파일 확인
  const absolutePath = path.resolve(CSV_FILE_PATH);
  console.log(`1. 파일 확인: ${absolutePath}`);

  if (!fs.existsSync(absolutePath)) {
    console.error(`   ❌ 파일이 존재하지 않습니다: ${CSV_FILE_PATH}`);
    process.exit(1);
  }
  console.log('   ✓ 파일 존재 확인됨\n');

  // 2. 1기 관리자 조회 (cohort=1, role=admin)
  console.log('2. 1기 관리자 조회...');
  let user: { id: string; email: string; name: string | null; username: string; cohort: number; role: string } | null = null;

  const { data: cohortAdmin, error: cohortError } = await supabase
    .from('users')
    .select('id, email, name, username, cohort, role')
    .eq('role', 'admin')
    .eq('cohort', 1)
    .limit(1)
    .single();

  if (cohortError || !cohortAdmin) {
    // cohort 조건 없이 admin만 조회
    console.log('   1기 admin 없음, admin 계정 조회...');
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, email, name, username, cohort, role')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('   ❌ admin 계정을 찾을 수 없습니다');
      process.exit(1);
    }
    user = adminUser;
  } else {
    user = cohortAdmin;
  }

  if (!user) {
    console.error('   ❌ 사용자를 찾을 수 없습니다');
    process.exit(1);
  }

  console.log(`   ✓ 사용자: ${user.name || user.username} (${user.email})`);
  console.log(`   - 기수: ${user.cohort}기, 역할: ${user.role}\n`);

  // 3. 과제 조회
  console.log(`3. 과제 조회: ${TASK_SLUG}`);
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('slug', TASK_SLUG)
    .single();

  if (taskError || !task) {
    console.error(`   ❌ 과제를 찾을 수 없습니다: ${TASK_SLUG}`);
    process.exit(1);
  }
  console.log(`   ✓ 과제: ${task.title}`);
  console.log(`   - 평가 지표: ${task.evaluation_metric || '커스텀'}\n`);

  // 4. 정답 파일 다운로드
  console.log('4. 정답 파일 다운로드...');
  if (!task.answer_file_path) {
    console.error('   ❌ 정답 파일이 설정되지 않았습니다.');
    process.exit(1);
  }

  const { data: answerData, error: answerError } = await supabase.storage
    .from('answers')
    .download(task.answer_file_path);

  if (answerError || !answerData) {
    console.error('   ❌ 정답 파일 다운로드 실패:', answerError);
    process.exit(1);
  }
  console.log('   ✓ 정답 파일 다운로드 완료\n');

  // 5. CSV 파싱 및 채점
  console.log('5. 채점 중...');
  const submissionContent = fs.readFileSync(absolutePath, 'utf-8');
  const answerContent = await answerData.text();

  const submissionLines = submissionContent.trim().split('\n').slice(1); // 헤더 제외
  const answerLines = answerContent.trim().split('\n').slice(1);

  if (submissionLines.length !== answerLines.length) {
    console.error(
      `   ❌ 행 수 불일치: 제출 ${submissionLines.length}행, 정답 ${answerLines.length}행`
    );
    process.exit(1);
  }

  // 간단한 accuracy 계산 (label 컬럼 기준)
  let correct = 0;
  for (let i = 0; i < submissionLines.length; i++) {
    const subParts = submissionLines[i].split(',');
    const ansParts = answerLines[i].split(',');
    const subLabel = subParts[subParts.length - 1].trim();
    const ansLabel = ansParts[ansParts.length - 1].trim();
    if (subLabel === ansLabel) correct++;
  }
  const score = correct / submissionLines.length;
  console.log(`   ✓ 점수: ${(score * 100).toFixed(2)}% (${correct}/${submissionLines.length})\n`);

  // 6. Storage에 제출 파일 업로드
  const timestamp = Date.now();
  const storagePath = `${task.id}/${user.id}/${timestamp}.csv`;
  console.log(`6. 제출 파일 업로드: submissions/${storagePath}`);

  const fileBuffer = fs.readFileSync(absolutePath);
  const { error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(storagePath, fileBuffer, {
      contentType: 'text/csv',
    });

  if (uploadError) {
    console.error('   ❌ 업로드 실패:', uploadError);
    process.exit(1);
  }
  console.log('   ✓ 파일 업로드 완료\n');

  // 7. submissions 테이블에 기록
  console.log('7. 제출 기록 저장...');
  const { data: submission, error: insertError } = await supabase
    .from('submissions')
    .insert({
      task_id: task.id,
      user_id: user.id,
      file_path: storagePath,
      score: score,
    })
    .select()
    .single();

  if (insertError) {
    console.error('   ❌ 저장 실패:', insertError);
    process.exit(1);
  }
  console.log('   ✓ 제출 ID:', submission.id);
  console.log('   ✓ 제출 시간:', submission.submitted_at);

  console.log('\n==================');
  console.log('✅ CSV 제출 완료!');
  console.log(`점수: ${(score * 100).toFixed(2)}%`);
}

submitCSV().catch((error) => {
  console.error('오류:', error);
  process.exit(1);
});
