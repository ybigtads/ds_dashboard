'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const [cohort, setCohort] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 이미 프로필이 완성된 사용자는 competitions로 이동
    if (user?.profile_completed) {
      router.push('/competitions');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cohort || !name.trim()) {
      setError('기수와 이름을 모두 입력해주세요.');
      return;
    }

    const cohortNum = parseInt(cohort);
    if (isNaN(cohortNum) || cohortNum < 1 || cohortNum > 100) {
      setError('올바른 기수를 입력해주세요. (1-100)');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          cohort: cohortNum,
          name: name.trim(),
          profile_completed: true,
        })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('프로필 업데이트에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      // AuthProvider의 사용자 정보 갱신
      await refreshUser();

      router.push('/competitions');
    } catch (err) {
      console.error('Profile update error:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            프로필 설정
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            서비스 이용을 위해 추가 정보를 입력해주세요.
          </p>
        </div>

        {user.avatar_url && (
          <div className="flex justify-center">
            <img
              src={user.avatar_url}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-blue-100"
            />
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          {user.email}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="cohort" className="block text-sm font-medium text-gray-700">
              기수
            </label>
            <div className="mt-1 relative">
              <input
                id="cohort"
                type="number"
                min="1"
                max="100"
                required
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="26"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-400">기</span>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
