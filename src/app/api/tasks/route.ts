import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession, requireCreatorOrAbove } from '@/lib/auth';
import { assignTaskCreator } from '@/lib/permissions';
import { Task } from '@/types';

// 과제 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // 로그인하지 않은 사용자는 published 과제만 조회 가능
    const isAuthenticated = !!session;

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // 비로그인 사용자는 published 과제만
    if (!isAuthenticated) {
      query = query.eq('is_published', true);
    }

    // 쿼리 파라미터로 필터링
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, active, ended
    const published = searchParams.get('published');

    if (published === 'true') {
      query = query.eq('is_published', true);
    } else if (published === 'false' && isAuthenticated) {
      query = query.eq('is_published', false);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // 상태 필터링 (클라이언트 사이드에서 처리)
    let filteredTasks = tasks || [];
    const now = new Date();

    if (status) {
      filteredTasks = filteredTasks.filter(task => {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.end_date);

        switch (status) {
          case 'upcoming':
            return now < startDate;
          case 'active':
            return now >= startDate && now <= endDate;
          case 'ended':
            return now > endDate;
          default:
            return true;
        }
      });
    }

    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 과제 생성
export async function POST(request: NextRequest) {
  try {
    // Creator 또는 Admin만 과제 생성 가능
    const session = await requireCreatorOrAbove();

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

    if (!title || !start_date || !end_date || !evaluation_metric) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_date, end_date, evaluation_metric' },
        { status: 400 }
      );
    }

    // slug 생성 (title 기반)
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // 중복 체크 및 유니크 slug 생성
    const { data: existingSlugs } = await supabaseAdmin
      .from('tasks')
      .select('slug')
      .like('slug', `${baseSlug}%`);

    let slug = baseSlug;
    if (existingSlugs && existingSlugs.length > 0) {
      const slugSet = new Set(existingSlugs.map(s => s.slug));
      let counter = 1;
      while (slugSet.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const taskData: Partial<Task> = {
      title,
      slug,
      description: description || '',
      start_date,
      end_date,
      evaluation_metric,
      data_description: data_description || null,
      data_files: data_files || [],
      data_download_url: data_download_url || null,
      code_description: code_description || null,
      code_git_url: code_git_url || null,
      code_vessl_guide: code_vessl_guide || null,
      is_published: is_published ?? true,
      max_submissions_per_day: max_submissions_per_day ?? 5,
      created_by: session.id,
    };

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // 과제 생성자에게 자동으로 Creator 권한 부여
    await assignTaskCreator(task.id, session.id, session.id);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message.includes('Required role')) {
      return NextResponse.json({ error: 'Creator or Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
