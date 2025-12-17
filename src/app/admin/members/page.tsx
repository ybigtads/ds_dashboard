'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { User, UserRole } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminMembersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (cohortFilter !== 'all') params.set('cohort', cohortFilter);

        const res = await fetch(`/api/admin/members?${params}`);
        const data = await res.json();
        setMembers(data.members || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentUser?.role === 'admin') {
      fetchMembers();
    }
  }, [currentUser, search, roleFilter, cohortFilter]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      alert('자신의 역할은 변경할 수 없습니다.');
      return;
    }

    setUpdating(userId);

    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (res.ok) {
        const { user } = await res.json();
        setMembers(members.map(m => m.id === userId ? user : m));
      } else {
        const data = await res.json();
        alert(data.error || '역할 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Admin</span>;
      case 'creator':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Creator</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">User</span>;
    }
  };

  // 고유 기수 목록 추출
  const cohorts = [...new Set(members.map(m => m.cohort).filter((c): c is number => c !== null))].sort((a, b) => b - a);

  if (authLoading || currentUser?.role !== 'admin') {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">구성원 관리</h1>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 이메일로 검색..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              <option value="admin">Admin</option>
              <option value="creator">Creator</option>
              <option value="user">User</option>
            </select>
          </div>

          <div>
            <label htmlFor="cohortFilter" className="block text-sm font-medium text-gray-700 mb-1">
              기수
            </label>
            <select
              id="cohortFilter"
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">전체</option>
              {cohorts.map(c => (
                <option key={c} value={c}>{c}기</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="bg-white rounded-lg shadow">
          <div className="animate-pulse p-6">
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로필
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할 변경
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className={member.id === currentUser?.id ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">
                            {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.name || member.username || '이름 없음'}
                          {member.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-blue-600">(나)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.cohort ? `${member.cohort}기` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {member.profile_completed ? (
                      <span className="text-green-600">완료</span>
                    ) : (
                      <span className="text-yellow-600">미완료</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRelativeTime(member.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {member.id === currentUser?.id ? (
                      <span className="text-gray-400">-</span>
                    ) : updating === member.id ? (
                      <span className="text-gray-400">변경 중...</span>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="creator">Creator</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        총 {members.length}명의 구성원
      </div>
    </div>
  );
}
