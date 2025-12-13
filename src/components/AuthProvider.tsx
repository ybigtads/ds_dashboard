'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { supabase, signInWithGoogle, signInWithGitHub, signOut as supabaseSignOut } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Supabase Auth User를 앱의 User 타입으로 변환
async function syncUserToDatabase(supabaseUser: SupabaseUser): Promise<User> {
  const provider = supabaseUser.app_metadata.provider as 'google' | 'github';
  const email = supabaseUser.email!;
  const avatarUrl = supabaseUser.user_metadata.avatar_url || null;
  const username = supabaseUser.user_metadata.full_name ||
                   supabaseUser.user_metadata.name ||
                   email.split('@')[0];

  // DB에 사용자 정보 upsert (없으면 생성, 있으면 업데이트)
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: supabaseUser.id,
      email,
      username,
      avatar_url: avatarUrl,
      auth_provider: provider,
      provider_id: supabaseUser.id,
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
      created_at: new Date().toISOString(),
    };
  }

  return data as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const loginWithGitHub = async () => {
    await signInWithGitHub();
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithGitHub, logout }}>
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
