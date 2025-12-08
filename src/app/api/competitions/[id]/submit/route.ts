import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';
import { parseCSV, getTargetColumn } from '@/lib/csv';
import { evaluators, higherIsBetter } from '@/lib/evaluators';
import { EvaluationMetric } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get competition
    const { data: competition, error: compError } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Check if competition is active
    const now = new Date();
    const startDate = new Date(competition.start_date);
    const endDate = new Date(competition.end_date);

    if (now < startDate) {
      return NextResponse.json({ error: 'Competition has not started yet' }, { status: 400 });
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Competition has ended' }, { status: 400 });
    }

    // Check if answer file exists
    if (!competition.answer_file_path) {
      return NextResponse.json({ error: 'Answer file not available' }, { status: 400 });
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
    } catch (err) {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 });
    }

    // Download and parse answer file
    const { data: answerData, error: downloadError } = await supabaseAdmin.storage
      .from('answers')
      .download(competition.answer_file_path);

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
    const metric = competition.evaluation_metric as EvaluationMetric;
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
    const fileName = `${id}/${session.id}/${Date.now()}.csv`;
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
        competition_id: id,
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
    });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
