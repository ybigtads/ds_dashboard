import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/members - 구성원 목록
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // 로그인한 사용자만 접근 가능
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cohort = searchParams.get('cohort');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select('id, username, name, cohort, avatar_url, role, is_admin, profile_completed')
      .eq('profile_completed', true)
      .order('cohort', { ascending: false })
      .order('name', { ascending: true });

    if (cohort && cohort !== 'all') {
      query = query.eq('cohort', parseInt(cohort));
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data: members, error } = await query;

    if (error) {
      console.error('Members fetch error:', error);
      return NextResponse.json({ error: '구성원을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(members || []);
  } catch (error) {
    console.error('Members error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
