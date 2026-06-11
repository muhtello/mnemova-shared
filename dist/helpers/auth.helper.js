"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.checkEmailConfirmed = checkEmailConfirmed;
exports.resendConfirmationEmail = resendConfirmationEmail;
/**
 * Validates email format: requires local part, @, domain, and a TLD of 2+ chars.
 * Catches missing @, missing domain, missing TLD (e.g. "user@example" or "userexample.com").
 */
function validateEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}
/**
 * Checks Supabase *server-side* (via getUser — never cache) whether the
 * current user's email is confirmed. Safe to call from both web and mobile.
 */
async function checkEmailConfirmed(supabase) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user)
        return false;
    return !!user.email_confirmed_at;
}
/**
 * Resends the signup confirmation email. Pass the platform-specific redirectTo
 * so the link opens the correct destination (app deep link in mobile, HTTPS in web).
 */
async function resendConfirmationEmail(supabase, email, redirectTo) {
    var _a;
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
    });
    return { error: (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : null };
}
