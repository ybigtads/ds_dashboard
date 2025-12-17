import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// PUT /api/profile - 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { cohort, name } = body;

    // 유효성 검사
    if (!cohort || !name?.trim()) {
      return NextResponse.json({ error: '기수와 이름을 모두 입력해주세요.' }, { status: 400 });
    }

    const cohortNum = parseInt(cohort);
    if (isNaN(cohortNum) || cohortNum < 1 || cohortNum > 100) {
      return NextResponse.json({ error: '올바른 기수를 입력해주세요. (1-100)' }, { status: 400 });
    }

    // 프로필 업데이트
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        cohort: cohortNum,
        name: name.trim(),
        profile_completed: true,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: '프로필 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET /api/profile - 내 프로필 조회
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: '프로필을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
