import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { parseCSV, getTargetColumn } from '@/lib/csv';
import { evaluators, higherIsBetter } from '@/lib/evaluators';
import { EvaluationMetric } from '@/types';

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

    // Check if answer file exists
    if (!task.answer_file_path) {
      return NextResponse.json({ error: 'Answer file not available' }, { status: 400 });
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

    // Get predictions and actual values
    const predictions = getTargetColumn(submissionCSV);
    const actual = getTargetColumn(answerCSV);

    if (predictions.length !== actual.length) {
      return NextResponse.json({
        error: `Row count mismatch: submission has ${predictions.length} rows, expected ${actual.length}`,
      }, { status: 400 });
    }

    // Calculate score
    const metric = task.evaluation_metric as EvaluationMetric;
    const evaluator = evaluators[metric];

    let score: number;
    try {
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
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error ? err.message : 'Error calculating score',
      }, { status: 400 });
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
      metric,
      higher_is_better: higherIsBetter[metric],
      remaining_submissions: maxSubmissions - (todayCount || 0) - 1,
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
