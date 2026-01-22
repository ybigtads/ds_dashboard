import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/submissions - 내 제출 목록
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const taskSlug = searchParams.get('task_slug');

    let query = supabaseAdmin
      .from('submissions')
      .select(`
        *,
        task:tasks!task_id(id, title, slug, evaluation_metric)
      `)
      .eq('user_id', session.id)
      .order('submitted_at', { ascending: false });

    // task_slug로 필터링 (task_id보다 우선)
    if (taskSlug) {
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .eq('slug', taskSlug)
        .single();

      if (task) {
        query = query.eq('task_id', task.id);
      }
    } else if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Submissions fetch error:', error);
      return NextResponse.json({ error: '제출 이력을 불러오는데 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(submissions || []);
  } catch (error) {
    console.error('Submissions error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
