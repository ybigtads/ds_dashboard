import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

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

// 샘플 게시물
const SAMPLE_POST = {
  title: '[공지] NLI 과제 시작 안내',
  content: `안녕하세요! 6회차 NLI 과제가 시작되었습니다.

## 주요 안내사항

1. **데이터셋 다운로드**: 과제 페이지에서 학습 데이터를 다운로드 받으세요.
2. **제출 형식**: CSV 파일로 제출하며, \`id,label\` 형식을 따라야 합니다.
3. **일일 제출 제한**: 하루 최대 10회까지 제출 가능합니다.

## 유의사항

- 레이블은 반드시 \`entailment\`, \`neutral\`, \`contradiction\` 중 하나여야 합니다.
- 테스트 데이터의 모든 행에 대해 예측값을 제출해야 합니다.

질문이 있으시면 Q&A 탭에서 질문해주세요. 화이팅! 🚀`,
  is_pinned: true,
};

// 샘플 Q&A 질문
const SAMPLE_QUESTION = {
  title: '베이스라인 모델 추천 부탁드립니다',
  content: `NLI 과제를 처음 접하는데, 어떤 모델부터 시작하면 좋을까요?

허깅페이스에서 한국어 NLI에 적합한 사전학습 모델이 있으면 추천 부탁드립니다.

감사합니다!`,
  is_resolved: false,
};

async function createSampleData() {
  console.log('샘플 데이터 생성 시작...\n');

  // 1. Admin 계정 조회
  console.log('1. Admin 계정 조회 중...');
  const { data: admin, error: adminError } = await supabase
    .from('users')
    .select('id, email, username, name')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (adminError || !admin) {
    console.error('Admin 계정을 찾을 수 없습니다:', adminError);
    process.exit(1);
  }
  console.log(`   - Admin: ${admin.name || admin.username || admin.email} (${admin.id})`);

  // 2. 과제 조회
  console.log(`\n2. 과제 조회 중 (slug: ${TASK_SLUG})...`);
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, slug')
    .eq('slug', TASK_SLUG)
    .single();

  if (taskError || !task) {
    console.error(`과제를 찾을 수 없습니다 (slug: ${TASK_SLUG}):`, taskError);
    process.exit(1);
  }
  console.log(`   - 과제: ${task.title} (${task.id})`);

  // 3. 게시물 생성
  console.log('\n3. 게시물 생성 중...');
  const { data: post, error: postError } = await supabase
    .from('board_posts')
    .insert({
      task_id: task.id,
      author_id: admin.id,
      title: SAMPLE_POST.title,
      content: SAMPLE_POST.content,
      is_pinned: SAMPLE_POST.is_pinned,
    })
    .select()
    .single();

  if (postError) {
    console.error('게시물 생성 실패:', postError);
    process.exit(1);
  }
  console.log(`   - 게시물 생성 완료: "${post.title}" (${post.id})`);

  // 4. Q&A 질문 생성
  console.log('\n4. Q&A 질문 생성 중...');
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      task_id: task.id,
      author_id: admin.id,
      title: SAMPLE_QUESTION.title,
      content: SAMPLE_QUESTION.content,
      is_resolved: SAMPLE_QUESTION.is_resolved,
    })
    .select()
    .single();

  if (questionError) {
    console.error('Q&A 질문 생성 실패:', questionError);
    process.exit(1);
  }
  console.log(`   - Q&A 질문 생성 완료: "${question.title}" (${question.id})`);

  // 결과 요약
  console.log('\n========================================');
  console.log('샘플 데이터 생성 완료!');
  console.log('========================================');
  console.log(`과제: ${task.title}`);
  console.log(`- 게시물: ${post.title}`);
  console.log(`- Q&A: ${question.title}`);
  console.log(`\n과제 페이지: /tasks/${task.slug}`);
}

createSampleData();
