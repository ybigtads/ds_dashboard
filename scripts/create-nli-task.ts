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
  data_description: `## 개요

두 문장 간의 의미 관계를 추론하는 자연어 이해 태스크입니다. 전제(premise)와 가설(hypothesis) 문장이 주어지면, 두 문장의 관계를 함의(entailment), 중립(neutral), 모순(contradiction) 중 하나로 분류합니다.

## 데이터 구성

| 파일명 | 설명 | 행 수 |
|--------|------|-------|
| train.tsv | 학습 데이터 | 942,854 |
| val.tsv | 검증 데이터 | 2,490 |
| test.tsv | 평가 데이터 (라벨 미포함) | 5,010 |

## 컬럼 정보

### 학습/검증 데이터 (train.tsv, val.tsv)

| 컬럼명 | 설명 |
|--------|------|
| sentence1 | 전제 문장 (premise) |
| sentence2 | 가설 문장 (hypothesis) |
| gold_label | 레이블 (entailment / neutral / contradiction) |

### 평가 데이터 (test.tsv)

| 컬럼명 | 설명 |
|--------|------|
| id | 고유 식별자 (0~5009) |
| sentence1 | 전제 문장 (premise) |
| sentence2 | 가설 문장 (hypothesis) |

## 레이블 설명

- **entailment**: 전제가 참일 때 가설도 참 (함의)
- **neutral**: 전제만으로 가설의 참/거짓 판단 불가 (중립)
- **contradiction**: 전제가 참일 때 가설은 거짓 (모순)

## 제출 형식

\`\`\`csv
id,label
0,contradiction
1,entailment
2,neutral
...
\`\`\`

## 평가 지표

**Accuracy (정확도)**: 전체에서 맞게 label한 전제-가설 문장 쌍 비율`,
  data_download_url: null,
  code_description: `## KorNLI Baseline 코드 가이드

한국어 자연어 추론(NLI) 분류 모델 학습 코드입니다.

### 파일 구조

\`\`\`
baseline/
├── config.py      # 설정값 (모델명, 하이퍼파라미터)
├── preprocess.py  # 텍스트 전처리
├── dataset.py     # 데이터 로딩 & Dataset 클래스
├── model.py       # 모델/토크나이저 로딩
├── train.py       # 학습 루프
├── evaluate.py    # 평가
├── predict.py     # 추론 & submission 생성
├── main.py        # CLI 진입점
└── NLI.ipynb      # 노트북 (Colab용)
\`\`\`

### 실행 방법

#### CLI
\`\`\`bash
python main.py --preset minimal --data_dir ../data-sampled
\`\`\`

#### Colab 노트북
1. \`NLI.ipynb\` 파일을 Colab에 업로드
2. 런타임 > 런타임 유형 변경 > **GPU** 선택
3. 첫 번째 셀의 주석 해제 후 실행:
   \`\`\`python
   !pip install -q torch transformers pandas scikit-learn tqdm sentencepiece
   \`\`\`
4. 나머지 셀 순차 실행
5. 마지막 셀에서 \`submission.csv\` 생성됨

### 설정 변경

\`config.py\`의 프리셋을 사용하거나 직접 오버라이드:

\`\`\`python
# 노트북에서
config = get_config("standard", learning_rate=3e-5, epochs=5)
\`\`\`

| 프리셋 | 특징 |
|--------|------|
| minimal | 빠른 테스트용 (3 epochs) |
| standard | 본격 학습용 (5 epochs, early stopping) |`,
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
    console.log('설명 업데이트 중...');

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        data_description: NLI_TASK.data_description,
        code_description: NLI_TASK.code_description,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('업데이트 실패:', updateError);
      process.exit(1);
    }

    console.log('설명 업데이트 완료!');
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
