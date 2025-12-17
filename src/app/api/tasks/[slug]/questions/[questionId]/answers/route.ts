import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/tasks/[slug]/questions/[questionId]/answers - 답변 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  try {
    const { questionId } = await params;

    // 답변 조회
    const { data: answers, error } = await supabaseAdmin
      .from('question_answers')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url, role)
      `)
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Answers fetch error:', error);
      return NextResponse.json({ error: '답변을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(answers || []);
  } catch (error) {
    console.error('Answers error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST /api/tasks/[slug]/questions/[questionId]/answers - 답변 작성
export async function POST(
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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    // 질문 존재 확인
    const { data: question, error: questionError } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 답변 생성
    const { data: answer, error } = await supabaseAdmin
      .from('question_answers')
      .insert({
        question_id: questionId,
        author_id: session.id,
        content
      })
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url, role)
      `)
      .single();

    if (error) {
      console.error('Answer create error:', error);
      return NextResponse.json({ error: '답변 작성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error('Answer create error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
