import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
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

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ user: null });
    }

    // DB에서 사용자 정보 조회
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (dbError || !dbUser) {
      // DB에 없으면 기본 정보 반환
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata.full_name || authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata.avatar_url || null,
          auth_provider: authUser.app_metadata.provider || 'google',
          is_admin: false,
          created_at: authUser.created_at,
        },
      });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
