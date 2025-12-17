import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서버 컴포넌트/라우트 핸들러용 클라이언트 (쿠키 기반 인증)
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서는 쿠키 설정 불가 - 무시
        }
      },
    },
  });
}

// Admin 클라이언트 (서비스 키 사용, RLS 우회)
function createSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing Supabase server environment variables. ` +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'set' : 'missing'}, ` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'set' : 'missing'}.`
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const supabaseAdmin = createSupabaseAdmin();
