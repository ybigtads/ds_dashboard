import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { higherIsBetter } from '@/lib/evaluators';
import { EvaluationMetric, LeaderboardEntry } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;

    // slug로 task 조회
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id, evaluation_metric')
      .eq('slug', slug)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const metric = task.evaluation_metric as EvaluationMetric;
    const isHigherBetter = higherIsBetter[metric];

    // task_id로 제출물 조회
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        score,
        submitted_at,
        users!user_id (
          username,
          email,
          avatar_url,
          cohort,
          name
        )
      `)
      .eq('task_id', task.id)
      .not('score', 'is', null);

    if (subError) {
      console.error('Error fetching submissions:', subError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Group by user and calculate best score
    const userBests = new Map<string, {
      user_id: string;
      username: string | null;
      email: string;
      avatar_url: string | null;
      cohort: number | null;
      name: string | null;
      best_score: number;
      submission_count: number;
      last_submission: string;
    }>();

    for (const sub of submissions || []) {
      const userId = sub.user_id;
      const users = sub.users as unknown as {
        username: string | null;
        email: string;
        avatar_url: string | null;
        cohort: number | null;
        name: string | null;
      } | null;
      const username = users?.username || null;
      const email = users?.email || 'Unknown';
      const avatarUrl = users?.avatar_url || null;
      const cohort = users?.cohort || null;
      const name = users?.name || null;
      const score = sub.score as number;
      const submittedAt = sub.submitted_at;

      const existing = userBests.get(userId);

      if (!existing) {
        userBests.set(userId, {
          user_id: userId,
          username,
          email,
          avatar_url: avatarUrl,
          cohort,
          name,
          best_score: score,
          submission_count: 1,
          last_submission: submittedAt,
        });
      } else {
        existing.submission_count++;

        // Update best score
        if (isHigherBetter) {
          if (score > existing.best_score) {
            existing.best_score = score;
          }
        } else {
          if (score < existing.best_score) {
            existing.best_score = score;
          }
        }

        // Update last submission
        if (new Date(submittedAt) > new Date(existing.last_submission)) {
          existing.last_submission = submittedAt;
        }
      }
    }

    // Convert to array and sort
    const leaderboardArray = Array.from(userBests.values());

    leaderboardArray.sort((a, b) => {
      if (isHigherBetter) {
        return b.best_score - a.best_score;
      }
      return a.best_score - b.best_score;
    });

    // Add ranks
    const leaderboard: LeaderboardEntry[] = leaderboardArray.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
