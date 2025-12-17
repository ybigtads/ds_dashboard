'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Submission } from '@/types';
import { formatRelativeTime, metricLabels } from '@/lib/utils';

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions');
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (error) {
        console.error('Failed to fetch submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">내 제출</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📤</div>
          <p className="text-gray-500">아직 제출 이력이 없습니다.</p>
          <Link
            href="/tasks"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            과제 목록 보기
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과제
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출 시간
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map(submission => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/tasks/${submission.task?.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {submission.task?.title || '알 수 없는 과제'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.score !== null ? (
                      <>
                        <span className="font-mono text-gray-900">
                          {submission.score.toFixed(4)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({metricLabels[submission.task?.evaluation_metric as keyof typeof metricLabels] || submission.task?.evaluation_metric?.toUpperCase()})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">채점 중...</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelativeTime(submission.submitted_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
