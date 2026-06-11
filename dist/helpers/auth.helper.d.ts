import { type SupabaseClient } from '@supabase/supabase-js';
/**
 * Validates email format: requires local part, @, domain, and a TLD of 2+ chars.
 * Catches missing @, missing domain, missing TLD (e.g. "user@example" or "userexample.com").
 */
export declare function validateEmail(email: string): boolean;
/**
 * Checks Supabase *server-side* (via getUser — never cache) whether the
 * current user's email is confirmed. Safe to call from both web and mobile.
 */
export declare function checkEmailConfirmed(supabase: SupabaseClient): Promise<boolean>;
/**
 * Resends the signup confirmation email. Pass the platform-specific redirectTo
 * so the link opens the correct destination (app deep link in mobile, HTTPS in web).
 */
export declare function resendConfirmationEmail(supabase: SupabaseClient, email: string, redirectTo: string): Promise<{
    error: string | null;
}>;
