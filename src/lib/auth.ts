import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/server';

// 서버 사이드에서 Supabase 클라이언트 생성
async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
}

// 현재 세션의 사용자 정보 가져오기
export async function getSession(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
      return null;
    }

    // DB에서 사용자 정보 조회
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbUser) {
      return dbUser as User;
    }

    // DB에 없으면 기본 정보 반환
    return {
      id: authUser.id,
      email: authUser.email!,
      username: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || null,
      avatar_url: authUser.user_metadata.avatar_url || null,
      auth_provider: (authUser.app_metadata.provider as 'google' | 'github') || 'google',
      is_admin: false,
      created_at: authUser.created_at,
    };
  } catch {
    return null;
  }
}

// 인증 필수 - 없으면 에러
export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

// 관리자 권한 필수
export async function requireAdmin(): Promise<User> {
  const session = await requireAuth();
  if (!session.is_admin) {
    throw new Error('Admin access required');
  }
  return session;
}
