'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import { supabase, signInWithGoogle, signInWithGitHub, signOut as supabaseSignOut } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 온보딩이 필요없는 경로들
const PUBLIC_PATHS = ['/login', '/register', '/auth/callback', '/onboarding'];

// Supabase Auth User를 앱의 User 타입으로 변환하고 DB에 동기화
async function syncUserToDatabase(supabaseUser: SupabaseUser): Promise<User> {
  const provider = (supabaseUser.app_metadata.provider as 'google' | 'github') || 'google';
  const email = supabaseUser.email || '';
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;
  const username = supabaseUser.user_metadata?.full_name ||
                   supabaseUser.user_metadata?.name ||
                   email.split('@')[0] || 'User';

  // 먼저 기존 사용자 정보 조회
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  if (existingUser) {
    // 기존 사용자면 그대로 반환
    return existingUser as User;
  }

  // 신규 사용자면 생성
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: supabaseUser.id,
      email,
      username,
      avatar_url: avatarUrl,
      auth_provider: provider,
      provider_id: supabaseUser.id,
      profile_completed: false,
    }, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to sync user to database:', error);
    // DB 동기화 실패해도 기본 정보 반환
    return {
      id: supabaseUser.id,
      email,
      username,
      avatar_url: avatarUrl,
      auth_provider: provider,
      is_admin: false,
      cohort: null,
      name: null,
      profile_completed: false,
      created_at: new Date().toISOString(),
    };
  }

  return data as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // DB에서 최신 사용자 정보 조회
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (dbUser) {
          setUser(dbUser as User);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  useEffect(() => {
    // 초기 세션 확인
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = await syncUserToDatabase(session.user);
          setUser(appUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Auth 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const appUser = await syncUserToDatabase(session.user);
        setUser(appUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 프로필 완성 여부 체크 및 온보딩 리다이렉트
  useEffect(() => {
    if (loading) return;

    const isPublicPath = PUBLIC_PATHS.some(path => pathname?.startsWith(path));

    if (user && !user.profile_completed && !isPublicPath) {
      router.push('/onboarding');
    }
  }, [user, loading, pathname, router]);

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const loginWithGitHub = async () => {
    await signInWithGitHub();
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithGitHub, logout, refreshUser }}>
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
