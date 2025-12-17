import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/docs - 문서 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabaseAdmin
      .from('docs')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (category && category !== '전체') {
      query = query.eq('category', category);
    }

    const { data: docs, error } = await query;

    if (error) {
      console.error('Docs fetch error:', error);
      return NextResponse.json({ error: '문서를 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(docs || []);
  } catch (error) {
    console.error('Docs error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST /api/docs - 문서 작성
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
    }

    // slug 생성
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const timestamp = Date.now().toString(36);
    const slug = `${baseSlug}-${timestamp}`;

    // 문서 생성
    const { data: doc, error } = await supabaseAdmin
      .from('docs')
      .insert({
        author_id: session.id,
        title,
        slug,
        content,
        category: category || null
      })
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Doc create error:', error);
      return NextResponse.json({ error: '문서 작성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Doc create error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
