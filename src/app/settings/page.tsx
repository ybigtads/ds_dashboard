'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState({
    email_notifications: true,
    display_cohort: true,
    display_name_public: true,
    theme: 'light',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 text-sm">
          설정 기능은 곧 완성됩니다. 현재는 미리보기 화면입니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* 알림 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">알림</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">이메일 알림</p>
                <p className="text-sm text-gray-500">새 과제, 공지사항 등의 알림을 이메일로 받습니다.</p>
              </div>
              <button
                onClick={() => handleToggle('email_notifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 프로필 공개 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 공개</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">기수 공개</p>
                <p className="text-sm text-gray-500">다른 사용자에게 기수를 표시합니다.</p>
              </div>
              <button
                onClick={() => handleToggle('display_cohort')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.display_cohort ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.display_cohort ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">이름 공개</p>
                <p className="text-sm text-gray-500">리더보드와 구성원 목록에 이름을 표시합니다.</p>
              </div>
              <button
                onClick={() => handleToggle('display_name_public')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.display_name_public ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.display_name_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 테마 설정 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">테마</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'light'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">☀️</div>
                <p className="font-medium">라이트</p>
              </div>
            </button>
            <button
              onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                settings.theme === 'dark'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🌙</div>
                <p className="font-medium">다크</p>
              </div>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">다크 모드는 곧 지원됩니다.</p>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
