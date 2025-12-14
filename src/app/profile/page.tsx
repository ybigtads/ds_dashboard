'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { Award, Competition } from '@/types';

interface AwardWithCompetition extends Award {
  competitions: Competition | null;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [awards, setAwards] = useState<AwardWithCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editCohort, setEditCohort] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      setEditCohort(user.cohort?.toString() || '');
      setEditName(user.name || '');
      fetchAwards();
    }
  }, [user]);

  const fetchAwards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('awards')
        .select(`
          *,
          competitions (
            id,
            title,
            description,
            start_date,
            end_date
          )
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) {
        console.error('Error fetching awards:', error);
        return;
      }

      setAwards(data as AwardWithCompetition[]);
    } catch (error) {
      console.error('Error fetching awards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const cohortNum = parseInt(editCohort);
    if (isNaN(cohortNum) || cohortNum < 1 || cohortNum > 100) {
      alert('올바른 기수를 입력해주세요. (1-100)');
      return;
    }

    if (!editName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          cohort: cohortNum,
          name: editName.trim(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('프로필 업데이트에 실패했습니다.');
        return;
      }

      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const filteredAwards = awards.filter(award => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      award.title.toLowerCase().includes(query) ||
      award.description?.toLowerCase().includes(query) ||
      award.competitions?.title.toLowerCase().includes(query)
    );
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-blue-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl text-blue-600 font-bold">
                  {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editCohort}
                      onChange={(e) => setEditCohort(e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="기수"
                    />
                    <span className="text-gray-500">기</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="이름"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditCohort(user.cohort?.toString() || '');
                        setEditName(user.name || '');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.cohort && user.name ? (
                      <>{user.cohort}기 {user.name}</>
                    ) : (
                      user.username || user.email.split('@')[0]
                    )}
                  </h1>
                  <p className="text-gray-500">{user.email}</p>
                  {user.is_admin && (
                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              프로필 수정
            </button>
          )}
        </div>
      </div>

      {/* 수상 내역 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">수상 내역</h2>
          <span className="text-sm text-gray-500">{awards.length}개</span>
        </div>

        {/* 검색 */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="수상 내역 검색..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? '검색 결과가 없습니다.' : '아직 수상 내역이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAwards.map((award) => (
              <div
                key={award.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {award.rank && award.rank <= 3 && (
                        <span className="text-xl">
                          {award.rank === 1 && '🥇'}
                          {award.rank === 2 && '🥈'}
                          {award.rank === 3 && '🥉'}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900">{award.title}</h3>
                    </div>
                    {award.competitions && (
                      <p className="text-sm text-blue-600 mt-1">
                        {award.competitions.title}
                      </p>
                    )}
                    {award.description && (
                      <p className="text-sm text-gray-500 mt-1">{award.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(award.awarded_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
