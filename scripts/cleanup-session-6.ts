import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupSession6() {
  console.log('6회차 과제 데이터 정리 스크립트');
  console.log('================================\n');

  // Step 1: 6회차 과제 ID 확인
  console.log('Step 1: 6회차 과제 ID 확인...');
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, slug, end_date')
    .or('title.ilike.%6%,slug.ilike.%6%');

  if (taskError) {
    console.error('   ❌ 과제 조회 실패:', taskError);
    process.exit(1);
  }

  if (!tasks || tasks.length === 0) {
    console.error('   ❌ 6회차 과제를 찾을 수 없습니다');
    process.exit(1);
  }

  console.log('   찾은 과제:');
  tasks.forEach((t) => {
    console.log(`   - ID: ${t.id}`);
    console.log(`     제목: ${t.title}`);
    console.log(`     slug: ${t.slug}`);
    console.log(`     마감일: ${t.end_date}`);
  });

  // 첫 번째 매칭 과제 사용 (또는 slug로 특정)
  const task = tasks.find((t) => t.slug?.includes('6')) || tasks[0];
  const TASK_ID = task.id;
  console.log(`\n   ✓ 대상 과제 ID: ${TASK_ID}\n`);

  // Step 2: 6회차 과제의 질문/게시판 글 삭제
  console.log('Step 2: 질문/게시판 글 삭제...');

  // 2-1: Q&A 답변 삭제
  console.log('   2-1. Q&A 답변 삭제...');
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('task_id', TASK_ID);

  if (questions && questions.length > 0) {
    const questionIds = questions.map((q) => q.id);
    const { error: answerError, count: answerCount } = await supabase
      .from('question_answers')
      .delete()
      .in('question_id', questionIds);

    if (answerError) {
      console.error('      ❌ Q&A 답변 삭제 실패:', answerError);
    } else {
      console.log(`      ✓ Q&A 답변 삭제 완료`);
    }
  } else {
    console.log('      (삭제할 답변 없음)');
  }

  // 2-2: Q&A 질문 삭제
  console.log('   2-2. Q&A 질문 삭제...');
  const { error: questionError } = await supabase
    .from('questions')
    .delete()
    .eq('task_id', TASK_ID);

  if (questionError) {
    console.error('      ❌ Q&A 질문 삭제 실패:', questionError);
  } else {
    console.log('      ✓ Q&A 질문 삭제 완료');
  }

  // 2-3: 게시판 댓글 삭제
  console.log('   2-3. 게시판 댓글 삭제...');
  const { data: posts } = await supabase
    .from('board_posts')
    .select('id')
    .eq('task_id', TASK_ID);

  if (posts && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { error: commentError } = await supabase
      .from('board_comments')
      .delete()
      .in('post_id', postIds);

    if (commentError) {
      console.error('      ❌ 게시판 댓글 삭제 실패:', commentError);
    } else {
      console.log('      ✓ 게시판 댓글 삭제 완료');
    }
  } else {
    console.log('      (삭제할 댓글 없음)');
  }

  // 2-4: 게시판 글 삭제
  console.log('   2-4. 게시판 글 삭제...');
  const { error: postError } = await supabase
    .from('board_posts')
    .delete()
    .eq('task_id', TASK_ID);

  if (postError) {
    console.error('      ❌ 게시판 글 삭제 실패:', postError);
  } else {
    console.log('      ✓ 게시판 글 삭제 완료');
  }

  console.log('');

  // Step 3: 과제 제출 기간 변경 (2월 3일까지)
  console.log('Step 3: 과제 제출 기간 변경 (2026-02-03)...');
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ end_date: '2026-02-03T23:59:59+09:00' })
    .eq('id', TASK_ID);

  if (updateError) {
    console.error('   ❌ 마감일 변경 실패:', updateError);
  } else {
    console.log('   ✓ 마감일 변경 완료: 2026-02-03 23:59:59 KST\n');
  }

  // Step 4: 1기 관리자 submission 삭제
  console.log('Step 4: 1기 관리자 submission 삭제...');

  // 먼저 대상 확인
  const { data: adminUsers, error: adminError } = await supabase
    .from('users')
    .select('id, email, username')
    .eq('cohort', 1)
    .eq('role', 'admin');

  if (adminError) {
    console.error('   ❌ 관리자 조회 실패:', adminError);
  } else if (!adminUsers || adminUsers.length === 0) {
    console.log('   (1기 관리자가 없습니다)');
  } else {
    console.log('   대상 관리자:');
    adminUsers.forEach((u) => {
      console.log(`   - ${u.username} (${u.email})`);
    });

    const adminIds = adminUsers.map((u) => u.id);

    // 제출 수 확인
    const { count: submissionCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .in('user_id', adminIds);

    console.log(`   삭제 대상 제출 수: ${submissionCount || 0}개`);

    // 삭제 실행
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .in('user_id', adminIds);

    if (deleteError) {
      console.error('   ❌ 제출 삭제 실패:', deleteError);
    } else {
      console.log('   ✓ 1기 관리자 submission 삭제 완료');
    }
  }

  console.log('');

  // 검증
  console.log('================================');
  console.log('검증 결과:');

  // 질문 수 확인
  const { count: qCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', TASK_ID);
  console.log(`   - 남은 질문 수: ${qCount || 0}`);

  // 게시판 글 수 확인
  const { count: pCount } = await supabase
    .from('board_posts')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', TASK_ID);
  console.log(`   - 남은 게시판 글 수: ${pCount || 0}`);

  // 마감일 확인
  const { data: updatedTask } = await supabase
    .from('tasks')
    .select('title, end_date')
    .eq('id', TASK_ID)
    .single();
  console.log(`   - 과제 마감일: ${updatedTask?.end_date}`);

  // 1기 관리자 submission 수 확인
  if (adminUsers && adminUsers.length > 0) {
    const adminIds = adminUsers.map((u) => u.id);
    const { count: remainingSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .in('user_id', adminIds);
    console.log(`   - 1기 관리자 남은 제출 수: ${remainingSubmissions || 0}`);
  }

  console.log('\n================================');
  console.log('✅ 데이터 정리 완료!');
}

cleanupSession6().catch((error) => {
  console.error('오류:', error);
  process.exit(1);
});
