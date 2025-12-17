import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireTaskEditAccess } from '@/lib/auth';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;

    // 먼저 task 조회
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Creator(본인 과제) 또는 Admin만 정답 파일 업로드 가능
    await requireTaskEditAccess(task.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = `${task.id}/answer.csv`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('answers')
      .upload(fileName, fileBuffer, {
        contentType: 'text/csv',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading answer file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Update task with answer file path
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({ answer_file_path: fileName })
      .eq('id', task.id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, path: fileName });
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
