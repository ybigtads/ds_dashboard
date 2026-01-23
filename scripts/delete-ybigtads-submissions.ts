import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('YBIGTADS 사용자 제출 기록 삭제');
  console.log('================================\n');

  // 사용자 찾기
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, username, name, cohort, role')
    .or('username.ilike.%YBIGTADS%,name.ilike.%YBIGTADS%');

  if (userError) {
    console.error('사용자 조회 실패:', userError);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('YBIGTADS 사용자를 찾을 수 없습니다.');
    process.exit(1);
  }

  const user = users[0];
  console.log('사용자 정보:');
  console.log('  - ID:', user.id);
  console.log('  - username:', user.username);
  console.log('  - name:', user.name);
  console.log('  - email:', user.email);
  console.log('  - cohort:', user.cohort);
  console.log('  - role:', user.role);

  // 제출 기록 확인
  const { data: submissions, count } = await supabase
    .from('submissions')
    .select('id, task_id, score, submitted_at', { count: 'exact' })
    .eq('user_id', user.id);

  console.log('\n제출 기록:', count, '개');
  if (submissions && submissions.length > 0) {
    submissions.forEach((s) => {
      console.log('  -', s.id, 'score:', s.score, 'at:', s.submitted_at);
    });

    // 제출 삭제
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('\n❌ 삭제 실패:', deleteError);
      process.exit(1);
    }

    console.log('\n✅ 제출 기록', count, '개 삭제 완료');

    // 확인
    const { count: remaining } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    console.log('남은 제출 기록:', remaining, '개');
  } else {
    console.log('삭제할 제출 기록이 없습니다.');
  }
}

main().catch((error) => {
  console.error('오류:', error);
  process.exit(1);
});
