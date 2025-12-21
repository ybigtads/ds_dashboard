'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Task, LeaderboardEntry } from '@/types';
import { formatDate, metricLabels, getTaskStatus, statusLabels } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Leaderboard } from '@/components/Leaderboard';
import { SubmissionForm } from '@/components/SubmissionForm';
import { BoardTab } from '@/components/board/BoardTab';
import { QuestionsTab } from '@/components/questions/QuestionsTab';
import { TaskHeader } from '@/components/tasks/TaskHeader';

interface Props {
  params: Promise<{ slug: string }>;
}

type TabType = 'overview' | 'data' | 'code' | 'board' | 'questions' | 'leaderboard' | 'submit';

const TAB_CONFIG: { key: TabType; label: string; requiresAuth?: boolean }[] = [
  { key: 'overview', label: '개요' },
  { key: 'data', label: '데이터' },
  { key: 'code', label: '코드' },
  { key: 'board', label: '게시판' },
  { key: 'questions', label: '질문' },
  { key: 'leaderboard', label: '리더보드' },
  { key: 'submit', label: '제출', requiresAuth: true },
];

export default function TaskDetailPage({ params }: Props) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [task, setTask] = useState<Task | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTab = (searchParams.get('tab') as TabType) || 'overview';

  const fetchData = async () => {
    try {
      const [taskRes, lbRes] = await Promise.all([
        fetch(`/api/tasks/${slug}`),
        fetch(`/api/tasks/${slug}/leaderboard`),
      ]);

      const taskData = await taskRes.json();
      const lbData = await lbRes.json();

      setTask(taskData.task);
      setLeaderboard(lbData.leaderboard || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const handleTabChange = (tab: TabType) => {
    router.push(`/tasks/${slug}?tab=${tab}`);
  };

  const handleSubmitClick = () => {
    if (user) {
      handleTabChange('submit');
    } else {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">과제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const status = getTaskStatus(task);
  const canSubmit = status === 'active' && user;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dacon 스타일 헤더 */}
      <TaskHeader
        task={task}
        status={status}
        participantCount={leaderboard.length}
        canSubmit={!!canSubmit}
        onSubmitClick={handleSubmitClick}
      />

      {/* 탭 + 콘텐츠 영역 */}
      <div className="bg-white rounded-lg shadow-lg mt-4 overflow-hidden">
        {/* Dacon 스타일 탭 */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
            {TAB_CONFIG.map(({ key, label, requiresAuth }) => {
              if (requiresAuth && !user) return null;

              return (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`dacon-tab ${currentTab === key ? 'dacon-tab-active' : ''}`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {currentTab === 'overview' && (
            <OverviewTab task={task} />
          )}

          {currentTab === 'data' && (
            <DataTab task={task} />
          )}

          {currentTab === 'code' && (
            <CodeTab task={task} />
          )}

          {currentTab === 'board' && (
            <BoardTab taskSlug={slug} />
          )}

          {currentTab === 'questions' && (
            <QuestionsTab taskSlug={slug} />
          )}

          {currentTab === 'leaderboard' && (
            <Leaderboard
              entries={leaderboard}
              metric={task.evaluation_metric}
            />
          )}

          {currentTab === 'submit' && (
            canSubmit ? (
              <SubmissionForm
                taskSlug={slug}
                onSuccess={fetchData}
              />
            ) : (
              <div className="text-center py-8">
                {!user ? (
                  <p className="text-gray-500">제출하려면 로그인이 필요합니다.</p>
                ) : status === 'upcoming' ? (
                  <p className="text-gray-500">아직 시작하지 않은 과제입니다.</p>
                ) : (
                  <p className="text-gray-500">종료된 과제입니다.</p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ task }: { task: Task }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">과제 설명</h2>
      <div className="prose max-w-none">
        <p className="text-gray-600 whitespace-pre-wrap">
          {task.description || '설명이 없습니다.'}
        </p>
      </div>
    </div>
  );
}

// Data Tab
function DataTab({ task }: { task: Task }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">데이터 설명</h2>
        {task.data_description ? (
          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-wrap">{task.data_description}</p>
          </div>
        ) : (
          <p className="text-gray-500">데이터 설명이 없습니다.</p>
        )}
      </div>

      {task.data_files && task.data_files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">다운로드 파일</h3>
          <div className="space-y-2">
            {task.data_files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                download
                className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {task.data_download_url && (
        <div>
          <h3 className="text-lg font-semibold mb-3">외부 다운로드</h3>
          <a
            href={task.data_download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            데이터 다운로드 링크
          </a>
        </div>
      )}

      {!task.data_description && (!task.data_files || task.data_files.length === 0) && !task.data_download_url && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">📁</div>
          <p className="text-gray-500">아직 데이터가 등록되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}

// Code Tab
function CodeTab({ task }: { task: Task }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">코드 가이드</h2>
        {task.code_description ? (
          <div className="prose max-w-none">
            <p className="text-gray-600 whitespace-pre-wrap">{task.code_description}</p>
          </div>
        ) : (
          <p className="text-gray-500">코드 설명이 없습니다.</p>
        )}
      </div>

      {task.code_git_url && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Git Repository</h3>
          <div className="bg-gray-900 rounded-lg p-4">
            <code className="text-green-400 text-sm">
              git clone {task.code_git_url}
            </code>
          </div>
          <a
            href={task.code_git_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            GitHub에서 보기
          </a>
        </div>
      )}

      {task.code_vessl_guide && (
        <div>
          <h3 className="text-lg font-semibold mb-3">VESSL GPU 가이드</h3>
          <div className="prose max-w-none bg-blue-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{task.code_vessl_guide}</p>
          </div>
        </div>
      )}

      {!task.code_description && !task.code_git_url && !task.code_vessl_guide && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-3">💻</div>
          <p className="text-gray-500">아직 코드 가이드가 등록되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}

