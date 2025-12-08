import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { higherIsBetter } from '@/lib/evaluators';
import { EvaluationMetric, LeaderboardEntry } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get competition to know the metric
    const { data: competition, error: compError } = await supabaseAdmin
      .from('competitions')
      .select('evaluation_metric')
      .eq('id', id)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    const metric = competition.evaluation_metric as EvaluationMetric;
    const isHigherBetter = higherIsBetter[metric];

    // Get all submissions for this competition
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        user_id,
        score,
        submitted_at,
        users (
          username
        )
      `)
      .eq('competition_id', id)
      .not('score', 'is', null);

    if (subError) {
      console.error('Error fetching submissions:', subError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Group by user and calculate best score
    const userBests = new Map<string, {
      user_id: string;
      username: string;
      best_score: number;
      submission_count: number;
      last_submission: string;
    }>();

    for (const sub of submissions || []) {
      const userId = sub.user_id;
      const users = sub.users as unknown as { username: string } | null;
      const username = users?.username || 'Unknown';
      const score = sub.score as number;
      const submittedAt = sub.submitted_at;

      const existing = userBests.get(userId);

      if (!existing) {
        userBests.set(userId, {
          user_id: userId,
          username,
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
