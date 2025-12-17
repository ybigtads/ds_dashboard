import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/tasks/[slug]/board/[postId] - 게시글 상세
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;

    // 게시글 조회
    const { data: post, error } = await supabaseAdmin
      .from('board_posts')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Board post fetch error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// PUT /api/tasks/[slug]/board/[postId] - 게시글 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, is_pinned } = body;

    // 기존 게시글 확인
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('board_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingPost.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_pinned !== undefined && isAdmin) updateData.is_pinned = is_pinned;

    const { data: post, error } = await supabaseAdmin
      .from('board_posts')
      .update(updateData)
      .eq('id', postId)
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Board post update error:', error);
      return NextResponse.json({ error: '게시글 수정에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Board post update error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// DELETE /api/tasks/[slug]/board/[postId] - 게시글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 기존 게시글 확인
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from('board_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 권한 확인 (작성자 또는 관리자)
    const isAuthor = existingPost.author_id === session.id;
    const isAdmin = session.role === 'admin' || session.is_admin;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('board_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Board post delete error:', error);
      return NextResponse.json({ error: '게시글 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Board post delete error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
