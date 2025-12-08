'use client';

import { useEffect, useState, use } from 'react';
import { Competition, LeaderboardEntry } from '@/types';
import { formatDate, formatDateTime, metricLabels, getCompetitionStatus } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { Leaderboard } from '@/components/Leaderboard';
import { SubmissionForm } from '@/components/SubmissionForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CompetitionDetailPage({ params }: Props) {
  const { id } = use(params);
  const { user } = useAuth();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'submit'>('overview');

  const fetchData = async () => {
    try {
      const [compRes, lbRes] = await Promise.all([
        fetch(`/api/competitions/${id}`),
        fetch(`/api/competitions/${id}/leaderboard`),
      ]);

      const compData = await compRes.json();
      const lbData = await lbRes.json();

      setCompetition(compData.competition);
      setLeaderboard(lbData.leaderboard || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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

  if (!competition) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Competition not found</p>
      </div>
    );
  }

  const status = getCompetitionStatus(competition);
  const canSubmit = status === 'active' && user;

  const statusColors = {
    upcoming: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    active: 'Active',
    ended: 'Ended',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{competition.title}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start Date</span>
              <p className="font-medium">{formatDate(competition.start_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">End Date</span>
              <p className="font-medium">{formatDate(competition.end_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">Evaluation Metric</span>
              <p className="font-medium">{metricLabels[competition.evaluation_metric]}</p>
            </div>
            <div>
              <span className="text-gray-500">Participants</span>
              <p className="font-medium">{leaderboard.length}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['overview', 'leaderboard', 'submit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">
                  {competition.description || 'No description provided.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard
              entries={leaderboard}
              metric={competition.evaluation_metric}
            />
          )}

          {activeTab === 'submit' && (
            canSubmit ? (
              <SubmissionForm
                competitionId={competition.id}
                onSuccess={fetchData}
              />
            ) : (
              <div className="text-center py-8">
                {!user ? (
                  <p className="text-gray-500">Please log in to submit predictions.</p>
                ) : status === 'upcoming' ? (
                  <p className="text-gray-500">This competition has not started yet.</p>
                ) : (
                  <p className="text-gray-500">This competition has ended.</p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
