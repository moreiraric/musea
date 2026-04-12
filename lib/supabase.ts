// Creates server-side Supabase clients for regular and admin access.
// These helpers centralize env validation so route code stays lean.

import { createClient } from "@supabase/supabase-js";

// === ENVIRONMENT LOOKUP ===

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Fails fast when a required credential is missing.
function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}.`);
  }
  return value;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars for NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

// Builds the standard server client used by read-only or user-scoped code.
export function createSupabaseServerClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseAnonKey),
    {
    auth: { persistSession: false },
    },
  );
}

// Falls back to the regular server client when no service role key is configured.
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
