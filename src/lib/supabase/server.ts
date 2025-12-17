import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing Supabase server environment variables. ` +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'set' : 'missing'}, ` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'set' : 'missing'}. ` +
      `Please check your .env.local file.`
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const supabaseAdmin = createSupabaseAdmin();
