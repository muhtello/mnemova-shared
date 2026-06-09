import { type SupabaseClient } from '@supabase/supabase-js'

/**
 * Validates email format: requires local part, @, domain, and a TLD of 2+ chars.
 * Catches missing @, missing domain, missing TLD (e.g. "user@example" or "userexample.com").
 */
export function validateEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())
}

/**
 * Checks Supabase *server-side* (via getUser — never cache) whether the
 * current user's email is confirmed. Safe to call from both web and mobile.
 */
export async function checkEmailConfirmed(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return false
  return !!user.email_confirmed_at
}

/**
 * Resends the signup confirmation email. Pass the platform-specific redirectTo
 * so the link opens the correct destination (app deep link in mobile, HTTPS in web).
 */
export async function resendConfirmationEmail(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: redirectTo },
  })
  return { error: error?.message ?? null }
}
