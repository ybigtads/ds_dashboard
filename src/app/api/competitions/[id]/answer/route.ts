import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = `${id}/answer.csv`;
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

    // Update competition with answer file path
    const { error: updateError } = await supabaseAdmin
      .from('competitions')
      .update({ answer_file_path: fileName })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating competition:', updateError);
      return NextResponse.json(
        { error: 'Failed to update competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, path: fileName });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
