import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/tasks/[slug]/board/[postId]/comments - 댓글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const { postId } = await params;

    // 댓글 조회 (대댓글 포함)
    const { data: comments, error } = await supabaseAdmin
      .from('board_comments')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json({ error: '댓글을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 대댓글 구조로 변환
    const rootComments = comments?.filter(c => !c.parent_id) || [];
    const replies = comments?.filter(c => c.parent_id) || [];

    const commentsWithReplies = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }));

    return NextResponse.json(commentsWithReplies);
  } catch (error) {
    console.error('Comments error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST /api/tasks/[slug]/board/[postId]/comments - 댓글 작성
export async function POST(
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
    const { content, parent_id } = body;

    if (!content) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabaseAdmin
      .from('board_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 대댓글인 경우 부모 댓글 확인
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from('board_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('post_id', postId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json({ error: '부모 댓글을 찾을 수 없습니다.' }, { status: 404 });
      }
    }

    // 댓글 생성
    const { data: comment, error } = await supabaseAdmin
      .from('board_comments')
      .insert({
        post_id: postId,
        author_id: session.id,
        content,
        parent_id: parent_id || null
      })
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Comment create error:', error);
      return NextResponse.json({ error: '댓글 작성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment create error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
