import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/tasks/[slug]/questions - 질문 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Task 조회
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '과제를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 질문 목록 조회 (답변 수 포함)
    const { data: questions, error } = await supabaseAdmin
      .from('questions')
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url),
        answers:question_answers(count)
      `)
      .eq('task_id', task.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Questions fetch error:', error);
      return NextResponse.json({ error: '질문을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    // 답변 수 변환
    const questionsWithCount = questions?.map(question => ({
      ...question,
      answers_count: question.answers?.[0]?.count || 0,
      answers: undefined
    }));

    return NextResponse.json(questionsWithCount || []);
  } catch (error) {
    console.error('Questions error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// POST /api/tasks/[slug]/questions - 질문 작성
export async function POST(
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
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
    }

    // Task 조회
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '과제를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 질문 생성
    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({
        task_id: task.id,
        author_id: session.id,
        title,
        content
      })
      .select(`
        *,
        author:users!author_id(id, username, name, cohort, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Question create error:', error);
      return NextResponse.json({ error: '질문 작성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Question create error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
