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
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

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
      {task.description ? (
        <MarkdownRenderer content={task.description} />
      ) : (
        <p className="text-gray-500">설명이 없습니다.</p>
      )}
    </div>
  );
}

// Data Tab
function DataTab({ task }: { task: Task }) {
  const hasData = task.data_description || (task.data_files && task.data_files.length > 0) || task.data_download_url;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">데이터 준비 중</h3>
        <p className="text-[var(--text-tertiary)] text-center max-w-sm">
          아직 데이터가 등록되지 않았습니다.<br />곧 업데이트될 예정입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 데이터 설명 섹션 */}
      {task.data_description && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">데이터 설명</h2>
          <MarkdownRenderer content={task.data_description} />
        </section>
      )}

      {/* 다운로드 파일 섹션 */}
      {task.data_files && task.data_files.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">다운로드 파일</h2>
          <div className="grid gap-3">
            {task.data_files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                download
                className="group flex items-center p-4 bg-[var(--background-subtle)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--brand-primary)]/30 hover:bg-gradient-to-r hover:from-[var(--brand-primary)]/5 hover:to-transparent transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center mr-4 group-hover:bg-[var(--brand-primary)]/20 transition-colors">
                  <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)] transition-colors">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {file.size >= 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(file.size / 1024).toFixed(1)} KB`
                    }
                  </p>
                </div>
                <svg className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 외부 다운로드 링크 섹션 */}
      {task.data_download_url && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">외부 다운로드</h2>
          <a
            href={task.data_download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium rounded-lg hover:bg-[var(--brand-primary)]/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            데이터 다운로드 링크
          </a>
        </section>
      )}
    </div>
  );
}

// Code Tab
function CodeTab({ task }: { task: Task }) {
  const hasCode = task.code_description || task.code_git_url || task.code_vessl_guide;

  if (!hasCode) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">코드 가이드 준비 중</h3>
        <p className="text-[var(--text-tertiary)] text-center max-w-sm">
          아직 코드 가이드가 등록되지 않았습니다.<br />곧 업데이트될 예정입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 코드 가이드 설명 섹션 */}
      {task.code_description && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">코드 가이드</h2>
          <MarkdownRenderer content={task.code_description} />
        </section>
      )}

      {/* Git Repository 섹션 */}
      {task.code_git_url && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Git Repository</h2>
          <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-[#1e293b]">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1e293b] border-b border-[#334155]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              </div>
              <span className="text-xs text-[#64748b] ml-2">terminal</span>
            </div>
            {/* Terminal content */}
            <div className="p-4">
              <code className="text-[#34d399] text-sm font-mono">
                git clone {task.code_git_url}
              </code>
            </div>
          </div>
          <a
            href={task.code_git_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[var(--text-primary)] text-white font-medium text-sm rounded-lg hover:bg-[var(--text-secondary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub에서 보기
          </a>
        </section>
      )}

      {/* VESSL GPU 가이드 섹션 */}
      {task.code_vessl_guide && (
        <section>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">VESSL GPU 가이드</h2>
          <div className="bg-gradient-to-br from-[var(--brand-accent)]/5 to-[var(--brand-primary)]/5 border border-[var(--brand-accent)]/20 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-accent)]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--brand-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[var(--brand-accent)]">GPU 컴퓨팅 환경</span>
            </div>
            <MarkdownRenderer content={task.code_vessl_guide} />
          </div>
        </section>
      )}
    </div>
  );
}

