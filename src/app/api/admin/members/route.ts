import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/admin/members - 전체 사용자 목록 (Admin 전용)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const cohort = searchParams.get('cohort');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (cohort && cohort !== 'all') {
      query = query.eq('cohort', parseInt(cohort));
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Admin members fetch error:', error);
      return NextResponse.json({ error: '사용자를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error('Admin members error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.includes('Admin access')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PATCH /api/admin/members - 사용자 역할 변경 (Admin 전용)
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { user_id, role } = body as { user_id: string; role: UserRole };

    if (!user_id || !role) {
      return NextResponse.json({ error: 'user_id와 role이 필요합니다.' }, { status: 400 });
    }

    if (!['user', 'creator', 'admin'].includes(role)) {
      return NextResponse.json({ error: '올바르지 않은 역할입니다.' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        role,
        is_admin: role === 'admin',
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Role update error:', error);
      return NextResponse.json({ error: '역할 변경에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin members error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.includes('Admin access')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
