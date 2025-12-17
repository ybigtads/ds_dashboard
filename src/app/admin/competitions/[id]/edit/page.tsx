'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Competition, EvaluationMetric } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditCompetitionPage({ params }: Props) {
  const { id } = use(params);
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
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [hasAnswerFile, setHasAnswerFile] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchCompetition() {
      try {
        const res = await fetch(`/api/competitions/${id}`);
        const data = await res.json();
        const comp: Competition = data.competition;

        setTitle(comp.title);
        setDescription(comp.description || '');
        setStartDate(comp.start_date.slice(0, 16));
        setEndDate(comp.end_date.slice(0, 16));
        setMetric(comp.evaluation_metric || 'rmse');
        setHasAnswerFile(!!comp.answer_file_path);
      } catch (error) {
        console.error('Error fetching competition:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user?.is_admin) {
      fetchCompetition();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/competitions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          evaluation_metric: metric,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update competition');
      }

      // Upload new answer file if provided
      if (answerFile) {
        const formData = new FormData();
        formData.append('file', answerFile);

        await fetch(`/api/competitions/${id}/answer`, {
          method: 'POST',
          body: formData,
        });
      }

      router.push('/admin/competitions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update competition');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || !user?.is_admin) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Competition</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
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
            Description
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
              Start Date *
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
              End Date *
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

        <div>
          <label htmlFor="metric" className="block text-sm font-medium text-gray-700">
            Evaluation Metric *
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
            <option value="map50">mAP@0.5 (Object Detection)</option>
          </select>
        </div>

        <div>
          <label htmlFor="answerFile" className="block text-sm font-medium text-gray-700">
            Answer File (CSV)
          </label>
          {hasAnswerFile && (
            <p className="text-sm text-green-600 mb-2">Answer file already uploaded.</p>
          )}
          <input
            type="file"
            id="answerFile"
            accept=".csv"
            onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload a new file to replace the existing answer file.
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
