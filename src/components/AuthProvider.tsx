'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import { createClient, signInWithGoogle, signInWithGitHub, signOut as supabaseSignOut } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

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

async function fetchUserFromDB(supabase: ReturnType<typeof createClient>, userId: string): Promise<User | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (data) {
    return { ...data, role: getUserRole(data) } as User;
  }
  return null;
}

async function syncUserToDatabase(supabase: ReturnType<typeof createClient>, supabaseUser: SupabaseUser): Promise<User> {
  const provider = (supabaseUser.app_metadata.provider as 'google' | 'github') || 'google';
  const email = supabaseUser.email || '';
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;
  const username = supabaseUser.user_metadata?.full_name ||
                   supabaseUser.user_metadata?.name ||
                   email.split('@')[0] || 'User';

  // 기존 사용자 확인
  const existingUser = await fetchUserFromDB(supabase, supabaseUser.id);
  if (existingUser) {
    return existingUser;
  }

  // 신규 사용자 생성
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: supabaseUser.id,
      email,
      username,
      avatar_url: avatarUrl,
      auth_provider: provider,
      provider_id: supabaseUser.id,
      role: 'user',
      profile_completed: false,
    }, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to sync user:', error);
    return {
      id: supabaseUser.id,
      email,
      username,
      avatar_url: avatarUrl,
      auth_provider: provider,
      role: 'user',
      is_admin: false,
      cohort: null,
      name: null,
      profile_completed: false,
      created_at: new Date().toISOString(),
    };
  }

  return { ...data, role: getUserRole(data) } as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const dbUser = await fetchUserFromDB(supabase, authUser.id);
      if (dbUser) {
        setUser(dbUser);
      }
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const initAuth = async () => {
      try {
        // getUser는 서버에서 세션을 검증 (getSession보다 안전)
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Auth error:', error.message);
          setUser(null);
          setLoading(false);
          return;
        }

        if (authUser) {
          const appUser = await syncUserToDatabase(supabase, authUser);
          setUser(appUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Auth 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          const appUser = await syncUserToDatabase(supabase, session.user);
          setUser(appUser);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // 토큰 갱신 시 사용자 정보 다시 로드
          const dbUser = await fetchUserFromDB(supabase, session.user.id);
          if (dbUser) {
            setUser(dbUser);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
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
    await supabaseSignOut();
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
