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

const NLI_TASK = {
  title: '[6회차] NLP 과제 - 한국어 Natural Language Inference',
  slug: '6-nlp-nli',
  description: `## 과제 목표
한국어 자연어 추론(Natural Language Inference, NLI) 모델을 학습하여 두 문장 간의 관계를 예측합니다.

## NLI란?
전제(premise)와 가설(hypothesis) 두 문장이 주어졌을 때, 이들의 관계를 다음 세 가지 중 하나로 분류하는 태스크입니다:
- **entailment**: 전제가 가설을 함의함 (전제가 참이면 가설도 참)
- **contradiction**: 전제와 가설이 모순됨
- **neutral**: 전제와 가설이 독립적 (관계 없음)

## 제출 형식
CSV 파일로 제출하며, 다음 형식을 따라야 합니다:
\`\`\`csv
id,label
0,entailment
1,neutral
2,contradiction
...
\`\`\`

- \`id\`: 테스트 데이터의 인덱스 (0부터 시작)
- \`label\`: 예측한 레이블 (\`entailment\`, \`neutral\`, \`contradiction\` 중 하나)

## 평가 지표
**Accuracy** - 정확히 맞춘 예측의 비율`,
  start_date: '2026-01-23T22:00:00+09:00',
  end_date: '2026-01-29T23:59:00+09:00',
  evaluation_metric: 'accuracy',
  is_published: true,
  max_submissions_per_day: 10,
  use_custom_scoring: false,
  custom_scoring_code: null,
  data_description: null,
  data_download_url: null,
  code_description: null,
  code_git_url: null,
  code_vessl_guide: null,
  data_files: [],
};

async function createNLITask() {
  console.log('NLI 과제 생성 중...');

  // 이미 존재하는지 확인
  const { data: existing } = await supabase
    .from('tasks')
    .select('id, slug')
    .eq('slug', NLI_TASK.slug)
    .single();

  if (existing) {
    console.log(`이미 존재하는 과제입니다: ${existing.slug} (id: ${existing.id})`);
    return;
  }

  // 과제 생성
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(NLI_TASK)
    .select()
    .single();

  if (error) {
    console.error('과제 생성 실패:', error);
    process.exit(1);
  }

  console.log('과제 생성 완료!');
  console.log('- ID:', task.id);
  console.log('- Slug:', task.slug);
  console.log('- Title:', task.title);
  console.log('- 시작일:', task.start_date);
  console.log('- 종료일:', task.end_date);
  console.log('- 평가 지표:', task.evaluation_metric);
  console.log('- 일일 제출 제한:', task.max_submissions_per_day);
  console.log('');
  console.log(`과제 페이지: /tasks/${task.slug}`);
  console.log(`수정 페이지: /admin/tasks/${task.slug}/edit`);
}

createNLITask();
