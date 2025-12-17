import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/tasks/[slug]/questions/[questionId] - 질문 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;

    // 질문 조회
    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .eq('id', questionId)
      .single();

    if (error || !question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Question fetch error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT /api/tasks/[slug]/questions/[questionId] - 질문 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, is_resolved } = body;

    // 기존 질문 확인
    const { data: existingQuestion, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('author_id')
      .eq('id', questionId)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingQuestion.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_resolved !== undefined && isAuthor) updateData.is_resolved = is_resolved;

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Question update error:', error);
      return NextResponse.json({ error: '질문 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Question update error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE /api/tasks/[slug]/questions/[questionId] - 질문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 기존 질문 확인
    const { data: existingQuestion, error: fetchError } = await supabaseAdmin
      .from('questions')
      .select('author_id')
      .eq('id', questionId)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingQuestion.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Question delete error:', error);
      return NextResponse.json({ error: '질문 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question delete error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
