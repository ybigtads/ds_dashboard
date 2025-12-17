import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { parseCSV, getTargetColumn, csvToObjects } from '@/lib/csv';
import { evaluators, higherIsBetter, requiresFullData } from '@/lib/evaluators';
import { EvaluationMetric } from '@/types';

// 커스텀 채점 함수 실행
function executeCustomScoring(
  code: string,
  answerData: Record<string, string>[],
  submissionData: Record<string, string>[]
): number {
  // 코드에서 score 함수 추출 및 실행
  const wrappedCode = `
    ${code}
    return score(answer, submission);
  `;

  const scoreFn = new Function('answer', 'submission', wrappedCode);
  const result = scoreFn(answerData, submissionData);

  if (typeof result !== 'number' || isNaN(result)) {
    throw new Error('채점 함수가 유효한 숫자를 반환하지 않았습니다.');
  }

  return result;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // slug로 task 조회
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task is active
    const now = new Date();
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);

    if (now < startDate) {
      return NextResponse.json({ error: 'Task has not started yet' }, { status: 400 });
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Task has ended' }, { status: 400 });
    }

    // Check if answer file exists (커스텀 채점도 정답 파일 필요)
    if (!task.answer_file_path) {
      return NextResponse.json({ error: 'Answer file not available' }, { status: 400 });
    }

    // 커스텀 채점인데 코드가 없는 경우
    if (task.use_custom_scoring && !task.custom_scoring_code) {
      return NextResponse.json({ error: 'Custom scoring code not configured' }, { status: 400 });
    }

    // Check daily submission limit (UTC 기준)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: todayCount } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', task.id)
      .eq('user_id', session.id)
      .gte('submitted_at', todayStart.toISOString());

    const maxSubmissions = task.max_submissions_per_day || 5;
    if (todayCount && todayCount >= maxSubmissions) {
      return NextResponse.json({
        error: `Daily submission limit reached (${maxSubmissions} submissions per day)`,
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse submission file
    const submissionContent = await file.text();
    let submissionCSV;
    try {
      submissionCSV = parseCSV(submissionContent);
    } catch {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 });
    }

    // Download and parse answer file
    const { data: answerData, error: downloadError } = await supabaseAdmin.storage
      .from('answers')
      .download(task.answer_file_path);

    if (downloadError || !answerData) {
      console.error('Error downloading answer file:', downloadError);
      return NextResponse.json({ error: 'Failed to load answer file' }, { status: 500 });
    }

    const answerContent = await answerData.text();
    const answerCSV = parseCSV(answerContent);

    let score: number;
    let metric: EvaluationMetric | null = null;
    let isHigherBetter = true; // 커스텀 채점의 기본값

    if (task.use_custom_scoring && task.custom_scoring_code) {
      // 커스텀 채점 함수 사용
      try {
        const answerData = csvToObjects(answerCSV);
        const submissionData = csvToObjects(submissionCSV);

        if (submissionData.length !== answerData.length) {
          return NextResponse.json({
            error: `Row count mismatch: submission has ${submissionData.length} rows, expected ${answerData.length}`,
          }, { status: 400 });
        }

        score = executeCustomScoring(task.custom_scoring_code, answerData, submissionData);
      } catch (err) {
        console.error('Custom scoring error:', err);
        return NextResponse.json({
          error: err instanceof Error ? err.message : '커스텀 채점 중 오류가 발생했습니다.',
        }, { status: 400 });
      }
    } else {
      // 기본 평가 지표 사용
      metric = task.evaluation_metric as EvaluationMetric;
      const evaluator = evaluators[metric];
      isHigherBetter = higherIsBetter[metric];

      try {
        // mAP@0.5 등 전체 CSV 데이터가 필요한 메트릭
        if (requiresFullData[metric]) {
          const submissionData = csvToObjects(submissionCSV);
          const answerData = csvToObjects(answerCSV);

          score = evaluator(submissionData, answerData);
        } else {
          // 일반 메트릭 (단일 컬럼 비교)
          const predictions = getTargetColumn(submissionCSV);
          const actual = getTargetColumn(answerCSV);

          if (predictions.length !== actual.length) {
            return NextResponse.json({
              error: `Row count mismatch: submission has ${predictions.length} rows, expected ${actual.length}`,
            }, { status: 400 });
          }

          if (metric === 'rmse' || metric === 'auc') {
            const predNumbers = predictions.map((p) => parseFloat(p));
            const actualNumbers = actual.map((a) => parseFloat(a));

            if (predNumbers.some(isNaN) || actualNumbers.some(isNaN)) {
              return NextResponse.json({ error: 'Invalid numeric values in CSV' }, { status: 400 });
            }

            score = evaluator(predNumbers, actualNumbers);
          } else {
            score = evaluator(predictions, actual);
          }
        }
      } catch (err) {
        return NextResponse.json({
          error: err instanceof Error ? err.message : 'Error calculating score',
        }, { status: 400 });
      }
    }

    // Save submission file
    const fileName = `${task.id}/${session.id}/${Date.now()}.csv`;
    const fileBuffer = await file.arrayBuffer();

    await supabaseAdmin.storage
      .from('submissions')
      .upload(fileName, fileBuffer, {
        contentType: 'text/csv',
      });

    // Save submission record
    const { data: submission, error: insertError } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id: task.id,
        user_id: session.id,
        file_path: fileName,
        score,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving submission:', insertError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    return NextResponse.json({
      submission,
      score,
      metric: metric || 'custom',
      higher_is_better: isHigherBetter,
      remaining_submissions: maxSubmissions - (todayCount || 0) - 1,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
