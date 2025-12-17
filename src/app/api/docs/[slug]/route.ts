import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/docs/[slug] - 문서 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 문서 조회
    const { data: doc, error } = await supabaseAdmin
      .from('docs')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .eq('slug', slug)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Doc fetch error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT /api/docs/[slug] - 문서 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, is_published } = body;

    // 기존 문서 확인
    const { data: existingDoc, error: fetchError } = await supabaseAdmin
      .from('docs')
      .select('author_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingDoc.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (is_published !== undefined) updateData.is_published = is_published;

    const { data: doc, error } = await supabaseAdmin
      .from('docs')
      .update(updateData)
      .eq('slug', slug)
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Doc update error:', error);
      return NextResponse.json({ error: '문서 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('Doc update error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE /api/docs/[slug] - 문서 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 기존 문서 확인
    const { data: existingDoc, error: fetchError } = await supabaseAdmin
      .from('docs')
      .select('author_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingDoc.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('docs')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Doc delete error:', error);
      return NextResponse.json({ error: '문서 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Doc delete error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
