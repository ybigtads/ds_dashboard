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

async function updateDeadline() {
  console.log('과제 마감일 변경 스크립트');
  console.log('========================\n');

  // 현재 과제 목록 확인
  console.log('현재 과제 목록:');
  const { data: tasks, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, slug, end_date')
    .order('end_date', { ascending: false });

  if (taskError) {
    console.error('❌ 과제 조회 실패:', taskError);
    process.exit(1);
  }

  tasks?.forEach((t, i) => {
    console.log(`${i + 1}. ${t.title}`);
    console.log(`   slug: ${t.slug}`);
    console.log(`   현재 마감일: ${t.end_date}\n`);
  });

  // 6회차 과제 찾기 (slug에 '6' 포함)
  const task = tasks?.find((t) => t.slug?.includes('6'));

  if (!task) {
    console.error('❌ 6회차 과제를 찾을 수 없습니다');
    process.exit(1);
  }

  console.log(`대상 과제: ${task.title}`);
  console.log(`현재 마감일: ${task.end_date}`);
  console.log('새로운 마감일: 2026-01-30 23:59:59 KST\n');

  // 마감일 변경
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ end_date: '2026-01-30T23:59:59+09:00' })
    .eq('id', task.id);

  if (updateError) {
    console.error('❌ 마감일 변경 실패:', updateError);
    process.exit(1);
  }

  // 변경 확인
  const { data: updatedTask } = await supabase
    .from('tasks')
    .select('title, end_date')
    .eq('id', task.id)
    .single();

  console.log('✅ 마감일 변경 완료!');
  console.log(`   과제: ${updatedTask?.title}`);
  console.log(`   새 마감일: ${updatedTask?.end_date}`);
}

updateDeadline().catch((error) => {
  console.error('오류:', error);
  process.exit(1);
});
