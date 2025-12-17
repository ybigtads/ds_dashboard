import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession, requireTaskEditAccess, requireAdmin } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

interface Props {
  params: Promise<{ slug: string }>;
}

// 과제 상세 조회
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    const session = await getSession();

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // 비공개 과제는 로그인한 사용자만 조회 가능
    if (!task.is_published && !session) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 과제 수정
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;

    // 먼저 과제 조회
    const { data: existingTask } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Creator(본인 과제) 또는 Admin만 수정 가능
    await requireTaskEditAccess(existingTask.id);

    const body = await request.json();
    const {
      title,
      description,
      start_date,
      end_date,
      evaluation_metric,
      data_description,
      data_files,
      data_download_url,
      code_description,
      code_git_url,
      code_vessl_guide,
      is_published,
      max_submissions_per_day,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (evaluation_metric !== undefined) updateData.evaluation_metric = evaluation_metric;
    if (data_description !== undefined) updateData.data_description = data_description;
    if (data_files !== undefined) updateData.data_files = data_files;
    if (data_download_url !== undefined) updateData.data_download_url = data_download_url;
    if (code_description !== undefined) updateData.code_description = code_description;
    if (code_git_url !== undefined) updateData.code_git_url = code_git_url;
    if (code_vessl_guide !== undefined) updateData.code_vessl_guide = code_vessl_guide;
    if (is_published !== undefined) updateData.is_published = is_published;
    if (max_submissions_per_day !== undefined) updateData.max_submissions_per_day = max_submissions_per_day;

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.includes('Access denied') || message.includes('Required role')) {
      return NextResponse.json({ error: 'Access denied for this task' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 과제 삭제 (Admin만)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;

    // Admin만 삭제 가능
    await requireAdmin();

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.includes('Admin access')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
