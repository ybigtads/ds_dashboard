'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import { signInWithGoogle, signInWithGitHub, signOut as supabaseSignOut } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isCreator: boolean;
  isCreatorOrAbove: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/onboarding'];

function getUserRole(user: Partial<User>): UserRole {
  if (user.role) return user.role;
  return user.is_admin ? 'admin' : 'user';
}

// API를 통해 현재 사용자 정보 가져오기
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Failed to fetch user:', res.status);
      return null;
    }

    const data = await res.json();

    if (data.user) {
      return {
        ...data.user,
        role: getUserRole(data.user),
      } as User;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await fetchCurrentUser();

        if (mounted) {
          setUser(currentUser);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 프로필 미완성 시 온보딩으로 리다이렉트
  useEffect(() => {
    if (loading) return;
    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));
    if (user && !user.profile_completed && !isPublicPath) {
      router.push('/onboarding');
    }
  }, [user, loading, pathname, router]);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const loginWithGitHub = useCallback(async () => {
    await signInWithGitHub();
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    router.push('/');
  }, [router]);

  const userRole = user ? getUserRole(user) : null;
  const isAdmin = userRole === 'admin' || user?.is_admin === true;
  const isCreator = userRole === 'creator';
  const isCreatorOrAbove = isCreator || isAdmin;

  const hasRole = useCallback((roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  }, [userRole]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      loginWithGitHub,
      logout,
      refreshUser,
      isAdmin,
      isCreator,
      isCreatorOrAbove,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
