'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import { formatDate } from '@/lib/utils';

export default function AdminTasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === 'admin') {
      fetchTasks();
    }
  }, [user]);

  const handleDelete = async (slug: string) => {
    if (!confirm('정말로 이 과제를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/tasks/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.slug !== slug));
      } else {
        const data = await res.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (task: Task) => {
    const now = new Date();
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.end_date);

    if (now < startDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">예정</span>;
    } else if (now > endDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">종료</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">진행중</span>;
    }
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">과제 관리</h1>
        <Link
          href="/admin/tasks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          새 과제 만들기
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="animate-pulse p-6">
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">아직 과제가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  과제명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평가 지표
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공개
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  정답 파일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/tasks/${task.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {task.title}
                    </Link>
                    <div className="text-xs text-gray-400">{task.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(task)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(task.start_date)}</div>
                    <div className="text-gray-400">~ {formatDate(task.end_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.evaluation_metric.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {task.is_published ? (
                      <span className="text-green-600">공개</span>
                    ) : (
                      <span className="text-gray-400">비공개</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {task.answer_file_path ? (
                      <span className="text-green-600">업로드됨</span>
                    ) : (
                      <span className="text-red-600">없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/tasks/${task.slug}/edit`}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(task.slug)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
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
