import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

// GET /api/submissions/download?file_path=xxx - 제출 파일 다운로드 URL
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file_path');

    if (!filePath) {
      return NextResponse.json({ error: '파일 경로가 필요합니다.' }, { status: 400 });
    }

    // Path traversal 방어: ../ 포함 차단 및 형식 검증
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: '유효하지 않은 파일 경로입니다.' }, { status: 400 });
    }

    // 본인 파일인지 확인
    const { data: submission, error: queryError } = await supabaseAdmin
      .from('submissions')
      .select('user_id')
      .eq('file_path', filePath)
      .single();

    if (queryError || !submission) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (submission.user_id !== session.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // Signed URL 생성 (5분 유효)
    const { data, error } = await supabaseAdmin.storage
      .from('submissions')
      .createSignedUrl(filePath, 300);

    if (error || !data) {
      console.error('Signed URL 생성 실패:', error);
      return NextResponse.json({ error: '다운로드 URL 생성에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
