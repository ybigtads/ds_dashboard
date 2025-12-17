import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User, UserRole } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/server';
import { isAdmin as checkIsAdmin, isTaskCreator } from '@/lib/permissions';

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
      // role이 없는 경우 is_admin 기반으로 설정
      const role: UserRole = dbUser.role || (dbUser.is_admin ? 'admin' : 'user');
      return {
        ...dbUser,
        role,
      } as User;
    }

    // DB에 없으면 기본 정보 반환
    return {
      id: authUser.id,
      email: authUser.email!,
      username: authUser.user_metadata.full_name || authUser.email?.split('@')[0] || null,
      avatar_url: authUser.user_metadata.avatar_url || null,
      auth_provider: (authUser.app_metadata.provider as 'google' | 'github') || 'google',
      role: 'user',
      is_admin: false,
      cohort: null,
      name: null,
      profile_completed: false,
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
  if (!checkIsAdmin(session)) {
    throw new Error('Admin access required');
  }
  return session;
}

// 특정 역할 필수 (여러 역할 중 하나)
export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const session = await requireAuth();

  // role이 없는 경우 is_admin 기반으로 확인
  const userRole = session.role || (session.is_admin ? 'admin' : 'user');

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Required role: ${allowedRoles.join(' or ')}`);
  }

  return session;
}

// Creator 이상 권한 필수 (Creator 또는 Admin)
export async function requireCreatorOrAbove(): Promise<User> {
  return requireRole(['creator', 'admin']);
}

// 특정 과제에 대한 권한 확인 (Creator 또는 Admin)
export async function requireTaskAccess(taskId: string): Promise<User> {
  const session = await requireAuth();

  // Admin은 모든 과제 접근 가능
  if (checkIsAdmin(session)) {
    return session;
  }

  // Creator 역할이 있고, 해당 과제의 Creator인 경우
  if (session.role === 'creator' || session.role === 'admin') {
    const hasAccess = await isTaskCreator(session.id, taskId);
    if (hasAccess) {
      return session;
    }
  }

  throw new Error('Access denied for this task');
}

// 특정 과제의 수정 권한 확인
export async function requireTaskEditAccess(taskId: string): Promise<User> {
  return requireTaskAccess(taskId);
}

// 사용자가 로그인된 상태인지 확인 (에러 없이 boolean 반환)
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

// 사용자의 역할 확인 (에러 없이 역할 반환)
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getSession();
  if (!session) return null;
  return session.role || (session.is_admin ? 'admin' : 'user');
}
