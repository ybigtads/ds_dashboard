'use client';

import { useEffect, useState } from 'react';
import { Competition, CompetitionWithStatus } from '@/types';
import { CompetitionCard } from '@/components/CompetitionCard';
import { addStatusToCompetition } from '@/lib/utils';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<CompetitionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        const res = await fetch('/api/competitions');
        const data = await res.json();
        const withStatus = data.competitions.map((c: Competition) =>
          addStatusToCompetition(c)
        );
        setCompetitions(withStatus);
      } catch (error) {
        console.error('Error fetching competitions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompetitions();
  }, []);

  const filteredCompetitions =
    filter === 'all'
      ? competitions
      : competitions.filter((c) => c.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Competitions</h1>
        <div className="flex gap-2">
          {(['all', 'active', 'upcoming', 'ended'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No competitions found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      )}
    </div>
  );
}
