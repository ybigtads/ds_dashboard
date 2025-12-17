'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

export function Header() {
  const { user, loading, logout, isAdmin, isCreatorOrAbove } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              DS Dashboard
            </Link>
            <nav className="hidden md:flex space-x-1">
              <Link href="/docs" className={navLinkClass('/docs')}>
                Docs
              </Link>
              <Link href="/tasks" className={navLinkClass('/tasks')}>
                과제
              </Link>
              {user && (
                <Link href="/members" className={navLinkClass('/members')}>
                  구성원
                </Link>
              )}
              {isCreatorOrAbove && (
                <Link href="/admin/tasks" className={navLinkClass('/admin')}>
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link
                  href="/submissions"
                  className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block"
                >
                  내 제출
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm text-blue-600 font-bold">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600 hidden sm:flex items-center">
                    {user.cohort && user.name ? (
                      <>{user.cohort}기 {user.name}</>
                    ) : (
                      user.username || user.email.split('@')[0]
                    )}
                    {isAdmin && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                    {!isAdmin && user.role === 'creator' && (
                      <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Creator
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-400 hover:text-gray-600"
                  title="설정"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden border-t border-gray-100">
          <nav className="flex justify-around py-2">
            <Link href="/docs" className={`text-xs ${isActive('/docs') ? 'text-blue-600' : 'text-gray-500'}`}>
              Docs
            </Link>
            <Link href="/tasks" className={`text-xs ${isActive('/tasks') ? 'text-blue-600' : 'text-gray-500'}`}>
              과제
            </Link>
            <Link href="/members" className={`text-xs ${isActive('/members') ? 'text-blue-600' : 'text-gray-500'}`}>
              구성원
            </Link>
            <Link href="/submissions" className={`text-xs ${isActive('/submissions') ? 'text-blue-600' : 'text-gray-500'}`}>
              내 제출
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
