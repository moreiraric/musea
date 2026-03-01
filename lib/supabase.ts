import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}.`);
  }
  return value;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars for NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

export function createSupabaseServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey),
    {
    auth: { persistSession: false },
    },
  );
}

export function createSupabaseServerAdminClient() {
  if (!supabaseServiceRoleKey) {
    return createSupabaseServerClient();
  }
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    supabaseServiceRoleKey,
    {
      auth: { persistSession: false },
    },
  );
}
