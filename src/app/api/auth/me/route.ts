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
      // DB에 없으면 생성
      const provider = (authUser.app_metadata.provider as 'google' | 'github') || 'google';
      const email = authUser.email || '';
      const avatarUrl = authUser.user_metadata?.avatar_url || null;
      const username = authUser.user_metadata?.full_name ||
                       authUser.user_metadata?.name ||
                       email.split('@')[0] || 'User';

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.id,
          email,
          username,
          avatar_url: avatarUrl,
          auth_provider: provider,
          provider_id: authUser.id,
          role: 'user',
          is_admin: false,
          profile_completed: false,
        }, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user:', insertError);
        // 생성 실패해도 기본 정보 반환
        return NextResponse.json({
          user: {
            id: authUser.id,
            email,
            username,
            avatar_url: avatarUrl,
            auth_provider: provider,
            role: 'user',
            is_admin: false,
            profile_completed: false,
            created_at: authUser.created_at,
          },
        });
      }

      return NextResponse.json({ user: newUser });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
