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
  const [editBio, setEditBio] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [editLinkedinUrl, setEditLinkedinUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      setEditCohort(user.cohort?.toString() || '');
      setEditName(user.name || '');
      setEditBio((user as any).bio || '');
      setEditGithubUrl((user as any).github_url || '');
      setEditLinkedinUrl((user as any).linkedin_url || '');
      fetchAwards();
    }
  }, [user]);

  const validateGithubUrl = (url: string): boolean => {
    if (!url) return true; // 빈 값 허용
    return /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/.test(url);
  };

  const validateLinkedinUrl = (url: string): boolean => {
    if (!url) return true; // 빈 값 허용
    return /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/.test(url);
  };

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

    if (editBio.length > 500) {
      alert('자기소개는 500자 이내로 입력해주세요.');
      return;
    }

    if (editGithubUrl && !validateGithubUrl(editGithubUrl)) {
      alert('올바른 GitHub URL 형식이 아닙니다. (예: https://github.com/username)');
      return;
    }

    if (editLinkedinUrl && !validateLinkedinUrl(editLinkedinUrl)) {
      alert('올바른 LinkedIn URL 형식이 아닙니다. (예: https://linkedin.com/in/username)');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          cohort: cohortNum,
          name: editName.trim(),
          bio: editBio.trim() || null,
          github_url: editGithubUrl.trim() || null,
          linkedin_url: editLinkedinUrl.trim() || null,
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
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">자기소개</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                      placeholder="간단한 자기소개를 입력해주세요"
                    />
                    <div className="text-xs text-gray-400 text-right">{editBio.length}/500</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      value={editGithubUrl}
                      onChange={(e) => setEditGithubUrl(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={editLinkedinUrl}
                      onChange={(e) => setEditLinkedinUrl(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="https://linkedin.com/in/username"
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
                        setEditBio((user as any).bio || '');
                        setEditGithubUrl((user as any).github_url || '');
                        setEditLinkedinUrl((user as any).linkedin_url || '');
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
                  <div className="flex items-center space-x-2 mt-1">
                    {user.is_admin && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    {(user as any).github_url && (
                      <a
                        href={(user as any).github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-700"
                        title="GitHub"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                    {(user as any).linkedin_url && (
                      <a
                        href={(user as any).linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600"
                        title="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                  {(user as any).bio && (
                    <p className="text-sm text-gray-600 mt-2 max-w-md">{(user as any).bio}</p>
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
