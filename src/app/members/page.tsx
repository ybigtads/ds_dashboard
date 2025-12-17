'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

export default function MembersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [cohorts, setCohorts] = useState<string[]>(['all']);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedCohort !== 'all') {
          params.set('cohort', selectedCohort);
        }
        if (searchTerm) {
          params.set('search', searchTerm);
        }

        const res = await fetch(`/api/members?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMembers(data);

          // 기수 목록 추출
          const uniqueCohorts = [...new Set(data.map((m: User) => m.cohort).filter(Boolean))] as number[];
          uniqueCohorts.sort((a, b) => b - a);
          setCohorts(['all', ...uniqueCohorts.map(String)]);
        }
      } catch (error) {
        console.error('Failed to fetch members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user, selectedCohort, searchTerm]);

  const getRoleBadge = (member: User) => {
    if (member.role === 'admin' || member.is_admin) {
      return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>;
    }
    if (member.role === 'creator') {
      return <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Creator</span>;
    }
    return null;
  };

  const getRoleLabel = (member: User) => {
    if (member.role === 'admin' || member.is_admin) return '관리자';
    if (member.role === 'creator') return '과제 제작자';
    return '학회원';
  };

  if (authLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">구성원</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {cohorts.map(cohort => (
            <button
              key={cohort}
              onClick={() => setSelectedCohort(cohort)}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                selectedCohort === cohort
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cohort === 'all' ? '전체' : `${cohort}기`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div
              key={member.id}
              className="bg-white rounded-lg shadow p-4 flex items-center space-x-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-blue-600 font-bold">
                    {(member.name || member.username || '?').charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {member.cohort && `${member.cohort}기 `}
                    {member.name || member.username || '익명'}
                  </span>
                  {getRoleBadge(member)}
                </div>
                <p className="text-sm text-gray-500">
                  {getRoleLabel(member)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
