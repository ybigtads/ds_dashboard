import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: competition, error } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ competition });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, start_date, end_date, evaluation_metric } = body;

    const { data: competition, error } = await supabaseAdmin
      .from('competitions')
      .update({
        title,
        description,
        start_date,
        end_date,
        evaluation_metric,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating competition:', error);
      return NextResponse.json(
        { error: 'Failed to update competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competition });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('competitions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting competition:', error);
      return NextResponse.json(
        { error: 'Failed to delete competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
