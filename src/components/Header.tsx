'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const { user, loading, logout, isAdmin, isCreatorOrAbove } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                DS Dashboard
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/docs"
                className={`nav-link ${isActive('/docs') ? 'nav-link-active' : ''}`}
              >
                Docs
              </Link>
              <Link
                href="/tasks"
                className={`nav-link ${isActive('/tasks') ? 'nav-link-active' : ''}`}
              >
                과제
              </Link>
              {user && (
                <Link
                  href="/members"
                  className={`nav-link ${isActive('/members') ? 'nav-link-active' : ''}`}
                >
                  구성원
                </Link>
              )}
              {isCreatorOrAbove && (
                <Link
                  href="/admin/tasks"
                  className={`nav-link ${isActive('/admin') ? 'nav-link-active' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-8 skeleton rounded-lg" />
                <div className="w-8 h-8 skeleton rounded-full" />
              </div>
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/submissions"
                    className="nav-link"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    내 제출
                  </Link>
                </div>

                <div className="hidden sm:block w-px h-6 bg-[var(--border)]" />

                {/* User Profile */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="avatar avatar-md avatar-placeholder">
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                      {user.cohort && user.name ? (
                        <>{user.cohort}기 {user.name}</>
                      ) : (
                        user.username || user.email.split('@')[0]
                      )}
                    </span>
                    {(isAdmin || user.role === 'creator') && (
                      <span className={`text-[10px] font-medium leading-tight ${
                        isAdmin ? 'text-[var(--brand-primary)]' : 'text-[var(--success)]'
                      }`}>
                        {isAdmin ? 'Administrator' : 'Creator'}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Settings */}
                <Link
                  href="/settings"
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                  title="설정"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex btn btn-ghost btn-sm text-[var(--text-tertiary)]"
                >
                  로그아웃
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary btn-sm"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-subtle)] bg-white animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            <Link
              href="/docs"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/docs')
                  ? 'bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Docs
            </Link>
            <Link
              href="/tasks"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/tasks')
                  ? 'bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              과제
            </Link>
            <Link
              href="/members"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/members')
                  ? 'bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              구성원
            </Link>
            <Link
              href="/submissions"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/submissions')
                  ? 'bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              내 제출
            </Link>

            <div className="h-px bg-[var(--border-subtle)] my-2" />

            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:bg-[var(--background-subtle)] w-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
