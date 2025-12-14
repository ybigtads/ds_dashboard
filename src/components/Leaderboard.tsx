'use client';

import { LeaderboardEntry, EvaluationMetric } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { higherIsBetter } from '@/lib/evaluators';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  metric: EvaluationMetric;
}

export function Leaderboard({ entries, metric }: LeaderboardProps) {
  const isHigherBetter = higherIsBetter[metric];

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No submissions yet. Be the first to submit!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <span className="text-sm text-gray-500">
          {isHigherBetter ? 'Higher is better' : 'Lower is better'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Best Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Submission
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr
                key={entry.user_id}
                className={entry.rank <= 3 ? 'bg-yellow-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                    {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                    {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                    <span className="text-sm font-medium text-gray-900">
                      {entry.rank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs text-blue-600 font-bold">
                          {(entry.name || entry.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {entry.cohort && entry.name ? (
                        <>{entry.cohort}기 {entry.name}</>
                      ) : (
                        entry.username || entry.email.split('@')[0]
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 font-mono">
                    {entry.best_score.toFixed(6)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.submission_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(entry.last_submission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
