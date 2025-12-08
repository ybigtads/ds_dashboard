'use client';

import Link from 'next/link';
import { CompetitionWithStatus } from '@/types';
import { formatDate, metricLabels } from '@/lib/utils';

interface CompetitionCardProps {
  competition: CompetitionWithStatus;
}

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

export function CompetitionCard({ competition }: CompetitionCardProps) {
  return (
    <Link
      href={`/competitions/${competition.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
          {competition.title}
        </h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${statusColors[competition.status]}`}
        >
          {statusLabels[competition.status]}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {competition.description || 'No description provided'}
      </p>

      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <div>
          <span className="font-medium">Start:</span>{' '}
          {formatDate(competition.start_date)}
        </div>
        <div>
          <span className="font-medium">End:</span>{' '}
          {formatDate(competition.end_date)}
        </div>
        <div>
          <span className="font-medium">Metric:</span>{' '}
          {metricLabels[competition.evaluation_metric]?.split(' ')[0] || competition.evaluation_metric}
        </div>
      </div>
    </Link>
  );
}
