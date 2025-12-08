'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              DS Dashboard
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/competitions"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Competitions
              </Link>
              {user?.is_admin && (
                <Link
                  href="/admin/competitions"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
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
                <span className="text-sm text-gray-600">
                  {user.username}
                  {user.is_admin && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
