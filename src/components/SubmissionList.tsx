'use client';

import { useState, useEffect, useCallback } from 'react';
import { Submission, EvaluationMetric } from '@/types';
import { formatRelativeTime, metricLabels } from '@/lib/utils';
import { higherIsBetter } from '@/lib/evaluators';

interface SubmissionListProps {
  taskSlug: string;
  metric: EvaluationMetric | null;
  refreshTrigger?: number;
}

export function SubmissionList({ taskSlug, metric, refreshTrigger }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isHigherBetter = metric ? higherIsBetter[metric] : true;

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/submissions?task_slug=${taskSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [taskSlug]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions, refreshTrigger]);

  const handleDownload = async (submission: Submission) => {
    if (!submission.file_path) return;

    setDownloadingId(submission.id);
    try {
      const res = await fetch(`/api/submissions/download?file_path=${encodeURIComponent(submission.file_path)}`);
      const data = await res.json();

      if (res.ok && data.url) {
        // 앵커 태그를 사용하여 다운로드 (팝업 차단 방지)
        const a = document.createElement('a');
        a.href = data.url;
        a.download = submission.file_path.split('/').pop() || 'submission.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.error || '다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('다운로드에 실패했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // 최고 점수 찾기
  const getBestScore = (): number | null => {
    const validScores = submissions.filter(s => s.score !== null).map(s => s.score as number);
    if (validScores.length === 0) return null;

    return isHigherBetter
      ? Math.max(...validScores)
      : Math.min(...validScores);
  };

  const bestScore = getBestScore();

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-3">📋</div>
        <p className="text-gray-500">아직 제출 이력이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-1">위에서 파일을 업로드하여 첫 제출을 해보세요!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              점수
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제출 시간
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              파일
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {submissions.map((submission, index) => {
            const isBest = submission.score !== null && submission.score === bestScore;

            return (
              <tr
                key={submission.id}
                className={isBest ? 'bg-green-50' : 'hover:bg-gray-50'}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {index + 1}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {submission.score !== null ? (
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${isBest ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>
                        {submission.score.toFixed(4)}
                      </span>
                      {isBest && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          최고
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        ({metricLabels[metric as keyof typeof metricLabels] || metric?.toUpperCase() || 'CUSTOM'})
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">채점 중...</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatRelativeTime(submission.submitted_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleDownload(submission)}
                    disabled={downloadingId === submission.id || !submission.file_path}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === submission.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        다운로드 중...
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        다운로드
                      </>
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
