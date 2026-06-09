import { type SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks Supabase *server-side* (via getUser — never cache) whether the
 * current user's email is confirmed. Safe to call from both web and mobile.
 */
export async function checkEmailConfirmed(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return false
  return !!user.email_confirmed_at
}
