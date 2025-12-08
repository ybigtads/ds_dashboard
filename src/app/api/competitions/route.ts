import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const { data: competitions, error } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch competitions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, start_date, end_date, evaluation_metric } = body;

    if (!title || !start_date || !end_date || !evaluation_metric) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: competition, error } = await supabaseAdmin
      .from('competitions')
      .insert({
        title,
        description,
        start_date,
        end_date,
        evaluation_metric,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating competition:', error);
      return NextResponse.json(
        { error: 'Failed to create competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competition }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
