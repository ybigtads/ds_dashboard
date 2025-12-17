'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Task, EvaluationMetric } from '@/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function EditTaskPage({ params }: Props) {
  const { slug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [metric, setMetric] = useState<EvaluationMetric>('rmse');
  const [isPublished, setIsPublished] = useState(true);
  const [maxSubmissions, setMaxSubmissions] = useState(5);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [hasAnswerFile, setHasAnswerFile] = useState(false);

  // 커스텀 채점
  const [useCustomScoring, setUseCustomScoring] = useState(false);
  const [customScoringCode, setCustomScoringCode] = useState('');

  // 새 필드들
  const [dataDescription, setDataDescription] = useState('');
  const [dataDownloadUrl, setDataDownloadUrl] = useState('');
  const [codeDescription, setCodeDescription] = useState('');
  const [codeGitUrl, setCodeGitUrl] = useState('');
  const [codeVesslGuide, setCodeVesslGuide] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchTask() {
      try {
        const res = await fetch(`/api/tasks/${slug}`);
        const data = await res.json();
        const task: Task = data.task;

        setTitle(task.title);
        setDescription(task.description || '');
        setStartDate(task.start_date.slice(0, 16));
        setEndDate(task.end_date.slice(0, 16));
        setMetric(task.evaluation_metric || 'rmse');
        setIsPublished(task.is_published);
        setMaxSubmissions(task.max_submissions_per_day || 5);
        setHasAnswerFile(!!task.answer_file_path);
        setUseCustomScoring(task.use_custom_scoring || false);
        setCustomScoringCode(task.custom_scoring_code || '');
        setDataDescription(task.data_description || '');
        setDataDownloadUrl(task.data_download_url || '');
        setCodeDescription(task.code_description || '');
        setCodeGitUrl(task.code_git_url || '');
        setCodeVesslGuide(task.code_vessl_guide || '');
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('과제를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === 'admin') {
      fetchTask();
    }
  }, [slug, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/tasks/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          evaluation_metric: useCustomScoring ? null : metric,
          is_published: isPublished,
          max_submissions_per_day: maxSubmissions,
          use_custom_scoring: useCustomScoring,
          custom_scoring_code: useCustomScoring ? customScoringCode : null,
          data_description: dataDescription || null,
          data_download_url: dataDownloadUrl || null,
          code_description: codeDescription || null,
          code_git_url: codeGitUrl || null,
          code_vessl_guide: codeVesslGuide || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '과제 수정에 실패했습니다.');
      }

      // Upload new answer file if provided
      if (answerFile) {
        const formData = new FormData();
        formData.append('file', answerFile);

        await fetch(`/api/tasks/${slug}/answer`, {
          method: 'POST',
          body: formData,
        });
      }

      router.push('/admin/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : '과제 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">과제 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">기본 정보</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              과제명 *
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              과제 설명
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                시작일 *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                종료일 *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 채점 방식 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              채점 방식 *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scoringType"
                  checked={!useCustomScoring}
                  onChange={() => setUseCustomScoring(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">기본 지표</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scoringType"
                  checked={useCustomScoring}
                  onChange={() => setUseCustomScoring(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">커스텀 함수</span>
              </label>
            </div>
          </div>

          {!useCustomScoring ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="metric" className="block text-sm font-medium text-gray-700">
                  평가 지표 *
                </label>
                <select
                  id="metric"
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as EvaluationMetric)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rmse">RMSE (Root Mean Squared Error)</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="f1">F1 Score</option>
                  <option value="auc">AUC (Area Under Curve)</option>
                </select>
              </div>

              <div>
                <label htmlFor="maxSubmissions" className="block text-sm font-medium text-gray-700">
                  일일 제출 제한
                </label>
                <input
                  type="number"
                  id="maxSubmissions"
                  min="1"
                  max="100"
                  value={maxSubmissions}
                  onChange={(e) => setMaxSubmissions(parseInt(e.target.value) || 5)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="maxSubmissions" className="block text-sm font-medium text-gray-700">
                  일일 제출 제한
                </label>
                <input
                  type="number"
                  id="maxSubmissions"
                  min="1"
                  max="100"
                  value={maxSubmissions}
                  onChange={(e) => setMaxSubmissions(parseInt(e.target.value) || 5)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="customScoringCode" className="block text-sm font-medium text-gray-700">
                  채점 함수 (JavaScript)
                </label>
                <textarea
                  id="customScoringCode"
                  rows={15}
                  value={customScoringCode}
                  onChange={(e) => setCustomScoringCode(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="function score(answer, submission) { ... }"
                />
                <p className="mt-1 text-xs text-gray-500">
                  answer와 submission은 CSV를 파싱한 객체 배열입니다. 점수(숫자)를 반환하세요.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
              공개 (체크 해제시 비공개)
            </label>
          </div>
        </div>

        {/* 데이터 정보 */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">데이터 정보</h2>

          <div>
            <label htmlFor="dataDescription" className="block text-sm font-medium text-gray-700">
              데이터 설명
            </label>
            <textarea
              id="dataDescription"
              rows={4}
              value={dataDescription}
              onChange={(e) => setDataDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="dataDownloadUrl" className="block text-sm font-medium text-gray-700">
              데이터 다운로드 URL
            </label>
            <input
              type="url"
              id="dataDownloadUrl"
              value={dataDownloadUrl}
              onChange={(e) => setDataDownloadUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="answerFile" className="block text-sm font-medium text-gray-700">
              정답 파일 (CSV)
            </label>
            {hasAnswerFile && (
              <p className="text-sm text-green-600 mb-2">정답 파일이 업로드되어 있습니다.</p>
            )}
            <input
              type="file"
              id="answerFile"
              accept=".csv"
              onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              새 파일을 업로드하면 기존 파일이 교체됩니다.
            </p>
          </div>
        </div>

        {/* 코드 가이드 */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">코드 가이드</h2>

          <div>
            <label htmlFor="codeDescription" className="block text-sm font-medium text-gray-700">
              코드 가이드 설명
            </label>
            <textarea
              id="codeDescription"
              rows={4}
              value={codeDescription}
              onChange={(e) => setCodeDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="codeGitUrl" className="block text-sm font-medium text-gray-700">
              GitHub 저장소 URL
            </label>
            <input
              type="url"
              id="codeGitUrl"
              value={codeGitUrl}
              onChange={(e) => setCodeGitUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="codeVesslGuide" className="block text-sm font-medium text-gray-700">
              VESSL 가이드
            </label>
            <textarea
              id="codeVesslGuide"
              rows={3}
              value={codeVesslGuide}
              onChange={(e) => setCodeVesslGuide(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      </form>
    </div>
  );
}
